import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import MapContents from '../control/MapContents';
import Point from '../../SITNA/feature/Point';
import Marker from '../../SITNA/feature/Marker';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';
import Circle from '../../SITNA/feature/Circle';
import Raster from '../../SITNA/layer/Raster';
import Vector from '../../SITNA/layer/Vector';
import Draw from '../control/Draw';
import Modify from '../control/Modify';
import ThreeDDraw from './ThreeDDraw';
import mainTemplate from '../templates/tc-ctl-3d.mjs';
import overlayTemplate from '../templates/tc-view-3d-overlay.mjs';
import camControlsTemplate from '../templates/tc-view-3d-cm-ctls.mjs';

TC.view = TC.view || {};
TC.control = TC.control || {};
TC.control.MapContents = MapContents;

Consts.CESIUMNS = 'cesium';

const ThreeD = (function (namespace, signature, factory) {
    return namespace[signature] = factory();
})(TC.view, "ThreeD", function () {

    const hasOwnProperty = Object.prototype.hasOwnProperty;

    var viewProto = {
        VIEWNAME: "ThreeD",
        CLASS: 'tc-view-3d',
        Consts: {
            BLANK_BASE: 'blank',
            DEFAULT_TILE_SIZE: 256
        },
        classes: {
            MAP3D: 'tc-map-3d',
            LOADING: 'tc-loading',
            CAMERACTRARROWDISABLED: 'tc-disabled-arrow',
            FOCUS: 'focus',
            HIGHLIGHTED: 'tc-highlighted',
            OUTFOCUS: 'tc-outfocus'
        },
        allowedControls: [],
        template: {},

        viewer: null,
        mapView: null,
        terrainProvider: null,

        getLocaleString: function (key, texts) {
            var self = this;
            var locale = self.map ? self.map.options.locale : TC.Cfg.locale;
            return Util.getLocaleString(locale, key, texts);
        },

        getRenderedHtml: function (templateId, data, callback) {
            return TC.Control.prototype.getRenderedHtml.call(this, templateId, data, callback);
        }
    };

    Consts.classes.THREED = Consts.classes.THREED || "tc-3d";
    Consts.classes.THREED_HIDDEN = Consts.classes.THREED_HIDDEN || "tc-3d-hidden";
    Consts.event.TERRAINLOADED = Consts.event.TERRAINLOADED || "terrainloaded.tc.threed";
    Consts.event.TERRAINRECEIVING = Consts.event.TERRAINRECEIVING || "terrainreceiving.tc.threed";
    Consts.event.TERRAIN404 = Consts.event.TERRAIN404 || "terrain404.tc.threed";
    Consts.event.THREED_DRAG = Consts.event.THREED_DRAG || "drag.tc.threed";

    viewProto.template[viewProto.CLASS] = mainTemplate;
    viewProto.template[viewProto.CLASS + '-overlay'] = overlayTemplate;
    viewProto.template[viewProto.CLASS + '-cm-ctls'] = camControlsTemplate;

    const MapView = function (map, parent) {
        var self = this;
        self.map = map;
        self.parent = parent;

        Promise.resolve(self.map.getViewHTML()).then(function (html) {
            self.viewHTML = html;
        }.bind(self));

        self.metersPerUnit = map.getMetersPerUnit();

        self.maxResolution = null;

        //flacunza: modificamos TC.Map.setCenter para que se haga desde la vista 3D cuando está activa
        //así evitamos parpadeos en el mapa de situación
        self._oldMapSetCenter = map.setCenter;
        map.setCenter = function (coords, options) {
            if (map.on3DView) {
                map.view3D.flyToMapCoordinates.call(parent, coords);
            }
            else {
                self._oldMapSetCenter.call(map, coords, options);
            }
        };
    };
    MapView.prototype.getCenter = function () {
        return this.map.getCenter();
    };
    MapView.prototype.getExtent = function () {
        return this.map.getExtent();
    };
    MapView.prototype.getResolution = function () {
        return this.map.getResolution();
    };
    MapView.prototype.getRotation = function () {
        return this.map.getRotation();
    };
    MapView.prototype.getMaxResolution = function () {
        if (this.maxResolution)
            return this.maxResolution;

        if (this.map.getResolutions() !== null)
            this.maxResolution = this.map.getResolutions()[0];
        else {
            var extent = this.map.options.baselayerExtent;
            this.maxResolution = (extent[2] - extent[0]) / this.parent.Consts.DEFAULT_TILE_SIZE;
        }

        return this.maxResolution;
    };
    MapView.prototype.getPixelFromCoordinate = function (coords) {
        return this.map.getPixelFromCoordinate(coords);
    };
    MapView.prototype.setCenter = function (center) {
        this._oldMapSetCenter.call(this.map, center);
    };
    MapView.prototype.setExtent = function (extent) {
        this.map.setExtent(extent);
    };
    MapView.prototype.setResolution = function (resolution) {
        this.map.setResolution(resolution);
    };
    MapView.prototype.setRotation = function (rotation) {
        this.map.setRotation(rotation);
    };

    //  Funciones compatibilidad CRS
    const isCompatible = function (layer, crs) {
        return layer.type === Consts.layerType.WMTS ?
            layer.wrap.getCompatibleMatrixSets(crs).length > 0 :
            layer.isCompatible(crs);
    };

    // Funciones para cálculo de FOV
    const getFarCoords = function (origin, nearPoint) {
        var radius = 1000000; // 1000 km
        var dx = nearPoint[0] - origin[0];
        var dy = nearPoint[1] - origin[1];
        var angle = Math.atan(dy / dx);
        // Math.atan solo da resultados entre -90º y 90º, si estamos mirando al hemisferio oeste hay que sumar 180º al ángulo
        if (dx < 0) {
            angle = angle + Math.PI;
        }
        return [origin[0] + radius * Math.cos(angle), origin[1] + radius * Math.sin(angle)];
    };

    const distanceSquared = function (p1, p2) {
        var dx = p2[0] - p1[0];
        var dy = p2[1] - p1[1];
        return dx * dx + dy * dy;
    };

    const getFarMapCoords = function (obj) {
        // Calculamos puntos lejanos cuando no los tenemos (cuando estamos mirando al horizonte).
        // Cogemos un punto proyectado desde la esquina inferior del canvas, 
        // cogemos un segundo punto en el lateral del canvas inmediatamente por encima 
        // y prologamos la línea que pasa por ambos puntos proyectados.
        var self = this;
        obj = obj || {};
        if (obj.nearMapCoords) {
            var nextPixel = obj.bottomPixel.clone();
            nextPixel.y = Math.round(nextPixel.y * 9 / 10);
            var nextCoords = pickMapCoords.call(self, nextPixel);
            if (nextCoords) {
                // Ordenamos la dupla por distancia, porque si estamos mirando desde dentro de un monte 
                // el punto que se supone que es el más lejano en realidad está más cerca.
                var coordsArray = [obj.nearMapCoords, nextCoords].sort(function (a, b) {
                    return distanceSquared(obj.cameraPosition, a) - distanceSquared(obj.cameraPosition, b);
                });
                return getFarCoords.apply(this, coordsArray);
            }
        }
        return null;
    };

    const pickMapCoords = function (pixel, crs) {
        var self = this;
        var pickPoint = pickOnTerrainOrEllipsoid(self.viewer.scene, pixel);
        if (pickPoint) {
            pickPoint = cesium.Cartographic.fromCartesian(pickPoint);
            const secondaryCRS = crs || self.view3D.view2DCRS
            if (self.view3D.crs !== secondaryCRS) {
                return Util.reproject([cesium.Math.toDegrees(pickPoint.longitude), cesium.Math.toDegrees(pickPoint.latitude)], self.view3D.crs, secondaryCRS);
            } else {
                return [cesium.Math.toDegrees(pickPoint.longitude), cesium.Math.toDegrees(pickPoint.latitude)];
            }
        }
        return null;
    }

    // Funciones utilidades cámara
    const calcDistanceForResolution = function (resolution, latitude) {
        var self = this;

        var fovy = self.viewer.camera.frustum.fovy;
        var visibleMapUnits = resolution * self.mapView.viewHTML.getBoundingClientRect().height;
        var relativeCircumference = Math.cos(Math.abs(latitude));
        var visibleMeters = visibleMapUnits * self.mapView.metersPerUnit * relativeCircumference;

        return (visibleMeters / 2) / Math.tan(fovy / 2);
    };

    const calcResolutionForDistance = function (distance, latitude) {
        var self = this;

        var canvas = self.viewer.scene.canvas;
        var fovy = self.viewer.camera.frustum.fovy;

        var visibleMeters = 2 * distance * Math.tan(fovy / 2);
        var relativeCircumference = Math.cos(Math.abs(latitude));
        var visibleMapUnits = visibleMeters / self.mapView.metersPerUnit / relativeCircumference;
        var resolution = visibleMapUnits / canvas.clientHeight;

        // validamos que la resolución calculada esté disponible en el array de resoluciones disponibles
        // si no contamos con un array de resoluciones lo calculamos
        var resolutions = self.map.getResolutions();
        if (resolutions === null) {
            resolutions = new Array(22);
            for (var i = 0, ii = resolutions.length; i < ii; ++i) {
                resolutions[i] = self.mapView.getMaxResolution() / Math.pow(2, i);
            }
        }

        // obtenemos la resolución más próxima a la calculada
        for (var j = 0; j < resolutions.length; j++) {
            if (resolutions[j] < Math.abs(resolution)) {
                resolution = resolutions[j - 1];
                break;
            } else if (resolutions[j] === Math.abs(resolution)) {
                resolution = resolutions[j];
                break;
            } else if (j === resolutions.length - 1) {
                resolution = resolutions[j];
            }
        }

        return resolution;
    };

    const rotateAroundAxis = function (camera, angle, axis, transform, opt_options) {
        var clamp = cesium.Math.clamp;
        var defaultValue = cesium.defaultValue;

        var options = opt_options || {};
        var duration = defaultValue(options.duration, 500); // ms

        var linear = function (a) {
            return a
        };
        var easing = defaultValue(options.easing, linear);
        var callback = options.callback;

        var start;
        var lastProgress = 0;
        var oldTransform = new cesium.Matrix4();

        return new Promise(function (resolve, _reject) {

            function animation(timestamp) {
                if (!start)
                    start = timestamp;

                var progress = easing(clamp((timestamp - start) / duration, 0, 1));

                camera.transform.clone(oldTransform);
                var stepAngle = (progress - lastProgress) * angle;
                lastProgress = progress;

                camera.lookAtTransform(transform);
                camera.rotate(axis, stepAngle);
                camera.lookAtTransform(oldTransform);

                if (progress < 1) {
                    requestAnimationFrame(animation);
                } else {
                    if (callback) {
                        callback();
                    }
                    resolve();
                }

            }

            requestAnimationFrame(animation);
        });
    };

    const pickOnTerrainOrEllipsoid = function (scene, pixel) {
        var ray = scene.camera.getPickRay(pixel);
        var target = scene.globe.pick(ray, scene);
        return target || scene.camera.pickEllipsoid(pixel);
    };

    const pickCenterPoint = function (scene) {
        var canvas = scene.canvas;
        var center = new cesium.Cartesian2(
            canvas.clientWidth / 2,
            canvas.clientHeight / 2);
        return pickOnTerrainOrEllipsoid(scene, center);
    };

    const pickBottomPoint = function (scene) {
        var canvas = scene.canvas;
        var bottom = new cesium.Cartesian2(
            canvas.clientWidth / 2, canvas.clientHeight);
        return pickOnTerrainOrEllipsoid(scene, bottom);
    };

    const bottomFovRay = function (scene) {
        var camera = scene.camera;
        var fovy2 = camera.frustum.fovy / 2;
        var direction = camera.direction;
        var rotation = cesium.Quaternion.fromAxisAngle(camera.right, fovy2);
        var matrix = cesium.Matrix3.fromQuaternion(rotation);
        var vector = new cesium.Cartesian3();
        cesium.Matrix3.multiplyByVector(matrix, direction, vector);
        return new cesium.Ray(camera.position, vector);
    };

    const setHeadingUsingBottomCenter = function (scene, heading, bottomCenter, opt_options) {
        var camera = scene.camera;
        // Compute the camera position to zenith quaternion
        var angleToZenith = computeAngleToZenith(scene, bottomCenter);
        var axis = camera.right;
        var quaternion = cesium.Quaternion.fromAxisAngle(axis, angleToZenith);
        var rotation = cesium.Matrix3.fromQuaternion(quaternion);

        // Get the zenith point from the rotation of the position vector
        var vector = new cesium.Cartesian3();
        cesium.Cartesian3.subtract(camera.position, bottomCenter, vector);
        var zenith = new cesium.Cartesian3();
        cesium.Matrix3.multiplyByVector(rotation, vector, zenith);
        cesium.Cartesian3.add(zenith, bottomCenter, zenith);

        // Actually rotate around the zenith normal
        var transform = cesium.Matrix4.fromTranslation(zenith);
        rotateAroundAxis(camera, heading, zenith, transform, opt_options);
    };

    const signedAngleBetween = function (first, second, normal) {
        // We are using the dot for the angle.
        // Then the cross and the dot for the sign.
        var a = new cesium.Cartesian3();
        var b = new cesium.Cartesian3();
        var c = new cesium.Cartesian3();
        cesium.Cartesian3.normalize(first, a);
        cesium.Cartesian3.normalize(second, b);
        cesium.Cartesian3.cross(a, b, c);

        var cosine = cesium.Cartesian3.dot(a, b);
        var sine = cesium.Cartesian3.magnitude(c);

        // Sign of the vector product and the orientation normal
        var sign = cesium.Cartesian3.dot(normal, c);
        var angle = Math.atan2(sine, cosine);
        return sign >= 0 ? angle : -angle;
    };

    const computeAngleToZenith = function (scene, pivot) {
        // This angle is the sum of the angles 'fy' and 'a', which are defined
        // using the pivot point and its surface normal.
        //        Zenith |    camera
        //           \   |   /
        //            \fy|  /
        //             \ |a/
        //              \|/pivot
        var camera = scene.camera;
        var fy = camera.frustum.fovy / 2;
        var ray = bottomFovRay(scene);
        var direction = cesium.Cartesian3.clone(ray.direction);
        cesium.Cartesian3.negate(direction, direction);

        var normal = new cesium.Cartesian3();
        cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(pivot, normal);

        var left = new cesium.Cartesian3();
        cesium.Cartesian3.negate(camera.right, left);

        var a = signedAngleBetween(normal, direction, left);
        return a + fy;
    };

    //const computeSignedTiltAngleOnGlobe = function (scene) {
    //    var camera = scene.camera;
    //    var ray = new cesium.Ray(camera.position, camera.direction);
    //    var target = scene.globe.pick(ray, scene);

    //    if (!target) {
    //        // no tiles in the area were loaded?
    //        var ellipsoid = cesium.Ellipsoid.WGS84;
    //        var obj = cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);
    //        if (obj) {
    //            target = cesium.Ray.getPoint(ray, obj.start);
    //        }
    //    }

    //    if (!target) {
    //        return undefined;
    //    }

    //    var normal = new cesium.Cartesian3();
    //    cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(target, normal);

    //    var angleBetween = signedAngleBetween;
    //    var angle = angleBetween(camera.direction, normal, camera.right) - Math.PI;
    //    return cesium.Math.convertLongitudeRange(angle);
    //};

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

            cesium.when(self.viewer.terrainProvider.sampleTerrainMostDetailed(positions), function (updatedPositions) {
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
                        "outlineWidth": pointStyle.strokeWidth
                    }
                }];

                resolve({ czml: czml, totalDistance: totalDistance, coordinates2D: coordinates });
            });
        });
    };

    const CameraControls = function (parent) {
        var self = this;

        self.parent = parent;

        var outHandler = function (_e) {
            var self = this;

            self.isFocusingCameraCtrls = false;
        };
        var inHandler = function () {
            var self = this;

            self.isFocusingCameraCtrls = true;
            self.lastFocused = performance.now();

            if (self.div.classList.contains(self.parent.classes.OUTFOCUS)) {
                self.div.classList.remove(self.parent.classes.OUTFOCUS);
                self.tiltIndicatorOuterCircle.classList.remove(self.parent.classes.OUTFOCUS);
                self.tiltIndicatorOuterShellCircle.classList.remove(self.parent.classes.OUTFOCUS);
                self.rotateIndicatorOuterCircle.classList.remove(self.parent.classes.OUTFOCUS);
                self.rotateIndicatorOuterShellCircle.classList.remove(self.parent.classes.OUTFOCUS);
            }
        };

        var moveStartHandler = function () {
            var self = this;
            self.moving = true;
        };
        var moveEndHandler = function () {
            var self = this;
            self.moving = false;
            self.parent.map.trigger(Consts.event.CAMERACHANGE, { position: self.parent.view3D.getCameraData() });
        };
        var postRenderHandler = function () {
            var self = this;
            var view = self.parent;

            if (self.parent.view3D.isLoadingTiles.call(self.parent))
                self.customCollisionDetection();

            var camera = self.getCamera();
            var position = camera.positionCartographic;

            if (self.moving) {

                cssRotate(self.tiltIndicator, camera.pitch);
                cssRotate(self.rotateIndicator, -camera.heading);

                self.disableRotate();
                self.disableTilt(5);

                if (view.view3D.crs !== view.view3D.view2DCRS) {
                    self._coordsXY = Util.reproject([cesium.Math.toDegrees(position.longitude), cesium.Math.toDegrees(position.latitude)], view.view3D.crs, view.view3D.view2DCRS);
                } else {
                    self._coordsXY = [cesium.Math.toDegrees(position.longitude), cesium.Math.toDegrees(position.latitude)];
                }

                view.mapView.setCenter(self._coordsXY);
                view.mapView.setResolution(calcResolutionForDistance.call(view, position.height, position.latitude));

                //view.mapView.setRotation(-camera.heading);
            }

            // flacunza: calculamos el polígono de FOV para dibujar en el mapa de situación
            // Lo calculamos aunque no nos estemos moviendo porque el terreno puede estar cargándose
            if (self._coordsXY) {
                view._ovMap = view._ovMap || view.map.getControlsByClass('TC.control.OverviewMap')[0];
                if (view._ovMap) {
                    view._ovMap.renderPromise().then(function () {

                        view._ovMap.wrap.draw3DCamera({ position: self._coordsXY, heading: camera.heading, fov: self.parent.view3D.getFovCoords() });
                    });
                }
            }

        };
        var cssRotate = function (element, angle) {
            var coord = element.getBBox();
            const value = 'rotate(' + cesium.Math.toDegrees(angle) + ' ' + (coord.x + (coord.width / 2)) + ' ' + (coord.y + (coord.height / 2)) + ')';
            document.getElementsByClassName(element.className.baseVal)[0].setAttribute('transform', value);
        };

        self.outControlsEvents = Util.detectMouse() ? ['mouseleave'] : ['touchleave', 'touchend'];
        self.outControls = outHandler.bind(self);

        self.inControlsEvents = Util.detectMouse() ? ['mouseenter'] : ['touchmove', 'touchstart'];
        self.inControls = inHandler.bind(self);

        self.moveStart = moveStartHandler.bind(self);
        self.moveEnd = moveEndHandler.bind(self);
        self.postRender = postRenderHandler.bind(self);

        self.selectors = {
            tilt: '-cm-tilt',
            rotate: '-cm-rotate',
            indicator: '-indicator',
            leftArrow: '-left',
            rightArrow: '-right',
            downArrow: '-down',
            upArrow: '-up'
        };

        self.MIN_TILT = cesium.Math.toRadians(-89);
        self.MAX_TILT = cesium.Math.toRadians(-1);

        self.render();
    };
    CameraControls.prototype.bind = function () {
        var self = this;

        // conexión de los controles con el visor de cesium
        self.getCamera().moveStart.addEventListener(self.moveStart);
        self.getCamera().moveEnd.addEventListener(self.moveEnd);
        self.parent.viewer.scene.postRender.addEventListener(self.postRender);

        // gestionamos la opacidad de los controles pasados 5 segundos
        self.outControlsEvents.forEach(function (event) {
            self.div.addEventListener(event, self.outControls);
        });
        self.inControlsEvents.forEach(function (event) {
            self.div.addEventListener(event, self.inControls);
        });

        function setOpacity() {
            if (!self.lastFocused)
                self.lastFocused = performance.now();

            var progress = performance.now() - self.lastFocused;
            if (progress > 5000 && self.isFocusingCameraCtrls !== true) {
                if (!self.div.classList.contains(self.parent.classes.OUTFOCUS)) {
                    self.div.classList.add(self.parent.classes.OUTFOCUS);
                    self.tiltIndicatorOuterCircle.classList.add(self.parent.classes.OUTFOCUS);
                    self.tiltIndicatorOuterShellCircle.classList.add(self.parent.classes.OUTFOCUS);
                    self.rotateIndicatorOuterCircle.classList.add(self.parent.classes.OUTFOCUS);
                    self.rotateIndicatorOuterShellCircle.classList.add(self.parent.classes.OUTFOCUS);
                }
            }

            self.rAFInOutControls = requestAnimationFrame(setOpacity);
        }
        self.rAFInOutControls = requestAnimationFrame(setOpacity);
    };
    CameraControls.prototype.unbind = function () {
        var self = this;

        self.div.classList.add(Consts.classes.HIDDEN);

        // conexión de los controles con el visor de cesium
        self.getCamera().moveStart.removeEventListener(self.moveStart);
        self.getCamera().moveEnd.removeEventListener(self.moveEnd);
        self.parent.viewer.scene.postRender.removeEventListener(self.postRender);

        // gestionamos la opacidad de los controles pasados 5 segundos
        self.outControlsEvents.forEach(function (event) {
            self.div.removeEventListener(event, self.outControls);
        });
        self.inControlsEvents.forEach(function (event) {
            self.div.removeEventListener(event, self.inControls);
        });
        window.cancelAnimationFrame(self.rAFInOutControls);
        self.lastFocused = undefined;
        self.rAFInOutControls = undefined;
    };
    CameraControls.prototype.getCamera = function () {
        var self = this;

        return self.parent.viewer.scene.camera;
    };
    CameraControls.prototype.getCameraState = function () {
        var self = this;

        if (self.parent.viewer) {
            var camera = self.parent.viewer.scene.camera;
            var cameraPosition = camera.positionCartographic;

            var bottomCenter = pickBottomPoint(self.parent.viewer.scene);
            if (bottomCenter) {
                var distance = cesium.Cartesian3.distance(camera.position, bottomCenter);

                return {
                    cp: [cameraPosition.longitude, cameraPosition.latitude, cameraPosition.height],
                    chpr: [camera.heading, camera.pitch, camera.roll],
                    bcpd: distance
                };
            }
        }
    };
    CameraControls.prototype.render = function () {
        var self = this;

        if (self.div) {
            self.div.classList.remove(Consts.classes.HIDDEN);
            self.bind();
        }
        else {
            self.parent.getRenderedHtml(self.parent.CLASS + '-cm-ctls', {}, function (html) {
                // contenedor controles
                self.div = document.createElement('div');
                self.div.classList.add(self.parent.CLASS + '-cm-ctls');
                self.div.innerHTML = html;
                self.parent.map.div.appendChild(self.div);


                // tilt
                var tiltSelector = '.' + self.parent.CLASS + self.selectors.tilt;

                self.tiltIndicatorInner = self.div.querySelector("[class^=" + tiltSelector.replace('.', '') + "-inner" + "]");
                self.tiltIndicatorInner.addEventListener(Consts.event.CLICK, self.resetTilt.bind(self));

                self.tiltIndicator = self.div.querySelector(tiltSelector + '-indicator');

                self.tiltIndicatorOuterCircle = self.div.querySelector(tiltSelector + '-outer-circle');
                self.tiltIndicatorOuterShellCircle = self.div.querySelector(tiltSelector + '-outer-shell-circle');

                self.tiltIndicatorCircle = self.div.querySelector("[class^=" + tiltSelector.replace('.', '') + "-outer" + "]");
                self.tiltIndicatorCircle.addEventListener('mousedown', function (e) {
                    var self = this;

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    var vectorScratch = new cesium.Cartesian2();
                    var element = e.currentTarget;
                    var rectangle = e.currentTarget.getBoundingClientRect();
                    var center = new cesium.Cartesian2((rectangle.right - rectangle.left) / 2.0, (rectangle.bottom - rectangle.top) / 2.0);
                    var clickLocation = new cesium.Cartesian2(e.clientX - rectangle.left, e.clientY - rectangle.top);
                    var vector = cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);

                    self.draggingTilt.call(self, element, vector);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }.bind(self));

                // left
                self.tiltUp = self.div.querySelector(tiltSelector + self.selectors.upArrow);
                self.tiltUp.addEventListener(Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {

                    if (e.target.disabled) {
                        if (e.stopPropagation) e.stopPropagation();
                        if (e.preventDefault) e.preventDefault();

                        e.cancelBubble = true;
                        e.returnValue = false;
                        return false;
                    }

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    self.inControls(e);

                    var upEvent = Util.detectMouse() ? 'mouseup' : 'touchend';

                    document.removeEventListener(upEvent, self.tiltUpMouseUpFunction, false);
                    self.tiltUpMouseUpFunction = undefined;

                    self.tilt.call(self, +5);

                    self.tiltUpInterval = setInterval(function () {
                        if (!self.isTiltUpDisabled) self.tilt.call(self, +5);
                        else self.tiltUpMouseUpFunction();
                    }.bind(self), 101);

                    self.tiltUpMouseUpFunction = function () {
                        clearInterval(self.tiltUpInterval);
                        self.tiltUpInterval = undefined;

                        document.removeEventListener(upEvent, self.tiltUpMouseUpFunction, false);
                        self.tiltUpMouseUpFunction = undefined;
                    };

                    document.addEventListener(upEvent, self.tiltUpMouseUpFunction, false);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }.bind(self));

                // right
                self.tiltDown = self.div.querySelector(tiltSelector + self.selectors.downArrow);
                self.tiltDown.addEventListener(Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {


                    if (e.target.disabled) {
                        if (e.stopPropagation) e.stopPropagation();
                        if (e.preventDefault) e.preventDefault();

                        e.cancelBubble = true;
                        e.returnValue = false;
                        return false;
                    }

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    self.inControls(e);

                    var upEvent = Util.detectMouse() ? 'mouseup' : 'touchend';

                    document.removeEventListener(upEvent, self.tiltDownMouseUpFunction, false);
                    self.tiltDownMouseUpFunction = undefined;

                    self.tilt.call(self, -5);

                    self.tiltDownInterval = setInterval(function () {
                        if (!self.isTiltDownDisabled) self.tilt.call(self, -5);
                        else self.tiltDownMouseUpFunction();
                    }.bind(self), 101);

                    self.tiltDownMouseUpFunction = function () {
                        clearInterval(self.tiltDownInterval);
                        self.tiltDownInterval = undefined;

                        document.removeEventListener(upEvent, self.tiltDownMouseUpFunction, false);
                        self.tiltDownMouseUpFunction = undefined;
                    };

                    document.addEventListener(upEvent, self.tiltDownMouseUpFunction, false);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }.bind(self));

                // rotation
                var rotateSelector = '.' + self.parent.CLASS + self.selectors.rotate;

                self.rotateIndicatorInner = self.div.querySelector("[class^=" + rotateSelector.replace('.', '') + "-inner" + "]");
                self.rotateIndicatorInner.addEventListener(Consts.event.CLICK, self.resetRotation.bind(self));

                self.rotateIndicator = self.div.querySelector(rotateSelector + '-indicator');

                self.rotateIndicatorOuterCircle = self.div.querySelector(rotateSelector + '-outer-circle');
                self.rotateIndicatorOuterShellCircle = self.div.querySelector(rotateSelector + '-outer-shell-circle');

                self.rotateIndicatorCircle = self.div.querySelector("[class^=" + rotateSelector.replace('.', '') + "-outer" + "]");
                self.rotateIndicatorCircle.addEventListener('mousedown', function (e) {
                    var self = this;

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    var vectorScratch = new cesium.Cartesian2();
                    var element = e.currentTarget;
                    var rectangle = e.currentTarget.getBoundingClientRect();
                    var center = new cesium.Cartesian2((rectangle.right - rectangle.left) / 2.0, (rectangle.bottom - rectangle.top) / 2.0);
                    var clickLocation = new cesium.Cartesian2(e.clientX - rectangle.left, e.clientY - rectangle.top);
                    var vector = cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);

                    self.draggingRotate.call(self, element, vector);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }.bind(self));

                // left
                self.rotateLeft = self.div.querySelector(rotateSelector + self.selectors.leftArrow);
                self.rotateLeft.addEventListener(Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    self.inControls(e);

                    var upEvent = Util.detectMouse() ? 'mouseup' : 'touchend';

                    document.removeEventListener(upEvent, self.rotateLeftMouseUpFunction, false);
                    self.rotateLeftMouseUpFunction = undefined;

                    self.rotate.call(self, -15);

                    self.rotateLeftInterval = setInterval(function () {
                        self.rotate.call(self, -15);
                    }.bind(self), 101);

                    self.rotateLeftMouseUpFunction = function () {
                        clearInterval(self.rotateLeftInterval);
                        self.rotateLeftInterval = undefined;

                        document.removeEventListener(upEvent, self.rotateLeftMouseUpFunction, false);
                        self.rotateLeftMouseUpFunction = undefined;
                    };

                    document.addEventListener(upEvent, self.rotateLeftMouseUpFunction, false);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;

                }.bind(self));

                self.rotateRight = self.div.querySelector(rotateSelector + self.selectors.rightArrow);
                self.rotateRight.addEventListener(Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    self.inControls(e);

                    var upEvent = Util.detectMouse() ? 'mouseup' : 'touchend';

                    document.removeEventListener(upEvent, self.rotateRightMouseUpFunction, false);
                    self.rotateRightMouseUpFunction = undefined;

                    self.rotate.call(self, +15);

                    self.rotateRightInterval = setInterval(function () {
                        self.rotate.call(self, +15);
                    }.bind(self), 101);

                    self.rotateRightMouseUpFunction = function () {
                        clearInterval(self.rotateRightInterval);
                        self.rotateRightInterval = undefined;

                        document.removeEventListener(upEvent, self.rotateRightMouseUpFunction, false);
                        self.rotateRightMouseUpFunction = undefined;
                    };

                    document.addEventListener(upEvent, self.rotateRightMouseUpFunction, false);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;

                }.bind(self));

                self.bind();

            }.bind(this));
        }
    };
    CameraControls.prototype.disableTilt = function (angle) {
        var self = this;

        var theta = cesium.Math.toRadians(angle);
        var tilt = self.getCamera().pitch;

        self.isTiltDownDisabled = (tilt + -theta) < self.MIN_TILT;
        self.isTiltUpDisabled = (tilt + theta) > self.MAX_TILT;

        // left
        self.tiltUp.disabled = self.isTiltUpDisabled;
        self.tiltUp.classList.toggle(self.parent.classes.CAMERACTRARROWDISABLED, self.isTiltUpDisabled);


        // right
        self.tiltDown.disabled = self.isTiltDownDisabled;
        self.tiltDown.classList.toggle(self.parent.classes.CAMERACTRARROWDISABLED, self.isTiltDownDisabled);
    };
    CameraControls.prototype.disableRotate = function () {
        var self = this;

        var isDisable = true;

        var scene = self.parent.viewer.scene;
        var canvas = scene.canvas;
        var bottomLeft = new cesium.Cartesian2(0, canvas.clientHeight - 1);
        var bottomRight = new cesium.Cartesian2(canvas.clientWidth - 1, canvas.clientHeight - 1);
        var fovCoords = [bottomLeft, bottomRight, new cesium.Cartesian2(canvas.clientWidth - 1, 0), new cesium.Cartesian2(0, 0)]
            .map(function (elm) {
                return pickMapCoords.call(this, elm);
            }.bind(self.parent))
            .filter(function (elm) {
                return elm !== null;
            });

        if (fovCoords.length && fovCoords.length >= 2) {
            isDisable = false;
        }

        // reset
        self.rotateIndicatorInner.disabled = isDisable;

        // left
        self.rotateLeft.disabled = isDisable;
        self.rotateLeft.classList.toggle(self.parent.classes.CAMERACTRARROWDISABLED, isDisable);

        // right
        self.rotateRight.disabled = isDisable;
        self.rotateRight.classList.toggle(self.parent.classes.CAMERACTRARROWDISABLED, isDisable);

        return isDisable;
    };
    CameraControls.prototype.tilt = function (angle) {
        var self = this;

        self.disableTilt(angle);

        if (self.parent.viewer && self.parent.viewer.trackedEntity) {
            self.getCamera().rotateUp(cesium.Math.toRadians(angle));
        } else {
            if (pickCenterPoint(self.parent.viewer.scene) == undefined) {
                if (angle > 0) self.getCamera().lookUp();
                else self.getCamera().lookDown();
            }

            if ((angle >= cesium.Math.PI_OVER_TWO && self.isTiltUpDisabled) ||
                (angle <= -cesium.Math.PI_OVER_TWO && self.isTiltDownDisabled)) {
                return;
            }

            var _angle = cesium.Math.toRadians(angle);
            var pivot = pickCenterPoint(self.parent.viewer.scene);
            if (pivot) {
                var transform = cesium.Matrix4.fromTranslation(pivot);
                self.parent.view3D.rotateAroundAxis(self.getCamera(), -_angle, self.getCamera().right, transform, { duration: 100 });
            }
        }
    };
    CameraControls.prototype.rotate = function (angle) {
        var self = this;

        angle = cesium.Math.toRadians(angle);

        if (self.parent.viewer && self.parent.viewer.trackedEntity) {
            self.getCamera().rotateRight(-angle);
        } else {
            var bottom = pickBottomPoint(self.parent.viewer.scene);
            if (bottom) {
                setHeadingUsingBottomCenter(self.parent.viewer.scene, angle, bottom, {
                    duration: 100
                });
            }
        }
    };
    CameraControls.prototype.draggingTilt = function (tiltElement, cursorVector) {
        var self = this;

        self.tiltIndicatorOuterCircle.classList.add(self.parent.classes.HIGHLIGHTED);

        var oldTransformScratch = new cesium.Matrix4();
        var newTransformScratch = new cesium.Matrix4();
        var vectorScratch = new cesium.Cartesian2();

        document.removeEventListener('mousemove', self.tiltMouseMoveFunction, false);
        document.removeEventListener('mouseup', self.tiltMouseUpFunction, false);

        self.tiltMouseMoveFunction = undefined;
        self.tiltMouseUpFunction = undefined;

        self.isTilting = true;

        var scene = self.parent.viewer.scene;
        var camera = scene.camera;

        var pivot = pickCenterPoint(scene);
        if (!pivot) {
            self.tiltFrame = cesium.Transforms.northUpEastToFixedFrame(camera.positionWC, cesium.Ellipsoid.WGS84, newTransformScratch);
            self.tiltIsLook = true;
        } else {
            self.tiltFrame = cesium.Transforms.northUpEastToFixedFrame(pivot, cesium.Ellipsoid.WGS84, newTransformScratch);
            self.tiltIsLook = false;
        }

        self.startCursorAngle = Math.atan2(-cursorVector.y, cursorVector.x);

        var oldTransform = cesium.Matrix4.clone(camera.transform, oldTransformScratch);
        camera.lookAtTransform(self.tiltFrame);

        self.initialCameraAngle = Math.atan2(camera.position.y, camera.position.x);

        camera.lookAtTransform(oldTransform);

        self.tiltMouseMoveFunction = function (e) {
            var self = this;

            scene = self.parent.viewer.scene;
            camera = scene.camera;

            var tiltRectangle = tiltElement.getBoundingClientRect();
            const center = new cesium.Cartesian2((tiltRectangle.right - tiltRectangle.left) / 2.0, (tiltRectangle.bottom - tiltRectangle.top) / 2.0);
            var clickLocation = new cesium.Cartesian2(e.clientX - tiltRectangle.left, e.clientY - tiltRectangle.top);
            var vector = cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);

            console.log('Entra: ' + vector.toString());

            var angle = Math.atan2(-vector.y, vector.x);
            var angleDifference = angle - self.startCursorAngle;
            var newCameraAngle = cesium.Math.zeroToTwoPi(self.initialCameraAngle - angleDifference);

            try {
                oldTransform = cesium.Matrix4.clone(camera.transform, oldTransformScratch);
                camera.lookAtTransform(self.tiltFrame);
                var currentCameraAngle = Math.atan2(camera.position.y, camera.position.x);
                var theta = newCameraAngle - currentCameraAngle;

                var tilt = camera.pitch;
                tilt += theta;

                if (tilt < self.MIN_TILT) {
                    camera.rotate(camera.right, camera.pitch - self.MIN_TILT);
                } else if (tilt > self.MAX_TILT) {
                    camera.rotate(camera.right, camera.pitch - self.MAX_TILT);
                } else {
                    camera.rotate(camera.right, -theta);
                }

                self.disableTilt(5);
                camera.lookAtTransform(oldTransform);

            } catch (e) {
                self.tiltMouseUpFunction();
            }


        }.bind(self);

        self.tiltMouseUpFunction = function (_e) {
            self.tiltIndicatorOuterCircle.classList.remove(self.parent.classes.HIGHLIGHTED);

            self.isTilting = false;
            document.removeEventListener('mousemove', self.tiltMouseMoveFunction, false);
            document.removeEventListener('mouseup', self.tiltMouseUpFunction, false);

            self.tiltMouseMoveFunction = undefined;
            self.tiltMouseUpFunction = undefined;
        };

        document.addEventListener('mousemove', self.tiltMouseMoveFunction, false);
        document.addEventListener('mouseup', self.tiltMouseUpFunction, false);
    };
    CameraControls.prototype.draggingRotate = function (rotateElement, cursorVector) {
        var self = this;

        document.removeEventListener('mousemove', self.rotateMouseMoveFunction, false);
        document.removeEventListener('mouseup', self.rotateMouseUpFunction, false);

        self.rotateMouseMoveFunction = undefined;
        self.rotateMouseUpFunction = undefined;

        self.rotateMouseMoveFunction = function (e) {
            var rotateRectangle = rotateElement.getBoundingClientRect();
            var center = new cesium.Cartesian2((rotateRectangle.right - rotateRectangle.left) / 2.0, (rotateRectangle.bottom - rotateRectangle.top) / 2.0);
            var clickLocation = new cesium.Cartesian2(e.clientX - rotateRectangle.left, e.clientY - rotateRectangle.top);
            var vector = cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);
            var angle = Math.atan2(-vector.y, vector.x);

            var angleDifference = angle - self.rotateInitialCursorAngle;
            var newCameraAngle = cesium.Math.zeroToTwoPi(self.rotateInitialCameraAngle - angleDifference);

            camera = self.parent.viewer.scene.camera;

            try {
                oldTransform = cesium.Matrix4.clone(camera.transform, oldTransformScratch);
                camera.lookAtTransform(self.rotateFrame);
                var currentCameraAngle = Math.atan2(camera.position.y, camera.position.x);
                camera.rotateRight(newCameraAngle - currentCameraAngle);
                camera.lookAtTransform(oldTransform);
            } catch (e) {
                self.rotateMouseUpFunction();
            }
        };

        self.rotateMouseUpFunction = function (_e) {
            self.isRotating = false;

            self.rotateIndicatorOuterCircle.classList.remove(self.parent.classes.HIGHLIGHTED);

            document.removeEventListener('mousemove', self.rotateMouseMoveFunction, false);
            document.removeEventListener('mouseup', self.rotateMouseUpFunction, false);

            self.rotateMouseMoveFunction = undefined;
            self.rotateMouseUpFunction = undefined;
        };

        if (self.disableRotate()) {
            self.rotateMouseUpFunction();
            return;
        }

        self.rotateIndicatorOuterCircle.classList.add(self.parent.classes.HIGHLIGHTED);

        var oldTransformScratch = new cesium.Matrix4();
        var newTransformScratch = new cesium.Matrix4();
        var vectorScratch = new cesium.Cartesian2();

        self.isRotating = true;
        self.rotateInitialCursorAngle = Math.atan2(-cursorVector.y, cursorVector.x);

        var scene = self.parent.viewer.scene;
        var camera = scene.camera;

        var viewCenter = pickCenterPoint(self.parent.viewer.scene);
        if (viewCenter == null || viewCenter == undefined) {
            viewCenter = pickBottomPoint(self.parent.viewer.scene);
            if (viewCenter == null || viewCenter == undefined) {
                self.rotateFrame = cesium.Transforms.eastNorthUpToFixedFrame(camera.positionWC, cesium.Ellipsoid.WGS84, newTransformScratch);
                self.rotateIsLook = true;
            } else {
                self.rotateFrame = cesium.Transforms.eastNorthUpToFixedFrame(viewCenter, cesium.Ellipsoid.WGS84, newTransformScratch);
                self.rotateIsLook = false;
            }
        } else {
            self.rotateFrame = cesium.Transforms.eastNorthUpToFixedFrame(viewCenter, cesium.Ellipsoid.WGS84, newTransformScratch);
            self.rotateIsLook = false;
        }

        try {
            var oldTransform = cesium.Matrix4.clone(camera.transform, oldTransformScratch);
            camera.lookAtTransform(self.rotateFrame);
            self.rotateInitialCameraAngle = Math.atan2(camera.position.y, camera.position.x);
            self.rotateInitialCameraDistance = cesium.Cartesian3.magnitude(new cesium.Cartesian3(camera.position.x, camera.position.y, 0.0));
            camera.lookAtTransform(oldTransform);
        } catch (e) {
            self.rotateMouseUpFunction();
        }

        document.addEventListener('mousemove', self.rotateMouseMoveFunction, false);
        document.addEventListener('mouseup', self.rotateMouseUpFunction, false);
    };
    CameraControls.prototype.resetTilt = function () {
        var self = this;
        // lo dejamos como al principio a 50 grados
        var angle = -self.getCamera().pitch - cesium.Math.toRadians(50);
        self.tilt(cesium.Math.toDegrees(angle));
    };
    CameraControls.prototype.resetRotation = function (options) {
        const self = this;
        return new Promise(function (resolve, _reject) {
            var currentRotation;
            currentRotation = -self.getCamera().heading;

            while (currentRotation < -Math.PI) {
                currentRotation += 2 * Math.PI;
            }
            while (currentRotation > Math.PI) {
                currentRotation -= 2 * Math.PI;
            }

            if (!options)
                resolve();
            else {
                options.callback = function () {
                    resolve();
                };
            }

            if (self.parent.viewer && self.parent.viewer.trackedEntity) {
                self.parent.view3D.linked2DControls.geolocation.videoControls.call(self, { target: { className: 'stop' }, custom: true });
            }
            var bottom = pickBottomPoint(self.parent.viewer.scene);
            if (bottom) {
                setHeadingUsingBottomCenter(self.parent.viewer.scene, currentRotation, bottom, options);
            }
        });
    };
    CameraControls.prototype.customCollisionDetection = function () {
        var self = this;

        var scratchAdjustHeightTransform = new cesium.Matrix4();
        var scratchAdjustHeightCartographic = new cesium.Cartographic();

        var scene = self.parent.viewer.scene;
        var camera = self.parent.viewer.scene.camera;

        var screenSpaceCameraController = scene.screenSpaceCameraController;
        var minimumCollisionTerrainHeight = screenSpaceCameraController.minimumCollisionTerrainHeight;
        var minimumZoomDistance = screenSpaceCameraController.minimumZoomDistance;
        var globe = scene.globe;

        var ellipsoid = globe.ellipsoid;

        var transform;
        var mag;
        if (!cesium.Matrix4.equals(camera.transform, cesium.Matrix4.IDENTITY)) {
            transform = cesium.Matrix4.clone(camera.transform, scratchAdjustHeightTransform);
            mag = cesium.Cartesian3.magnitude(camera.position);
            camera._setTransform(cesium.Matrix4.IDENTITY);
        }

        var cartographic = scratchAdjustHeightCartographic;
        ellipsoid.cartesianToCartographic(camera.position, cartographic);

        var heightUpdated = false;
        if (cartographic.height < minimumCollisionTerrainHeight) {
            var height = globe.getHeight(cartographic);
            if (height !== undefined && height !== null) {
                height += minimumZoomDistance;
                if (cartographic.height < height) {
                    cartographic.height = height;
                    ellipsoid.cartographicToCartesian(cartographic, camera.position);
                    heightUpdated = true;
                }
            }
        }

        if (transform !== undefined && transform !== null) {
            camera._setTransform(transform);
            if (heightUpdated) {
                cesium.Cartesian3.normalize(camera.position, camera.position);
                cesium.Cartesian3.negate(camera.position, camera.direction);
                cesium.Cartesian3.multiplyByScalar(camera.position, Math.max(mag, minimumZoomDistance), camera.position);
                cesium.Cartesian3.normalize(camera.direction, camera.direction);
                cesium.Cartesian3.cross(camera.direction, camera.up, camera.right);
                cesium.Cartesian3.cross(camera.right, camera.direction, camera.up);
            }
        }
    };
    CameraControls.prototype.limitCameraToInitExtent = function () {
        var self = this;

        var pos = self.viewer.camera.positionCartographic.clone();

        if (!(pos.longitude >= self.initExtent.west &&
            pos.longitude <= self.initExtent.east &&
            pos.latitude >= self.initExtent.south &&
            pos.latitude <= self.initExtent.north)) {
            // add a padding based on the camera height
            var maxHeight = self.viewer.scene.screenSpaceCameraController.maximumZoomDistance;
            var padding = pos.height * 0.05 / maxHeight;
            pos.longitude = Math.max(self.initExtent.west - padding, pos.longitude);
            pos.latitude = Math.max(self.initExtent.south - padding, pos.latitude);
            pos.longitude = Math.min(self.initExtent.east + padding, pos.longitude);
            pos.latitude = Math.min(self.initExtent.north + padding, pos.latitude);
            self.viewer.camera.setView({
                destination: cesium.Ellipsoid.WGS84.cartographicToCartesian(pos),
                orientation: {
                    heading: self.viewer.camera.heading,
                    pitch: self.viewer.camera.pitch
                }
            });
        }

        // Set the minimumZoomDistance according to the camera height
        self.viewer.scene.screenSpaceCameraController.minimumZoomDistance = pos.height > 1800 ? 400 : 200;
    };

    const TwoDLinkedFeatureInfo = function (map) {
        var pending = false;
        var marker = null;
        var ctlResultsPanel = null;
        var ctlFeatureInfo = null;

        var savedMode;
        var map2DgetResolutionFN = map.map.getResolution;

        var getResultsPanelCtl = function (ctlFeatureInfo) {

            if (ctlResultsPanel) {
                return Promise.resolve();
            } else {

                const resultsPanelOptions = {
                    "content": "table",
                    "titles": {
                        "main": Util.getLocaleString(map.map.options.locale, "threed.rs.panel.gfi"),
                        "max": Util.getLocaleString(map.map.options.locale, "threed.rs.panel.gfi")
                    }
                };

                var addControlPromise;
                var controlContainer = map.map.getControlsByClass('TC.control.ControlContainer')[0];
                if (controlContainer) {
                    resultsPanelOptions.position = controlContainer.POSITION.RIGHT;
                    addControlPromise = controlContainer.addControl('resultsPanel', resultsPanelOptions);
                } else {
                    resultsPanelOptions.div = document.createElement('div');
                    map.map.div.appendChild(resultsPanelOptions.div);
                    addControlPromise = map.map.addControl('resultsPanel', resultsPanelOptions);
                }

                return addControlPromise.then(function (control) {
                    control.caller = ctlFeatureInfo;
                    ctlResultsPanel = control;
                    ctlFeatureInfo.resultsPanel = ctlResultsPanel;
                });
            }
        };

        ctlFeatureInfo = map.map.getControlsByClass(TC.control.FeatureInfo)[0];
        if (ctlFeatureInfo) {

            savedMode = ctlFeatureInfo.displayMode;

            getResultsPanelCtl(ctlFeatureInfo).then(function () {
                ctlFeatureInfo.setDisplayMode(Consts.infoContainer.RESULTS_PANEL);

                map.map.on(Consts.event.RESULTSPANELCLOSE, function (e) {
                    if (e.control === ctlFeatureInfo.getDisplayControl()) {
                        if (!ctlFeatureInfo.querying) {
                            removeMarker();
                        }
                    }
                });
            });
        }
        this.clear = function () {
            ctlFeatureInfo.closeResults();
            removeMarker();
        };
        this.reset = function () {
            this.clear();
            ctlFeatureInfo.setDisplayMode(savedMode);
            map.map.getResolution = map2DgetResolutionFN;
        };
        var setMarker = function (pickedPosition) {
            if (!marker) {
                var billboard = {
                    position: pickedPosition,
                    billboard: { /* revisar: no está bien la URL de la imagen - también revisar el GFI que salta en móvil sólo con navegar */
                        image: Util.getFeatureStyleFromCss(map.CLASS + '-marker')?.url,
                        eyeOffset: new cesium.Cartesian3(0, 0, -100),
                        verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                        heightReference: cesium.HeightReference.CLAMP_TO_GROUND
                    }
                };
                marker = map.view3D.addNativeFeature.call(map, billboard);

            } else {
                marker.position = pickedPosition;
            }

            map.viewer.scene.requestRender();
        };
        var removeMarker = function () {
            map.view3D.removeFeature.call(map, marker);
            marker = null;
        };
        this.send = function (pickedPosition) {
            return new Promise(function (resolve, _reject) {
                pending = true;

                if (ctlFeatureInfo.displayMode !== Consts.infoContainer.RESULTS_PANEL) {
                    ctlFeatureInfo.setDisplayMode(Consts.infoContainer.RESULTS_PANEL);
                }

                if (ctlFeatureInfo.resultsPanel) {
                    ctlFeatureInfo.resultsPanel.close();
                }

                if (!map.waiting)
                    map.waiting = map.map.getLoadingIndicator().addWait();

                setMarker(pickedPosition);

                getResultsPanelCtl(ctlFeatureInfo).then(function () {
                    var pickedLocation = cesium.Ellipsoid.WGS84.cartesianToCartographic(pickedPosition);

                    var reprojected;
                    if (map.view3D.crs !== map.view3D.view2DCRS) {
                        reprojected = Util.reproject([cesium.Math.toDegrees(pickedLocation.longitude), cesium.Math.toDegrees(pickedLocation.latitude)], map.view3D.crs, map.view3D.view2DCRS);
                    } else {
                        reprojected = [cesium.Math.toDegrees(pickedLocation.longitude), cesium.Math.toDegrees(pickedLocation.latitude)];
                    }


                    var tilesRendered = map.viewer.scene.globe._surface._tilesToRender;
                    var pickedTile;

                    for (var textureIndex = 0; !pickedTile && textureIndex < tilesRendered.length; ++textureIndex) {
                        var tile = tilesRendered[textureIndex];
                        if (cesium.Rectangle.contains(tile.rectangle, pickedLocation)) {
                            pickedTile = tile;
                        }
                    }

                    if (!pickedTile) {
                        resolve();
                        return;
                    }

                    var imageryTiles = pickedTile.data.imagery;
                    for (var i = imageryTiles.length - 1; i >= 0; --i) {
                        var terrainImagery = imageryTiles[i];
                        var imagery = terrainImagery.readyImagery;
                        if (!imagery) {
                            resolve();
                            return;
                        }
                    }

                    var nativeRectangle = pickedTile.tilingScheme.tileXYToNativeRectangle(pickedTile.x, pickedTile.y, pickedTile.level);

                    var readyImageryToGetNativeRectangle = (imageryTiles.find(function (imagery) {
                        return imagery.readyImagery.imageryLayer.isBaseLayer();
                    }) || {}).readyImagery;

                    map.map.getResolution = function () {

                        var west_south = map.view3D.crs !== map.view3D.view2DCRS ? Util.reproject([nativeRectangle.west, nativeRectangle.south], map.view3D.crs, map.view3D.view2DCRS) : [nativeRectangle.west, nativeRectangle.south];
                        var east_north = map.view3D.crs !== map.view3D.view2DCRS ? Util.reproject([nativeRectangle.east, nativeRectangle.north], map.view3D.crs, map.view3D.view2DCRS) : [nativeRectangle.east, nativeRectangle.north];

                        var xResolution = (east_north[0] - west_south[0]) / (readyImageryToGetNativeRectangle && readyImageryToGetNativeRectangle.imageryLayer.imageryProvider.tileWidth || 256);
                        var yResolution = (east_north[1] - west_south[1]) / (readyImageryToGetNativeRectangle && readyImageryToGetNativeRectangle.imageryLayer.imageryProvider.tileHeight || 256);

                        return Math.max(xResolution, yResolution);

                    }.bind(map, readyImageryToGetNativeRectangle, nativeRectangle);

                    map.map.one(Consts.event.NOFEATUREINFO, function (e) {
                        pending = false;

                        resolve(e);
                    }.bind(ctlFeatureInfo));

                    map.map.one(Consts.event.FEATUREINFO, function (e) {
                        pending = false;

                        resolve(e);
                    });

                    map.map.on(Consts.event.FEATURECLICK, function (e) {
                        removeMarker();

                        resolve(e);
                    });

                    ctlFeatureInfo.isActive = true;
                    ctlFeatureInfo.beforeRequest({
                        xy: [0, 0]
                    }); // Es irrelevante dónde va a poner el marcador, no se va a ver                

                    ctlFeatureInfo.callback(reprojected);
                });
            });
        };
        this.get2DMarker = function () {
            return ctlFeatureInfo.filterFeature;
        };
        this.isPending = function () {
            return pending;
        };
    };

    const RasterConverter = function (_crsPattern) {
        this.layerCrs = null;

        var paths = {
            CRS: ["Capability", "Layer", "CRS"],
            TILEMATRIXSET: ["Contents", "TileMatrixSet", "Identifier"],
            TILEMATRIXSETLABELS: ["Contents", "TileMatrixSet"],
            LAYERS: ["Contents", "Layer"],
        };
        var getOfPath = function (obj, p, i) {
            if (i < p.length - 1) {
                if (hasOwnProperty.call(obj, p[i])) {
                    return getOfPath(obj[p[i]], p, ++i);
                }
                else {
                    return null;
                }
            } else {
                if (obj instanceof Array) {
                    var _obj = [];
                    for (var a = 0; a < obj.length; a++) {
                        if (hasOwnProperty.call(obj[a], p[i])) {
                            _obj.push(obj[a][p[i]]);
                        }
                    }

                    return _obj;
                } else {
                    return obj[p[i]];
                }
            }
        };

        var getTileMatrixSetLabelByLayerOnCapabilities = function (layer, crs) {
            let capsURL;
            if ((capsURL = Util.isOnCapabilities(layer.url))) {
                let caps;
                if ((caps = TC.capabilities[capsURL])) {
                    let tileMatrixSet = getOfPath(caps, paths.TILEMATRIXSETLABELS, 0);
                    //obtener la lista de tilematrix usado por las capas de WMTS
                    let usedTileMatrixSet = getOfPath(caps, ["Contents", "Layer"], 0)
                        .filter((l) => layer.names.indexOf(l.Identifier) >= 0)
                        .reduce((vi, va) => {
                            return vi.concat(va.TileMatrixSetLink.map((tmsl) => tmsl.TileMatrixSet))
                        }, []);
                    //filtramos por aquellos que se usan
                    tileMatrixSet = tileMatrixSet.filter((t) => usedTileMatrixSet.indexOf(t.Identifier) >= 0)
                    for (var a = 0; a < tileMatrixSet.length; a++) {
                        if (Util.CRSCodesEqual(crs, tileMatrixSet[a].SupportedCRS)) {
                            return { id: tileMatrixSet[a].Identifier, labels: getOfPath(tileMatrixSet[a], ["TileMatrix", "Identifier"], 0) };
                        }
                    }
                }
            }

            return null;
        };

        var wmtsLayer = function (layer) {
            const self = this;
            return new Promise(function (resolve, reject) {
                let tileMatrixSetLabels = getTileMatrixSetLabelByLayerOnCapabilities(layer, self.layerCrs);
                let resource;
                let resourceURL;
                if (Consts.WMTSEncoding.KVP === layer.encoding) {
                    resource = new cesium.Resource({
                        url: layer.url,
                        request: new cesium.Request({
                            type: cesium.RequestType.IMAGERY
                        })
                    });
                } else if (Consts.WMTSEncoding.RESTFUL === layer.encoding) {
                    const wmtsLayer = layer.wrap.getWMTSLayer({ crs: self.layerCrs });
                    if (wmtsLayer && wmtsLayer.ResourceURL && wmtsLayer.ResourceURL.length > 0) {
                        resourceURL = wmtsLayer.ResourceURL[0];
                        resource = new cesium.Resource({
                            url: resourceURL.template,
                            request: new cesium.Request({
                                type: cesium.RequestType.IMAGERY
                            })
                        });
                    }
                }
                if (resource && tileMatrixSetLabels) {
                    resource.tcLayer = layer;
                    let options = {
                        url: resource,
                        layer: layer.layerNames,
                        style: 'default',
                        format: resourceURL && resourceURL.format || layer.format || layer.options.format,
                        tilingScheme: new cesium.GeographicTilingScheme()
                    };

                    if (Consts.WMTSEncoding.RESTFUL === layer.encoding) {
                        options.tileMatrixSetID = tileMatrixSetLabels.id;
                    } else if (Consts.WMTSEncoding.KVP === layer.encoding && tileMatrixSetLabels) {
                        options.tileMatrixSetID = tileMatrixSetLabels.id;
                        options.tileMatrixLabels = tileMatrixSetLabels.labels;
                    }

                    if (tileMatrixSetLabels && tileMatrixSetLabels.labels) {
                        const maxTileMatrixSetLabel = tileMatrixSetLabels.labels[tileMatrixSetLabels.labels.length - 1];
                        options.maximumLevel = parseInt(maxTileMatrixSetLabel.substring(maxTileMatrixSetLabel.indexOf(":")+1));
                    }

                    // cuando un WMTS no tenga el matrixset de 0 a 21 requeriremos de la siguiente instrucción
                    // Cesium requiere que los niveles vayan de 0 a 21 aunque físicamente no sea así
                    //if (tileMatrixSetLabels && tileMatrixSetLabels.labels[0] !== 0) {
                    //    options.tileMatrixLabels = [...Array(21/*tileMatrixSetLabels.labels.length*/).keys()];
                    //}

                    resolve(new cesium.WebMapTileServiceImageryProvider(options));

                } else {
                    if (layer.fallbackLayer) {
                        wmsLayer(layer.getFallbackLayer()).then((layer) => {
                            resolve(layer);
                        }, () => {
                            reject('Faltan datos para instanciar la capa');
                        })
                    }
                    else reject('Faltan datos para instanciar la capa');
                }
            });
        }

        var wmsLayer = function (layer) {
            return new Promise(function (resolve, _reject) {
                let resource = new cesium.Resource({
                    url: layer.url,
                    request: new cesium.Request({
                        type: cesium.RequestType.IMAGERY
                    })
                });
                resource.tcLayer = layer;
                let options = {
                    url: resource,
                    layers: layer.layerNames,
                    parameters: {
                        version: "1.3.0",
                        transparent: true,
                        format: layer.format || layer.options.format
                    }
                };

                var bindEXBBox = function () {
                    var bbox = [];
                    if (layer.capabilities && layer.capabilities.Capability && layer.capabilities.Capability.Layer) {
                        if (layer.names.length > 0) {
                            var names = layer.names.slice(0);
                            var _getEXBBox = function _getEXBBox(nodes, name) {
                                if (nodes) {
                                    let n;
                                    for (var i = 0; i < nodes.length; i++) {
                                        n = nodes[i];
                                        if (layer.compareNames(layer.wrap.getName(n), name)) {
                                            return n.EX_GeographicBoundingBox;
                                        }
                                    }

                                    return _getEXBBox(n.Layer, name);
                                }
                            };
                            while (names.length > 0) {
                                var exBBox = _getEXBBox([layer.capabilities.Capability.Layer], names.pop());
                                if (exBBox !== null) {
                                    bbox.push(exBBox);
                                }
                            }
                        }
                    }

                    return bbox;
                };
                var exBoundingBox = bindEXBBox();

                if (exBoundingBox) {
                    layer.geoBBox = exBoundingBox;
                }

                resolve(new cesium.WebMapServiceImageryProvider(options));
            });
        };

        var CustomResource;
        var defineCustomResource = function () {
            /* tengo que sobrescribir porque no valida nada... 
            Desde la version 1.42 han cambiado la definición de un proxy en las capas raster: si configuras con proxy, pide directamente desde el proxy y si da error no gestiona nada, 
            y si no configuras proxy, pide directamente sin tampoco gestionar los errores. Además la creación de una capa raster es síncrona, por lo que no encaja con el algoritmo de proxificación */
            CustomResource = function (options, layer) {
                cesium.Resource.call(this, options);

                this.layer = layer;
            };
            CustomResource.prototype.constructor = CustomResource;
            CustomResource.prototype = Object.create(cesium.Resource.prototype, {});
            CustomResource.prototype.clone = function (result) {

                var cloned = cesium.Resource.prototype.clone.call(this, result);

                if (!cesium.defined(result)) {
                    result = new CustomResource({
                        url: this._url
                    }, this.layer);
                }

                result._url = cloned._url;
                result._queryParameters = cloned._queryParameters;
                result._templateValues = cloned._templateValues;
                result.headers = cloned.headers;
                result.proxy = cloned.proxy;
                result.retryCallback = cloned.retryCallback;
                result.retryAttempts = cloned.retryAttempts;
                result._retryCount = 0;

                result.request = cloned.request;



                return result;
            };
            CustomResource.prototype.fetchImage = customFetchImage;
        };

        /* inicio cesium Resource override */
        var xhrBlobSupported = (function () {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', '#', true);
                xhr.responseType = 'blob';
                return xhr.responseType === 'blob';
            } catch (e) {
                return false;
            }
        })();

        function checkAndResetRequest(request) {
            if (request.state === cesium.RequestState.ISSUED || request.state === cesium.RequestState.ACTIVE) {
                throw new cesium.RuntimeError('The Resource is already being fetched.');
            }

            request.state = cesium.RequestState.UNISSUED;
            request.deferred = undefined;
        }

        function createImage(layer, url, crossOrigin, deferred) {
            var getImage = function (params) {
                var image = new Image();

                image.onload = function (_layer) {
                    deferred.resolve(image);
                }.bind(image, layer);

                image.onerror = function (_layer, e) {
                    deferred.reject(e);
                }.bind(image, layer);

                if (crossOrigin) {
                    if (cesium.TrustedServers.contains(url)) {
                        image.crossOrigin = 'use-credentials';
                    } else {
                        image.crossOrigin = '';
                    }
                }

                image.src = params.url;
            };

            layer.getWebGLUrl.call(layer, url).then(getImage, function (e) {
                deferred.reject(e);
            });
        }

        function fetchImage(resource, allowCrossOrigin) {
            var request = resource.request;
            request.url = resource.url;
            request.requestFunction = function () {
                var url = resource.url;
                var crossOrigin = false;

                // data URIs can't have allowCrossOrigin set.
                if (!resource.isDataUri && !resource.isBlobUri) {
                    crossOrigin = resource.isCrossOriginUrl;
                }

                var deferred = cesium.when.defer();

                createImage(resource.layer, url, crossOrigin && allowCrossOrigin, deferred);

                return deferred.promise;
            };

            var promise = cesium.RequestScheduler.request(request);
            if (!cesium.defined(promise)) {
                return;
            }

            return promise.otherwise(function (e) {
                return cesium.when.reject(e);
            });
        }

        var customFetchImage = function (preferBlob, allowCrossOrigin) {
            if (cesium.defined(allowCrossOrigin)) {
                cesium.deprecationWarning('Resource.fetchImage.allowCrossOrigin', 'The allowCrossOrigin parameter has been deprecated and will be removed in cesium 1.44. It no longer needs to be specified.');
            }

            preferBlob = cesium.defaultValue(preferBlob, false);
            allowCrossOrigin = cesium.defaultValue(allowCrossOrigin, true);

            checkAndResetRequest(this.request);

            // We try to load the image normally if
            // 1. Blobs aren't supported
            // 2. It's a data URI
            // 3. It's a blob URI
            // 4. It doesn't have request headers and we preferBlob is false
            if (!xhrBlobSupported || this.isDataUri || this.isBlobUri || (!this.hasHeaders && !preferBlob)) {
                return fetchImage(this, allowCrossOrigin);
            }

            var blobPromise = this.fetchBlob();
            if (!cesium.defined(blobPromise)) {
                return;
            }

            var generatedBlobResource;
            var generatedBlob;
            return blobPromise
                .then(function (blob) {
                    if (!cesium.defined(blob)) {
                        return;
                    }
                    generatedBlob = blob;
                    var blobUrl = window.URL.createObjectURL(blob);
                    generatedBlobResource = new cesium.Resource({
                        url: blobUrl
                    });

                    return fetchImage(generatedBlobResource);
                })
                .then(function (image) {
                    if (!cesium.defined(image)) {
                        return;
                    }
                    window.URL.revokeObjectURL(generatedBlobResource.url);

                    // This is because the blob object is needed for DiscardMissingTileImagePolicy
                    // See https://github.com/AnalyticalGraphicsInc/cesium/issues/1353
                    image.blob = generatedBlob;
                    return image;
                })
                .otherwise(function (error) {
                    if (cesium.defined(generatedBlobResource)) {
                        window.URL.revokeObjectURL(generatedBlobResource.url);
                    }

                    return cesium.when.reject(error);
                });
        };
        /* fin cesium Resource override */

        this.convert = function (layer, map3DCRS) {
            this.layerCrs = map3DCRS;

            if (!CustomResource) { defineCustomResource(); }

            switch (true) {
                case Consts.layerType.WMTS == layer.type:
                    return wmtsLayer.call(this, layer);
                case Consts.layerType.WMS == layer.type:
                    return wmsLayer.call(this, layer);
            }
        };
    };
    const FeatureConverter = function () {
        var scene = null;
        var toCesiumColor = function (hexStringColor, alpha) {
            if (hexStringColor instanceof Array) {
                hexStringColor = "rgba(" + hexStringColor[0] + ", " + hexStringColor[1] + ", " + hexStringColor[2] + ", " + hexStringColor[3] + ")";
            }
            var color = cesium.Color.fromCssColorString(hexStringColor);
            if (alpha !== undefined) {
                return color.withAlpha(alpha);
            }

            return color;
        }
        var setStyleProperties = function (styles, properties, feature) {
            for (var key in properties) { // recorremos el diccionario de propiedades que admitimos como estilo
                var attr = styles[properties[key].prop];
                if (attr !== undefined) {
                    if (typeof (attr) === "function") { // si la propiedad del estilo es una función (como en el control de búsquedas) invocamos para obtener el valor
                        var val = attr(feature);
                        if (val) {
                            properties[key].val = val;
                        }
                    } else {
                        properties[key].val = attr; // obtenenemos el valor
                    }
                }
            }
        }
        var getPixelSize = function (coords) {
            var rectangle;

            if (coords.length == 1) {
                var point = coords[0];
                var delta = 1000;
                var minx, miny, maxx, maxy;
                minx = new cesium.Cartesian3(point.x - delta, point.y, point.z);
                miny = new cesium.Cartesian3(point.x, point.y - delta, point.z);
                maxx = new cesium.Cartesian3(point.x + delta, point.y, point.z);
                maxy = new cesium.Cartesian3(point.x, point.y + delta, point.z);

                rectangle = cesium.Rectangle.fromCartesianArray([minx, miny, maxx, maxy], cesium.Ellipsoid.WGS84);
            } else {
                rectangle = cesium.Rectangle.fromCartesianArray(coords, cesium.Ellipsoid.WGS84);
            }

            var neededCameraPosition = scene.camera.getRectangleCameraCoordinates(rectangle);
            var distance = cesium.Cartesian3.distance(neededCameraPosition, cesium.BoundingSphere.fromPoints(coords).center);
            var pixelSize = scene.camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, distance, scene.pixelRatio, new cesium.Cartesian2());
            pixelSize = Math.max(pixelSize.x, pixelSize.y);
            return Math.round(pixelSize) == 0 ? 1 : pixelSize;
        };

        var getFeatureStyle = function (feature) {
            var self = this;
            var styles;

            if (!feature.layer || (feature.layer && !hasOwnProperty.call(feature.layer, 'styles'))) {
                styles = TC.Defaults.styles;
            } else {
                styles = feature.layer.styles;
            }

            styles = styles[feature.STYLETYPE] == undefined ?
                styles[(feature.STYLETYPE === "polyline" ? "line" : feature.STYLETYPE)] :
                styles[(feature.STYLETYPE === "multipolygon" ? "polygon" : feature.STYLETYPE)];

            styles = Util.extend({}, styles, feature.options, feature.getStyle());

            return styles;
        }

        function createLine(id, coords, options, callback) {
            const entityOps = {
                name: id,
                polyline: {
                    positions: coords,
                    width: options.width,
                    material: options.material,
                    clampToGround: true
                }
            }
            createLabel(entityOps, options, coords);

            callback(new cesium.Entity(entityOps));
        }

        function createPolygon(id, coords, options, callback) {
            const entityOps = {
                name: id,
                polyline: {
                    positions: coords,
                    width: options.width,
                    material: options.outlineColor,
                    clampToGround: true
                },
                polygon: {
                    hierarchy: new cesium.PolygonHierarchy(coords),
                    material: options.color,
                    clampToGround: true,
                }
            }
            createLabel(entityOps, options, coords);
            var entity = new cesium.Entity(entityOps);

            callback(entity);
        }
        function createLabel(entityOps, options, coords) {
            if (options.label) {
                entityOps.position = coords instanceof cesium.Cartesian3 ? coords: cesium.BoundingSphere.fromPoints(coords).center;
                entityOps.label = {
                    text: options.label,
                    pixelOffset: new cesium.Cartesian2(...(options.labelOffset || [0, 0])),
                    eyeOffset: new cesium.Cartesian3(0, 0, 0),
                    outlineColor: cesium.Color.WHITE,
                    font: options.fontSize + 'pt sans-serif',
                    fillColor: options.fontColor,
                    //fillColor: cesium.Color.fromBytes.apply({}, options.fontColor),
                    outlineWidth: 4,
                    //font: style.font,
                    style: cesium.LabelStyle.FILL_AND_OUTLINE,
                    heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
                    horizontalOrigin: cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: cesium.VerticalOrigin.CENTER

                }
                if (options.fontColor)
                    entityOps.label.fillColor = options.fontColor;
                if (options.fontSize)
                    entityOps.label.font = options.fontSize + "pt sans-serif";
            }

        }

        var circleConverter = function (feature) {
            var self = this;
            var circle = {};
            var styles = getFeatureStyle(feature);

            circle.options = function () {
                var opt = {};

                var properties = {
                    color: { prop: 'fillColor' },
                    opacity: { prop: 'fillOpacity' },
                    outlineColor: { prop: 'strokeColor' },
                    outlineOpacity: { prop: 'strokeOpacity' },
                    width: { prop: 'strokeWidth' }
                };

                setStyleProperties(styles, properties, feature);
                var color;
                if (hasOwnProperty.call(properties.color, 'val')) {
                    if (hasOwnProperty.call(properties.opacity, 'val')) {
                        color = toCesiumColor(properties.color.val, properties.opacity.val);
                    } else {
                        color = toCesiumColor(properties.color.val);
                    }
                }

                opt.color = color;// cesium.ColorGeometryInstanceAttribute.fromColor(color);

                if (hasOwnProperty.call(properties.outlineColor, 'val')) {
                    if (hasOwnProperty.call(properties.outlineOpacity, 'val')) {
                        color = toCesiumColor(properties.outlineColor.val, properties.outlineOpacity.val);
                    } else {
                        color = toCesiumColor(properties.outlineColor.val);
                    }
                }

                opt.outlineColor = color;// cesium.ColorGeometryInstanceAttribute.fromColor(color);

                if (hasOwnProperty.call(properties.width, 'val')) {
                    opt.width = properties.width.val;
                }

                return opt;
            };

            circle.geometryType = function (coords, options) {

                return new cesium.GroundPrimitive({
                    releaseGeometryInstances: false,
                    geometryInstances: new cesium.GeometryInstance({
                        id: feature.id,
                        geometry: new cesium.CircleGeometry({
                            center: coords[0],
                            radius: feature.getRadius()
                        }),
                        attributes: {
                            color: options.color
                        }
                    })
                });

                // Para obtener el contorno de círculo 
                //var radius = feature.geometry[1];
                //var outlineEllipse = cesium.EllipseGeometryLibrary.computeEllipsePositions({
                //    semiMinorAxis: radius,
                //    semiMajorAxis: radius,
                //    rotation: 0,
                //    center: coords[0],
                //    granularity: cesium.Math.toRadians(0.5)
                //}, false, true);

                //var outerPositions = cesium.Cartesian3.unpackArray(outlineEllipse.outerPositions);

                //var outlineSize = getPixelSize(outerPositions);
                //var metersPerPixel = scene.camera.getPixelSize(cesium.BoundingSphere.fromPoints(outerPositions), scene.drawingBufferWidth, scene.drawingBufferHeight);
                //var outlineInMeters = metersPerPixel * outlineSize;

                //var outlineHoleEllipse = cesium.EllipseGeometryLibrary.computeEllipsePositions({
                //    semiMinorAxis: radius - outlineInMeters,
                //    semiMajorAxis: radius - outlineInMeters,
                //    rotation: 0,
                //    center: coords[0],
                //    granularity: cesium.Math.toRadians(0.5)
                //}, false, true);

                //var innerPositions = cesium.Cartesian3.unpackArray(outlineHoleEllipse.outerPositions);

                //var outlineCircleGeom = new cesium.GroundPrimitive({
                //    geometryInstances: new cesium.GeometryInstance({
                //        id: feature.id + 'outline',
                //        geometry: new cesium.PolygonGeometry({
                //            polygonHierarchy: new cesium.PolygonHierarchy(outerPositions, [new cesium.PolygonHierarchy(innerPositions)])
                //        }),
                //        attributes: {
                //            color: options.outlineColor
                //        }
                //    })
                //});
            };

            return circle;
        };
        var polygonConverter = function (feature) {
            var polygon = {};
            var styles = getFeatureStyle(feature);

            polygon.options = function () {
                var opt = {};
                var properties = {
                    color: { prop: 'fillColor' },
                    opacity: { prop: 'fillOpacity' },
                    outlineColor: { prop: 'strokeColor' },
                    outlineOpacity: { prop: 'strokeOpacity' },
                    width: { prop: 'strokeWidth' },
                    fontColor: { prop: 'fontColor' },
                    fontSize: { prop: 'fontSize' },
                    label: { prop: 'label' },
                };

                setStyleProperties(styles, properties, feature);
                var color;
                if (hasOwnProperty.call(properties.color, 'val')) {
                    if (hasOwnProperty.call(properties.opacity, 'val')) {
                        color = toCesiumColor(properties.color.val, properties.opacity.val);
                    } else {
                        color = toCesiumColor(properties.color.val);
                    }
                }

                opt.color = color;

                if (hasOwnProperty.call(properties.outlineColor, 'val')) {
                    if (hasOwnProperty.call(properties.outlineOpacity, 'val')) {
                        color = toCesiumColor(properties.outlineColor.val, properties.outlineOpacity.val);
                    } else {
                        color = toCesiumColor(properties.outlineColor.val);
                    }
                }

                opt.outlineColor = color;

                if (hasOwnProperty.call(properties.width, 'val')) {
                    opt.width = properties.width.val;
                }

                if (hasOwnProperty.call(properties.label, 'val')) {
                    opt.label = properties.label.val;

                    if (hasOwnProperty.call(properties.fontColor, 'val')) {
                        opt.fontColor = toCesiumColor(properties.fontColor.val);
                    }
                    if (hasOwnProperty.call(properties.fontSize, 'val')) {
                        opt.fontSize = properties.fontSize.val;
                    }
                }

                return opt;
            };

            if (feature instanceof MultiPolygon) {
                polygon.geometryType = function (coords, options) {
                    return new Promise(function (resolve, reject) {
                        var getting = [];

                        var geomPolys = [];
                        var geomOutlines = [];

                        var getPolyGeom = function (polygonHierarchy) {
                            return new cesium.GeometryInstance({
                                id: feature.id,
                                geometry: new cesium.PolygonGeometry({
                                    polygonHierarchy: polygonHierarchy
                                }),
                                attributes: {
                                    color: cesium.ColorGeometryInstanceAttribute.fromColor(options.color)
                                }
                            });
                        };

                        var getOutlineGeom = function (outlineCoords) {
                            return new Promise(function (res, _rej) {
                                createLine(feature.id, outlineCoords, { material: options.outlineColor, width: options.width }, function (entity) {
                                    geomOutlines.push(entity);
                                    res();
                                });
                            });
                        };

                        for (var i = 0; i < coords.length; i++) {
                            let hierarchy;
                            for (var j = 0; j < coords[i].length; j++) {
                                if (j == 0) {
                                    getting.push(getOutlineGeom.call(this, coords[i][0]));
                                    hierarchy = new cesium.PolygonHierarchy(coords[i][0]);
                                } else {
                                    getting.push(getOutlineGeom.call(this, coords[i][j]));
                                    hierarchy.holes.push(new cesium.PolygonHierarchy(coords[i][j]));
                                }
                            }

                            geomPolys.push(getPolyGeom(hierarchy));
                        }

                        Promise.all(getting).then(function () {
                            getting = [];
                            //resolve([geomOutlines]);
                            resolve(
                                [new cesium.GroundPrimitive({
                                    releaseGeometryInstances: false,
                                    geometryInstances: geomPolys
                                }), geomOutlines]);
                        }).catch(reject);
                    });
                };
            }
            else if (feature instanceof Polygon) {
                polygon.geometryType = function (coords, options) {
                    return new Promise(function (resolve, _reject) {
                        if (Array.isArray(coords) && coords.length === 1 && Array.isArray(coords[0])) {
                            coords = coords[0];
                        }
                        createPolygon(feature.id, coords,
                            options, function (entity) {

                                resolve(entity);
                            });
                    });
                };
            }

            return polygon;
        };
        var lineConverter = function (feature) {
            var line = {};
            var styles = getFeatureStyle(feature);

            line.options = function () {
                var opt = {};
                var properties = {
                    material: { prop: 'strokeColor' },
                    opacity: { prop: 'strokeOpacity' },
                    width: { prop: 'strokeWidth' },
                    fontColor: { prop: 'fontColor' },
                    fontSize: { prop: 'fontSize' },
                    label: { prop: 'label' },
                };

                setStyleProperties(styles, properties, feature);

                if (hasOwnProperty.call(properties.width, 'val')) {
                    opt.width = properties.width.val;
                }

                var color;
                if (hasOwnProperty.call(properties.material, 'val')) {
                    if (hasOwnProperty.call(properties.opacity, 'val')) {
                        color = toCesiumColor(properties.material.val, properties.opacity.val);
                    } else {
                        color = toCesiumColor(properties.material.val);
                    }
                }

                opt.material = color;

                if (hasOwnProperty.call(properties.width, 'val')) {
                    opt.width = properties.width.val;
                }

                if (hasOwnProperty.call(properties.label, 'val')) {
                    opt.label = properties.label.val;

                    if (hasOwnProperty.call(properties.fontColor, 'val')) {
                        opt.fontColor = toCesiumColor(properties.fontColor.val);
                    }
                    if (hasOwnProperty.call(properties.fontSize, 'val')) {
                        opt.fontSize = properties.fontSize.val;
                    }
                }

                return opt;
            };

            if (feature instanceof MultiPolyline) {
                line.geometryType = function (coords, options) {
                    return new Promise(function (resolve, reject) {
                        var geomInstances = [];

                        var getting = [];

                        if (coords.length == 1) {
                            coords = coords[0];

                            getting.push(new Promise(function (res, _rej) {
                                createLine(feature.id, coords, options, function (entity) {
                                    geomInstances.push(entity);
                                    res();
                                });
                            }));


                        } else {
                            coords = coords.sort(function (a, b) {
                                if (a.length > b.length) {
                                    return -1;
                                }
                                if (a.length < b.length) {
                                    return 1;
                                }
                                return 0;
                            });
                            var pixelSize = getPixelSize(coords[0]);
                            for (var i = 0; i < coords.length; i++) {

                                getting.push(new Promise(function (res, _rej) {
                                    createLine(feature.id, coords[i], options, function (entity) {
                                        geomInstances.push(entity);
                                        res();
                                    });
                                }));
                            }
                        }

                        Promise.all(getting).then(function () {
                            getting = [];

                            resolve(geomInstances);
                        }).catch(reject);
                    });
                };
            }
            else if (feature instanceof Polyline) {
                line.geometryType = function (coords, options) {
                    return new Promise(function (resolve, _reject) {

                        createLine(feature.id, coords, options, function (entity) {
                            resolve(entity);
                        });
                    });
                };
            }

            return line;
        };
        var pointConverter = function (feature) {
            var point = {};
            var styles = getFeatureStyle(feature);

            point.options = function () {
                var opt = {};

                var properties = {
                    rotation: { prop: 'angle' },
                    label: { prop: 'label' },
                    labelOffset: { prop: 'labelOffset' },
                    fontSize: { prop: 'fontSize' },
                    fontColor: { prop: 'fontColor' },
                    outlineLabelColor: { prop: 'labelOutlineColor' },
                    outlineLabelWidth: { prop: 'labelOutlineWidth' },
                    anchor: { prop: 'anchor' },
                    height: { prop: 'height' },
                    width: { prop: 'width' },
                    url: { prop: 'url' },
                    color: { prop: 'fillColor' },
                    opacity: { prop: 'fillOpacity' },
                    outlineColor: { prop: 'strokeColor' },
                    outlineOpacity: { prop: 'strokeOpacity' },
                    outlineWidth: { prop: 'strokeWidth' },
                    radius: { prop: 'radius' }
                };

                setStyleProperties(styles, properties, feature);

                if (hasOwnProperty.call(properties.anchor, 'val')) {
                    if (!hasOwnProperty.call(properties.url, 'val') && (feature.options.url || feature.options.cssClass)) {
                        opt.url = feature.options.url || TC.Util.getFeatureStyleFromCss(feature.options.cssClass)?.url;
                    } else {
                        opt.url = properties.url.val;
                    }

                    opt.anchor = properties.anchor.val;
                }

                if (hasOwnProperty.call(properties.height, 'val')) {
                    opt.height = properties.height.val;
                }

                if (hasOwnProperty.call(properties.width, 'val')) {
                    opt.width = properties.width.val;
                }

                if (hasOwnProperty.call(properties.rotation, 'val')) {
                    opt.rotation = properties.rotation.val;
                }

                if (hasOwnProperty.call(properties.label, 'val')) {
                    opt.label = properties.label.val;

                }

                if (hasOwnProperty.call(properties.fontSize, 'val')) {
                    opt.fontSize = properties.fontSize.val;
                    if (hasOwnProperty.call(properties.labelOffset, 'val')) {
                        opt.labelOffset = properties.labelOffset.val;
                    }
                }

                if (hasOwnProperty.call(properties.fontColor, 'val')) {
                    opt.fontColor = toCesiumColor(properties.fontColor.val);
                }

                if (hasOwnProperty.call(properties.outlineLabelColor, 'val')) {
                    opt.outlineLabelColor = toCesiumColor(properties.outlineLabelColor.val);
                }

                if (hasOwnProperty.call(properties.outlineLabelWidth, 'val')) {
                    opt.outlineLabelWidth = properties.outlineLabelWidth.val;
                }


                if (hasOwnProperty.call(properties.color, 'val')) {
                    if (hasOwnProperty.call(properties.opacity, 'val')) {
                        opt.color = toCesiumColor(properties.color.val, properties.opacity.val);
                    } else {
                        opt.color = toCesiumColor(properties.color.val);
                    }
                }

                if (hasOwnProperty.call(properties.outlineColor, 'val')) {
                    if (hasOwnProperty.call(properties.outlineOpacity, 'val')) {
                        opt.outlineColor = toCesiumColor(properties.outlineColor.val, properties.outlineOpacity.val);
                    } else {
                        opt.outlineColor = toCesiumColor(properties.outlineColor.val);
                    }
                }

                if (hasOwnProperty.call(properties.outlineWidth, 'val')) {
                    opt.outlineWidth = properties.outlineWidth.val;
                }

                if (hasOwnProperty.call(properties.radius, 'val')) {
                    opt.radius = properties.radius.val;
                }

                return opt;
            };

            if (feature instanceof Marker) {
                point.geometryType = function (coords, options) {
                    var billboard = {
                        name: feature.id,
                        position: coords[0],
                        billboard: {
                            image: options.url,
                            width: options.width,
                            height: options.height,
                            eyeOffset: new cesium.Cartesian3(0, 0, 10),
                            verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                            heightReference: cesium.HeightReference.CLAMP_TO_GROUND
                        }
                    };

                    if (options.anchor && options.anchor.length > 0) {
                        billboard.billboard.pixelOffset = new cesium.Cartesian2(options.anchor[0], options.anchor[1]);
                    }

                    if (!options.label) {
                        return new cesium.Entity(billboard);
                    } else {
                        billboard.label = {
                            text: options.label,
                            eyeOffset: new cesium.Cartesian3(0, 0, 0),
                            pixelOffset: new cesium.Cartesian2(...(options.labelOffset || [0,0])),
                            heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
                            horizontalOrigin: cesium.HorizontalOrigin.CENTER,
                            verticalOrigin: cesium.VerticalOrigin.CENTER,
                            font: options.fontSize + 'pt sans-serif',
                            fillColor: options.fontColor,
                            outlineColor: cesium.Color.WHITE,
                            outlineWidth: 4,
                            style: cesium.LabelStyle.FILL_AND_OUTLINE
                            //eyeOffset: new cesium.Cartesian3(3000, 0, -100)
                        };

                        return new cesium.Entity(billboard);
                    }
                };
            }
            else if (feature instanceof Point) {
                var pinBuilder = new cesium.PinBuilder();

                point.geometryType = function (coords, options) {
                    var text = options.label;
                    var entityOps = {
                        name: feature.id,
                        position: coords[0],
                    }
                    if (text && (/^([A-Z])\w+$/gi.test(text) || !(/^[0-9]*\-{0,1}[a-z]{0,4}$/gi.test(text)))){
                        createLabel(entityOps, options, coords[0]);
                    }
                        
                    if (text  && /^[0-9]*\-{0,1}[a-z]{0,4}$/gi.test(text)) {
                        entityOps["billboard"] = {
                            image: pinBuilder.fromText(text, options.fontColor, 48).toDataURL(),
                            eyeOffset: new cesium.Cartesian3(0, 0, 10),
                            verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                            heightReference: cesium.HeightReference.CLAMP_TO_GROUND
                        }
                    }
                    else if (options.radius && options.radius > 0) {
                        entityOps["point"] = {
                            color: options.color,
                            pixelSize: (options.radius * 2) - options.outlineWidth,
                            outlineWidth: options.outlineWidth,
                            outlineColor: options.outlineColor,
                            eyeOffset: new cesium.Cartesian3(0, 0, 10),
                            heightReference: cesium.HeightReference.CLAMP_TO_GROUND
                        }
                    }
                    else {
                        entityOps["billboard"] = {
                            image: pinBuilder.fromColor(cesium.Color.fromCssColorString(feature.options.fillColor ? feature.options.fillColor : TC.Cfg.styles.point.fillColor), 32).toDataURL(),
                            eyeOffset: new cesium.Cartesian3(0, 0, 10),
                            verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                            horizontalOrigin: cesium.HorizontalOrigin.CENTER,
                            heightReference: cesium.HeightReference.CLAMP_TO_GROUND
                        }
                    }

                    return new cesium.Entity(entityOps);
                };
            }

            return point;
        };

        this.convert = function (scn, feature, sourceCrs, targetCrs) {
            const self = this;
            scene = scn;

            var byPromise = false;
            var cartesians = [];
            var toCartesian = function (coord, arr) {
                if (!Array.isArray(coord)) {
                    return;
                }

                if (sourceCrs !== targetCrs) {
                    coord = Util.reproject(coord, sourceCrs, targetCrs);
                }

                arr.push(coord.length > 2 ?
                    cesium.Cartesian3.fromDegrees(coord[0], coord[1], coord[2]) :
                    cesium.Cartesian3.fromDegrees(coord[0], coord[1]));
            };

            var obj;
            var geometry = feature.geometry;
            var converter;

            var points,
                ringsOrPolylines,
                polygons;

            var forPoints = function (points, arr) {
                if (Array.isArray(points)) {
                    for (var i = 0; i < points.length; i++) {
                        toCartesian(points[i], arr);
                    }
                }
            };
            var forRingsOrPolylines = function (ringsOrPolylines, arr) {
                if (Array.isArray(ringsOrPolylines)) {
                    for (var i = 0; i < ringsOrPolylines.length; i++) {
                        arr.push([]);
                        forPoints(ringsOrPolylines[i], arr[arr.length - 1]);
                    }
                }
            };
            var forPolygons = function (polygons) {
                if (Array.isArray(polygons)) {
                    for (var i = 0; i < polygons.length; i++) {
                        cartesians.push([]);
                        forRingsOrPolylines(polygons[i], cartesians[cartesians.length - 1]);
                    }
                }
            };

            switch (true) {
                case feature instanceof MultiPolygon:
                    polygons = geometry;
                    if (Array.isArray(polygons)) {
                        forPolygons(polygons);

                        converter = polygonConverter.call(self, feature);
                        byPromise = true;
                    }
                    break;
                case feature instanceof Circle:
                    feature = feature.toPolygon();
                    geometry = feature.geometry;
                case feature instanceof Polygon || feature instanceof MultiPolyline:
                    ringsOrPolylines = geometry;
                    if (Array.isArray(ringsOrPolylines)) {
                        forRingsOrPolylines(ringsOrPolylines, cartesians);

                        if (feature instanceof Polygon) {
                            converter = polygonConverter(feature);
                            byPromise = true;
                        }
                        else if (feature instanceof MultiPolyline) {
                            converter = lineConverter(feature);
                            byPromise = true;
                        }
                    }
                    break;
                case feature instanceof Polyline:
                    points = geometry;
                    if (Array.isArray(points)) {
                        forPoints(points, cartesians);

                        converter = lineConverter(feature);
                        byPromise = true;
                    }
                    break;
                case feature instanceof Marker:
                    points = [geometry];
                    forPoints(points, cartesians);

                    converter = pointConverter(feature);
                    break;
                case feature instanceof Point:
                    points = [geometry];
                    forPoints(points, cartesians);

                    converter = pointConverter(feature);
                    break;
            }

            if (cartesians.length == 0) {
                return null;
            }

            obj = {
                id: feature.id,
                attributes: feature.data,
                boundigSphere: cesium.BoundingSphere.fromPoints(cartesians)
            };

            if (!byPromise) { // si estamos pintando líneas, obtenemos posiciones con altura
                obj.geometry = converter.geometryType(cartesians, converter.options());
            } else {
                obj.geometry = function (provider) {
                    converter.provider = provider;
                    return converter.geometryType(cartesians, converter.options());
                }
            }

            return obj;
        };
    };

    const currentMapCfg = {
        baseMap: '',
        baseMaps: [],
        baseVector: ''
    };
    const setMustReprojectOfBaseLayers = function (map) {
        const self = this;
        return new Promise(function (resolve, reject) {
            var isBaseRaster = map.baseLayer instanceof Raster;

            if (isBaseRaster) {
                if (!isCompatible(map.baseLayer, self.view3D.crs)) {
                    var fallbackLayer = map.baseLayer.getFallbackLayer();
                    if (fallbackLayer) {
                        fallbackLayer.getCapabilitiesPromise().then(function () {
                            if (!fallbackLayer.isCompatible(self.view3D.crs)) {
                                map.toast(self.getLocaleString('threed.baseLayerNoCompatible', { name: map.baseLayer.layerNames }));
                            }
                        });
                    }
                }
            } else {
                currentMapCfg.baseVector = map.baseLayer;
            }

            if (currentMapCfg.baseMaps.length === 0) {

                Promise.all(map.baseLayers.map(function (baseLayer) {
                    if (!isCompatible(baseLayer, self.view3D.crs)) {
                        var fallbackLayer = baseLayer.getFallbackLayer();
                        if (fallbackLayer) {
                            return fallbackLayer.getCapabilitiesPromise().then(function () {
                                return !fallbackLayer.isCompatible(self.view3D.crs);
                            });
                        } else {
                            return Promise.resolve(true);
                        }
                    } else {
                        return Promise.resolve(false);
                    }
                })).then(function (results) {
                    if (results.length > 0) {
                        for (var i = 0; i < map.baseLayers.length; i++) {
                            if (map.baseLayers[i]) {
                                map.baseLayers[i].mustReproject = results[i];
                            }
                        }

                        //map.trigger(Consts.event.VIEWCHANGE, { view: Consts.view.THREED });
                    }

                    resolve();
                }).catch(reject);
            }

            currentMapCfg.baseMap = isBaseRaster ? map.baseLayer : self.Consts.BLANK_BASE;
        });
    };

    viewProto.init = function (options) {
        const self = this;

        self.events = self.map.$events;

        self.selectors = {
            divThreedMap: options.div
        };

        if (options.terrain) {
            self.terrain = options.terrain;
        } else {
            self.terrain = {
                url: "//idena.navarra.es/cesiumTerrain/2017/epsg4326/5m/",
                noDataValue: 0,
                attributions: {
                    name: "Álvaro Huarte",
                    site: "https://github.com/ahuarte47"
                }
            };
        }

        if (options.terrainFallback)
            self.terrainFallback = (Array.isArray(options.terrainFallback) ? options.terrainFallback : [options.terrainFallback]).map((tfb) => {
                if (tfb && (!tfb.url || !(tfb.coverageName || tfb.layerName) || tfb.noDataValue === undefined)) {
                    return {
                        //"url": "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
                        //"type": "ARCGIS",
                        //url: "https://image.discomap.eea.europa.eu/arcgis/services/Elevation/EUElev_DEM_V11/MapServer/WCSServer",
                        //coverageName: "1",
                        //format: "GeoTIFF",
                        //url: "https://worldwind26.arc.nasa.gov/wcs?service=wcs",
                        //coverageName: "NASA_SRTM30_900m_Tiled",
                        //format: "png",
                        url: "https://image.discomap.eea.europa.eu/arcgis/services/Elevation/EUElev_DEM_V11/MapServer/WCSServer",
                        coverageName: "1",
                        format: "GeoTIFF",
                        noDataValue: -32767
                    }
                }
                else {
                    return {
                        url: tfb.url.trim(),
                        layerName: tfb.coverageName || tfb.layerName,
                        format: tfb.format,
                        noDataValue: tfb.noDataValue,
                        type: tfb.type
                    }
                }
            })

        if (options.controls) {
            self.allowedControls = options.controls;
        }

        self.mapView = new MapView(self.map, self);

        self.map.on(Consts.event.PROJECTIONCHANGE, function (_e) {
            self.mapView.metersPerUnit = self.map.getMetersPerUnit();
        });

        self.map.view3D = self.view3D;

        /* provisional: no dispongo de getRenderedHtml porque ya no es un control */
        self.getRenderedHtml(self.CLASS + '-overlay', {}, function (html) {
            const parser = new DOMParser();
            self.overlay = parser.parseFromString(html, 'text/html').body.firstChild;
        });
    };

    viewProto.apply = function (options = {}) {
        const self = this;

        if (options.map) {
            self.map = options.map;

            if (self.map.getDefaultControl() !== self.map.activeControl)
                self.map.activeControl?.deactivate();

            if (!self.map.view3D) {
                var viewName = self.VIEWNAME = self.VIEWNAME.substr(0, 1).toLowerCase() + self.VIEWNAME.substr(1);
                if (self.map.options.views && hasOwnProperty.call(self.map.options.views, viewName)) {
                    self.init(self.map.options.views[viewName]);
                } else {
                    throw Error('Falta configuración de la vista');
                }
            }

            self.view3D.view2DCRS = options.map.crs;

            options.map.on(Consts.event.PROJECTIONCHANGE, function (e) {
                self.view3D.view2DCRS = e.newCrs;
            });
        } else {
            throw Error('Falta referencia al mapa 2D');
        }

        if (options.state) {
            self.map.toast(Util.getLocaleString(self.map.options.locale, 'threed.apply3DState'), { type: Consts.msgType.INFO });
        }

        if (!self.waiting) {
            self.waiting = self.map.getLoadingIndicator().addWait();
        }

        if (!self.ctrlsToMng) {
            var ctls = [];
            for (var i = 0, len = self.allowedControls.length; i < len; i++) {
                var ctl = self.allowedControls[i];
                ctl = ctl.substr(0, 1).toUpperCase() + ctl.substr(1);
                var ctlsOnMap = self.map.getControlsByClass('TC.control.' + ctl);
                if (ctlsOnMap.length === 0) {
                    ctl = ctl.toUpperCase();
                    ctlsOnMap = self.map.getControlsByClass('TC.control.' + ctl);
                }
                ctls = ctls.concat(ctlsOnMap);
            }
            self.map.on(Consts.event.CONTROLADD, function (e) {
                //var instance = new Function("return new " + ctrlClass + "()")();
                if (self.allowedControls.some((ctl) => {
                    const className = ctl.substr(0, 1).toUpperCase() + ctl.substr(1);
                    return TC.control[className] && e.control instanceof TC.control[className];
                })) {
                    self.ctrlsToMng.push(e.control);
                }

            });

            self.ctrlsToMng = ctls;
        }

        self.map.on3DView = true;

        self.map.div.classList.add(Consts.classes.THREED);

        self.divThreedMap = document.querySelector('#' + self.selectors.divThreedMap);
        self.divThreedMap.classList.add(self.classes.MAP3D, self.classes.LOADING);

        self.view3D.container = self.divThreedMap;

        const applyEnd = function () {
            console.log('Llega a applyEnd');

            self.map.getLoadingIndicator().removeWait(self.waiting);

            delete self.waiting;

            if (options.callback) {
                options.callback();
            }
        };

        try {
            self.view3D.loadViewer.call(self)
                .then(function () {

                    self.divThreedMap.classList.remove(self.CLASS + '-div-fadeOut');
                    self.divThreedMap.classList.add(self.CLASS + '-div-fadeIn');
                    self.mapView.viewHTML.classList.remove(self.CLASS + '-div-fadeIn');
                    self.mapView.viewHTML.classList.add(self.CLASS + '-div-fadeOut');

                    if (!options.state) {
                        self.divThreedMap.classList.remove(self.classes.LOADING);
                    }

                    // mapas de fondo y capas
                    setMustReprojectOfBaseLayers.call(self, self.map)
                        .then(function () {
                            // extent
                            self.view3D.setCameraFromMapView.call(self);

                            // mapa de fondo
                            self.view3D.setBaseLayer.call(self, self.map.baseLayer);

                            // capas de trabajo
                            self.map.workLayers.filter(function (elem) {
                                return elem.type === Consts.layerType.WMTS || elem.type === Consts.layerType.WMS;
                            }).reverse().forEach(function (layer) {
                                self.view3D.addLayer.call(self, layer);
                            });

                            self.viewer.readyPromise.then(function () {

                                if (!self.view3D.cameraControls) self.view3D.cameraControls = new CameraControls(self);
                                else self.view3D.cameraControls.render.call(self.view3D.cameraControls);

                                if (!options.animateRendering && !options.state) {
                                    options.animateRendering = true;
                                }

                                if (options.state) {

                                    self.divThreedMap.classList.remove(self.classes.LOADING);

                                    var camera = self.view3D.cameraControls.getCamera();
                                    camera.flyTo({
                                        destination: cesium.Cartesian3.fromRadians(options.state.cp[0], options.state.cp[1], options.state.cp[2]),
                                        orientation: {
                                            heading: options.state.chpr[0],
                                            pitch: options.state.chpr[1],
                                            roll: options.state.chpr[2]
                                        },
                                        complete: applyEnd
                                    });

                                } else if (options.animateRendering) {
                                    let angle = cesium.Math.toRadians(50);
                                    let pickBP = pickBottomPoint(self.viewer.scene);

                                    const readyPickBP = function (_pickBP) {
                                        let matrixPickBP = cesium.Matrix4.fromTranslation(_pickBP);

                                        self.view3D.rotateAroundAxis(self.viewer.scene.camera, -angle,
                                            self.viewer.scene.camera.right, matrixPickBP, {
                                            duration: 2000,
                                            callback: animationCallback
                                        });
                                    };

                                    const animationCallback = function () {
                                        cesium.Camera.DEFAULT_VIEW_RECTANGLE = self.view3D.initialRectangle = self.viewer.camera.computeViewRectangle();
                                        cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

                                        applyEnd();
                                    };

                                    if (pickBP) {
                                        readyPickBP(pickBP);
                                    } else { /* revisado: si llegamos aquí, es que el terreno está listo pero del canvas al terreno da null, esperamos un poco más */
                                        // parece que es cosa de tiempos. Añado un setInterval

                                        let checkPickBPProcess;
                                        let startTime = new Date().getTime();

                                        const checkPickBottomPoint = function () {
                                            let _pickBP = pickBottomPoint(self.viewer.scene);
                                            if (_pickBP) {
                                                clearInterval(checkPickBPProcess);
                                                readyPickBP(_pickBP);
                                            } else {
                                                if (new Date().getTime() - startTime > 15000) {
                                                    clearInterval(checkPickBPProcess);
                                                    // aunque sea nos centramos en el extent inicial
                                                    const className = self.map.getControlsByClass(TC.control.NavBarHome).at(0)?.CLASS;
                                                    if (className) {
                                                        let homeButton = document.querySelectorAll('.' + className + '-btn');
                                                        if (homeButton && homeButton.length > 0) {
                                                            homeButton[0].click();
                                                        }
                                                    }
                                                    
                                                    animationCallback();
                                                    return;
                                                }
                                            }
                                        };

                                        checkPickBPProcess = setInterval(checkPickBottomPoint, 50);
                                    }

                                } else {
                                    applyEnd();
                                }

                                self.map.trigger(Consts.event.VIEWCHANGE, { view: Consts.view.THREED });

                                self.events.on(Consts.event.TERRAINLOADED, function () {

                                    const addHeight = function (position) {
                                        var cartographic = cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
                                        var height = self.viewer.scene.globe.getHeight(cartographic) || 0;
                                        var finalCartographic = {
                                            longitude: cartographic.longitude,
                                            latitude: cartographic.latitude,
                                            height: cartographic.height + height
                                        };

                                        return cesium.Ellipsoid.WGS84.cartographicToCartesian(finalCartographic);
                                    };

                                    var markers = self.viewer.entities.values.filter(function (entity) {
                                        return entity.billboard;
                                    });

                                    if (markers.length > 0) {
                                        markers.forEach(function (marker) {
                                            marker.position = addHeight(cesium.Property.getValueOrUndefined(marker.position, cesium.JulianDate.now));
                                        });
                                    }

                                    if (self.viewer.billboardCollection) {

                                        for (var i = 0; i < self.viewer.billboardCollection.length; i++) {
                                            self.viewer.billboardCollection.get(i).position = addHeight(self.viewer.billboardCollection.get(i).position);
                                        }

                                        self.viewer.scene.requestRender();
                                    }

                                });
                            }.bind(self))
                                .catch((err) => { console.log('3051'); applyEnd(); });
                        })
                        .catch((err) => {
                            console.log('3053'); applyEnd();
                        });
                })
                .catch((err) => { console.log('3055'); applyEnd(); });
        } catch (error) {
            applyEnd();

            throw error;
        }
    };

    viewProto.unapply = function (options) {
        const self = this;

        if (!self.waiting) {
            self.waiting = self.map.getLoadingIndicator().addWait();
        }

        if (self.map.getDefaultControl() !== self.map.activeControl)
            self.map.activeControl?.deactivate();

        //reproyectar features
        if (self.map.view3D.crs !== self.map.view3D.view2DCRS) {
            let dataSource = self.view3D.viewer.dataSources.getByName("drawn")[0];
            for (let layerId in self.map.view3D.vector2DFeatures)
                for (let featureId in self.map.view3D.vector2DFeatures[layerId])
                    self.map.view3D.vector2DFeatures[layerId][featureId].filter((entity) => entity instanceof cesium.Entity).forEach((entity) => {
                        if (!dataSource?.entities.contains(entity)) return;
                        const feature2D = entity._wrap.parent;
                        feature2D.setCoordinates(feature2D.getCoordinates({ geometryCrs: self.map.view3D.crs, crs: self.map.view3D.view2DCRS }));
                        delete feature2D.wrap.feature3D;
                    });
        }

        let dataSource = self.view3D.viewer.dataSources.getByName("drawn")[0];
        if (dataSource?.entities.length) {
            dataSource?.entities.removeAll();
        }
            

        self.map.on3DView = false;

        //self.map.view3D = null;
        if (self.viewer && self.viewer.trackedEntity) {
            self.view3D.linked2DControls.geolocation.wrap.simulateTrackEnd();
        }

        self.view3D.cameraControls.resetRotation({ duration: 1000 })
            .then(function () {

                var animationCallback = function () {

                    self.map.div.classList.remove(Consts.classes.THREED);

                    /* atribuciones del terreno */
                    self.map.trigger(Consts.event.TERRAINPROVIDERREMOVE, { terrainProvider: self.viewer.scene.terrainProvider });

                    if (self.viewer.scene.terrainProvider.fallbackProvider) {
                        self.viewer.scene.terrainProvider.fallbackProvider.forEach(function (provider) {
                            self.map.trigger(Consts.event.TERRAINPROVIDERREMOVE, { terrainProvider: provider });
                        });
                    }

                    self.view3D.setViewFromCameraView.call(self).then(function () {
                        self.divThreedMap.classList.remove(self.classes.MAP3D, self.CLASS + '-div-fadeIn');
                        self.divThreedMap.classList.add(self.CLASS + '-div-fadeOut');
                        self.mapView.viewHTML.classList.remove(self.CLASS + '-div-fadeOut');
                        self.mapView.viewHTML.classList.add(self.CLASS + '-div-fadeIn');



                        self.view3D.destroy.call(self);


                        self.map.getLoadingIndicator().removeWait(self.waiting);
                        delete self.waiting;

                        if (options?.callback) {
                            options.callback();
                        }
                    });

                    self.mapView.setRotation(0);
                    if (self._ovMap) {
                        self._ovMap.wrap.draw3DCamera(null);
                    }
                };

                var bottom = pickBottomPoint(self.viewer.scene);
                var transform = cesium.Matrix4.fromTranslation(bottom);
                var angle = computeAngleToZenith(self.viewer.scene, bottom);

                self.view3D.rotateAroundAxis(self.viewer.scene.camera, -angle, self.viewer.scene.camera.right, transform, {
                    duration: 1500,
                    callback: animationCallback
                });
            })
            .catch(function (e) {
                throw (e);
            });
    };

    viewProto.view3D = (function () {

        let _startDragPos = null;

        const rasterConverter = new RasterConverter(/(EPSG\:?4326)/i);
        const featureConverter = new FeatureConverter();

        const addFeature = function (csFeature,dataSource) {
            var addedFeature = csFeature;
            switch (true) {
                case csFeature instanceof cesium.GroundPrimitive: {
                    (dataSource || this.viewer.scene).groundPrimitives.add(csFeature);
                    break;
                }
                case csFeature instanceof Object && hasOwnProperty.call(csFeature, 'billboard'): {
                    if (!this.viewer.billboardCollection) {
                        this.viewer.billboardCollection = (dataSource || this.viewer.scene).primitives.add(new cesium.BillboardCollection({
                            scene: this.viewer.scene
                        }));
                    }

                    var billboardAtCollection = (dataSource || this.viewer).billboardCollection.add({
                        position: csFeature.position,
                        image: csFeature.billboard.image,
                        verticalOrigin: csFeature.billboard.verticalOrigin,
                        heightReference: csFeature.billboard.heightReference,
                        id: csFeature.billboard.id
                    });

                    addedFeature = billboardAtCollection;
                    break;
                }
                case csFeature instanceof Object: {
                    addedFeature = this.viewer.entities.getById(csFeature.id);
                    if (!addedFeature) {
                        addedFeature = (dataSource || this.viewer).entities.add(csFeature);
                    }
                    break;
                }
            }

            this.viewer.scene.requestRender();

            return addedFeature;
        };
        const linkFeature = function (map, feature2D, feature3D) {
            if (!hasOwnProperty.call(map.vector2DFeatures, feature2D.layer.id)) {
                map.vector2DFeatures[feature2D.layer.id] = {};
                map.vector2DFeatures[feature2D.layer.id][feature2D.id] = [feature3D];
            } else {
                if (!hasOwnProperty.call(map.vector2DFeatures[feature2D.layer.id], feature2D.id)) {
                    map.vector2DFeatures[feature2D.layer.id][feature2D.id] = [feature3D];
                } else {
                    map.vector2DFeatures[feature2D.layer.id][feature2D.id].push(feature3D);
                }
            }
            if (feature3D instanceof cesium.Entity) {
                feature2D.wrap.feature3D = feature3D;
                feature3D._wrap = { parent: feature2D };
                //if (map.view2DCRS !== map.crs)
                //    feature2D.setCoordinates(feature2D.getCoordinates({ geometryCrs: map.view2DCRS, crs: map.crs }));
            }
        };

        const listenTo = [
            Consts.event.BEFOREBASELAYERCHANGE, Consts.event.BASELAYERCHANGE,
            Consts.event.LAYERADD, Consts.event.LAYERREMOVE, Consts.event.LAYERVISIBILITY, Consts.event.LAYEROPACITY, Consts.event.LAYERORDER,
            Consts.event.FEATUREADD, Consts.event.FEATUREREMOVE, Consts.event.FEATURESCLEAR
            /*, Consts.event.ZOOM no encuentro en qué casos debemos escuchar el evento ZOOM de 2D, solo trae problemas */, Consts.event.ZOOMTO];

        const event2DHandler = function (e) {
            var self = this;

            switch (true) {
                //case e.type == Consts.event.BEFOREBASELAYERCHANGE:
                //    if (!self.waiting)
                //        self.waiting = self.map.getLoadingIndicator().addWait();
                //    break;
                case e.type == Consts.event.BASELAYERCHANGE: {
                    self.view3D.setBaseLayer.call(self, e.layer);
                    break;
                }
                case e.type == Consts.event.LAYERADD: {
                    self.view3D.addLayer.call(self, e.layer);
                    break;
                }
                case e.type == Consts.event.LAYERREMOVE: {
                    self.view3D.removeLayer.call(self, e.layer);
                    break;
                }
                case e.type == Consts.event.LAYERVISIBILITY: {
                    self.view3D.setRenderOptionsLayer.call(self, e.layer, { visibility: e.layer.getVisibility() });
                    break;
                }
                case e.type == Consts.event.LAYEROPACITY: {
                    self.view3D.setRenderOptionsLayer.call(self, e.layer, { opacity: e.layer.getOpacity() });
                    self.viewer.scene.requestRender();
                    break;
                }
                case e.type == Consts.event.LAYERORDER: {
                    for (var i = 0; i < self.view3D.workLayers.length; i++) {
                        if (self.view3D.workLayers[i].imageryProvider && self.view3D.workLayers[i].imageryProvider.layers.join(',') === e.layer.names.join(',')) {

                            if (e.oldIndex > e.newIndex) {
                                const positions = e.oldIndex - e.newIndex;
                                for (let p = 0; p < positions; p++) {
                                    self.viewer.scene.imageryLayers.lower(self.view3D.workLayers[i]);
                                }

                            } else {
                                const positions = e.newIndex - e.oldIndex;
                                for (let p = 0; p < positions; p++) {
                                    self.viewer.scene.imageryLayers.raise(self.view3D.workLayers[i]);
                                }
                            }

                            self.view3D.workLayers.splice(e.newIndex, 0, self.view3D.workLayers.splice(e.oldIndex, 1)[0]);
                            break;
                        }
                    }
                    break;
                }
                case e.type == Consts.event.FEATUREADD: {
                    if (!(e.layer?.owner && (e.layer.owner instanceof TC.control.DrawMeasureModify) ))
                        self.view3D.addFeature.call(self.view3D, e.feature);
                    break;
                }
                case e.type == Consts.event.FEATUREREMOVE: {

                    if (self.view3D.vector2DFeatures && hasOwnProperty.call(self.view3D.vector2DFeatures, e.layer.id)) {

                        const remove = function (feature) {
                            if (hasOwnProperty.call(self.view3D.vector2DFeatures[e.layer.id], feature.id)) {
                                var threedFeature = self.view3D.vector2DFeatures[e.layer.id][feature.id];
                                threedFeature.forEach(tdf => self.view3D.removeFeature.call(self, tdf));

                                delete self.view3D.vector2DFeatures[e.layer.id][feature.id];
                            }
                        };

                        if (e.feature instanceof Array) {
                            e.feature.forEach(remove);
                        } else {
                            remove(e.feature);
                        }
                    }
                    break;
                }
                case e.type == Consts.event.FEATURESCLEAR: {

                    if (self.view3D.vector2DFeatures && hasOwnProperty.call(self.view3D.vector2DFeatures, e.layer.id)) {
                        self.view3D.viewer.dataSources.getByName("drawing").forEach((ds) => {
                            ds.entities.removeAll();
                        });
                        self.view3D.viewer.dataSources.getByName("drawn").forEach((ds) => {
                            ds.entities.removeAll();
                        });

                        for (var featureId in self.view3D.vector2DFeatures[e.layer.id]) {
                            var threedFeature = self.view3D.vector2DFeatures[e.layer.id][featureId];
                            threedFeature.forEach(tdf => self.view3D.removeFeature.call(self, tdf));

                            delete self.view3D.vector2DFeatures[e.layer.id][featureId];
                        }
                    }

                    break;
                }
                case e.type == Consts.event.ZOOM: {
                    if (self.view3D.cameraControls && !self.view3D.cameraControls.moving) {

                        var width = self.view3D.viewer.scene.canvas.clientWidth;
                        var height = self.view3D.viewer.scene.canvas.clientHeight;


                        /* Si hemos llegado aquí y hay un cambio en el tamaño del canvas, 
                           viene el evento del resize canvas del mapa de 2D así que paso y no hago nada */
                        if (!self.view3D._canvasClientHeight ||
                            !self.view3D._canvasClientWidth ||

                            width !== self.view3D._canvasClientWidth ||
                            height !== self.view3D._canvasClientHeight) {

                            if (!self.view3D._canvasClientWidth) {
                                self.view3D._canvasClientWidth = self.view3D.viewer.scene.canvas.clientWidth;
                            }

                            if (!self.view3D._canvasClientHeight) {
                                self.view3D._canvasClientHeight = self.view3D.viewer.scene.canvas.clientHeight;
                            }

                            self.view3D._canvasClientWidth = width;
                            self.view3D._canvasClientHeight = height;

                            return;
                        }

                        self.view3D.flyToMapCoordinates.call(self, self.mapView.getCenter());
                    }
                    break;
                }
                case e.type == Consts.event.ZOOMTO: {

                    if (self.lastZoom && performance.now() - self.lastZoom < 50) {
                        return;
                    }
                    self.lastZoom = performance.now();

                    let rectangle = cesium.Rectangle.fromDegrees(...e.extent);                    
                    self.view3D.flyToRectangle.call(self, rectangle);
                    break;
                }
            }
        };

        /* geolocation */
        const geolocation_newPosition = function () {
            var self = this;

            if (!self.map.on3DView) {
                return;
            }

            if (!self.view3D.geotrackingEntity) {
                var geolocation2D = self.view3D.linked2DControls.geolocation;
                var track = geolocation2D.geotrackingLayer.features.filter(function (feature) {
                    return feature instanceof Polyline;
                });

                if (track && track.length > 0) {

                    var positions = [];
                    const positionCallback = new cesium.CallbackProperty(function (_time, _result) {
                        if (track[0].geometry.length > positions.length) {
                            var newCartographicPositions = track[0].geometry.slice(positions.length).map(function (coordinate) {
                                var reprojected = coordinate;

                                if (this.view3D.view2DCRS !== this.view3D.crs) {
                                    reprojected = Util.reproject(coordinate, this.view3D.view2DCRS, this.view3D.crs);
                                }

                                return cesium.Cartographic.fromDegrees(reprojected[0], reprojected[1], coordinate[2]);
                            }.bind(this));

                            var updatedPositions = [];
                            if (newCartographicPositions instanceof Array) {
                                updatedPositions = cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(newCartographicPositions);
                            } else {
                                updatedPositions = [cesium.Ellipsoid.WGS84.cartographicToCartesian(newCartographicPositions)];
                            }

                            positions = positions.concat(updatedPositions);
                            return positions;
                        }

                        return positions;

                    }.bind(this), false);

                    var entityGeotracking = new cesium.Entity({
                        id: "geotrackingEntity",
                        polyline: {
                            positions: positionCallback,
                            clampToGround: true,
                            width: 3,
                            material: new cesium.PolylineDashMaterialProperty({
                                color: new cesium.CallbackProperty(function (_time, _result) {
                                    self.viewer.scene.requestRender();
                                    return cesium.Color.fromAlpha(new cesium.Color(0, 255, 209), geolocation2D.track.renderTrack.checked ? 1 : 0);
                                }.bind(this), false),
                                gapColor: cesium.Color.TRANSPARENT
                            })
                        }
                    });

                    self.view3D.geotrackingEntity = self.viewer.entities.add(entityGeotracking);
                    self.viewer.scene.requestRender();
                }
            }
        };
        const geolocation_videoControls = function (event) {
            var self = this;

            var geolocation2D = self.view3D.linked2DControls.geolocation;
            switch (true) {
                case geolocation2D.const.event.IMPORTEDTRACK.indexOf(event.type) > -1:
                case event.target.className.indexOf('draw') > -1 && event.target.parentElement.classList.contains(geolocation2D.const.className.SELECTEDTRACK):
                case !(event.target.parentElement && event.target.parentElement.classList.contains(geolocation2D.const.className.SELECTEDTRACK)):
                case event.target.className.indexOf('stop') > -1:

                    if (self.map.on3DView) {
                        self.viewer.clock.shouldAnimate = false;
                        self.viewer.clock.currentTime = cesium.JulianDate.fromDate(new Date());
                    }

                    if (self.view3D.trackDataSource) {
                        if (self.view3D.trackDataSource.length > 0) {
                            var entity = self.view3D.trackDataSource.get(0).entities.values[0];
                            self.viewer.entities.removeById(entity.id);
                        }

                        self.view3D.trackDataSource.destroy();
                        delete self.view3D.trackDataSource;
                    }

                    geolocation2D.clearChartProgress();

                    if (event.custom) {
                        const selectedTrackItem = geolocation2D.getSelectedTrackItem();
                        if (selectedTrackItem) {
                            selectedTrackItem.querySelector(geolocation2D.const.selector.STOP).click();
                        }
                    }
                    break;
                case event.target.classList.contains(geolocation2D.const.className.PLAY):
                    self.viewer.clock.shouldAnimate = false;
                    break;
                case event.target.classList.contains(geolocation2D.const.className.PAUSE):
                    self.viewer.clock.shouldAnimate = true;
                    break;
            }
        };
        /* fin geolocation */
        const checkAvailabilityControl = function (mapCtrl, ctrlsToMngCLASS) {
            if (!mapCtrl.containerControl)
                return ctrlsToMngCLASS.indexOf(mapCtrl.CLASS)<0
            else
                return checkAvailabilityControl(mapCtrl.containerControl, ctrlsToMngCLASS)
        }
        const alterAllowedControls = function (view) {
            var self = this;
            const ctrlsToMngCLASS = self.ctrlsToMng.map(function (ctrl) { return ctrl.CLASS });

            self.map.controls.forEach(function (mapCtrl) {
                if (checkAvailabilityControl(mapCtrl, ctrlsToMngCLASS)) {
                    switch (true) {
                        case (Consts.view.DEFAULT == view):
                            mapCtrl.enable();
                            break;
                        case (Consts.view.THREED == view):
                            mapCtrl.disable();
                            break;
                    }
                }
            });

            switch (true) {
                case (Consts.view.DEFAULT == view):
                    document.querySelectorAll('[data-no-3d]').forEach(function (elm) {
                        elm.classList.remove(Consts.classes.THREED_HIDDEN);
                    });
                    self.ctrlsToMng.forEach(function (ctl) {
                        ctl.div.classList.remove(Consts.classes.THREED);
                    });
                    break;
                case (Consts.view.THREED == view):
                    document.querySelectorAll('[data-no-3d]').forEach(function (elm) {
                        elm.classList.add(Consts.classes.THREED_HIDDEN);
                    });
                    self.ctrlsToMng.forEach(function (ctl) {
                        ctl.div.classList.add(Consts.classes.THREED);
                    });
                    break;
            }
            var isDragging = false;
            var draggingFeature = null;
            const arrayDePuntos = [];//temporalmente aqui
            const onLeftClickOnCanvas = (movement) => {

                // Si estamos anclados a una entidad ignoro los click en el terreno
                if (self.viewer.trackedEntity) {
                    return;
                }

                const getFeatureInfo = function () {
                    var ray = self.viewer.camera.getPickRay(movement.position);
                    var position = self.viewer.scene.globe.pick(ray, self.viewer.scene);
                    if (position) {
                        self.view3D.getInfoOnPickedPosition.call(self, position);
                    }
                };

                if (self.map.activeControl instanceof Draw || self.map.activeControl instanceof Modify) {
                    let position = self.viewer.scene.pickPosition(movement.position);
                    arrayDePuntos[arrayDePuntos.length] = position;
                }
                else {
                    var pickedFeature = self.viewer.scene.pick(movement.position);
                    if (pickedFeature && pickedFeature.id) {
                        var id = pickedFeature.id instanceof cesium.Entity ? pickedFeature.id.name : pickedFeature.id;

                        var founded = false;
                        for (var layerId in self.view3D.vector2DFeatures) {
                            if (hasOwnProperty.call(self.view3D.vector2DFeatures[layerId], id)) {
                                const feature2D = self
                                    .map
                                    .workLayers
                                    .find(workLayer => workLayer.id === layerId)
                                    .features
                                    .filter(feature => id.indexOf(feature.id) > -1 && feature.showsPopup);

                                if (feature2D && feature2D.length > 0) {
                                    founded = true;

                                    if (!(feature2D instanceof Point) && !(feature2D instanceof Marker)) {

                                        var ray = self.viewer.camera.getPickRay(movement.position);
                                        let position = self.viewer.scene.globe.pick(ray, self.viewer.scene);

                                        var marker = self.map.view3D.addNativeFeature.call(self.map, {
                                            position: position,
                                            billboard: {
                                                image: Util.getFeatureStyleFromCss(self.CLASS + '-marker')?.url,
                                                eyeOffset: new cesium.Cartesian3(0, 0, -100),
                                                verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                                                heightReference: cesium.HeightReference.CLAMP_TO_GROUND
                                            }
                                        });

                                        const onDrawTable = function (e) {
                                            if (e.control) {
                                                const control = e.control;
                                                const onTableClose = function (e) {
                                                    if (e.control === control) {
                                                        self.map.off(Consts.event.RESULTSPANELCLOSE, onTableClose);
                                                        self.map.view3D.removeFeature.call(self, marker);
                                                    }
                                                };
                                                self.map.on(Consts.event.RESULTSPANELCLOSE, onTableClose);
                                                self.map.off(Consts.event.DRAWTABLE, onDrawTable);
                                            }
                                        }                                        
                                        self.map.on(Consts.event.DRAWTABLE, onDrawTable);                                        
                                    }
                                    //self.map.getControlsByClass(TC.control.ResultsPanel).find((rp) => rp?.currentFeature === feature2D[0])?.close()
                                    self.map.getControlsByClass(TC.control.ResultsPanel).find((rp) => rp.isVisible())?.close();
                                    self.map.trigger(Consts.event.FEATURECLICK, { feature: feature2D[0] });

                                    break;
                                }

                            }
                        }

                        if (!founded) {
                            getFeatureInfo();
                        }
                    } else {
                        getFeatureInfo();
                    }
                }


            };
            let _blockDragging = false;
            const onMouseMoveOnCanvas = (movement) => {
                // Si estamos anclados a una entidad ignoro los click en el terreno                
                if (self.viewer.trackedEntity) {
                    return;
                }
                var pickedFeature = self.viewer.scene.pick(movement.endPosition);
                //if (pickedFeature && pickedFeature.id && (!self.view3D.threeDDraw.IsSketchEntity(pickedFeature) && self.view3D.threeDDraw.CanIUseEntity(pickedFeature))) {
                if (pickedFeature && pickedFeature.id && !(self.map.activeControl instanceof Draw)) {
                    self.viewer.canvas.style.cursor = 'pointer';
                } else {
                    self.viewer.canvas.style.cursor = 'default';
                }
                if (isDragging && draggingFeature && !_blockDragging) {
                    const newPosition = self.viewer.scene.globe.pick(self.viewer.camera.getPickRay(movement.endPosition), self.viewer.scene);
                    draggingFeature.primitive.position = newPosition;
                    //bloqueamos el drag de entidades a cada 200 milisegundos
                    _blockDragging = true;
                    self.viewer.scene.requestRender();
                    setTimeout(function () {
                        _blockDragging = false;

                    }, 200);

                }

            };
            const onLeftDownOnCanvas = (movement) => {
                var pickedFeature = self.viewer.scene.pick(movement.position);
                if (pickedFeature && pickedFeature.id) {
                    isDragging = true;
                    _startDragPos = self.viewer.scene.globe.pick(self.viewer.camera.getPickRay(movement.position), self.viewer.scene);
                    draggingFeature = pickedFeature;
                    self.viewer.scene.screenSpaceCameraController.enableInputs = false;
                }
            };
            const onLeftUpOnCanvas = (movement) => {
                isDragging = false;
                if (draggingFeature) {
                    const newPosition = self.viewer.scene.globe.pick(self.viewer.camera.getPickRay(movement.position), self.viewer.scene);
                    draggingFeature.primitive.position = newPosition;
                    var positionCartographic = cesium.Ellipsoid.WGS84.cartesianToCartographic(newPosition);
                    var positionCartographicOld = cesium.Ellipsoid.WGS84.cartesianToCartographic(_startDragPos);
                    //const newPosition = cesium.Cartographic.fromCartesian(movement.position);
                    self.map.trigger(Consts.event.THREED_DRAG, { pickedFeature: draggingFeature.primitive, newCoords: [cesium.Math.toDegrees(positionCartographic.longitude), cesium.Math.toDegrees(positionCartographic.latitude)], oldCoords: [cesium.Math.toDegrees(positionCartographicOld.longitude), cesium.Math.toDegrees(positionCartographicOld.latitude)] });
                    draggingFeature = null;
                    self.viewer.scene.screenSpaceCameraController.enableInputs = true;
                    
                }
            };

            if (Consts.view.THREED === view) {

                if (!self.view3D.linked2DControls.featureInfo &&
                    Object.keys(self.map.options.controls).indexOf("featureInfo") > -1 &&
                    self.allowedControls.indexOf("featureInfo") > -1) {
                    self.view3D.linked2DControls.featureInfo = new TwoDLinkedFeatureInfo(self);
                }

                if (!self.eventHandlers) {
                    self.eventHandlers = {};
                }

                self.eventHandlers.handlerOfFeatures = new cesium.ScreenSpaceEventHandler(self.viewer.scene.canvas);
                self.eventHandlers.handlerOfFeatures.setInputAction(onLeftClickOnCanvas, cesium.ScreenSpaceEventType.LEFT_CLICK);
                self.eventHandlers.handlerOfFeatures.setInputAction(onMouseMoveOnCanvas, cesium.ScreenSpaceEventType.MOUSE_MOVE);
                self.eventHandlers.handlerOfFeatures.setInputAction(onLeftDownOnCanvas, cesium.ScreenSpaceEventType.LEFT_DOWN);
                self.eventHandlers.handlerOfFeatures.setInputAction(onLeftUpOnCanvas, cesium.ScreenSpaceEventType.LEFT_UP);

            } else if (Consts.view.DEFAULT === view) {
                if (self.eventHandlers.handlerOfFeatures) {
                    self.eventHandlers.handlerOfFeatures.destroy();
                }
            }

            if (!self.view3D.linked2DControls.geolocation &&
                Object.keys(self.map.options.controls).indexOf("geolocation") > -1 &&
                self.allowedControls.indexOf("geolocation") > -1) {
                self.view3D.linked2DControls.geolocation = self.ctrlsToMng.find(function (ctrl) {
                    return ctrl instanceof TC.control.Geolocation;
                });
            }

            if (self.view3D.linked2DControls.geolocation) {

                var geolocation2D = self.view3D.linked2DControls.geolocation;

                if (Consts.view.THREED === view) {

                    var commands = [geolocation2D.const.selector.STOP,
                    geolocation2D.const.selector.PAUSE,
                    geolocation2D.const.selector.BACKWARD,
                    geolocation2D.const.selector.FORWARD];
                    var geolocation_videoControls_ = geolocation_videoControls.bind(self);
                    self.view3D.linked2DControls.geolocation.videoControls = geolocation_videoControls_;

                    var lstEventListener = function (e) {
                        var classes = commands;
                        if (commands.some(function (cls) {
                            return e.target.classList.contains(cls.replace('.', ''))
                        })) {
                            geolocation_videoControls_(e);
                        }
                    };

                    geolocation2D.reset = function () {

                        TC.wrap.control.Geolocation.prototype.setGeotracking = geolocation2D._setGeotracking;
                        TC.wrap.control.Geolocation.prototype.simulateTrack = geolocation2D._wrap_simulateTrack;

                        geolocation2D.simulateTrack = geolocation2D._simulateTrack;
                        geolocation2D.displayTrackProfile = geolocation2D._displayTrackProfile;

                        commands.forEach(function (_command) {
                            document.removeEventListener('click', lstEventListener);
                        });

                        geolocation2D.off(geolocation2D.const.event.IMPORTEDTRACK, geolocation_videoControls_);

                    };

                    document.addEventListener('click', lstEventListener);

                    geolocation2D.on(geolocation2D.const.event.IMPORTEDTRACK, geolocation_videoControls_);


                    var _newPosition = false;
                    geolocation2D._setGeotracking = TC.wrap.control.Geolocation.prototype.setGeotracking;
                    TC.wrap.control.Geolocation.prototype.setGeotracking = function (tracking) {

                        geolocation2D._setGeotracking.call(geolocation2D.wrap, tracking);

                        if (tracking) {
                            geolocation2D.on(geolocation2D.const.event.POSITIONCHANGE, geolocation_newPosition.bind(self));
                        } else {
                            _newPosition = false;
                            geolocation2D.off(geolocation2D.const.event.POSITIONCHANGE, geolocation_newPosition.bind(self));
                            if (self.view3D.geotrackingEntity) {
                                self.viewer.entities.removeById(self.view3D.geotrackingEntity.id);
                                delete self.view3D.geotrackingEntity;
                            }
                        }
                    };

                    geolocation2D._displayTrackProfile = geolocation2D.displayTrackProfile;
                    geolocation2D.displayTrackProfile = function (li, options) {

                        if (options?.resized) {
                            geolocation_videoControls.call(self, { target: { className: 'stop' }, custom: true });
                        }

                        return geolocation2D._displayTrackProfile.call(geolocation2D, li, options);
                    };

                    // Si en el paso de 2D a 3D hay perfil dibujado, lanzamos el resize
                    const selectedTrackItem = geolocation2D.getSelectedTrackItem();
                    if (selectedTrackItem && geolocation2D.hasElevation) {
                        geolocation2D.displayTrackProfile.call(self, selectedTrackItem, { resized: true });
                    }

                    var simulationOnPreUpdate; // listener de la simulación.
                    geolocation2D._simulateTrack = geolocation2D.simulateTrack;
                    geolocation2D.simulateTrack = function (li) {
                        var self = this.view3D.linked2DControls.geolocation;

                        self.map.toast(self.getLocaleString('threed.interactionSimulation'), { type: Consts.msgType.INFO });

                        // tenemos una simulación activa
                        if (this.viewer.clock.shouldAnimate && this.view3D.trackDataSource) {
                            simulationOnPreUpdate();
                            geolocation_videoControls.call(this, { target: { className: 'stop' }, custom: true });
                        }

                        self.simulationSpeed = 1;
                        self.drawTrack(li, false).then(function () {
                            self.wrap.simulateTrack();

                            if (self.trackLayer && self.trackLayer.features) {
                                var track = self.trackLayer.features.find(function (feature) {
                                    return feature instanceof Polyline;
                                });

                                if (track) {
                                    toCZML.call(this, track.geometry, track.wrap.feature.getGeometry().layout, "track", self.markerStyle, self.lineStyle, self.walkingSpeed).then(function (result) {
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

                                            this.viewer.entities.add(trackEntity);

                                            this.viewer.flyTo(trackEntity).then(function () {

                                                this.viewer.trackedEntity = trackEntity;

                                                function get2DHeightAtProgress(coordinates2D, distanceCurrent) {
                                                    var coordinate;

                                                    var doneDistance = 0;

                                                    var reprojected = this.view3D.view2DCRS !== this.view3D.crs ? Util.reproject(coordinates2D[0], this.view3D.view2DCRS, this.view3D.crs) : coordinates2D[0];
                                                    var previous = new cesium.Cartographic.fromDegrees(reprojected[0], reprojected[1]);

                                                    for (var i = 1; i < coordinates2D.length; i++) {
                                                        reprojected = this.view3D.view2DCRS !== this.view3D.crs ? Util.reproject(coordinates2D[i], this.view3D.view2DCRS, this.view3D.crs) : coordinates2D[i];
                                                        var current = new cesium.Cartographic.fromDegrees(reprojected[0], reprojected[1]);

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
                                                    if (!selectedTrackItem || selectedTrackItem.getAttribute('data-id') !== trackEntity.tagLI.getAttribute('data-id') ||
                                                        // o hemos llegado al final
                                                        cesium.JulianDate.greaterThanOrEquals(currentTime, trackEntity.availability.stop)) {

                                                        simulationOnPreUpdate();
                                                        geolocation_videoControls.call(this, { target: { className: 'stop' }, custom: true });

                                                    } else if (this.viewer.clock.shouldAnimate && trackEntity.isAvailable(currentTime)) {

                                                        // gestionamos las posiciones anterior y actual
                                                        if (!previousPosition) {
                                                            previousPosition = cesium.Cartographic.fromCartesian(cesium.Property.getValueOrUndefined(trackEntity.position, trackEntity.availability.start));
                                                        }
                                                        const currentPosition = cesium.Cartographic.fromCartesian(cesium.Property.getValueOrUndefined(trackEntity.position, currentTime));

                                                        // progreso en el perfil (si lo hay)
                                                        if (this.view3D.linked2DControls.geolocation.hasElevation) {
                                                            var timeIndex = trackEntity.layout === 'XYZM' ? 3 :
                                                                trackEntity.layout === 'XYM' ? 2 : 3;

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

                                                        this.viewer.scene.requestRender();
                                                    }
                                                }.bind(this));

                                                this.viewer.clock.shouldAnimate = true;

                                            }.bind(this));

                                            //self.view3D.customRender.restart();
                                            this.viewer.scene.requestRender();

                                        }.bind(this, track.wrap.feature.getGeometry().layout, coordinates2D));
                                    }.bind(this));
                                }
                            }
                        }.bind(this));

                    }.bind(self);

                    geolocation2D._wrap_simulateTrack = TC.wrap.control.Geolocation.prototype.simulateTrack;
                    TC.wrap.control.Geolocation.prototype.simulateTrack = function () {
                        var self = this;
                    };
                } else {
                    // Si en el paso de 3D a 2D hay perfil dibujado, lanzamos el resize
                    const selectedTrackItem = self.view3D.linked2DControls.geolocation.getSelectedTrackItem();
                    if (selectedTrackItem && self.view3D.linked2DControls.geolocation.hasElevation) {

                        geolocation2D._displayTrackProfile.call(self.view3D.linked2DControls.geolocation, selectedTrackItem, true);
                    }
                }
            }

        };

        const draw2DDrawedFeatures = function () {
            var self = this;
            self.map.workLayers.filter(function (layer) {
                return layer instanceof Vector && layer.features?.length;
            }).forEach(function (vectorLayer) {
                if (vectorLayer.owner && (vectorLayer.owner instanceof TC.control.DrawMeasureModify || vectorLayer.owner instanceof TC.control.Draw)) {
                    vectorLayer.owner.wrap.interation3D = new self.map.view3D.UI.DrawControl();
                }
                vectorLayer.features.forEach(function (feature) {
                    if (vectorLayer.owner instanceof TC.control.DrawMeasureModify || vectorLayer.owner instanceof TC.control.Draw) {
                        const dataSource = self.view3D.viewer.dataSources.getByName("drawn")[0]
                        if (dataSource) {                            
                            self.view3D.addFeature.call(self.view3D, feature, dataSource);
                            if (self.view3D.view2DCRS !== self.view3D.crs)
                                feature.setCoordinates(feature.getCoordinates({ geometryCrs: self.view3D.view2DCRS, crs: self.view3D.crs }));
                                
                        }                        
                    }                        
                    else
                        self.view3D.addFeature.call(self.view3D, feature);
                });
            });
        };

        var initialExtent, zoomin, zoomout;
        const override2DZoom = function (activate) {
            var self = this;

            var amount = 200.0;

            var zoom = function (amount) {
                var self = this;

                var center = new cesium.Cartesian2(
                    self.viewer.scene.canvas.clientWidth / 2,
                    self.viewer.scene.canvas.clientHeight / 2);

                /*
                var x = center.x;
                var y = center.y;
                var event = new window.WheelEvent ("wheel", {deltaY: -100,
                    deltaMode: 0,
                    DOM_DELTA_PIXEL: 0,
                    DOM_DELTA_LINE: 1,
                    detail: 0,
                    wheelDelta: 120,
                    layerX: x, layerY: y,
                    clientX: x, clientY: y,
                    offsetX: x, offsetY: y,
                    pageX: x, pageY: y,
                    screenX: x, screenY: y
                });
                self.viewer.scene.canvas.dispatchEvent(event);*/

                self.view3D.zoomToCartesian.call(self, { endPosition: center }, amount);
            };

            if (activate) {
                initialExtent = function (e) {
                    var self = this;

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    var sourceCRS = self.view3D.view2DCRS;
                    if (self.map.options.crs !== self.view3D.view2DCRS) {
                        sourceCRS = self.map.options.crs;
                    }

                    var coordsXY = Util.reproject(self.map.options.initialExtent.slice(0, 2), sourceCRS, self.view3D.crs);
                    var coordsXY2 = Util.reproject(self.map.options.initialExtent.slice(2), sourceCRS, self.view3D.crs);
                    var rectangle = cesium.Rectangle.fromDegrees(coordsXY[0], coordsXY[1], coordsXY2[0], coordsXY2[1]);

                    self.view3D.flyToRectangle.call(self, rectangle, { duration: 0.1 });

                    return false;

                }.bind(self);

                zoomin = function (_e) {
                    zoom.call(self, amount);
                }.bind(self);

                zoomout = function (_e) {
                    zoom.call(self, -amount);
                }.bind(self);

                document.querySelectorAll('.' + TC.control.NavBarHome.prototype.CLASS + '-btn').forEach(function (button) {
                    button.addEventListener('click', initialExtent);
                });
                document.querySelectorAll('.' + TC.control.NavBar.prototype.CLASS + '-btn-zoomin').forEach(function (button) {
                    button.addEventListener('click', zoomin);
                });
                document.querySelectorAll('.' + TC.control.NavBar.prototype.CLASS + '-btn-zoomout').forEach(function (button) {
                    button.addEventListener('click', zoomout);
                });
            }
            else {
                document.querySelectorAll('.' + TC.control.NavBarHome.prototype.CLASS + '-btn').forEach(function (button) {
                    button.removeEventListener('click', initialExtent);
                });
                document.querySelectorAll('.' + TC.control.NavBar.prototype.CLASS + '-btn-zoomin').forEach(function (button) {
                    button.removeEventListener('click', zoomin);
                });
                document.querySelectorAll('.' + TC.control.NavBar.prototype.CLASS + '-btn-zoomout').forEach(function (button) {
                    button.removeEventListener('click', zoomout);
                });
            }
        };

        const fromTCtoCesiumEvent = function (eventTC) {
            if (Consts.event.MOUSEMOVE === eventTC) {
                return Util.detectMobile() ? cesium.ScreenSpaceEventType.LEFT_CLICK : cesium.ScreenSpaceEventType.MOUSE_MOVE;
            } else if (Consts.event.CLICK === eventTC) {
                return cesium.ScreenSpaceEventType.LEFT_CLICK;
            }

            return eventTC;
        };

        return {

            container: null,

            crs: 'EPSG:4326',
            crsPattern: /(EPSG\:?4326)/i,

            view2DCRS: null,

            customRender: null,

            baseLayer: null,

            workLayers: [],
            vector2DLayers: [],
            vector2DFeatures: {},

            linked2DControls: {},

            isLoadingTiles: function () {
                var self = this;

                var surface = self.viewer.scene.globe._surface;
                return !surface._tileProvider.ready ||
                    surface._tileLoadQueueHigh.length > 0 ||
                    surface._tileLoadQueueMedium.length > 0 ||
                    surface._tileLoadQueueLow.length > 0 ||
                    surface._debug.tilesWaitingForChildren > 0;
            },

            loadViewer: function () {
                const self = this;
                return new Promise(function (resolve, _reject) {
                    if (!self.viewer) {
                        import('../cesium/cesium').then(async function (module) {
                            const cesium = module.default;

                            var boundariesNavarra = null, boundariesEspana = null;
                            try {
                                boundariesNavarra = await cesium.Resource.fetchJson({ url: TC.apiLocation + "resources/data/contornoNavarra.json" }).then(function (bounds) {
                                    if (bounds && bounds.features && bounds.features.length > 0) {
                                        return bounds.features[0].geometry.coordinates;
                                    } else {
                                        return [];
                                    }
                                });
                            }
                            catch (ex) {
                                console.warn("No se ha encontrado contorno de Navarra")
                            }
                            try {
                                boundariesEspana = await cesium.Resource.fetchJson({ url: TC.apiLocation + "resources/data/contornoEspana.json" }).then(function (bounds) {
                                    if (bounds && bounds.features && bounds.features.length > 0) {
                                        return bounds.features[0].geometry.coordinates;
                                    } else {
                                        return [];
                                    }
                                });
                            }
                            catch (ex) {
                                console.warn("No se ha encontrado contorno de España")
                            }
                            cesium.ApproximateTerrainHeights.initialize().then(function (){

                                var terrainFallback;
                                if (self.terrainFallback) {
                                    terrainFallback = self.terrainFallback
                                }
                                const boundaries = [boundariesNavarra, boundariesEspana].filter(x => x !== undefined && x!==null);                                
                                var terrainProvider;
                                if (self.terrainFallback && boundaries.length) {

                                    terrainProvider = new cesium.MergeTerrainProvider(self.terrain, self, {
                                        boundaries: boundaries,
                                        //boundaries: boundaries,
                                        fallback: self.terrainFallback
                                    });
                                } else {
                                    if (self.terrainFallback && !boundaries.length) {
                                        console.warn("Se ha definido fallckback de terreno pero no se ha especificado contorno");
                                    }
                                    terrainProvider = new cesium.CesiumTerrainProvider({
                                        url: self.terrain.url.trim()
                                    });

                                    terrainProvider.sampleTerrainMostDetailed = function (positions) {
                                        return cesium.sampleTerrainMostDetailed(terrainProvider, positions);
                                    };

                                    terrainProvider.attributions = {
                                    };

                                    if (self.terrain.attributions) {

                                        terrainProvider.getAttribution = function () {
                                            return terrainProvider.attributions;
                                        };

                                        terrainProvider.attributions = self.terrain.attributions;
                                        self.map.trigger(Consts.event.TERRAINPROVIDERADD, { terrainProvider: terrainProvider });
                                    }
                                }

                                var globe = new cesium.Globe();
                                globe.baseColor = cesium.Color.WHITE;
                                globe.enableLighting = false;

                                /* carga más rápido pero consume RAM a cascoporro */
                                globe.tileCacheSize = 1000;

                                /* por defecto 2, a mayor número mayor rendimiento y peor calidad visual */
                                globe.maximumScreenSpaceError = 5;

                                self.viewer = self.view3D.viewer = new cesium.Viewer(self.selectors.divThreedMap, {
                                    terrainProvider: terrainProvider,
                                    terrainExaggeration: 1.0,

                                    animation: false,
                                    timeline: false,
                                    fullscreenButton: false,
                                    baseLayerPicker: false,
                                    imageryProvider: false,
                                    navigationInstructionsInitiallyVisible: false,
                                    navigationHelpButton: false,
                                    geocoder: false,
                                    homeButton: false,
                                    infoBox: false,
                                    sceneModePicker: false,
                                    selectionIndicator: false,
                                    globe: globe,

                                    //skyBox: false,
                                    //skyAtmosphere: false,

                                    requestRenderMode: true,
                                    maximumRenderTimeChange: Infinity
                                });

                                // personalización de la escena                                    
                                self.viewer.scene.backgroundColor = cesium.Color.WHITE;
                                self.viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
                                self.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 1000000;

                                //// con false las líneas se manetienen sobre el terreno
                                //self.viewer.scene.globe.depthTestAgainstTerrain = false;

                                // borramos cualquier capa que haya
                                self.viewer.scene.imageryLayers.removeAll();

                                // registramos listeners para capturar errores del terreno y del render
                                self.viewer.terrainProvider.errorEvent.addEventListener(function (e) {
                                    var self = this;
                                    if (e.error) {
                                        switch (e.error.statusCode) {
                                            case 403:
                                            case 404:
                                                console.log('es un 404 de terreno');
                                                break;
                                        }
                                    }
                                }, self);
                                self.viewer.scene.renderError.addEventListener(function (target, error) {
                                    var self = this;

                                    if (error && error.code === 18) { // GLS: 18 - SECURITY_ERR                              

                                    } else {
                                        self.divThreedMap.classList.remove(self.classes.LOADING);
                                        self.map.toast(self.getLocaleString("fi.error"), { type: Consts.msgType.ERROR });

                                        self.map.getControlsByClass('TC.control.ThreeD').forEach(ctl => ctl.unset3D());
                                    }
                                }, self);

                                self.viewer.readyPromise = new Promise(function (resolve, _reject) {

                                    // controlamos la carga de tiles para mostrar loading cuando pida tiles
                                    self.view3D.tileLoadingHandler = new cesium.EventHelper();
                                    self.view3D.tileLoadingHandler.add(self.viewer.scene.globe.tileLoadProgressEvent, function (data) {
                                        if (!self.waiting)
                                            self.waiting = self.map.getLoadingIndicator().addWait();
                                        if ((self.viewer.scene.terrainProvider.allReady ||
                                            (!self.viewer.scene.terrainProvider.allReady && self.viewer.scene.terrainProvider.ready))
                                            && data === 0) {
                                            self.map.getLoadingIndicator().removeWait(self.waiting);
                                            delete self.waiting;

                                            resolve();

                                            self.events.trigger(Consts.event.TERRAINLOADED, {});
                                        } else {
                                            self.events.trigger(Consts.event.TERRAINRECEIVING, {});
                                        }
                                    }.bind(self));
                                });

                                // deshabilitamos el zoom por defecto y manejamos nosotros zoom con rueda
                                //overrideDesktopZoom.call(self);
                                // sobrescribimos el comportamiento de lo botones + /- y la casita
                                override2DZoom.call(self, true);

                                // eliminamos los creditos de cesium (no encuentro la manera de que no los ponga)
                                document.querySelectorAll('.cesium-viewer-bottom').forEach(function (elm) {
                                    elm.parentElement.removeChild(elm);
                                });

                                // enlazamos con los eventos del mapa 2D
                                self.view3D._event2DHandler = event2DHandler.bind(self);
                                self.map.on(listenTo.join(' '), self.view3D._event2DHandler);

                                // modificamos los controles disponibles
                                alterAllowedControls.call(self, Consts.view.THREED);

                                self.viewer.readyPromise.then(function () {
                                    // pintamos las features que están en el mapa 2D
                                    draw2DDrawedFeatures.call(self);
                                });
                                self.view3D.getScene = function () {
                                    return self.viewer.scene;
                                }
                                self.view3D.getFovCoords = function (crs) {
                                    var scene = self.viewer.scene;
                                    var canvas = scene.canvas;
                                    var bottomLeft = new cesium.Cartesian2(0, canvas.clientHeight - 1);
                                    var bottomRight = new cesium.Cartesian2(canvas.clientWidth - 1, canvas.clientHeight - 1);
                                    var fovCoords = [
                                        bottomLeft,
                                        bottomRight,
                                        new cesium.Cartesian2(canvas.clientWidth - 1, 0),
                                        new cesium.Cartesian2(0, 0)
                                    ].map(function (elm) {
                                        return pickMapCoords.call(self, elm, crs);
                                    }).filter(function (elm) {
                                        return elm !== null;
                                    });
                                    if (fovCoords.length && fovCoords.length < 4) { // Vemos horizonte
                                        // flacunza: Si vemos horizonte no tenemos puntos de terreno para las esquinas superiores, 
                                        // por eso intentamos calcular unos puntos "en el infinito".
                                        var farCoordsLeft = getFarMapCoords.call(self, {
                                            nearMapCoords: fovCoords[0],
                                            bottomPixel: bottomLeft,
                                            cameraPosition: self.view3D.cameraControls._coordsXY
                                        });
                                        var farCoordsRight = getFarMapCoords.call(self, {
                                            nearMapCoords: fovCoords[1],
                                            bottomPixel: bottomRight,
                                            cameraPosition: self.view3D.cameraControls._coordsXY
                                        });
                                        if (farCoordsLeft && farCoordsRight) {
                                            fovCoords[2] = farCoordsRight;
                                            fovCoords[3] = farCoordsLeft;
                                        }

                                    }
                                    return fovCoords;
                                }
                                self.view3D.getExtent = function () {                                    
                                    const fov = this.getFovCoords(this.crs);
                                    const rectangle = cesium.Rectangle.fromCartographicArray(fov.map((coords) => { return new cesium.Cartographic(coords[0], coords[1]) }))
                                    return [rectangle.west, rectangle.south, rectangle.east, rectangle.north];
                                }
                                self.view3D.getCameraData = function () {
                                    const camera = self.viewer.scene.camera
                                    const cameraPosition = camera.position;
                                    const cameraPositionCarto = cesium.Ellipsoid.WGS84.cartesianToCartographic(cameraPosition);
                                    return {
                                        "latitude": cesium.Math.toDegrees(cameraPositionCarto.latitude),
                                        "longitude": cesium.Math.toDegrees(cameraPositionCarto.longitude),
                                        "height": cameraPositionCarto.height,
                                        "heading": camera.heading * (180 / Math.PI),
                                        "pitch": camera.pitch * (180 / Math.PI)
                                    }
                                }
                                self.view3D.Coordinates2DTo3D = function (coords) {
                                    const _coords = coords instanceof cesium.Cartesian2 ? coords : new cesium.Cartesian2(coords[0], coords[1]);

                                    var ray = self.viewer.camera.getPickRay(_coords);
                                    var position = self.viewer.scene.globe.pick(ray, self.viewer.scene);
                                    if (position) {
                                        var positionCartographic = cesium.Ellipsoid.WGS84.cartesianToCartographic(position);

                                        var lat, lon, ele;
                                        lat = cesium.Math.toDegrees(positionCartographic.latitude);
                                        lon = cesium.Math.toDegrees(positionCartographic.longitude);
                                        ele = Math.round(positionCartographic.height);

                                        return { lon: lon, lat: lat, ele: ele };
                                    }
                                }
                                self.view3D.setMarker = function (position, image, marker = null, id) {
                                    if (!(position instanceof cesium.Cartesian3 || position instanceof cesium.Cartesian2)) {
                                        position = cesium.Cartesian3.fromDegrees(position[0], position[1]);
                                    }
                                    if (!marker) {
                                        marker = self.map.view3D.addNativeFeature.call(self.map, {
                                            position: position,
                                            billboard: {
                                                image: image,
                                                eyeOffset: new cesium.Cartesian3(0, 0, -100),
                                                verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                                                heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
                                                pixelOffset: new cesium.Cartesian2(0, 20.0),
                                                id: id || TC.getUID()
                                            }
                                        });
                                    }
                                    else {
                                        marker.position = position;
                                        marker.setImage(Math.random() * 1000, image);
                                        marker.pixelOffset = new cesium.Cartesian2(0, 20.0);
                                        marker.show = true;
                                    }
                                    self.viewer.scene.requestRender();
                                    return marker;

                                }
                                                                
                                self.view3D.setCenter = function (xy) {
                                    
                                    /*if (block) return;*/
                                    const scene = self.map.view3D.getScene();
                                    var destination = cesium.Cartesian3.fromDegrees(xy[0], xy[1], self.view3D.getHeightFromMDT(xy));
                                                                        
                                    const center = scene.globe.pick(scene.camera.getPickRay(new cesium.Cartesian2(self.view3D.container.clientWidth / 2, self.view3D.container.clientHeight / 2)), scene);
                                    const distance = cesium.Cartesian3.distance(center, scene.camera.positionWC);                                    
                                    var oldTransform = new cesium.Matrix4();
                                    scene.camera.transform.clone(oldTransform);
                                    //const _flyEnd = function () {
                                    //    console.log("fly end");
                                    //    self.map.off(Consts.event.CAMERACHANGE, _flyEnd);
                                    //    scene.camera.lookAtTransform(oldTransform);
                                    //    block = false;
                                    //}
                                    
                                    //self.map.on(Consts.event.CAMERACHANGE, _flyEnd);                                                                  
                                   
                                    scene.camera.lookAt(destination,
                                        new cesium.HeadingPitchRange(scene.camera.heading, scene.camera.pitch, distance));
                                    scene.camera.lookAtTransform(oldTransform);
                                    /*block = true;*/
                                   
                                    
                                }
                                self.view3D.setLabel = function (entity, style) {
                                    self.view3D.threeDDraw.setLabel(entity, style);
                                }
                                self.view3D.setStyle = function (entity, style) {
                                    self.view3D.threeDDraw.setStyle(style, entity);
                                }
                                self.view3D.getLength = function (entity) {
                                    const coordinates = entity.polyline.positions.getValue();
                                    return coordinates.reduce(function (vi, va, index, arr) {
                                        if (index === 0) return 0;
                                        return vi + new cesium.EllipsoidGeodesic(cesium.Cartographic.fromCartesian(arr[index - 1]), cesium.Cartographic.fromCartesian(arr[index]), cesium.Ellipsoid.WGS84).surfaceDistance;
                                    }, 0);
                                }
                                self.view3D.getArea = function (entity) {
                                    const coordinates = entity.polygon.hierarchy.getValue();
                                    return Math.sqrt(Math.pow(cesium.PolygonPipeline.computeArea2D(coordinates.positions), 2));
                                }
                                //sacar a una clase externa
                                const cartesianToArray = function (cartesian) {
                                    const geoCoords = cesium.Cartographic.fromCartesian(cartesian);
                                    //return Util.reproject([cesium.Math.toDegrees(geoCoords.longitude), cesium.Math.toDegrees(geoCoords.latitude)], self.map.view3D.crs, self.map.view3D.view2DCRS);
                                    return [cesium.Math.toDegrees(geoCoords.longitude), cesium.Math.toDegrees(geoCoords.latitude)];                                    
                                }
                                const tcFeatureConstructor = function (activeShapePoints, type) {
                                    let geometry;
                                    switch (type) {
                                        case 'polyline':
                                            geometry = new Polyline(activeShapePoints.map(function (point) {
                                                return cartesianToArray(point);
                                            }));
                                            break;
                                        case 'polygon':
                                            geometry = new Polygon(activeShapePoints.map(function (point) {
                                                return cartesianToArray(point);
                                            }));
                                            break;
                                        case 'point':
                                            geometry = new Point(cartesianToArray(activeShapePoints instanceof Array ? activeShapePoints[0] : activeShapePoints));
                                            break;
                                    }
                                    return geometry;
                                };
                                let d2Control = null;
                                //let threeDDraw;                                    
                                self.view3D.UI = {
                                    DrawControl: function (mode, callback) {
                                        self.view3D.threeDDraw = new ThreeDDraw(self.viewer, mode);
                                        self.view3D.threeDDraw.addEventListener('drawend', (evt) => {
                                            self.map.activeControl.trigger(Consts.event.MEASURE, evt.detail.measurements);
                                            const apiFeature = tcFeatureConstructor(evt.detail.positions, evt.detail.type);
                                            self.map.activeControl.trigger(Consts.event.DRAWEND, {
                                                feature: apiFeature
                                                });
                                            callback(apiFeature).then(function (feature2D) {
                                                linkFeature(self.view3D, feature2D, evt.detail.entity);
                                                evt.detail.entity.name = feature2D.id;
                                                feature2D.setStyle(evt.detail.entity.getStyle());
                                                //self.map.activeControl.trigger(Consts.event.DRAWEND, {
                                                //    feature: feature2D
                                                //});
                                            });
                                        });
                                        self.view3D.threeDDraw.addEventListener('drawstart', (evt) => {
                                            self.map.activeControl.trigger(Consts.event.DRAWSTART, {});
                                        });
                                        self.view3D.threeDDraw.addEventListener('drawupdate', (evt) => {
                                            self.map.activeControl.trigger(Consts.event.MEASUREPARTIAL, evt.detail.measurements);
                                        });
                                        self.view3D.threeDDraw.addEventListener('point', (evt) => {
                                            const geoCoords = cesium.Cartographic.fromCartesian(evt.detail.position);
                                            self.map.activeControl.trigger(Consts.event.POINT, {
                                                point: [cesium.Math.toDegrees(geoCoords.longitude), cesium.Math.toDegrees(geoCoords.latitude)]
                                            });
                                        });
                                        self.view3D.threeDDraw.addEventListener('drawmodify', (evt) => {
                                            const newFeature = tcFeatureConstructor(evt.detail.positions, evt.detail.type)
                                            const originalFeat = evt.detail.entity._wrap.parent;
                                            originalFeat.setCoordinates(newFeature.getCoordinates());
                                            //originalFeat.setCoordinates(newFeature.getCoordinates({ geometryCrs: self.map.view3D.view2DCRS, crs: self.map.view3D.crs }));
                                            self.map.activeControl.trigger(Consts.event.FEATUREMODIFY, { feature: originalFeat, layer: originalFeat.layer });
                                        });

                                        return self.view3D.threeDDraw;
                                    }
                                    , SelectControl: function () {
                                        var _pickedFeature = null;
                                        var selectCallback = null;                                        
                                        const tcFeatureFromEntity = function (entity) {
                                            if (entity.polygon)
                                                return new Polygon(entity.polygon.hierarchy.getValue().positions.map(function (point) {
                                                    return cartesianToArray(point);
                                                }), { id: entity.id })
                                            else if (entity.polyline)
                                                return new Polyline(entity.polyline.positions.getValue().map(function (point) {
                                                    return cartesianToArray(point);
                                                }), { id: entity.id })
                                            else
                                                return new Point(cartesianToArray(entity.position.getValue(cesium.JulianDate.now)), { id: entity.id });
                                        }                                        
                                        const unselectFeature = function (evt) {
                                            if (evt.control instanceof Modify)
                                                _pickedFeature = null;
                                        };
                                        const _activate = function (deleteMode) {
                                            
                                            self.map.on(Consts.event.FEATUREREMOVE, _remove);
                                            self.map.on(Consts.event.CONTROLDEACTIVATE, unselectFeature);
                                            self.view3D.threeDDraw.vertexRemove(deleteMode);
                                            if (self.view3D.threeDDraw.entityForEdit && !deleteMode) self.view3D.threeDDraw.activate();
                                            d2Control = self.map.activeControl;
                                            if (!deleteMode)
                                                self.view3D.threeDDraw.activeSelectMode(function (selectedEntity) {
                                                    if (cesium.defined(selectedEntity)) {
                                                        _pickedFeature = selectedEntity;
                                                        selectCallback({
                                                            selected: [(selectedEntity._wrap?.parent || tcFeatureFromEntity(selectedEntity)).wrap.feature], deselected: []
                                                        });
                                                    }
                                                });
                                            else
                                                self.view3D.threeDDraw.deactivateSelectMode();
                                        };
                                        const _remove = function (event) {
                                            if (event.feature.wrap?.feature3D) {
                                                self.view3D.threeDDraw.remove(event.feature.wrap.feature3D);
                                                _pickedFeature = null;
                                            }
                                        }                                        
                                        const _deactivate = function () {
                                            //_pickedFeature = null;
                                            //unselectFeature();
                                            self.view3D.threeDDraw.deactivateSelectMode();
                                            self.view3D.threeDDraw.deactivateEditing();
                                            self.map.off(Consts.event.FEATUREREMOVE, _remove);
                                            self.map.off(Consts.event.CONTROLDEACTIVATE, unselectFeature);
                                            self.view3D.threeDDraw.editMode = false;
                                            //self.map.activeControl?.deactivate();
                                        };
                                        return {
                                            activate: _activate,
                                            setActive: function (active) {
                                                active ? _activate() : _deactivate();
                                            },
                                            deactivate: _deactivate,
                                            on: function (event, callback) {
                                                selectCallback = callback;
                                            },
                                            getFeatures: function () {
                                                if (!cesium.defined(_pickedFeature)) {
                                                    return new ol.Collection();
                                                }
                                                return new ol.Collection([(_pickedFeature._wrap?.parent || tcFeatureFromEntity(_pickedFeature)).wrap.feature]);
                                            }
                                        }
                                    }
                                }
                                resolve(self.viewer);

                            });

                            cesium.Entity.prototype.getStyle = function () {
                                const returnValue = {}
                                if (this.polygon) {
                                    Object.assign(returnValue, /*TC.Cfg.styles.polygon,*/ {
                                        fillColor: this.polygon.material.getValue().color.toCssHexString().substring(0, 7),
                                        fillOpacity: this.polygon.material.getValue().color.alpha,
                                        strokeColor: this.polyline.material.getValue().color.toCssHexString().substring(0, 7),
                                        strokeWidth: this.polyline.width.getValue()
                                    });
                                }
                                else if (this.polyline) {
                                    Object.assign(returnValue, /*TC.Cfg.styles.line,*/ {
                                        strokeColor: this.polyline.material.getValue().color.toCssHexString().substring(0, 7),
                                        strokeWidth: this.polyline.width.getValue()
                                    });
                                }
                                else if (this.point) {
                                    Object.assign(returnValue, /*TC.Cfg.styles.point,*/ {
                                        fillColor: this.point.color.getValue().toCssHexString().substring(0, 7),
                                        fillOpacity: this.point.color.getValue().alpha,
                                        //fontSize
                                        strokeColor: this.point.outlineColor.getValue().toCssHexString().substring(0, 7),
                                        strokeWidth: this.point.outlineWidth.getValue(),
                                        radius: (this.point.pixelSize.getValue()  + (this.point.outlineWidth.getValue() *2))/2
                                        //radius: this.point.pixelSize.getValue() / 2
                                    });
                                }
                                if (this.label) {
                                    returnValue["fontColor"] = this.label?.fillColor?.getValue().toCssHexString();
                                    returnValue["font"] = this.label?.font?.getValue();
                                }
                                    
                                return returnValue;
                            }

                        });

                    } else {
                        resolve(self.viewer);
                    }
                });
            },

            setBaseLayer: function (layer) {
                var self = this;

                var get3DLayer = function (layer) {
                    if (!isCompatible(layer, self.view3D.crs)) {
                        if (layer.getFallbackLayer() !== null && isCompatible(layer.getFallbackLayer(), self.view3D.crs)) {
                            layer = layer.getFallbackLayer();
                        } else {
                            self.map.toast(self.getLocaleString('threed.crsNoCompatible', { name: layer.title }));
                            layer = null;
                        }
                    }

                    return layer;
                };

                if (!self.view3D.baseLayer) {

                    if (layer.type === Consts.layerType.WMTS || layer.type === Consts.layerType.WMS) {

                        if (layer.options.relatedWMTS) {
                            self.map.baseLayer = layer = self.map.getLayer(layer.options.relatedWMTS);
                            self.map.trigger(Consts.event.BASELAYERCHANGE, { layer: self.map.baseLayer });
                        } else {

                            layer = get3DLayer(layer);

                            if (layer) {
                                if (!layer.isBase) {
                                    layer.isBase = true;
                                }
                                self.view3D.addLayer.call(self, layer);
                            }
                        }
                    }
                    else {
                        self.view3D.baseLayer = self.Consts.BLANK_BASE;
                    }
                } else {

                    if (self.viewer.scene.imageryLayers.contains(self.view3D.baseLayer)) {
                        self.viewer.scene.imageryLayers.raiseToTop(self.view3D.baseLayer);
                        self.viewer.scene.imageryLayers.remove(self.view3D.baseLayer, true);
                    }

                    if (layer instanceof Vector) {
                        self.view3D.baseLayer = self.Consts.BLANK_BASE;

                        self.map.getLoadingIndicator().removeWait(self.waiting);
                        delete self.waiting;
                    }
                    else {
                        layer = get3DLayer(layer);

                        if (layer) {
                            layer.map = self.map;
                            layer.isBase = true;

                            self.view3D.addLayer.call(self, layer);
                        }
                    }
                }

                currentMapCfg.baseMap = self.map.baseLayer;
            },

            addLayer: function (layer) {
                var self = this;

                switch (true) {
                    case Consts.layerType.VECTOR == layer.type: {
                        self.view3D.vector2DLayers.push(layer);
                        break;
                    }
                    case Consts.layerType.WMTS == layer.type:
                    case Consts.layerType.WMS == layer.type: {
                        if (!layer.isBase && !layer.isCompatible(self.view3D.crs)) {
                            self.map.toast(self.getLocaleString('threed.crsNoCompatible', { name: layer.layerNames }));
                        } else {
                            //var convertedLayer = rasterConverter.convert(layer, self.view3D.crs);
                            rasterConverter.convert(layer, self.view3D.crs).then(function (convertedLayer) {
                                if (convertedLayer) {

                                    if (convertedLayer.enablePickFeatures !== undefined) {
                                        convertedLayer.enablePickFeatures = false;
                                        convertedLayer.tcLayer = layer;
                                    }

                                    if (layer.isBase && self.view3D.baseLayer) {
                                        if (self.viewer.scene.imageryLayers.contains(self.view3D.baseLayer)) {
                                            self.viewer.scene.imageryLayers.raiseToTop(self.view3D.baseLayer);
                                            self.viewer.scene.imageryLayers.remove(self.view3D.baseLayer, true);
                                        }
                                    }
                                    cesium.TrustedServers.add(new URL("http://" + convertedLayer.url).host, "80");
                                    cesium.TrustedServers.add(new URL("https://" + convertedLayer.url).host, "443");
                                    cesium.TrustedServers.add("http://localhost", "8080");

                                    var newImageryLayer = self.viewer.scene.imageryLayers.addImageryProvider(convertedLayer);

                                    if (layer.isBase) { // si la capa es el mapa de fondo lo envío al fondo de las capas en 3D
                                        self.view3D.baseLayer = newImageryLayer;
                                        self.viewer.scene.imageryLayers.lowerToBottom(newImageryLayer);
                                    } else {
                                        newImageryLayer.show = layer.getVisibility();
                                        newImageryLayer.alpha = layer.getOpacity();

                                        self.view3D.workLayers.push(newImageryLayer);
                                    }
                                }
                            });
                        }
                        break;
                    }
                }
            },
            removeLayer: function (layer) {
                var self = this;

                switch (true) {
                    case Consts.layerType.VECTOR == layer.type: {

                        if (self.view3D.vector2DFeatures && hasOwnProperty.call(self.view3D.vector2DFeatures, layer.id)) {

                            for (var featureId in self.view3D.vector2DFeatures[layer.id]) {
                                var threedFeature = self.view3D.vector2DFeatures[layer.id][featureId];

                                threedFeature.forEach(tdf => self.view3D.removeFeature.call(self, tdf));
                            }

                            delete self.view3D.vector2DFeatures[layer.id];
                        }

                        // GLS revisar, debería estar en workLayers¿? 
                        // self.view3D.workLayers.splice(i, 1);
                        break;
                    }
                    case Consts.layerType.WMTS == layer.type:
                    case Consts.layerType.WMS == layer.type: {
                        for (var i = 0; i < self.view3D.workLayers.length; i++) {
                            if (layer.names && self.view3D.workLayers[i].imageryProvider.layers.join(',') === layer.names.join(',') ||
                                layer.title && self.view3D.workLayers[i].imageryProvider.layers.join(',') === layer.title) {
                                self.viewer.scene.imageryLayers.raiseToTop(self.view3D.workLayers[i]);
                                self.viewer.scene.imageryLayers.remove(self.view3D.workLayers[i], true);

                                self.view3D.workLayers.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            },
            setRenderOptionsLayer: function (layer, options) {
                var self = this;

                switch (true) {
                    case Consts.layerType.VECTOR == layer.type: {
                        if (layer?.owner?.wrap?.interation3D) {
                            layer.owner.wrap.interation3D.visibility(layer.getVisibility())
                        }                            
                        else if (self.view3D.vector2DFeatures[layer.id]) {

                            for (var featureId in self.view3D.vector2DFeatures[layer.id]) {
                                var features = self.view3D.vector2DFeatures[layer.id][featureId];
                                features.forEach(f => self.view3D.setRenderOptionsFeature(f, { show: layer.getVisibility() }));
                            }

                            self.viewer.scene.requestRender();
                        }
                        break;
                    }
                    case Consts.layerType.WMTS == layer.type:
                    case Consts.layerType.WMS == layer.type: {
                        for (var i = 0; i < self.view3D.workLayers.length; i++) {
                            const imageryLayerNames = Array.isArray(self.view3D.workLayers[i].imageryProvider.layers) ? self.view3D.workLayers[i].imageryProvider.layers.join(',') : self.view3D.workLayers[i].imageryProvider.layers;
                            if (layer.names && imageryLayerNames === layer.names.join(',') ||
                                layer.title && imageryLayerNames === layer.title) {

                                if (hasOwnProperty.call(options, 'visibility')) {
                                    self.view3D.workLayers[i].show = options.visibility;
                                }

                                if (hasOwnProperty.call(options, 'opacity')) {
                                    self.view3D.workLayers[i].alpha = options.opacity;
                                }
                                break;
                            }
                        }

                        self.viewer.scene.requestRender();
                    }
                }
            },

            flyToMapCoordinates: function (coords) {
                var self = this;

                var lonlat = self.view3D.view2DCRS !== self.view3D.crs ? Util.reproject(coords, self.view3D.view2DCRS, self.view3D.crs) : coords;
                var destination = cesium.Cartesian3.fromDegrees(lonlat[0], lonlat[1], self.viewer.camera.positionCartographic.height);

                var camera = self.viewer.camera;
                camera.flyTo({
                    destination: destination,
                    orientation: {
                        heading: camera.heading,
                        pitch: camera.pitch
                    }
                });
            }.bind(viewProto),
            flyToRectangle: function (rectangle, options) {
                const self = this;
                // lo primero de todo cancelar movimientos anteriores
                self.viewer.scene.camera.cancelFlight();

                return new Promise(function (resolve, _reject) {
                    options = options || {
                    };

                    var epsilon = cesium.Math.EPSILON3;
                    if (rectangle.east === rectangle.west) {
                        rectangle.east += epsilon;
                        rectangle.west -= epsilon;
                    }

                    if (rectangle.north === rectangle.south) {
                        rectangle.north += epsilon;
                        rectangle.south -= epsilon;
                    }

                    var enlargeFactor = 0.2;
                    var marginX = rectangle.width * enlargeFactor / 2;
                    var marginY = rectangle.height * enlargeFactor / 2;
                    rectangle.east -= marginX;
                    rectangle.west += marginX;
                    rectangle.north += marginY;
                    rectangle.south -= marginY;

                    var scene = self.viewer.scene;
                    var camera = scene.camera;

                    var destinationCartesian = camera.getRectangleCameraCoordinates(rectangle);
                    var destination = cesium.Ellipsoid.WGS84.cartesianToCartographic(destinationCartesian);
                    cesium.sampleTerrainMostDetailed(scene.terrainProvider, [cesium.Rectangle.center(rectangle)]).then(function (updatedPositions) {
                    //cesium.when(cesium.sampleTerrainMostDetailed(scene.globe.terrainProvider, [cesium.Rectangle.center(rectangle)]), function (updatedPositions) {

                        var finalDestinationCartographic = {
                            longitude: destination.longitude,
                            latitude: destination.latitude,
                            //URI:Partimos de una base de una altura de al menos 200, para evitar quedar muy cerca del suelo si el rectangulo es el extent de un punto
                            height: Math.max(destination.height,200) + updatedPositions[0].height || 0
                        };
                        const geodesic = new cesium.EllipsoidGeodesic(destination, new cesium.Cartographic(destination.longitude, 0, destination.height));
                        const pos = geodesic.interpolateUsingSurfaceDistance(Math.max(destination.height, 200));
                        pos.height = finalDestinationCartographic.height;
                        //camera.setView({
                        //    destination: cesium.Ellipsoid.WGS84.cartographicToCartesian(pos),
                        //    orientation: {
                        //        heading: 0,
                        //        pitch: -1 * (Math.PI / 4)
                        //    }
                        //});
                        //resolve();

                        camera.flyTo({
                            duration: options.duration || 1,
                            destination: cesium.Ellipsoid.WGS84.cartographicToCartesian(pos),    
                            orientation: {
                                heading: 0,
                                pitch: -1 * (Math.PI / 4)
                            },
                            complete: function () {
                                resolve();
                                //var angle = cesium.Math.toRadians(50);
                                //var pickBP = pickBottomPoint(this.viewer.scene);
                                //pickBP = cesium.Matrix4.fromTranslation(pickBP);

                                //this.view3D.rotateAroundAxis(this.viewer.scene.camera, -angle, this.viewer.scene.camera.right, pickBP, {
                                //    duration: 250,
                                //    callback: function () {
                                //        resolve();
                                //    }
                                //});
                            }.bind(self)
                        });
                    });
                });
            }.bind(viewProto),

            zoomToCartesian: function (position, amount) {
                var self = this;
                var scene = self.viewer.scene;

                if (!position || !position.endPosition) {
                    var canvas = scene.canvas;
                    var center = new cesium.Cartesian2(
                        canvas.clientWidth / 2,
                        canvas.clientHeight / 2);
                    position = {
                        endPosition: center
                    };
                }

                var pickRay = scene.camera.getPickRay(position.endPosition);
                var intersection = scene.globe.pick(pickRay, scene);
                if (intersection) {

                    var distanceMeasure = cesium.Cartesian3.distance(pickRay.origin, intersection);
                    if (distanceMeasure < 1) {
                        return;
                    }
                    else {
                        if (!self.view3D._zoomTo) {
                            self.view3D._zoomTo = {
                                amount: 0
                            };
                        }
                        self.view3D._zoomTo.direction = amount > 0 ? 1 : 0;
                        self.view3D._zoomTo.amount += (distanceMeasure * 5 / 100);
                        self.view3D._zoomTo.endPosition = position.endPosition;
                    }
                }

                var setNewPosition = function (data) {
                    var self = this;
                    var scene = self.viewer.scene;

                    var pickRay = scene.camera.getPickRay(position.endPosition || data.endPosition);
                    var intersection = scene.globe.pick(pickRay, scene);
                    if (intersection) {

                        var distanceMeasure = cesium.Cartesian3.distance(pickRay.origin, intersection);
                        if (distanceMeasure < 1) {
                            return;
                        }
                        else {

                            var cameraPosition = scene.camera.position;
                            var cameraDirection = scene.camera.direction;

                            var toGo = new cesium.Cartesian3();
                            var toMove = toGo;
                            cesium.Cartesian3.multiplyByScalar(pickRay.direction, data.direction == 1 ? data.amount : -data.amount, toMove);
                            cesium.Cartesian3.add(cameraPosition, toMove, toGo);

                            var ray = new cesium.Ray(toGo, pickRay.direction);
                            var intersectionToGo = scene.globe.pick(ray, scene);
                            if (intersectionToGo) {

                                var reset = function () {
                                    this.view3D._zoomTo = {
                                        direction: 1,
                                        amount: 0,
                                        endPosition: {}
                                    };

                                    return;
                                };

                                if (cesium.Cartesian3.distance(toGo, intersectionToGo) < 1 ||
                                    Math.abs(cesium.Ellipsoid.WGS84.cartesianToCartographic(toGo).height) < scene.screenSpaceCameraController.minimumZoomDistance) {
                                    reset.call(self);
                                }
                                else {
                                    self.viewer.camera.flyTo({
                                        destination: toGo,
                                        orientation: {
                                            heading: scene.camera.heading,
                                            pitch: scene.camera.pitch,
                                            roll: scene.camera.roll
                                        },
                                        duration: 1,
                                        easingFunction: cesium.EasingFunction.LINEAR_NONE,
                                        complete: function (_distance) {
                                            this.view3D._zoomTo = {
                                                direction: 1,
                                                amount: 0,
                                                endPosition: {}
                                            };
                                        }.bind(self, cesium.Cartesian3.distance(toGo, intersectionToGo))
                                    });
                                }
                            }
                        }
                    }
                };

                setTimeout(function () { // GLS: No hemos encontrado otra forma para acumular pasos de la rueda
                    setNewPosition.call(self, self.view3D._zoomTo);
                }.bind(self), 50);
            },

            rotateAroundAxis: function (camera, angle, axis, transform, opt_options) {
                return rotateAroundAxis(camera, angle, axis, transform, opt_options);
            },

            addFeature: function (feature, datasource) {
                var self = this;

                var add = function () {
                    // TODO: el convert debería ser uno o varios webworker, si son muchas features se colapsa.
                    var csfeature = featureConverter.convert(self.viewer.scene, feature, self.view2DCRS, self.crs);
                    if (csfeature) {
                        if (typeof csfeature.geometry === 'function') {
                            // estoy aquí // tengo que validar qué proveedor escoger, afecta, hay mucha diferencia de alturas, podría ir por capa?? búsquedas fijo por el de por defecto y track validar??
                            csfeature.geometry(self.viewer.terrainProvider).then(function (newGeometry) {
                                // es igual a cuando no es una función... a ver cómo lo gestiono
                                if (newGeometry instanceof Array) {
                                    newGeometry.forEach(function (geom) {
                                        if (geom instanceof Array) {
                                            geom.forEach(function (geo) {
                                                geo = addFeature.call(self, geo, datasource);
                                                linkFeature(self, feature, geo);
                                            });
                                        } else {
                                            geom = addFeature.call(self, geom, datasource);
                                            linkFeature(self, feature, geom);
                                        }
                                    });
                                }
                                else {
                                    var geom = addFeature.call(self, newGeometry, datasource);
                                    linkFeature(self, feature, geom);
                                }

                            });
                        }
                        else if (csfeature.geometry instanceof Array) {
                            csfeature.geometry.forEach(function (geom) {
                                geom = addFeature.call(self, geom, datasource);
                                linkFeature(self, feature, geom);
                            });
                        }
                        else {
                            var geom = addFeature.call(self, csfeature.geometry, datasource);
                            linkFeature(self, feature, geom);
                        }
                    }
                };

                // GLS: para no pintar la cruz-marker del FeatureInfo
                if ((self.linked2DControls.featureInfo && self.linked2DControls.featureInfo.get2DMarker() === feature) ||
                    (self.linked2DControls.featureInfo && self.linked2DControls.featureInfo.isPending())) {
                    // GLS: llega antes aquí que al callback de la instrucción que crea la feature, por eso necesito el timeout
                    setTimeout(function () {
                        if (self.linked2DControls.featureInfo.get2DMarker() === feature) {
                            return;
                        } else {
                            add();
                        }
                    }, 5);
                } else if (self.linked2DControls.geolocation && self.linked2DControls.geolocation.geotrackingLayer === feature.layer && feature instanceof Polyline) {
                    return;
                } else {
                    add();
                }
            },
            removeFeature: function (feature) {
                var self = this;
                if (self.viewer) {
                    if (feature) {
                        switch (true) {
                            case feature instanceof cesium.GroundPrimitive:
                                self.viewer.scene.groundPrimitives.remove(feature);
                                break;
                            case feature instanceof cesium.Billboard:
                                self.viewer.billboardCollection.remove(feature);
                                break;
                            case feature instanceof cesium.Entity:
                            case feature instanceof Object:
                                self.viewer.entities.removeById(feature.id);
                                break;
                        }

                        self.viewer.scene.requestRender();
                    }
                }
            },
            setRenderOptionsFeature: function (feature, options) {
                if (feature) {
                    feature.show = options.show;
                }
            },

            addNativeFeature: function (cesiumFeature) {
                return addFeature.call(this.view3D, cesiumFeature);
            },

            setCameraFromMapView: function () {
                var self = this;

                self.viewer.scene.globe.terrainProvider.readyPromise.then(function () {
                    var center = self.mapView.getCenter();

                    if (!center) {
                        return;
                    }

                    var latlon = self.view3D.view2DCRS !== self.view3D.crs ? Util.reproject(center, self.view3D.view2DCRS, self.view3D.crs) : center;
                    var distance = calcDistanceForResolution.call(self, self.mapView.getResolution() || 0, cesium.Math.toRadians(latlon[0]));


                    var carto = new cesium.Cartographic(cesium.Math.toRadians(latlon[0]), cesium.Math.toRadians(latlon[1]));
                    if (self.viewer.scene.globe) {
                        carto.height = self.viewer.scene.globe.getHeight(carto) || 0;
                    }

                    var setCamera = function () {
                        if (self.map.on3DView) {
                            var destination = cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
                            var orientation = {
                                pitch: cesium.Math.toRadians(-90),
                                heading: -self.mapView.getRotation(),
                                roll: 0.0
                            };

                            self.viewer.camera.setView({
                                destination: destination,
                                orientation: orientation
                            });

                            self.viewer.camera.moveBackward(distance);
                        }
                    };

                    if (carto.height === 0) {
                        (new Promise(function (resolve) {
                            if (!TC.tool || !TC.tool.Elevation) {
                                import('../tool/Elevation').then(() => {
                                    self.view3D.elevationTool = new TC.tool.Elevation();   
                                    resolve(self.view3D.elevationTool);
                                });
                            }
                            else
                                resolve(new TC.tool.Elevation())
                        })).then(function (elevationTool) {
                            elevationTool.getElevation({
                                crs: self.view3D.crs,
                                coordinates: [latlon]
                            }).then(function (result) {
                                if (result && result.length > 0) {
                                    carto.height = result[0][2] ? result[0][2] : 0;
                                    setCamera();
                                }
                            }).catch((e) => console.log(e));
                        })
                        
                    } else {
                        setCamera();
                    }
                });
            },
            setViewFromCameraView: function () {
                const self = this;


                var ellipsoid = cesium.Ellipsoid.WGS84;
                var scene = self.viewer.scene;
                var target_ = pickCenterPoint(scene);

                if (!target_) {
                    var globe = self.viewer.scene.globe;
                    var carto = self.viewer.camera.positionCartographic.clone();
                    var height = globe.getHeight(carto);
                    carto.height = height || 0;
                    target_ = cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
                }


                var distance = cesium.Cartesian3.distance(target_, self.viewer.camera.position);
                var targetCartographic = ellipsoid.cartesianToCartographic(target_);

                var centerMapCRS = self.view3D.crs !== self.view3D.view2DCRS ? Util.reproject(
                    [cesium.Math.toDegrees(targetCartographic.longitude), cesium.Math.toDegrees(targetCartographic.latitude)],
                    self.view3D.crs, self.view3D.view2DCRS) : [cesium.Math.toDegrees(targetCartographic.longitude), cesium.Math.toDegrees(targetCartographic.latitude)];

                self.mapView.setCenter(centerMapCRS);

                self.mapView.setResolution(calcResolutionForDistance.call(self, distance, targetCartographic ? targetCartographic.latitude : 0));

                // GLS: No tenemos la rotación del mapa activada por problemas con el iPad
                //if (target) {
                //    var pos = self.viewer.camera.position;

                //    var targetNormal = new cesium.Cartesian3();
                //    ellipsoid.geocentricSurfaceNormal(target, targetNormal);

                //    var targetToCamera = new cesium.Cartesian3();
                //    cesium.Cartesian3.subtract(pos, target, targetToCamera);
                //    cesium.Cartesian3.normalize(targetToCamera, targetToCamera);

                //    // HEADING
                //    var up = self.viewer.camera.up;
                //    var right = self.viewer.camera.right;
                //    var normal = new cesium.Cartesian3(-target.y, target.x, 0);
                //    var heading = cesium.Cartesian3.angleBetween(right, normal);
                //    var cross = cesium.Cartesian3.cross(target, up, new cesium.Cartesian3());
                //    var orientation = cross.z;

                //    self.mapView.setRotation((orientation < 0 ? heading : -heading));
                //    self.setViewFromCameraViewInProgress.resolve();
                //}

                return Promise.resolve();
            },

            lookAt: function (coords) {
                const self = this;

                if (self.crs !== self.view2DCRS) {
                    coords = Util.reproject(coords, self.view2DCRS, self.crs);
                }

                var camera = self.viewer.camera;
                var positionCartographic = camera.positionCartographic;
                var height = positionCartographic.height;
                var cartographic = new cesium.Cartographic(cesium.Math.toRadians(coords[0]), cesium.Math.toRadians(coords[1]), height)

                camera.flyTo({
                    destination: cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height),
                    duration: 1.0
                });
            },

            getInfoOnPickedPosition: function (pickedPosition) {
                var self = this;

                if (!pickedPosition) {
                    return;
                } else {

                    self.map.one(Consts.event.DRAWTABLE, function (_e) {
                        self.map.getLoadingIndicator().removeWait(self.waiting);
                        delete self.waiting;
                    });

                    self.view3D.linked2DControls.featureInfo.send.call(self, pickedPosition).then(function (_e) {
                        self.map.getLoadingIndicator().removeWait(self.waiting);
                        delete self.waiting;
                    });
                }
            },

            on: function (event, callback) {
                const self = this;

                const movement3DtoPosition2D = function (movement) {
                    if (self.viewer && self.viewer.cesiumWidget) {
                        return self.Coordinates2DTo3D(movement.endPosition || movement.position)
                        //var ray = self.viewer.camera.getPickRay(movement.endPosition || movement.position);
                        //var position = self.viewer.scene.globe.pick(ray, self.viewer.scene);
                        //if (position) {
                        //    var positionCartographic = cesium.Ellipsoid.WGS84.cartesianToCartographic(position);

                        //    var lat, lon, ele;
                        //    lat = cesium.Math.toDegrees(positionCartographic.latitude);
                        //    lon = cesium.Math.toDegrees(positionCartographic.longitude);
                        //    ele = Math.round(positionCartographic.height);

                        //    return { lon: lon, lat: lat, ele: ele };
                        //}
                    }

                    return null;
                };

                if (!self.eventHandlers) {
                    self.eventHandlers = {};
                }

                self.eventHandlers.handlerOfMovementConversion = new cesium.ScreenSpaceEventHandler(self.viewer.scene.canvas);
                self.eventHandlers.handlerOfMovementConversion.setInputAction(function (event) {
                    if (event.endPosition || event.position) {
                        // Si estamos anclados a una entidad ignoro los click en el terreno
                        if (self.viewer.trackedEntity) {
                            return;
                        }

                        callback(movement3DtoPosition2D(event));
                    } else {
                        callback(event);
                    }

                }, fromTCtoCesiumEvent(event));
            },

            getHeightFromMDT: function (geoCoords) {
                const self = this;

                var cartesian = new cesium.Cartographic(cesium.Math.toRadians(geoCoords[0]), cesium.Math.toRadians(geoCoords[1]));
                return self.viewer.scene.globe.getHeight(cartesian) || 0;
            },

            // darle una vuelta cuando esté mejor. no se me ocurre nada mejor
            addElevationMarker: function (coords, context) {
                const self = this;
                if (self.viewer && !self.viewer.view3DElevationMarkerPromise) {
                    self.viewer.view3DElevationMarkerPromise = true;
                    self.viewer.readyPromise.then(function () {
                        delete self.viewer.view3DElevationMarkerPromise;
                        let entity = new cesium.Entity({
                            position: cesium.Cartesian3.fromDegrees(coords[0], coords[1], self.getHeightFromMDT(coords)),
                            name: 'elevationMarker',
                            point: {
                                show: true,
                                color: cesium.Color.RED.withAlpha(0.5),
                                pixelSize: 10,
                                outlineColor: cesium.Color.WHITE,
                                outlineWidth: 2,
                                heightReference: cesium.HeightReference.CLAMP_TO_GROUND
                            }
                        });

                        context.view3DElevationMarker = addFeature.call(self, entity);
                    });
                }
            },
            setElevationMarker: function (coords, context) {
                const self = this;
                if (self.viewer) {
                    self.viewer.readyPromise.then(function () {
                        if (context.view3DElevationMarker) {
                            const position = coords;
                            //const position = self.view2DCRS !== self.crs ? Util.reproject(coords, self.view2DCRS, self.crs) : coords;
                            context.view3DElevationMarker.position = cesium.Cartesian3.fromDegrees(position[0], position[1], self.viewer.camera.positionCartographic.height);
                            if (!context.view3DElevationMarker.show) {
                                context.view3DElevationMarker.show = true;
                            }
                            self.viewer.scene.requestRender();
                        } else {
                            self.addElevationMarker(coords, context);
                        }
                    });
                }
            },
            hideElevationMarker: function (context) {
                const self = this;
                if (self.viewer && context.view3DElevationMarker) {
                    self.viewer.readyPromise.then(function () {
                        self.removeFeature.call(self, context.view3DElevationMarker);
                        delete context.view3DElevationMarker;
                    });
                }
            },

            destroy: function () {
                var self = this;

                self.map.on3DView = false;
                //self.map.view3D = null;

                self.view3D.vector2DLayers = [];
                self.view3D.vector2DFeatures = {
                };

                // eliminamos el enlace con los eventos del mapa 2D
                self.map.off(listenTo.join(' '), self.view3D._event2DHandler);

                // modificamos los controles disponibles
                alterAllowedControls.call(self, Consts.view.DEFAULT);

                // sobrescribimos el comportamiento de lo botones + /- y la casita
                override2DZoom.call(self, false);

                //addNoCompatibleBaseLayers.call(self);

                Promise.all(self.map.baseLayers.map(function (baseLayer) {
                    return Promise.resolve(!isCompatible(baseLayer, self.view3D.view2DCRS));
                })).then(function (results) {
                    let triggerEvent;
                    if (results.length > 0) {
                        var defaultBaseLayer;
                        for (var i = 0; i < self.map.baseLayers.length; i++) {
                            if (!defaultBaseLayer && !results[i]) {
                                defaultBaseLayer = self.map.baseLayers[i];
                            }
                            if (self.map.baseLayers[i]) {
                                self.map.baseLayers[i].mustReproject = results[i];
                            }
                        }
                        triggerEvent = true;
                        const showReprojectDialog = function (haveToChange, baseLayer, fallbackLayer) {
                            const dialogOptions = {
                                layer: baseLayer
                            };

                            if (fallbackLayer) {
                                dialogOptions.fallbackLayer = fallbackLayer;
                            }

                            var control = self.map.getControlsByClass(haveToChange ? TC.control.BasemapSelector : TC.control.Coordinates);
                            if (control.length > 0) {
                                // gestionamos que el control de coordenadas no se renderice en el cambio de vista porque borra el modal de cambio de CRS
                                if (control[0] instanceof TC.control.Coordinates) {
                                    triggerEvent = false;
                                }
                                dialogOptions.closeCallback = function () {
                                    self.map.trigger(Consts.event.VIEWCHANGE, { view: Consts.view.DEFAULT });
                                };
                                control[0].showProjectionChangeDialog(dialogOptions);
                            }
                        };

                        var baseLayer = currentMapCfg.baseMap == self.Consts.BLANK_BASE ? currentMapCfg.baseVector : currentMapCfg.baseMap;
                        if (!baseLayer.isCompatible(self.map.getCRS())) {

                            if (!baseLayer.fallbackLayer) {
                                showReprojectDialog(true, baseLayer);
                            } else {
                                baseLayer.getFallbackLayer();
                                if (baseLayer.getFallbackLayer().isCompatible(self.map.getCRS())) {

                                    // antes de establecer como fondo la capa de respaldo, preguntar al usuario si prefiere cambiar de CRS o si quiere seguir reproyectando al vuelo.
                                    TC.confirm(self.getLocaleString('threed.changeBaselayer'),
                                        function () {
                                            showReprojectDialog(false, baseLayer, baseLayer.fallbackLayer);
                                        }, function () {
                                            self.map.setBaseLayer(baseLayer.fallbackLayer);
                                        });
                                } else {
                                    showReprojectDialog(true, baseLayer);
                                }
                            }
                        } else {
                            self.map.setBaseLayer(baseLayer);
                        }
                    }

                    currentMapCfg.baseMap = '';

                    self.view3D.baseLayer = null;

                    self.view3D.workLayers = [];

                    //URI esto reproyecta la features del GFI cuando no debería
                    //self.map.workLayers.filter((wl) => wl.features?.length).forEach(function (wl) {
                    //    wl.features.forEach((feature) => {
                    //        if (feature?.wrap?.feature3D) {
                    //            feature.setCoordinates(Util.reproject(feature.geometry, self.view3D.crs, self.view3D.view2DCRS));
                    //        }
                    //    })
                    //});

                    self.view3D.cameraControls.unbind();

                    if (self.view3D.linked2DControls.featureInfo) {
                        self.view3D.linked2DControls.featureInfo.reset();
                    }

                    if (self.view3D.linked2DControls.geolocation) {
                        self.view3D.linked2DControls.geolocation.isGeo = false;
                        self.view3D.linked2DControls.geolocation.reset();
                    }



                    self.view3D.tileLoadingHandler.removeAll();
                    delete self.view3D.tileLoadingHandler;

                    self.viewer.destroy();
                    self.viewer = null;

                    if (triggerEvent) { // si lanzamos sin más, el control de coordenadas se renderizada en el cambio de vista y borra el modal de cambio de CRS
                        self.map.trigger(Consts.event.VIEWCHANGE, { view: Consts.view.DEFAULT });
                    }
                });
            }
        }
    })();

    return {
        init: viewProto.init.bind(viewProto),
        apply: viewProto.apply.bind(viewProto),
        unapply: viewProto.unapply.bind(viewProto),
        VIEWNAME: viewProto.VIEWNAME
    };
});

export default ThreeD;
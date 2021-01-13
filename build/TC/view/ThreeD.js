var TC = TC || {};
TC.view = TC.view || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}
(function (namespace, signature, factory) {
    namespace[signature] = factory();
})(TC.view, "ThreeD", function () {

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
            CAMERACTRARROWDISABLED: 'disabled-arrow',
            FOCUS: 'focus',
            HIGHLIGHTED: 'highlighted',
            DISABLED: 'disabled',
            OUTFOCUS: 'outfocus'
        },
        allowedControls: [],
        template: {},

        viewer: null,
        mapView: null,
        terrainProvider: null,

        getLocaleString: function (key, texts) {
            var self = this;
            var locale = self.map ? self.map.options.locale : TC.Cfg.locale;
            return TC.Util.getLocaleString(locale, key, texts);
        },

        getRenderedHtml: function (templateId, data, callback) {
            return TC.Control.prototype.getRenderedHtml.call(this, templateId, data, callback);
        }
    };

    if (TC.isDebug) {
        TC.Consts.url.CESIUM = TC.apiLocation + 'lib/cesium/debug/Cesium.js';
    }

    TC.Consts.classes.THREED = TC.Consts.classes.THREED || "tc-3d";
    TC.Consts.classes.THREED_HIDDEN = TC.Consts.classes.THREED_HIDDEN || "tc-3d-hidden";
    TC.Consts.event.TERRAINLOADED = TC.Consts.event.TERRAINLOADED || "terrainloaded.tc.threed";
    TC.Consts.event.TERRAINRECEIVING = TC.Consts.event.TERRAINRECEIVING || "terrainreceiving.tc.threed";
    TC.Consts.event.TERRAIN404 = TC.Consts.event.TERRAIN404 || "terrain404.tc.threed";

    viewProto.template[viewProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-3d.hbs";
    viewProto.template[viewProto.CLASS + '-overlay'] = TC.apiLocation + "TC/templates/tc-view-3d-overlay.hbs";
    viewProto.template[viewProto.CLASS + '-cm-ctls'] = TC.apiLocation + "TC/templates/tc-view-3d-cm-ctls.hbs";

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
    var isCompatible = function (layer, crs) {
        return layer.type === TC.Consts.layerType.WMTS ?
            layer.wrap.getCompatibleMatrixSets(crs).length > 0 :
            layer.isCompatible(crs);
    };

    // Funciones para cálculo de FOV
    var getFarCoords = function (origin, nearPoint) {
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

    var distanceSquared = function (p1, p2) {
        var dx = p2[0] - p1[0];
        var dy = p2[1] - p1[1];
        return dx * dx + dy * dy;
    };

    var getFarMapCoords = function (obj) {
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

    var pickMapCoords = function (pixel) {
        var self = this;
        var pickPoint = pickOnTerrainOrEllipsoid(self.viewer.scene, pixel);
        if (pickPoint) {
            pickPoint = Cesium.Cartographic.fromCartesian(pickPoint);
            if (self.view3D.crs !== self.view3D.view2DCRS) {
                return TC.Util.reproject([Cesium.Math.toDegrees(pickPoint.longitude), Cesium.Math.toDegrees(pickPoint.latitude)], self.view3D.crs, self.view3D.view2DCRS);
            } else {
                return [Cesium.Math.toDegrees(pickPoint.longitude), Cesium.Math.toDegrees(pickPoint.latitude)];
            }
        }
        return null;
    }

    // Funciones utilidades cámara
    var calcDistanceForResolution = function (resolution, latitude) {
        var self = this;

        var fovy = self.viewer.camera.frustum.fovy;
        var visibleMapUnits = resolution * self.mapView.viewHTML.getBoundingClientRect().height;
        var relativeCircumference = Math.cos(Math.abs(latitude));
        var visibleMeters = visibleMapUnits * self.mapView.metersPerUnit * relativeCircumference;

        return (visibleMeters / 2) / Math.tan(fovy / 2);
    };

    var calcResolutionForDistance = function (distance, latitude) {
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
        for (var i = 0; i < resolutions.length; i++) {
            if (resolutions[i] < Math.abs(resolution)) {
                resolution = resolutions[i - 1];
                break;
            } else if (resolutions[i] === Math.abs(resolution)) {
                resolution = resolutions[i];
                break;
            } else if (i === resolutions.length - 1) {
                resolution = resolutions[i];
            }
        }

        return resolution;
    };

    var rotateAroundAxis = function (camera, angle, axis, transform, opt_options) {
        var clamp = Cesium.Math.clamp;
        var defaultValue = Cesium.defaultValue;

        var options = opt_options || {};
        var duration = defaultValue(options.duration, 500); // ms

        var linear = function (a) {
            return a
        };
        var easing = defaultValue(options.easing, linear);
        var callback = options.callback;

        var start;
        var lastProgress = 0;
        var oldTransform = new Cesium.Matrix4();

        return new Promise(function (resolve, reject) {

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

    var pickOnTerrainOrEllipsoid = function (scene, pixel) {
        var self = this;

        var ray = scene.camera.getPickRay(pixel);
        var target = scene.globe.pick(ray, scene);
        return target || scene.camera.pickEllipsoid(pixel);
    };

    var pickCenterPoint = function (scene) {
        var self = this;

        var canvas = scene.canvas;
        var center = new Cesium.Cartesian2(
            canvas.clientWidth / 2,
            canvas.clientHeight / 2);
        return pickOnTerrainOrEllipsoid(scene, center);
    };

    var pickBottomPoint = function (scene) {
        var self = this;

        var canvas = scene.canvas;
        var bottom = new Cesium.Cartesian2(
            canvas.clientWidth / 2, canvas.clientHeight);
        return pickOnTerrainOrEllipsoid(scene, bottom);
    };

    var bottomFovRay = function (scene) {
        var self = this;

        var camera = scene.camera;
        var fovy2 = camera.frustum.fovy / 2;
        var direction = camera.direction;
        var rotation = Cesium.Quaternion.fromAxisAngle(camera.right, fovy2);
        var matrix = Cesium.Matrix3.fromQuaternion(rotation);
        var vector = new Cesium.Cartesian3();
        Cesium.Matrix3.multiplyByVector(matrix, direction, vector);
        return new Cesium.Ray(camera.position, vector);
    };

    var setHeadingUsingBottomCenter = function (scene, heading, bottomCenter, opt_options) {
        var self = this;

        var camera = scene.camera;
        // Compute the camera position to zenith quaternion
        var angleToZenith = computeAngleToZenith(scene, bottomCenter);
        var axis = camera.right;
        var quaternion = Cesium.Quaternion.fromAxisAngle(axis, angleToZenith);
        var rotation = Cesium.Matrix3.fromQuaternion(quaternion);

        // Get the zenith point from the rotation of the position vector
        var vector = new Cesium.Cartesian3();
        Cesium.Cartesian3.subtract(camera.position, bottomCenter, vector);
        var zenith = new Cesium.Cartesian3();
        Cesium.Matrix3.multiplyByVector(rotation, vector, zenith);
        Cesium.Cartesian3.add(zenith, bottomCenter, zenith);

        // Actually rotate around the zenith normal
        var transform = Cesium.Matrix4.fromTranslation(zenith);
        rotateAroundAxis(camera, heading, zenith, transform, opt_options);
    };

    var signedAngleBetween = function (first, second, normal) {
        var self = this;

        // We are using the dot for the angle.
        // Then the cross and the dot for the sign.
        var a = new Cesium.Cartesian3();
        var b = new Cesium.Cartesian3();
        var c = new Cesium.Cartesian3();
        Cesium.Cartesian3.normalize(first, a);
        Cesium.Cartesian3.normalize(second, b);
        Cesium.Cartesian3.cross(a, b, c);

        var cosine = Cesium.Cartesian3.dot(a, b);
        var sine = Cesium.Cartesian3.magnitude(c);

        // Sign of the vector product and the orientation normal
        var sign = Cesium.Cartesian3.dot(normal, c);
        var angle = Math.atan2(sine, cosine);
        return sign >= 0 ? angle : -angle;
    };

    var computeAngleToZenith = function (scene, pivot) {
        var self = this;

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
        var direction = Cesium.Cartesian3.clone(ray.direction);
        Cesium.Cartesian3.negate(direction, direction);

        var normal = new Cesium.Cartesian3();
        Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(pivot, normal);

        var left = new Cesium.Cartesian3();
        Cesium.Cartesian3.negate(camera.right, left);

        var a = signedAngleBetween(normal, direction, left);
        return a + fy;
    };

    var computeSignedTiltAngleOnGlobe = function (scene) {
        var self = this;

        var camera = scene.camera;
        var ray = new Cesium.Ray(camera.position, camera.direction);
        var target = scene.globe.pick(ray, scene);

        if (!target) {
            // no tiles in the area were loaded?
            var ellipsoid = Cesium.Ellipsoid.WGS84;
            var obj = Cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);
            if (obj) {
                target = Cesium.Ray.getPoint(ray, obj.start);
            }
        }

        if (!target) {
            return undefined;
        }

        var normal = new Cesium.Cartesian3();
        Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(target, normal);

        var angleBetween = signedAngleBetween;
        var angle = angleBetween(camera.direction, normal, camera.right) - Math.PI;
        return Cesium.Math.convertLongitudeRange(angle);
    };

    // Funciones CZML    
    var toCZML = function (coordinates, layout, name, pointStyle, lineStyle, walkingSpeed) {
        const self = this;

        return new Promise(function (resolve, reject) {
            var positions = coordinates.map(function (coordinate) {
                var reprojected = coordinate;
                if (self.view3D.view2DCRS !== self.view3D.crs) {
                    reprojected = TC.Util.reproject(coordinate, self.view3D.view2DCRS, self.view3D.crs);
                }
                return Cesium.Cartographic.fromDegrees(reprojected[0], reprojected[1]);
            });

            Cesium.when(self.viewer.terrainProvider.sampleTerrainMostDetailed(positions), function (updatedPositions) {
                var startTime, stopTime, totalDistance = 0;

                if (layout === ol.geom.GeometryLayout.XYZM) {
                    startTime = coordinates[0][3];
                    stopTime = coordinates[coordinates.length - 1][3];
                } else if (layout === ol.geom.GeometryLayout.XYM) {
                    startTime = coordinates[0][2];
                    stopTime = coordinates[coordinates.length - 1][2];
                } else {

                    coordinates[0][3] = updatedPositions[0].time = Date.now();

                    for (var i = 1; i < updatedPositions.length; i++) {
                        var done;
                        var previuos_next = [];

                        updatedPositions[i].time = 0;

                        if (i + 1 < updatedPositions.length) {
                            previuos_next = updatedPositions.slice(i - 1, i + 1);
                        } else {
                            previuos_next = updatedPositions.slice(i - 1);
                        }

                        done = new Cesium.EllipsoidGeodesic(previuos_next[0], previuos_next[1]).surfaceDistance;

                        totalDistance += done;

                        coordinates[i][3] = updatedPositions[i].time = updatedPositions[i - 1].time + (3600000 * done / walkingSpeed);
                    }

                    startTime = updatedPositions[0].time;
                    stopTime = updatedPositions[updatedPositions.length - 1].time;
                }

                if (totalDistance === 0) {
                    for (var i = 1; i < updatedPositions.length; i++) {
                        var previuos_next = [];

                        if (i + 1 < updatedPositions.length) {
                            previuos_next = updatedPositions.slice(i - 1, i + 1);
                        } else {
                            previuos_next = updatedPositions.slice(i - 1);
                        }

                        totalDistance += new Cesium.EllipsoidGeodesic(previuos_next[0], previuos_next[1]).surfaceDistance;
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
                            return layout === ol.geom.GeometryLayout.XYZM ? [new Date(coordinates[i][3]).toISOString(), updatedPosition.longitude, updatedPosition.latitude, updatedPosition.height] :
                                layout === ol.geom.GeometryLayout.XYM ? [new Date(coordinates[i][2]).toISOString(), updatedPosition.longitude, updatedPosition.latitude, updatedPosition.height] :
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

        var outHandler = function (e) {
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
                    self._coordsXY = TC.Util.reproject([Cesium.Math.toDegrees(position.longitude), Cesium.Math.toDegrees(position.latitude)], view.view3D.crs, view.view3D.view2DCRS);
                } else {
                    self._coordsXY = [Cesium.Math.toDegrees(position.longitude), Cesium.Math.toDegrees(position.latitude)];
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
                        var scene = view.viewer.scene;
                        var canvas = scene.canvas;
                        var bottomLeft = new Cesium.Cartesian2(0, canvas.clientHeight - 1);
                        var bottomRight = new Cesium.Cartesian2(canvas.clientWidth - 1, canvas.clientHeight - 1);
                        var fovCoords = [
                            bottomLeft,
                            bottomRight,
                            new Cesium.Cartesian2(canvas.clientWidth - 1, 0),
                            new Cesium.Cartesian2(0, 0)
                        ].map(function (elm) {
                            return pickMapCoords.call(view, elm);
                        }).filter(function (elm) {
                            return elm !== null;
                        });
                        if (fovCoords.length && fovCoords.length < 4) { // Vemos horizonte
                            // flacunza: Si vemos horizonte no tenemos puntos de terreno para las esquinas superiores, 
                            // por eso intentamos calcular unos puntos "en el infinito".
                            var farCoordsLeft = getFarMapCoords.call(view, {
                                nearMapCoords: fovCoords[0],
                                bottomPixel: bottomLeft,
                                cameraPosition: self._coordsXY
                            });
                            var farCoordsRight = getFarMapCoords.call(view, {
                                nearMapCoords: fovCoords[1],
                                bottomPixel: bottomRight,
                                cameraPosition: self._coordsXY
                            });
                            if (farCoordsLeft && farCoordsRight) {
                                fovCoords[2] = farCoordsRight;
                                fovCoords[3] = farCoordsLeft;
                            }

                        }
                        view._ovMap.wrap.draw3DCamera({ position: self._coordsXY, heading: camera.heading, fov: fovCoords });
                    });
                }
            }

        };
        var cssRotate = function (element, angle) {
            var coord = element.getBBox();
            value = 'rotate(' + Cesium.Math.toDegrees(angle) + ' ' + (coord.x + (coord.width / 2)) + ' ' + (coord.y + (coord.height / 2)) + ')';
            document.getElementsByClassName(element.className.baseVal)[0].setAttribute('transform', value);
        };

        self.outControlsEvents = TC.Util.detectMouse() ? ['mouseleave'] : ['touchleave', 'touchend'];
        self.outControls = outHandler.bind(self);

        self.inControlsEvents = TC.Util.detectMouse() ? ['mouseenter'] : ['touchmove', 'touchstart'];
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

        self.MIN_TILT = Cesium.Math.toRadians(-89);
        self.MAX_TILT = Cesium.Math.toRadians(-1);

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

        self.div.classList.add(TC.Consts.classes.HIDDEN);

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
                var distance = Cesium.Cartesian3.distance(camera.position, bottomCenter);

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
            self.div.classList.remove(TC.Consts.classes.HIDDEN);
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
                self.tiltIndicatorInner.addEventListener(TC.Consts.event.CLICK, self.resetTilt.bind(self));

                self.tiltIndicator = self.div.querySelector(tiltSelector + '-indicator');

                self.tiltIndicatorOuterCircle = self.div.querySelector(tiltSelector + '-outer-circle');
                self.tiltIndicatorOuterShellCircle = self.div.querySelector(tiltSelector + '-outer-shell-circle');

                self.tiltIndicatorCircle = self.div.querySelector("[class^=" + tiltSelector.replace('.', '') + "-outer" + "]");
                self.tiltIndicatorCircle.addEventListener('mousedown', function (e) {
                    var self = this;

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    var vectorScratch = new Cesium.Cartesian2();
                    var element = e.currentTarget;
                    var rectangle = e.currentTarget.getBoundingClientRect();
                    var center = new Cesium.Cartesian2((rectangle.right - rectangle.left) / 2.0, (rectangle.bottom - rectangle.top) / 2.0);
                    var clickLocation = new Cesium.Cartesian2(e.clientX - rectangle.left, e.clientY - rectangle.top);
                    var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);

                    self.draggingTilt.call(self, element, vector);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }.bind(self));

                // left
                self.tiltUp = self.div.querySelector(tiltSelector + self.selectors.upArrow);
                self.tiltUp.addEventListener(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {

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

                    var upEvent = TC.Util.detectMouse() ? 'mouseup' : 'touchend';

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
                self.tiltDown.addEventListener(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {


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

                    var upEvent = TC.Util.detectMouse() ? 'mouseup' : 'touchend';

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
                self.rotateIndicatorInner.addEventListener(TC.Consts.event.CLICK, self.resetRotation.bind(self));

                self.rotateIndicator = self.div.querySelector(rotateSelector + '-indicator');

                self.rotateIndicatorOuterCircle = self.div.querySelector(rotateSelector + '-outer-circle');
                self.rotateIndicatorOuterShellCircle = self.div.querySelector(rotateSelector + '-outer-shell-circle');

                self.rotateIndicatorCircle = self.div.querySelector("[class^=" + rotateSelector.replace('.', '') + "-outer" + "]");
                self.rotateIndicatorCircle.addEventListener('mousedown', function (e) {
                    var self = this;

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    var vectorScratch = new Cesium.Cartesian2();
                    var element = e.currentTarget;
                    var rectangle = e.currentTarget.getBoundingClientRect();
                    var center = new Cesium.Cartesian2((rectangle.right - rectangle.left) / 2.0, (rectangle.bottom - rectangle.top) / 2.0);
                    var clickLocation = new Cesium.Cartesian2(e.clientX - rectangle.left, e.clientY - rectangle.top);
                    var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);

                    self.draggingRotate.call(self, element, vector);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }.bind(self));

                // left
                self.rotateLeft = self.div.querySelector(rotateSelector + self.selectors.leftArrow);
                self.rotateLeft.addEventListener(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    self.inControls(e);

                    var upEvent = TC.Util.detectMouse() ? 'mouseup' : 'touchend';

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
                self.rotateRight.addEventListener(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    self.inControls(e);

                    var upEvent = TC.Util.detectMouse() ? 'mouseup' : 'touchend';

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

        var theta = Cesium.Math.toRadians(angle);
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
        var bottomLeft = new Cesium.Cartesian2(0, canvas.clientHeight - 1);
        var bottomRight = new Cesium.Cartesian2(canvas.clientWidth - 1, canvas.clientHeight - 1);
        var fovCoords = [bottomLeft, bottomRight, new Cesium.Cartesian2(canvas.clientWidth - 1, 0), new Cesium.Cartesian2(0, 0)]
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

        if (this.parent.viewer && this.parent.viewer.trackedEntity) {
            self.getCamera().rotateUp(Cesium.Math.toRadians(angle));
        } else {
            if (pickCenterPoint(self.parent.viewer.scene) == undefined) {
                if (angle > 0) self.getCamera().lookUp();
                else self.getCamera().lookDown();
            }

            if ((angle >= Cesium.Math.PI_OVER_TWO && self.isTiltUpDisabled) ||
                (angle <= -Cesium.Math.PI_OVER_TWO && self.isTiltDownDisabled)) {
                return;
            }

            var _angle = Cesium.Math.toRadians(angle);
            var pivot = pickCenterPoint(self.parent.viewer.scene);
            if (pivot) {
                var transform = Cesium.Matrix4.fromTranslation(pivot);
                self.parent.view3D.rotateAroundAxis(self.getCamera(), -_angle, self.getCamera().right, transform, { duration: 100 });
            }
        }
    };
    CameraControls.prototype.rotate = function (angle) {
        var self = this;

        angle = Cesium.Math.toRadians(angle);

        if (this.parent.viewer && this.parent.viewer.trackedEntity) {
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

        var oldTransformScratch = new Cesium.Matrix4();
        var newTransformScratch = new Cesium.Matrix4();
        var vectorScratch = new Cesium.Cartesian2();

        document.removeEventListener('mousemove', self.tiltMouseMoveFunction, false);
        document.removeEventListener('mouseup', self.tiltMouseUpFunction, false);

        self.tiltMouseMoveFunction = undefined;
        self.tiltMouseUpFunction = undefined;

        self.isTilting = true;

        var scene = self.parent.viewer.scene;
        var camera = scene.camera;

        var pivot = pickCenterPoint(scene);
        if (!pivot) {
            self.tiltFrame = Cesium.Transforms.northUpEastToFixedFrame(camera.positionWC, Cesium.Ellipsoid.WGS84, newTransformScratch);
            self.tiltIsLook = true;
        } else {
            self.tiltFrame = Cesium.Transforms.northUpEastToFixedFrame(pivot, Cesium.Ellipsoid.WGS84, newTransformScratch);
            self.tiltIsLook = false;
        }

        self.startCursorAngle = Math.atan2(-cursorVector.y, cursorVector.x);

        var oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
        camera.lookAtTransform(self.tiltFrame);

        self.initialCameraAngle = Math.atan2(camera.position.y, camera.position.x);

        camera.lookAtTransform(oldTransform);

        self.tiltMouseMoveFunction = function (e) {
            var self = this;

            scene = self.parent.viewer.scene;
            camera = scene.camera;

            var tiltRectangle = tiltElement.getBoundingClientRect();
            center = new Cesium.Cartesian2((tiltRectangle.right - tiltRectangle.left) / 2.0, (tiltRectangle.bottom - tiltRectangle.top) / 2.0);
            var clickLocation = new Cesium.Cartesian2(e.clientX - tiltRectangle.left, e.clientY - tiltRectangle.top);
            var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);

            console.log('Entra: ' + vector.toString());

            var angle = Math.atan2(-vector.y, vector.x);
            var angleDifference = angle - self.startCursorAngle;
            var newCameraAngle = Cesium.Math.zeroToTwoPi(self.initialCameraAngle - angleDifference);

            try {
                oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
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

        self.tiltMouseUpFunction = function (e) {
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
            var center = new Cesium.Cartesian2((rotateRectangle.right - rotateRectangle.left) / 2.0, (rotateRectangle.bottom - rotateRectangle.top) / 2.0);
            var clickLocation = new Cesium.Cartesian2(e.clientX - rotateRectangle.left, e.clientY - rotateRectangle.top);
            var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);
            var angle = Math.atan2(-vector.y, vector.x);

            var angleDifference = angle - self.rotateInitialCursorAngle;
            var newCameraAngle = Cesium.Math.zeroToTwoPi(self.rotateInitialCameraAngle - angleDifference);

            camera = self.parent.viewer.scene.camera;

            try {
                oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
                camera.lookAtTransform(self.rotateFrame);
                var currentCameraAngle = Math.atan2(camera.position.y, camera.position.x);
                camera.rotateRight(newCameraAngle - currentCameraAngle);
                camera.lookAtTransform(oldTransform);
            } catch (e) {
                self.rotateMouseUpFunction();
            }
        };

        self.rotateMouseUpFunction = function (e) {
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

        var oldTransformScratch = new Cesium.Matrix4();
        var newTransformScratch = new Cesium.Matrix4();
        var vectorScratch = new Cesium.Cartesian2();

        self.isRotating = true;
        self.rotateInitialCursorAngle = Math.atan2(-cursorVector.y, cursorVector.x);

        var scene = self.parent.viewer.scene;
        var camera = scene.camera;

        var viewCenter = pickCenterPoint(self.parent.viewer.scene);
        if (viewCenter == null || viewCenter == undefined) {
            viewCenter = pickBottomPoint(self.parent.viewer.scene);
            if (viewCenter == null || viewCenter == undefined) {
                self.rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(camera.positionWC, Cesium.Ellipsoid.WGS84, newTransformScratch);
                self.rotateIsLook = true;
            } else {
                self.rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(viewCenter, Cesium.Ellipsoid.WGS84, newTransformScratch);
                self.rotateIsLook = false;
            }
        } else {
            self.rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(viewCenter, Cesium.Ellipsoid.WGS84, newTransformScratch);
            self.rotateIsLook = false;
        }

        try {
            var oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
            camera.lookAtTransform(self.rotateFrame);
            self.rotateInitialCameraAngle = Math.atan2(camera.position.y, camera.position.x);
            self.rotateInitialCameraDistance = Cesium.Cartesian3.magnitude(new Cesium.Cartesian3(camera.position.x, camera.position.y, 0.0));
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
        var angle = -self.getCamera().pitch - Cesium.Math.toRadians(50);
        self.tilt(Cesium.Math.toDegrees(angle));
    };
    CameraControls.prototype.resetRotation = function (options) {
        const self = this;
        return new Promise(function (resolve, reject) {
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

            if (this.parent.viewer && this.parent.viewer.trackedEntity) {
                var camera = self.getCamera();
                camera.rotate(Cesium.Cartesian3.fromDegrees(0, 90), currentRotation);
            } else {
                var bottom = pickBottomPoint(self.parent.viewer.scene);
                if (bottom) {
                    setHeadingUsingBottomCenter(self.parent.viewer.scene, currentRotation, bottom, options);
                }
            }
        });
    };
    CameraControls.prototype.customCollisionDetection = function () {
        var self = this;

        var scratchAdjustHeightTransform = new Cesium.Matrix4();
        var scratchAdjustHeightCartographic = new Cesium.Cartographic();

        var scene = self.parent.viewer.scene;
        var camera = self.parent.viewer.scene.camera;

        var screenSpaceCameraController = scene.screenSpaceCameraController;
        var enableCollisionDetection = screenSpaceCameraController.enableCollisionDetection;
        var minimumCollisionTerrainHeight = screenSpaceCameraController.minimumCollisionTerrainHeight;
        var minimumZoomDistance = screenSpaceCameraController.minimumZoomDistance;
        var globe = scene.globe;

        var ellipsoid = globe.ellipsoid;
        var projection = scene.mapProjection;

        var transform;
        var mag;
        if (!Cesium.Matrix4.equals(camera.transform, Cesium.Matrix4.IDENTITY)) {
            transform = Cesium.Matrix4.clone(camera.transform, scratchAdjustHeightTransform);
            mag = Cesium.Cartesian3.magnitude(camera.position);
            camera._setTransform(Cesium.Matrix4.IDENTITY);
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
                Cesium.Cartesian3.normalize(camera.position, camera.position);
                Cesium.Cartesian3.negate(camera.position, camera.direction);
                Cesium.Cartesian3.multiplyByScalar(camera.position, Math.max(mag, minimumZoomDistance), camera.position);
                Cesium.Cartesian3.normalize(camera.direction, camera.direction);
                Cesium.Cartesian3.cross(camera.direction, camera.up, camera.right);
                Cesium.Cartesian3.cross(camera.right, camera.direction, camera.up);
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
                destination: Cesium.Ellipsoid.WGS84.cartographicToCartesian(pos),
                orientation: {
                    heading: self.viewer.camera.heading,
                    pitch: self.viewer.camera.pitch
                }
            });
        }

        // Set the minimumZoomDistance according to the camera height
        self.viewer.scene.screenSpaceCameraController.minimumZoomDistance = pos.height > 1800 ? 400 : 200;
    };

    var TwoDLinkedFeatureInfo = function (map) {
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
                        "main": TC.Util.getLocaleString(map.map.options.locale, "threed.rs.panel.gfi"),
                        "max": TC.Util.getLocaleString(map.map.options.locale, "threed.rs.panel.gfi")
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
        var setMarker = function (pickedPosition) {
            if (!marker) {
                var markerStyle = TC.control.FeatureInfoCommons.prototype.markerStyle;

                var billboard = {
                    position: pickedPosition,
                    billboard: { /* revisar: no está bien la URL de la imagen - también revisar el GFI que salta en móvil sólo con navegar */
                        image: TC.Util.getBackgroundUrlFromCss(map.CLASS + '-marker'),
                        eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
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

        ctlFeatureInfo = map.map.getControlsByClass(TC.control.FeatureInfo)[0];
        if (ctlFeatureInfo) {

            savedMode = ctlFeatureInfo.displayMode;

            getResultsPanelCtl(ctlFeatureInfo).then(function () {
                ctlFeatureInfo.setDisplayMode(TC.Consts.infoContainer.RESULTS_PANEL);

                map.map.on(TC.Consts.event.RESULTSPANELCLOSE, function (e) {
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
        this.send = function (pickedPosition) {
            return new Promise(function (resolve, reject) {
                pending = true;

                if (ctlFeatureInfo.displayMode !== TC.Consts.infoContainer.RESULTS_PANEL) {
                    ctlFeatureInfo.setDisplayMode(TC.Consts.infoContainer.RESULTS_PANEL);
                }

                if (ctlFeatureInfo.resultsPanel) {
                    ctlFeatureInfo.resultsPanel.close();
                }

                if (!map.waiting)
                    map.waiting = map.map.getLoadingIndicator().addWait();

                setMarker(pickedPosition);

                getResultsPanelCtl(ctlFeatureInfo).then(function () {
                    var pickedLocation = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pickedPosition);

                    var reprojected;
                    if (map.view3D.crs !== map.view3D.view2DCRS) {
                        reprojected = TC.Util.reproject([Cesium.Math.toDegrees(pickedLocation.longitude), Cesium.Math.toDegrees(pickedLocation.latitude)], map.view3D.crs, map.view3D.view2DCRS);
                    } else {
                        reprojected = [Cesium.Math.toDegrees(pickedLocation.longitude), Cesium.Math.toDegrees(pickedLocation.latitude)];
                    }


                    var radius = (map.map.options.pixelTolerance || TC.Cfg.pixelTolerance);
                    var mapWidth = 2 * radius + 1;

                    var tilesRendered = map.viewer.scene.globe._surface._tilesToRender;
                    var pickedTile;

                    for (var textureIndex = 0; !pickedTile && textureIndex < tilesRendered.length; ++textureIndex) {
                        var tile = tilesRendered[textureIndex];
                        if (Cesium.Rectangle.contains(tile.rectangle, pickedLocation)) {
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

                    var readyImageryToGetNativeRectangle = (imageryTiles.filter(function (imagery) {
                        return imagery.readyImagery.imageryLayer.isBaseLayer();
                    })[0] || {}).readyImagery;

                    map.map.getResolution = function () {

                        var west_south = map.view3D.crs !== map.view3D.view2DCRS ? TC.Util.reproject([nativeRectangle.west, nativeRectangle.south], map.view3D.crs, map.view3D.view2DCRS) : [nativeRectangle.west, nativeRectangle.south];
                        var east_north = map.view3D.crs !== map.view3D.view2DCRS ? TC.Util.reproject([nativeRectangle.east, nativeRectangle.north], map.view3D.crs, map.view3D.view2DCRS) : [nativeRectangle.east, nativeRectangle.north];

                        var xResolution = (east_north[0] - west_south[0]) / (readyImageryToGetNativeRectangle && readyImageryToGetNativeRectangle.imageryLayer.imageryProvider.tileWidth || 256);
                        var yResolution = (east_north[1] - west_south[1]) / (readyImageryToGetNativeRectangle && readyImageryToGetNativeRectangle.imageryLayer.imageryProvider.tileHeight || 256);

                        return Math.max(xResolution, yResolution);

                    }.bind(map, readyImageryToGetNativeRectangle, nativeRectangle);

                    map.map.one(TC.Consts.event.NOFEATUREINFO, function (e) {
                        pending = false;

                        resolve(e);
                    }.bind(ctlFeatureInfo));

                    map.map.one(TC.Consts.event.FEATUREINFO, function (e) {
                        pending = false;

                        resolve(e);
                    });

                    map.map.on(TC.Consts.event.FEATURECLICK, function (e) {
                        removeMarker();

                        resolve(e);
                    });

                    savedIsActive = ctlFeatureInfo.isActive;
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

    var RasterConverter = function (crsPattern) {
        this.layerCrs = null;

        var crsPattern = crsPattern;

        var paths = {
            CRS: ["Capability", "Layer", "CRS"],
            TILEMATRIXSET: ["Contents", "TileMatrixSet", "Identifier"],
            TILEMATRIXSETLABELS: ["Contents", "TileMatrixSet"]
        };
        var getOfPath = function (obj, p, i) {
            if (i < p.length - 1) {
                if (obj.hasOwnProperty(p[i]))
                    return getOfPath(obj[p[i]], p, ++i);
                else return null;
            } else {
                if (obj instanceof Array) {
                    var _obj = [];
                    for (var a = 0; a < obj.length; a++) {
                        if (obj[a].hasOwnProperty(p[i]))
                            _obj.push(obj[a][p[i]]);
                    }

                    return _obj;
                } else return obj[p[i]];
            }
        };
        var getTileMatrixSetLabelByLayerOnCapabilities = function (layer, crs) {
            if ((capsURL = TC.Util.isOnCapabilities(layer.url))) {
                if ((caps = TC.capabilities[capsURL])) {
                    var tileMatrixSet = getOfPath(caps, paths.TILEMATRIXSETLABELS, 0);
                    for (var a = 0; a < tileMatrixSet.length; a++) {
                        if (TC.Util.CRSCodesEqual(crs, tileMatrixSet[a]["SupportedCRS"])) {
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
                var tileMatrixSetLabels = getTileMatrixSetLabelByLayerOnCapabilities(layer, self.layerCrs);

                var options = {
                    url: new CustomResource({
                        url: layer.options.urlPattern
                    }, layer),
                    layer: layer.layerNames,
                    style: 'default',
                    format: layer.format || layer.options.format,
                    tileMatrixSetID: tileMatrixSetLabels.id,
                    tileMatrixLabels: tileMatrixSetLabels.labels,
                    tilingScheme: new Cesium.GeographicTilingScheme()
                };

                resolve(new Cesium.WebMapTileServiceImageryProvider(options));
            });
        }

        var wmsLayer = function (layer) {
            return new Promise(function (resolve, reject) {
                var options = {
                    url: new CustomResource({
                        url: layer.url
                    }, layer),
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
                                    for (var i = 0; i < nodes.length; i++) {
                                        var n = nodes[i];
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

                resolve(new Cesium.WebMapServiceImageryProvider(options));
            });
        };

        var CustomResource;
        var defineCustomResource = function () {
            /* tengo que sobrescribir porque no valida nada... 
            Desde la version 1.42 han cambiado la definición de un proxy en las capas raster: si configuras con proxy, pide directamente desde el proxy y si da error no gestiona nada, 
            y si no configuras proxy, pide directamente sin tampoco gestionar los errores. Además la creación de una capa raster es síncrona, por lo que no encaja con el algoritmo de proxificación */
            CustomResource = function (options, layer) {
                Cesium.Resource.call(this, options);

                this.layer = layer;
            };
            CustomResource.prototype.constructor = CustomResource;
            CustomResource.prototype = Object.create(Cesium.Resource.prototype, {});
            CustomResource.prototype.clone = function (result) {

                var cloned = Cesium.Resource.prototype.clone.call(this, result);

                if (!Cesium.defined(result)) {
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
            if (request.state === Cesium.RequestState.ISSUED || request.state === Cesium.RequestState.ACTIVE) {
                throw new Cesium.RuntimeError('The Resource is already being fetched.');
            }

            request.state = Cesium.RequestState.UNISSUED;
            request.deferred = undefined;
        }

        function createImage(layer, url, crossOrigin, deferred) {
            var getImage = function (url) {
                var image = new Image();

                image.onload = function (layer) {
                    deferred.resolve(image);
                }.bind(image, layer);

                image.onerror = function (layer, e) {
                    deferred.reject(e);
                }.bind(image, layer);

                if (crossOrigin) {
                    if (Cesium.TrustedServers.contains(url)) {
                        image.crossOrigin = 'use-credentials';
                    } else {
                        image.crossOrigin = '';
                    }
                }

                image.src = url;
            };

            layer.getWebGLUrl.call(layer, url).then(getImage, function (e) {
                deferred.reject(e);
            });
        };

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

                var deferred = Cesium.when.defer();

                createImage(resource.layer, url, crossOrigin && allowCrossOrigin, deferred);

                return deferred.promise;
            };

            var promise = Cesium.RequestScheduler.request(request);
            if (!Cesium.defined(promise)) {
                return;
            }

            return promise.otherwise(function (e) {
                return Cesium.when.reject(e);
            });
        }

        var customFetchImage = function (preferBlob, allowCrossOrigin) {
            if (Cesium.defined(allowCrossOrigin)) {
                Cesium.deprecationWarning('Resource.fetchImage.allowCrossOrigin', 'The allowCrossOrigin parameter has been deprecated and will be removed in Cesium 1.44. It no longer needs to be specified.');
            }

            preferBlob = Cesium.defaultValue(preferBlob, false);
            allowCrossOrigin = Cesium.defaultValue(allowCrossOrigin, true);

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
            if (!Cesium.defined(blobPromise)) {
                return;
            }

            var generatedBlobResource;
            var generatedBlob;
            return blobPromise
                .then(function (blob) {
                    if (!Cesium.defined(blob)) {
                        return;
                    }
                    generatedBlob = blob;
                    var blobUrl = window.URL.createObjectURL(blob);
                    generatedBlobResource = new Cesium.Resource({
                        url: blobUrl
                    });

                    return fetchImage(generatedBlobResource);
                })
                .then(function (image) {
                    if (!Cesium.defined(image)) {
                        return;
                    }
                    window.URL.revokeObjectURL(generatedBlobResource.url);

                    // This is because the blob object is needed for DiscardMissingTileImagePolicy
                    // See https://github.com/AnalyticalGraphicsInc/cesium/issues/1353
                    image.blob = generatedBlob;
                    return image;
                })
                .otherwise(function (error) {
                    if (Cesium.defined(generatedBlobResource)) {
                        window.URL.revokeObjectURL(generatedBlobResource.url);
                    }

                    return Cesium.when.reject(error);
                });
        };
        /* fin cesium Resource override */

        this.convert = function (layer, map3DCRS) {
            var csmLayer;

            this.layerCrs = map3DCRS;

            if (!CustomResource) { defineCustomResource(); }

            switch (true) {
                case TC.Consts.layerType.WMTS == layer.type:
                    return wmtsLayer.call(this, layer);
                case TC.Consts.layerType.WMS == layer.type:
                    return wmsLayer.call(this, layer);
                    break;
            }
        };
    };
    var FeatureConverter = function () {
        var scene = null;
        var toCesiumColor = function (hexStringColor, alpha) {
            if (hexStringColor instanceof Array) {
                hexStringColor = "rgba(" + hexStringColor[0] + ", " + hexStringColor[1] + ", " + hexStringColor[2] + ", " + hexStringColor[3] + ")";
            }
            var color = Cesium.Color.fromCssColorString(hexStringColor);
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
                minx = new Cesium.Cartesian3(point.x - delta, point.y, point.z);
                miny = new Cesium.Cartesian3(point.x, point.y - delta, point.z);
                maxx = new Cesium.Cartesian3(point.x + delta, point.y, point.z);
                maxy = new Cesium.Cartesian3(point.x, point.y + delta, point.z);

                rectangle = Cesium.Rectangle.fromCartesianArray([minx, miny, maxx, maxy], Cesium.Ellipsoid.WGS84);
            } else {
                rectangle = Cesium.Rectangle.fromCartesianArray(coords, Cesium.Ellipsoid.WGS84);
            }

            var neededCameraPosition = scene.camera.getRectangleCameraCoordinates(rectangle);
            var distance = Cesium.Cartesian3.distance(neededCameraPosition, Cesium.BoundingSphere.fromPoints(coords).center);
            var pixelSize = scene.camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, distance, new Cesium.Cartesian2());
            pixelSize = Math.max(pixelSize.x, pixelSize.y);
            return Math.round(pixelSize) == 0 ? 1 : pixelSize;
        };

        var getFeatureStyle = function (feature) {
            var self = this;
            var styles;

            if (!feature.layer || (feature.layer && !feature.layer.hasOwnProperty('styles'))) {
                styles = TC.Defaults.styles;
            } else {
                styles = feature.layer.styles;
            }

            styles = styles[feature.STYLETYPE] == undefined ?
                styles[(feature.STYLETYPE === "polyline" ? "line" : feature.STYLETYPE)] :
                styles[(feature.STYLETYPE === "multipolygon" ? "polygon" : feature.STYLETYPE)];

            styles = TC.Util.extend({}, styles, feature.options, feature.getStyle());

            return styles;
        }

        function createLine(id, coords, options, callback) {
            var entity = new Cesium.Entity({
                name: id,
                polyline: {
                    positions: coords,
                    width: options.width,
                    material: options.material,
                    clampToGround: true
                }
            });

            callback(entity);
        };

        var circleConverter = function (feature) {
            var self = this;
            var circle = {};
            var styles = getFeatureStyle(feature);

            circle.options = function () {
                var opt = {};

                var properties = {
                    color: { prop: 'strokeColor' },
                    opacity: { prop: 'fillOpacity' },
                    outlineColor: { prop: 'fillColor' },
                    outlineOpacity: { prop: 'strokeOpacity' },
                    width: { prop: 'strokeWidth' }
                };

                setStyleProperties(styles, properties, feature);
                var color;
                if (properties.color.hasOwnProperty('val')) {
                    if (properties.opacity.hasOwnProperty('val')) {
                        color = toCesiumColor(properties.color.val, properties.opacity.val);
                    } else {
                        color = toCesiumColor(properties.color.val);
                    }
                }

                opt.color = Cesium.ColorGeometryInstanceAttribute.fromColor(color);

                if (properties.outlineColor.hasOwnProperty('val')) {
                    if (properties.outlineOpacity.hasOwnProperty('val')) {
                        color = toCesiumColor(properties.outlineColor.val, properties.outlineOpacity.val);
                    } else {
                        color = toCesiumColor(properties.outlineColor.val);
                    }
                }

                opt.outlineColor = Cesium.ColorGeometryInstanceAttribute.fromColor(color);

                if (properties.width.hasOwnProperty('val')) {
                    opt.width = properties.width.val;
                }

                return opt;
            };

            circle.geometryType = function (coords, options) {

                return new Cesium.GroundPrimitive({
                    releaseGeometryInstances: false,
                    geometryInstances: new Cesium.GeometryInstance({
                        id: feature.id,
                        geometry: new Cesium.CircleGeometry({
                            center: coords[0],
                            radius: feature.geometry[1]
                        }),
                        attributes: {
                            color: options.color
                        }
                    })
                });

                // Para obtener el contorno de círculo 
                //var radius = feature.geometry[1];
                //var outlineEllipse = Cesium.EllipseGeometryLibrary.computeEllipsePositions({
                //    semiMinorAxis: radius,
                //    semiMajorAxis: radius,
                //    rotation: 0,
                //    center: coords[0],
                //    granularity: Cesium.Math.toRadians(0.5)
                //}, false, true);

                //var outerPositions = Cesium.Cartesian3.unpackArray(outlineEllipse.outerPositions);

                //var outlineSize = getPixelSize(outerPositions);
                //var metersPerPixel = scene.camera.getPixelSize(Cesium.BoundingSphere.fromPoints(outerPositions), scene.drawingBufferWidth, scene.drawingBufferHeight);
                //var outlineInMeters = metersPerPixel * outlineSize;

                //var outlineHoleEllipse = Cesium.EllipseGeometryLibrary.computeEllipsePositions({
                //    semiMinorAxis: radius - outlineInMeters,
                //    semiMajorAxis: radius - outlineInMeters,
                //    rotation: 0,
                //    center: coords[0],
                //    granularity: Cesium.Math.toRadians(0.5)
                //}, false, true);

                //var innerPositions = Cesium.Cartesian3.unpackArray(outlineHoleEllipse.outerPositions);

                //var outlineCircleGeom = new Cesium.GroundPrimitive({
                //    geometryInstances: new Cesium.GeometryInstance({
                //        id: feature.id + 'outline',
                //        geometry: new Cesium.PolygonGeometry({
                //            polygonHierarchy: new Cesium.PolygonHierarchy(outerPositions, [new Cesium.PolygonHierarchy(innerPositions)])
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
            var self = this;
            var polygon = {};
            var styles = getFeatureStyle(feature);

            polygon.options = function () {
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
                if (properties.color.hasOwnProperty('val')) {
                    if (properties.opacity.hasOwnProperty('val')) {
                        color = toCesiumColor(properties.color.val, properties.opacity.val);
                    } else {
                        color = toCesiumColor(properties.color.val);
                    }
                }

                opt.color = Cesium.ColorGeometryInstanceAttribute.fromColor(color);

                if (properties.outlineColor.hasOwnProperty('val')) {
                    if (properties.outlineOpacity.hasOwnProperty('val')) {
                        color = toCesiumColor(properties.outlineColor.val, properties.outlineOpacity.val);
                    } else {
                        color = toCesiumColor(properties.outlineColor.val);
                    }
                }

                opt.outlineColor = color;

                if (properties.width.hasOwnProperty('val')) {
                    opt.width = properties.width.val;
                }

                return opt;
            };

            if (TC.feature.MultiPolygon && feature.CLASSNAME == "TC.feature.MultiPolygon") {
                polygon.geometryType = function (coords, options) {
                    return new Promise(function (resolve, reject) {
                        var getting = [];

                        var geomPolys = [];
                        var geomOutlines = [];

                        var getPolyGeom = function (polygonHierarchy) {
                            return new Cesium.GeometryInstance({
                                id: feature.id,
                                geometry: new Cesium.PolygonGeometry({
                                    polygonHierarchy: polygonHierarchy
                                }),
                                attributes: {
                                    color: options.color
                                }
                            });
                        };

                        var getOutlineGeom = function (outlineCoords) {
                            return new Promise(function (res, rej) {
                                createLine(feature.id, outlineCoords, { material: options.outlineColor, width: options.width }, function (entity) {
                                    geomOutlines.push(entity);
                                    res();
                                });
                            });
                        };

                        for (var i = 0; i < coords.length; i++) {
                            for (var j = 0; j < coords[i].length; j++) {
                                var hierarchy;
                                if (j == 0) {
                                    getting.push(getOutlineGeom.call(this, coords[i][0]));
                                    hierarchy = new Cesium.PolygonHierarchy(coords[i][0]);
                                } else {
                                    getting.push(getOutlineGeom.call(this, coords[i][j]));
                                    hierarchy.holes.push(new Cesium.PolygonHierarchy(coords[i][j]));
                                }
                            }

                            geomPolys.push(getPolyGeom(hierarchy));
                        }

                        Promise.all(getting).then(function () {
                            getting = [];

                            resolve(
                                [new Cesium.GroundPrimitive({
                                    releaseGeometryInstances: false,
                                    geometryInstances: geomPolys
                                }), geomOutlines]);
                        });
                    });
                };
            }
            else if (TC.feature.Polygon && feature.CLASSNAME == "TC.feature.Polygon") {
                polygon.geometryType = function (coords, options) {
                    return new Promise(function (resolve, reject) {
                        if (Array.isArray(coords) && coords.length === 1 && Array.isArray(coords[0])) {
                            coords = coords[0];
                        }

                        createLine(feature.id, coords, {
                            material: options.outlineColor, width: options.width
                        }, function (entity) {

                            resolve([
                                new Cesium.GroundPrimitive({
                                    releaseGeometryInstances: false,
                                    geometryInstances: new Cesium.GeometryInstance({
                                        id: feature.id,
                                        geometry: new Cesium.PolygonGeometry({
                                            polygonHierarchy: new Cesium.PolygonHierarchy(coords)
                                        }),
                                        attributes: {
                                            color: options.color
                                        }
                                    })
                                }), entity]);
                        });
                    });
                };
            }

            return polygon;
        };
        var lineConverter = function (feature) {
            var self = this;
            var line = {};
            var styles = getFeatureStyle(feature);

            line.options = function () {
                var opt = {};
                var properties = {
                    color: { prop: 'strokeColor' },
                    opacity: { prop: 'strokeOpacity' },
                    width: { prop: 'strokeWidth' }
                };

                setStyleProperties(styles, properties, feature);

                if (properties.width.hasOwnProperty('val')) {
                    opt.width = properties.width.val;
                }

                var color;
                if (properties.color.hasOwnProperty('val')) {
                    if (properties.opacity.hasOwnProperty('val')) {
                        color = toCesiumColor(properties.color.val, properties.opacity.val);
                    } else {
                        color = toCesiumColor(properties.color.val);
                    }
                }

                opt.color = color;

                return opt;
            };

            if (TC.feature.MultiPolyline && feature.CLASSNAME == "TC.feature.MultiPolyline") {
                line.geometryType = function (coords, options) {
                    return new Promise(function (resolve, reject) {
                        var geomInstances = [];

                        var getting = [];

                        if (coords.length == 1) {
                            coords = coords[0];

                            getting.push(new Promise(function (res, rej) {
                                createLine(feature.id, coords, {
                                    material: options.color, width: options.width
                                }, function (entity) {
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

                                getting.push(new Promise(function (res, rej) {
                                    createLine(feature.id, coords[i], {
                                        material: options.color, width: options.width
                                    }, function (entity) {
                                        geomInstances.push(entity);
                                        res();
                                    });
                                }));
                            }
                        }

                        Promise.all(getting).then(function () {
                            getting = [];

                            resolve(geomInstances);
                        });
                    });
                };
            }
            else if (TC.feature.Polyline && feature.CLASSNAME == "TC.feature.Polyline") {
                line.geometryType = function (coords, options) {
                    return new Promise(function (resolve, reject) {

                        createLine(feature.id, coords, {
                            material: options.color, width: options.width
                        }, function (entity) {
                            resolve(entity);
                        });
                    });
                };
            }

            return line;
        };
        var pointConverter = function (feature) {
            var self = this;
            var point = {};
            var styles = getFeatureStyle(feature);

            point.options = function () {
                var opt = {};

                var properties = {
                    rotation: { prop: 'angle' },
                    label: { prop: 'label' },
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

                if (properties.anchor.hasOwnProperty('val')) {
                    if (!(properties.url.hasOwnProperty('val')) && feature.options.url) {
                        opt.url = feature.options.url;
                    } else {
                        opt.url = properties.url.val;
                    }

                    opt.anchor = properties.anchor.val;
                }

                if (properties.height.hasOwnProperty('val')) {
                    opt.height = properties.height.val;
                }

                if (properties.width.hasOwnProperty('val')) {
                    opt.width = properties.width.val;
                }

                if (properties.rotation.hasOwnProperty('val')) {
                    opt.rotation = properties.rotation.val;
                }

                if (properties.label.hasOwnProperty('val')) {
                    opt.label = properties.label.val;
                }

                if (properties.fontSize.hasOwnProperty('val')) {
                    opt.fontSize = properties.fontSize.val;
                }

                if (properties.fontColor.hasOwnProperty('val')) {
                    opt.fontColor = toCesiumColor(properties.fontColor.val);
                }

                if (properties.outlineLabelColor.hasOwnProperty('val')) {
                    opt.outlineLabelColor = toCesiumColor(properties.outlineLabelColor.val);
                }

                if (properties.outlineLabelWidth.hasOwnProperty('val')) {
                    opt.outlineLabelWidth = properties.outlineLabelWidth.val;
                }


                var color;
                if (properties.color.hasOwnProperty('val')) {
                    if (properties.opacity.hasOwnProperty('val')) {
                        opt.color = toCesiumColor(properties.color.val, properties.opacity.val);
                    } else {
                        opt.color = toCesiumColor(properties.color.val);
                    }
                }

                if (properties.outlineColor.hasOwnProperty('val')) {
                    if (properties.outlineOpacity.hasOwnProperty('val')) {
                        opt.outlineColor = toCesiumColor(properties.outlineColor.val, properties.outlineOpacity.val);
                    } else {
                        opt.outlineColor = toCesiumColor(properties.outlineColor.val);
                    }
                }

                if (properties.outlineWidth.hasOwnProperty('val')) {
                    opt.outlineWidth = properties.outlineWidth.val;
                }

                if (properties.radius.hasOwnProperty('val')) {
                    opt.radius = properties.radius.val;
                }

                return opt;
            };

            if (TC.feature.Marker && feature.CLASSNAME == "TC.feature.Marker") {
                point.geometryType = function (coords, options) {
                    var billboard = {
                        name: feature.id,
                        position: coords[0],
                        billboard: {
                            image: options.url,
                            width: options.width,
                            height: options.height,
                            eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        }
                    };

                    if (options.anchor && options.anchor.length > 0) {
                        billboard.billboard.pixelOffset = new Cesium.Cartesian2(options.anchor[0], options.anchor[1]);
                    }

                    if (!options.label) {
                        return new Cesium.Entity(billboard);
                    } else {
                        billboard.label = {
                            text: options.label,
                            font: '14pt sans-serif',
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            fillColor: options.fontColor,
                            showBackground: true,
                            eyeOffset: new Cesium.Cartesian3(3000, 0, -100)
                        };

                        return new Cesium.Entity(billboard);
                    }
                };
            }
            else if (TC.feature.Point && feature.CLASSNAME == "TC.feature.Point") {
                var pinBuilder = new Cesium.PinBuilder();

                point.geometryType = function (coords, options) {
                    var text = options.label;

                    switch (true) {
                        case (text && /^([A-Z])\w+$/gi.test(text)):
                        case (text && !/^[0-9]*\-{0,1}[a-z]{0,4}$/gi.test(text)):

                            return new Cesium.Entity({
                                name: feature.id,
                                position: coords[0],
                                label: {
                                    text: options.label,
                                    eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                    verticalOrigin: Cesium.VerticalOrigin.BASELINE,
                                    font: '16' + 'px san-serif Helvetica',
                                    fillColor: Cesium.Color.BLACK,
                                    outlineColor: Cesium.Color.WHITE,
                                    outlineWidth: 5,
                                    style: Cesium.LabelStyle.FILL_AND_OUTLINE
                                }
                            });

                            break;
                        case (/^[0-9]*\-{0,1}[a-z]{0,4}$/gi.test(text)):
                            return new Cesium.Entity({
                                name: feature.id,
                                position: coords[0],
                                billboard: {
                                    image: pinBuilder.fromText(text, options.fontColor, 48).toDataURL(),
                                    eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                                }
                            });
                            break;
                        case options.radius && options.radius > 0:
                            var stringifyScratch = new Array(2);

                            const drawPin = function (context2D, color, size) {

                                color = color.darken(0.15, new Cesium.Color());
                                var rgbaColor = color.toCssColorString().replace("rgb", "rgba").replace(")", ",0)");

                                context2D.save();
                                context2D.scale(size / 24, size / 24);
                                context2D.strokeStyle = rgbaColor;
                                context2D.miterLimit = 4;
                                context2D.font = "normal normal 400 normal 15px / 21.4286px ''";
                                context2D.font = "   15px ";
                                context2D.save();
                                context2D.restore();
                                context2D.save();
                                context2D.restore();
                                context2D.save();
                                context2D.font = "   15px ";
                                context2D.save();
                                context2D.fillStyle = "#b3b3b3";
                                context2D.fillStyle = "rgba(179, 179, 179, 1)";
                                context2D.strokeStyle = rgbaColor;
                                context2D.lineWidth = 1.5;
                                context2D.lineJoin = "round";
                                context2D.miterLimit = "4";
                                context2D.font = "   15px ";
                                context2D.beginPath();
                                context2D.moveTo(11.578125, 11.71875);
                                context2D.lineTo(12.421875, 11.71875);
                                context2D.lineTo(12.421875, 24);
                                context2D.lineTo(11.578125, 24);
                                context2D.closePath();
                                context2D.fill();
                                context2D.stroke();
                                context2D.restore();
                                context2D.save();
                                context2D.fillStyle = color.toCssColorString().replace("rgb", "rgba").replace(")", ", 1)");
                                context2D.strokeStyle = rgbaColor;
                                context2D.lineWidth = 1.5;
                                context2D.lineJoin = "round";
                                context2D.miterLimit = "4";
                                context2D.font = "   15px ";
                                context2D.beginPath();
                                context2D.moveTo(17, 7);
                                context2D.translate(12, 7);
                                context2D.rotate(0);
                                context2D.arc(0, 0, 5, 0, 1.5707963267948966, 0);
                                context2D.rotate(0);
                                context2D.translate(-12, -7);
                                context2D.translate(12, 7);
                                context2D.rotate(0);
                                context2D.arc(0, 0, 5, 1.5707963267948966, 3.141592653589793, 0);
                                context2D.rotate(0);
                                context2D.translate(-12, -7);
                                context2D.translate(12, 7);
                                context2D.rotate(0);
                                context2D.arc(0, 0, 5, 3.141592653589793, 4.71238898038469, 0);
                                context2D.rotate(0);
                                context2D.translate(-12, -7);
                                context2D.translate(12, 7);
                                context2D.rotate(0);
                                context2D.arc(0, 0, 5, -1.5707963267948966, 0, 0);
                                context2D.rotate(0);
                                context2D.translate(-12, -7);
                                context2D.closePath();
                                context2D.fill();
                                context2D.stroke();
                                context2D.restore();
                            };

                            const createPin = function (color, size) {
                                if (!pinBuilder._cache) {
                                    pinBuilder._cache = {};
                                }

                                stringifyScratch[0] = color;
                                stringifyScratch[1] = size;
                                var id = JSON.stringify(stringifyScratch);

                                var item = pinBuilder._cache[id];
                                if (item) {
                                    return item;
                                }

                                var canvas = document.createElement('canvas');
                                canvas.width = size;
                                canvas.height = size;

                                var context2D = canvas.getContext('2d');
                                drawPin(context2D, color, size);

                                pinBuilder._cache[id] = canvas;
                                return canvas;
                            }

                            return new Cesium.Entity({
                                name: feature.id,
                                position: coords[0],
                                billboard: {
                                    image: createPin(Cesium.Color.fromCssColorString(feature.options.strokeColor ? feature.options.strokeColor : TC.Cfg.styles.point.strokeColor), 48).toDataURL(),
                                    eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                                }
                            });
                        default:
                            return new Cesium.Entity({
                                name: feature.id,
                                position: coords[0],
                                billboard: {
                                    image: pinBuilder.fromColor(Cesium.Color.fromCssColorString(feature.options.fillColor ? feature.options.fillColor : TC.Cfg.styles.point.fillColor), 32).toDataURL(),
                                    eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                                }
                            });
                    }
                };
            }

            return point;
        };

        this.convert = function (scn, feature, sourceCrs, targetCrs) {
            scene = scn;

            var byPromise = false;
            var cartesians = [];
            var toCartesian = function (coord, arr) {
                if (!Array.isArray(coord)) {
                    return;
                }

                if (sourceCrs !== targetCrs) {
                    coord = TC.Util.reproject(coord, sourceCrs, targetCrs);
                }

                arr.push(coord.length > 2 ?
                    Cesium.Cartesian3.fromDegrees(coord[0], coord[1], coord[2]) :
                    Cesium.Cartesian3.fromDegrees(coord[0], coord[1]));
            };

            var obj;
            var geometry = feature.geometry;
            var converter;

            var point,
                points,
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
                case (TC.feature.Circle && feature.CLASSNAME == "TC.feature.Circle"):
                    forPoints(geometry, cartesians);
                    converter = circleConverter.call(self, feature);
                    break;
                case (TC.feature.MultiPolygon && feature.CLASSNAME == "TC.feature.MultiPolygon"):
                    polygons = geometry;
                    if (Array.isArray(polygons)) {
                        forPolygons(polygons);

                        converter = polygonConverter.call(self, feature);
                        byPromise = true;
                    }
                    break;
                case ((TC.feature.Polygon && feature.CLASSNAME == "TC.feature.Polygon") || (TC.feature.MultiPolyline && feature.CLASSNAME == "TC.feature.MultiPolyline")):
                    ringsOrPolylines = geometry;
                    if (Array.isArray(ringsOrPolylines)) {
                        forRingsOrPolylines(ringsOrPolylines, cartesians);

                        if (feature.CLASSNAME == "TC.feature.Polygon") {
                            converter = polygonConverter(feature);
                            byPromise = true;
                        }
                        else if (feature.CLASSNAME == "TC.feature.MultiPolyline") {
                            converter = lineConverter(feature);
                            byPromise = true;
                        }
                    }
                    break;
                case (TC.feature.Polyline && feature.CLASSNAME == "TC.feature.Polyline"):
                    points = geometry;
                    if (Array.isArray(points)) {
                        forPoints(points, cartesians);

                        converter = lineConverter(feature);
                        byPromise = true;
                    }
                    break;
                case (TC.feature.Marker && feature.CLASSNAME == "TC.feature.Marker"):
                    points = [geometry];
                    forPoints(points, cartesians);

                    converter = pointConverter(feature);
                    break;
                case (TC.feature.Point && feature.CLASSNAME == "TC.feature.Point"):
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
                boundigSphere: Cesium.BoundingSphere.fromPoints(cartesians)
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
            var isBaseRaster = map.baseLayer instanceof TC.layer.Raster;

            if (isBaseRaster) {
                if (!isCompatible(map.baseLayer, self.view3D.crs)) {
                    var fallbackLayer = map.baseLayer.getFallbackLayer();
                    if (fallbackLayer) {
                        fallbackLayer._capabilitiesPromise.then(function () {
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
                            return fallbackLayer._capabilitiesPromise.then(function () {
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
                            map.baseLayers[i].mustReproject = results[i];
                        }

                        //map.trigger(TC.Consts.event.VIEWCHANGE, { view: TC.Consts.view.THREED });
                    }

                    resolve();
                });
            }

            currentMapCfg.baseMap = isBaseRaster ? map.baseLayer : self.Consts.BLANK_BASE;
        });
    };

    viewProto.init = function (options) {
        const self = this;

        self.events = self.map.$events;

        self.selectors = {
            divThreedMap: options.divMap
        };

        if (options.terrain) {
            self.terrain = options.terrain;
        } else {
            throw Error("Falta configuración del terreno");
        }

        if (options.terrainFallback && options.terrainFallback.url && options.terrainFallback.coverageName && options.terrainFallback.noDataValue) {
            self.terrainFallback = {
                url: options.terrainFallback.url.trim(),
                layerName: options.terrainFallback.coverageName,
                format: options.terrainFallback.format,
                noDataValue: options.terrainFallback.noDataValue
            };
        } else if (options.terrainFallback && (!options.terrainFallback.url || !options.terrainFallback.coverageName || !options.terrainFallback.noDataValue)) {
            throw Error("Faltan datos sobre el terreno de respaldo");
        }

        if (options.controls) {
            self.allowedControls = options.controls;
        }

        self.mapView = new MapView(self.map, self);

        self.map.on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
            self.mapView.metersPerUnit = self.map.getMetersPerUnit();
        });

        self.map.view3D = self.view3D;

        /* provisional: no dispongo de getRenderedHtml porque ya no es un control */
        self.getRenderedHtml(self.CLASS + '-overlay', {}, function (html) {
            const parser = new DOMParser();
            self.overlay = parser.parseFromString(html, 'text/html').body.firstChild;
        });
    };

    viewProto.apply = function (options) {
        const self = this;

        options = options || {};

        if (options.map) {
            self.map = options.map;

            if (!self.map.view3D) {
                var viewName = self.VIEWNAME = self.VIEWNAME.substr(0, 1).toLowerCase() + self.VIEWNAME.substr(1);
                if (self.map.options.views && self.map.options.views.hasOwnProperty(viewName)) {
                    self.init(self.map.options.views[viewName]);
                } else {
                    throw Error('Falta configuración de la vista');
                }
            }

            self.view3D.view2DCRS = options.map.crs;

            options.map.on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
                self.view3D.view2DCRS = e.newCrs;
            });
        } else {
            throw Error('Falta referencia al mapa 2D');
        }

        if (options.state) {
            self.map.toast(TC.Util.getLocaleString(self.map.options.locale, 'threed.apply3DState'), { type: TC.Consts.msgType.INFO });
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
                if (ctlsOnMap.length === 0) { // si un control soportado aún no está en el mapa, nos suscribimos al addcontrol para controlarlo
                    self.map.on(TC.Consts.event.CONTROLADD, function (ctrlClass, e) {
                        try {
                            var instance = new Function("return new " + ctrlClass + "()")();
                            if (instance.CLASS === e.control.CLASS) {
                                self.ctrlsToMng.push(e.control);
                            }
                        } catch (error) { console.warn("Error al obtener la clase CSS de un control soportado"); }
                    }.bind(self, 'TC.control.' + ctl));
                }
                ctls = ctls.concat(ctlsOnMap);
            }

            self.ctrlsToMng = ctls;
        }

        self.map.on3DView = true;

        self.map.div.classList.add(TC.Consts.classes.THREED);

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

                    self.divThreedMap.classList.remove(self.CLASS + '-divMap-fadeOut');
                    self.divThreedMap.classList.add(self.CLASS + '-divMap-fadeIn');
                    self.mapView.viewHTML.classList.remove(self.CLASS + '-divMap-fadeIn');
                    self.mapView.viewHTML.classList.add(self.CLASS + '-divMap-fadeOut');

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
                                return elem.type === TC.Consts.layerType.WMTS || elem.type === TC.Consts.layerType.WMS;
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
                                        destination: Cesium.Cartesian3.fromRadians(options.state.cp[0], options.state.cp[1], options.state.cp[2]),
                                        orientation: {
                                            heading: options.state.chpr[0],
                                            pitch: options.state.chpr[1],
                                            roll: options.state.chpr[2]
                                        },
                                        complete: applyEnd
                                    });

                                } else if (options.animateRendering) {
                                    let angle = Cesium.Math.toRadians(50);
                                    let pickBP = pickBottomPoint(self.viewer.scene);

                                    const readyPickBP = function (_pickBP) {
                                        let matrixPickBP = Cesium.Matrix4.fromTranslation(_pickBP);

                                        self.view3D.rotateAroundAxis(self.viewer.scene.camera, -angle,
                                            self.viewer.scene.camera.right, matrixPickBP, {
                                                duration: 2000,
                                                callback: animationCallback
                                            });
                                    };

                                    const animationCallback = function () {
                                        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = self.view3D.initialRectangle = self.viewer.camera.computeViewRectangle();
                                        Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

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
                                                    let homeButton = document.querySelectorAll('.' + TC.control.NavBarHome.prototype.CLASS + '-btn');
                                                    if (homeButton && homeButton.length > 0) {
                                                        homeButton[0].click();
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

                                self.map.trigger(TC.Consts.event.VIEWCHANGE, { view: TC.Consts.view.THREED });

                                self.events.on(TC.Consts.event.TERRAINLOADED, function () {

                                    const addHeight = function (position) {
                                        var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
                                        var height = self.viewer.scene.globe.getHeight(cartographic) || 0;
                                        var finalCartographic = {
                                            longitude: cartographic.longitude,
                                            latitude: cartographic.latitude,
                                            height: cartographic.height + height
                                        };

                                        return Cesium.Ellipsoid.WGS84.cartographicToCartesian(finalCartographic);
                                    };

                                    var markers = self.viewer.entities.values.filter(function (entity) {
                                        return entity.billboard;
                                    });

                                    if (markers.length > 0) {
                                        markers.forEach(function (marker) {
                                            marker.position = addHeight(Cesium.Property.getValueOrUndefined(marker.position, Cesium.JulianDate.now));
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
                                .catch(() => { console.log('3051'); applyEnd(); });
                        })
                        .catch(() => { console.log('3053'); applyEnd(); });
                })
                .catch(() => { console.log('3055'); applyEnd(); });
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

        self.map.on3DView = false;

        //self.map.view3D = null;

        self.view3D.cameraControls.resetRotation({ duration: 1000 }).then(function () {

            var animationCallback = function () {

                self.map.div.classList.remove(TC.Consts.classes.THREED);

                /* atribuciones del terreno */
                self.map.trigger(TC.Consts.event.TERRAINPROVIDERREMOVE, { terrainProvider: self.viewer.scene.terrainProvider });

                if (self.viewer.scene.terrainProvider.fallbackProvider) {
                    self.viewer.scene.terrainProvider.fallbackProvider.forEach(function (provider) {
                        self.map.trigger(TC.Consts.event.TERRAINPROVIDERREMOVE, { terrainProvider: provider });
                    });
                }

                self.view3D.setViewFromCameraView.call(self).then(function () {
                    self.divThreedMap.classList.remove(self.classes.MAP3D, self.CLASS + '-divMap-fadeIn');
                    self.divThreedMap.classList.add(self.CLASS + '-divMap-fadeOut');
                    self.mapView.viewHTML.classList.remove(self.CLASS + '-divMap-fadeOut');
                    self.mapView.viewHTML.classList.add(self.CLASS + '-divMap-fadeIn');

                    self.view3D.destroy.call(self);

                    self.map.getLoadingIndicator().removeWait(self.waiting);
                    delete self.waiting;

                    if (options.callback) {
                        options.callback();
                    }
                });

                self.mapView.setRotation(0);
                self._ovMap.wrap.draw3DCamera(null);
            };

            var bottom = pickBottomPoint(self.viewer.scene);
            var transform = Cesium.Matrix4.fromTranslation(bottom);
            var angle = computeAngleToZenith(self.viewer.scene, bottom);

            self.view3D.rotateAroundAxis(self.viewer.scene.camera, -angle, self.viewer.scene.camera.right, transform, {
                duration: 1500,
                callback: animationCallback
            });
        });
    };

    viewProto.view3D = (function () {
        const rasterConverter = new RasterConverter(/(EPSG\:?4326)/i);
        const featureConverter = new FeatureConverter();

        const overrideDesktopZoom = function () {
            var self = this;

            if (!TC.Util.detectMobile()) {
                self.viewer.scene.screenSpaceCameraController.enableZoom = false;

                var element = self.viewer.scene.canvas;
                // detect available wheel event
                var wheelEvent;
                if ('onwheel' in element) {
                    // spec event type
                    wheelEvent = 'wheel';
                } else if (document.onmousewheel !== undefined) {
                    // legacy event type
                    wheelEvent = 'mousewheel';
                } else {
                    // older Firefox
                    wheelEvent = 'DOMMouseScroll';
                }
                element.addEventListener(wheelEvent, function (event) {
                    var delta;
                    // standard wheel event uses deltaY.  sign is opposite wheelDelta.
                    // deltaMode indicates what unit it is in.
                    if (event.deltaY) {
                        var deltaMode = event.deltaMode;
                        if (deltaMode === event.DOM_DELTA_PIXEL) {
                            delta = - event.deltaY;
                        } else if (deltaMode === event.DOM_DELTA_LINE) {
                            delta = - event.deltaY * 40;
                        } else {
                            // DOM_DELTA_PAGE
                            delta = - event.deltaY * 120;
                        }
                    } else if (event.detail > 0) {
                        // old Firefox versions use event.detail to count the number of clicks. The sign
                        // of the integer is the direction the wheel is scrolled.
                        delta = event.detail * -120;
                    } else {
                        delta = event.wheelDelta;
                    }

                    self.view3D.zoomToCartesian.call(self, self.view3D._lastMousePosition, delta);

                }, false);

                if (!self.eventHandlers) {
                    self.eventHandlers = {};
                }

                self.eventHandlers.handlerOfMouse = new Cesium.ScreenSpaceEventHandler(self.viewer.scene.canvas);
                self.eventHandlers.handlerOfMouse.setInputAction(function (event) {
                    self.view3D._lastMousePosition = event;
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                self.eventHandlers.handlerOfMouse.setInputAction(function (wheelZoomAmount) {
                    self.view3D.zoomToCartesian.call(self, self.view3D._lastMousePosition, wheelZoomAmount);
                }, Cesium.ScreenSpaceEventType.WHEEL);
                var pinchCenterPosition = new Cesium.Cartesian2();
                var pinchAmount = 0;
                self.eventHandlers.handlerOfMouse.setInputAction(function (event) {
                    Cesium.Cartesian2.lerp(event.position1, event.position2, 0.5, pinchCenterPosition);
                }, Cesium.ScreenSpaceEventType.PINCH_START);
                self.eventHandlers.handlerOfMouse.setInputAction(function (event) {
                    var diff = event.distance.endPosition.y - event.distance.startPosition.y;
                    var rangeWindowRatio = diff / self.viewer.scene.canvas.clientHeight;
                    rangeWindowRatio = Math.min(rangeWindowRatio, self.viewer.scene.screenSpaceCameraController.maximumMovementRatio);
                    pinchAmount = rangeWindowRatio;
                }, Cesium.ScreenSpaceEventType.PINCH_MOVE);
                self.eventHandlers.handlerOfMouse.setInputAction(function (event) {
                    self.view3D.zoomToCartesian.call(self, { endPosition: pinchCenterPosition }, pinchAmount);
                }, Cesium.ScreenSpaceEventType.PINCH_END);
            }
        };

        const addFeature = function (csFeature) {
            var addedFeature = csFeature;
            switch (true) {
                case csFeature instanceof Cesium.GroundPrimitive: {
                    this.viewer.scene.groundPrimitives.add(csFeature);
                    break;
                }
                case csFeature instanceof Object && csFeature.hasOwnProperty('billboard'): {
                    if (!this.viewer.billboardCollection) {
                        this.viewer.billboardCollection = this.viewer.scene.primitives.add(new Cesium.BillboardCollection({
                            scene: this.viewer.scene
                        }));
                    }

                    var billboardAtCollection = this.viewer.billboardCollection.add({
                        position: csFeature.position,
                        image: csFeature.billboard.image,
                        verticalOrigin: csFeature.billboard.verticalOrigin,
                        heightReference: csFeature.billboard.heightReference
                    });

                    addedFeature = billboardAtCollection;
                    break;
                }
                case csFeature instanceof Object: {
                    addedFeature = this.viewer.entities.getById(csFeature.id);
                    if (!addedFeature) {
                        addedFeature = this.viewer.entities.add(csFeature);
                    }
                    break;
                }
            }

            this.viewer.scene.requestRender();

            return addedFeature;
        };
        const linkFeature = function (map, idLayer, feature, id) {
            if (!map.vector2DFeatures.hasOwnProperty(idLayer)) {
                map.vector2DFeatures[idLayer] = {};
                map.vector2DFeatures[idLayer][id] = [feature];
            } else {
                if (!map.vector2DFeatures[idLayer].hasOwnProperty(id)) {
                    map.vector2DFeatures[idLayer][id] = [feature];
                } else {
                    map.vector2DFeatures[idLayer][id].push(feature);
                }
            }
        };

        const listenTo = [
            TC.Consts.event.BEFOREBASELAYERCHANGE, TC.Consts.event.BASELAYERCHANGE,
            TC.Consts.event.LAYERADD, TC.Consts.event.LAYERREMOVE, TC.Consts.event.LAYERVISIBILITY, TC.Consts.event.LAYEROPACITY, TC.Consts.event.LAYERORDER,
            TC.Consts.event.FEATUREADD, TC.Consts.event.FEATUREREMOVE, TC.Consts.event.FEATURESCLEAR
            /*, TC.Consts.event.ZOOM no encuentro en qué casos debemos escuchar el evento ZOOM de 2D, solo trae problemas */, TC.Consts.event.ZOOMTO];

        const event2DHandler = function (e) {
            var self = this;

            switch (true) {
                case e.type == TC.Consts.event.BEFOREBASELAYERCHANGE:
                    if (!self.waiting)
                        self.waiting = self.map.getLoadingIndicator().addWait();
                    break;
                case e.type == TC.Consts.event.BASELAYERCHANGE: {
                    self.view3D.setBaseLayer.call(self, e.layer);
                    break;
                }
                case e.type == TC.Consts.event.LAYERADD: {
                    self.view3D.addLayer.call(self, e.layer);
                    break;
                }
                case e.type == TC.Consts.event.LAYERREMOVE: {
                    self.view3D.removeLayer.call(self, e.layer);
                    break;
                }
                case e.type == TC.Consts.event.LAYERVISIBILITY: {
                    self.view3D.setRenderOptionsLayer.call(self, e.layer, { visibility: e.layer.getVisibility() });
                    break;
                }
                case e.type == TC.Consts.event.LAYEROPACITY: {
                    self.view3D.setRenderOptionsLayer.call(self, e.layer, { opacity: e.layer.getOpacity() });
                    self.viewer.scene.requestRender();
                    break;
                }
                case e.type == TC.Consts.event.LAYERORDER: {
                    for (var i = 0; i < self.view3D.workLayers.length; i++) {
                        if (self.view3D.workLayers[i].imageryProvider && self.view3D.workLayers[i].imageryProvider.layers.join(',') === e.layer.names.join(',')) {

                            if (e.oldIndex > e.newIndex) {
                                var positions = e.oldIndex - e.newIndex;
                                for (var p = 0; p < positions; p++) {
                                    self.viewer.scene.imageryLayers.lower(self.view3D.workLayers[i]);
                                }

                            } else {
                                var positions = e.newIndex - e.oldIndex;
                                for (var p = 0; p < positions; p++) {
                                    self.viewer.scene.imageryLayers.raise(self.view3D.workLayers[i]);
                                }
                            }

                            self.view3D.workLayers.splice(e.newIndex, 0, self.view3D.workLayers.splice(e.oldIndex, 1)[0]);
                            break;
                        }
                    }
                    break;
                }
                case e.type == TC.Consts.event.FEATUREADD: {
                    self.view3D.addFeature.call(self.view3D, e.feature);
                    break;
                }
                case e.type == TC.Consts.event.FEATUREREMOVE: {

                    if (self.view3D.vector2DFeatures && self.view3D.vector2DFeatures.hasOwnProperty(e.layer.id)) {

                        const remove = function (feature) {
                            if (self.view3D.vector2DFeatures[e.layer.id].hasOwnProperty(feature.id)) {
                                var threedFeature = self.view3D.vector2DFeatures[e.layer.id][feature.id];
                                for (var i = 0; i < threedFeature.length; i++) {
                                    self.view3D.removeFeature.call(self, threedFeature[i]);
                                }

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
                case e.type == TC.Consts.event.FEATURESCLEAR: {

                    if (self.view3D.vector2DFeatures && self.view3D.vector2DFeatures.hasOwnProperty(e.layer.id)) {

                        for (var featureId in self.view3D.vector2DFeatures[e.layer.id]) {
                            var threedFeature = self.view3D.vector2DFeatures[e.layer.id][featureId];

                            for (var i = 0; i < threedFeature.length; i++) {
                                self.view3D.removeFeature.call(self, threedFeature[i]);
                            }

                            delete self.view3D.vector2DFeatures[e.layer.id][featureId];
                        }
                    }
                    break;
                }
                case e.type == TC.Consts.event.ZOOM: {
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
                case e.type == TC.Consts.event.ZOOMTO: {

                    if (self.lastZoom && performance.now() - self.lastZoom < 50) {
                        return;
                    }
                    self.lastZoom = performance.now();

                    var coordsXY = self.view3D.view2DCRS !== self.view3D.crs ? TC.Util.reproject(e.extent.slice(0, 2), self.view3D.view2DCRS, self.view3D.crs) : e.extent.slice(0, 2);
                    var coordsXY2 = self.view3D.view2DCRS !== self.view3D.crs ? TC.Util.reproject(e.extent.slice(2), self.view3D.view2DCRS, self.view3D.crs) : e.extent.slice(2);
                    var rectangle = Cesium.Rectangle.fromDegrees(coordsXY[0], coordsXY[1], coordsXY2[0], coordsXY2[1]);

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

            if (!self.view3D.trackingEntity) {
                var geolocation2D = self.view3D.linked2DControls.geolocation;
                var track = geolocation2D.layerTracking.features.filter(function (feature) {
                    return feature.CLASSNAME == "TC.feature.Polyline";
                });

                if (track && track.length > 0) {

                    var positions = [];
                    const positionCallback = new Cesium.CallbackProperty(function (time, result) {
                        if (track[0].geometry.length > positions.length) {
                            var newCartographicPositions = track[0].geometry.slice(positions.length).map(function (coordinate) {
                                var reprojected = coordinate;

                                if (this.view3D.view2DCRS !== this.view3D.crs) {
                                    reprojected = TC.Util.reproject(coordinate, this.view3D.view2DCRS, this.view3D.crs);
                                }

                                return Cesium.Cartographic.fromDegrees(reprojected[0], reprojected[1], coordinate[2]);
                            }.bind(this));

                            var updatedPositions = [];
                            if (newCartographicPositions instanceof Array) {
                                updatedPositions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(newCartographicPositions);
                            } else {
                                updatedPositions = [Cesium.Ellipsoid.WGS84.cartographicToCartesian(newCartographicPositions)];
                            }

                            positions = positions.concat(updatedPositions);
                            return positions;
                        }

                        return positions;

                    }.bind(this), false);

                    var entityTracking = new Cesium.Entity({
                        id: "trackingEntity",
                        polyline: {
                            positions: positionCallback,
                            clampToGround: true,
                            width: 3,
                            material: new Cesium.PolylineDashMaterialProperty({
                                color: new Cesium.CallbackProperty(function (time, result) {
                                    self.viewer.scene.requestRender();
                                    return Cesium.Color.fromAlpha(new Cesium.Color(0, 255, 209), geolocation2D.track.renderTrack.checked ? 1 : 0);
                                }.bind(this), false),
                                gapColor: Cesium.Color.TRANSPARENT
                            })
                        }
                    });

                    self.view3D.trackingEntity = self.viewer.entities.add(entityTracking);
                    self.viewer.scene.requestRender();
                }
            }
        };
        const geolocation_videoControls = function (event) {
            var self = this;

            var geolocation2D = self.view3D.linked2DControls.geolocation;
            switch (true) {
                case geolocation2D.Const.Event.IMPORTEDTRACK.indexOf(event.type) > -1:
                case event.target.className.indexOf('draw') > -1 && event.target.parentElement.classList.contains(geolocation2D.Const.Classes.SELECTEDTRACK):
                case !(event.target.parentElement && event.target.parentElement.classList.contains(geolocation2D.Const.Classes.SELECTEDTRACK)):
                case event.target.className.indexOf('stop') > -1:

                    if (self.map.on3DView) {
                        self.viewer.clock.shouldAnimate = false;
                        self.viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
                    }

                    if (self.view3D.trackDataSource) {
                        if (self.view3D.trackDataSource.length > 0) {
                            var entity = self.view3D.trackDataSource.get(0).entities.values[0];
                            self.viewer.entities.removeById(entity.id);
                        }

                        self.view3D.trackDataSource.destroy();
                        delete self.view3D.trackDataSource;
                    }

                    geolocation2D.chartProgressClear();

                    if (event.custom) {
                        const selectedTrack = geolocation2D.getSelectedTrack();
                        if (selectedTrack) {
                            selectedTrack.querySelector(geolocation2D.Const.Selector.STOP).click();
                        }
                    }
                    break;
                case event.target.className.indexOf('play') > -1:
                    self.viewer.clock.shouldAnimate = false;
                    break;
                case event.target.className.indexOf('pause') > -1:
                    self.viewer.clock.shouldAnimate = true;
                    break;
                case event.target.className.indexOf('back') > -1:
                case event.target.className.indexOf('for') > -1:
                    self.viewer.clock.multiplier = geolocation2D.simulate_speed;
                    break;
            }
        };
        /* fin geolocation */

        const alterAllowedControls = function (view) {
            var self = this;

            const ctrlsToMngCLASS = self.ctrlsToMng.map(function (ctrl) { return ctrl.CLASS });

            self.map.controls.forEach(function (mapCtrl) {
                if (ctrlsToMngCLASS.indexOf(mapCtrl.CLASS) < 0) {
                    switch (true) {
                        case (TC.Consts.view.DEFAULT == view):
                            mapCtrl.enable();
                            break;
                        case (TC.Consts.view.THREED == view):
                            mapCtrl.disable();
                            break;
                    }
                }
            });

            switch (true) {
                case (TC.Consts.view.DEFAULT == view):
                    document.querySelectorAll('[data-no-3d]').forEach(function (elm) {
                        elm.classList.remove(TC.Consts.classes.THREED_HIDDEN);
                    });
                    self.ctrlsToMng.forEach(function (ctl) {
                        ctl.div.classList.remove(TC.Consts.classes.THREED);
                    });
                    break;
                case (TC.Consts.view.THREED == view):
                    document.querySelectorAll('[data-no-3d]').forEach(function (elm) {
                        elm.classList.add(TC.Consts.classes.THREED_HIDDEN);
                    });
                    self.ctrlsToMng.forEach(function (ctl) {
                        ctl.div.classList.add(TC.Consts.classes.THREED);
                    });
                    break;
            }

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

                var pickedFeature = self.viewer.scene.pick(movement.position);
                if (pickedFeature && pickedFeature.id) {
                    var id = pickedFeature.id instanceof Cesium.Entity ? pickedFeature.id.name : pickedFeature.id;

                    var founded = false;
                    for (var layerId in self.view3D.vector2DFeatures) {
                        if (self.view3D.vector2DFeatures[layerId].hasOwnProperty(id)) {
                            var feature2D = self.map.workLayers.filter(function (workLayer) {
                                return workLayer.id === layerId;
                            })[0].features.filter(function (feature) {
                                return id.indexOf(feature.id) > -1 && feature.showsPopup;
                            });

                            if (feature2D && feature2D.length > 0) {
                                founded = true;

                                if (feature2D.CLASSNAME !== "TC.feature.Point" && feature2D.CLASSNAME !== "TC.feature.Marker") {

                                    var ray = self.viewer.camera.getPickRay(movement.position);
                                    var position = self.viewer.scene.globe.pick(ray, self.viewer.scene);

                                    var marker = self.map.view3D.addNativeFeature.call(self.map, {
                                        position: position,
                                        billboard: {
                                            image: TC.Util.getBackgroundUrlFromCss(self.CLASS + '-marker'),
                                            eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                                        }
                                    });

                                    const onDrawTable = function (e) {
                                        if (e.control) {
                                            const control = e.control;
                                            const onTableClose = function (e) {
                                                if (e.control === control) {
                                                    self.map.off(TC.Consts.event.RESULTSPANELCLOSE, onTableClose);
                                                    self.map.view3D.removeFeature.call(self, marker);
                                                }
                                            };
                                            self.map.on(TC.Consts.event.RESULTSPANELCLOSE, onTableClose);
                                            self.map.off(TC.Consts.event.DRAWTABLE, onDrawTable);
                                        }
                                    }
                                    self.map.on(TC.Consts.event.DRAWTABLE, onDrawTable);
                                }

                                self.map.trigger(TC.Consts.event.FEATURECLICK, { feature: feature2D[0] });

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
            };
            const onMouseMoveOnCanvas = (movement) => {
                // Si estamos anclados a una entidad ignoro los click en el terreno
                if (self.viewer.trackedEntity) {
                    return;
                }
                var pickedFeature = self.viewer.scene.pick(movement.endPosition);
                if (pickedFeature && pickedFeature.id) {
                    self.viewer.canvas.style.cursor = 'pointer';
                } else {
                    self.viewer.canvas.style.cursor = 'default';
                }
            };

            if (TC.Consts.view.THREED === view) {

                if (!self.view3D.linked2DControls.featureInfo) {
                    self.view3D.linked2DControls.featureInfo = new TwoDLinkedFeatureInfo(self);
                }

                if (!self.eventHandlers) {
                    self.eventHandlers = {};
                }

                self.eventHandlers.handlerOfFeatures = new Cesium.ScreenSpaceEventHandler(self.viewer.scene.canvas);
                self.eventHandlers.handlerOfFeatures.setInputAction(onLeftClickOnCanvas, Cesium.ScreenSpaceEventType.LEFT_CLICK);
                self.eventHandlers.handlerOfFeatures.setInputAction(onMouseMoveOnCanvas, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            } else if (TC.Consts.view.DEFAULT === view) {
                if (self.eventHandlers.handlerOfFeatures) {
                    self.eventHandlers.handlerOfFeatures.destroy();
                }
            }

            if (!self.view3D.linked2DControls.geolocation && self.allowedControls.indexOf("geolocation") > -1) {
                self.view3D.linked2DControls.geolocation = self.ctrlsToMng.filter(function (ctrl) {
                    return ctrl instanceof TC.control.Geolocation;
                })[0];
            }

            if (self.view3D.linked2DControls.geolocation) {

                var geolocation2D = self.view3D.linked2DControls.geolocation;

                if (TC.Consts.view.THREED === view) {

                    var commands = [geolocation2D.Const.Selector.STOP,
                    geolocation2D.Const.Selector.PAUSE,
                    geolocation2D.Const.Selector.BACKWARD,
                    geolocation2D.Const.Selector.FORWARD,
                    geolocation2D.Const.Selector.DRAW];
                    var geolocation_videoControls_ = geolocation_videoControls.bind(self);

                    var lstEventListener = function (e) {
                        var classes = commands;
                        if (commands.some(function (cls) {
                            return e.target.classList.contains(cls.replace('.', ''))
                        })) {
                            geolocation_videoControls_(e);
                        }
                    };

                    geolocation2D.reset = function () {

                        TC.wrap.control.Geolocation.prototype.setTracking = geolocation2D._setTracking;
                        TC.wrap.control.Geolocation.prototype.simulateTrack = geolocation2D._wrap_simulateTrack;
                        TC.wrap.control.Geolocation.prototype.showElevationMarker = geolocation2D._wrap_showElevationMarker;
                        TC.wrap.control.Geolocation.prototype.hideElevationMarker = geolocation2D._wrap_hideElevationMarker;

                        geolocation2D.simulateTrack = geolocation2D._simulateTrack;
                        geolocation2D.elevationTrack = geolocation2D._elevationTrack;

                        commands.forEach(function (command) {
                            document.removeEventListener('click', lstEventListener);
                        });

                        geolocation2D.off(geolocation2D.Const.Event.IMPORTEDTRACK, geolocation_videoControls_);

                    };

                    document.addEventListener('click', lstEventListener);

                    geolocation2D.on(geolocation2D.Const.Event.IMPORTEDTRACK, geolocation_videoControls_);


                    var _newPosition = false;
                    geolocation2D._setTracking = TC.wrap.control.Geolocation.prototype.setTracking;
                    TC.wrap.control.Geolocation.prototype.setTracking = function (tracking) {

                        geolocation2D._setTracking.call(geolocation2D.wrap, tracking);

                        if (tracking) {
                            geolocation2D.on(geolocation2D.Const.Event.POSITIONCHANGE, geolocation_newPosition.bind(self));
                        } else {
                            _newPosition = false;
                            geolocation2D.off(geolocation2D.Const.Event.POSITIONCHANGE, geolocation_newPosition.bind(self));
                            if (self.view3D.trackingEntity) {
                                self.viewer.entities.removeById(self.view3D.trackingEntity.id);
                                delete self.view3D.trackingEntity;
                            }
                        }
                    };

                    geolocation2D._elevationTrack = geolocation2D.elevationTrack;
                    geolocation2D.elevationTrack = function (li, resized) {

                        if (resized) {
                            geolocation_videoControls.call(self, { target: { className: 'stop' }, custom: true });
                        }

                        return geolocation2D._elevationTrack.call(geolocation2D, li, resized);
                    };

                    // Si en el paso de 2D a 3D hay perfil dibujado, lanzamos el resize
                    const selectedTrack = geolocation2D.getSelectedTrack();
                    if (selectedTrack && geolocation2D.hasElevation) {
                        geolocation2D.elevationTrack.call(self, selectedTrack, true);
                    }

                    var simulationOnPreUpdate; // listener de la simulación.
                    geolocation2D._simulateTrack = geolocation2D.simulateTrack;
                    geolocation2D.simulateTrack = function (li) {
                        var self = this.view3D.linked2DControls.geolocation;

                        self.map.toast(self.getLocaleString('threed.interactionSimulation'), { type: TC.Consts.msgType.INFO });

                        // tenemos una simulación activa
                        if (this.viewer.clock.shouldAnimate && this.view3D.trackDataSource) {
                            simulationOnPreUpdate();
                            geolocation_videoControls.call(this, { target: { className: 'stop' }, custom: true });
                        }

                        self.simulate_speed = 1;
                        self.drawTrack(li, false).then(function () {
                            self.wrap.simulateTrack();

                            if (self.layerTrack && self.layerTrack.features) {
                                var track = self.layerTrack.features.filter(function (feature) {
                                    return feature.CLASSNAME == "TC.feature.Polyline";
                                })[0];

                                if (track) {
                                    toCZML.call(this, track.geometry, track.wrap.feature.getGeometry().layout, "track", self.markerStyle, self.lineStyle, self.walkingSpeed).then(function (result) {
                                        var czml = result.czml, totalDistance = result.totalDistance, coordinates2D = result.coordinates2D;

                                        this.view3D.trackDataSource = new Cesium.DataSourceCollection();
                                        var dataSourceDisplay = new Cesium.DataSourceDisplay({
                                            scene: this.viewer.scene,
                                            dataSourceCollection: this.view3D.trackDataSource
                                        });

                                        this.viewer.scene.preRender.addEventListener(function (scene, time) {
                                            dataSourceDisplay.update(time);
                                        });

                                        this.view3D.trackDataSource.add(Cesium.CzmlDataSource.load(czml)).then(function (layout, coordinates2D, czmlDataSource) {

                                            this.viewer.clock.shouldAnimate = false;

                                            var start, stop;
                                            start = czmlDataSource.clock.startTime;
                                            stop = czmlDataSource.clock.stopTime;

                                            this.viewer.clock.startTime = start.clone();
                                            this.viewer.clock.stopTime = stop.clone();
                                            this.viewer.clock.currentTime = start.clone();
                                            this.viewer.clock.clockStep = Cesium.ClockStep.TICK_DEPENDENT
                                            this.viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
                                            this.viewer.clock.multiplier = 1;

                                            var trackEntity = czmlDataSource.entities.values[0];

                                            trackEntity.layout = layout;

                                            trackEntity.tagLI = li; // tengo que guardar la relación con el HTML porque puede eliminar la selección del track mientras estamos creando la simulación del mismo, y no tengo forma de validarlo

                                            trackEntity.availability = new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
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

                                                    var reprojected = this.view3D.view2DCRS !== this.view3D.crs ? TC.Util.reproject(coordinates2D[0], this.view3D.view2DCRS, this.view3D.crs) : coordinates2D[0];
                                                    var previous = new Cesium.Cartographic.fromDegrees(reprojected[0], reprojected[1]);

                                                    for (var i = 1; i < coordinates2D.length; i++) {
                                                        reprojected = this.view3D.view2DCRS !== this.view3D.crs ? TC.Util.reproject(coordinates2D[i], this.view3D.view2DCRS, this.view3D.crs) : coordinates2D[i];
                                                        var current = new Cesium.Cartographic.fromDegrees(reprojected[0], reprojected[1]);

                                                        doneDistance += new Cesium.EllipsoidGeodesic(previous, current).surfaceDistance;
                                                        previous = current;

                                                        if (doneDistance > distanceCurrent) {
                                                            coordinate = coordinates2D[i - 1];
                                                            break;
                                                        }
                                                    }

                                                    if (coordinate) {
                                                        var heightIndex = trackEntity.layout === ol.geom.GeometryLayout.XYZM ? 2 :
                                                            trackEntity.layout === ol.geom.GeometryLayout.XYZ ? 2 : -1;
                                                        if (heightIndex > -1) {
                                                            return coordinate[heightIndex];
                                                        }
                                                    }

                                                    return 0;
                                                };

                                                var previousPosition, distanceCurrent = 0;
                                                simulationOnPreUpdate = this.viewer.scene.preUpdate.addEventListener(function (scene, currentTime) {

                                                    // mientras estamos preparando la simulación ha eliminado la selección de dicho track 
                                                    const selectedTrack = this.view3D.linked2DControls.geolocation.getSelectedTrack();
                                                    if (!selectedTrack || selectedTrack.getAttribute('data-id') !== trackEntity.tagLI.getAttribute('data-id') ||
                                                        // o hemos llegado al final
                                                        Cesium.JulianDate.greaterThanOrEquals(currentTime, trackEntity.availability.stop)) {

                                                        simulationOnPreUpdate();
                                                        geolocation_videoControls.call(this, { target: { className: 'stop' }, custom: true });

                                                    } else if (this.viewer.clock.shouldAnimate && trackEntity.isAvailable(currentTime)) {

                                                        // gestionamos las posiciones anterior y actual
                                                        if (!previousPosition) {
                                                            previousPosition = Cesium.Cartographic.fromCartesian(Cesium.Property.getValueOrUndefined(trackEntity.position, trackEntity.availability.start));
                                                        }
                                                        currentPosition = Cesium.Cartographic.fromCartesian(Cesium.Property.getValueOrUndefined(trackEntity.position, currentTime));

                                                        // progreso en el perfil (si lo hay)
                                                        if (this.view3D.linked2DControls.geolocation.hasElevation) {
                                                            var timeIndex = trackEntity.layout === ol.geom.GeometryLayout.XYZM ? 3 :
                                                                trackEntity.layout === ol.geom.GeometryLayout.XYM ? 2 : 3;

                                                            this.view3D.linked2DControls.geolocation.chartSetProgress({
                                                                p: [previousPosition.longitude, previousPosition.latitude, previousPosition.height],
                                                                d: distanceCurrent
                                                            },
                                                                [currentPosition.longitude, currentPosition.latitude, get2DHeightAtProgress.call(this, coordinates2D, distanceCurrent)],
                                                                totalDistance, (trackEntity.layout === ol.geom.GeometryLayout.XYZM ||
                                                                    trackEntity.layout === ol.geom.GeometryLayout.XYM ?
                                                                    this.view3D.linked2DControls.geolocation._getTime(Cesium.JulianDate.toDate(trackEntity.availability.start), Cesium.JulianDate.toDate(currentTime)) : false));
                                                        }

                                                        // gestionamos las posiciones anterior y actual y la distancia
                                                        distanceCurrent += new Cesium.EllipsoidGeodesic(previousPosition, currentPosition).surfaceDistance;
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

                        //if (self.parent.hasElevation) {
                        //    self.parent.chartProgressInit();
                        //}
                    };

                    geolocation2D._wrap_showElevationMarker = TC.wrap.control.Geolocation.prototype.showElevationMarker;
                    TC.wrap.control.Geolocation.prototype.showElevationMarker = function (data) {
                        const self = this.view3D.linked2DControls.geolocation;
                        const coords = self.elevationChartData.coords;

                        // GLS: si la capa del track está visible mostramos marcamos punto del gráfico en el mapa
                        if (self.layerTrack.getVisibility() && self.layerTrack.getOpacity() > 0) {

                            var camera = this.viewer.camera;
                            var elevationMarkerPosition = this.view3D.view2DCRS !== this.view3D.crs ? TC.Util.reproject(coords[data[0].index], this.view3D.view2DCRS, this.view3D.crs) : coords[data[0].index];

                            if (!self.elevationMarker) {

                                var billboard = new Cesium.Entity({
                                    position: Cesium.Cartesian3.fromDegrees(elevationMarkerPosition[0], elevationMarkerPosition[1]),
                                    name: 'elevationMarker',
                                    billboard: {
                                        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AcdDDMq7Am38gAAAaFJREFUWMPtlj9rwkAYh3+R0lgKRSi4FCFmczBzp2i+gaMgmK0I3Tq0Y6HDDd0L0tJBSyGbAT9AxI+goFskumUUrDq9XVRi6WkS/xXquyRc7nie++XuOOBYx/rvJYQdqKoqNE1barMsC81mc/cCqqri+eWVfvt2f3sjBJE4CSMwn/kkXVpqj7bL0DQtUAqRTf9hhixkyAo9PnLoRbhWQNd1KIoSGqAoysrxkXXwh8cnMsw6McYCwxljMMw6GWadeBIrBSRJwnA0hivryOULgSQYY8jlC+TKOoajMWKx2Ga7wJV15OwKARCm06lv+FYX4TwJURS5fURR9A0PJBC3q0sSvH5eeLRd3t5BlEomALsKVy6CN7tJuoSJR3g4+tpeAt3eAKlkYpHEurRSycTmArVaDRfnZ7Poi74k5vBub4DT6zsAwFX8Eo7jBBdotVowjU8hbld8SXjhrlyctVXw8f4m8AR87+mO7VADWWogSx27T0S0eHrfO3bf088JdYAFkvDWzuB+JHYOXyWxNzhPYq9wfhJ7hP+UOAjc74XjWH++vgFLJ1bBWXZtUAAAAABJRU5ErkJggg==",
                                        eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                                    }
                                });

                                self.elevationMarker = this.view3D.addNativeFeature.call(this, billboard);
                            } else {
                                self.elevationMarker.position = Cesium.Cartesian3.fromDegrees(elevationMarkerPosition[0], elevationMarkerPosition[1], camera.positionCartographic.height);
                                this.viewer.scene.requestRender();
                            }

                            // No ubicar la camara en el marker
                            //var rectangle = camera.computeViewRectangle();
                            //if (elevationMarkerPosition[0] >= rectangle.west && elevationMarkerPosition[0] <= rectangle.east && elevationMarkerPosition[1] >= rectangle.south && elevationMarkerPosition[1] <= rectangle.north) { }
                            //else {
                            //    var distance = Cesium.Cartesian3.distance(camera.position, Cesium.Cartesian3.fromDegrees(elevationMarkerPosition[0], elevationMarkerPosition[1]));
                            //    camera.setView({
                            //        destination: Cesium.Cartesian3.fromDegrees(elevationMarkerPosition[0], elevationMarkerPosition[1])
                            //    });

                            //    camera.moveBackward(distance);
                            //}
                        }
                    }.bind(self);

                    geolocation2D._wrap_hideElevationMarker = TC.wrap.control.Geolocation.prototype.hideElevationMarker;
                    TC.wrap.control.Geolocation.prototype.hideElevationMarker = function () {
                        const self = this.view3D.linked2DControls.geolocation;

                        this.view3D.removeFeature.call(this, self.elevationMarker);
                        self.elevationMarker = null;
                    }.bind(self);



                } else {
                    // Si en el paso de 3D a 2D hay perfil dibujado, lanzamos el resize
                    const selectedTrack = self.view3D.linked2DControls.geolocation.getSelectedTrack();
                    if (selectedTrack && self.view3D.linked2DControls.geolocation.hasElevation) {

                        geolocation2D._elevationTrack.call(self.view3D.linked2DControls.geolocation, selectedTrack, true);
                    }
                }
            }

        };

        const draw2DDrawedFeatures = function () {
            var self = this;

            self.map.workLayers.filter(function (layer) {
                return layer instanceof TC.layer.Vector;
            }).forEach(function (vectorLayer) {
                vectorLayer.features.forEach(function (feature) {
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

                var center = new Cesium.Cartesian2(
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

                    var coordsXY = TC.Util.reproject(self.map.options.initialExtent.slice(0, 2), sourceCRS, self.view3D.crs);
                    var coordsXY2 = TC.Util.reproject(self.map.options.initialExtent.slice(2), sourceCRS, self.view3D.crs);
                    var rectangle = Cesium.Rectangle.fromDegrees(coordsXY[0], coordsXY[1], coordsXY2[0], coordsXY2[1]);

                    self.view3D.flyToRectangle.call(self, rectangle, { duration: 0.1 });

                    return false;

                }.bind(self);

                zoomin = function (e) {
                    zoom.call(self, amount);
                }.bind(self);

                zoomout = function (e) {
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
            if (TC.Consts.event.MOUSEMOVE === eventTC) {
                return TC.Util.detectMobile() ? Cesium.ScreenSpaceEventType.LEFT_CLICK : Cesium.ScreenSpaceEventType.MOUSE_MOVE;
            } else if (TC.Consts.event.CLICK === eventTC) {
                return Cesium.ScreenSpaceEventType.LEFT_CLICK;
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
            vector2DFeatures: {
            },

            linked2DControls: {
            },

            isLoadingTiles: function () {
                var self = this;

                var surface = self.viewer.scene.globe['_surface'];
                return !surface['_tileProvider'].ready ||
                    surface['_tileLoadQueueHigh'].length > 0 ||
                    surface['_tileLoadQueueMedium'].length > 0 ||
                    surface['_tileLoadQueueLow'].length > 0 ||
                    surface['_debug']['tilesWaitingForChildren'] > 0;
            },

            loadViewer: function () {
                const self = this;
                return new Promise(function (resolve, reject) {
                    if (!self.viewer) {

                        TC.loadJS(!window.Cesium, TC.Consts.url.CESIUM, function () {

                            var resourceBoundaries = Cesium.Resource.fetchJson({ url: TC.apiLocation + "/dataSource/contornoNavarra.json" }).then(function (bounds) {
                                if (bounds && bounds.features && bounds.features.length > 0) {
                                    return bounds.features[0].geometry.coordinates[0];
                                } else {
                                    return [];
                                }
                            });

                            Cesium.when.all([Cesium.ApproximateTerrainHeights.initialize(), resourceBoundaries], function () {

                                var boundaries = Array.prototype.slice.call(arguments[0])[1];

                                var terrainFallback;
                                if (self.terrainFallback) {
                                    terrainFallback = {
                                        url: self.terrainFallback.url.trim(),
                                        layerName: self.terrainFallback.layerName,
                                        format: self.terrainFallback.format,
                                        noDataValue: self.terrainFallback.noDataValue
                                    };
                                }

                                var terrainProvider;
                                if (terrainFallback) {
                                    terrainProvider = new Cesium.MergeTerrainProvider(self.terrain, self, {
                                        boundaries: boundaries,
                                        fallback: [terrainFallback]
                                    });
                                } else {
                                    terrainProvider = new Cesium.CesiumTerrainProvider({
                                        url: self.terrain.url.trim()
                                    });

                                    terrainProvider.sampleTerrainMostDetailed = function (positions) {
                                        return Cesium.sampleTerrainMostDetailed(terrainProvider, positions);
                                    };

                                    terrainProvider.attributions = {
                                    };

                                    if (self.terrain.attributions) {

                                        terrainProvider.getAttribution = function () {
                                            return terrainProvider.attributions;
                                        };

                                        terrainProvider.attributions = self.terrain.attributions;
                                        self.map.trigger(TC.Consts.event.TERRAINPROVIDERADD, { terrainProvider: terrainProvider });
                                    }
                                }

                                var globe = new Cesium.Globe();
                                globe.baseColor = Cesium.Color.WHITE;
                                globe.enableLighting = false;

                                /* carga más rápido pero consume RAM a cascoporro */
                                globe.tileCacheSize = 1000;

                                /* por defecto 2, a mayor número mayor rendimiento y peor calidad visual */
                                globe.maximumScreenSpaceError = 5;

                                self.viewer = self.view3D.viewer = new Cesium.Viewer(self.selectors.divThreedMap, {
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

                                    skyBox: false,
                                    skyAtmosphere: false,

                                    requestRenderMode: true,
                                    maximumRenderTimeChange: Infinity
                                });

                                // personalización de la escena
                                self.viewer.scene.backgroundColor = Cesium.Color.WHITE;
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
                                        self.map.toast(self.getLocaleString("fi.error"), { type: TC.Consts.msgType.ERROR });

                                        self.unapply();
                                    }
                                }, self);

                                self.viewer.readyPromise = new Promise(function (resolve, reject) {

                                    // controlamos la carga de tiles para mostrar loading cuando pida tiles
                                    self.view3D.tileLoadingHandler = new Cesium.EventHelper();
                                    self.view3D.tileLoadingHandler.add(self.viewer.scene.globe.tileLoadProgressEvent, function (data) {
                                        if (!self.waiting)
                                            self.waiting = self.map.getLoadingIndicator().addWait();

                                        if ((self.viewer.scene.terrainProvider.allReady ||
                                            (!self.viewer.scene.terrainProvider.allReady && self.viewer.scene.terrainProvider.ready))
                                            && data === 0) {
                                            self.map.getLoadingIndicator().removeWait(self.waiting);
                                            delete self.waiting;

                                            resolve();

                                            self.events.trigger(TC.Consts.event.TERRAINLOADED, {});
                                        } else {
                                            self.events.trigger(TC.Consts.event.TERRAINRECEIVING, {});
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
                                alterAllowedControls.call(self, TC.Consts.view.THREED);

                                self.viewer.readyPromise.then(function () {
                                    // pintamos las features que están en el mapa 2D
                                    draw2DDrawedFeatures.call(self);
                                });

                                resolve(self.viewer);

                            });

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

                    if (layer.type === TC.Consts.layerType.WMTS || layer.type === TC.Consts.layerType.WMS) {

                        if (layer.options.relatedWMTS) {
                            self.map.baseLayer = layer = self.map.getLayer(layer.options.relatedWMTS);
                            self.map.trigger(TC.Consts.event.BASELAYERCHANGE, { layer: self.map.baseLayer });
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

                    if (layer instanceof TC.layer.Vector) {
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
                    case TC.Consts.layerType.VECTOR == layer.type: {
                        self.view3D.vector2DLayers.push(layer);
                        break;
                    }
                    case TC.Consts.layerType.WMTS == layer.type:
                    case TC.Consts.layerType.WMS == layer.type: {
                        if (!layer.isBase && !layer.isCompatible(self.view3D.crs)) {
                            self.map.toast(self.getLocaleString('threed.crsNoCompatible', { name: layer.layerNames }));
                        } else {
                            //var convertedLayer = rasterConverter.convert(layer, self.view3D.crs);
                            rasterConverter.convert(layer, self.view3D.crs).then(function (convertedLayer) {
                                if (convertedLayer) {

                                    if (convertedLayer["enablePickFeatures"] !== undefined) {
                                        convertedLayer.enablePickFeatures = false;
                                        convertedLayer["tcLayer"] = layer;
                                    }

                                    if (layer.isBase && self.view3D.baseLayer) {
                                        if (self.viewer.scene.imageryLayers.contains(self.view3D.baseLayer)) {
                                            self.viewer.scene.imageryLayers.raiseToTop(self.view3D.baseLayer);
                                            self.viewer.scene.imageryLayers.remove(self.view3D.baseLayer, true);
                                        }
                                    }

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
                    case TC.Consts.layerType.VECTOR == layer.type: {

                        if (self.view3D.vector2DFeatures && self.view3D.vector2DFeatures.hasOwnProperty(layer.id)) {

                            for (var featureId in self.view3D.vector2DFeatures[layer.id]) {
                                var threedFeature = self.view3D.vector2DFeatures[layer.id][featureId];

                                for (var i = 0; i < threedFeature.length; i++) {
                                    self.view3D.removeFeature.call(self, threedFeature[i]);
                                }
                            }

                            delete self.view3D.vector2DFeatures[layer.id];
                        }

                        // GLS revisar, debería estar en workLayers¿? 
                        // self.view3D.workLayers.splice(i, 1);
                        break;
                    }
                    case TC.Consts.layerType.WMTS == layer.type:
                    case TC.Consts.layerType.WMS == layer.type: {
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
                    case TC.Consts.layerType.VECTOR == layer.type: {
                        if (self.view3D.vector2DFeatures[layer.id]) {

                            for (var featureId in self.view3D.vector2DFeatures[layer.id]) {
                                var features = self.view3D.vector2DFeatures[layer.id][featureId];
                                for (var i = 0; i < features.length; i++) {
                                    self.view3D.setRenderOptionsFeature(features[i], { show: layer.getVisibility() });
                                }
                            }

                            self.viewer.scene.requestRender();
                        }
                        break;
                    }
                    case TC.Consts.layerType.WMTS == layer.type:
                    case TC.Consts.layerType.WMS == layer.type: {
                        for (var i = 0; i < self.view3D.workLayers.length; i++) {
                            if (layer.names && self.view3D.workLayers[i].imageryProvider.layers.join(',') === layer.names.join(',') ||
                                layer.title && self.view3D.workLayers[i].imageryProvider.layers.join(',') === layer.title) {

                                if (options.hasOwnProperty('visibility')) {
                                    self.view3D.workLayers[i].show = options.visibility;
                                }

                                if (options.hasOwnProperty('opacity')) {
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

                var lonlat = self.view3D.view2DCRS !== self.view3D.crs ? TC.Util.reproject(coords, self.view3D.view2DCRS, self.view3D.crs) : coords;
                var destination = Cesium.Cartesian3.fromDegrees(lonlat[0], lonlat[1], self.viewer.camera.positionCartographic.height);

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

                return new Promise(function (resolve, reject) {
                    options = options || {
                    };

                    var epsilon = Cesium.Math.EPSILON3;
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
                    rectangle.west += marginY;
                    rectangle.north += marginY;
                    rectangle.south -= marginY;

                    var scene = self.viewer.scene;
                    var camera = scene.camera;

                    var destinationCartesian = camera.getRectangleCameraCoordinates(rectangle);
                    var destination = Cesium.Ellipsoid.WGS84.cartesianToCartographic(destinationCartesian);

                    Cesium.when(scene.globe.terrainProvider.sampleTerrainMostDetailed([Cesium.Rectangle.center(rectangle)]), function (updatedPositions) {

                        var finalDestinationCartographic = {
                            longitude: destination.longitude,
                            latitude: destination.latitude,
                            height: destination.height + updatedPositions[0].height || 0
                        };

                        camera.flyTo({
                            duration: options.duration || 1,
                            destination: Cesium.Ellipsoid.WGS84.cartographicToCartesian(finalDestinationCartographic),
                            complete: function () {
                                var angle = Cesium.Math.toRadians(50);
                                var pickBP = pickBottomPoint(this.viewer.scene);
                                pickBP = Cesium.Matrix4.fromTranslation(pickBP);

                                this.view3D.rotateAroundAxis(this.viewer.scene.camera, -angle, this.viewer.scene.camera.right, pickBP, {
                                    duration: 250,
                                    callback: function () {
                                        resolve();
                                    }
                                });
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
                    var center = new Cesium.Cartesian2(
                        canvas.clientWidth / 2,
                        canvas.clientHeight / 2);
                    position = {
                        endPosition: center
                    };
                }

                var pickRay = scene.camera.getPickRay(position.endPosition);
                var intersection = scene.globe.pick(pickRay, scene);
                if (intersection) {

                    var distanceMeasure = Cesium.Cartesian3.distance(pickRay.origin, intersection);
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

                        var distanceMeasure = Cesium.Cartesian3.distance(pickRay.origin, intersection);
                        if (distanceMeasure < 1) {
                            return;
                        }
                        else {

                            var cameraPosition = scene.camera.position;
                            var cameraDirection = scene.camera.direction;

                            var toMove = toGo = new Cesium.Cartesian3();
                            Cesium.Cartesian3.multiplyByScalar(pickRay.direction, data.direction == 1 ? data.amount : -data.amount, toMove);
                            Cesium.Cartesian3.add(cameraPosition, toMove, toGo);

                            var ray = new Cesium.Ray(toGo, pickRay.direction);
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

                                if (Cesium.Cartesian3.distance(toGo, intersectionToGo) < 1 ||
                                    Math.abs(Cesium.Ellipsoid.WGS84.cartesianToCartographic(toGo).height) < scene.screenSpaceCameraController.minimumZoomDistance) {
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
                                        easingFunction: Cesium.EasingFunction.LINEAR_NONE,
                                        complete: function (distance) {
                                            this.view3D._zoomTo = {
                                                direction: 1,
                                                amount: 0,
                                                endPosition: {}
                                            };
                                        }.bind(self, Cesium.Cartesian3.distance(toGo, intersectionToGo))
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

            addFeature: function (feature, options) {
                var self = this;

                var add = function () {
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
                                                geo = addFeature.call(self, geo);
                                                linkFeature(self, feature.layer.id, geo, feature.id);
                                            });
                                        } else {
                                            geom = addFeature.call(self, geom);
                                            linkFeature(self, feature.layer.id, geom, feature.id);
                                        }
                                    });
                                }
                                else {
                                    var geom = addFeature.call(self, newGeometry);
                                    linkFeature(self, feature.layer.id, geom, feature.id);
                                }
                            });
                        }
                        else if (csfeature.geometry instanceof Array) {
                            csfeature.geometry.forEach(function (geom) {
                                geom = addFeature.call(self, geom);
                                linkFeature(self, feature.layer.id, geom, feature.id);
                            });
                        }
                        else {
                            var geom = addFeature.call(self, csfeature.geometry);
                            linkFeature(self, feature.layer.id, geom, feature.id);
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
                } else if (self.linked2DControls.geolocation && self.linked2DControls.geolocation.layerTracking === feature.layer && feature instanceof TC.feature.Polyline) {
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
                            case feature instanceof Cesium.GroundPrimitive:
                                self.viewer.scene.groundPrimitives.remove(feature);
                                break;
                            case feature instanceof Cesium.Billboard:
                                self.viewer.billboardCollection.remove(feature);
                                break;
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

                    var latlon = self.view3D.view2DCRS !== self.view3D.crs ? TC.Util.reproject(center, self.view3D.view2DCRS, self.view3D.crs) : center;
                    var distance = calcDistanceForResolution.call(self, self.mapView.getResolution() || 0, Cesium.Math.toRadians(latlon[0]));

                    var latlon = self.view3D.view2DCRS !== self.view3D.crs ? TC.Util.reproject(center, self.view3D.view2DCRS, self.view3D.crs) : center;
                    var carto = new Cesium.Cartographic(Cesium.Math.toRadians(latlon[0]), Cesium.Math.toRadians(latlon[1]));
                    if (self.viewer.scene.globe) {
                        carto.height = self.viewer.scene.globe.getHeight(carto) || 0;
                    }

                    var setCamera = function () {
                        if (self.map.on3DView) {
                            var destination = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
                            var orientation = {
                                pitch: Cesium.Math.toRadians(-90),
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
                        TC.loadJS(!TC.tool || !TC.tool.Elevation, TC.apiLocation + 'TC/tool/Elevation', function () {
                            self.view3D.elevationTool = new TC.tool.Elevation();
                            self.view3D.elevationTool.getElevation({
                                crs: self.view3D.crs,
                                coordinates: [latlon]
                            }).then(function (result) {
                                if (result && result.length > 0) {
                                    carto.height = result[0][2] ? result[0][2] : 0;
                                    setCamera();
                                }
                            }).catch((e) => console.log(e));
                        });
                    } else {
                        setCamera();
                    }
                });
            },
            setViewFromCameraView: function () {
                const self = this;


                var ellipsoid = Cesium.Ellipsoid.WGS84;
                var scene = self.viewer.scene;
                var target = target_ = pickCenterPoint(scene);

                if (!target_) {
                    var globe = self.viewer.scene.globe;
                    var carto = self.viewer.camera.positionCartographic.clone();
                    var height = globe.getHeight(carto);
                    carto.height = height || 0;
                    target_ = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
                }


                var distance = Cesium.Cartesian3.distance(target_, self.viewer.camera.position);
                var targetCartographic = ellipsoid.cartesianToCartographic(target_);

                var centerMapCRS = self.view3D.crs !== self.view3D.view2DCRS ? TC.Util.reproject(
                    [Cesium.Math.toDegrees(targetCartographic.longitude), Cesium.Math.toDegrees(targetCartographic.latitude)],
                    self.view3D.crs, self.view3D.view2DCRS) : [Cesium.Math.toDegrees(targetCartographic.longitude), Cesium.Math.toDegrees(targetCartographic.latitude)];

                self.mapView.setCenter(centerMapCRS);

                self.mapView.setResolution(calcResolutionForDistance.call(self, distance, targetCartographic ? targetCartographic.latitude : 0));

                // GLS: No tenemos la rotación del mapa activada por problemas con el iPad
                //if (target) {
                //    var pos = self.viewer.camera.position;

                //    var targetNormal = new Cesium.Cartesian3();
                //    ellipsoid.geocentricSurfaceNormal(target, targetNormal);

                //    var targetToCamera = new Cesium.Cartesian3();
                //    Cesium.Cartesian3.subtract(pos, target, targetToCamera);
                //    Cesium.Cartesian3.normalize(targetToCamera, targetToCamera);

                //    // HEADING
                //    var up = self.viewer.camera.up;
                //    var right = self.viewer.camera.right;
                //    var normal = new Cesium.Cartesian3(-target.y, target.x, 0);
                //    var heading = Cesium.Cartesian3.angleBetween(right, normal);
                //    var cross = Cesium.Cartesian3.cross(target, up, new Cesium.Cartesian3());
                //    var orientation = cross.z;

                //    self.mapView.setRotation((orientation < 0 ? heading : -heading));
                //    self.setViewFromCameraViewInProgress.resolve();
                //}

                return Promise.resolve();
            },

            lookAt: function (coords) {
                const self = this;

                if (self.crs !== self.view2DCRS) {
                    coords = TC.Util.reproject(coords, self.view2DCRS, self.crs);
                }

                var camera = self.viewer.camera;
                var positionCartographic = camera.positionCartographic;
                var height = positionCartographic.height;
                var cartographic = new Cesium.Cartographic(Cesium.Math.toRadians(coords[0]), Cesium.Math.toRadians(coords[1]), height)

                camera.flyTo({
                    destination: Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height),
                    duration: 1.0
                });
            },

            getInfoOnPickedPosition: function (pickedPosition) {
                var self = this;

                if (!pickedPosition) {
                    return;
                } else {

                    self.map.one(TC.Consts.event.DRAWTABLE, function (e) {
                        self.map.getLoadingIndicator().removeWait(self.waiting);
                        delete self.waiting;
                    });

                    self.view3D.linked2DControls.featureInfo.send.call(self, pickedPosition).then(function (e) {
                        self.map.getLoadingIndicator().removeWait(self.waiting);
                        delete self.waiting;
                    });
                }
            },

            on: function (event, callback) {
                const self = this;

                const movement3DtoPosition2D = function (movement) {
                    if (self.viewer && self.viewer.cesiumWidget) {
                        var ray = self.viewer.camera.getPickRay(movement.endPosition || movement.position);
                        var position = self.viewer.scene.globe.pick(ray, self.viewer.scene);
                        if (position) {
                            var positionCartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);

                            var lat, lon, ele;
                            lat = Cesium.Math.toDegrees(positionCartographic.latitude);
                            lon = Cesium.Math.toDegrees(positionCartographic.longitude);
                            ele = Math.round(positionCartographic.height);

                            return { lon: lon, lat: lat, ele: ele };
                        }
                    }

                    return null;
                };

                if (!self.eventHandlers) {
                    self.eventHandlers = {};
                }

                self.eventHandlers.handlerOfMovementConversion = new Cesium.ScreenSpaceEventHandler(self.viewer.scene.canvas);
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

                var cartesian = new Cesium.Cartographic(Cesium.Math.toRadians(geoCoords[0]), Cesium.Math.toRadians(geoCoords[1]));
                return self.viewer.scene.globe.getHeight(cartesian) || 0;
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
                alterAllowedControls.call(self, TC.Consts.view.DEFAULT);

                // sobrescribimos el comportamiento de lo botones + /- y la casita
                override2DZoom.call(self, false);

                //addNoCompatibleBaseLayers.call(self);

                Promise.all(self.map.baseLayers.map(function (baseLayer) {
                    return Promise.resolve(!isCompatible(baseLayer, self.view3D.view2DCRS));
                })).then(function (results) {
                    if (results.length > 0) {
                        var defaultBaseLayer;
                        for (var i = 0; i < self.map.baseLayers.length; i++) {
                            if (!defaultBaseLayer && !results[i]) {
                                defaultBaseLayer = self.map.baseLayers[i];
                            }
                            self.map.baseLayers[i].mustReproject = results[i];
                        }
                        var triggerEvent = true;
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
                                    self.map.trigger(TC.Consts.event.VIEWCHANGE, { view: TC.Consts.view.DEFAULT });
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
                        self.map.trigger(TC.Consts.event.VIEWCHANGE, { view: TC.Consts.view.DEFAULT });
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
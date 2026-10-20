
import Point from '../../SITNA/feature/Point.js';
import Marker from '../../SITNA/feature/Marker.js';
import Polyline from '../../SITNA/feature/Polyline.js';
import MultiPolyline from '../../SITNA/feature/MultiPolyline.js';
import Polygon from '../../SITNA/feature/Polygon.js';
import MultiPolygon from '../../SITNA/feature/MultiPolygon.js';
import Circle from '../../SITNA/feature/Circle.js';
import { toCesiumColor, joinBillboardLabel } from '../view/ThreeDUtils';


import Util from '../Util.js';

const FeatureConverter = function () {
    //var toCesiumColor = function (hexStringColor, alpha) {
    //    if (hexStringColor instanceof Array) {
    //        hexStringColor = "rgba(" + hexStringColor[0] + ", " + hexStringColor[1] + ", " + hexStringColor[2] + ", " + (hexStringColor[3] || 1) + ")";
    //    }
    //    var color = cesium.Color.fromCssColorString(hexStringColor);
    //    if (alpha !== undefined) {
    //        return color.withAlpha(alpha);
    //    }
    //    return color;
    //}
    var setStyleProperties = function (styles, properties, feature) {
        for (var key in properties) { // recorremos el diccionario de propiedades que admitimos como estilo
            var attr = styles[properties[key].prop];
            if (attr !== undefined) {
                if (typeof (attr) === "function") { // si la propiedad del estilo es una función (como en el control de búsquedas) invocamos para obtener el valor
                    var val = attr(feature);
                    if (val !== null && val !== undefined) {
                        properties[key].val = val;
                    }
                } else {
                    properties[key].val = attr; // obtenenemos el valor
                }
            }
        }
    }

    var getFeatureStyle = function (feature) {
        var styles;
        if (!feature.layer || (feature.layer && !hasOwnProperty.call(feature.layer, 'styles'))) {
            styles = TC.Defaults.styles;
        } else {
            styles = {};
            Object.keys(feature.layer.styles).forEach((key) => {
                styles[key] = Util.mergeStyles(TC.Defaults.styles[key], feature.layer.styles[key]);
            });
        }       

        styles = styles[feature.STYLETYPE] == undefined ?
            styles[(feature.STYLETYPE === "polyline" ? "line" : feature.STYLETYPE)] :
            styles[(feature.STYLETYPE === "multipolygon" ? "polygon" : feature.STYLETYPE)];
        
        styles = Util.extend({}, styles, feature.getStyle());
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
        const isMultiPolygon = !!coords[0][0];
        const outlineCoords = isMultiPolygon ? coords[0] : coords;

        const polygonHierarchy = {
            positions: (outlineCoords[0].equals(outlineCoords.at(-1)) ? outlineCoords.slice(0, -1) : outlineCoords)
        }
        if (coords.slice(1).length && isMultiPolygon)
            polygonHierarchy.holes = coords.slice(1).map((hole) => { return { "positions": hole } });

        const entityOps = {
            name: id,
            polygon: {
                hierarchy: polygonHierarchy,
                material: options.color,
                heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
            },
            polyline: {
                positions: outlineCoords,
                width: options.width,
                material: options.outlineColor,
                clampToGround: true
            }
        }

        createLabel(entityOps, options, outlineCoords);
        var entity = new cesium.Entity(entityOps);

        callback(entity);
    }
    function createLabel(entityOps, options, coords) {        
        if (options.label) {
            entityOps.position = coords instanceof cesium.Cartesian3 ? coords : cesium.BoundingSphere.fromPoints(coords).center;
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
                verticalOrigin: cesium.VerticalOrigin.CENTER,
                disableDepthTestDistance: Number.POSITIVE_INFINITY

            }
            if (options.fontColor)
                entityOps.label.fillColor = options.fontColor;
            if (options.fontSize)
                entityOps.label.font = options.fontSize + "pt sans-serif";
            if (options.labelBackgroundColor) { 
                entityOps.label.backgroundColor = options.labelBackgroundColor;
                entityOps.label.showBackground = true;
            }
                

        }

    }

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
                //opt.width = properties.width.val;
                opt.width = new cesium.CallbackProperty(() => {
                    if (feature.wrap.feature3D?.highLighted)
                        return properties.width.val * 3;
                    else
                        return properties.width.val;

                }, false);
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

                    var geomPolygons = [];

                    var getGeom = function (outlineCoords, index) {
                        const arrProm = [new Promise(function (res, _rej) {
                            createPolygon(feature.id + "_" + index, outlineCoords, options, function (entity) {
                                geomPolygons.push(entity);
                                res();
                            });
                        })];
                        if (outlineCoords.length > 1) {
                            options.material = options.outlineColor;
                            //si tiene agujeros 
                            outlineCoords.slice(1).forEach((holes, i) => {
                                arrProm.push(new Promise(function (res, _rej) {
                                    createLine(feature.id + "_" + index + "_" + i, holes, options, function (entity) {
                                        geomPolygons.push(entity);
                                        res();
                                    });
                                }));
                            })
                        }

                        return Promise.all(arrProm);
                    }
                    for (var i = 0; i < coords.length; i++) {
                        getting.push(getGeom(coords[i], i));
                    }

                    Promise.all(getting).then(function () {
                        getting = [];
                        //resolve([geomOutlines]);
                        resolve(geomPolygons);
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
                //opt.width = properties.width.val;                    
                opt.width = new cesium.CallbackProperty(() => {
                    if (feature.wrap.feature3D?.highLighted)
                        return properties.width.val * 3;
                    else
                        return properties.width.val;

                }, false);
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
                        //var pixelSize = getPixelSize(coords[0]);
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
                labelKey: { prop: 'labelKey' },
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
                radius: { prop: 'radius' },
                labelBackgroundColor: { prop: 'labelBackgroundColor' },
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
            if (hasOwnProperty.call(properties.labelKey, 'val')) {
                opt.label = properties.labelKey.val;

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

            if (hasOwnProperty.call(properties.labelBackgroundColor, 'val')) {
                opt.labelBackgroundColor = toCesiumColor(properties.labelBackgroundColor.val);
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
                        //eyeOffset: new cesium.Cartesian3(0, 0, 10),
                        verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                        heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
                        //disableDepthTestDistance: 0
                    }
                };

                if (options.anchor && options.anchor.length > 0) {
                    billboard.billboard.pixelOffset = new cesium.Cartesian2(options.anchor[0], options.anchor[1]);
                }

                if (!options.label) {
                    return new cesium.Entity(billboard);
                } else {                    
                    billboard.billboard.image = joinBillboardLabel(options);
                    
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
                if (text) {
                //if (text && (/^([A-Z])\w+$/gi.test(text) || !(/^[0-9]*\-{0,1}[a-z]{0,4}$/gi.test(text)))) {
                    let property = /^\$\{(?<property>\w+)\}$/gi.exec(text)?.groups["property"];
                    if (property && feature.data[property])
                        options.label = feature.data[property];
                    createLabel(entityOps, options, coords[0]);
                }
                //if (text && /^[0-9]*\-{0,1}[a-z]{0,4}$/gi.test(text)) {
                //    entityOps["billboard"] = {
                //        image: pinBuilder.fromText(text, options.fontColor, 48).toDataURL(),
                //        //eyeOffset: new cesium.Cartesian3(0, 0, 10),
                //        verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                //        heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
                //        disableDepthTestDistance: 0
                //    }
                //}
                else if (options.radius !== null && options.radius !== undefined) {
                    if (options.radius > 0)
                        entityOps["point"] = {
                            color: options.color,
                            pixelSize: (options.radius - options.outlineWidth) * 2,
                            outlineWidth: options.outlineWidth,
                            outlineColor: options.outlineColor,
                            //eyeOffset: new cesium.Cartesian3(0, 0, 10),
                            heightReference: cesium.HeightReference.CLAMP_TO_GROUND
                        }
                }
                else {
                    entityOps["billboard"] = {
                        image: pinBuilder.fromColor(cesium.Color.fromCssColorString(feature.options.fillColor ? feature.options.fillColor : TC.Cfg.styles.point.fillColor), 32).toDataURL(),
                        //eyeOffset: new cesium.Cartesian3(0, 0, 10),
                        verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                        horizontalOrigin: cesium.HorizontalOrigin.CENTER,
                        heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: 0
                    }
                }

                return new cesium.Entity(entityOps);
            };
        }

        return point;
    };

    this.convert = function (_scn, feature, sourceCrs, targetCrs) {
        const self = this;

        var byPromise = false;
        var cartesians = [];
        var toCartesian = async function (coord, arr) {
            if (!Array.isArray(coord)) {
                return;
            }

            if (sourceCrs !== targetCrs) {
                coord = Util.reproject(coord, sourceCrs, targetCrs);
            }
            //if (coord.length > 2) {
            //    arr.push(cesium.Cartesian3.fromDegrees(coord[0], coord[1], coord[2]));
            //}
            //else {
            //    let aaa = await _scn.sampleHeightMostDetailed([new cesium.Cartographic.fromDegrees(coord[0], coord[1])]);
            //    arr.push(cesium.Cartesian3.fromRadians(aaa[0].longitude, aaa[0].latitude, aaa[0].height))
            //}

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

export default FeatureConverter;
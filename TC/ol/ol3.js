//if (!window.ol) {
//    TC.syncLoadJS(TC.url.ol);
//}

(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                                   || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());

(function () {
    var MOUSEMOVE = 'mousemove.tc';
    var MOUSEOUT = 'mouseout.tc';
    var MOUSEOVER = 'mouseover.tc';

    var cssUrl = TC.url.ol.substr(0, TC.url.ol.lastIndexOf('/'));
    cssUrl = cssUrl.substr(0, cssUrl.lastIndexOf('/') + 1) + 'css/ol.css';
    //TC.loadCSS(cssUrl);

    // Reescribimos la obtención de proyección para que soporte códigos tipo EPSG:X, urn:ogc:def:crs:EPSG::X y http://www.opengis.net/gml/srs/epsg.xml#X
    ol.proj.oldGet = ol.proj.get;
    ol.proj.get = function (projectionLike) {
        if (typeof projectionLike === 'string') {
            TC.loadProjDef(projectionLike, true);
        }
        return ol.proj.oldGet(projectionLike);
    };

    // Reescritura de código para transformar las geometrías de getFeatureInfo que están en un CRS distinto
    ol.format.GML2.prototype.readGeometryElement = ol.format.GML3.prototype.readGeometryElement = function (node, objectStack) {
        var context = objectStack[0];
        goog.asserts.assert(goog.isObject(context), 'context should be an Object');
        var srsName = context['srsName'] = node.firstElementChild.getAttribute('srsName');
        if (srsName) {
            context.dataProjection = ol.proj.get(srsName);
        }
        var geometry = ol.xml.pushParseAndPop(/** @type {ol.geom.Geometry} */(null),
            this.GEOMETRY_PARSERS_, node, objectStack, this);
        if (goog.isDefAndNotNull(geometry)) {
            return /** @type {ol.geom.Geometry} */ (
                ol.format.Feature.transformWithOptions(geometry, false, context));
        } else {
            return undefined;
        }
    };

    // Reescritura de código para leer las carpetas del KML
    ol.format.KML.prototype._readDocumentOrFolder_ = ol.format.KML.prototype.readDocumentOrFolder_;
    ol.format.KML.prototype.readDocumentOrFolder_ = function (node, objectStack) {
        var result = ol.format.KML.prototype._readDocumentOrFolder_.apply(this, arguments);
        if (ol.xml.getLocalName(node) == "Folder") {
            for (var i = 0; i < result.length; i++) {
                var feature = result[i];
                if (!$.isArray(feature._folders)) {
                    feature._folders = [];
                }
                var nameElm = node.getElementsByTagName('name')[0];
                if (nameElm) {
                    //feature._folders.unshift(nameElm.innerHTML || nameElm.textContent);
                    // Versión rápida de unshift
                    TC.Util.fastUnshift(feature._folders, nameElm.innerHTML || nameElm.textContent);
                }
            }
        }
        return result;
    };

    // Creamos un parser para interpretar la plantilla de los bocadillos
    ol.format.KML.readText_ = function (node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
        goog.asserts.assert(node.localName == 'text');
        var s = ol.xml.getAllTextContent(node, false);
        return goog.string.trim(s);
    };

    //ol.format.KML.DEFAULT_BALLOON_STYLE_ = new ol.style.Text();

    ol.format.KML.BALLOON_STYLE_PARSERS_ = ol.xml.makeStructureNS(
        ol.format.KML.NAMESPACE_URIS_, {
            'text': ol.xml.makeObjectPropertySetter(ol.format.KML.readText_),
        });

    ol.format.KML.BalloonStyleParser_ = function (node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
        goog.asserts.assert(node.localName == 'BalloonStyle');
        // FIXME colorMode
        var object = ol.xml.pushParseAndPop(
            {}, ol.format.KML.BALLOON_STYLE_PARSERS_, node, objectStack);
        if (!goog.isDef(object)) {
            return;
        }
        var styleObject = objectStack[objectStack.length - 1];
        goog.asserts.assert(goog.isObject(styleObject));
        var textStyle = new ol.style.Text({
            text: (object['text'])
        });
        styleObject['balloonStyle'] = textStyle;
    };

    for (var key in ol.format.KML.STYLE_PARSERS_) {
        var parser = ol.format.KML.STYLE_PARSERS_[key];
        parser['BalloonStyle'] = ol.format.KML.BalloonStyleParser_;
    }

    ol.format.KML.readStyle_ = function (node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
        goog.asserts.assert(node.localName == 'Style');
        var styleObject = ol.xml.pushParseAndPop(
            {}, ol.format.KML.STYLE_PARSERS_, node, objectStack);
        if (!goog.isDef(styleObject)) {
            return null;
        }
        var fillStyle = /** @type {ol.style.Fill} */ (goog.object.get(
            styleObject, 'fillStyle', ol.format.KML.DEFAULT_FILL_STYLE_));
        var fill = /** @type {boolean|undefined} */
            (styleObject['fill']);
        if (goog.isDef(fill) && !fill) {
            fillStyle = null;
        }
        var imageStyle = /** @type {ol.style.Image} */ (goog.object.get(
            styleObject, 'imageStyle', ol.format.KML.DEFAULT_IMAGE_STYLE_));
        var textStyle = /** @type {ol.style.Text} */ (goog.object.get(
            styleObject, 'textStyle', ol.format.KML.DEFAULT_TEXT_STYLE_));
        var strokeStyle = /** @type {ol.style.Stroke} */ (goog.object.get(
            styleObject, 'strokeStyle', ol.format.KML.DEFAULT_STROKE_STYLE_));
        var balloonStyle = /** @type {ol.style.Stroke} */ (goog.object.get(
            styleObject, 'balloonStyle', ol.format.KML.DEFAULT_BALLOON_STYLE_));
        var outline = /** @type {boolean|undefined} */
            (styleObject['outline']);
        if (goog.isDef(outline) && !outline) {
            strokeStyle = null;
        }
        var style = new ol.style.Style({
            fill: fillStyle,
            image: imageStyle,
            stroke: strokeStyle,
            text: textStyle,
            zIndex: undefined // FIXME
        });
        style._balloon = balloonStyle;
        return [style];
    };

    // GLS: La expresión regular que valida el formato de fecha ISO no contempla que la fecha contenga fracción de segundo, según https://www.w3.org/TR/NOTE-datetime 
    ol.format.KML.whenParser_ = function (a, b) {
        goog.asserts.assert(a.nodeType == goog.dom.NodeType.ELEMENT, "node.nodeType should be ELEMENT");
        goog.asserts.assert("when" == a.localName, "localName should be when");
        var c = b[b.length - 1];
        goog.asserts.assert(goog.isObject(c), "gxTrackObject should be an Object");
        var c = c.whens
          , d = ol.xml.getAllTextContent(a, !1);
        if (d = /^\s*(\d{4})($|-(\d{2})($|-(\d{2})($|T(\d{2}):(\d{2}):(\d{2})(?:.?\d{3})?(Z|(?:([+\-])(\d{2})(?::(\d{2}))?)))))\s*$/.exec(d)) {
            var e = parseInt(d[1], 10)
              , f = d[3] ? parseInt(d[3],
            10) - 1 : 0
              , g = d[5] ? parseInt(d[5], 10) : 1
              , h = d[7] ? parseInt(d[7], 10) : 0
              , k = d[8] ? parseInt(d[8], 10) : 0
              , l = d[9] ? parseInt(d[9], 10) : 0
              , e = Date.UTC(e, f, g, h, k, l);
            d[10] && "Z" != d[10] && (f = "-" == d[11] ? -1 : 1,
            e += 60 * f * parseInt(d[12], 10),
            d[13] && (e += 3600 * f * parseInt(d[13], 10)));
            c.push(e)
        } else
            c.push(0)
    };

    ol.format.KML.GX_TRACK_PARSERS_ = ol.xml.makeStructureNS(ol.format.KML.NAMESPACE_URIS_, {
        when: ol.format.KML.whenParser_
    }, ol.xml.makeStructureNS(ol.format.KML.GX_NAMESPACE_URIS_, {
        coord: ol.format.KML.gxCoordParser_
    }));

    // GLS: La expresión regular que valida el formato de fecha ISO no contempla que la fecha contenga fracción de segundo, según https://www.w3.org/TR/NOTE-datetime 
    ol.format.XSD.readDateTime = function (a) {
        a = ol.xml.getAllTextContent(a, !1);
        if (a = /^\s*(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|(?:([+\-])(\d{2})(?::(\d{2}))?))\s*$/.exec(a)) {
            var b = parseInt(a[1], 10)
              , c = parseInt(a[2], 10) - 1
              , d = parseInt(a[3], 10)
              , e = parseInt(a[4], 10)
              , f = parseInt(a[5], 10)
              , g = parseInt(a[6], 10)
              , b = Date.UTC(b, c, d, e, f, g); // GLS quito el paso a segundos / 1E3
            "Z" != a[7] && (c = "-" == a[8] ? -1 : 1,
            b += 60 * c * parseInt(a[9], 10),
            void 0 !== a[10] && (b += 3600 * c * parseInt(a[10], 10)));
            return b
        };
    };

    ol.format.GPX.RTEPT_PARSERS_ = ol.xml.makeStructureNS(ol.format.GPX.NAMESPACE_URIS_, {
        ele: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
        time: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDateTime)
    });
    ol.format.GPX.TRKPT_PARSERS_ = ol.xml.makeStructureNS(ol.format.GPX.NAMESPACE_URIS_, {
        ele: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
        time: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDateTime)
    });
    ol.format.GPX.WPT_PARSERS_ = ol.xml.makeStructureNS(ol.format.GPX.NAMESPACE_URIS_, {
        ele: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
        time: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDateTime),
        magvar: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
        geoidheight: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
        name: ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
        cmt: ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
        desc: ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
        src: ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
        link: ol.format.GPX.parseLink_,
        sym: ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
        type: ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
        fix: ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
        sat: ol.xml.makeObjectPropertySetter(ol.format.XSD.readNonNegativeInteger),
        hdop: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
        vdop: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
        pdop: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
        ageofdgpsdata: ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
        dgpsid: ol.xml.makeObjectPropertySetter(ol.format.XSD.readNonNegativeInteger),
        extensions: ol.format.GPX.parseExtensions_
    });


    // Bug de OpenLayers hasta 3.5.0 como mínimo:
    // El parser de GML2 no lee las siguientes features del GML si tienen un featureType distinto del primero.
    // Esto pasa porque genera el objeto de featureTypes con la primera y en las siguientes iteraciones si el objeto existe no se regenera.
    // Entre comentarios /* */ se elimina lo que sobra.
    ol.format.GMLBase.prototype.readFeaturesInternal = function (node, objectStack) {
        goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
            'node.nodeType should be ELEMENT');
        var localName = ol.xml.getLocalName(node);
        var features;
        if (localName == 'FeatureCollection') {
            if (node.namespaceURI === 'http://www.opengis.net/wfs') {
                features = ol.xml.pushParseAndPop([],
                    this.FEATURE_COLLECTION_PARSERS, node,
                    objectStack, this);
            } else {
                features = ol.xml.pushParseAndPop(null,
                    this.FEATURE_COLLECTION_PARSERS, node,
                    objectStack, this);
            }
        } else if (localName == 'featureMembers' || localName == 'featureMember') {
            var context = objectStack[0];
            goog.asserts.assert(goog.isObject(context), 'context should be an Object');
            var featureType = context['featureType'];
            var featureNS = context['featureNS'];
            var i, ii, prefix = 'p', defaultPrefix = 'p0';
            if (/* !goog.isDef(featureType) && */goog.isDefAndNotNull(node.childNodes)) {
                featureType = [], featureNS = {};
                for (i = 0, ii = node.childNodes.length; i < ii; ++i) {
                    var child = node.childNodes[i];
                    if (child.nodeType === 1) {
                        var ft = child.nodeName.split(':').pop();
                        if (goog.array.indexOf(featureType, ft) === -1) {
                            var key;
                            if (!goog.object.contains(featureNS, child.namespaceURI)) {
                                key = prefix + goog.object.getCount(featureNS);
                                featureNS[key] = child.namespaceURI;
                            } else {
                                key = goog.object.findKey(featureNS, function (value) {
                                    return value === child.namespaceURI;
                                });
                            }
                            featureType.push(key + ':' + ft);
                        }
                    }
                }
                context['featureType'] = featureType;
                context['featureNS'] = featureNS;
            }
            if (goog.isString(featureNS)) {
                var ns = featureNS;
                featureNS = {};
                featureNS[defaultPrefix] = ns;
            }
            var parsersNS = {};
            var featureTypes = goog.isArray(featureType) ? featureType : [featureType];
            for (var p in featureNS) {
                var parsers = {};
                for (i = 0, ii = featureTypes.length; i < ii; ++i) {
                    var featurePrefix = featureTypes[i].indexOf(':') === -1 ?
                        defaultPrefix : featureTypes[i].split(':')[0];
                    if (featurePrefix === p) {
                        parsers[featureTypes[i].split(':').pop()] =
                            (localName == 'featureMembers') ?
                            ol.xml.makeArrayPusher(this.readFeatureElement, this) :
                            ol.xml.makeReplacer(this.readFeatureElement, this);
                    }
                }
                parsersNS[featureNS[p]] = parsers;
            }
            features = ol.xml.pushParseAndPop([], parsersNS, node, objectStack);
        }
        if (!goog.isDef(features)) {
            features = [];
        }
        return features;
    };

    ol.render.canvas.Replay.prototype.replay_ = function (
    context, pixelRatio, transform, viewRotation, skippedFeaturesHash,
    instructions, featureCallback, opt_hitExtent) {
        /** @type {Array.<number>} */
        var pixelCoordinates;
        if (ol.vec.Mat4.equals2D(transform, this.renderedTransform_)) {
            pixelCoordinates = this.pixelCoordinates_;
        } else {
            pixelCoordinates = ol.geom.flat.transform.transform2D(
                this.coordinates, 0, this.coordinates.length, 2,
                transform, this.pixelCoordinates_);
            goog.vec.Mat4.setFromArray(this.renderedTransform_, transform);
            goog.asserts.assert(pixelCoordinates === this.pixelCoordinates_);
        }
        var i = 0; // instruction index
        var ii = instructions.length; // end of instructions
        var d = 0; // data index
        var dd; // end of per-instruction data
        var localTransform = this.tmpLocalTransform_;
        while (i < ii) {
            var instruction = instructions[i];
            var type = /** @type {ol.render.canvas.Instruction} */ (instruction[0]);
            var feature, fill, stroke, text, x, y;
            switch (type) {
                case ol.render.canvas.Instruction.BEGIN_GEOMETRY:
                    feature = /** @type {ol.Feature} */ (instruction[1]);
                    var featureUid = goog.getUid(feature).toString();
                    if (goog.isDef(skippedFeaturesHash[featureUid])) {
                        i = /** @type {number} */ (instruction[2]);
                    } else if (goog.isDef(opt_hitExtent) && !ol.extent.intersects(
                        opt_hitExtent, feature.getGeometry().getExtent())) {
                        i = /** @type {number} */ (instruction[2]);
                    } else {
                        ++i;
                    }
                    break;
                case ol.render.canvas.Instruction.BEGIN_PATH:
                    context.beginPath();
                    ++i;
                    break;
                case ol.render.canvas.Instruction.CIRCLE:
                    goog.asserts.assert(goog.isNumber(instruction[1]));
                    d = /** @type {number} */ (instruction[1]);
                    var x1 = pixelCoordinates[d];
                    var y1 = pixelCoordinates[d + 1];
                    var x2 = pixelCoordinates[d + 2];
                    var y2 = pixelCoordinates[d + 3];
                    var dx = x2 - x1;
                    var dy = y2 - y1;
                    var r = Math.sqrt(dx * dx + dy * dy);
                    context.arc(x1, y1, r, 0, 2 * Math.PI, true);
                    ++i;
                    break;
                case ol.render.canvas.Instruction.CLOSE_PATH:
                    context.closePath();
                    ++i;
                    break;
                case ol.render.canvas.Instruction.DRAW_IMAGE:
                    goog.asserts.assert(goog.isNumber(instruction[1]));
                    d = /** @type {number} */ (instruction[1]);
                    goog.asserts.assert(goog.isNumber(instruction[2]));
                    dd = /** @type {number} */ (instruction[2]);
                    var image =  /** @type {HTMLCanvasElement|HTMLVideoElement|Image} */
                        (instruction[3]);
                    // Remaining arguments in DRAW_IMAGE are in alphabetical order
                    var anchorX = /** @type {number} */ (instruction[4]) * pixelRatio;
                    var anchorY = /** @type {number} */ (instruction[5]) * pixelRatio;


                    // https://github.com/openlayers/ol3/issues/2861
                    // GLS: Sin esta instrucción IndexSizeError exceptions in IE when display layers in canvas renderer 
                    var height = /** @type {number} */ (Math.min(image.height, instruction[6]));
                    var opacity = /** @type {number} */ (instruction[7]);
                    var originX = /** @type {number} */ (instruction[8]);
                    var originY = /** @type {number} */ (instruction[9]);
                    var rotateWithView = /** @type {boolean} */ (instruction[10]);
                    var rotation = /** @type {number} */ (instruction[11]);
                    var scale = /** @type {number} */ (instruction[12]);
                    var snapToPixel = /** @type {boolean} */ (instruction[13]);

                    // https://github.com/openlayers/ol3/issues/2861
                    // GLS: Sin esta instrucción IndexSizeError exceptions in IE when display layers in canvas renderer 
                    var width = /** @type {number} */ (Math.min(image.width, instruction[14]));
                    if (rotateWithView) {
                        rotation += viewRotation;
                    }
                    for (; d < dd; d += 2) {
                        x = pixelCoordinates[d] - anchorX;
                        y = pixelCoordinates[d + 1] - anchorY;
                        if (snapToPixel) {
                            x = (x + 0.5) | 0;
                            y = (y + 0.5) | 0;
                        }
                        if (scale != 1 || rotation !== 0) {
                            var centerX = x + anchorX;
                            var centerY = y + anchorY;
                            ol.vec.Mat4.makeTransform2D(
                                localTransform, centerX, centerY, scale, scale,
                                rotation, -centerX, -centerY);
                            context.setTransform(
                                goog.vec.Mat4.getElement(localTransform, 0, 0),
                                goog.vec.Mat4.getElement(localTransform, 1, 0),
                                goog.vec.Mat4.getElement(localTransform, 0, 1),
                                goog.vec.Mat4.getElement(localTransform, 1, 1),
                                goog.vec.Mat4.getElement(localTransform, 0, 3),
                                goog.vec.Mat4.getElement(localTransform, 1, 3));
                        }
                        var alpha = context.globalAlpha;
                        if (opacity != 1) {
                            context.globalAlpha = alpha * opacity;
                        }
                        // GLS: Sin comprobar si la imagen tiene tamaño se produce una excepción en IE InvalidStateError
                        if (image.height > 0 && image.width > 0)
                            context.drawImage(image, originX, originY, width, height,
                                x, y, width * pixelRatio, height * pixelRatio);

                        if (opacity != 1) {
                            context.globalAlpha = alpha;
                        }
                        if (scale != 1 || rotation !== 0) {
                            context.setTransform(1, 0, 0, 1, 0, 0);
                        }
                    }
                    ++i;
                    break;
                case ol.render.canvas.Instruction.DRAW_TEXT:
                    goog.asserts.assert(goog.isNumber(instruction[1]));
                    d = /** @type {number} */ (instruction[1]);
                    goog.asserts.assert(goog.isNumber(instruction[2]));
                    dd = /** @type {number} */ (instruction[2]);
                    goog.asserts.assert(goog.isString(instruction[3]));
                    text = /** @type {string} */ (instruction[3]);
                    goog.asserts.assert(goog.isNumber(instruction[4]));
                    var offsetX = /** @type {number} */ (instruction[4]) * pixelRatio;
                    goog.asserts.assert(goog.isNumber(instruction[5]));
                    var offsetY = /** @type {number} */ (instruction[5]) * pixelRatio;
                    goog.asserts.assert(goog.isNumber(instruction[6]));
                    rotation = /** @type {number} */ (instruction[6]);
                    goog.asserts.assert(goog.isNumber(instruction[7]));
                    scale = /** @type {number} */ (instruction[7]) * pixelRatio;
                    goog.asserts.assert(goog.isBoolean(instruction[8]));
                    fill = /** @type {boolean} */ (instruction[8]);
                    goog.asserts.assert(goog.isBoolean(instruction[9]));
                    stroke = /** @type {boolean} */ (instruction[9]);
                    for (; d < dd; d += 2) {
                        x = pixelCoordinates[d] + offsetX;
                        y = pixelCoordinates[d + 1] + offsetY;
                        if (scale != 1 || rotation !== 0) {
                            ol.vec.Mat4.makeTransform2D(
                                localTransform, x, y, scale, scale, rotation, -x, -y);
                            context.setTransform(
                                goog.vec.Mat4.getElement(localTransform, 0, 0),
                                goog.vec.Mat4.getElement(localTransform, 1, 0),
                                goog.vec.Mat4.getElement(localTransform, 0, 1),
                                goog.vec.Mat4.getElement(localTransform, 1, 1),
                                goog.vec.Mat4.getElement(localTransform, 0, 3),
                                goog.vec.Mat4.getElement(localTransform, 1, 3));
                        }
                        if (stroke) {
                            context.strokeText(text, x, y);
                        }
                        if (fill) {
                            context.fillText(text, x, y);
                        }
                        if (scale != 1 || rotation !== 0) {
                            context.setTransform(1, 0, 0, 1, 0, 0);
                        }
                    }
                    ++i;
                    break;
                case ol.render.canvas.Instruction.END_GEOMETRY:
                    if (goog.isDef(featureCallback)) {
                        feature = /** @type {ol.Feature} */ (instruction[1]);
                        var result = featureCallback(feature);
                        if (result) {
                            return result;
                        }
                    }
                    ++i;
                    break;
                case ol.render.canvas.Instruction.FILL:
                    context.fill();
                    ++i;
                    break;
                case ol.render.canvas.Instruction.MOVE_TO_LINE_TO:
                    goog.asserts.assert(goog.isNumber(instruction[1]));
                    d = /** @type {number} */ (instruction[1]);
                    goog.asserts.assert(goog.isNumber(instruction[2]));
                    dd = /** @type {number} */ (instruction[2]);
                    context.moveTo(pixelCoordinates[d], pixelCoordinates[d + 1]);
                    for (d += 2; d < dd; d += 2) {
                        context.lineTo(pixelCoordinates[d], pixelCoordinates[d + 1]);
                    }
                    ++i;
                    break;
                case ol.render.canvas.Instruction.SET_FILL_STYLE:
                    goog.asserts.assert(goog.isString(instruction[1]));
                    context.fillStyle = /** @type {string} */ (instruction[1]);
                    ++i;
                    break;
                case ol.render.canvas.Instruction.SET_STROKE_STYLE:
                    goog.asserts.assert(goog.isString(instruction[1]));
                    goog.asserts.assert(goog.isNumber(instruction[2]));
                    goog.asserts.assert(goog.isString(instruction[3]));
                    goog.asserts.assert(goog.isString(instruction[4]));
                    goog.asserts.assert(goog.isNumber(instruction[5]));
                    goog.asserts.assert(!goog.isNull(instruction[6]));
                    var usePixelRatio = goog.isDef(instruction[7]) ? instruction[7] : true;
                    var lineWidth = /** @type {number} */ (instruction[2]);
                    context.strokeStyle = /** @type {string} */ (instruction[1]);
                    context.lineWidth = usePixelRatio ? lineWidth * pixelRatio : lineWidth;
                    context.lineCap = /** @type {string} */ (instruction[3]);
                    context.lineJoin = /** @type {string} */ (instruction[4]);
                    context.miterLimit = /** @type {number} */ (instruction[5]);
                    if (ol.has.CANVAS_LINE_DASH) {
                        context.setLineDash(/** @type {Array.<number>} */(instruction[6]));
                    }
                    ++i;
                    break;
                case ol.render.canvas.Instruction.SET_TEXT_STYLE:
                    goog.asserts.assert(goog.isString(instruction[1]));
                    goog.asserts.assert(goog.isString(instruction[2]));
                    goog.asserts.assert(goog.isString(instruction[3]));
                    context.font = /** @type {string} */ (instruction[1]);
                    context.textAlign = /** @type {string} */ (instruction[2]);
                    context.textBaseline = /** @type {string} */ (instruction[3]);
                    ++i;
                    break;
                case ol.render.canvas.Instruction.STROKE:
                    context.stroke();
                    ++i;
                    break;
                default:
                    goog.asserts.fail();
                    ++i; // consume the instruction anyway, to avoid an infinite loop
                    break;
            }
        }
        // assert that all instructions were consumed
        goog.asserts.assert(i == instructions.length);
        return undefined;
    };

    ol.interaction.Drag = function (options) {
        var opts = options || {};
        ol.interaction.Pointer.call(this, {
            handleDownEvent: opts.handleDownEvent || ol.interaction.Drag.prototype.handleDownEvent,
            handleDragEvent: opts.handleDragEvent || ol.interaction.Drag.prototype.handleDragEvent,
            handleMoveEvent: opts.handleMoveEvent || ol.interaction.Drag.prototype.handleMoveEvent,
            handleUpEvent: opts.handleUpEvent || ol.interaction.Drag.prototype.handleUpEvent
        });

        /**
         * @type {ol.Pixel}
         * @private
         */
        this.coordinate_ = null;

        /**
         * @type {string|undefined}
         * @private
         */
        this.cursor_ = 'pointer';

        /**
         * @type {ol.Feature}
         * @private
         */
        this.feature_ = null;

        /**
         * @type {string|undefined}
         * @private
         */
        this.previousCursor_ = undefined;

    };
    ol.inherits(ol.interaction.Drag, ol.interaction.Pointer);

    /**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 * @return {boolean} `true` to start the drag sequence.
 */
    ol.interaction.Drag.prototype.handleDownEvent = function (evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function (feature, layer) {
                return feature;
            });

        if (feature) {
            this.coordinate_ = evt.coordinate;
            this.feature_ = feature;
        }

        return !!feature;
    };


    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     */
    ol.interaction.Drag.prototype.handleDragEvent = function (evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function (feature, layer) {
                return feature;
            });

        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];

        var geometry = /** @type {ol.geom.SimpleGeometry} */
            (this.feature_.getGeometry());
        geometry.translate(deltaX, deltaY);

        this.coordinate_[0] = evt.coordinate[0];
        this.coordinate_[1] = evt.coordinate[1];
    };


    /**
     * @param {ol.MapBrowserEvent} evt Event.
     */
    ol.interaction.Drag.prototype.handleMoveEvent = function (evt) {
        if (this.cursor_) {
            var map = evt.map;
            var feature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return feature;
                });
            var element = evt.map.getTargetElement();
            if (feature) {
                if (element.style.cursor != this.cursor_) {
                    this.previousCursor_ = element.style.cursor;
                    element.style.cursor = this.cursor_;
                }
            } else if (this.previousCursor_ !== undefined) {
                element.style.cursor = this.previousCursor_;
                this.previousCursor_ = undefined;
            }
        }
    };


    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     * @return {boolean} `false` to stop the drag sequence.
     */
    ol.interaction.Drag.prototype.handleUpEvent = function (evt) {
        this.coordinate_ = null;
        this.feature_ = null;
        return false;
    };

    var getRGBA = function (color, opacity) {
        var result;
        if (color) {
            result = ol.color.asArray(color);
            result = result.slice();
            if (opacity !== undefined) {
                result[3] = opacity;
            }
        }
        return result;
    };

    /**
     * Obtiene el objeto de opciones de una vista que restringe los niveles de zoom activos sobre el mapa dependiendo de las opciones definidas sobre
     * el mapa base activo.
     */
    var getResolutionOptions = function (mapWrap, layer) {
        var view = mapWrap.map.getView();
        var prevRes = view.getResolution();

        var pms = {
            projection: view.getProjection(),
            extent: mapWrap.parent.options.initialExtent,
            center: view.getCenter(),
            resolution: prevRes,
            enableRotation: false
        };

        var res = layer.getResolutions();
        var maxRes;
        var minRes;

        if (res && res.length) {
            maxRes = layer.maxResolution || res[0];
            minRes = layer.minResolution || res[res.length - 1];

            var minResIx = res.indexOf(minRes);
            var maxResIx = res.indexOf(maxRes);

            pms.resolutions = res.slice(maxResIx, minResIx + 1);
        }
        else {
            maxRes = layer.maxResolution;
            minRes = layer.minResolution;
        }
        if (minRes) {
            pms.minResolution = minRes;
            if (prevRes < minRes) {
                pms.resolution = minRes;
            }
        }
        if (maxRes) {
            pms.maxResolution = maxRes;
            if (prevRes > maxRes) {
                pms.resolution = maxRes;
            }
        }
        return pms;
    };

    TC.wrap.Map.prototype.setMap = function () {

        var self = this;
        var center = [
            (self.parent.options.initialExtent[0] + self.parent.options.initialExtent[2]) / 2,
            (self.parent.options.initialExtent[1] + self.parent.options.initialExtent[3]) / 2
        ];

        var proj4Obj = proj4(self.parent.crs);
        var addEquivalentProjections = function () {
            // Añadimos proyecciones equivalentes y transformaciones necesarias.
            var crsCode = self.parent.crs.substr(self.parent.crs.lastIndexOf(':') + 1);

            var projOptions = {
                units: proj4Obj.oProj.units,
                extent: self.parent.options.baselayerExtent,
                global: true,
                worldExtent: self.parent.options.baselayerExtent
            };

            var equivalentProjections = [];
            projOptions.code = 'EPSG:' + crsCode;
            equivalentProjections.push(new ol.proj.Projection(projOptions));
            projOptions.code = 'urn:ogc:def:crs:EPSG::' + crsCode;
            equivalentProjections.push(new ol.proj.Projection(projOptions));

            ol.proj.addEquivalentProjections(equivalentProjections);

            var doTransform = function (fn, input, opt_output, opt_dimension) {
                var result = [];
                var dimension = opt_dimension || 2;
                for (var i = 0; i < input.length; i += dimension) {
                    result = result.concat(fn(input.slice(i, i + dimension)));
                }
                if ($.isArray(opt_output)) {
                    opt_output.length = 0;
                    for (var i = 0; i < result.length; i++) {
                        opt_output[i] = result[i];
                    }
                    result = opt_output;
                }
                return result;
            };
            var fromEPSG4326 = function (input, opt_output, opt_dimension) {
                return doTransform(proj4Obj.forward, input, opt_output, opt_dimension);
            };
            var toEPSG4326 = function (input, opt_output, opt_dimension) {
                return doTransform(proj4Obj.inverse, input, opt_output, opt_dimension);
            };

            ol.proj.addEquivalentTransforms(
              ol.proj.EPSG4326.PROJECTIONS,
              equivalentProjections,
              fromEPSG4326,
              toEPSG4326);
        };

        addEquivalentProjections();

        var projOptions = {
            code: self.parent.crs,
            units: proj4Obj.oProj.units,
            extent: self.parent.options.baselayerExtent
        };
        if (self.parent.crs === 'EPSG:4326') {
            projOptions.axisOrientation = 'neu';
        }
        var projection = new ol.proj.Projection(projOptions);

        var interactions = ol.interaction.defaults();

        self.map = new ol.Map({
            target: self.parent.div,
            renderer: 'canvas',
            view: new ol.View({
                projection: projection,
                extent: self.parent.options.maxExtent,
                zoom: 2,
                center: center,
                enableRotation: false
            }),
            controls: [],
            interactions: interactions
        });

        // Para evitar estiramientos en canvas
        var updateSize = function () {
            self.map.updateSize();
        };
        $(self.parent.div).on('resize', updateSize);
        self.parent.$events.one(TC.Consts.event.MAPLOAD, updateSize);

        self.map.on(ol.MapBrowserEvent.EventType.SINGLECLICK, function (e) {
            var featuresInLayers = $.map(self.parent.workLayers, function () {
                return false;
            });
            self.map.forEachFeatureAtPixel(e.pixel,
                function (feature, layer) {
                    if (feature._wrap && feature._wrap.parent.showsPopup) {
                        for (var i = 0; i < self.parent.workLayers.length; i++) {
                            var wl = self.parent.workLayers[i];
                            if (wl.wrap.layer === layer) {
                                featuresInLayers[i] = true;
                                break;
                            }
                        }
                        self.parent.$events.trigger($.Event(TC.Consts.event.FEATURECLICK, { feature: feature._wrap.parent }));
                        return feature;
                    }
                });
            for (var i = 0; i < featuresInLayers.length; i++) {
                if (!featuresInLayers[i]) {
                    self.parent.$events.trigger($.Event(TC.Consts.event.NOFEATURECLICK, { layer: self.parent.workLayers[i] }));
                }
            }
        });

        var olView = self.map.getView();
        olView.on('change:resolution', function () {
            self.parent.$events.trigger($.Event(TC.Consts.event.BEFOREZOOM));
        }, self.parent);

        self.map.on('moveend', function () {
            self.parent.$events.trigger($.Event(TC.Consts.event.ZOOM));
        });

        self.mapDeferred.resolve(self.map);

        /**
         * Restringe los niveles de zoom activos sobre el mapa dependiendo de las opciones definidas sobre
         * el mapa base activo.
         */
        var limitZoomLevels = function (layer, viewOptions) {
            var prevRes = self.map.getView().getResolution();
            var prevZoom = self.map.getView().getZoom();

            var pms = viewOptions || getResolutionOptions(self, layer);


            var view = new ol.View(pms);
            self.map.setView(view);
            self.map.render();
        };

        self.parent.$events.on(TC.Consts.event.BASELAYERCHANGE, function (e) {
            limitZoomLevels(e.layer);
        });
        self.parent.$events.on(TC.Consts.event.MAPLOAD, function (e) {
            limitZoomLevels(self.parent.getBaseLayer());
        });
    };


    /*
     *  insertLayer: inserts OpenLayers layer at index
     *  Parameters: OpenLayers.Layer, number
     */
    TC.wrap.Map.prototype.insertLayer = function (olLayer, idx) {
        var self = this;
        var layers = self.map.getLayers();
        var alreadyExists = false;
        for (var i = 0; i < layers.getLength() ; i++) {
            if (layers.item(i) === olLayer) {
                alreadyExists = true;
                break;
            }
        }
        if (alreadyExists) {
            layers.remove(olLayer);
            layers.insertAt(idx, olLayer);
        }
        else {
            layers.insertAt(idx, olLayer);
            if (olLayer instanceof ol.layer.Tile) {
                var resolutions = olLayer.getSource().getResolutions();
                var view = self.map.getView();
                view.maxResolution_ = resolutions[0];
                view.minResolution_ = resolutions[resolutions.length - 1];
            }

            var wrap = olLayer._wrap;
            var loadingTileCount = 0;
            wrap.$events.on(TC.Consts.event.BEFORETILELOAD, function (e) {
                if (loadingTileCount <= 0) {
                    loadingTileCount = 0;
                    self.parent.$events.trigger($.Event(TC.Consts.event.BEFORELAYERUPDATE, { layer: wrap.parent }));
                }
                olLayer._loadingTileCount = olLayer._loadingTileCount + 1;
            });

            wrap.$events.on(TC.Consts.event.TILELOAD, function (e) {
                loadingTileCount = loadingTileCount - 1;
                if (loadingTileCount <= 0) {
                    loadingTileCount = 0;
                    self.parent.$events.trigger($.Event(TC.Consts.event.LAYERUPDATE, { layer: wrap.parent }));
                }
            });
        }
    };

    TC.wrap.Map.prototype.removeLayer = function (olLayer) {
        this.map.removeLayer(olLayer);
    };

    TC.wrap.Map.prototype.getLayerCount = function () {
        return this.map.getLayerGroup().getLayers().getLength();
    };

    TC.wrap.Map.prototype.indexOfFirstVector = function () {
        var result = -1;
        this.map.getLayerGroup().getLayers().forEach(function (l, i) {
            if (l instanceof ol.layer.Vector && result === -1) {
                result = i;
            }
        });
        return result;
    };

    TC.wrap.Map.prototype.getLayerIndex = function (olLayer) {
        var result = -1;
        this.map.getLayerGroup().getLayers().forEach(function (elm, idx) {
            if (elm === olLayer) {
                result = idx;
            }
        });
        return result;
    };

    TC.wrap.Map.prototype.setLayerIndex = function (olLayer, index) {
        var layers = this.map.getLayers();
        var list = layers.getArray();
        var ix = list.indexOf(olLayer);

        if (ix > -1 && ix != index) {
            this.map.removeLayer(olLayer);
            this.insertLayer(olLayer, index);
            //layers.setAt(index, olLayer);
        }
        else {
            //no está el layer, así que no hago nada
        }

    };

    TC.wrap.Map.prototype.setBaseLayer = function (olLayer) {
        var self = this;
        var result = new $.Deferred();

        // Toda esta lógica antes de llamar a setLayer() es para hacer un zoom a la nueva resolución
        // cuando la nueva capa no llega a la resolución actual
        var viewOptions = getResolutionOptions(self, olLayer._wrap.parent);
        var view = self.map.getView();

        var setLayer = function () {
            var curBl = self.parent.getBaseLayer();
            if (curBl) {
                self.map.removeLayer(curBl.wrap.getLayer());
            }
            self.insertLayer(olLayer, 0);
            result.resolve();
        };

        var currentResolution = view.getResolution();
        if (currentResolution !== viewOptions.resolution) {
            self.map.beforeRender(ol.animation.zoom({
                duration: TC.Consts.ZOOM_ANIMATION_DURATION,
                resolution: currentResolution
            }));
            view.once('change:resolution', function () {
                setTimeout(setLayer, TC.Consts.ZOOM_ANIMATION_DURATION);
            });
            view.setResolution(viewOptions.resolution);
        }
        else {
            setLayer();
        }
        return result;
    };

    TC.wrap.Map.prototype.setExtent = function (extent, options) {
        var self = this;

        if (self.done)
            self.done.resolve();

        self.done = new $.Deferred(); // GLS al gestionar el setExtent con un timeout requiere que devuelva una promise para poder gestionar el final del evento

        var opts = options || {};
        // Timeout porque OL3 no tiene evento featuresadded, por tanto cuando se activa map.options.zoomToMarkers
        // se lanza un setExtent por marcador. El timeout evita ejecuciones a lo tonto.
        clearTimeout(self._timeout);
        self._timeout = setTimeout(function () {
            var mapSize = self.map.getSize();
            var view = self.map.getView();
            if (opts.animate === undefined || opts.animate) {
                var zoomAnim = ol.animation.zoom({
                    duration: TC.Consts.ZOOM_ANIMATION_DURATION,
                    resolution: view.getResolution()
                });
                var panAnim = ol.animation.pan({
                    duration: TC.Consts.ZOOM_ANIMATION_DURATION,
                    source: view.getCenter()
                });

                // GLS: resolvemos la promesa cuando acabe la animación
                var onpostrender = function (e) {
                    self.map.un('postrender', onpostrender);
                    self.done.resolve();
                };
                self.map.on('postrender', onpostrender);
                self.map.beforeRender(zoomAnim, panAnim);
            }
            if (self.parent.baseLayer) {
                $.when(self.parent.baseLayer.wrap.getLayer()).then(function (olLayer) {
                    // Todo esto para evitar que haga más zoom que el admisible por la capa base
                    var olSource = olLayer.getSource();
                    if (olSource.getResolutions != goog.abstractMethod) {
                        var res = view.getResolutionForExtent(extent, mapSize);
                        var resolutions = self.parent.baseLayer.getResolutions();


                        if (resolutions && resolutions.length > 0) {
                            var minRes = Math.min.apply(self, resolutions);
                            if (minRes > res) {
                                var factor = 0.5 * (minRes / res - 1);
                                var dx = ol.extent.getWidth(extent) * factor;
                                var dy = ol.extent.getHeight(extent) * factor;
                                extent = extent.slice(0);
                                extent[0] = extent[0] - dx;
                                extent[1] = extent[1] - dy;
                                extent[2] = extent[2] + dx;
                                extent[3] = extent[3] + dy;
                            }
                        }
                    }
                    view.fit(extent, mapSize);

                    // GLS: antes de resolver la promesa validamos si existe animación
                    if (!(opts.animate !== undefined || opts.animate))
                        self.done.resolve();
                });
            }
            else {
                view.fit(extent, mapSize);

                // GLS: antes de resolver la promesa validamos si existe animación
                if (!(opts.animate !== undefined || opts.animate))
                    self.done.resolve();
            }
        }, 50);

        return self.done;
    };

    TC.wrap.Map.prototype.getExtent = function () {
        return this.map.getView().calculateExtent(this.map.getSize());
    };

    TC.wrap.Map.prototype.setCenter = function (coords) {
        this.map.getView().setCenter(coords);
    };

    TC.wrap.Map.prototype.getResolution = function () {
        return this.map.getView().getResolution();
    };

    TC.wrap.Map.prototype.setResolution = function (resolution) {
        $.when(this.getMap()).then(function (olMap) {
            olMap.getView().setResolution(resolution);
        });
    };

    /*    
    TC.wrap.Map.prototype.getResolutions = function () {
        var result = [];
        var self = this;

        var ly = self.parent.getBaseLayer().wrap.layer;
        if (ly.getSource)
        {
            var ts = ly.getSource();
            if (ts.getResolutions && ts.getResolutions != goog.abstractMethod) result = ts.getResolutions();
            }

        return result;
    };
    */

    TC.wrap.Map.prototype.getCoordinateFromPixel = function (xy) {
        return this.map.getCoordinateFromPixel(xy);
    };

    TC.wrap.Map.prototype.getViewport = function () {
        var result = new $.Deferred();
        $.when(this.getMap()).then(function (olMap) {
            result.resolve(olMap.getViewport());
        });
        return result;
    };

    TC.wrap.Map.prototype.isNative = function (map) {
        return map instanceof ol.Map;
    };

    TC.wrap.Map.prototype.isGeo = function () {
        return this.map.getView().getProjection().getUnits() === ol.proj.Units.DEGREES;
    };

    TC.wrap.Map.prototype.addPopup = function (popupCtl) {
        var self = this;
        var draggable = popupCtl.options.draggable === undefined || popupCtl.options.draggable;
        TC.loadJS(
            draggable && !$.fn.drag,
            [TC.apiLocation + 'lib/jQuery/jquery.event.drag.js'],
            function () {
                $.when(self.getMap()).then(function (olMap) {
                    if (!popupCtl.$popupDiv) {
                        // No popups yet
                        var elm = TC.Util.getDiv();
                        popupCtl.$popupDiv = $(elm);
                        popupCtl.$popupDiv
                            .addClass(TC.control.Popup.prototype.CLASS)
                            .appendTo(self.parent.div);
                        popupCtl.$contentDiv = $(TC.Util.getDiv()).addClass(TC.control.Popup.prototype.CLASS + '-content').appendTo(popupCtl.$popupDiv);

                        var popup = new ol.Overlay({
                            element: elm,
                            positioning: 'bottom-left'
                        });
                        olMap.addOverlay(popup);
                        popupCtl.wrap.popup = popup;

                        var $olMapViewport = $(olMap.getViewport());
                        if (draggable) {
                            var $container = popupCtl.$popupDiv.parent();
                            popupCtl.$popupDiv.addClass(TC.Consts.classes.DRAGGABLE);

                            $container
                                .on('touchmove', function (e) {
                                    if ($(e.target).parents('.tc-ctl-finfo-layer-content').length) {
                                        e.stopPropagation();
                                    }
                                })
                                .drag('start', function (ev, dd) {
                                    var bcr = ev.target.getBoundingClientRect();
                                    // Si estamos pulsando sobre una barra de scroll abortamos drag
                                    if (bcr.left + ev.target.clientWidth < ev.clientX || bcr.top + ev.target.clientHeight < ev.clientY) {
                                        return false;
                                    }
                                    popupCtl.setDragging(true);
                                    popupCtl._currentOffset = popup.getOffset();
                                    if (popupCtl._previousContainerPosition) {
                                        var mapSize = olMap.getSize();
                                        popup.setPosition(olMap.getCoordinateFromPixel([popupCtl._previousContainerPosition[0], mapSize[1] - popupCtl._previousContainerPosition[1]]));
                                        popupCtl._currentOffset = [0, 0];
                                        popup.setOffset(popupCtl._currentOffset);
                                        delete popupCtl._previousContainerPosition;
                                    }
                                    else {
                                        popupCtl._currentOffset = popup.getOffset();
                                    }
                                })
                                .drag('end', function (ev, dd) {
                                    popupCtl.setDragging(false);
                                    var coord1 = olMap.getCoordinateFromPixel([0, 0]);
                                    var coord2 = olMap.getCoordinateFromPixel(popup.getOffset());
                                    var coordDelta = [coord2[0] - coord1[0], coord2[1] - coord1[1]];
                                    var position = popup.getPosition();
                                    popup.setPosition([position[0] + coordDelta[0], position[1] + coordDelta[1]]);
                                    popup.setOffset([0, 0]);
                                    popupCtl._currentOffset = [0, 0];

                                    popupCtl._previousContainerPosition = [parseInt($container.css('left')), parseInt($container.css('bottom'))];
                                })
                                .drag(function (ev, dd) {
                                    if (!ev.buttons && !Modernizr.touch) { // Evitamos que se mantenga el drag si no hay botón pulsado (p.e. en IE pulsando una scrollbar)
                                        return false;
                                    }
                                    popup.setOffset([popupCtl._currentOffset[0] + dd.deltaX, popupCtl._currentOffset[1] + dd.deltaY]);
                                }, {
                                    not: 'th,td'
                                });
                        }

                        // change mouse cursor when over marker
                        $olMapViewport
							.off(MOUSEMOVE + '.popup')
							.on(MOUSEMOVE + '.popup', function (e) {
							    var mapTarget = olMap.getTarget();
							    var hit = false;
							    if (!self.parent.activeControl || !self.parent.activeControl.isExclusive()) {
							        var pixel = olMap.getEventPixel(e.originalEvent);
							        hit = olMap.forEachFeatureAtPixel(pixel, function (feature, layer) {
							            var result = true;
							            if (feature._wrap && !feature._wrap.parent.showsPopup) {
							                result = false;
							            }
							            return result;
							        });
							    }
							    if (hit) {
							        mapTarget.style.cursor = 'pointer';
							    } else {
							        mapTarget.style.cursor = '';
							    }
							});
                    }
                });
            }
        );
    };

    TC.wrap.Map.prototype.hidePopup = function (popupCtl) {
        var self = this;
        self.parent.currentFeature = null;
        if (popupCtl.$popupDiv) {
            popupCtl.$popupDiv.removeClass(TC.Consts.classes.VISIBLE);
        }
    };


    /*
     *  getVisibility: gets the OpenLayers layer visibility
     *  Result: boolean
     */
    TC.wrap.Layer.prototype.getVisibility = function (visible) {
        var self = this;
        var result = false;
        if (self.layer) {
            result = self.layer.getVisible();
        }
        return result;
    };

    /*
     *  setVisibility: Sets the OpenLayers layer visibility
     *  Parameter: boolean
     */
    TC.wrap.Layer.prototype.setVisibility = function (visible) {
        var self = this;
        $.when(self.getLayer()).then(function (layer) {
            layer.setVisible(visible);
        });
    };

    TC.wrap.Layer.prototype.isNative = function (layer) {
        return layer instanceof ol.layer.Layer;
    };

    TC.wrap.layer.Raster.prototype.WmsParser = ol.format.WMSCapabilities;

    TC.wrap.layer.Raster.prototype.WmtsParser = ol.format.WMTSCapabilities;

    TC.wrap.Layer.prototype.addCommonEvents = function (layer) {
        var self = this;
        layer.on('change:visible', function () {
            if (self.parent.map) {
                self.parent.map.$events.trigger($.Event(TC.Consts.event.LAYERVISIBILITY, { layer: self.parent }));
            }
        }, self.parent.map);
    };

    TC.wrap.layer.Raster.prototype.getGetMapUrl = function () {
        var result = null;
        var self = this;
        switch (self.getServiceType()) {
            case TC.Consts.layerType.WMS:
                var dcpType = self.parent.capabilities.Capability.Request.GetMap.DCPType;
                for (var i = 0; i < dcpType.length; i++) {
                    if (dcpType[i].HTTP && dcpType[i].HTTP.Get) {
                        result = dcpType[i].HTTP.Get.OnlineResource;
                        break;
                    }
                }
                break;
            case TC.Consts.layerType.WMTS:
                result = self.parent.capabilities.OperationsMetadata.GetTile.DCP.HTTP.Get[0].href;
                break;
            default:
                break;
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getInfoFormats = function () {
        var result = null;
        var c = this.parent.capabilities;
        if (c.Capability && c.Capability.Request.GetFeatureInfo) {
            result = c.Capability.Request.GetFeatureInfo.Format;
        }
        return result;
    };

    TC.wrap.layer.Raster.infoFormatPreference = [
        'application/json',
        'application/vnd.ogc.gml/3.1.1',
        'application/vnd.ogc.gml',
        'application/vnd.esri.wms_featureinfo_xml',
        'text/html',
        'text/plain',
        'text/xml'
    ];

    TC.wrap.layer.Raster.prototype.getWMTSLayer = function () {
        var result = null;
        var self = this;
        var capabilities = self.parent.capabilities;
        if (capabilities && capabilities.Contents) {
            for (var i = 0; i < capabilities.Contents.Layer.length; i++) {
                var layer = capabilities.Contents.Layer[i];
                for (var j = 0; j < layer.TileMatrixSetLink.length; j++) {
                    if (self.parent.options.matrixSet === layer.TileMatrixSetLink[j].TileMatrixSet) {
                        result = layer;
                        break;
                    }
                }
            }
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getTileMatrix = function (matrixSet) {
        var result = null;
        var self = this;
        var capabilities = self.parent.capabilities;
        if (capabilities && capabilities.Contents && capabilities.Contents.TileMatrixSet) {
            for (var i = 0; i < capabilities.Contents.TileMatrixSet.length; i++) {
                var tms = capabilities.Contents.TileMatrixSet[i];
                if (tms.Identifier === matrixSet) {
                    result = tms.TileMatrix;
                    break;
                }
            }
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getScaleDenominators = function (node) {
        var result = [];
        var self = this;
        if (node.ScaleDenominator) {
            result = [node.ScaleDenominator, node.ScaleDenominator];
        }
        else {
            if (node.MinScaleDenominator || node.MaxScaleDenominator) {
                result = [node.MaxScaleDenominator, node.MinScaleDenominator];
            }
        }
        // Contemplamos el caso de una capa sin nombre: sus escalas válidas serán las de sus hijas.
        if (!result.length && !self.getName(node)) {
            var children = self.getLayerNodes(node);
            var max = -Infinity, min = Infinity;
            for (var i = 0, len = children.length; i < len; i++) {
                var childDenominators = self.getScaleDenominators(children[i]);
                if (childDenominators[0] > max) {
                    max = childDenominators[0];
                }
                if (childDenominators[1] < min) {
                    min = childDenominators[1];
                }
            }
            if (max > -Infinity && min < Infinity) {
                result = [max, min];
            }
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getAttribution = function (capabilities) {
        var result = null;
        if (capabilities) {
            if (capabilities.ServiceIdentification) {
                result = capabilities.ServiceIdentification.Title;
            }
            else {
                result = capabilities.Service.Title;
            }
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getInfo = function (name) {
        var self = this;
        var result = {};
        var capabilities = self.parent.capabilities;
        if (capabilities && capabilities.Capability) {
            var layerNodes = self.getAllLayerNodes();
            for (var i = 0; i < layerNodes.length; i++) {
                var l = layerNodes[i];
                if (self.getName(l) === name) {
                    if (l.Title) {
                        result.title = l.Title;
                    }
                    if (l.Abstract) {
                        result['abstract'] = l.Abstract;
                    }
                    result.legend = [];

                    var _process = function (value) {
                        var legend = this.getLegend(value);

                        if (legend.src)
                            result.legend.push({ src: legend.src, title: value.Title });
                    };

                    var _traverse = function (o, func) {
                        if (o.Layer && o.Layer.length > 0) {
                            for (var i in o.Layer) {
                                //bajar un nivel en el árbol
                                _traverse(o.Layer[i], func);
                            }
                        } else {
                            func.apply(self, [o]);
                        }
                    };

                    //Obtenemos todas las leyendas de la capa o grupo de capas
                    _traverse(l, _process);

                    if (l.MetadataURL && l.MetadataURL.length) {
                        result.metadata = [];
                        for (var j = 0; j < l.MetadataURL.length; j++) {
                            var md = l.MetadataURL[j];
                            result.metadata.push({ format: md.Format, type: md.type, url: md.OnlineResource });
                        }
                    }
                    result.queryable = l.queryable;
                    break;
                }
            }
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getServiceType = function () {
        var result = null;
        var capabilities = this.parent.capabilities;
        if (capabilities.Capability && capabilities.Capability.Request && capabilities.Capability.Request.GetMap) {
            result = TC.Consts.layerType.WMS;
        }
        else if (capabilities.OperationsMetadata && capabilities.OperationsMetadata.GetTile) {
            result = TC.Consts.layerType.WMTS;
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getRootLayerNode = function () {
        var capabilities = this.parent.capabilities;
        return capabilities.Capability.Layer;
    };

    TC.wrap.layer.Raster.prototype.getName = function (node, ignorePrefix) {
        var result = node.Name;
        if (result && ignorePrefix) {
            var idx = result.indexOf(':');
            if (idx >= 0) {
                result = result.substr(idx + 1);
            }
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getLayerNodes = function (node) {
        var result = node.Layer;
        if (!$.isArray(result)) {
            if (result) {
                result = [result];
            }
            else {
                result = [];
            }
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getAllLayerNodes = function () {
        var self = this;
        if (!self._layerList) {
            var getNodeArray = function getNodeArray(node) {
                var r = [node];
                var children = self.getLayerNodes(node);
                for (var i = 0; i < children.length; i++) {
                    r = r.concat(getNodeArray(children[i]));
                }
                return r;
            };
            self._layerList = getNodeArray(self.getRootLayerNode());
        }
        return self._layerList;
    };

    TC.wrap.layer.Raster.prototype.normalizeLayerNode = function (node) {
        return node;
    };

    TC.wrap.layer.Raster.prototype.normalizeCapabilities = function (capabilities) {
        return capabilities;
    };


    TC.wrap.layer.Raster.prototype.getLegend = function (node) {
        var result = {};
        var styles = node.Style;
        if (styles && styles.length) {
            if (styles.length && styles[0].LegendURL && styles[0].LegendURL.length) {
                var legend = styles[0].LegendURL[0];
                result.src = legend.OnlineResource;
                // Eliminado porque GeoServer miente con el tamaño de sus imágenes de la leyenda
                //if (legend.size) {
                //    result.width = legend.size[0];
                //    result.height = legend.size[1];
                //}
            }
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.isCompatible = function (crs) {
        var self = this;
        var result = true;
        var layer = self.parent;
        switch (self.getServiceType()) {
            case TC.Consts.layerType.WMS:
                if (layer.capabilities && layer.capabilities.Capability && layer.capabilities.Capability.Layer) {
                    if (layer.names.length > 0) {
                        var names = layer.names.slice(0);
                        var _isCompatible = function _isCompatible(nodes, name, inCrs) {
                            var r = false;
                            if (nodes) {
                                for (var i = 0; i < nodes.length; i++) {
                                    var n = nodes[i];
                                    var isIn = inCrs || $.inArray(crs, n.CRS || n.SRS) >= 0;
                                    if (layer.compareNames(self.getName(n), name, true)) {
                                        if (isIn) {
                                            r = true;
                                        }
                                        break;
                                    }
                                    else if (_isCompatible(n.Layer, name, isIn)) {
                                        r = true;
                                        break;
                                    }
                                }
                            }
                            return r;
                        };
                        while (names.length > 0) {
                            if (!_isCompatible([layer.capabilities.Capability.Layer], names.pop())) {
                                result = false;
                                break;
                            }
                        }
                    }
                }
                break;
            case TC.Consts.layerType.WMTS:
                var crsRegExp = new RegExp('^urn:ogc:def:crs:' + crs.replace(':', ':.*:') + '$', 'g');
                result = false;
                if (layer.capabilities && layer.capabilities.Contents && layer.capabilities.Contents.TileMatrixSet) {
                    var tms = layer.capabilities.Contents.TileMatrixSet;
                    for (var i = 0; i < tms.length; i++) {
                        if (tms[i].Identifier === layer.options.matrixSet) {
                            result = crsRegExp.test(tms[i].SupportedCRS);
                            break;
                        }
                    }
                }
                break;
            default:
                break;
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getCompatibleLayers = function (crs) {
        var self = this;
        var result = [];
        var layer = self.parent;
        switch (self.getServiceType()) {
            case TC.Consts.layerType.WMS:
                if (layer.capabilities && layer.capabilities.Capability && layer.capabilities.Capability.Layer) {
                    var _fnrecursive = function (item, crs, inCrs) {
                        var isIn = inCrs || $.inArray(crs, item.CRS || item.SRS) >= 0;
                        if (isIn && item.Name) result[result.length] = item.Name;
                        if (item.Layer) {
                            for (var i = 0; i < item.Layer.length; i++) {
                                _fnrecursive(item.Layer[i], crs, isIn);
                            }
                        }
                    }
                    _fnrecursive(layer.capabilities.Capability.Layer, crs);
                }
                break;
            case TC.Consts.layerType.WMTS:
                var crsRegExp = new RegExp('^urn:ogc:def:crs:' + crs.replace(':', ':.*:') + '$', 'g');
                if (layer.capabilities && layer.capabilities.Contents && layer.capabilities.Contents.TileMatrixSet) {
                    var tms = layer.capabilities.Contents.TileMatrixSet;
                    for (var i = 0; i < tms.length; i++) {
                        if (crsRegExp.test(tms[i].SupportedCRS)) {
                            result[result.length] = tms[i].Identifier;
                        }
                    }
                }
                break;
            default:
                break;
        }
        return result;
    };

    var imageLoadFunction = function (image, src) {
        var self = this;
        self.$events.trigger($.Event(TC.Consts.event.BEFORETILELOAD, { tile: image }));
        var img = image.getImage();
        var throwEvent = function () {
            self.$events.trigger($.Event(TC.Consts.event.TILELOAD, { tile: image }));
        };
        img.addEventListener('load', throwEvent);
        img.addEventListener('error', throwEvent);
        img.src = self.parent.names.length ? src : TC.Consts.BLANK_IMAGE;
    };

    /**
     * Carga el tile de la capa por POST.
     */
    var imagePostFunction = function (image, src) {
        var self = this;
        self.$events.trigger($.Event(TC.Consts.event.BEFORETILELOAD, { tile: image }));
        var img = image.getImage();

        if (typeof window.btoa === 'function') {
            var xhr = new XMLHttpRequest();
            var url = src.split('?');
            var dataEntries = url[1].split("&");
            var params = "";

            for (var i = 0 ; i < dataEntries.length ; i++) {
                var chunks = dataEntries[i].split('=');

                if (chunks && chunks.length > 1 && chunks[1] && chunks[0] !== "LAYERS") { //Quitamos el parámetro LAYERS de la petición
                    params += "&" + dataEntries[i];
                }
            }
            xhr.open('POST', url[0], true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

            xhr.responseType = 'arraybuffer';
            xhr.onload = function (e) {
                if (this.status === 200) {
                    var uInt8Array = new Uint8Array(this.response);
                    var i = uInt8Array.length;
                    var binaryString = new Array(i);
                    while (i--) {
                        binaryString[i] = String.fromCharCode(uInt8Array[i]);
                    }
                    var data = binaryString.join('');
                    var type = xhr.getResponseHeader('content-type');
                    if (type.indexOf('image') === 0) {
                        var throwEvent = function () {
                            self.$events.trigger($.Event(TC.Consts.event.TILELOAD, { tile: image }));
                        };
                        img.addEventListener('load', throwEvent);
                        img.addEventListener('error', throwEvent);
                        img.src = 'data:' + type + ';base64,' + window.btoa(data);
                    }
                }
            };
            xhr.send(params);
        }
    };

    TC.wrap.layer.Raster.prototype.createWmsLayer = function (url, params, options) {
        var self = this;
        var result = null;
        var imageFunction = null;

        //True si la capa va a ser cargada por POST
        var imageLoadByPost = options && options.method && options.method === 'POST';

        self.$events = $(self);

        if (imageLoadByPost) { //Si queremos cargar la capa por POST, sobreescribimos la función que pide la imagen
            imageFunction = $.proxy(imagePostFunction, self);
        } else {
            imageFunction = $.proxy(imageLoadFunction, self);
        }

        var source = new ol.source.ImageWMS({
            url: url,
            crossOrigin: null,
            params: params,
            extent: TC.Cfg.initialExtent,
            ratio: TC.Cfg.imageRatio,
            imageLoadFunction: imageFunction
        });

        var layerOptions = {
            visible: !!params.LAYERS.length || imageLoadByPost, //Las capas de temáticos cargadas por POST no tienen el atributo LAYERS
            source: source
        };

        if (options.minResolution) {
            layerOptions.minResolution = options.minResolution;
        }
        if (options.maxResolution) {
            layerOptions.maxResolution = options.maxResolution;
        }
        result = new ol.layer.Image(layerOptions);

        result._wrap = self;

        self.addCommonEvents(result);

        return result;
    };

    TC.wrap.layer.Raster.prototype.createWmtsLayer = function (matrixSet, layerName, options) {
        var self = this;
        var result = null;

        self.$events = $(self);
        var source = new ol.source.WMTS(ol.source.WMTS.optionsFromCapabilities(self.parent.capabilities, { layer: layerName, requestEncoding: options.encoding }));
        source.setTileLoadFunction($.proxy(imageLoadFunction, self));

        var layerOptions = {
            source: source
        };
        if (options.minResolution) {
            layerOptions.minResolution = options.minResolution;
        }
        if (options.maxResolution) {
            layerOptions.maxResolution = options.maxResolution;
        }
        result = new ol.layer.Tile(layerOptions);
        result._wrap = self;

        var prevFn = $.proxy(source.getResolutions, source);
        source.getResolutions = function () {
            var resolutions = prevFn();
            var matrix = result._wrap.parent.getLimitedMatrixSet();
            //esto está mal, porque matrix podría empezar más abajo (tener recortado por ambos lados)
            if (matrix) {
                var ix = matrix[0].matrixIndex;
                resolutions = resolutions.slice(ix, matrix.length + ix);
            }

            return resolutions;
        };


        self.addCommonEvents(result);

        var resolutions = source.getResolutions();
        //Este +1 tan chungo es porque, en el caso en que la resolución del mapa es igual a la máxima del layer, openLayers lo oculta
        result.setMaxResolution(resolutions[0] + 1);
        result.setMinResolution(resolutions[resolutions.length - 1]);

        return result;
    };

    /*
     *  getParams: Gets the WMS layer getmap parameters
     *  Returns: object
     */
    TC.wrap.layer.Raster.prototype.getParams = function () {
        return this.layer.getSource().getParams();
    };

    /*
     *  setParams: Sets the WMS layer getmap parameters
     *  Parameter: object
     */
    TC.wrap.layer.Raster.prototype.setParams = function (params) {
        this.layer.getSource().updateParams(params);
    };

    TC.wrap.layer.Raster.prototype.getResolutions = function () {
        if (this.layer.getSource) {
            var ts = this.layer.getSource();
            if (ts.getResolutions && ts.getResolutions != goog.abstractMethod) return ts.getResolutions();
            else return [];
        }
        else {
            return [];
        }
    };

    TC.wrap.Geometry = {
        getNearest: function (point, candidates) {
            var pline = new ol.geom.LineString(candidates);
            return pline.getClosestPoint(point);
        }
    };

    // En OL3 la imagen tiene el tamaño original. Escalamos si hace falta.
    var setScaleFunction = function (imageStyle, iconWidth, olFeat) {
        if (imageStyle) {
            var setScale = function (imgWidth) {
                var markerWidth = (olFeat && olFeat._wrap ? olFeat._wrap.parent.options.width : null) || iconWidth;
                if (markerWidth < imgWidth) {
                    var factor = markerWidth / imgWidth;
                    imageStyle.setScale(factor);
                }
            };
            var imageSize = imageStyle.getSize();
            if (imageSize) {
                setScale(imageSize[0]);
            }
            else {
                var img = imageStyle.getImage();
                img.addEventListener('load', function () {
                    setScale(this.width);
                });
            }
        }
    };

    var getStyleValue = function (property, feature) {
        var result = property;
        var olFeat = feature && feature.wrap && feature.wrap.feature;
        if (typeof property === 'string') {
            var match = property.match(/^\$\{(.+)\}$/);
            if (match && olFeat) {
                // Permitimos el formato ${prop.subprop.subsubprop}
                var m = match[1].split('.');
                var r = olFeat.getProperties();
                for (var i = 0; i < m.length && r !== undefined; i++) {
                    r = r[m[i]];
                }
                if (r === undefined) {
                    r = feature.data;
                    for (var i = 0; i < m.length && r !== undefined; i++) {
                        r = r[m[i]];
                    }
                }
                result = r;
            }
        }
        else if ($.isFunction(property)) {
            result = property(feature);
        }
        return result;
    };

    var styleFunction;
    // Transformación de opciones de estilo en un estilo nativo OL3.
    var createNativeStyle = function (options, olFeat) {
        var nativeStyleOptions = {};

        var feature;
        if (olFeat) {
            if (olFeat._wrap) {
                feature = olFeat._wrap.parent;
            }
            else {
                // Si la API SITNA no ha completado su feature, creamos un mock-up para que no fallen las funciones de estilo
                feature = {
                    features: olFeat.get('features'),
                    getData: function () {
                        return TC.wrap.Feature.prototype.getData.call({ feature: olFeat });
                    }
                };
            }
        }
        var isCluster = feature && $.isArray(feature.features) && feature.features.length > 1 && options.cluster;
        var styles;
        if (isCluster) {
            styles = options.cluster.styles || TC.Cfg.styles.cluster;
        }
        else {
            styles = options.styles || TC.Cfg.styles;
        }

        if (styles.line) {
            nativeStyleOptions.stroke = new ol.style.Stroke({
                color: getStyleValue(styles.line.strokeColor, feature),
                width: getStyleValue(styles.line.strokeWidth, feature)
            });
        }

        if (styles.polygon) {
            nativeStyleOptions.fill = new ol.style.Fill({
                color: getRGBA(getStyleValue(styles.polygon.fillColor, feature), getStyleValue(styles.polygon.fillOpacity, feature))
            });
        }

        if (styles.point) {
            var pointOptions = styles.point;
            var circleOptions = {
                radius: getStyleValue(pointOptions.radius, feature) ||
                    (getStyleValue(pointOptions.height, feature) + getStyleValue(pointOptions.width, feature)) / 4
            };
            if (pointOptions.fillColor) {
                circleOptions.fill = new ol.style.Fill({
                    color: getRGBA(getStyleValue(pointOptions.fillColor, feature), getStyleValue(pointOptions.fillOpacity, feature))
                });
            }
            if (pointOptions.strokeColor) {
                circleOptions.stroke = new ol.style.Stroke({
                    color: getStyleValue(pointOptions.strokeColor, feature),
                    width: getStyleValue(pointOptions.strokeWidth, feature)
                });
            }
            nativeStyleOptions.image = new ol.style.Circle(circleOptions);
            if (pointOptions.label) {
                var textOptions = {
                    text: '' + getStyleValue(pointOptions.label, feature),
                };
                if (pointOptions.fontSize) {
                    textOptions.font = pointOptions.fontSize + 'pt sans-serif';
                }
                if (pointOptions.angle) {
                    textOptions.rotation = -Math.PI * getStyleValue(pointOptions.angle, feature) / 180;
                }
                if (pointOptions.fontColor) {
                    textOptions.fill = new ol.style.Fill({
                        color: getRGBA(getStyleValue(pointOptions.fontColor, feature), 1)
                    });
                }
                if (pointOptions.labelOutlineColor) {
                    textOptions.stroke = new ol.style.Stroke({
                        color: getRGBA(getStyleValue(pointOptions.labelOutlineColor, feature), 1),
                        width: getStyleValue(pointOptions.labelOutlineWidth, feature)
                    });
                }
                nativeStyleOptions.text = new ol.style.Text(textOptions);
            }
            return [new ol.style.Style(nativeStyleOptions)];
        }
    };

    TC.wrap.layer.Vector.prototype.createVectorLayer = function () {
        var self = this;
        var result = null;

        self.$events = $(self);

        var dynamicStyle = false;
        var options = self.parent.options;

        if ($.isFunction(options)) {
            dynamicStyle = true;
            styleFunction = function (olFeat) {
                var opts = options;
                if (olFeat && olFeat._wrap) {
                    opts = olFeat._wrap.parent.layer.options;
                }
                return createNativeStyle(opts(olFeat));
            }
        }
        else {
            options = $.extend({}, options);
            options.crs = options.crs || TC.Cfg.crs;
            options.styles = options.styles || TC.Cfg.styles;
            var isDynamicStyle = function isDynamicStyle(obj) {
                for (var key in obj) {
                    var prop = obj[key];
                    switch (typeof prop) {
                        case 'string':
                            if (/^\$\{(.+)\}$/.test(prop)) {
                                return true;
                            }
                            break;
                        case 'object':
                            if (isDynamicStyle(prop)) {
                                return true;
                            }
                            break;
                        case 'function':
                            return true;
                            break;
                        default:
                            break;
                    }
                }
                return false;
            };

            dynamicStyle = !!(options.cluster && options.cluster.styles) || isDynamicStyle(options.styles);
            styleFunction = function (olFeat) {
                var opts = options;
                if (olFeat && olFeat._wrap) {
                    opts = olFeat._wrap.parent.layer.options;
                }
                return createNativeStyle(opts, olFeat);
            };
        }

        var style = dynamicStyle ? styleFunction : styleFunction();

        var source;
        var vectorOptions;
        var isKml = false;
        var _isKml = function (url) {
            url = goog.uri.utils.getPath(url);
            return (url.substr(url.length - 4).toLowerCase() === '.kml');
        };

        if ($.isArray(options.url) || options.urls) {
            isKml = true;
            var urls = options.urls || options.url;
            urls = $.map(urls, function (elm, idx) {
                return TC.proxify(elm);
            });
            vectorOptions = {
                url: urls,
                format: new ol.format.KML({
                    showPointNames: false
                }),
                projection: options.crs
            };
        }
        else if (options.url && (_isKml(options.url) || options.type === TC.Consts.layerType.KML)) {
            isKml = true;
            vectorOptions = {
                url: TC.proxify(options.url),
                format: new ol.format.KML({
                    showPointNames: false
                }),
                projection: options.crs
            };
        }
        else if (options.type == TC.Consts.layerType.WFS) {
            var outputFormat;
            var mimeType;
            switch (options.outputFormat) {
                case TC.Consts.format.JSON:
                    outputFormat = new ol.format.GeoJSON();
                    mimeType = TC.Consts.mimeType.JSON;
                    break;
                case TC.Consts.format.GML3:
                    outputFormat = new ol.format.GML3();
                    mimeType = TC.Consts.mimeType.GML;
                    break;
                default:
                    outputFormat = new ol.format.GML2();
                    mimeType = TC.Consts.mimeType.GML;
                    break;
            }
            vectorOptions = {
                format: outputFormat,
                loader: function (extent, resolution, projection) {
                    var sOrigin = this;
                    var serviceUrl = options.url;
                    if (serviceUrl) {
                        self.parent.map.$events.trigger($.Event(TC.Consts.event.BEFORELAYERUPDATE, { layer: self.parent }));
                        var ajaxOptions = {};
                        var crs = projection.getCode();
                        var version = options.version || '1.1.0';
                        var url = serviceUrl;
                        var featureType = $.isArray(options.featureType) ? options.featureType : [options.featureType];
                        if (!options.properties || !options.properties.length) {
                            url = url + '?service=WFS&' +
                            'version=' + version + '&request=GetFeature&typename=' + featureType.join(',') + '&' +
                            'outputFormat=' + mimeType + '&srsname=' + crs;
                            if (extent[0] !== -Infinity && extent[1] !== -Infinity && extent[2] !== Infinity && extent[3] !== Infinity) {
                                url = url + '&bbox=' + extent.join(',') + ',' + crs;
                            }
                        }
                        else {
                            ajaxOptions.type = 'POST';
                            ajaxOptions.contentType = TC.Consts.mimeType.XML;
                            ajaxOptions.processData = false;
                            //var formatter = new ol.format.WFS();
                            //var doc = formatter.writeGetFeature({
                            //    featureNS: 'wfs',
                            //    featurePrefix: 'feature',
                            //    featureTypes: featureType,
                            //    srsName: crs
                            //});
                            //var filter = [];
                            //filter[0] = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">';
                            //if (options.properties.length > 1) {
                            //    filter[filter.length] = '<ogc:And>';
                            //}
                            //for (var j = 0; j < options.properties.length; j++) {
                            //    var prop = options.properties[j];
                            //    filter[filter.length] = '<ogc:PropertyIsEqualTo matchCase="true"><ogc:PropertyName>';
                            //    filter[filter.length] = prop.name;
                            //    filter[filter.length] = '</ogc:PropertyName><ogc:Literal>';
                            //    filter[filter.length] = prop.value;
                            //    filter[filter.length] = '</ogc:Literal></ogc:PropertyIsEqualTo>';
                            //}
                            //if (options.properties.length > 1) {
                            //    filter[filter.length] = '</ogc:And>';
                            //}
                            //filter[filter.length] = '</ogc:Filter>';
                            //filter = filter.join('');
                            //var $doc = $(doc);
                            //$doc.find('Query').each(function (idx, query) {
                            //    $(query).html(filter);
                            //});
                            //ajaxOptions.data = $('<div>').append($doc).html();
                            var gml = [];
                            gml[gml.length] = '<wfs:GetFeature xmlns:wfs="http://www.opengis.net/wfs" service="WFS" version="';
                            gml[gml.length] = version;
                            gml[gml.length] = '" outputFormat="';
                            gml[gml.length] = options.outputFormat;
                            gml[gml.length] = '" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/';
                            gml[gml.length] = version;
                            gml[gml.length] = '/wfs.xsd">';
                            for (var i = 0; i < featureType.length; i++) {
                                gml[gml.length] = '<wfs:Query typeName="feature:';
                                gml[gml.length] = featureType[i];
                                gml[gml.length] = '" srsName="';
                                gml[gml.length] = crs;
                                gml[gml.length] = '">';
                                gml[gml.length] = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">';
                                if (options.properties.length > 1) {
                                    gml[gml.length] = '<ogc:And>';
                                }
                                for (var j = 0; j < options.properties.length; j++) {
                                    var prop = options.properties[j];
                                    gml[gml.length] = '<ogc:PropertyIsEqualTo matchCase="true"><ogc:PropertyName>';
                                    gml[gml.length] = prop.name;
                                    gml[gml.length] = '</ogc:PropertyName><ogc:Literal>';
                                    gml[gml.length] = prop.value;
                                    gml[gml.length] = '</ogc:Literal></ogc:PropertyIsEqualTo>';
                                }
                                if (options.properties.length > 1) {
                                    gml[gml.length] = '</ogc:And>';
                                }
                                gml[gml.length] = '</ogc:Filter></wfs:Query>';
                            }
                            gml[gml.length] = '</wfs:GetFeature>';

                            ajaxOptions.data = gml.join('');
                        }
                        ajaxOptions.url = url;
                        $.ajax(ajaxOptions).done(function (data) {
                            sOrigin.addFeatures(outputFormat.readFeatures(data));
                            self.parent.map.$events.trigger($.Event(TC.Consts.event.LAYERUPDATE, { layer: self.parent }));
                        });
                    }
                },
                //strategy: ol.loadingstrategy.all(),
                projection: options.crs
            };
        }

        source = new ol.source.Vector(vectorOptions);

        source._tcLayer = self.parent;

        var markerStyle = options.style && options.style.marker ? options.style.marker : TC.Cfg.styles.marker;
        if (!options.style || !options.style.marker) {
            markerStyle = $.extend({}, markerStyle, { anchor: TC.Cfg.styles.point.anchor });
        }

        // Si habilitamos el clustering la fuente es especial
        if (options.cluster) {
            source = new ol.source.Cluster({
                projection: options.crs,
                distance: options.cluster.distance,
                source: source
            });

            // Animación
            if (options.cluster.animation) {
                var getCurrentCoordinates = function (fromCoords, toCoords, duration, start) {
                    var fraction = Math.min((Date.now() - start) / duration, 1);
                    var dx = (toCoords[0] - fromCoords[0]) * fraction;
                    var dy = (toCoords[1] - fromCoords[1]) * fraction;
                    return [fromCoords[0] + dx, fromCoords[1] + dy];
                };
                var animate = function (parent, child) {
                    var start = Date.now();
                    var pCoords = parent.getGeometry().getCoordinates();
                    var cCoords = child.getGeometry().getCoordinates();
                    child.setGeometry(new ol.geom.Point(pCoords));
                    var step = function step() {
                        var coords = getCurrentCoordinates(pCoords, cCoords, TC.Consts.CLUSTER_ANIMATION_DURATION, start);
                        child.setGeometry(new ol.geom.Point(coords));
                        if (coords[0] !== cCoords[0] && coords[1] !== cCoords[1]) {
                            requestAnimationFrame(step);
                        }
                        else {
                            clusterCache.splice($.inArray(parent, clusterCache), 1);
                        }
                    };
                    requestAnimationFrame(step);
                };
                var clusterCache = [];
                source.addEventListener(ol.source.VectorEventType.REMOVEFEATURE, function (e) {
                    var features = e.feature.get('features');
                    if (features && features.length > 1) {
                        clusterCache.push(e.feature);
                    }
                });
                source.addEventListener(ol.source.VectorEventType.ADDFEATURE, function (e) {
                    var features = e.feature.get('features');
                    if (features) {
                        var coords = features[0].getGeometry().getCoordinates();
                        if (features.length > 1) {
                            var match = $.grep(clusterCache, function (elm) {
                                var elmCoords = elm.getGeometry().getCoordinates();
                                return elmCoords[0] === coords[0] && elmCoords[1] === coords[1];
                            });
                            if (match.length) {
                                clusterCache.splice($.inArray(match[0], clusterCache), 1);
                            }
                        }
                        var parent = $.grep(clusterCache, function (elm) {
                            var children = elm.get('features');
                            if (children && children.length > 0) {
                                var child = $.grep(children, function (cElm) {
                                    var cCoords = cElm.getGeometry().getCoordinates();
                                    return cCoords[0] === coords[0] && cCoords[1] === coords[1];
                                });
                                return child.length > 0;
                            }
                        });
                        if (parent.length) {
                            animate(parent[parent.length - 1], e.feature);
                        }
                    }
                });
            }
        }

        var s = source;
        do {
            s.addEventListener(ol.source.VectorEventType.ADDFEATURE, function (e) {
                var olFeat = e.feature;
                // OL3 dibuja el tamaño original del icono del marcador, lo escalamos si es necesario:
                var style = olFeat.getStyle();
                if ($.isFunction(style)) {
                    style = style.call(olFeat);
                }
                if ($.isArray(style)) {
                    style = style[0];
                }
                if (style) {
                    setScaleFunction(style.getImage(), markerStyle.width, olFeat);
                }
            });
            if ($.isFunction(s.getSource)) {
                s = s.getSource();
            }
            else {
                s = null;
            }
        }
        while (s);

        var getIcon = function (olFeat) {
            var result = null;
            var style = olFeat.getStyle();
            if ($.isFunction(style)) {
                style = style.call(olFeat, olFeat);
            }
            if ($.isArray(style)) {
                style = style[0];
            }
            if (style) {
                var img = style.getImage();
                if (img instanceof ol.style.Icon) {
                    result = img.getSrc();
                }
            }
            return result;
        };

        source.addEventListener(ol.source.VectorEventType.ADDFEATURE, function (e) {
            var olFeat = e.feature;

            if (!olFeat._wrap) { // Solo actuar si no es una feature añadida desde la API
                var geom = olFeat.getGeometry();
                var deferred;
                if (geom instanceof ol.geom.Point) {
                    if (getIcon(olFeat)) {
                        deferred = self.parent.addMarker(olFeat);
                    }
                    else {
                        deferred = self.parent.addPoint(olFeat);
                    }
                }
                else if (geom instanceof ol.geom.LineString || geom instanceof ol.geom.MultiLineString) {
                    deferred = self.parent.addPolyline(olFeat);
                }
                else if (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon) {
                    deferred = self.parent.addPolygon(olFeat);
                }
                $.when(deferred).then(function (feat) {
                    var features = olFeat.get('features');
                    if ($.isArray(features)) {
                        // Es una feature de fuente ol.source.Cluster
                        feat.features = $.map(features, function (elm) {
                            return new feat.constructor(elm);
                        });
                    }
                    self.parent.map.$events.trigger($.Event(TC.Consts.event.FEATURESADD, { layer: self.parent, features: [feat] }));
                });
            }
        });

        source.addEventListener(ol.source.VectorEventType.REMOVEFEATURE, function (e) {
            var olFeat = e.feature;
            if (olFeat._wrap) {
                var idx = $.inArray(olFeat._wrap.parent, self.parent.features);
                if (idx > -1) {
                    self.parent.features.splice(idx, 1);
                    self.parent.map.$events.trigger($.Event(TC.Consts.event.FEATUREREMOVE, { layer: self.parent, feature: olFeat._wrap.parent }));
                }
            }
        });

        source.addEventListener(ol.source.VectorEventType.ADDFEATURE, function (e) {
            self.parent.map.$events.trigger($.Event(TC.Consts.event.VECTORUPDATE, { layer: self.parent }));
        });

        source.addEventListener(ol.source.VectorEventType.REMOVEFEATURE, function () {
            self.parent.map.$events.trigger($.Event(TC.Consts.event.VECTORUPDATE, { layer: self.parent }));
        });

        /*
        source.addEventListener('change', function (e) {
            self.parent.map.$events.trigger($.Event(TC.Consts.event.LAYERUPDATE, { layer: self.parent }));
        });
        */

        var layerOptions = {
            source: source
        };
        if (!isKml) {
            layerOptions.style = style;
        }

        result = new ol.layer.Vector(layerOptions);
        result._wrap = self;

        self.addCommonEvents(result);

        return result;
    };

    TC.wrap.layer.Vector.prototype.addFeatures = function (features) {
        $.when(this.getLayer()).then(function (olLayer) {
            var source = olLayer;
            while ($.isFunction(source.getSource)) {
                source = source.getSource();
            }
            source.addFeatures(features);
        });
    };

    TC.wrap.layer.Vector.prototype.getFeatures = function () {
        var olLayer = this.getLayer();
        if (olLayer instanceof ol.layer.Layer) {
            return olLayer.getSource().getFeatures();
        }
        else {
            return [];
        }
    };

    TC.wrap.layer.Vector.prototype.removeFeature = function (feature) {
        $.when(this.getLayer()).then(function (olLayer) {
            var source = olLayer.getSource();
            source.removeFeature(feature.wrap.feature);
        });
    };

    TC.wrap.layer.Vector.prototype.clearFeatures = function () {
        $.when(this.getLayer()).then(function (olLayer) {
            var source = olLayer.getSource();
            if (source.clearFeatures) {
                source.clearFeatures();
            }
            else {
                source.clear();
            }
        });
    };

    TC.wrap.layer.Vector.prototype.setFeatureVisibility = function (feature, visible) {
        var self = this;

        var fillOptions = {
            color: 'rgba(0, 0, 0, 0)'
        };
        var strokeOptions = {
            color: 'rgba(0, 0, 0, 0)'
        };
        var displayNoneStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 0,
                fill: new ol.style.Fill(fillOptions),
                stroke: new ol.style.Stroke(strokeOptions)
            }),
            fill: new ol.style.Fill(fillOptions),
            stroke: new ol.style.Stroke(strokeOptions)
        });
        var idx = $.inArray(feature, self.parent.features);
        if (idx >= 0) {
            var olFeat = feature.wrap.feature;
            if (visible && olFeat._originalStyle) {
                olFeat.setStyle(olFeat._originalStyle);
            }
            else {
                olFeat._originalStyle = olFeat.getStyle();
                olFeat.setStyle(displayNoneStyle);
            }
            $.when(self.getLayer()).then(function (olLayer) {
                self.parent.map.$events.trigger($.Event(TC.Consts.event.VECTORUPDATE, { layer: self.parent }));
            });
        }
    };

    TC.wrap.layer.Vector.prototype.findFeature = function (values) {
        // TODO: añadir ol.animation.zoom
    };

    TC.wrap.layer.Vector.prototype.sendTransaction = function (inserts, updates, deletes) {
        var self = this;
        var result = $.Deferred();

        var getNativeFeature = function (feat) {
            return feat.wrap.feature;
        };
        var olInserts = $.map(inserts, getNativeFeature);
        var olUpdates = $.map(updates, getNativeFeature);
        var olDeletes = $.map(deletes, getNativeFeature);
        if (inserts.length || updates.length || deletes.length) {
            $.when(self.getLayer()).then(function (olLayer) {
                var source = olLayer.getSource();
                var format = new ol.format.WFS();
                var options = self.parent.options;
                var $transaction = $(format.writeTransaction(olInserts, olUpdates, olDeletes, {
                    featurePrefix: options.featurePrefix,
                    featureNS: options.featureNS,
                    featureType: options.featureType[0]
                }));
                if (options.featurePrefix && options.featureNS) {
                    $transaction.attr('xmlns:' + options.featurePrefix, options.featureNS);
                }
                var ajaxOptions = {
                    url: self.parent.url,
                    type: 'POST',
                    contentType: TC.Consts.mimeType.XML,
                    processData: false,
                    data: $('<div>').append($transaction).html(),
                };
                $.ajax(ajaxOptions).done(function (data) {
                    result.resolve(self.parent);
                }).fail(function () {
                    result.reject(self.parent);
                });
            });
        }
        else {
            result.resolve(self.parent);
        }
        return result;
    };

    TC.wrap.layer.Vector.prototype.sendTransaction = function (inserts, updates, deletes) {
        var self = this;
        var result = $.Deferred();

        var getNativeFeature = function (feat) {
            return feat.wrap.feature;
        };
        var olInserts = $.map(inserts, getNativeFeature);
        var olUpdates = $.map(updates, getNativeFeature);
        var olDeletes = $.map(deletes, getNativeFeature);
        $.when(self.getLayer()).then(function (olLayer) {
            var source = olLayer.getSource();
            var format = new ol.format.WFS();
            var ajaxOptions = {
                url: self.parent.url,
                type: 'POST',
                contentType: TC.Consts.mimeType.XML,
                processData: false,
                data: $('<div>').append(format.writeTransaction(olInserts, olUpdates, olDeletes, {
                    featurePrefix: self.parent.options.featurePrefix,
                    featureType: self.parent.options.featureType[0]
                })).html(),
            };
            $.ajax(ajaxOptions).done(function (data) {
                result.resolve();
            }).fail(function () {
                result.reject();
            });
        });
        return result;
    };

    TC.wrap.layer.Vector.prototype.setDraggable = function (draggable, onend, onstart) {
        var self = this;

        //tiene que estar a nivel de control para poder retirarla después
        //var interaction;
        $.when(self.parent.map.wrap.getMap(), self.getLayer()).then(function (olMap, olLayer) {
            if (draggable) {
                var interactionOptions = {};
                if ($.isFunction(onend)) {
                    interactionOptions.handleUpEvent = function (e) {
                        if (this.feature_) {
                            onend(this.feature_._wrap.parent, e.pixel);
                        }
                        var result = ol.interaction.Drag.prototype.handleUpEvent.call(this, e);
                        return result;
                    };
                }
                if ($.isFunction(onstart)) {
                    interactionOptions.handleDownEvent = function (e) {
                        var result = ol.interaction.Drag.prototype.handleDownEvent.call(this, e);
                        if (this.feature_) {
                            onstart(this.feature_._wrap.parent, e.pixel);
                        }
                        return result;
                    };
                }
                self.interaction = new ol.interaction.Drag(interactionOptions);
                olMap.addInteraction(self.interaction);
            }
            else if (self.interaction) {
                olMap.removeInteraction(self.interaction);
            }
        });
    };

    TC.wrap.control.Click.prototype.register = function (map) {
        var self = this;

        self._trigger = function (e) {
            var featureCount = 0;
            map.wrap.map.forEachFeatureAtPixel(e.pixel,
                function (feature, layer) {
                    if (feature._wrap && feature._wrap.parent.showsPopup) {
                        featureCount++;
                    }
                });
            if (!featureCount) {
                // GLS: lanzo el evento click, para que los controles que no pueden heredar de click y definir un callback pueda suscribirse al evento
                self.parent.map.$events.trigger($.Event(TC.Consts.event.CLICK, { coordinate: e.coordinate, pixel: e.pixel }));
                self.parent.callback(e.coordinate, e.pixel);
            }
            // Seguimos adelante si no se han pinchado featuers
            return featureCount === 0;
        };
    };

    TC.wrap.control.Click.prototype.activate = function () {
        var self = this;

        $.when(self.parent.map.wrap.getMap()).then(function (olMap) {
            olMap.on(ol.MapBrowserEvent.EventType.SINGLECLICK, self._trigger);
        });
    };

    TC.wrap.control.Click.prototype.deactivate = function () {
        var self = this;

        $.when(self.parent.map.wrap.getMap()).then(function (olMap) {
            olMap.un(ol.MapBrowserEvent.EventType.SINGLECLICK, self._trigger);
        });
    };

    TC.wrap.control.ScaleBar.prototype.render = function () {
        var self = this;
        if (!self.ctl) {
            self.ctl = new ol.control.ScaleLine({ target: self.parent.div });
        }
        else {
            self.ctl.updateElement_();
        }
    };

    TC.wrap.control.NavBar.prototype.register = function (map) {
        var self = this;
        $.when(map.wrap.getMap()).then(function (olMap) {
            var div = self.parent.div;
            self.zCtl = new ol.control.Zoom({ target: div });
            self.zsCtl = new ol.control.ZoomSlider({ target: div });
            self.z2eCtl = new ol.control.ZoomToExtent({ target: div, extent: map.options.initialExtent, tipLabel: '' });

            olMap.addControl(self.zCtl);
            olMap.addControl(self.zsCtl);
            olMap.addControl(self.z2eCtl);

            var $div = self.parent._$div;
            $buttons = $div.find('button').addClass('tc-ctl-btn ' + self.parent.CLASS + '-btn').css('display', 'block').html('');
            $buttons.filter('.ol-zoom-in').addClass(self.parent.CLASS + '-btn-zoomin').attr('title', self.parent.getLocaleString('zoomIn'));
            $buttons.filter('.ol-zoom-out').addClass(self.parent.CLASS + '-btn-zoomout').attr('title', self.parent.getLocaleString('zoomOut'));

            $div.find('.ol-zoom-extent button').addClass(self.parent.CLASS + '-btn-home').attr('title', self.parent.getLocaleString('zoomToInitialExtent'));

            $(map.div).find('.ol-zoomslider').addClass(self.parent.CLASS + '-bar').find('.ol-zoomslider-thumb').addClass(self.parent.CLASS + '-slider');

            map.on(TC.Consts.event.BASELAYERCHANGE, $.proxy(self.refresh, self));
        });
    };

    TC.wrap.control.NavBar.prototype.refresh = function () {
        /*
        var map = this.parent.map;
        var olMap = map.wrap.map;

        olMap.removeControl(self.zsCtl);
        var res = map.getResolutions();
        self.zsCtl = new ol.control.ZoomSlider(
            {
                target: this.parent.div,
                "maxResolution": res[0],
                "minResolution": res[res.length - 1]
            });

        olMap.addControl(self.zsCtl);
        $(map.div).find('.ol-zoomslider').addClass(self.parent.CLASS + '-bar').find('.ol-zoomslider-thumb').addClass(self.parent.CLASS + '-slider');
        */
        var self = this;
        var map = self.parent.map.wrap.map;
        // Puede ser que se llame a refresh antes de que esté inicializado ol.control.ZoomSlider. En ese caso llamamos a render que lo inicializa.
        // Como render necesita un ol.MapEvent, esperamos al evento POSTRENDER.
        if (self.zsCtl.sliderInitialized_) {
            var res = map.getView().getResolution();
            self.zsCtl.setThumbPosition_(res);
        }
        else {
            map.once(ol.MapEventType.POSTRENDER, function (e) {
                self.zsCtl.render(e);
            });
        }
    };


    TC.wrap.control.Coordinates.prototype.register = function (map) {
        var self = this;
        var result = new $.Deferred();
        $.when(map.wrap.getMap()).then(function (olMap) {
            var projection = olMap.getView().getProjection();
            self.parent.crs = projection.getCode();
            self.parent.units = projection.getUnits();
            self.parent.isGeo = self.parent.units === ol.proj.Units.DEGREES;

            var viewport = olMap.getViewport();
            $(viewport).add(self.parent.div)
                .on(MOUSEMOVE + '.coords', function (e) {

                    var position = goog.style.getRelativePosition(e, viewport);
                    var coords = olMap.getCoordinateFromPixel([position.x, position.y]);
                    if (self.parent.isGeo) {
                        self.parent.latLon = coords.reverse();
                    }
                    else {
                        self.parent.xy = coords;
                    }
                    self.parent.update.apply(self.parent, arguments);

                })
                .on(MOUSEOUT, function (e) {

                    self.parent.clear.apply(self.parent, arguments);
                });

            result.resolve();
        });
        return result;
    };

    TC.wrap.control.Geolocation.prototype.register = function (map) {
        var self = this;
        self.map = map;

        self._coordsTrigger = function (e) {
            self.parent.coordsToClick(e);
        };

        self._cleanCoordsTrigger = function (e) {
            self.parent.cleanCoordsPointer(e);
        };

        self._postcomposeTrigger = function (e) {
            self.duringTrackSnap(e);
        };

        self._snapTrigger = function (e) {
            if (e.dragging)
                return;

            self.initSnap(self.olMap.getEventCoordinate(e.originalEvent));
        };

        $.when(map.wrap.getMap()).then(function (olMap) {
            self.olMap = olMap;
        });
    };

    TC.wrap.control.Geolocation.prototype.hasCoordinates = function () {
        var self = this;

        return self.trackData && self.trackData.trackFeature && self.trackData.trackFeature.getGeometry().getCoordinates().length >= 1;
    };

    TC.wrap.control.Geolocation.prototype.getTooltip = function (coordinates, d) {
        var self = this;

        $(self.parent.track.htmlElevationMarker).show();

        if (!self.parent.elevationMarker)
            self.parent.elevationMarker = new ol.Overlay({
                element: self.parent.track.htmlElevationMarker,
                offset: [0, -11],
                positioning: ol.OverlayPositioning.CENTER_CENTER,
                stopEvent: false
            });

        self.olMap.addOverlay(self.parent.elevationMarker);
        self.parent.elevationMarker.setPosition(coordinates[d[0].index]);

        return '<div class="track-elevation-tooltip"><span>' + d[0].value + 'm </span><br><span>' + (d[0].x).toFixed(2) + 'km </span><div/>';
    };

    TC.wrap.control.Geolocation.prototype.addWaypoint = function (position, properties) {
        var self = this;

        var waypoint = new ol.Feature({
            geometry: new ol.geom.Point([position[0], position[1], properties.ele, properties.time], ('XYZM'))
        });
        waypoint.setProperties(properties);

        self.parent.layer.wrap.layer.getSource().addFeature(waypoint);
    };

    var trackingStyleFN = function (feature, resolution) {
        var geometry = feature.getGeometry();
        var type = geometry.getType().toLowerCase();

        var styles = [
          new ol.style.Style({
              stroke: new ol.style.Stroke({
                  width: 3,
                  color: 'rgba(197, 39, 55, 1)',
                  lineDash: [0, 6]
              })
          })
        ];

        if (type == 'point') {
            var createTextStyle = function (feature, resolution) {
                var align = 'center';
                var baseline = 'middle';
                var size = '10px';
                var offsetX = parseInt(0, 10);
                var offsetY = parseInt(0, 10);
                var weight = "bold";
                var rotation = parseFloat(0);
                var font = weight + ' ' + size + ' ' + "Arial";
                var fillColor = "rgba(197, 39, 55, 1)";
                var outlineColor = "#ffffff";
                var outlineWidth = parseInt(3, 10);

                return new ol.style.Text({
                    textAlign: align,
                    textBaseline: baseline,
                    font: font,
                    text: feature.get('name'),
                    fill: new ol.style.Fill({ color: fillColor }),
                    stroke: new ol.style.Stroke({ color: outlineColor, width: outlineWidth }),
                    offsetX: offsetX,
                    offsetY: offsetY,
                    rotation: rotation
                });
            };
            var text = createTextStyle(feature, resolution);
            styles.push(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({ color: 'rgba(197, 39, 55, 1)' }),
                    stroke: new ol.style.Stroke({ color: 'rgba(0, 0, 0, 1)', width: 1 })
                }),
                text: text
            }));
        }

        if (!feature.get('tracking') && type.indexOf('linestring') > -1) {
            var initTracking = geometry.getFirstCoordinate();
            styles.push(new ol.style.Style({
                geometry: new ol.geom.Point(initTracking),
                image: new ol.style.Icon({
                    anchor: [0.5, 1],
                    src: TC.Util.getPointIconUrl({
                        cssClass: 'tc-ctl-geolocation-track-marker-icon'
                    })
                })
            }));

            var lastTracking = geometry.getLastCoordinate();
            styles.push(new ol.style.Style({
                geometry: new ol.geom.Point(lastTracking),
                image: new ol.style.Icon(({
                    anchor: [0.5, 1],
                    src: TC.Util.getPointIconUrl({
                        cssClass: 'tc-ctl-geolocation-track-marker-icon-end'
                    })
                }))
            }));
        }

        return styles;
    };
    TC.wrap.control.Geolocation.prototype.addPosition = function (position, heading, m, speed, accuracy, altitudeAccuracy, altitude) {
        var self = this;

        var x = Math.round(position[0]);
        var y = Math.round(position[1]);

        if (self.trackData && self.trackData.trackFeature) {
            var last = self.trackData.trackFeature.getGeometry().getLastCoordinate();
            if (last && last.length == 0)
                self.trackData.trackFeature.getGeometry().appendCoordinate([x, y, heading, m]);
            else {
                var lx = Math.round(last[0]);
                var ly = Math.round(last[1]);

                if (x != lx && y != ly)
                    self.trackData.trackFeature.getGeometry().appendCoordinate([x, y, heading, m]);
            }
        }

        self.parent.$events.trigger($.Event(self.parent.Const.Event.STATEUPDATED, {
            moving: (heading != undefined && speed != undefined && speed > 0 && heading > 0)
        }));
    };

    TC.wrap.control.Geolocation.prototype.positionChangehandler = function (geoposition) {
        var self = this;

        if (self.trackData && self.trackData.trackFeature) {
            var position_ = [geoposition.coords.longitude, geoposition.coords.latitude];
            var projectedPosition = TC.Util.reproject(position_, 'EPSG:4326', self.parent.map.crs);

            self.olMap.getView().setCenter(projectedPosition);
            //self.map.wrap.map.getView().setZoom(12);
            self.marker.setPosition(projectedPosition);

            var accuracy = geoposition.coords.accuracy;
            var heading = geoposition.coords.heading || 0;
            var speed = geoposition.coords.speed || 0;
            var altitude = geoposition.coords.altitude || 0;
            var altitudeAccuracy = geoposition.coords.altitudeAccuracy || 0;

            // GLS: lo quito ya que hemos actualizado la función que gestiona la fechas para la exportación a GPX - espera la fecha en segundos (/ 1000)
            self.addPosition(projectedPosition, heading, new Date().getTime() /*geoposition.timestamp*/, speed, accuracy, altitudeAccuracy, altitude);

            var coords = self.trackData.trackFeature.getGeometry().getCoordinates();
            var len = coords.length;
            if (len >= 2) {
                self.parent.deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
            }

            self.parent.$events.trigger($.Event(self.parent.Const.Event.POSITIONCHANGE, {
                pd: {
                    "position": [projectedPosition[0].toFixed(2), projectedPosition[1].toFixed(2)],
                    "accuracy": accuracy,
                    "heading": Math.round(TC.Util.radToDeg(heading)),
                    "speed": (speed * 3.6).toFixed(1)
                }
            }));
        }
    };

    TC.wrap.control.Geolocation.prototype.setTracking = function (tracking) {
        var self = this;

        if (tracking) {
            self.trackData = {};
            var sessionwaypoint = [];

            if (self.parent.sessionTracking) {
                var _sessionTracking = (new ol.format.GeoJSON()).readFeatures(self.parent.sessionTracking);

                for (var i = 0; i < _sessionTracking.length; i++) {
                    var type = _sessionTracking[i].getGeometry().getType().toLowerCase();

                    if (type == 'point')
                        sessionwaypoint.push(_sessionTracking[i]);
                    else if (type == 'linestring') {
                        self.trackData.trackFeature = _sessionTracking[i];
                        //self.trackData.trackFeature.setProperties({ 'tracking': true });
                    }
                }

                // qué pasa cuando quiera añadir un nuevo segmento ¿? añado nuevo lineString equivalente a segmento pero dónde¿?
                // lo que hay en session lo añado como feature a la capa y creo un nuevo linestring que será el nuevo segmento
                // y lo referencio a self.trackData.trackFeature
            }
            else {
                self.hackPos = 0;

                self.trackData.trackFeature = new ol.Feature({
                    geometry: new ol.geom.LineString([], ('XYZM')),
                    tracking: true
                });
            }

            self.parent.layer.wrap.layer.setSource(new ol.source.Vector({
                features: [self.trackData.trackFeature]
            }));

            if (sessionwaypoint.length > 0) {
                self.parent.layer.wrap.addFeatures(sessionwaypoint);
            }

            self.parent.layer.wrap.layer.setStyle(trackingStyleFN);

            if (!self.marker)
                self.marker = new ol.Overlay({
                    element: self.parent.track.htmlMarker,
                    positioning: ol.OverlayPositioning.CENTER_CENTER,
                    stopEvent: false
                });

            self.olMap.addOverlay(self.marker);

            if (self.marker.getMap() == undefined)
                self.marker.setMap(self.olMap);

            if (self.trackData.trackFeature.getGeometry().getCoordinates().length > 1)
                self.parent.map.setExtent(self.parent.layer.wrap.layer.getSource().getExtent());
            else
                self.olMap.getView().setZoom(8);

            function setGeolocation() {
                self.geolocation = window.navigator.geolocation.watchPosition(
                    $.proxy(self.positionChangehandler, self),
                    $.proxy(self.parent.onGeolocateError, self.parent),
                        { maximumAge: 250, enableHighAccuracy: true }
                );

                window.setTimeout(function () {
                    window.navigator.geolocation.clearWatch(self.geolocation);
                }, 5000);
            };

            //setGeolocation();

            if (!self.hackPos)
                self.hackPos = 0;

            var getHackPositions = function () {
                return [[-1.03481995, 42.95127938, 1412.4882],
                                [-1.03658820, 42.95190819, 1428.1757],
                                [-1.03835645, 42.95118953, 1447.0234],
                                [-1.04111929, 42.95136915, 1449.8085],
                                [-1.04233492, 42.95307596, 1455.2500],
                                [-1.04465578, 42.95487262, 1461.3906],
                                [-1.04863425, 42.95424381, 1491.0742],
                                [-1.05172868, 42.95289633, 1490.0078],
                                [-1.05482311, 42.95253700, 1514.4492],
                                [-1.05791755, 42.95118953, 1510.8437],
                                [-1.06090142, 42.95307596, 1499.7109],
                                [-1.06510100, 42.95226752, 1485.0156],
                                [-1.06642719, 42.95289633, 1489.3593],
                                [-1.06963209, 42.95280648, 1468.5429],
                                [-1.07383168, 42.95487262, 1455.5859],
                                [-1.07692603, 42.95460314, 1450.9375],
                                [-1.07869427, 42.95693876, 1447.6562],
                                [-1.08278330, 42.95711838, 1430.3906],
                                [-1.08731447, 42.95604038, 1437.6210],
                                [-1.09074041, 42.95613024, 1439.1601],
                                [-1.09737125, 42.95622009, 1467.5937],
                                [-1.09913949, 42.95711838, 1459.0156],
                                [-1.10212345, 42.95702861, 1437.5820],
                                [-1.10271873, 42.95857247, 1409.4301],
                                [-1.10196143, 42.95911327, 1385.8776],
                                [-1.11011853, 42.96344856, 1324.3535],
                                [-1.11007612, 42.96639673, 1282.0554],
                                [-1.11102218, 42.96848139, 1246.9672],
                                [-1.11010235, 42.97158513, 1207.5532],
                                [-1.10723021, 42.97597087, 1168.6198],
                                [-1.11045699, 42.97394212, 1156.1225],
                                [-1.11346224, 42.97441964, 1143.1447],
                                [-1.11406020, 42.97346066, 1134.4931],
                                [-1.11582116, 42.97307996, 1125.8410],
                                [-1.11509738, 42.97169577, 1119.5927],
                                [-1.11789492, 42.97216373, 1100.3664],
                                [-1.11734792, 42.97275868, 1092.1950],
                                [-1.11801076, 42.97390004, 1085.9465],
                                [-1.11669774, 42.97533025, 1074.8913],
                                [-1.11962126, 42.97388755, 1056.6262],
                                [-1.11833875, 42.97601220, 1035.9577],
                                [-1.11897460, 42.97730125, 1029.2285],
                                [-1.12458544, 42.97913672, 1008.5603],
                                [-1.12712432, 42.97828554, 996.06323],
                                [-1.12817491, 42.98009435, 994.14062],
                                [-1.13297757, 42.98074487, 976.35620],
                                [-1.13464733, 42.98259576, 958.09130],
                                [-1.13600369, 42.98234707, 948.95849],
                                [-1.14072983, 42.98392329, 916.75439],
                                [-1.14004301, 42.98470733, 904.73779],
                                [-1.14141236, 42.98474622, 893.68286],
                                [-1.14122989, 42.98565767, 884.55029],
                                [-1.14262657, 42.98545072, 875.89819],
                                [-1.14239095, 42.98465771, 867.24658],
                                [-1.14498155, 42.98490774, 870.13037],
                                [-1.14579359, 42.98547436, 853.53906],
                                [-1.14606742, 42.98619076, 867.24658],
                                [-1.14908348, 42.98651430, 871.09179],
                                [-1.15154592, 42.98502970, 857.02734],
                                [-1.15304712, 42.98450198, 881.18579],
                                [-1.15559119, 42.98490297, 862.92065],
                                [-1.15740210, 42.98428195, 834.08105],
                                [-1.15758994, 42.98520396, 834.08105],
                                [-1.15887723, 42.98520086, 837.44555],
                                [-1.15753621, 42.98634147, 852.34594],
                                [-1.15948257, 42.98742667, 817.21484],
                                [-1.15975465, 42.98823117, 840.81005],
                                [-1.15936649, 42.98921881, 818.01171],
                                [-1.15843559, 42.98994300, 840.32958],
                                [-1.15573704, 42.99051834, 840.81005],
                                [-1.15294125, 42.98889543, 858.59448],
                                [-1.15182520, 42.99041775, 860.99804],
                                [-1.15183057, 42.99122661, 858.11401],
                                [-1.15052098, 42.99093014, 848.89062],
                                [-1.14957609, 42.99132090, 849.51953],
                                [-1.14933393, 42.99172751, 858.59448],
                                [-1.14862265, 42.99293333, 849.94287],
                                [-1.14935078, 42.99382860, 845.61694],
                                [-1.14849851, 42.99390781, 831.10156],
                                [-1.14891299, 42.99433898, 829.68750],
                                [-1.14829961, 42.99460854, 828.29687],
                                [-1.14796810, 42.99664316, 843.69409],
                                [-1.14737131, 42.99755947, 832.87890],
                                [-1.14758681, 42.99851618, 846.09765],
                                [-1.14699002, 42.99838140, 833.04296],
                                [-1.14660873, 42.99866437, 850.42358],
                                [-1.14650923, 42.99951329, 841.58593],
                                [-1.14667922, 43.00027563, 848.50073],
                                [-1.14555093, 43.00125212, 843.21337],
                                [-1.14557842, 43.00325548, 846.57836],
                                [-1.14397295, 43.00437748, 827.28906],
                                [-1.14223237, 43.00662777, 817.17968],
                                [-1.13933382, 43.00942908, 862.92065],
                                [-1.13379112, 43.00806174, 870.61108],
                                [-1.13110992, 43.00881654, 869.64990],
                                [-1.12914771, 43.00793794, 864.42187],
                                [-1.12682685, 43.00819401, 870.89843],
                                [-1.12490396, 43.00784365, 885.03100],
                                [-1.12522708, 43.00755791, 898.48925],
                                [-1.11829591, 43.00310477, 1024.9028],
                                [-1.11280702, 43.00307803, 1071.5266],
                                [-1.11036974, 43.00386182, 1085.4658],
                                [-1.10873728, 43.00213800, 1067.2006],
                                [-1.10874608, 43.00356024, 1046.5324],
                                [-1.10728888, 43.00368036, 1022.9802],
                                [-1.10463408, 43.00008988, 954.24584],
                                [-1.10322517, 42.99938153, 932.13549],
                                [-1.10241833, 43.00019885, 922.52221],
                                [-1.10174660, 42.99973550, 898.48925],
                                [-1.10393193, 42.99502462, 881.66625],
                                [-1.10227206, 42.99306702, 891.27929],
                                [-1.10482544, 42.99122342, 872.05297],
                                [-1.10664767, 42.98904991, 867.24658],
                                [-1.10623897, 42.98856628, 866.28515],
                                [-1.10683249, 42.98880072, 867.72705],
                                [-1.10551066, 42.98846963, 870.13037],
                                [-1.10290104, 42.99049822, 910.50585],
                                [-1.10086281, 42.98985290, 901.85400],
                                [-1.09812998, 42.98751485, 911.94799],
                                [-1.09800986, 42.98606403, 923.48364],
                                [-1.09675970, 42.98626209, 923.96411],
                                [-1.09679281, 42.98488394, 953.28442],
                                [-1.09779135, 42.98400174, 981.16284],
                                [-1.09603878, 42.98321418, 1006.6376],
                                [-1.09615931, 42.98176025, 1046.5324],
                                [-1.09496128, 42.98019695, 1094.1176],
                                [-1.09073261, 42.97909129, 1135.9350],
                                [-1.08798502, 42.97746377, 1165.7360],
                                [-1.08430302, 42.97778950, 1167.6584],
                                [-1.08167236, 42.97923169, 1129.6862],
                                [-1.07955006, 42.97732011, 1114.3051],
                                [-1.07745492, 42.97913010, 1106.6147],
                                [-1.07706164, 42.98056684, 1092.6757],
                                [-1.07654364, 42.97799971, 1060.9521],
                                [-1.07700943, 42.97555413, 1018.6540],
                                [-1.07616269, 42.97481903, 1004.7150],
                                [-1.07572481, 42.97206164, 1010.4829],
                                [-1.07116288, 42.97180415, 985.96923],
                                [-1.06859626, 42.97242080, 996.06323],
                                [-1.06342462, 42.97152536, 1002.3115],
                                [-1.05926955, 42.97332965, 1007.5991],
                                [-1.05688783, 42.97329529, 1015.7702],
                                [-1.05108210, 42.97053328, 1024.9028],
                                [-1.04871002, 42.97104885, 1033.0737],
                                [-1.04717312, 42.97279153, 1032.1125],
                                [-1.04740966, 42.97094198, 1043.1677],
                                [-1.04565817, 42.97053865, 1045.5710],
                                [-1.04248462, 42.97157331, 1042.6872],
                                [-1.03900613, 42.96819674, 1061.9135],
                                [-1.03500360, 42.96719393, 1071.0461],
                                [-1.03341456, 42.96595970, 1069.1235],
                                [-1.03147692, 42.96610412, 1074.8913],
                                [-1.02343515, 42.96390026, 1102.2888],
                                [-1.02033787, 42.96637510, 1116.2280],
                                [-1.02078387, 42.96465346, 1134.4931],
                                [-1.01715870, 42.96485379, 1162.3710],
                                [-1.01233256, 42.96349542, 1193.1333],
                                [-1.01666551, 42.96194518, 1227.2602],
                                [-1.01419217, 42.96001617, 1250.8125],
                                [-1.01477136, 42.95819646, 1269.5583],
                                [-1.01765315, 42.95760914, 1289.2651],
                                [-1.02084271, 42.95815581, 1310.4143],
                                [-1.01785951, 42.95657976, 1332.5246],
                                [-1.01498275, 42.95620123, 1347.9057],
                                [-1.02199707, 42.95649209, 1377.2260],
                                [-1.02398810, 42.95479249, 1396.4523],
                                [-1.02841710, 42.95340738, 1421.0742],
                                [-1.03141464, 42.95182655, 1417.6010],
                                [-1.03465684, 42.95135918, 1420.9660]];
            };
            var hackPositions = getHackPositions();

            var _pos = {
                coords: {
                }
            };
            _pos.coords.longitude = hackPositions[self.hackPos][0];
            _pos.coords.latitude = hackPositions[self.hackPos][1];
            _pos.coords.heading = hackPositions[self.hackPos][2];
            _pos.coords.accuracy = 50;

            self.hackPos++;

            self.positionChangehandler(_pos);

            // obtengo nueva posición
            //self.geoInterval = window.setInterval(function () {                    
            //    setGeolocation();
            //}, 900);

            self.geoInterval = window.setInterval(function () {
                if (!self.parent.pause.paused && self.hackPos < hackPositions.length) {
                    var _pos = {
                        coords: {
                        }
                    };
                    _pos.coords.longitude = hackPositions[self.hackPos][0];
                    _pos.coords.latitude = hackPositions[self.hackPos][1];
                    _pos.coords.heading = hackPositions[self.hackPos][2];
                    _pos.coords.accuracy = 50;

                    self.hackPos++;

                    self.positionChangehandler(_pos);
                }
            }, 2000);

        } else {

            self.currenTracking = false;

            clearInterval(self.geoInterval);
            window.navigator.geolocation.clearWatch(self.geolocation);

            delete self.trackData;
            self.olMap.removeOverlay(self.marker);
        }
    };

    TC.wrap.control.Geolocation.prototype.getLineStringTrack = function () {
        var self = this;

        var vectorLayerSrc = self.parent.layer.wrap.layer.getSource();
        return vectorLayerSrc.forEachFeature(function (f) {
            if (f.getGeometry().getType().toLowerCase().indexOf('linestring') > -1)
                return f;
        });

        return null;
    };

    TC.wrap.control.Geolocation.prototype.clear = function () {
        var self = this;

        if (self.parent.layer && self.parent.layer.wrap.layer) {
            self.parent.layer.wrap.layer.getSource().clear();
        }

        $.when(self.parent.map.wrap.getMap()).then(function (olMap) {
            olMap.un([ol.MapBrowserEvent.EventType.POINTERMOVE, ol.MapBrowserEvent.EventType.SINGLECLICK], self._snapTrigger);
            olMap.un(ol.render.EventType.POSTCOMPOSE, self._postcomposeTrigger);

            if (self.snapInfo) {
                olMap.removeOverlay(self.snapInfo);
            }

            if (self.snapInfoElement) {
                self.snapInfoElement.style.display = 'none';
            }
        });
    };

    TC.wrap.control.Geolocation.prototype.duringTrackSnap = function (e) {
        var self = this;

        var vectorContext = e.vectorContext;
        if (self.snapPoint) {
            vectorContext.setImageStyle(new ol.style.Circle({
                radius: 1,
                fill: new ol.style.Fill({
                    color: 'rgba(197, 39, 55, 1)'
                })
            }));
            vectorContext.drawPointGeometry(self.snapPoint);
        }
        if (self.snapLine) {
            vectorContext.setFillStrokeStyle(null, new ol.style.Stroke({
                color: 'rgba(197, 39, 55, 1)',
                width: 1
            }));
            vectorContext.drawLineStringGeometry(self.snapLine);
        }
    };

    TC.wrap.control.Geolocation.prototype.initSnap = function (coordinate) {
        var self = this;

        var vectorSource = self.parent.layer.wrap.layer.getSource();
        var closestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate);

        if (closestFeature !== null) {
            var geometry = closestFeature.getGeometry();
            var closestPoint = geometry.getClosestPoint(coordinate);

            if (!self.snapPoint) self.snapPoint = new ol.geom.Point(closestPoint);
            else self.snapPoint.setCoordinates(closestPoint);

            var coordinates = [coordinate, [closestPoint[0], closestPoint[1]]];
            if (!self.snapLine) self.snapLine = new ol.geom.LineString(coordinates);
            else self.snapLine.setCoordinates(coordinates);


            // información del punto
            if (!self.snapInfoElement)
                self.snapInfoElement = document.getElementsByClassName('tc-ctl-geolocation-track-snap-info')[0];


            self.snapInfoElement.style.display = 'block';

            if (!self.snapInfo) {
                self.snapInfo = new ol.Overlay({
                    element: self.snapInfoElement
                });

                self.olMap.addOverlay(self.snapInfo);
            }

            if (self.snapInfo.getMap() == undefined)
                self.snapInfo.setMap(self.olMap);

            self.snapInfo.setPosition(coordinate);

            var data = {};
            if (closestFeature.getGeometry().getType() != "LineString") {
                if (closestFeature.getKeys().indexOf('name') > -1)
                    data.n = closestFeature.get('name');
            }

            var locale = self.parent.map.options.locale && self.parent.map.options.locale.replace('_', '-') || undefined;
            data.x = locale == 'eu-ES' ? Math.round(closestPoint[0]).toLocaleString(locale).replace(/\,/g, '.') : Math.round(closestPoint[0]).toLocaleString(locale);
            data.y = locale == 'eu-ES' ? Math.round(closestPoint[1]).toLocaleString(locale).replace(/\,/g, '.') : Math.round(closestPoint[1]).toLocaleString(locale);
            data.z = closestPoint.length == 3 ? Math.round(closestPoint[2]) : undefined;
            data.m = closestPoint.length == 4 && closestPoint[3] > 0 ? new Date(closestPoint[3]).toLocaleString(locale) : undefined;

            if (data) {
                self.parent.getRenderedHtml(self.parent.CLASS + '-track-snapping-node', data, function (html) {
                    self.snapInfoElement.innerHTML = html;
                });
            }
        }

        self.olMap.render();
    };

    TC.wrap.control.Geolocation.prototype.drawTrackingData = function (geoJSON) {
        var self = this;

        var src = self.parent.layer.wrap.layer;
        if (src) {
            src.setSource(new ol.source.Vector({
                features: (new ol.format.GeoJSON()).readFeatures(geoJSON)
            }));

            src.setStyle(trackingStyleFN);

            self.parent.map.setExtent(src.getSource().getExtent());

            self.olMap.on([ol.MapBrowserEvent.EventType.POINTERMOVE, ol.MapBrowserEvent.EventType.SINGLECLICK], self._snapTrigger);
            self.olMap.on(ol.render.EventType.POSTCOMPOSE, self._postcomposeTrigger);
        }
    };

    TC.wrap.control.Geolocation.prototype.toGeoJSON = function () {
        var self = this;

        var parser = new TC.wrap.parser.JSON();
        parser = parser.parser;

        var features = self.parent.layer.wrap.layer.getSource().getFeatures();

        if (arguments && arguments[0]) {
            for (var i = 0; i < features.length; i++) {
                if (features[i].get('tracking'))
                    features[i].set('tracking', false);
            }
        }

        return parser.writeFeatures(features);
    };

    TC.wrap.control.Geolocation.prototype.export = function (type, li) {
        var self = this;
        var done = new $.Deferred();
        var features = [];

        self.parent.getTrackingData(li).then(function (data) {
            if (data) {

                var src = new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(data)
                })

                if (src.getFeatures().length > 0) {
                    src.forEachFeature(function (feature) {
                        var clone = feature.clone();
                        clone.getGeometry().transform(self.parent.map.crs, 'EPSG:4326');
                        if (clone.getGeometry().getType().toLowerCase() == 'linestring') {
                            var track = new ol.geom.MultiLineString([], clone.getGeometry().getLayout());
                            track.appendLineString(clone.getGeometry());
                            features.push(new ol.Feature({
                                geometry: track
                            }));
                        }
                        else features.push(clone);
                    });
                }
                else {
                    var geoJSON = self.parent.getTrackingData(li);

                    var exportSrc = new ol.source.Vector({
                        features: (new ol.format.GeoJSON()).readFeatures(geoJSON)
                    });

                    exportSrc.forEachFeature(function (feature) {
                        var clone = feature.clone();
                        clone.getGeometry().transform(self.parent.map.crs, 'EPSG:4326');
                        if (clone.getGeometry().getType().toLowerCase() == 'linestring') {
                            var track = new ol.geom.MultiLineString([], clone.getGeometry().getLayout());
                            track.appendLineString(clone.getGeometry());
                            features.push(new ol.Feature({
                                geometry: track
                            }));
                        }
                        else features.push(clone);
                    });
                }
            }

            switch (type) {
                case 'GPX':
                    done.resolve(features ? new ol.format.GPX().writeFeatures(features) : null);
                    break;
                case 'KML':
                    done.resolve(features ? new ol.format.KML().writeFeatures(features) : null);
                    break;
            }
        });

        return done;
    };

    TC.wrap.control.Geolocation.prototype.import = function (wait, base64encodedData, type) {
        var self = this;

        var vectorSource = new ol.source.Vector({
            projection: ol.proj.get(self.parent.map.crs), //proj4(self.parent.map.crs),
            url: base64encodedData,
            format: type.toUpperCase() == 'GPX' ? new ol.format.GPX() : new ol.format.KML()
        });

        var listenerKey = vectorSource.on('change', function (e) {
            if (vectorSource.getState() == 'ready') {

                ol.Observable.unByKey(listenerKey);

                var toAdd = [];
                var toRemove = [];
                // los lineString como features 
                vectorSource.forEachFeature(function (feature) {
                    if (feature.getGeometry() instanceof ol.geom.MultiLineString) {
                        var clone = feature.clone();
                        var ls = clone.getGeometry().getLineStrings();

                        for (var i = 0; i < ls.length; i++) {
                            var f = new ol.Feature({
                                geometry: ls[i]
                            });
                            f.setProperties(ls[i].getProperties());

                            toAdd.push(f);
                        }

                        toRemove.push(feature);
                    }
                });

                if (toAdd.length > 0) {
                    for (var i = 0; i < toAdd.length; i++)
                        vectorSource.addFeature(toAdd[i]);
                }

                // eliminamos las features de tipo MultiLineString, han sido sustituidas por LineString
                if (toRemove.length > 0)
                    for (var i = 0; i < toRemove.length; i++)
                        vectorSource.removeFeature(toRemove[i]);


                // guardamos el track importado                    
                self.parent.saveMessage = self.parent.getLocaleString("geo.trk.upload.ok");
                self.parent.saveTrack().then(function () {
                    if (self.parent.import.uid) {
                        var li = self.parent.track.$trackList.find('li[data-id="' + self.parent.import.uid + '"]');
                        if (li) {
                            self.parent.drawTrack(li);
                        }

                        delete self.parent.import.uid;
                    }

                    delete self.parent.import.fileName;

                    self.parent.map.setExtent(src.getSource().getExtent());
                    self.parent.getLoadingIndicator().removeWait(wait);
                });
            }
        });

        var src = self.parent.layer.wrap.layer;
        src.setStyle(trackingStyleFN);
        src.setSource(vectorSource);
    };

    TC.wrap.control.Geolocation.prototype.positionSimulatedChangehandler = function (evt) {
        var self = this;

        var position = self.glCtl.getPosition();

        self.olMap.getView().setCenter(position);
        self.marker.setMap(self.olMap);
        self.marker.setPosition(position);
    };

    TC.wrap.control.Geolocation.prototype.simulateTrackEnd = function () {
        var self = this;

        window.clearInterval(self.simulationInterval);

        if (self.marker)
            self.olMap.removeOverlay(self.marker);
    };

    TC.wrap.control.Geolocation.prototype.simulateTrack = function () {
        var self = this;

        var coordinates;

        var coordinates_ = self.getLineStringTrack();
        if (coordinates_)
            coordinates = coordinates_.getGeometry().getCoordinates();

        if (coordinates && coordinates.length > 0) {

            if (!self.marker)
                self.marker = new ol.Overlay({
                    element: self.parent.track.htmlMarker,
                    positioning: ol.OverlayPositioning.CENTER_CENTER,
                    offset: [0, -11],
                    stopEvent: false
                });

            self.olMap.addOverlay(self.marker);


            var first = coordinates.shift();
            if (self.marker) // es posible que el usuario haya parado la simulación borrando el overlay
                self.marker.setPosition(first);

            var prevDate;
            if (first.length == 4) // Si la longitud es 4 tenemos xyzt
                prevDate = first[3];

            function geolocate() {
                if (!self.parent.simulate_paused) {
                    var position = coordinates.shift();

                    if (!position) {
                        self.simulateTrackEnd();
                        var li = self.parent.getSelectedTrack();
                        if (li)
                            self.parent.uiSimulate(false, li);

                        return;
                    }

                    if (self.marker) // es posible que el usuario haya parado la simulación borrando el overlay
                        self.marker.setPosition(position);

                    var newDate;
                    if (first.length == 4) // Si la longitud es 4 tenemos xyzt
                        newDate = position[3];

                    var interval = (newDate && prevDate ? newDate - prevDate : 100) * self.parent.simulate_speed;
                    window.clearInterval(self.simulationInterval);
                    self.simulationInterval = window.setInterval(function () {
                        prevDate = newDate;
                        geolocate();
                    }, interval);
                }
            }
            geolocate();
        }
    };

    TC.wrap.control.Geolocation.prototype.setTrackingSimulated = function (tracking) {
        var self = this;

        if (tracking) {

            if (!self.marker)
                self.marker = new ol.Overlay({
                    element: self.parent.track.htmlMarker,
                    positioning: ol.OverlayPositioning.CENTER_CENTER,
                    offset: [0, -11],
                    stopEvent: false
                });

            self.olMap.addOverlay(self.marker);
            self.marker.setPosition(ol.OverlayPositioning.CENTER_CENTER);

        } else {

            delete self.trackData;
            self.olMap.removeOverlay(self.marker);

            if (self.deviceOrientation) {
                self.deviceOrientation.setTracking(false);
                self.deviceOrientation.un('change:heading', self.headingChangehandler);
                self.deviceOrientation.un(['change:beta', 'change:gamma'], self.orientationChangehandler);
            }
        }
    };

    TC.wrap.control.Geolocation.prototype.headingChangehandler = function (evt) {
        var self = this;
        if (!self.parent.track.$infoOnMap)
            self.parent.track.$infoOnMap = $('<div style="overflow-y: scroll; height: 200px; width: 200px; top: 0; left: 100px; background-color: fuchsia; position: absolute;"></div>').appendTo(self.parent.map._$div);

        self.parent.track.$infoOnMap.show();

        self.parent.track.$infoOnMap.html(self.parent.track.$infoOnMap.html() + '<br> <p> salta headingChangehandler </p>');
        self.parent.track.$infoOnMap.html(self.parent.track.$infoOnMap.html() + '<br> <p> evt.target.getHeading(): ' + evt.target.getHeading() + ' </p>');

        self.heading = evt.target.getHeading();

        $.when(self.map.wrap.getMap()).then(function (map) {
            map.getView().setRotation(-self.heading);
        });

        self.parent.$events.trigger($.Event(self.parent.Const.Event.STATEUPDATED, {
            moving: (heading != undefined && heading > 0)
        }));
    };

    TC.wrap.control.Geolocation.prototype.orientationChangehandler = function (event) {
        var self = this;

        var view = self.map.wrap.map.getView();
        var center = view.getCenter();
        var resolution = view.getResolution();
        var beta = event.target.getBeta() || 0;
        var gamma = event.target.getGamma() || 0;

        center[0] -= resolution * gamma * 25;
        center[1] += resolution * beta * 25;

        view.setCenter(view.constrainCenter(center));

        self.parent.$events.trigger($.Event(self.parent.Const.Event.STATEUPDATED, {
            moving: (heading != undefined && heading > 0)
        }));
    };

    TC.wrap.control.Geolocation.prototype.deactivateCurrentPosition = function () {
        var self = this;

        if (self.overlay) {
            var map = self.overlay.getMap();
            if (map) {
                $('div.tc-ctl-geolocation-circlePulsate').remove();
                map.removeOverlay(self.overlay);
                delete self.overlay;
            }
        }
    };    

    TC.wrap.control.Geolocation.prototype.pulsate = function (circle) {
        var self = this;

        var point = circle.wrap.feature.getGeometry().getCenter();

        var size = circle.wrap.feature.getGeometry().getRadius() / self.olMap.getView().getResolution() * 2;

        if (!self.overlay) {
            var elem = document.createElement('div');
            elem.setAttribute('class', 'tc-ctl-geolocation-circlePulsate');

            self.overlay = new ol.Overlay({
                element: elem,
                position: point,
                positioning: 'center-center'
            });

            self.olMap.addOverlay(self.overlay);
        }

        $('div.tc-ctl-geolocation-circlePulsate').height(size + 'px');
        $('div.tc-ctl-geolocation-circlePulsate').width(size + 'px');

        if (self.overlay.getMap() == undefined)
            self.overlay.setMap(self.olMap);

        self.overlay.setPosition(point);

        setTimeout(function () {
            self.olMap.removeOverlay(self.overlay);
        }, 1100);
    };

    TC.wrap.control.Geolocation.prototype.coordsActivate = function () {
        var self = this;

        self.olMap.on(ol.MapBrowserEvent.EventType.SINGLECLICK, self._coordsTrigger);

        var viewport = self.olMap.getViewport();
        $(viewport).on(MOUSEOUT, self._cleanCoordsTrigger);
    };

    TC.wrap.control.Geolocation.prototype.coordsDeactivate = function () {
        var self = this;

        self.olMap.un(ol.MapBrowserEvent.EventType.SINGLECLICK, self._coordsTrigger);
        var viewport = self.olMap.getViewport();
        $(viewport).off(MOUSEOUT, self._cleanCoordsTrigger);
    };

    TC.wrap.Parser = function () {
    };

    TC.wrap.Parser.prototype.read = function (data) {
        var result = [];
        var self = this;
        if (self.parser) {
            if (!TC.Feature) {
                TC.syncLoadJS(TC.apiLocation + 'TC/Feature.js');
            }
            result = $.map(self.parser.readFeatures(data), function (feat) {
                return new TC.Feature(null, {
                    id: feat.getId(), data: feat.getProperties()
                });
            });
        }
        return result;
    };

    TC.wrap.parser = {
        WFS: function (options) {
            this.parser = new ol.format.WFS(options);
        },
        JSON: function (options) {
            this.parser = new ol.format.GeoJSON(options);
        }
    };
    TC.inherit(TC.wrap.parser.WFS, TC.wrap.Parser);
    TC.inherit(TC.wrap.parser.JSON, TC.wrap.Parser);

    TC.wrap.control.Search.prototype.addEvents = function () {
        var self = this;
        $.when(self.parent.layer.wrap.getLayer()).then(function (olLayer) {
            var olFeats = [];
            var timeout;
            olLayer.getSource().addEventListener(ol.source.VectorEventType.ADDFEATURE, function (e) {
                clearTimeout(timeout);
                olFeats[olFeats.length] = e.feature;
                var map = self.parent.layer.map;
                var radius = map.wrap.isGeo() ? map.options.pointBoundsRadius / TC.Util.getMetersPerDegree(map.getExtent()) : map.options.pointBoundsRadius;
                timeout = setTimeout(function () {
                    var geom = olFeats[0].getGeometry();
                    var bounds = geom.getExtent();
                    for (var i = 1; i < olFeats.length; i++) {
                        geom = olFeats[i].getGeometry();
                        bounds = ol.extent.extend(bounds, geom.getExtent());
                    }
                    if (bounds[0] === bounds[2]) {
                        bounds[0] -= radius;
                        bounds[2] += radius;
                    }
                    if (bounds[1] === bounds[3]) {
                        bounds[1] -= radius;
                        bounds[3] += radius;
                    }
                    map.setExtent(bounds);
                    olFeats.length = 0;
                }, 100);
            });
        });
    };

    TC.wrap.control.OverviewMap.prototype.register = function (map) {
        var self = this;

        $.when(self.parent.layer.wrap.getLayer()).then(function (olLayer) {
            self.ovMap = new ol.control.OverviewMap({
                target: self.parent.div,
                collapsed: false,
                collapsible: false,
                className: self.parent.CLASS + ' ol-overviewmap',
                layers: [olLayer]
            });

            var $boxElm = $(self.ovMap.boxOverlay_.getElement()).parents('.ol-overlay-container').first();

            TC.loadJS(
                !$.fn.drag,
                [TC.apiLocation + 'lib/jquery/jquery.event.drag.js', TC.apiLocation + 'lib/jquery/jquery.event.drop.js'],
                function () {
                    var boxBottom, boxLeft;
                    var ovmMap = self.ovMap.ovmap_;
                    $boxElm
                        .drag("start", function (e, dd) {
                            var $drag = $(this);
                            boxBottom = parseInt($drag.css('bottom'));
                            boxLeft = parseInt($drag.css('left'));
                            var bottomLeft = ovmMap.getPixelFromCoordinate([map.options.maxExtent[0], map.options.maxExtent[1]]);
                            var topRight = ovmMap.getPixelFromCoordinate([map.options.maxExtent[2], map.options.maxExtent[3]]);
                            var mapSize = ovmMap.getSize();
                            dd.limit = {
                                bottom: mapSize[1] - bottomLeft[1],
                                left: bottomLeft[0],
                                top: mapSize[1] - topRight[1] - $drag.height(),
                                right: topRight[0] - $drag.width()
                            };
                        })
                        .drag("end", function (e, dd) {
                            var $drag = $(this);
                            var olMap = self.ovMap.getMap();
                            var view = olMap.getView();
                            var centerPixel = ovmMap.getPixelFromCoordinate(view.getCenter());
                            var newCenter = ovmMap.getCoordinateFromPixel([centerPixel[0] + dd.deltaX, centerPixel[1] + dd.deltaY]);
                            var extent = map.getExtent();
                            var halfWidth = (extent[2] - extent[0]) / 2;
                            var halfHeight = (extent[3] - extent[1]) / 2;
                            if (newCenter[0] + halfWidth > map.options.maxExtent[2]) {
                                newCenter[0] = map.options.maxExtent[2] - halfWidth;
                            }
                            else if (newCenter[0] - halfWidth < map.options.maxExtent[0]) {
                                newCenter[0] = map.options.maxExtent[0] + halfWidth;
                            }
                            if (newCenter[1] + halfHeight > map.options.maxExtent[3]) {
                                newCenter[1] = map.options.maxExtent[3] - halfHeight;
                            }
                            else if (newCenter[1] - halfHeight < map.options.maxExtent[1]) {
                                newCenter[1] = map.options.maxExtent[1] + halfHeight;
                            }
                            var pan = ol.animation.pan({
                                duration: 500,
                                source: view.getCenter()
                            });
                            olMap.beforeRender(pan);
                            view.setCenter(newCenter);
                        })
                        .drag(function (e, dd) {
                            var $drag = $(this);
                            var bottom = parseInt($drag.css('bottom'));
                            var left = parseInt($drag.css('left'));
                            $drag.css('bottom', Math.min(Math.max(boxBottom - dd.deltaY, dd.limit.bottom), dd.limit.top) + 'px');
                            $drag.css('left', Math.min(Math.max(boxLeft + dd.deltaX, dd.limit.left), dd.limit.right) + 'px');
                        });
                });

            $.when(map.wrap.getMap()).then(function (olMap) {

                // Modificamos mapa para que tenga la proyección correcta
                self.ovMap.ovmap_.setView(
                    new ol.View(
                        getResolutionOptions(map.wrap, olLayer._wrap.parent)
                    )
                );

                var $load = $(self.parent.div).find('.' + self.parent.CLASS + '-load');
                olLayer._wrap.$events.on(TC.Consts.event.BEFORETILELOAD, function () {
                    $load.removeClass(TC.Consts.classes.HIDDEN).addClass(TC.Consts.classes.VISIBLE);
                });
                olLayer._wrap.$events.on(TC.Consts.event.TILELOAD, function () {
                    $load.removeClass(TC.Consts.classes.VISIBLE).addClass(TC.Consts.classes.HIDDEN);
                });

                olMap.addControl(self.ovMap);

                self.parent.isLoaded = true;
                self.parent.$events.trigger($.Event(TC.Consts.event.MAPLOAD));
            });
        });
    };

    TC.wrap.control.OverviewMap.prototype.enable = function () {
        var self = this;
        if (self.parent.layer && self.parent.layer.setVisibility) {
            self.parent.layer.setVisibility(true);
            // La siguiente línea es para actualizar mapa de situación
            $(self.parent.map.div).trigger('resize');
        }
    };

    TC.wrap.control.OverviewMap.prototype.disable = function () {
        var self = this;
        if (self.parent.layer && self.parent.layer.setVisibility) {
            self.parent.layer.setVisibility(false);
        }
    };

    TC.wrap.control.FeatureInfo.prototype.register = function (map) {
        var self = this;
        $.when(map.wrap.getMap()).then(function (olMap) {
            TC.wrap.control.Click.prototype.register.call(self, map);
            var _clickTrigger = self._trigger;
            self._trigger = function (e) {
                self.hasElegibleLayers().then(function (hasLayers) {
                    if (hasLayers) {
                        if (_clickTrigger.call(self, e)) {
                            map.$events.trigger($.Event(TC.Consts.event.BEFOREFEATUREINFO, {
                                xy: e.pixel, control: self.parent
                            }));
                        };
                    }
                });
            }
        });
    };

    TC.wrap.control.FeatureInfo.prototype.hasElegibleLayers = function () {
        var def = $.Deferred();
        var map = this.parent.map;
        var ret = false;
        $.when(map.wrap.getMap()).then(function (olMap) {
            olMap.getLayers().forEach(function (olLayer) {
                var layer = olLayer._wrap.parent;
                var source = olLayer.getSource();
                //Por qué en workLayers están el vectorial de medición, y cosas así?
                if (source.getGetFeatureInfoUrl && $.inArray(layer, map.workLayers) >= 0) {
                    ret = true;
                    return false;   //break del foreach
                }
            });
            def.resolve(ret);
        });

        return def;
    };

    var bufferElm;
    var getElementText = function (elm) {
        var text = elm.innerHTML || elm.textContent;
        bufferElm = bufferElm || document.createElement("textarea");
        bufferElm.innerHTML = text;
        return bufferElm.value;
    };

    var esriXmlParser = {
        readFeatures: function (text) {
            var result = [];
            var dom = (new DOMParser()).parseFromString(text, 'text/xml');
            if (dom.documentElement.tagName === 'FeatureInfoResponse') {
                var fiCollections = dom.documentElement.getElementsByTagName('FeatureInfoCollection');
                for (var i = 0, len = fiCollections.length; i < len; i++) {
                    var fic = fiCollections[i];
                    var layerName = fic.getAttribute('layername');
                    var fInfos = fic.getElementsByTagName('FeatureInfo');
                    for (var j = 0, lenj = fInfos.length; j < lenj; j++) {
                        var fields = fInfos[j].getElementsByTagName('Field');
                        var attributes = {
                        };
                        for (var k = 0, lenk = fields.length; k < lenk; k++) {
                            var field = fields[k];
                            attributes[getElementText(field.getElementsByTagName('FieldName')[0])] = getElementText(field.getElementsByTagName('FieldValue')[0]);
                        }
                        var feature = new ol.Feature(attributes);
                        feature.setId(layerName + '.' + TC.getUID());
                        result[result.length] = feature;
                    }
                }
            }
            return result;
        }
    };

    TC.wrap.control.FeatureInfo.prototype.getFeatureInfo = function (xy) {
        var self = this;
        var map = self.parent.map;
        $.when(map.wrap.getMap()).then(function (olMap) {
            var targetServices = {
            };
            var auxInfo = {
            };
            var requestDeferreds = [];
            var featurePromises = [];

            //var infoFormats = [];
            var layers = olMap.getLayers().getArray();
            for (var j = 0; j < layers.length; j++) {
                var olLayer = layers[j];
                if (olLayer.getVisible()) {
                    var layer = olLayer._wrap.parent;
                    var source = olLayer.getSource();

                    //console.log("Source: " + layer.layerNames.join(","));
                    //Por qué en workLayers están el vectorial de medición, y cosas así?
                    if (source.getGetFeatureInfoUrl && $.inArray(layer, map.workLayers) >= 0 && layer.names.length > 0) {

                        //
                        var targetService = {
                        };
                        if (!targetServices[layer.title]) {
                            targetService = {
                                layers: [], mapLayer: layer, request: null
                            };
                            targetServices[layer.title] = targetService;
                            auxInfo[layer.title] = {
                                "source": jQuery.extend(true, {}, source),
                                "layers": []
                            };
                        }
                        else {
                            targetService = targetServices[layer.title];
                        }

                        //var targetService = {
                        //    layers: [], mapLayer: layer
                        //};
                        var disgregatedNames = layer.getDisgregatedLayerNames();
                        for (var i = 0; i < disgregatedNames.length; i++) {
                            var name = disgregatedNames[i];
                            if (olLayer._wrap.getInfo(name).queryable) {
                                var path = layer.getPath(name);
                                targetService.layers.push({
                                    name: name,
                                    title: path[path.length - 1],
                                    path: path.slice(1),
                                    features: []
                                });
                            }
                            else {
                                disgregatedNames.splice(i, 1);
                                i = i - 1;
                            }
                        }
                        auxInfo[layer.title].layers = auxInfo[layer.title].layers.concat(disgregatedNames);
                    }
                }
            }
            for (var title in targetServices) {
                var targetService = targetServices[title];
                var source = auxInfo[title].source;
                var layers = auxInfo[title].layers;
                var params = source.getParams();
                source.params_.LAYERS = layers.join(',');
                var url = source.getGetFeatureInfoUrl(xy, olMap.getView().getResolution(), map.crs, {
                    'QUERY_LAYERS': layers.join(','),
                    'INFO_FORMAT': params.INFO_FORMAT,
                    'FEATURE_COUNT': 1000,
                    'radius': map.options.pixelTolerance,
                    'buffer': map.options.pixelTolerance
                });


                var size = olMap.getSize();

                url = url
                    .replace(/I=\d+(\.\d+)?/, 'I=' + Math.round(xy[0])) // Se redondea porque en IE pone decimales si el zoom de la página no es 100%
                    .replace(/J=\d+(\.\d+)?/, 'J=' + Math.round(xy[1]))
                    .replace(/WIDTH=\d+/, 'WIDTH=' + size[0])
                    .replace(/HEIGHT=\d+/, 'HEIGHT=' + size[1])
                    .replace(/BBOX=-?\d+(\.\d+)?\%2C-?\d+(\.\d+)?\%2C-?\d+(\.\d+)?\%2C-?\d+(\.\d+)?/, 'BBOX=' + map.getExtent().join('%2C'))
                    .replace(/sld_body=[a-zA-Z%0-9._]*/); // Quitamos el parámetro sld_body


                var expUrl = url;
                //proxificar si es necesario
                url = TC.proxify(url);
                var def = $.ajax({
                    url: url
                });
                def.originalUrl = url;
                def.title = title;
                def.requestedFormat = params.INFO_FORMAT;
                def.expandUrl = expUrl;
                requestDeferreds.push(def);
            }
            if (requestDeferreds.length > 0) {
                $.when.apply(self, requestDeferreds).then(function () {
                    var responses = requestDeferreds.length > 1 ? arguments : [arguments];
                    var someSuccess = false;
                    var featureCount = 0;
                    var featureInsertionPoints = [];
                    for (var i = 0; i < responses.length; i++) {
                        var response = responses[i];
                        var service = targetServices[requestDeferreds[i].title];
                        var featureInfo = response[2];
                        if (response[1] === 'success') {
                            someSuccess = true;
                            service.text = featureInfo.responseText;
                            var format;
                            var iFormat = featureInfo.getResponseHeader("Content-type");
                            if (iFormat && iFormat.indexOf(";") > -1)
                                iFormat = iFormat.substr(0, iFormat.indexOf(";")).trim();

                            if (!iFormat) iFormat = featureInfo.requestedFormat;

                            if (iFormat === featureInfo.requestedFormat) {
                                switch (iFormat) {
                                    case 'application/json':
                                        format = new ol.format.GeoJSON();
                                        break;
                                    case 'application/vnd.ogc.gml':
                                        if (featureInfo.responseText.indexOf("FeatureCollection") > -1)
                                            format = new ol.format.WFS({
                                                gmlFormat: new ol.format.GML2()
                                            });
                                        else
                                            format = new ol.format.WMSGetFeatureInfo();
                                        break;
                                    case 'application/vnd.ogc.gml/3.1.1':
                                        format = new ol.format.GML3();
                                        break;
                                    case 'application/vnd.esri.wms_featureinfo_xml':
                                        format = esriXmlParser;
                                        break;
                                    default:
                                        format = null;
                                        break;
                                }

                                if (format) {
                                    var features = format.readFeatures(featureInfo.responseText, {
                                        featureProjection: ol.proj.get(map.crs)
                                    });
                                    featureCount = featureCount + features.length;
                                    var isParentOrSame = function (layer, na, nb) {
                                        var result = false;
                                        if (na === nb) {
                                            result = true;
                                        }
                                        else {
                                            var pa = layer.getNodePath(na, true);
                                            var pb = layer.getNodePath(nb, true);
                                            if (pa.length > 0 && pb.length >= pa.length) {
                                                result = true;
                                                for (var i = 0; i < pa.length; i++) {
                                                    if (layer.wrap.getName(pa[i]) !== layer.wrap.getName(pb[i])) {
                                                        result = false;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        return result;
                                    };

                                    var fakeLayers = {
                                    };

                                    for (var j = 0; j < features.length; j++) {
                                        var feature = features[j];
                                        if (feature instanceof ol.Feature) {
                                            var fid = feature.getId() || TC.getUID();
                                            var found = false;
                                            var layerName = fid.substr(0, fid.lastIndexOf('.'));
                                            for (var k = 0; k < service.layers.length; k++) {
                                                var l = service.layers[k];
                                                var lName = l.name.substr(l.name.indexOf(':') + 1);
                                                if (isParentOrSame(service.mapLayer, lName, layerName)) {
                                                    found = true;
                                                    featurePromises.push(TC.wrap.Feature.createFeature(feature));
                                                    featureInsertionPoints.push(l.features);
                                                    break;
                                                }
                                            }

                                            //si llegamos aquí y no he encontrado su layer, es que no cuadraba el prefijo del fid con el id del layer
                                            //esto pasa, p.ej, en cartociudad
                                            if (!found) {
                                                //así que creo un layer de palo para la respuesta del featInfo
                                                var fakeLayer;
                                                if (fakeLayers[layerName]) fakeLayer = fakeLayers[layerName];
                                                else {
                                                    fakeLayer = {
                                                        name: layerName, title: layerName, features: []
                                                    };
                                                    fakeLayers[layerName] = fakeLayer;
                                                    service.layers.push(fakeLayer);
                                                }

                                                featurePromises.push(TC.wrap.Feature.createFeature(feature));
                                                featureInsertionPoints.push(fakeLayer.features);
                                            }
                                        }
                                    }//iteración sobre las features de esta respuesta


                                }
                                else {
                                    //si no hay formato reconocido y parseable, metemos un iframe con la respuesta
                                    //y prau
                                    //para eso, creo una falsa entrada de tipo feature, con un campo especial rawUrl o rawContent

                                    var compoundLayer = {
                                        name: 'layer' + TC.getUID(), title: 'Datos en el punto', features: []
                                    };

                                    service.layers[service.layers.length] = compoundLayer;
                                    compoundLayer.features[0] = {
                                        rawUrl: featureInfo.originalUrl, expandUrl: featureInfo.expandUrl, rawContent: featureInfo.responseText, rawFormat: iFormat
                                    };
                                    featureCount = featureCount + 1;
                                }
                            }
                            else { // iFormat !== featureInfo.requestedFormat
                                // En este caso lo más probable es que el servidor esté devolviendo una excepción
                                map.$events.trigger($.Event(TC.Consts.event.FEATUREINFOERROR, {
                                    xy: xy, control: self.parent, layer: service.mapLayer, message: featureInfo.responseText
                                }));
                            }
                        }
                        else {
                            map.$events.trigger($.Event(TC.Consts.event.FEATUREINFOERROR, {
                                xy: xy, control: self.parent, layer: service.mapLayer, message: featureInfo.responseText
                            }));
                        }
                    }
                    if (someSuccess) {
                        var finfoPromises = featurePromises;
                        if (featurePromises.length) {
                            var geometryPromise = $.Deferred();
                            finfoPromises = finfoPromises.concat(geometryPromise);
                            // Si hay features cargamos el módulo de geometria para encontrar una que se interseque con el punto
                            TC.loadJS(
                                !TC.Geometry,
                                TC.apiLocation + 'TC/Geometry.js',
                                function () {
                                    geometryPromise.resolve();
                                }
                            );
                        }
                        $.when.apply(this, finfoPromises).then(function () {
                            var defaultFeature;
                            if (arguments.length) {
                                var coord = map.wrap.getCoordinateFromPixel(xy);
                                for (var i = 0; i < arguments.length; i++) {
                                    var feat = arguments[i];
                                    if (feat) {
                                        feat.attributes = [];
                                        for (var key in feat.data) {
                                            var value = feat.data[key];
                                            if (typeof value !== 'object') {
                                                feat.attributes.push({
                                                    name: key, value: value
                                                });
                                            }
                                        }
                                        // Esta feature es solo para ver, no debe reaccionar a clics
                                        feat.showsPopup = false;
                                        if (!defaultFeature && TC.Geometry.isInside(coord, feat.geometry)) {
                                            defaultFeature = feat;
                                        }
                                        featureInsertionPoints[i].push(feat);
                                    }
                                }
                            }

                            var services = [];
                            for (var title in targetServices)
                                if (targetServices.hasOwnProperty(title))
                                    services.push(targetServices[title]);

                            map.$events.trigger($.Event(TC.Consts.event.FEATUREINFO, {
                                xy: xy || null,
                                services: services,
                                featureCount: featureCount,
                                defaultFeature: defaultFeature,
                                control: self.parent
                            }));
                        });
                    }
                },
            function (a, b, c) {
                //alert("MAAAAL");
            });
            }
            else {
                map.$events.trigger($.Event(TC.Consts.event.FEATUREINFO, {
                    xy: xy, services: targetServices, featureCount: 0, control: self.parent
                }));
            }
        });
    };

    TC.wrap.control.PolygonFeatureInfo.prototype.register = function (map) {
        var self = this;
        $.when(map.wrap.getMap()).then(function (olMap) {
            TC.wrap.control.Click.prototype.register.call(self, map);
            var _clickTrigger = self._trigger;
            self._trigger = function (e) {
                self.hasElegibleLayers().then(function (hasLayers) {
                    if (hasLayers) {
                        if (!self.parent._isSearching) {
                            if (e.type == ol.MapBrowserEvent.EventType.SINGLECLICK && !self.parent._isDrawing && !self.parent._isSearching) {
                                _clickTrigger.call(self, e);
                            }
                        }
                    }
                });
            }

        });
    };

    TC.wrap.control.PolygonFeatureInfo.prototype.hasElegibleLayers = function () {
        var def = $.Deferred();
        var map = this.parent.map;
        var ret = false;
        $.when(map.wrap.getMap()).then(function (olMap) {
            olMap.getLayers().forEach(function (olLayer) {
                var layer = olLayer._wrap.parent;
                var source = olLayer.getSource();
                //Por qué en workLayers están el vectorial de medición, y cosas así?
                if (source.getGetFeatureInfoUrl && $.inArray(layer, map.workLayers) >= 0) {
                    ret = true;
                    return false;   //break del foreach
                }
            });
            def.resolve(ret);
        });

        return def;
    };

    TC.wrap.control.PolygonFeatureInfo.prototype.beginDraw = function (xy, layer, callback) {
        var self = this;
        var semaforo = false;
        if (!self.drawCtrl) {
            $.when(layer.wrap.getLayer()).then(function (olLayer) {
                self.drawCtrl = new ol.interaction.Draw({
                    source: olLayer.getSource(),
                    type: ol.geom.GeometryType.POLYGON
                    , style: olLayer.getStyle()
                });
                self.drawCtrl.handleEvent = function (event) {
                    //esta ñapa para solucionar cuando haces un primer punto y acontinuación otro muy rápido
                    if (event.type == ol.MapBrowserEvent.EventType.SINGLECLICK) {
                        if (semaforo && this.sketchCoords_[0].length == 2)
                            this.addToDrawing_(event);
                        else
                            semaforo = true;
                    }
                    return ol.interaction.Draw.handleEvent.call(this, event)
                }
                self.parent.map.wrap.getMap().addInteraction(self.drawCtrl);
                self.drawCtrl.on('drawstart', function (event) {
                    self.parent._isDrawing = true;
                    var map = self.parent.map;
                    $.when(map.wrap.getMap()).then(function (olMap) {
                        olMap.getInteractions().forEach(function (item, i) {
                            if (item instanceof (ol.interaction.DoubleClickZoom))
                                item.setActive(false);
                        });
                    });
                });
                self.drawCtrl.startDrawing_({
                    coordinate: xy
                });
                self.drawCtrl.on('drawend', function (event) {
                    self.parent._isDrawing = false;
                    var map = self.parent.map;
                    $.when(map.wrap.getMap()).then(function (olMap) {
                        olMap.getInteractions().forEach(function (item, i) {
                            if (item instanceof (ol.interaction.DoubleClickZoom))
                                item.setActive(false);
                        });
                    });
                    if (callback) {
                        callback(event.feature.getGeometry().getCoordinates()[0]);
                    }
                    this.setActive(false);
                    self.parent.map.wrap.getMap().removeInteraction(self.drawCtrl);
                    self.drawCtrl = null;
                    olLayer.getSource().clear();
                    self.parent._drawToken = true;
                    setTimeout(function () {
                        self.parent._drawToken = false;
                    }, 500)
                });
            });

        }
        else {
            self.drawCtrl.setActive(true);
            self.drawCtrl.startDrawing_({
                coordinate: xy
            });
        }
    };

    TC.wrap.control.PolygonFeatureInfo.prototype.cancelDraw = function (xy, layer, callback) {
        var self = this;
        if (self.drawCtrl && self.parent._isDrawing) {
            self.parent._isDrawing = false;
            self.drawCtrl.setActive(false);
            self.drawCtrl.source_.clear();

        }
    };

    TC.wrap.control.PolygonFeatureInfo.prototype.getFeaturesByPolygon = function (coordinates, xy) {

        if (!this.writeGMLPolygon)
            this.writeGMLPolygon = function (coordinates, gmlVersion) {
                switch (gmlVersion) {
                    case "3.1.1":
                        break;
                    case "3.2":
                        var gmlCoordinates = coordinates.toString();
                        while (gmlCoordinates.indexOf(",") >= 0)
                            gmlCoordinates = gmlCoordinates.replace(",", " ");
                        return "<gml:Polygon srsDimension=\"2\"><gml:exterior><gml:LinearRing><gml:posList>" +
                            gmlCoordinates +
                            "</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon>";
                        break;
                    case "2.0":
                    default:
                        var gmlCoordinates = jQuery.each(coordinates, function (i, item) { return item.join(",") }).join(" ");
                        return "<gml:Polygon><gml:outerBoundaryIs><gml:LinearRing><gml:coordinates>" +
                            gmlCoordinates +
                            "</gml:coordinates></gml:LinearRing></gml:outerBoundaryIs></gml:Polygon>";
                        break;
                }
            }

        var self = this;
        var map = self.parent.map;
        var arrPromises = [];
        var services = {
        };
        $.when(map.wrap.getMap()).then(function (olMap) {

            //calcular el punto mas alto
            if (!xy) {
                var bestPoint = null;
                for (var i = 0; i < coordinates.length; i++) {
                    if (!bestPoint || bestPoint[1] < coordinates[i][1])
                        bestPoint = coordinates[i];
                }
                xy = olMap.getPixelFromCoordinate(new ol.geom.Point(bestPoint).getCoordinates());
            }

            //self.parent.beforeGetFeatureInfo($.Event(TC.Consts.event.BEFOREFEATUREINFO, { xy: xy, control: self.parent }));
            map.$events.trigger($.Event(TC.Consts.event.BEFOREFEATUREINFO, {
                xy: xy, control: self.parent
            }));

            var featureInsertionPoints = {
            };
            olMap.getLayers().forEach(function (olLayer) {
                if (olLayer.getVisible()) {
                    var layer = olLayer._wrap.parent;
                    if ($.inArray(layer, map.workLayers) < 0 || layer.type !== TC.Consts.layerType.WMS)
                        return;
                    var url = layer.options.url.substring(0, layer.options.url.lastIndexOf("/wms")
                        || layer.options.url.lastIndexOf("/WMS")
                        || layer.options.url.lastIndexOf("/"))
                        + "/wfs";

                    var availableLayers = layer.getDisgregatedLayerNames() || layer.availableNames;
                    if (!services[layer.title])
                        services[layer.title] = {
                            layers: [], mapLayer: layer, layerNames: []
                        };
                    for (var i = 0; i < availableLayers.length; i++) {
                        var name = availableLayers[i];
                        if (!layer.isVisibleByScale(name))
                            continue;
                        if (!layer.wrap.getInfo(name).queryable)
                            continue;
                        services[layer.title].layerNames.push(name);
                        var path = layer.getPath(name);
                        services[layer.title].layers.push({
                            name: name,
                            title: path[path.length - 1],
                            path: path.slice(1),
                            features: []
                        });
                    }
                    if (services[layer.title].layerNames.length == 0)
                        return;
                    if (typeof (services[layer.title].request) !== "undefined")
                        return;
                    services[layer.title].request = layer.getWFSCapabilitiesPromise(); //WFSCapabilities.Promises(url);
                    services[layer.title].defer = $.Deferred();
                    arrPromises.push(services[layer.title].defer);
                    $.when(services[layer.title].request).then(function (capabilities) {
                        var _numMaxFeatures = null;
                        var service = null;

                        for (var title in services)
                            if (services[title].request.promise() == this) {
                                service = services[title];
                                break;
                            }


                        var layerList = service.layerNames;
                        var defer = service.defer;
                        if (layerList instanceof Array && layerList.length) {

                            //comprobamos que tiene el getfeature habilitado
                            if (typeof (capabilities.Operations.GetFeature) === "undefined") {
                                TC.error("El servicio " + service.mapLayer.title + " no tiene habilitado el GetFeature de WFS");
                                defer.resolve(null);
                                return;
                            }

                            var availableLayers = [];
                            for (var i = 0; i < layerList.length; i++) {

                                //Comprbamos si la capa en el WMS tiene el mimso nombre que en el WFS
                                var layer = layerList[i].substring(layerList[i].indexOf(":") + 1);
                                //quitamos los ultimos caracteres que sean "_" , cosas de Idena
                                while (layer[layer.length - 1] === "_")
                                    layer = layer.substring(0, layer.lastIndexOf("_"));
                                if (!capabilities.FeatureTypes.hasOwnProperty(layer)) {
                                    TC.error("El servicio " + service.mapLayer.title + " no dispone de la capa " + layer);
                                    continue;
                                }
                                if (availableLayers.indexOf(layer) < 0)
                                    availableLayers.push(layer);
                            }
                            if (availableLayers.length == 0) {
                                TC.error("No hay ninguna capa válida para el servicio " + service.mapLayer.title + " por lo que no se consultará dicho servicio");
                                defer.resolve(null);
                                return;
                            }
                            if (capabilities.Operations.GetFeature.CountDefault)
                                _numMaxFeatures = capabilities.Operations.GetFeature.CountDefault.DefaultValue;
                            if (!self.queryBuilder)
                                self.queryBuilder = function (_url, _capabilities, _coordinates, _availableLayers, _onlyHits) {
                                    //añadimos los atributos del nodo padre del capabilities al primer nodo del GetFeature
                                    var postParam = "<wfs:GetFeature service=\"WFS\" ";
                                    switch (_capabilities.version) {
                                        case "1.0.0":
                                            postParam += "xmlns:wfs=\"http://www.opengis.net/wfs\" xmlns:gml=\"http://www.opengis.net/gml\" ";
                                            //comprobamos si soporta querys    
                                            if (!_capabilities.Operations.GetFeature.Operations.hasOwnProperty("Query")) {
                                                TC.error("El servicio " + service.mapLayer.title + " no tiene habilitado el Query de WFS");
                                                return null;
                                            }
                                            break;
                                        case "1.1.0":
                                            break;
                                        case "2.0.0":
                                            postParam += "xmlns=\"http://www.opengis.net/wfs/2.0\" xmlns:wfs=\"http://www.opengis.net/wfs/2.0\" xmlns:gml=\"http://www.opengis.net/gml/3.2\" ";
                                            //comprobamos si soporta querys    
                                            if (_capabilities.Operations.QueryExpressions.AllowedValues.Value.indexOf("wfs:Query") < 0) {
                                                TC.error("El servicio " + service.mapLayer.title + " no tiene habilitado el Query de WFS");
                                                return null;
                                            }
                                            break;
                                    }
                                    for (var i in _capabilities) {
                                        if (typeof (_capabilities[i]) === "string" && i.indexOf("gml") < 0 && _capabilities[i].indexOf("wfs") < 0)
                                            postParam += (i + "=\"" + _capabilities[i] + "\" ");
                                    }
                                    if (_capabilities.Operations.GetFeature.outputFormat.indexOf("json") >= 0)
                                        postParam += " outputFormat=\"JSON\" ";
                                    if (_onlyHits)
                                        postParam += " resultType=\"hits\" ";
                                    postParam += ">";
                                    //logica recorriendo las capas

                                    for (var i = 0; i < _availableLayers.length; i++) {
                                        if (_capabilities.version === "1.0.0") {
                                            postParam += "<wfs:Query typeName=\"" + _availableLayers[i] + "\"><ogc:Filter><ogc:Intersects><ogc:PropertyName></ogc:PropertyName>" +
                                                this.writeGMLPolygon(_coordinates, "2.0") +
                                                "</ogc:Intersects></ogc:Filter></wfs:Query>";
                                        }
                                        if (_capabilities.version === "2.0.0") {
                                            var gmlCoordinates = _coordinates.toString();
                                            while (gmlCoordinates.indexOf(",") >= 0)
                                                gmlCoordinates = gmlCoordinates.replace(",", " ");
                                            postParam += "<wfs:Query typeNames=\"" + _availableLayers[i] + "\"><fes:Filter><fes:Intersects><fes:ValueReference></fes:ValueReference>" +
                                                this.writeGMLPolygon(_coordinates, "3.2") +
                                                "</fes:Intersects></fes:Filter></wfs:Query>";
                                        }
                                    }
                                    postParam += "</wfs:GetFeature>";
                                    var dfrr = $.Deferred();
                                    jQuery.ajax(
            {
                url: _url,
                data: postParam,
                cache: false,
                contentType: "application/xml",
                type: "POST",
            }).then(function () {
                if (arguments[1] == "success") {
                    dfrr.resolve(arguments);
                }
                else
                    dfrr.reject(arguments);
            });
                                    return dfrr;
                                }

                            var featPromise = null;
                            if (_numMaxFeatures) {
                                self.queryBuilder(url, capabilities, coordinates, availableLayers, true).done(function (params) {
                                    var featFounds = parseInt(xml2json(params[0]).numberMatched, 10)
                                    if (featFounds > parseInt(_numMaxFeatures, 10)) {
                                        featPromise.reject({
                                            err: "NumMaxFeatures", limit: _numMaxFeatures, message: "Se ha superado el máximo de {0} elementos de este servicio", service: service
                                        });
                                    }
                                });
                            }
                            featPromise = self.queryBuilder(url, capabilities, coordinates, availableLayers, false);
                            featPromise.done(function (params) {
                                var data = params[0];
                                var textStatus = params[1];
                                var jqXHR = params[2];
                                //conversion de features
                                var someSuccess = false;

                                var featurePromises = [];
                                if (textStatus === "success") {
                                    //var service = services[serverId];

                                    someSuccess = true;
                                    var format;
                                    var iFormat = jqXHR.getResponseHeader("Content-type");
                                    if (iFormat && iFormat.indexOf(";") > -1)
                                        iFormat = iFormat.substr(0, iFormat.indexOf(";")).trim();

                                    if (!iFormat) iFormat = data.requestedFormat;
                                    switch (iFormat) {
                                        case 'application/json':
                                            format = new ol.format.GeoJSON();
                                            break;
                                        case 'application/vnd.ogc.gml':
                                            if (data.responseText.indexOf("FeatureCollection") > -1)
                                                format = new ol.format.WFS({
                                                    gmlFormat: new ol.format.GML2()
                                                });
                                            else
                                                format = new ol.format.WMSGetFeatureInfo();
                                            break;
                                        case 'application/vnd.ogc.gml/3.1.1':
                                            format = new ol.format.GML3();
                                            break;
                                        case "text/xml":
                                            //posible error
                                            var response = xml2json(data);
                                            if (response.ServiceException)
                                                TC.error(response.ServiceException);
                                            format = null;
                                            break;
                                        default:
                                            format = null;
                                            break;
                                    }
                                    if (format) {
                                        var features = format.readFeatures(jqXHR.responseText, {
                                            featureProjection: ol.proj.get(map.crs)
                                        });
                                        var isParentOrSame = function (layer, na, nb) {
                                            var result = false;
                                            if (na === nb || (na.indexOf(nb) === 0)) {
                                                result = true;
                                            }
                                            else {
                                                var pa = layer.getPath(na, true);
                                                var pb = layer.getPath(nb, true);
                                                if (pa.length > 0 && pb.length >= pa.length) {
                                                    result = true;
                                                    for (var i = 0; i < pa.length; i++) {
                                                        if (pa[i] !== pb[i]) {
                                                            result = false;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                            return result;
                                        };

                                        var fakeLayers = {
                                        };
                                        for (var j = 0; j < features.length; j++) {
                                            var feature = features[j];
                                            if (feature instanceof ol.Feature) {
                                                var fid = feature.getId() || TC.getUID();
                                                var found = false;
                                                var layerName = fid.substr(0, fid.lastIndexOf('.'));
                                                for (var k = 0; k < service.layers.length; k++) {
                                                    var l = service.layers[k];
                                                    var lName = l.name.substr(l.name.indexOf(':') + 1);
                                                    if (isParentOrSame(service.mapLayer, lName, layerName)) {
                                                        found = true;
                                                        featurePromises.push(TC.wrap.Feature.createFeature(feature));

                                                        featureInsertionPoints[feature.id_] = (l.features);
                                                        break;
                                                    }
                                                }

                                                //si llegamos aquí y no he encontrado su layer, es que no cuadraba el prefijo del fid con el id del layer
                                                //esto pasa, p.ej, en cartociudad
                                                if (!found) {
                                                    //así que creo un layer de palo para la respuesta del featInfo
                                                    var fakeLayer;
                                                    if (fakeLayers[layerName]) fakeLayer = fakeLayers[layerName];
                                                    else {
                                                        fakeLayer = {
                                                            name: layerName, title: layerName, features: []
                                                        };
                                                        fakeLayers[layerName] = fakeLayer;
                                                        service.layers.push(fakeLayer);
                                                    }

                                                    featurePromises.push(TC.wrap.Feature.createFeature(feature));
                                                    featureInsertionPoints[feature.id_] = (fakeLayer.features);
                                                }
                                            }
                                        }//iteración sobre las features de esta respuesta

                                    }
                                    else {
                                        //si no hay formato reconocido y parseable, metemos un iframe con la respuesta
                                        //y prau
                                        //para eso, creo una falsa entrada de tipo feature, con un campo especial rawUrl o rawContent
                                        var l = service.layers[0];
                                        l.features.push({
                                            error: jqXHR.responseText
                                        });
                                    }

                                }
                                else {
                                    map.$events.trigger($.Event(TC.Consts.event.FEATUREINFOERROR, {
                                        xy: xy || null, control: self.parent, layer: service.mapLayer
                                    }));
                                }
                                if (someSuccess) {
                                    $.when.apply(this, featurePromises).then(function () {
                                        if (arguments.length) {
                                            for (var i = 0; i < arguments.length; i++) {
                                                var feat = arguments[i];
                                                feat.attributes = [];
                                                for (var key in feat.data) {
                                                    var value = feat.data[key];
                                                    if (typeof value !== 'object') {
                                                        feat.attributes.push({
                                                            name: key, value: value
                                                        });
                                                    }
                                                }
                                                featureInsertionPoints[feat.id].push(feat);
                                            }
                                        }
                                        defer.resolve({
                                            service: service
                                        })
                                        //map.$events.trigger($.Event(TC.Consts.event.FEATUREINFO, { xy: xy || null, services: targetServices, featureCount: featureCount, control: self.parent }));
                                    });
                                }
                            })
                                .fail(function (errorThrown) {
                                    if (errorThrown.err && errorThrown.err === "NumMaxFeatures") {
                                        defer.resolve({
                                            service: errorThrown.service, "Error": errorThrown.message.format(errorThrown.limit)
                                        });
                                    }
                                    else
                                        defer.reject(errorThrown);
                                });
                        }
                    }, function (err) {
                        TC.error(err.Message ? err.Message : err.responseText);
                    });
                }
            });
            $.when.apply($, arrPromises).then(function () {
                var targetServices = [];
                var featureCount = 0;
                var featureCount = 0;
                for (var i = 0; i < arguments.length; i++) {
                    if (!arguments[i]) continue;
                    if (arguments[i].Error)
                        arguments[i].service.hasLimits = arguments[i].Error;
                    targetServices.push(arguments[i].service)
                    for (var j = 0; j < arguments[i].service.layers.length; j++)
                        featureCount = featureCount + arguments[i].service.layers[j].features.length;
                }
                if (!featureCount) {
                    map.$events.trigger($.Event(TC.Consts.event.NOFEATUREINFO, {
                        xy: xy, control: self.parent
                    }));
                }
                else {
                    map.$events.trigger($.Event(TC.Consts.event.FEATUREINFO, {
                        xy: xy || null, services: targetServices, featureCount: featureCount, control: self.parent
                    }));
                }


            }, function (e) {
                console.log(e);
            });
        });
    };

    TC.wrap.control.Popup.prototype = function () {
        this.popup = null;
    };

    TC.Consts.event.PANANIMATIONSTART = 'pananimationstart.tc';
    TC.Consts.event.PANANIMATIONEND = 'pananimationend.tc';
    TC.wrap.control.Popup.prototype.fitToView = function () {
        var self = this;
        var map = self.parent.map;
        var olMap = self.parent.map.wrap.map;

        var popupBoundingRect = self.parent.$popupDiv[0].getBoundingClientRect();
        var mapBoundingRect = map._$div[0].getBoundingClientRect();

        var topLeft = olMap.getCoordinateFromPixel([popupBoundingRect.left - mapBoundingRect.left, popupBoundingRect.top - mapBoundingRect.top]);
        var bottomRight = olMap.getCoordinateFromPixel([popupBoundingRect.right - mapBoundingRect.left, popupBoundingRect.bottom - mapBoundingRect.top]);
        var west = topLeft[0];
        var north = topLeft[1];
        var east = bottomRight[0];
        var south = bottomRight[1];

        var popupExt = [west, south, east, north];
        var mapExt = map.getExtent();

        if (!ol.extent.containsExtent(mapExt, popupExt)) {
            var overflows = {
                left: Math.max(mapExt[0] - popupExt[0], 0),
                bottom: Math.max(mapExt[1] - popupExt[1], 0),
                right: Math.max(popupExt[2] - mapExt[2], 0),
                top: Math.max(popupExt[3] - mapExt[3], 0)
            };

            if (self.parent.dragged) {
                // Movemos el popup
                var newPos = self.popup.getPosition();
                if (overflows.right) {
                    newPos[0] = newPos[0] - overflows.right;
                }
                else if (overflows.left) {
                    newPos[0] = newPos[0] + overflows.left;
                }
                if (overflows.top) {
                    newPos[1] = newPos[1] - overflows.top;
                }
                else if (overflows.bottom) {
                    newPos[1] = newPos[1] + overflows.bottom;
                }
                var newPixelPos = olMap.getPixelFromCoordinate(newPos);
                newPixelPos[1] = olMap.getSize()[1] - newPixelPos[1];
                self.parent._previousContainerPosition = newPixelPos;
                self.popup._oldUpdatePixelPosition(newPos);
            }
            else {
                if (self.parent.isVisible()) {
                    // Movemos el mapa
                    var view = olMap.getView();
                    var ct = view.getCenter().slice();

                    if (overflows.top) ct[1] += overflows.top;
                    else if (overflows.bottom) ct[1] -= overflows.bottom;
                    if (overflows.right) ct[0] += overflows.right;
                    else if (overflows.left) ct[0] -= overflows.left;


                    var pan = ol.animation.pan({
                        duration: 500,
                        source: /** @type {ol.Coordinate} */ (view.getCenter())
                    });

                    var everDone;
                    olMap.beforeRender(function (map, frameState) {
                        var stillPanning = pan(map, frameState);
                        if (stillPanning) {
                            if (!everDone)
                                self.parent.map.$events.trigger($.Event(TC.Consts.event.PANANIMATIONSTART));
                            everDone = true;
                        }
                        else {
                            self.parent.map.$events.trigger($.Event(TC.Consts.event.PANANIMATIONEND));
                            everDone = false;
                        }
                        return stillPanning;
                    });

                    //olMap.beforeRender(pan);

                    view.setCenter(ct);
                }
            }
        }
    };

    TC.wrap.control.Popup.prototype.setDragged = function (dragged) {
        var popup = this.popup;
        //var view = popup.getMap().getView();
        //var onViewChange = function () {
        //    console.log(this.getCenter());
        //};
        if (dragged) {
            // Parcheamos funciones para que el popup no se mueva cuando cambiamos el extent del mapa
            if (!popup._oldUpdatePixelPosition) {
                popup._oldUpdatePixelPosition = popup.updatePixelPosition;
                popup.updatePixelPosition = function () {
                };
            }
            if (!popup._newHandleOffsetChanged) {
                popup._newHandleOffsetChanged = function () {
                    this._oldUpdatePixelPosition();
                };
                ol.events.unlisten(
                    popup, ol.Object.getChangeEventType(ol.OverlayProperty.OFFSET),
                    popup.handleOffsetChanged, popup);
                ol.events.listen(
                    popup, ol.Object.getChangeEventType(ol.OverlayProperty.OFFSET),
                    popup._newHandleOffsetChanged, popup);
            }
            //view.on(['change:center','change:resolution'], onViewChange);
        }
        else {
            delete this.parent._previousContainerPosition;
            // Deshacemos parcheo
            if (popup._oldUpdatePixelPosition) {
                popup.updatePixelPosition = popup._oldUpdatePixelPosition;
                delete popup._oldUpdatePixelPosition;
            }
            if (popup._newHandleOffsetChanged) {
                ol.events.unlisten(
                    popup, ol.Object.getChangeEventType(ol.OverlayProperty.OFFSET),
                    popup._newHandleOffsetChanged, popup);
                ol.events.listen(
                    popup, ol.Object.getChangeEventType(ol.OverlayProperty.OFFSET),
                    popup.handleOffsetChanged, popup);
                delete popup._newHandleOffsetChanged;
            }
            //view.un(['change:center', 'change:resolution'], onViewChange);
        }
    };

    TC.wrap.Feature.prototype.getLegend = function () {
        var self = this;
        var result = {
        };
        var style = self.feature.getStyle();

        if (typeof style === 'function') {
            style = style.call(self.feature);
        }
        if (style) {
            var image = style[0].getImage();
            if (image) {
                if (image instanceof ol.style.Icon) {
                    result.src = image.getSrc();
                }
                else if (image instanceof ol.style.Circle) {
                    result.src = image.canvas_.toDataURL();
                }
                if (self.parent.options.radius) {
                    result.height = result.width = self.parent.options.radius * 2;
                }
                else {
                    result.width = self.parent.options.width;
                    result.height = self.parent.options.height;
                }
            }
            else {
                // No image, find stroke and fill
                var stroke = style.getStroke();
                var fill = style.getFill();
                if (stroke) {
                    var strokeColor = stroke.getColor();
                    if (strokeColor) {
                        result.strokeColor = ol.color.asString(strokeColor);
                    }
                    var strokeWidth = stroke.getWidth();
                    if (strokeWidth) {
                        result.strokeWidth = strokeWidth;
                    }
                }
                if (fill) {
                    var fillColor = fill.getColor();
                    if (fillColor) {
                        result.fillColor = ol.color.asString(fillColor);
                    }
                }
            }
        }

        return result;
    };

    TC.wrap.Feature.prototype.createPoint = function (coords, options) {
        var self = this;

        if ($.isArray(coords)) {
            self.feature = new ol.Feature({
                geometry: new ol.geom.Point(coords)
            });
            var circleOptions = {
                radius: options.radius || (options.height + options.width) / 4
            };
            if (options.fillColor) {
                circleOptions.fill = new ol.style.Fill({
                    color: getRGBA(options.fillColor, options.fillOpacity)
                });
            }
            if (options.strokeColor) {
                circleOptions.stroke = new ol.style.Stroke({
                    color: options.strokeColor,
                    width: options.strokeWidth
                });
            }
            self.feature.setStyle([new ol.style.Style({
                image: new ol.style.Circle(circleOptions)
            })]);
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            self.parent.geometry = coords.getGeometry().getCoordinates();
        }
        self.feature._wrap = self;
    };

    TC.wrap.Feature.prototype.createMarker = function (coords, options) {
        var self = this;

        var iconUrl = TC.Util.getPointIconUrl(options);
        if (iconUrl) {
            if ($.isArray(coords)) {
                self.feature = new ol.Feature({
                    geometry: new ol.geom.Point(coords)
                });
                var styleOptions = {
                    image: new ol.style.Icon({
                        anchor: options.anchor,
                        src: iconUrl
                    })
                };
                self.feature.setStyle([new ol.style.Style(styleOptions)]);
            }
            else if (self.isNative(coords)) {
                self.feature = coords;
                self.parent.geometry = coords.getGeometry().getCoordinates();
            }
            self.feature._wrap = self;
        }
        else {
            self.createPoint(coords, options);
        }
    };

    TC.wrap.Feature.prototype.createPolyline = function (coords, options) {
        var self = this;

        if ($.isArray(coords)) {
            self.feature = new ol.Feature({
                geometry: new ol.geom.LineString(coords)
            });
            if (options) {
                self.feature.setStyle(
                        new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: options.strokeColor,
                                width: options.strokeWidth
                            })
                        })
                    );
            }
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            self.parent.geometry = coords.getGeometry().getCoordinates();
        }
        self.feature._wrap = self;
    };

    TC.wrap.Feature.prototype.createPolygon = function (coords, options) {
        var self = this;

        if ($.isArray(coords)) {
            if (coords.length > 0 && $.isArray(coords[0]) && coords[0].length > 0) {
                if (!$.isArray(coords[0][0])) {
                    // One ring
                    coords = [coords];
                }
                // Close rings
                for (var i = 0; i < coords.length; i++) {
                    var startPoint = coords[i][0];
                    var endPoint = coords[i][coords[i].length - 1];
                    if (startPoint[0] !== endPoint[0] || startPoint[1] !== endPoint[1]) {
                        coords[i][coords[i].length] = startPoint;
                    }
                }
                self.feature = new ol.Feature({
                    geometry: new ol.geom.Polygon(coords)
                });
                if (options) {
                    self.feature.setStyle(
                        new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: options.strokeColor,
                                width: options.strokeWidth
                            }),
                            fill: new ol.style.Fill({
                                color: getRGBA(options.fillColor, options.fillOpacity)
                            })
                        })
                    );
                }
            }
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            self.parent.geometry = coords.getGeometry().getCoordinates();
        }
        self.feature._wrap = self;
    };

    TC.wrap.Feature.prototype.createCircle = function (coords, options) {
        var self = this;

        if ($.isArray(coords) &&
            $.isArray(coords[0])
            && typeof coords[0][0] === 'number' && typeof coords[0][1] === 'number'
            && typeof coords[1] === 'number') {
            self.feature = new ol.Feature({
                geometry: new ol.geom.Circle(coords[0], coords[1])
            });
            if (options) {
                self.feature.setStyle(
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: options.strokeColor,
                            width: options.strokeWidth
                        }),
                        fill: new ol.style.Fill({
                            color: getRGBA(options.fillColor, options.fillOpacity)
                        })
                    })
                );
            }
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            var nativeGeometry = coords.getGeometry();
            self.parent.geometry = [nativeGeometry.getCenter(), nativeGeometry.getRadius()];
        }
        self.feature._wrap = self;
    };

    TC.wrap.Feature.createFeature = function (olFeat) {
        var result = new $.Deferred();
        var constructor;
        var condition;
        var olGeometry = olFeat.getGeometry();
        var options = {
            id: olFeat.getId(),
            data: olFeat.values_
        };
        if (olGeometry instanceof ol.geom.Point) {
            TC.loadJS(
                !TC.feature || (TC.feature && !TC.feature.Point),
                [TC.apiLocation + 'TC/feature/Point.js'],
                function () {
                    result.resolve(new TC.feature.Point(olFeat, options));
                }
            );
        }
        else {
            if (olGeometry instanceof ol.geom.LineString || olGeometry instanceof ol.geom.MultiLineString) {
                TC.loadJS(
                    !TC.feature || (TC.feature && !TC.feature.Polyline),
                    [TC.apiLocation + 'TC/feature/Polyline.js'],
                    function () {
                        result.resolve(new TC.feature.Polyline(olFeat, options));
                    }
                );
            }
            else {
                if (olGeometry instanceof ol.geom.Polygon || olGeometry instanceof ol.geom.MultiPolygon) {
                    TC.loadJS(
                        !TC.feature || (TC.feature && !TC.feature.Polygon),
                        [TC.apiLocation + 'TC/feature/Polygon.js'],
                        function () {
                            result.resolve(new TC.feature.Polygon(olFeat, options));
                        }
                    );
                }
                else {
                    TC.loadJS(
                        !TC.Feature,
                        [TC.apiLocation + 'TC/Feature.js'],
                        function () {
                            result.resolve(new TC.Feature(olFeat, options));
                        }
                    );
                }
            }
        }
        return result;
    };

    TC.wrap.Feature.prototype.getGeometry = function () {
        var result;
        var self = this;
        if (self.feature && self.feature.getGeometry) {
            var geom = self.feature.getGeometry();
            if (geom) {
                if (geom.getCoordinates) {
                    result = geom.getCoordinates();
                }
                else if (geom instanceof ol.geom.Circle) {
                    result = [geom.getCenter(), geom.getRadius()];
                }
            }
        }
        return result;
    };

    TC.wrap.Feature.prototype.setGeometry = function (geometry) {
        var result = false;
        var self = this;
        if (self.feature && self.feature.getGeometry) {
            var geom = self.feature.getGeometry();
            if (geom instanceof ol.geom.Point) {
                if ($.isArray(geometry) && typeof geometry[0] === 'number' && typeof geometry[1] === 'number') {
                    geom.setCoordinates(geometry);
                    result = true;
                }
            }
            else if (geom instanceof ol.geom.Circle) {
                if ($.isArray(geometry) &&
                    $.isArray(geometry[0])
                    && typeof geometry[0][0] === 'number' && typeof geometry[0][1] === 'number'
                    && typeof geometry[1] === 'number') {
                    geom.setCenterAndRadius(geometry[0], geometry[1]);
                    result = true;
                }
            }
        }
        return result;
    };

    TC.wrap.Feature.prototype.getId = function () {
        var result;
        var self = this;
        if (self.feature) {
            result = self.feature.getId();
        };
        return result;
    };

    TC.wrap.Feature.prototype.setStyle = function (options) {
        var self = this;
        var olFeat = self.feature;
        var feature = self.parent;
        var geom = olFeat.getGeometry();
        if (geom instanceof ol.geom.Point) {
            var imageOptions;
            if (options.anchor) { // Marcador
                imageOptions = new ol.style.Icon({
                    anchor: getStyleValue(options.anchor, feature),
                    src: TC.Util.getPointIconUrl(options),
                    size: [getStyleValue(options.width, feature), getStyleValue(options.height, feature)]
                });
            }
            else { // Punto sin icono
                var circleOptions = {
                    radius: getStyleValue(options.radius, feature) ||
                (getStyleValue(options.height, feature) + getStyleValue(options.width, feature)) / 4
                };
                if (options.fillColor) {
                    circleOptions.fill = new ol.style.Fill({
                        color: getRGBA(getStyleValue(options.fillColor, feature), getStyleValue(options.fillOpacity, feature))
                    });
                }
                if (options.strokeColor) {
                    circleOptions.stroke = new ol.style.Stroke({
                        color: getStyleValue(options.strokeColor, feature),
                        width: getStyleValue(options.strokeWidth, feature)
                    });
                }
                imageOptions = new ol.style.Circle(circleOptions);
            }
            olFeat.setStyle(new ol.style.Style({
                image: imageOptions
            }));
        }
        else if (geom instanceof ol.geom.LineString || geom instanceof ol.geom.MultiLineString) {
            olFeat.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: getStyleValue(options.strokeColor, feature),
                    width: getStyleValue(options.strokeWidth, feature)
                })
            }));
        }
        else if (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon) {
            olFeat.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: getStyleValue(options.strokeColor, feature),
                    width: getStyleValue(options.strokeWidth, feature)
                }),
                fill: new ol.style.Fill({
                    color: getRGBA(getStyleValue(options.fillColor, feature), getStyleValue(options.fillOpacity, feature))
                })
            }));
        }
    };

    TC.wrap.Feature.prototype.showPopup = function (popupCtl) {
        var self = this;
        var map = popupCtl.map;

        if (map) {
            var feature = self.feature;
            if (feature) {
                map.currentFeature = self.parent;
                // Funciones para hacer clipping con el extent actual. Así nos aseguramos de que el popup sale en un punto visible actualmente.
                var geometry = feature.getGeometry().clone();
                var currentExtent = map.getExtent();
                var clipCoord = function (coord) {
                    coord[0] = Math.min(Math.max(coord[0], currentExtent[0]), currentExtent[2]);
                    coord[1] = Math.min(Math.max(coord[1], currentExtent[1]), currentExtent[3]);
                };
                var clipGeometry = function clipGeometry(geom) {
                    if ($.isArray(geom)) {
                        if ($.isArray(geom[0])) {
                            for (var i = 0, len = geom.length; i < len; i++) {
                                clipGeometry(geom[i]);
                            }
                        }
                        else {
                            clipCoord(geom);
                        }
                    }
                };

                self._innerCentroid = geometry.getFirstCoordinate();
                switch (geometry.getType()) {
                    case 'MultiPolygon':
                        geometry = geometry.getPolygon(0);
                    case 'Polygon':
                        var isInsideRing = function (point, ring) {
                            var result = false;
                            for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                                var xi = ring[i][0], yi = ring[i][1];
                                var xj = ring[j][0], yj = ring[j][1];
                                var intersect = ((yi > point[1]) != (yj > point[1])) &&
                                    (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
                                if (intersect) result = !result;
                            }
                            return result;
                        };
                        var coords = geometry.getCoordinates();
                        clipGeometry(coords);
                        geometry = new ol.geom.Polygon(coords);
                        self._innerCentroid = geometry.getInteriorPoint().getCoordinates();
                        var rings = geometry.getLinearRings();
                        // Miramos si el punto está dentro de un agujero
                        for (var i = 1; i < rings.length; i++) {
                            if (isInsideRing(self._innerCentroid, rings[i].getCoordinates())) {
                                self._innerCentroid = geometry.getClosestPoint(self._innerCentroid);
                                break;
                            }
                        }
                        break;
                    case 'MultiLineString':
                        geometry = geometry.getLineString(0);
                    case 'LineString':
                        var centroid = [0, 0];
                        var coords = geometry.getCoordinates();
                        clipGeometry(coords);
                        geometry = new ol.geom.LineString(coords);
                        for (var i = 0; i < coords.length; i++) {
                            centroid[0] += coords[i][0];
                            centroid[1] += coords[i][1];
                        }
                        centroid[0] /= coords.length;
                        centroid[1] /= coords.length;
                        self._innerCentroid = geometry.getClosestPoint(centroid);
                        break;
                    default:
                        break;
                }
                popupCtl.$contentDiv.html(self.parent.getInfo());
                if (popupCtl.options.closeButton) {
                    var n = popupCtl.$popupDiv.find("." + popupCtl.CLASS + '-close').length;
                    if (n == 0) {
                        var $btn = $('<div>').addClass(popupCtl.CLASS + '-close').attr('title', popupCtl.getLocaleString('close')).appendTo(popupCtl.$popupDiv);
                        $btn.on(TC.Consts.event.CLICK, function () {
                            popupCtl.hide();
                        });
                        popupCtl.$contentDiv.addClass(popupCtl.CLASS + '-has-btn');
                        // En OL2 los featureInfo en versión "baraja de cartas" salen sin tamaño.
                        // Para evitar esto, la clase tc-ctl-finfo tiene ancho y alto establecidos.
                        // Pero eso hace que en el popup salgan barras de scroll, porque contentDiv se crea demasiado pequeño.
                        // Rehacemos el tamaño de tc-ctl-finfo para eliminarlas.
                        popupCtl.$contentDiv.find('.tc-ctl-finfo').css('width', 'auto').css('height', 'auto');
                    }
                }

                var options = self.parent.options;
                // Calcular anchor
                var anchor;
                if (options.anchor) {
                    anchor = options.anchor;
                }
                else {
                    var style;
                    var f = feature._wrap.parent;
                    for (var i = 0; i < map.workLayers.length; i++) {
                        var layer = map.workLayers[i];
                        if (!layer.isRaster()) {
                            if ($.inArray(f, layer.features) >= 0) {
                                style = styleFunction(feature);
                                break;
                            }
                        }
                    }
                    if ($.isArray(style)) {
                        var image = style[0].getImage();
                        anchor = !image || image instanceof ol.style.Icon ? [0.5, 0] : [0.5, 0.5];
                    }
                }
                if (anchor && options.height) {
                    popupCtl.wrap.popup.setOffset([0, -options.height * anchor[1]]);
                }
                else {
                    popupCtl.wrap.popup.setOffset([0, 0]);
                }

                popupCtl.wrap.popup.setPosition(self._innerCentroid);
                popupCtl.$popupDiv.addClass(TC.Consts.classes.VISIBLE);
            } else {
                map.wrap.hidePopup(popupCtl);
            }
        }
    };

    TC.wrap.Feature.prototype.isNative = function (feature) {
        return feature instanceof ol.Feature;
    };

    TC.wrap.Feature.prototype.getPath = function () {
        var result = [];
        var self = this;
        if (self.feature && self.feature._folders) {
            result = self.feature._folders;
        }
        return result;
    };

    TC.wrap.Feature.prototype.getBounds = function () {
        var result = null;
        var self = this;
        if (self.feature) {
            result = self.feature.getGeometry().getExtent();
        }
        return result;
    };

    TC.wrap.Feature.prototype.getTemplate = function () {
        var result = null;
        var self = this;
        var style = self.feature.getStyle();
        if (typeof style === 'function') {
            style = style.call(self.feature);
        }
        if ($.isArray(style)) {
            for (var i = 0; i < style.length; i++) {
                if (style[i]._balloon) {
                    var s = style[i]._balloon.getText();
                    if (s) {
                        style = style[i]._balloon;
                        break;
                    }
                }
            }
        }
        if (style && !$.isArray(style) && style.getText) {
            result = style.getText();
        }
        return result;
    };

    TC.wrap.Feature.prototype.getData = function () {
        var result = this.feature.getProperties();
        // En caso de clusters
        if ($.isArray(result.features)) {
            if (result.features.length === 1) {
                result = result.features[0].getProperties();
            }
            else {
                result = result.features.length + ' elementos';
            }
        }
        if (result.geometry) {
            delete result.geometry;
        }
        return result;
    };


    TC.wrap.control.Draw.prototype.mouseMoveHandler = function (evt) {
        var self = evt.data;
        if (self.sketch) {
            self.parent.$events.trigger($.Event(TC.Consts.event.MEASUREPARTIAL, self.getMeasureData()));
        }
    };

    TC.wrap.control.Draw.prototype.mouseOverHandler = function (evt) {
        var self = evt.data;
        if (self.sketch && self.hoverCoordinate) {
            self.pushCoordinate(self.hoverCoordinate);
            self.hoverCoordinate = null;
        }
    };

    TC.wrap.control.Draw.prototype.clickHandler = function (evt) {
        var self = evt.data;
        if (self.sketch) {
            var output;
            var data = {
            };
            var coords = self.sketch.getGeometry().getCoordinates();
            self.parent.$events.trigger($.Event(TC.Consts.event.POINT, {
                point: coords[coords.length - 1]
            }));
        }
    };

    TC.wrap.control.Draw.prototype.getGeometry = function () {
        var result = {
        };
        if (this.sketch) {

            var geom = (this.sketch.getGeometry());
            if (geom instanceof ol.geom.Polygon)
                result.geometry = new TC.feature.Polygon(geom.getCoordinates());
            else if (geom instanceof ol.geom.LineString)
                result.geometry = new TC.feature.Polyline(geom.getCoordinates());
        }
        return result;
    };

    TC.wrap.control.Draw.prototype.getMeasureData = function () {
        var self = this;
        var formatLength = function (line, data) {
            data.length = line.getLength();
            data.units = self.units;
            if (data.length > 100 && self.units === ol.proj.Units.METERS) {
                data.length = data.length / 1000;
                data.units = 'km';
            }
        };

        var formatArea = function (polygon, data) {
            data.area = polygon.getArea();
            var ring = polygon.getLinearRing(0);
            data.perimeter = ol.geom.flat.length.linearRing(ring.flatCoordinates, 0, ring.flatCoordinates.length, ring.stride);
            data.units = self.units;
            if (data.area > 10000 && self.units === ol.proj.Units.METERS) {
                data.area = data.area / 1000000;
                data.perimeter = data.perimeter / 1000;
                data.units = 'km';
            }
        };

        var result = {
        };
        if (this.sketch) {
            var geom = (this.sketch.getGeometry());
            if (geom instanceof ol.geom.Polygon) {
                formatArea(geom, result);
            }
            else if (geom instanceof ol.geom.LineString) {
                formatLength(geom, result);
            }
        }

        return result;
    };

    TC.wrap.control.Draw.prototype.activate = function (mode) {
        var self = this;

        var type = mode === TC.Consts.geom.POLYGON ? ol.geom.GeometryType.POLYGON : ol.geom.GeometryType.LINE_STRING;
        if (self.parent.map) {
            $.when(self.parent.map.wrap.getMap(), self.parent.getLayer()).then(function (olMap, layer) {
                self.units = olMap.getView().getProjection().getUnits();

                $.when(layer.wrap.getLayer()).then(function (olLayer) {

                    if (!self.$viewport) self.$viewport = $(olMap.getViewport());

                    if (self.interaction) {
                        olMap.removeInteraction(self.interaction);
                        self.$viewport
                            .off(TC.Consts.event.CLICK, self.clickHandler)
                        if (self.parent.measure)
                            self.$viewport
                            .off(MOUSEMOVE + '.draw', self.mouseMoveHandler)
                            .off(MOUSEOVER, self.mouseOverHandler);
                    }

                    if (mode) {
                        self.$viewport
                            .on(TC.Consts.event.CLICK, self, self.clickHandler)
                        if (self.parent.measure)
                            self.$viewport
                            .on(MOUSEMOVE + '.draw', self, self.mouseMoveHandler)
                            .on(MOUSEOVER, self, self.mouseOverHandler);

                        var drawOptions = {
                            source: olLayer.getSource(),
                            type: type,
                            style: olLayer.getStyle(),
                            snapTolerance: 0

                        };
                        if (mode === TC.Consts.geom.RECTANGLE) {
                            drawOptions.type = ol.geom.GeometryType.LINE_STRING;
                            drawOptions.maxPoints = 2;
                            drawOptions.geometryFunction = function (coordinates, geometry) {
                                if (!geometry) {
                                    geometry = new ol.geom.Polygon(null);
                                }
                                var start = coordinates[0];
                                var end = coordinates[1];
                                geometry.setCoordinates([
                                  [start, [start[0], end[1]], end, [end[0], start[1]], start]
                                ]);
                                return geometry;
                            };
                        }
                        self.interaction = new ol.interaction.Draw(drawOptions);

                        self.interaction.on('drawstart', function (evt) {
                            self.sketch = evt.feature;
                        }, this);

                        self.interaction.on('drawend', function (evt) {
                            if (self.parent.measure)
                                self.parent.$events.trigger($.Event(TC.Consts.event.MEASURE, self.getMeasureData()));
                            else
                                self.parent.$events.trigger($.Event(TC.Consts.event.DRAWEND, self.getGeometry()));
                            self.sketch = null;
                        }, this);

                        olMap.addInteraction(self.interaction);
                    }

                    self.redoStack = [];
                });
            });
        }
    };

    TC.wrap.control.Draw.prototype.deactivate = function () {
        var self = this;
        if (self.parent.map) {
            $.when(self.parent.map.wrap.getMap(), self.parent.getLayer()).then(function (olMap, layer) {
                if (layer) {
                    layer.clearFeatures();
                    olMap.removeInteraction(self.interaction);
                }
            });
        }
    };

    //El valor devuelto es lo que va al stack de redo
    TC.wrap.control.Draw.prototype.popCoordinate = function () {
        var self = this;
        var result = null;
        if (self.interaction) {
            var feature = self.interaction.sketchFeature_;
            if (feature) {
                var coords;
                var geom = feature.getGeometry();

                if (geom instanceof ol.geom.Polygon) {
                    coords = geom.getCoordinates()[0];
                }
                else if (geom instanceof ol.geom.LineString) {
                    coords = geom.getCoordinates();
                }
                var fullCoords = coords;
                if (coords.length > 1) {

                    var puntos;
                    if (geom instanceof ol.geom.Polygon)
                        puntos = self.interaction.sketchCoords_[0];
                    else if (geom instanceof ol.geom.LineString)
                        puntos = self.interaction.sketchCoords_;

                    /*
                    Al menos con linestring, no necesariamente hay que quitar el último
                    Porque OL mete en coordinates del sketchFeature_ tanto el último marcado como el que flota detrás del cursor
                    Para comprobar que realmente es ése, podemos contrastarlo con self.interaction.sketchPoint_.getGeometry().getCoordinates()
                    */
                    var flyingPointContained = false;
                    if (self.interaction.sketchPoint_) {
                        var flyingPoint = self.interaction.sketchPoint_.getGeometry().getCoordinates();
                        for (var i = 0; i < coords.length; i++) {
                            if (coords[i][0] == flyingPoint[0] && coords[i][1] == flyingPoint[1]) {
                                flyingPointContained = true;
                                break;
                            }
                        }
                    }

                    var index;
                    if (flyingPointContained) index = puntos.length - 2;
                    else index = puntos.length - 1;

                    result = puntos[index];
                    puntos.splice(index, 1);

                    if (geom instanceof ol.geom.Polygon) {
                        geom.setCoordinates([puntos]);
                        self.interaction.sketchLine_.getGeometry().setCoordinates(puntos);
                    }
                    else {
                        geom.setCoordinates(puntos);
                    }


                    feature.setGeometry(geom);
                }
            }
        }
        return result;
    };

    TC.wrap.control.Draw.prototype.pushCoordinate = function (coord) {
        var self = this;
        var result = false;
        if (self.interaction) {
            var feature = self.interaction.sketchFeature_;
            if (feature) {
                var coords;
                var geom = feature.getGeometry();

                if (geom instanceof ol.geom.Polygon) {
                    coords = geom.getCoordinates()[0];
                } else if (geom instanceof ol.geom.LineString) {
                    coords = geom.getCoordinates();
                }
                var fullCoords = coords;
                //coords.push(coord);

                var puntos;
                if (geom instanceof ol.geom.Polygon) {
                    puntos = self.interaction.sketchCoords_[0];
                    //self.interaction.sketchCoords_[0].push(coord);
                    //geom.setCoordinates([fullCoords], ol.geom.GeometryLayout.XY);
                } else if (geom instanceof ol.geom.LineString) {

                    puntos = self.interaction.sketchCoords_;
                }

                //Si hay punto volador, hay que meter la coordenada justo antes
                var flyingPointContained = false;
                if (self.interaction.sketchPoint_) {
                    var flyingPoint = self.interaction.sketchPoint_.getGeometry().getCoordinates();
                    for (var i = 0; i < coords.length; i++) {
                        if (coords[i][0] == flyingPoint[0] && coords[i][1] == flyingPoint[1]) {
                            flyingPointContained = true;
                            break;
                        }
                    }
                }


                if (flyingPointContained) index = puntos.length - 1;
                else index = puntos.length;
                puntos.splice(index, 0, coord);

                if (geom instanceof ol.geom.LineString)
                    geom.setCoordinates(puntos, ol.geom.GeometryLayout.XY);
                else {
                    geom.setCoordinates([puntos], ol.geom.GeometryLayout.XY);
                    self.interaction.sketchLine_.getGeometry().setCoordinates(puntos);
                    //feature.setGeometry(geom);
                }


                result = true;
            }
        }
        return result;
    };

    TC.wrap.control.Draw.prototype.undo = function () {
        var self = this;
        var result = false;

        var coord = self.popCoordinate();
        if (coord) {
            self.redoStack.push(coord);
            result = true;
        }

        self.parent.$events.trigger($.Event(TC.Consts.event.MEASUREPARTIAL, self.getMeasureData()));

        return result;
    };

    TC.wrap.control.Draw.prototype.redo = function () {
        var self = this;
        var result = false;

        if (self.redoStack.length > 0) {
            self.pushCoordinate(self.redoStack.pop());
            result = true;
        }

        self.parent.$events.trigger($.Event(TC.Consts.event.MEASUREPARTIAL, self.getMeasureData()));

        return result;
    };

    TC.wrap.control.Draw.prototype.end = function () {
        var self = this;
        if (self.interaction && self.interaction.sketchFeature_)
            self.interaction.finishDrawing();
    };

    TC.wrap.control.CacheBuilder.prototype.getRequestSchemas = function (options) {
        var self = this;
        var extent = options.extent;
        var layers = options.layers;
        var result = new Array(layers.length);
        for (var i = 0, len = result.length; i < len; i++) {
            var schema = {
                layerId: layers[i].id
            };
            var olSource = layers[i].wrap.layer.getSource();
            if (olSource.getUrls) {
                schema.url = olSource.getUrls()[0];
            }
            if (olSource.getTileGrid) {
                var tileGrid = olSource.getTileGrid();
                var resolutions = tileGrid.getResolutions();
                var matrixIds = tileGrid.getMatrixIds();
                schema.tileMatrixLimits = new Array(resolutions.length);
                for (var j = 0, rlen = resolutions.length; j < rlen; j++) {
                    var origin = tileGrid.getOrigin(j);
                    var tileSize = tileGrid.getTileSize(j);
                    var resolution = resolutions[j];
                    var unitsPerTile = tileSize * resolution;
                    var tml = {
                        mId: matrixIds[j],
                        res: resolution,
                        origin: origin,
                        tSize: tileSize,
                        cl: Math.floor((extent[0] - origin[0]) / unitsPerTile),
                        cr: Math.floor((extent[2] - origin[0]) / unitsPerTile),
                        rt: Math.floor((origin[1] - extent[3]) / unitsPerTile),
                        rb: Math.floor((origin[1] - extent[1]) / unitsPerTile)
                    }
                    schema.tileMatrixLimits[j] = tml;
                }
            }
            result[i] = schema;
        }
        return result;
    };

    TC.wrap.control.CacheBuilder.prototype.getUrlPattern = function (layer) {
        var result = "";
        var olSource = layer.wrap.layer.getSource();
        if (olSource.getUrls) {
            result = olSource.getUrls()[0];
        }
        return result;
    };

})();

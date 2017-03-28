//if (!window.ol) {
//    TC.syncLoadJS(TC.url.ol);
//}
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

    // Reescribimos la obtenci\u00f3n de proyecci\u00f3n para que soporte c\u00f3digos tipo EPSG:X, urn:ogc:def:crs:EPSG::X y http://www.opengis.net/gml/srs/epsg.xml#X
    ol.proj.oldGet = ol.proj.get;
    ol.proj.get = function (projectionLike) {
        if (typeof projectionLike === 'string') {
            for (var i = 0, len = ol.proj.EPSG4326.PROJECTIONS.length; i < len; i++) {
                var proj = ol.proj.EPSG4326.PROJECTIONS[i];
                if (proj.getCode() === projectionLike) {
                    return proj;
                }
            }
            TC.loadProjDef(projectionLike, true);
        }
        return ol.proj.oldGet(projectionLike);
    };

    // Reescritura de c\u00f3digo para transformar las geometr\u00edas de getFeatureInfo que est\u00e1n en un CRS distinto
    ol.format.GMLBase.prototype.readGeometryElement = function (node, objectStack) {
        var context = /** @type {Object} */ (objectStack[0]);
        var srsName = context['srsName'] = node.firstElementChild.getAttribute('srsName');
        /** @type {ol.geom.Geometry} */

        // Parche para poder leer coordenadas en EPSG:4326 con orden incorrecto (las crea QGIS, por ejemplo)
        if (this instanceof ol.format.GML2CRS84 || this instanceof ol.format.GML3CRS84) {
            if (srsName !== 'EPSG:4326' || !srsName) {
                throw "Conflicto de CRS";
            }
        }
        if (srsName) {
            context.srsName = this.srsName || srsName;
            context.dataProjection = ol.proj.get(context.srsName);
        }
        var geometry = ol.xml.pushParseAndPop(null,
            this.GEOMETRY_PARSERS_, node, objectStack, this);
        if (geometry) {
            return /** @type {ol.geom.Geometry} */ (
                ol.format.Feature.transformWithOptions(geometry, false, context));
        } else {
            return undefined;
        }
    };

    // Reescritura de c\u00f3digo para hacerlo compatible con GML generado por inspire:
    // No se puede considerar geometr\u00eda cualquier cosa que tenga elementos anidados.
    ol.format.GMLBase.prototype.readFeatureElement = function (node, objectStack) {
        var n;
        var fid = node.getAttribute('fid') ||
            ol.xml.getAttributeNS(node, ol.format.GMLBase.GMLNS, 'id');
        var values = {}, geometryName;
        for (n = node.firstElementChild; n; n = n.nextElementSibling) {
            var localName = n.localName;
            // Assume attribute elements have one child node and that the child
            // is a text or CDATA node (to be treated as text).
            // Otherwise assume it is a geometry node.
            if (n.childNodes.length === 0 ||
                (n.childNodes.length === 1 &&
                (n.firstChild.nodeType === 3 || n.firstChild.nodeType === 4))) {
                var value = ol.xml.getAllTextContent(n, false);
                if (ol.format.GMLBase.ONLY_WHITESPACE_RE_.test(value)) {
                    value = undefined;
                }
                values[localName] = value;
            } else {
                if (values[localName] = this.readGeometryElement(n, objectStack)) {
                    // boundedBy is an extent and must not be considered as a geometry
                    // Tampoco referencePoint
                    if (localName !== 'boundedBy' && localName !== 'referencePoint') {
                        geometryName = localName;
                    }
                }
            }
        }
        var feature = new ol.Feature(values);
        if (geometryName) {
            feature.setGeometryName(geometryName);
        }
        if (fid) {
            feature.setId(fid);
        }
        return feature;
    };

    // A\u00f1adido el espacio de nombres de GML 3.2 al parser
    var gmlNamespace = 'http://www.opengis.net/gml';
    var gml32Namespace = 'http://www.opengis.net/gml/3.2';
    ol.format.GMLBase.prototype.MULTIPOINT_PARSERS_[gml32Namespace] = ol.format.GMLBase.prototype.MULTIPOINT_PARSERS_[gmlNamespace];
    ol.format.GMLBase.prototype.MULTILINESTRING_PARSERS_[gml32Namespace] = ol.format.GMLBase.prototype.MULTILINESTRING_PARSERS_[gmlNamespace];
    ol.format.GMLBase.prototype.MULTIPOLYGON_PARSERS_[gml32Namespace] = ol.format.GMLBase.prototype.MULTIPOLYGON_PARSERS_[gmlNamespace];
    ol.format.GMLBase.prototype.POINTMEMBER_PARSERS_[gml32Namespace] = ol.format.GMLBase.prototype.POINTMEMBER_PARSERS_[gmlNamespace];
    ol.format.GMLBase.prototype.LINESTRINGMEMBER_PARSERS_[gml32Namespace] = ol.format.GMLBase.prototype.LINESTRINGMEMBER_PARSERS_[gmlNamespace];
    ol.format.GMLBase.prototype.POLYGONMEMBER_PARSERS_[gml32Namespace] = ol.format.GMLBase.prototype.POLYGONMEMBER_PARSERS_[gmlNamespace];
    ol.format.GMLBase.prototype.RING_PARSERS[gml32Namespace] = ol.format.GMLBase.prototype.RING_PARSERS[gmlNamespace];
    ol.format.GML3.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.FLAT_LINEAR_RINGS_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.FLAT_LINEAR_RINGS_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.GEOMETRY_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.GEOMETRY_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.MULTICURVE_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.MULTICURVE_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.MULTISURFACE_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.MULTISURFACE_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.CURVEMEMBER_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.CURVEMEMBER_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.SURFACEMEMBER_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.SURFACEMEMBER_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.SURFACE_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.SURFACE_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.CURVE_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.CURVE_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.ENVELOPE_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.ENVELOPE_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.PATCHES_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.PATCHES_PARSERS_[gmlNamespace];
    ol.format.GML3.prototype.SEGMENTS_PARSERS_[gml32Namespace] = ol.format.GML3.prototype.SEGMENTS_PARSERS_[gmlNamespace];

    // Rehacemos los estilos por defecto de KML para que se adec\u00faen al de la API
    ol.format.KML._createStyleDefaults_ = ol.format.KML.createStyleDefaults_;
    ol.format.KML.createStyleDefaults_ = function () {
        ol.format.KML._createStyleDefaults_();

        ol.format.KML.DEFAULT_FILL_STYLE_.color_ = getRGBA(TC.Cfg.styles.polygon.fillColor, TC.Cfg.styles.polygon.fillOpacity);
        ol.format.KML.DEFAULT_TEXT_STYLE_.fill_ = new ol.style.Fill({
            color: ol.format.KML.DEFAULT_COLOR_
        });
        ol.format.KML.DEFAULT_STROKE_STYLE_.color_ = getRGBA(TC.Cfg.styles.line.strokeColor, 1);
        ol.format.KML.DEFAULT_STROKE_STYLE_.width_ = TC.Cfg.styles.line.strokeWidth;

        return ol.format.KML.DEFAULT_STYLE_ARRAY_;
    };


    // Reescritura de c\u00f3digo para leer las carpetas del KML
    ol.format.KML.prototype._readDocumentOrFolder_ = ol.format.KML.prototype.readDocumentOrFolder_;
    ol.format.KML.prototype.readDocumentOrFolder_ = function (node, objectStack) {
        var result = ol.format.KML.prototype._readDocumentOrFolder_.apply(this, arguments);
        if (node.localName == "Folder") {
            for (var i = 0; i < result.length; i++) {
                var feature = result[i];
                if (!$.isArray(feature._folders)) {
                    feature._folders = [];
                }
                var nameElm = node.getElementsByTagName('name')[0];
                if (nameElm) {
                    //feature._folders.unshift(nameElm.innerHTML || nameElm.textContent);
                    // Versi\u00f3n r\u00e1pida de unshift
                    TC.Util.fastUnshift(feature._folders, nameElm.innerHTML || nameElm.textContent);
                }
            }
        }
        return result;
    };

    // Creamos un parser para interpretar la plantilla de los bocadillos
    ol.format.KML.readText_ = function (node, objectStack) {
        ol.asserts.assert(node.nodeType == Node.ELEMENT_NODE);
        ol.asserts.assert(node.localName == 'text');
        var s = ol.xml.getAllTextContent(node, false);
        return s.trim();
    };

    //ol.format.KML.DEFAULT_BALLOON_STYLE_ = new ol.style.Text();

    ol.format.KML.BALLOON_STYLE_PARSERS_ = ol.xml.makeStructureNS(
        ol.format.KML.NAMESPACE_URIS_, {
            'text': ol.xml.makeObjectPropertySetter(ol.format.KML.readText_),
        });

    ol.format.KML.BalloonStyleParser_ = function (node, objectStack) {
        ol.asserts.assert(node.nodeType == Node.ELEMENT_NODE);
        ol.asserts.assert(node.localName == 'BalloonStyle');
        // FIXME colorMode
        var object = ol.xml.pushParseAndPop(
            {}, ol.format.KML.BALLOON_STYLE_PARSERS_, node, objectStack);
        if (!goog.isDef(object)) {
            return;
        }
        var styleObject = objectStack[objectStack.length - 1];
        ol.asserts.assert(goog.isObject(styleObject));
        var textStyle = new ol.style.Text({
            text: (object['text'])
        });
        styleObject['balloonStyle'] = textStyle;
    };

    for (var key in ol.format.KML.STYLE_PARSERS_) {
        var parser = ol.format.KML.STYLE_PARSERS_[key];
        parser['BalloonStyle'] = ol.format.KML.BalloonStyleParser_;
    }

    // Parche a esta funci\u00f3n para meter la lectura de balloonStyle
    ol.format.KML.readStyle_ = function (node, objectStack) {
        var styleObject = ol.xml.pushParseAndPop(
            {}, ol.format.KML.STYLE_PARSERS_, node, objectStack);
        if (!styleObject) {
            return null;
        }
        var fillStyle = /** @type {ol.style.Fill} */
            ('fillStyle' in styleObject ?
                styleObject['fillStyle'] : ol.format.KML.DEFAULT_FILL_STYLE_);
        var fill = /** @type {boolean|undefined} */ (styleObject['fill']);
        if (fill !== undefined && !fill) {
            fillStyle = null;
        }
        var imageStyle = /** @type {ol.style.Image} */
            ('imageStyle' in styleObject ?
                styleObject['imageStyle'] : ol.format.KML.DEFAULT_IMAGE_STYLE_);
        if (imageStyle == ol.format.KML.DEFAULT_NO_IMAGE_STYLE_) {
            imageStyle = undefined;
        }
        var textStyle = /** @type {ol.style.Text} */
            ('textStyle' in styleObject ?
                styleObject['textStyle'] : ol.format.KML.DEFAULT_TEXT_STYLE_);
        var strokeStyle = /** @type {ol.style.Stroke} */
            ('strokeStyle' in styleObject ?
                styleObject['strokeStyle'] : ol.format.KML.DEFAULT_STROKE_STYLE_);
        var balloonStyle =
            ('balloonStyle' in styleObject ?
                styleObject['balloonStyle'] : ol.format.KML.DEFAULT_BALLOON_STYLE_);
        var outline = /** @type {boolean|undefined} */
            (styleObject['outline']);
        if (outline !== undefined && !outline) {
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

    // flacunza: Parche para evitar peticiones HTTP desde una p\u00e1gina HTTPS
    ol.format.KML._readURI_ = ol.format.KML.readURI_;
    ol.format.KML.readURI_ = function (node) {
        var result = ol.format.KML._readURI_(node);
        if (location.protocol === 'https:' && result.indexOf('http://') === 0) {
            result = result.substr(5);
        }
        return result;
    };
    for (var key in ol.format.KML.ICON_PARSERS_) {
        ol.format.KML.ICON_PARSERS_[key].href = ol.xml.makeObjectPropertySetter(ol.format.KML.readURI_);
    }

    // GLS: La expresi\u00f3n regular que valida el formato de fecha ISO no contempla que la fecha contenga fracci\u00f3n de segundo, seg\u00fan https://www.w3.org/TR/NOTE-datetime 
    ol.format.KML.whenParser_ = function (a, b) {
        ol.asserts.assert(a.nodeType == Node.ELEMENT_NODE, "node.nodeType should be ELEMENT");
        ol.asserts.assert("when" == a.localName, "localName should be when");
        var c = b[b.length - 1];
        ol.asserts.assert(goog.isObject(c), "gxTrackObject should be an Object");
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

    var namespaceURISmanage = function (source, format) {
        var xml = ol.xml.parse(source);
        var tag = xml.getElementsByTagName(format.toLowerCase());
        if (tag && tag.length > 0) {
            var value = tag[0].getAttribute('xmlns');
            if (value.indexOf(' ') > -1 && customKMLNameSpaceURIS.indexOf(value) > -1) {
                var values = value.split(' ');
                var namespaces = [];
                for (var i = 0; i < values.length; i++) {
                    namespaces.push(('xmlns:' + format.toLowerCase() + i) + "=\"" + values[i].trim() + "\"");
                }
            }
        }

        return source;
    };

    // flacunza: Parcheo para poder leer KMLs generados por Google Earth. En ellos falta el atributo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    // que se utiliza luego en xsi:schemaLocation, haciendo que el DOMParser no lea el elemento Placemark.
    ol.format.KML.prototype.readFeatures = function (source, opt_options) {
        if (typeof source === 'string') {
            var kmlTag = '<kml';
            var startIdx = source.indexOf(kmlTag);
            if (startIdx >= 0) {
                startIdx += kmlTag.length;
                var endIdx = source.indexOf('>', startIdx);
                if (source.indexOf('xmlns:xsi=') < 0) {
                    source = source.substr(0, startIdx) + ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' + source.substr(startIdx);
                }

                source = namespaceURISmanage(source, 'KML');
            }
        }
        return ol.format.XMLFeature.prototype.readFeatures.call(this, source, opt_options);
    };

    // GLS: La expresi\u00f3n regular que valida el formato de fecha ISO no contempla que la fecha contenga fracci\u00f3n de segundo, seg\u00fan https://www.w3.org/TR/NOTE-datetime 
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

    ol.format.XSD.writeDateTimeTextNode = function (node, dateTime) {
        var date = new Date(dateTime);
        var string = date.getUTCFullYear() + '-' +
            goog.string.padNumber(date.getUTCMonth() + 1, 2) + '-' +
            goog.string.padNumber(date.getUTCDate(), 2) + 'T' +
            goog.string.padNumber(date.getUTCHours(), 2) + ':' +
            goog.string.padNumber(date.getUTCMinutes(), 2) + ':' +
            goog.string.padNumber(date.getUTCSeconds(), 2) + 'Z';
        node.appendChild(ol.xml.DOCUMENT.createTextNode(string));
    };

    ol.format.GPX.WPT_TYPE_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
        'ele': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
        'time': ol.xml.makeChildAppender(ol.format.XSD.writeDateTimeTextNode),
        'magvar': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
        'geoidheight': ol.xml.makeChildAppender(
            ol.format.XSD.writeDecimalTextNode),
        'name': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
        'cmt': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
        'desc': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
        'src': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
        'link': ol.xml.makeChildAppender(ol.format.GPX.writeLink_),
        'sym': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
        'type': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
        'fix': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
        'sat': ol.xml.makeChildAppender(
            ol.format.XSD.writeNonNegativeIntegerTextNode),
        'hdop': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
        'vdop': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
        'pdop': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
        'ageofdgpsdata': ol.xml.makeChildAppender(
            ol.format.XSD.writeDecimalTextNode),
        'dgpsid': ol.xml.makeChildAppender(
            ol.format.XSD.writeNonNegativeIntegerTextNode)
    });

    // GLS: Obtenemos las combinaciones posibles
    var getAllCombinations = function (array) {
        var combi = [];
        var temp = [];

        var len = Math.pow(2, array.length);

        for (var i = 0; i < len ; i++) {
            temp = [];
            for (var j = 0; j < array.length; j++) {
                if ((i & Math.pow(2, j))) {
                    if (temp.indexOf(array[j]) == -1)
                        temp.push(array[j]);
                }
            }
            if (temp.length > 0) {
                if (combi.indexOf(temp.join(' ')) == -1)
                    combi.push(temp.join(' '));
            }
        }

        return combi;
    }

    // GLS: Limpiamos de los nuevos los URIS ya disponibles en el formato
    var cleanCombinationsByFormat = function (customURIS, formatURIS) {
        if (customURIS && customURIS.length > 0) {
            for (var i = 0; i < formatURIS.length; i++) {
                var index = customURIS.indexOf(formatURIS[i]);
                if (index > -1)
                    customURIS.splice(index, 1);
            }
        }
    };

    // GLS: Establecemos los parser por formato para los nuevos URIS
    var setNewParsersByFormat = function (parsers, customURIS) {
        for (var i = 0; i < parsers.length; i++) {
            var parser = parsers[i];
            for (var j = 0; j < customURIS.length; j++) {
                var analogFormat = customURIS[j].split(' ')[0];
                parser[customURIS[j]] = parser[analogFormat];
            }
        }
    };

    var KML_PARSERS = [
        ol.format.KML.DATA_PARSERS_,
        ol.format.KML.EXTENDED_DATA_PARSERS_,
        ol.format.KML.REGION_PARSERS_,
        ol.format.KML.LAT_LON_ALT_BOX_PARSERS_,
        ol.format.KML.LOD_PARSERS_,
        ol.format.KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_,
        ol.format.KML.FLAT_LINEAR_RING_PARSERS_,
        ol.format.KML.FLAT_LINEAR_RINGS_PARSERS_,
        ol.format.KML.GX_TRACK_PARSERS_,
        ol.format.KML.GEOMETRY_FLAT_COORDINATES_PARSERS_,
        ol.format.KML.ICON_PARSERS_,
        ol.format.KML.ICON_STYLE_PARSERS_,
        ol.format.KML.INNER_BOUNDARY_IS_PARSERS_,
        ol.format.KML.LABEL_STYLE_PARSERS_,
        ol.format.KML.LINE_STYLE_PARSERS_,
        ol.format.KML.MULTI_GEOMETRY_PARSERS_,
        ol.format.KML.GX_MULTITRACK_GEOMETRY_PARSERS_,
        ol.format.KML.NETWORK_LINK_PARSERS_,
        ol.format.KML.LINK_PARSERS_,
        ol.format.KML.OUTER_BOUNDARY_IS_PARSERS_,
        ol.format.KML.PAIR_PARSERS_,
        ol.format.KML.PLACEMARK_PARSERS_,
        ol.format.KML.POLY_STYLE_PARSERS_,
        ol.format.KML.SCHEMA_DATA_PARSERS_,
        ol.format.KML.STYLE_PARSERS_,
        ol.format.KML.STYLE_MAP_PARSERS_
    ];

    // GLS: Obtenemos los nuevos URIS para KML
    var customKMLNameSpaceURIS = getAllCombinations(ol.format.KML.NAMESPACE_URIS_.slice().slice(1));
    // GLS: Nos quedamos con las combinaciones nuevas
    cleanCombinationsByFormat(customKMLNameSpaceURIS, ol.format.KML.NAMESPACE_URIS_);
    // GLS: A\u00f1adimos los nuevos URIS al KML
    ol.format.KML.NAMESPACE_URIS_ = ol.format.KML.NAMESPACE_URIS_.concat(customKMLNameSpaceURIS);
    // GLS: Establecemos los parsers del KML para los nuevos URIS
    setNewParsersByFormat(KML_PARSERS, customKMLNameSpaceURIS);


    var GPX_PARSERS = [
        ol.format.GPX.GPX_PARSERS_,
        ol.format.GPX.LINK_PARSERS_,
        ol.format.GPX.RTE_PARSERS_,
        ol.format.GPX.RTEPT_PARSERS_,
        ol.format.GPX.TRK_PARSERS_,
        ol.format.GPX.TRKSEG_PARSERS_,
        ol.format.GPX.TRKPT_PARSERS_,
        ol.format.GPX.WPT_PARSERS_,
        ol.format.GPX.LINK_SERIALIZERS_,
        ol.format.GPX.RTE_SEQUENCE_,
        ol.format.GPX.RTE_SERIALIZERS_,
        ol.format.GPX.RTEPT_TYPE_SEQUENCE_,
        ol.format.GPX.TRK_SEQUENCE_,
        ol.format.GPX.TRK_SERIALIZERS_,
        ol.format.GPX.TRKSEG_SERIALIZERS_,
        ol.format.GPX.WPT_TYPE_SEQUENCE_,
        ol.format.GPX.WPT_TYPE_SERIALIZERS_,
        ol.format.GPX.GPX_SERIALIZERS_
    ];

    // GLS: Obtenemos los nuevos URIS para GPX
    var customGPXNameSpaceURIS = getAllCombinations(ol.format.GPX.NAMESPACE_URIS_.slice().slice(1));
    // GLS: Nos quedamos con las combinaciones nuevas
    cleanCombinationsByFormat(customGPXNameSpaceURIS, ol.format.GPX.NAMESPACE_URIS_);
    // GLS: A\u00f1adimos los nuevos URIS al GPX
    ol.format.GPX.NAMESPACE_URIS_ = ol.format.GPX.NAMESPACE_URIS_.concat(customGPXNameSpaceURIS);
    // GLS: Establecemos los parsers del GPX para los nuevos URIS
    setNewParsersByFormat(GPX_PARSERS, customGPXNameSpaceURIS);


    // Bug de OpenLayers hasta 3.5.0 como m\u00ednimo:
    // El parser de GML2 no lee las siguientes features del GML si tienen un featureType distinto del primero.
    // Esto pasa porque genera el objeto de featureTypes con la primera y en las siguientes iteraciones si el objeto existe no se regenera.
    // Entre comentarios /* */ se elimina lo que sobra.
    //
    // M\u00e1s: se a\u00f1ade para FeatureCollection un parser por cada namespaceURI del nodo. 
    // Esto es porque QGIS genera GML cuyo nodo FeatureCollection tiene namespace = http://ogr.maptools.org/.
    ol.format.GMLBase.prototype.readFeaturesInternal = function (node, objectStack) {
        ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
            'node.nodeType should be ELEMENT');
        var localName = node.localName;
        var features = null;
        if (localName == 'FeatureCollection') {
            // \u00d1apa para leer GML de https://catastro.navarra.es/ref_catastral/gml.ashx?C=217&PO=5&PA=626
            // y dem\u00e1s GMLs obtenidos de un WFS de GeoServer.
            var gmlnsCollectionParser = this.FEATURE_COLLECTION_PARSERS[ol.format.GMLBase.GMLNS];
            if (!gmlnsCollectionParser['member']) {
                gmlnsCollectionParser['member'] = ol.xml.makeArrayPusher(
                    ol.format.GMLBase.prototype.readFeaturesInternal);
            };
            //////
            if (node.namespaceURI === 'http://www.opengis.net/wfs') {
                features = ol.xml.pushParseAndPop([],
                    this.FEATURE_COLLECTION_PARSERS, node,
                    objectStack, this);
            } else {
                this.FEATURE_COLLECTION_PARSERS[node.namespaceURI] =
                    this.FEATURE_COLLECTION_PARSERS[node.namespaceURI] || this.FEATURE_COLLECTION_PARSERS[ol.format.GMLBase.GMLNS];
                features = ol.xml.pushParseAndPop(/*null*/[], // Cambiado null por [] porque si no, no crea el array de features
                    this.FEATURE_COLLECTION_PARSERS, node,
                    objectStack, this);
            }
        } else if (localName == 'featureMembers' || localName == 'featureMember' || localName == 'member') {
            var context = objectStack[0];
            var featureType = context['featureType'];
            var featureNS = context['featureNS'];
            var i, ii, prefix = 'p', defaultPrefix = 'p0';
            if (/*!featureType && */node.childNodes) {
                featureType = [], featureNS = {};
                for (i = 0, ii = node.childNodes.length; i < ii; ++i) {
                    var child = node.childNodes[i];
                    if (child.nodeType === 1) {
                        var ft = child.nodeName.split(':').pop();
                        if (featureType.indexOf(ft) === -1) {
                            var key = '';
                            var count = 0;
                            var uri = child.namespaceURI;
                            for (var candidate in featureNS) {
                                if (featureNS[candidate] === uri) {
                                    key = candidate;
                                    break;
                                }
                                ++count;
                            }
                            if (!key) {
                                key = prefix + count;
                                featureNS[key] = uri;
                            }
                            featureType.push(key + ':' + ft);
                        }
                    }
                }
                if (localName != 'featureMember' && localName != 'member') {
                    // recheck featureType for each featureMember
                    context['featureType'] = featureType;
                    context['featureNS'] = featureNS;
                }
            }
            if (typeof featureNS === 'string') {
                var ns = featureNS;
                featureNS = {};
                featureNS[defaultPrefix] = ns;
            }
            var parsersNS = {};
            var featureTypes = Array.isArray(featureType) ? featureType : [featureType];
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
            if (localName == 'featureMember' || localName == 'member') { // Elemento solo
                features = ol.xml.pushParseAndPop(undefined, parsersNS, node, objectStack);
            } else { // Colecci\u00f3n de elementos
                features = ol.xml.pushParseAndPop([], parsersNS, node, objectStack);
            }
        }
        if (features === null) {
            features = [];
        }
        // Revisamos que todas las features tienen geometr\u00eda. Evitamos as\u00ed que cuele un GML 2 parseado con el parser GML 3.
        var checkFeatureGeometry = function (feat) {
            var geom = feat.getGeometry();
            if (!geom || !geom.flatCoordinates.length) {
                throw 'Geometr\u00eda no v\u00e1lida. ¿Posible versi\u00f3n incorrecta de GML?';
            }
        };
        if (features instanceof ol.Feature) {
            checkFeatureGeometry(features);
        }
        else {
            for (var i = 0, len = features.length; i < len; i++) {
                checkFeatureGeometry(features[i]);
            }
        }
        return features;
    };

    ol.format.GML3CRS84 = function () {
        ol.format.GML3.call(this, {
            srsName: 'CRS:84'
        });
    };
    ol.inherits(ol.format.GML3CRS84, ol.format.GML3);

    ol.format.GML2CRS84 = function () {
        ol.format.GML2.call(this, {
            srsName: 'CRS:84'
        });
    };
    ol.inherits(ol.format.GML2CRS84, ol.format.GML2);

    ol.format.GML3CRS84 = function () {
        ol.format.GML3.call(this, {
            srsName: 'CRS:84'
        });
    };
    ol.inherits(ol.format.GML3CRS84, ol.format.GML3);

    ol.format.GML2CRS84 = function () {
        ol.format.GML2.call(this, {
            srsName: 'CRS:84'
        });
    };
    ol.inherits(ol.format.GML2CRS84, ol.format.GML2);

    // Parche para evitar el error AssertionError: Assertion failed: calculated value (1.020636810790192) ouside allowed range (0-1)
    ol.View.prototype.getValueForResolutionFunction = function (opt_power) {
        var power = opt_power || 2;
        var maxResolution = this.maxResolution_;
        var minResolution = this.minResolution_;
        var max = Math.log(maxResolution / minResolution) / Math.log(power);
        return (
        /**
             * @param {number} resolution Resolution.
             * @return {number} Value.
         */
            function (resolution) {
                var value =
                    (Math.log(maxResolution / resolution) / Math.log(power)) / max;
                value = Math.max(Math.min(1, value), 0);
                return value;
            });
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
        else {
            result = [0, 0, 0, 1];
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
            center: view.getCenter(),
            resolution: prevRes,
            enableRotation: false
        };

        if (mapWrap.parent.options.maxExtent) {
            pms.extent = mapWrap.parent.options.initialExtent;
        }

        if (layer instanceof TC.layer.Raster) {
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
            // A\u00f1adimos proyecciones equivalentes y transformaciones necesarias.
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

        var viewOptions = {
            projection: projection,
            center: center,
            enableRotation: false
        };
        if (self.parent.options.maxExtent) {
            var maxExtent = self.parent.options.maxExtent;
            viewOptions.extent = maxExtent;
            var rect = self.parent.div.getBoundingClientRect();
            var ratio = rect.width / rect.height;
            var dx = maxExtent[2] - maxExtent[0];
            var dy = maxExtent[3] - maxExtent[1];
            if (rect.width / rect.height > dx / dy) {
                viewOptions.resolution = dx / rect.width;
            }
            else {
                viewOptions.resolution = dy / rect.height;
            }
        }
        else {
            viewOptions.zoom = 2;
        }
        self.map = new ol.Map({
            target: self.parent.div,
            renderer: ol.renderer.Type.CANVAS,
            view: new ol.View(viewOptions),
            controls: [],
            interactions: interactions
        });
        self.map.getView().fit(self.parent.options.initialExtent, self.map.getSize());
        self.map._wrap = self;

        // Para evitar estiramientos en canvas
        var updateSize = function () {
            self.map.updateSize();
        };
        $(self.parent.div).on(ol.events.EventType.RESIZE, updateSize);
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

        self.map.on(ol.MapEvent.Type.MOVEEND, function () {
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
                wrap.parent.state = TC.Layer.state.LOADING;
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
                    wrap.parent.state = TC.Layer.state.IDLE;
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
            //no est\u00e1 el layer, as\u00ed que no hago nada
        }

    };

    TC.wrap.Map.prototype.setBaseLayer = function (olLayer) {
        var self = this;
        var deferred = new $.Deferred();

        // Toda esta l\u00f3gica antes de llamar a setLayer() es para hacer un zoom a la nueva resoluci\u00f3n
        // cuando la nueva capa no llega a la resoluci\u00f3n actual
        var viewOptions = getResolutionOptions(self, olLayer._wrap.parent);
        var view = self.map.getView();

        var setLayer = function () {
            var curBl = self.parent.getBaseLayer();
            if (curBl) {
                self.map.removeLayer(curBl.wrap.getLayer());
            }
            self.insertLayer(olLayer, 0);
            deferred.resolve();
        };
        var currentResolution = view.getResolution();
        if (currentResolution !== viewOptions.resolution) {
            view.animate({ resolution: viewOptions.resolution, duration: TC.Consts.ZOOM_ANIMATION_DURATION }, function () {
                setLayer();
            });

        }
        else {
            setLayer();
        }
        return deferred.promise();
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
            // GLS: resolvemos la promesa cuando acabe la animaci\u00f3n
            var onpostrender = function () {
                self.done.resolve();
            };

            var applyExtent = function () {
                var res = view.getResolutionForExtent(extent, mapSize);
                // URI: Esta logica est\u00e1 fusilada de la funci\u00f3n fit de un objeto view de OL3
                if (view.constrainResolution) {
                    var constrainedResolution = view.constrainResolution(res, 0, 0);
                    if (constrainedResolution < res) {
                        constrainedResolution = view.constrainResolution(
                            constrainedResolution, -1, 0);
                    }
                    res = constrainedResolution;
                }

                // GLS: antes de resolver la promesa validamos si existe animaci\u00f3n
                // URI: si la animacion no existe ponemos duracion 0
                // flacunza: en caso de que animate=undefined, se anima
                view.animate({
                    resolution: res,
                    center: [((extent[0] + extent[2]) / 2), ((extent[1] + extent[3]) / 2)],
                    duration: (opts.animate === void (0) || opts.animate) ? TC.Consts.ZOOM_ANIMATION_DURATION : 0
                }, onpostrender);
            };

            if (self.parent.baseLayer) {
                $.when(self.parent.baseLayer.wrap.getLayer()).then(function (olLayer) {
                    // Todo esto para evitar que haga m\u00e1s zoom que el admisible por la capa base
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

                    applyExtent();

                });
            }
            else {
                applyExtent();
            }
        }, 50);

        return self.done;
    };

    TC.wrap.Map.prototype.getExtent = function () {
        return this.map.getView().calculateExtent(this.map.getSize());
    };

    TC.wrap.Map.prototype.setCenter = function (coords, options) {
        var self = this;
        var opts = options || {};
        var view = self.map.getView();

        if (opts.animate) {
            view.animate({ center: coords, duration: TC.Consts.ZOOM_ANIMATION_DURATION });
        }
        else {
            view.setCenter(coords);
        }
    };

    TC.wrap.Map.prototype.getCenter = function () {
        return this.map.getView().getCenter();
    };

    TC.wrap.Map.prototype.getResolution = function () {
        return this.map.getView().getResolution();
    };

    TC.wrap.Map.prototype.setResolution = function (resolution) {
        $.when(this.getMap()).then(function (olMap) {
            olMap.getView().setResolution(resolution);
        });
    };

    TC.wrap.Map.prototype.setRotation = function (rotation) {
        $.when(this.getMap()).then(function (olMap) {
            olMap.getView().setRotation(rotation);
        });
    };

    TC.wrap.Map.prototype.getRotation = function () {
        return this.map.getView().getRotation();
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

    TC.wrap.Map.prototype.getPixelFromCoordinate = function (coord) {
        return this.map.getPixelFromCoordinate(coord);
    };

    TC.wrap.Map.prototype.getViewport = function (options) {
        var self = this;
        var opts = options || {};
        if (opts.synchronous) {
            result = self.map.getViewport();
        }
        else {
            var result = new $.Deferred();
            $.when(this.getMap()).then(function (olMap) {
                result.resolve(olMap.getViewport());
            });
        }
        return result;
    };

    TC.wrap.Map.prototype.isNative = function (map) {
        return map instanceof ol.Map;
    };

    TC.wrap.Map.prototype.isGeo = function () {
        return this.map.getView().getProjection().getUnits() === ol.proj.Units.DEGREES;
    };

    TC.wrap.Map.prototype.addPopup = function (popupCtl) {
        var deferred = $.Deferred();
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
                                    if (!ev.buttons && !Modernizr.touch) { // Evitamos que se mantenga el drag si no hay bot\u00f3n pulsado (p.e. en IE pulsando una scrollbar)
                                        return false;
                                    }
                                    popup.setOffset([popupCtl._currentOffset[0] + dd.deltaX, popupCtl._currentOffset[1] + dd.deltaY]);
                                }, {
                                    not: 'th,td,input,select'
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
                deferred.resolve();
            }
        );
        deferred.promise();
    };

    TC.wrap.Map.prototype.hidePopup = function (popupCtl) {
        var self = this;
        self.parent.currentFeature = null;
        if (popupCtl.$popupDiv) {
            popupCtl.$popupDiv.removeClass(TC.Consts.classes.VISIBLE);
        }
    };

    var getFormatFromName = function (name) {
        switch (name) {
            case TC.Consts.layerType.KML:
            case TC.Consts.mimeType.KML:
                return new ol.format.KML({
                    showPointNames: false
                });
            case TC.Consts.layerType.GPX:
                return new ol.format.GPX();
            case TC.Consts.layerType.GEOJSON:
            case TC.Consts.mimeType.JSON:
            case TC.Consts.format.JSON:
                return new ol.format.GeoJSON();
            case TC.Consts.format.GML2:
                return new ol.format.GML2();
            case TC.Consts.format.GML3:
                return new ol.format.GML3();
            case TC.Consts.mimeType.GML:
            case TC.Consts.format.GML:
                return new ol.format.GML();
            case TC.Consts.format.TOPOJSON:
                return new ol.format.TopoJSON();
            case TC.Consts.format.WKT:
                return new ol.format.WKT();
            default:
                break;
        }
    };

    TC.wrap.Map.prototype.exportFeatures = function (features, options) {
        var self = this;
        var opts = options || {};
        var nativeStyle = createNativeStyle({ styles: self.parent.options.styles });
        var olFeatures = features.map(function (elm) {
            var result = elm.wrap.feature;
            if (!result.getStyle()) {
                result.setStyle(nativeStyle);
            }
            return result;
        });
        var format = getFormatFromName(options.format);
        if (format instanceof ol.format.GMLBase) {
            //Apa\u00f1amos para que el GML sea v\u00e1lido
            format.featureNS = "sitna";
            format.featureType = "getFeatureInfoResult";
            var featuresNode = format.writeFeaturesNode(olFeatures, {
                featureProjection: self.parent.crs
            });

            var featureCollectionNode = ol.xml.createElementNS('http://www.opengis.net/gml',
                'FeatureCollection');
            ol.xml.setAttributeNS(featureCollectionNode, 'http://www.w3.org/2001/XMLSchema-instance',
                'xsi:schemaLocation', format.schemaLocation);
            featuresNode.removeAttribute('xmlns:xsi');
            featuresNode.removeAttribute('xsi:schemaLocation');
            featureCollectionNode.appendChild(featuresNode);
            //ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
            //    'xsi:schemaLocation', this.schemaLocation);
            return featureCollectionNode.outerHTML;
        }
        return format.writeFeatures(olFeatures, {
            featureProjection: self.parent.crs
        });
    };

    var isFileDrag = function (e) {
        for (var i = 0, len = e.dataTransfer.types.length; i < len; i++) {
            if (e.dataTransfer.types[i] === 'Files') {
                return true;
            }
        }
        return false;
    };

    var handleDragEnter = function (e) {
        var self = this;
        if (isFileDrag(e)) { // Solo hay gesti\u00f3n si lo que se arrastra es un archivo
            self.getMap()._wrap.parent._$div.addClass(TC.Consts.classes.DROP);
            e.preventDefault();
            e.stopPropagation();
        }
    };

    var handleDragExit = function (e) {
        var self = this;
        if (isFileDrag(e)) { // Solo hay gesti\u00f3n si lo que se arrastra es un archivo
            var map = self.getMap()._wrap.parent;
            if (e.target === self.target) {
                map._$div.removeClass(TC.Consts.classes.DROP);
            }
        }
    };

    TC.wrap.Map.prototype.enableDragAndDrop = function (options) {
        var self = this;
        var opts = options || {};
        var ddOptions = {
            formatConstructors: [
                ol.format.KML,
                ol.format.GPX,
                ol.format.GML3CRS84,
                ol.format.GML2CRS84,
                ol.format.GML,
                ol.format.GML2,
                ol.format.GeoJSON,
                function () { return new ol.format.WKT({ splitCollection: true }); },
                ol.format.TopoJSON
            ]
        };
        if (opts.dropTarget) {
            ddOptions.target = TC.getDiv(opts.dropTarget);
        }
        else {
            ddOptions.target = self.parent.div;
        }
        var ddInteraction = new ol.interaction.DragAndDrop(ddOptions);
        ddInteraction.on(ol.interaction.DragAndDrop.EventType.ADD_FEATURES, function (e) {
            var featurePromises = e.features ? e.features.map(function (elm) {
                return TC.wrap.Feature.createFeature(elm);
            }) : [];
            $.when.apply(this, featurePromises).then(function () {
                var li = self.parent.getLoadingIndicator();
                if (li) {
                    li.removeWait(self._featureImportWaitId);
                }
                if (arguments.length) {
                    var features = new Array(arguments.length);
                    for (var i = 0, len = features.length; i < len; i++) {
                        features[i] = arguments[i];
                    }
                    self.parent.$events.trigger($.Event(TC.Consts.event.FEATURESIMPORT, { features: features, fileName: e.file.name }));
                }
                else {
                    self.parent.$events.trigger($.Event(TC.Consts.event.FEATURESIMPORTERROR, { file: e.file }));
                }
            });
        });
        if (opts.once) {
            ddInteraction.map_ = self.map;
        }
        else {
            self.map.addInteraction(ddInteraction);
            var dropArea = ddInteraction.target ? ddInteraction.target : self.map.getViewport();
            // A\u00f1adidos gestores de eventos para mostrar el indicador visual de drop.
            var handleDrop = function (e) {
                if (isFileDrag(e)) { // Solo hay gesti\u00f3n si lo que se arrastra es un archivo
                    var map = self.parent;
                    if (ddInteraction.target === e.target) {
                        var li = map.getLoadingIndicator();
                        if (li) {
                            self._featureImportWaitId = li.addWait();
                        }
                        e.stopPropagation();
                    }
                    else {
                        e.preventDefault();
                    }
                    map._$div.removeClass(TC.Consts.classes.DROP);
                }
            };
            ddInteraction.dropListenKeys_.push(
                ol.events.listen(dropArea, ol.events.EventType.DRAGENTER,
                    handleDragEnter, ddInteraction)
            );
            ddInteraction.dropListenKeys_.push(
                ol.events.listen(document.body, ol.events.EventType.DRAGENTER,
                    handleDragEnter, ddInteraction)
            );
            ddInteraction.dropListenKeys_.push(
                ol.events.listen(dropArea, ol.events.EventType.DRAGOVER,
                    handleDragEnter, ddInteraction)
            );
            ddInteraction.dropListenKeys_.push(
                ol.events.listen(document.body, ol.events.EventType.DRAGOVER,
                    handleDragEnter, ddInteraction)
            );
            ddInteraction.dropListenKeys_.push(
                ol.events.listen(dropArea, ol.events.EventType.DROP,
                    handleDrop, ddInteraction)
            );
            ddInteraction.dropListenKeys_.push(
                ol.events.listen(document.body, ol.events.EventType.DROP,
                    handleDrop, ddInteraction)
            );
            ddInteraction.dropListenKeys_.push(
                ol.events.listen(document.body, 'dragleave',
                    handleDragExit, ddInteraction)
            );
            ddInteraction.dropListenKeys_.push(
                ol.events.listen(document.body, 'dragend',
                    handleDragExit, ddInteraction)
            );
            ddInteraction.dropListenKeys_.push(
                ol.events.listen(document.body, 'dragexit',
                    handleDragExit, ddInteraction)
            );
            document.addEventListener('mouseenter', function (e) {
                if (!e.buttons) {
                    self.parent._$div.removeClass(TC.Consts.classes.DROP);
                }
            }, false);
            self.ddEnabled = true;
        }
        return ddInteraction;
    };

    TC.wrap.Map.prototype.loadFiles = function (files) {
        var self = this;
        var ddInteraction;
        if (self.ddEnabled) {
            self.map.getInteractions().forEach(function (elm) {
                if (elm instanceof ol.interaction.DragAndDrop) {
                    ddInteraction = elm;
                }
            });
        }
        else {
            ddInteraction = self.enableDragAndDrop({ once: true });
        }
        var li = self.parent.getLoadingIndicator();
        if (li) {
            self._featureImportWaitId = li.addWait();
        }
        ol.interaction.DragAndDrop.handleDrop_.call(ddInteraction, { dataTransfer: { files: files } });
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
        result = $('<textarea />').html(result).text();
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
        // Contemplamos el caso de una capa sin nombre: sus escalas v\u00e1lidas ser\u00e1n las de sus hijas.
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
                if (self.parent.compareNames(self.getName(l), name)) {
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
                                //bajar un nivel en el \u00e1rbol
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

    TC.wrap.layer.Raster.prototype.getServiceTitle = function () {
        var result = null;
        var capabilities = this.parent.capabilities;
        if (capabilities.Capability && capabilities.Service) {
            result = capabilities.Service.Title;
        }
        else if (capabilities.ServiceIdentification) {
            result = capabilities.ServiceIdentification.Title;
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getRootLayerNode = function () {
        var self = this;
        var result;
        if (self.getServiceType() === TC.Consts.layerType.WMS) {
            result = self.parent.capabilities.Capability.Layer;
        }
        return result;
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

    TC.wrap.layer.Raster.prototype.getIdentifier = function (node) {
        return node.Identifier;
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
            switch (self.getServiceType()) {
                case TC.Consts.layerType.WMS:
                    var getNodeArray = function getNodeArray(node) {
                        var r = [node];
                        var children = self.getLayerNodes(node);
                        for (var i = 0; i < children.length; i++) {
                            r = r.concat(getNodeArray(children[i]));
                        }
                        return r;
                    };
                    var root = self.getRootLayerNode();
                    self._layerList = root ? getNodeArray(root) : [];
                    break;
                case TC.Consts.layerType.WMTS:
                    self._layerList = self.parent.capabilities.Contents.Layer.slice();
                    break;
                default:
                    self._layerList = [];
                    break;
            }
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
                result.src = $('<textarea />').html(legend.OnlineResource).text();
                // Eliminado porque GeoServer miente con el tama\u00f1o de sus im\u00e1genes de la leyenda
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
                                    if (layer.compareNames(self.getName(n), name)) {
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
                var crsRegExp = new RegExp('^urn:ogc:def:crs:' + crs.replace(':', ':.*:') + '$|^' + crs + '$', 'g');
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

    TC.wrap.layer.Raster.prototype.setWMTSUrl = function () {
        var self = this;

        $.when(self.getLayer()).then(function (l) {
            self.parent.options = self.parent.options || {};
            var urls = l.getSource().getUrls();
            self.parent.options.urlPattern = urls[urls.length - 1];
        });
    };

    var base64Encode = function (str) {
        var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var out = "", i = 0, len = str.length, c1, c2, c3;
        while (i < len) {
            c1 = str.charCodeAt(i++) & 0xff;
            if (i == len) {
                out += CHARS.charAt(c1 >> 2);
                out += CHARS.charAt((c1 & 0x3) << 4);
                out += "==";
                break;
            }
            c2 = str.charCodeAt(i++);
            if (i == len) {
                out += CHARS.charAt(c1 >> 2);
                out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
                out += CHARS.charAt((c2 & 0xF) << 2);
                out += "=";
                break;
            }
            c3 = str.charCodeAt(i++);
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
            out += CHARS.charAt(c3 & 0x3F);
        }
        return out;
    }

    var imageLoadFunction = function (image, src) {
        var self = this;
        var img = image.getImage();
        if (self.parent.usesSSL) {
            src = src.replace(/^(f|ht)tp?:\/\//i, "https://");
        }
        else if (self.parent.usesProxy) {
            src = TC.proxify(src);
        }
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

                if (chunks && chunks.length > 1 && chunks[1] && chunks[0] !== "LAYERS") { //Quitamos el par\u00e1metro LAYERS de la petici\u00f3n
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

        if (imageLoadByPost) { //Si queremos cargar la capa por POST, sobreescribimos la funci\u00f3n que pide la imagen
            imageFunction = $.proxy(imagePostFunction, self);
        } else {
            imageFunction = $.proxy(imageLoadFunction, self);
        }

        var source = new ol.source.ImageWMS({
            url: url,
            crossOrigin: options.map ? options.map.options.crossOrigin : undefined,
            params: params,
            extent: TC.Cfg.initialExtent,
            ratio: TC.Cfg.imageRatio,
            imageLoadFunction: imageFunction
        });

        source.on(ol.source.Image.EventType.IMAGELOADSTART, function (e) {
            self.$events.trigger($.Event(TC.Consts.event.BEFORETILELOAD, { tile: e.image.getImage() }));
        });
        source.on(ol.source.Image.EventType.IMAGELOADEND, function (e) {
            self.$events.trigger($.Event(TC.Consts.event.TILELOAD, { tile: e.image.getImage() }));
        });
        source.on(ol.source.Image.EventType.IMAGELOADERROR, function (e) {
            self.$events.trigger($.Event(TC.Consts.event.TILELOAD, { tile: e.image.getImage() }));
        });


        var layerOptions = {
            visible: !!params.LAYERS.length || imageLoadByPost, //Las capas de tem\u00e1ticos cargadas por POST no tienen el atributo LAYERS
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
        var sourceOptions = ol.source.WMTS.optionsFromCapabilities(self.parent.capabilities, {
            layer: layerName,
            matrixSet: options.matrixSet,
            crossOrigin: options.map ? options.map.options.crossOrigin : undefined,
            requestEncoding: options.encoding,
            format: options.format,
        });
        var https = 'https:';
        if (location.protocol === https) {
            sourceOptions.urls = sourceOptions.urls.map(function (elm) {
                return elm.replace('http:', https);
            });
        }

        sourceOptions.crossOrigin = options.map ? options.map.options.crossOrigin : undefined;

        var source = new ol.source.WMTS(sourceOptions);
        source.setTileLoadFunction($.proxy(imageLoadFunction, self));

        source.on(ol.source.Tile.EventType.TILELOADSTART, function (e) {
            self.$events.trigger($.Event(TC.Consts.event.BEFORETILELOAD, { tile: e.tile.getImage() }));
        });
        source.on(ol.source.Tile.EventType.TILELOADEND, function (e) {
            self.$events.trigger($.Event(TC.Consts.event.TILELOAD, { tile: e.tile.getImage() }));
        });
        source.on(ol.source.Tile.EventType.TILELOADERROR, function (e) {
            self.$events.trigger($.Event(TC.Consts.event.TILELOAD, { tile: e.tile.getImage() }));
        });

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
            //esto est\u00e1 mal, porque matrix podr\u00eda empezar m\u00e1s abajo (tener recortado por ambos lados)
            if (matrix && matrix.length) {
                var ix = matrix[0].matrixIndex;
                resolutions = resolutions.slice(ix, matrix.length + ix);
            }

            return resolutions;
        };


        self.addCommonEvents(result);

        var resolutions = source.getResolutions();
        //Este +1 tan chungo es porque, en el caso en que la resoluci\u00f3n del mapa es igual a la m\u00e1xima del layer, openLayers lo oculta
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

    // En OL3 la imagen tiene el tama\u00f1o original. Escalamos si hace falta.
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

    // Transformaci\u00f3n de opciones de estilo en un estilo nativo OL3.
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
                    id: TC.wrap.Feature.prototype.getId.call({ feature: olFeat }), // GLS a\u00f1ado el id de la feature para poder filtrar por la capa a la cual pertenece                    
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
                width: getStyleValue(styles.line.strokeWidth, feature),
                lineDash: styles.line.lineDash
            });
        }

        if (styles.polygon) {
            nativeStyleOptions.fill = new ol.style.Fill({
                color: getRGBA(getStyleValue(styles.polygon.fillColor, feature), getStyleValue(styles.polygon.fillOpacity, feature))
            });
            nativeStyleOptions.stroke = new ol.style.Stroke({
                color: getStyleValue(styles.polygon.strokeColor, feature),
                width: getStyleValue(styles.polygon.strokeWidth, feature),
                lineDash: styles.polygon.lineDash
            });
        }

        var createNativeTextStyle = function (styleObj) {
            var textOptions = {
                text: '' + getStyleValue(styleObj.label, feature),
            };
            if (styleObj.fontSize) {
                textOptions.font = getStyleValue(styleObj.fontSize, feature) + 'pt sans-serif';
            }
            if (styleObj.angle) {
                textOptions.rotation = -Math.PI * getStyleValue(styleObj.angle, feature) / 180;
            }
            if (styleObj.fontColor) {
                textOptions.fill = new ol.style.Fill({
                    color: getRGBA(getStyleValue(styleObj.fontColor, feature), 1)
                });
            }
            if (styleObj.labelOutlineColor) {
                textOptions.stroke = new ol.style.Stroke({
                    color: getRGBA(getStyleValue(styleObj.labelOutlineColor, feature), 1),
                    width: getStyleValue(styleObj.labelOutlineWidth, feature)
                });
            }
            if (styleObj.labelOffset) {
                textOptions.offsetX = styleObj.labelOffset[0];
                textOptions.offsetY = styleObj.labelOffset[1];
            }
            return new ol.style.Text(textOptions);
        };

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
                    width: getStyleValue(pointOptions.strokeWidth, feature),
                    lineDash: pointOptions.lineDash
                });
            }

            if (!isNaN(circleOptions.radius))
                nativeStyleOptions.image = new ol.style.Circle(circleOptions);

            if (pointOptions.label) {
                nativeStyleOptions.text = createNativeTextStyle(pointOptions);
            }
        }
        if (styles.marker) {
            var markerOptions = styles.marker;
            if (markerOptions.url) {
                nativeStyleOptions.image = new ol.style.Icon({
                    crossOrigin: 'anonymous',
                    anchor: markerOptions.anchor,
                    src: markerOptions.url
                });
            }
            if (markerOptions.label) {
                nativeStyleOptions.text = createNativeTextStyle(markerOptions);
            }
        }
        return [new ol.style.Style(nativeStyleOptions)];
    };

    TC.wrap.layer.Vector.prototype.reloadSource = function () {
        var self = this;
        var done = new $.Deferred();

        var layerOptions = self.createVectorSource(self.parent, self.createStyles(self.parent));

        if (self.parent.type === TC.Consts.layerType.WFS) {
            var listenerKey = layerOptions.source.on('change', function (e) {
                if (layerOptions.source.getState() == 'ready') {
                    ol.Observable.unByKey(listenerKey);

                    done.resolve();
                }
            });
        }

        var features = self.layer.getSource().getFeatures();
        self.layer.setSource(layerOptions.source);

        if (layerOptions.style)
            self.layer.setStyle(layerOptions.style);

        if (self.parent.type != TC.Consts.layerType.WFS) {
            layerOptions.source.addFeatures(features);
            done.resolve();
        }

        return done;
    };

    TC.wrap.layer.Vector.prototype.import = function (options) {
        var self = this;
        var opts = $.extend({}, options);
        opts.type = options.format;

        var oldFeatures = self.layer.getSource().getFeatures();
        var layerOptions = self.createVectorSource(opts, self.createStyles(self.parent));
        self.layer.setSource(layerOptions.source);
        if (layerOptions.style) {
            self.layer.setStyle(layerOptions.style);
        }

        layerOptions.source.addFeatures(oldFeatures);
    };

    TC.wrap.layer.Vector.prototype.createVectorSource = function (options, nativeStyle) {
        var self = this;

        var source;
        var vectorOptions;
        var getTypeFromUrl = function (url) {
            var idx = url.indexOf('?');
            if (idx >= 0) {
                url = url.substr(0, idx);
            }
            else {
                idx = url.indexOf('#');
                if (idx >= 0) {
                    url = url.substr(0, idx);
                }
            }
            switch (url.substr(url.lastIndexOf('.') + 1).toLowerCase()) {
                case 'kml':
                    return TC.Consts.layerType.KML;
                case 'gpx':
                    return TC.Consts.layerType.GPX;
                case 'json':
                case 'geojson':
                    return TC.Consts.layerType.GEOJSON;
                default:
                    return TC.Consts.layerType.VECTOR;
            }
        };

        if ($.isArray(options.url) || options.urls) {
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
        else if (options.url && options.type !== TC.Consts.layerType.WFS) {
            vectorOptions = {
                url: TC.proxify(options.url),
                projection: options.crs
            };
            vectorOptions.format = getFormatFromName(getTypeFromUrl(options.url)) || getFormatFromName(options.type);
        }
        else if (options.data) {
            vectorOptions = {
                projection: options.crs,
                loader: function (extent, resolution, projection) {
                    var format = this.getFormat();
                    try {
                        var fs = format.readFeatures(options.data, { featureProjection: projection });
                        this.addFeatures(fs);
                    }
                    catch (e) {
                        if (self.parent.map) {
                            self.parent.map.$events.trigger($.Event(TC.Consts.event.LAYERERROR, { layer: self.parent, reason: e.message }));
                        }
                    }
                }
            };
            vectorOptions.format = getFormatFromName(options.format) || getFormatFromName(options.type);
        }
        else if (options.type == TC.Consts.layerType.WFS) {
            var outputFormat;
            var mimeType;
            switch (options.outputFormat) {
                case TC.Consts.format.JSON:
                    outputFormat = new ol.format.GeoJSON({
                        geometryName: options.geometryName
                    });
                    mimeType = 'json';
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
                        self.parent.state = TC.Layer.state.LOADING;
                        self.parent.map.$events.trigger($.Event(TC.Consts.event.BEFORELAYERUPDATE, { layer: self.parent }));
                        var ajaxOptions = {};
                        var crs = projection.getCode();
                        var version = options.version || '1.1.0';
                        var url = serviceUrl;
                        var featureType = $.isArray(options.featureType) ? options.featureType : [options.featureType];
                        if (!options.properties || (options.properties instanceof Array && !options.properties.length) || !(Object.keys(options.properties).length)) {
                            url = url + '?service=WFS&' +
                            'version=' + version + '&request=GetFeature&typename=' + featureType.join(',') + '&' +
                            'outputFormat=' + mimeType + '&srsname=' + crs;
                            if (extent[0] !== -Infinity && extent[1] !== -Infinity && extent[2] !== Infinity && extent[3] !== Infinity) {
                                url = url + '&bbox=' + extent.join(',') + ',' + crs;
                            }

                            if (options.maxFeatures)
                                url = url + "maxFeatures=" + options.maxFeatures;
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
                            if (options.maxFeatures) {
                                gml[gml.length] = '" maxFeatures="';
                                gml[gml.length] = options.maxFeatures;
                            }
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
                                if (options.properties.length > 1 || Object.keys(options.properties).length > 1) {
                                    gml[gml.length] = '<ogc:And>';
                                }

                                if (options.properties instanceof Array) {
                                    for (var j = 0; j < options.properties.length; j++) {
                                        var prop = options.properties[j];
                                        gml[gml.length] = '<ogc:PropertyIsEqualTo matchCase="true"><ogc:PropertyName>';
                                        gml[gml.length] = prop.name;
                                        gml[gml.length] = '</ogc:PropertyName><ogc:Literal>';
                                        gml[gml.length] = prop.value;
                                        gml[gml.length] = '</ogc:Literal></ogc:PropertyIsEqualTo>';
                                    }
                                } else if (options.properties instanceof Object) {
                                    for (var j = 0; j < options.properties[featureType[i]].length; j++) {
                                        var prop = options.properties[featureType[i]][j];
                                        gml[gml.length] = '<ogc:PropertyIsEqualTo matchCase="true"><ogc:PropertyName>';
                                        gml[gml.length] = prop.name;
                                        gml[gml.length] = '</ogc:PropertyName><ogc:Literal>';
                                        gml[gml.length] = prop.value;
                                        gml[gml.length] = '</ogc:Literal></ogc:PropertyIsEqualTo>';
                                    }
                                }

                                if (options.properties.length > 1 || Object.keys(options.properties).length > 1) {
                                    gml[gml.length] = '</ogc:And>';
                                }
                                gml[gml.length] = '</ogc:Filter></wfs:Query>';
                            }
                            gml[gml.length] = '</wfs:GetFeature>';

                            ajaxOptions.data = gml.join('');
                        }
                        ajaxOptions.url = url;
                        self._requestUrl = url;
                        $.ajax(ajaxOptions).done(function (data) {
                            sOrigin.addFeatures(outputFormat.readFeatures(data));
                            self.parent.state = TC.Layer.state.IDLE;
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

            // Animaci\u00f3n
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
                source.addEventListener(ol.source.Vector.EventType.REMOVEFEATURE, function (e) {
                    var features = e.feature.get('features');
                    if (features && features.length > 1) {
                        clusterCache.push(e.feature);
                    }
                });
                source.addEventListener(ol.source.Vector.EventType.ADDFEATURE, function (e) {
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
            s.addEventListener(ol.source.Vector.EventType.ADDFEATURE, function (e) {
                var olFeat = e.feature;
                // OL3 dibuja el tama\u00f1o original del icono del marcador, lo escalamos si es necesario:
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

        source.addEventListener(ol.source.Vector.EventType.ADDFEATURE, function (e) {
            var olFeat = e.feature;

            if (!olFeat._wrap) { // Solo actuar si no es una feature a\u00f1adida desde la API
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
                else if (geom instanceof ol.geom.LineString) {
                    deferred = self.parent.addPolyline(olFeat);
                }
                else if (geom instanceof ol.geom.Polygon) {
                    deferred = self.parent.addPolygon(olFeat);
                }
                else if (geom instanceof ol.geom.MultiLineString) {
                    deferred = self.parent.addMultiPolyline(olFeat);
                }
                else if (geom instanceof ol.geom.MultiPolygon) {
                    deferred = self.parent.addMultiPolygon(olFeat);
                }
                var _timeout;
                $.when(deferred).then(function (feat) {
                    var features = olFeat.get('features');
                    if ($.isArray(features)) {
                        // Es una feature de fuente ol.source.Cluster
                        feat.features = $.map(features, function (elm) {
                            return new feat.constructor(elm);
                        });
                    }

                    // Timeout porque OL3 no tiene evento featuresadded. El timeout evita ejecuciones a lo tonto.
                    clearTimeout(_timeout);
                    _timeout = setTimeout(function () {
                        self.parent.map.$events.trigger($.Event(TC.Consts.event.FEATURESADD, { layer: self.parent, features: [feat] }));
                    }, 50);
                });
            }
        });

        source.addEventListener(ol.source.Vector.EventType.REMOVEFEATURE, function (e) {
            var olFeat = e.feature;
            if (olFeat._wrap) {
                var idx = $.inArray(olFeat._wrap.parent, self.parent.features);
                if (idx > -1) {
                    self.parent.features.splice(idx, 1);
                    self.parent.map.$events.trigger($.Event(TC.Consts.event.FEATUREREMOVE, { layer: self.parent, feature: olFeat._wrap.parent }));
                }
            }
        });

        source.addEventListener(ol.source.Vector.EventType.ADDFEATURE, function (e) {
            self.parent.map.$events.trigger($.Event(TC.Consts.event.VECTORUPDATE, { layer: self.parent }));
        });

        source.addEventListener(ol.source.Vector.EventType.REMOVEFEATURE, function () {
            self.parent.map.$events.trigger($.Event(TC.Consts.event.VECTORUPDATE, { layer: self.parent }));
        });

        var layerOptions = {
            source: source
        };

        if (!(vectorOptions && vectorOptions.format instanceof ol.format.KML)) {
            layerOptions.style = nativeStyle || options.styles;
        }

        return layerOptions;
    };

    TC.wrap.layer.Vector.prototype.createStyles = function (options) {
        var self = this;

        var dynamicStyle = false;

        if ($.isFunction(options)) {
            dynamicStyle = true;
            self.styleFunction = function (olFeat) {
                return createNativeStyle(options(olFeat));
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
            self.styleFunction = function (olFeat) {
                return createNativeStyle(self.parent.options, olFeat);
            };
        }

        var nativeStyle = dynamicStyle ? self.styleFunction : self.styleFunction();

        return nativeStyle;
    };

    TC.wrap.layer.Vector.prototype.createVectorLayer = function () {
        var self = this;
        var result = null;

        self.$events = $(self);

        var options = self.parent.options;

        var layerOptions = self.createVectorSource(options, self.createStyles(options));
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

    TC.wrap.layer.Vector.prototype.getFeatureById = function (id) {
        var olLayer = this.getLayer();
        if (olLayer instanceof ol.layer.Layer) {
            return olLayer.getSource().getFeatureById(id);
        }
        else {
            return null;
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

    TC.wrap.layer.Vector.prototype.getRGBA = function (color, opacity) {
        return getRGBA(color, opacity);
    };

    TC.wrap.layer.Vector.prototype.findFeature = function (values) {
        // TODO: a\u00f1adir ol.animation.zoom
    };

    TC.wrap.layer.Vector.prototype.getGetFeatureUrl = function () {
        return this._requestUrl;
    };

    TC.wrap.layer.Vector.prototype.getDescribeFeatureTypeUrl = function () {
        var self = this;
        var layer = self.parent;
        var version = layer.options.version || '1.1.0';
        var url = layer.url;
        var featureType = $.isArray(layer.options.featureType) ? layer.options.featureType : [layer.options.featureType];
        url = url + '?service=WFS&' + 'version=' + version + '&request=DescribeFeatureType&typename=' + featureType.join(',') + '&outputFormat=XMLSCHEMA';
        return url;
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
                var transaction = format.writeTransaction(olInserts, olUpdates, olDeletes, {
                    featurePrefix: options.featurePrefix,
                    featureNS: options.featureNS,
                    featureType: options.featureType[0]
                });
                var ajaxOptions = {
                    url: self.parent.url,
                    type: 'POST',
                    contentType: TC.Consts.mimeType.XML,
                    processData: false,
                    data: transaction.outerHTML,
                };
                $.ajax(ajaxOptions).done(function (data) {
                    var er = data.getElementsByTagName('ExceptionReport')[0];
                    var errorObj = { reason: '' };
                    if (er) {
                        var e = er.getElementsByTagName('Exception')[0];
                        if (e) {
                            errorObj.code = e.getAttribute('exceptionCode');
                            var texts = e.getElementsByTagName('ExceptionText');
                            for (var i = 0, len = texts.length; i < len; i++) {
                                errorObj.reason += '\n' + texts[i].innerHTML;
                            }
                        }
                        result.reject(errorObj);
                    }
                    else {
                        var response = format.readTransactionResponse(data);
                        result.resolve(response);
                    }
                }).fail(function () {
                    result.reject({ code: '', reason: 'unknown' });
                });
            });
        }
        else {
            result.resolve(self.parent);
        }
        return result;
    };

    TC.wrap.layer.Vector.prototype.setDraggable = function (draggable, onend, onstart) {
        var self = this;

        //tiene que estar a nivel de control para poder retirarla despu\u00e9s
        //var interaction;
        $.when(self.parent.map.wrap.getMap(), self.getLayer()).then(function (olMap, olLayer) {
            if (draggable) {
                var interactionOptions = {
                    layers: [olLayer],
                    features: new ol.Collection(olLayer.getSource().getFeatures())
                };
                self.interaction = new ol.interaction.Translate(interactionOptions);
                if ($.isFunction(onend)) {
                    self.interaction.on(ol.interaction.Translate.EventType.TRANSLATEEND, function (e) {
                        if (e.features.getLength()) {
                            onend(e.features.item(0)._wrap.parent);
                        }
                    });
                }
                if ($.isFunction(onstart)) {
                    self.interaction.on(ol.interaction.Translate.EventType.TRANSLATESTART, function (e) {
                        if (e.features.getLength()) {
                            onstart(e.features.item(0)._wrap.parent);
                        }
                    });
                }
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

    TC.wrap.control.ScaleBar.prototype.getText = function () {
        var self = this;
        if (self.ctl) {
            return self.ctl.renderedHTML_;
        }
    };

    TC.wrap.control.NavBar.prototype.register = function (map) {
        var self = this;
        $.when(map.wrap.getMap()).then(function (olMap) {
            var div = self.parent.div;
            self.zCtl = new ol.control.Zoom({ target: div });
            // Ponemos para render una funci\u00f3n modificada, para evitar que en los pinch zoom haya errores de este tipo:
            // AssertionError: Assertion failed: calculated value (1.002067782531452) ouside allowed range (0-1)
            self.zsCtl = new ol.control.ZoomSlider({
                target: div,
                render: function (e) {
                    if (!e.frameState || !e.frameState.viewState || olMap.getView().getMinResolution() <= e.frameState.viewState.resolution) {
                        // GLS: para evitar que el slider se configure en horizontal
                        var render = function () {
                            if (this.element.offsetWidth > this.element.offsetHeight) {
                                if (!self.requestSliderSize) {
                                    self.requestSliderSize = window.requestAnimationFrame(render.bind(this));
                                }

                                window.requestAnimationFrame(render.bind(this));
                            } else if (this.element.offsetWidth < this.element.offsetHeight) {
                                if (self.requestSliderSize) {
                                    window.cancelAnimationFrame(self.requestSliderSize);
                                    delete self.requestSliderSize;
                                }
                                ol.control.ZoomSlider.render.call(this, e);
                            }
                        };
                        render.call(this);
                    }
                }
            });
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
        // Puede ser que se llame a refresh antes de que est\u00e9 inicializado ol.control.ZoomSlider. En ese caso llamamos a render que lo inicializa.
        // Como render necesita un ol.MapEvent, esperamos al evento POSTRENDER.
        if (self.zsCtl.sliderInitialized_) {
            var res = map.getView().getResolution();
            self.zsCtl.setThumbPosition_(res);
        }
        else {
            map.once(ol.MapEvent.Type.POSTRENDER, function (e) {
                self.zsCtl.render(e);
            });
        }
    };


    TC.wrap.control.Coordinates.prototype.register = function (map) {
        var self = this;
        var result = new $.Deferred();
        self.map = map;

        self._cleanCoordsTrigger = function (e) {
            var popup = self.map.getControlsByClass(TC.control.Popup)[0];
            if (e.toElement && $(e.toElement).attr('class') && popup && $(e.toElement).attr('class').indexOf(popup.CLASS) > -1)
                self.parent.coordsToClick({ coordinate: [(self.map.getExtent()[0] + self.map.getExtent()[2]) / 2, (self.map.getExtent()[1] + self.map.getExtent()[3]) / 2] });
            else
                self.parent.cleanCoordsPointer(e);
        };

        self._coordsTrigger = function (e) {
            self.parent.coordsToClick(e);
        };

        $.when(map.wrap.getMap()).then(function (olMap) {
            self.olMap = olMap;
            var projection = olMap.getView().getProjection();
            self.parent.crs = projection.getCode();
            self.parent.units = projection.getUnits();
            self.parent.isGeo = self.parent.units === ol.proj.Units.DEGREES;

            var viewport = olMap.getViewport();
            $(viewport).add(self.parent.div)
                .on(MOUSEMOVE + '.coords', function (e) {

                    //// si el movimiento se produce dentro del div del control de coordenadas no hacemos nada.
                    //if (e.currentTarget == self.parent.div)
                    //    return;

                    var coords = olMap.getEventCoordinate(e);
                    if (coords) {
                        if (self.parent.isGeo) {
                            self.parent.latLon = coords.reverse();
                        } else {
                            self.parent.xy = coords;
                        }
                        self.parent.update.apply(self.parent, arguments);
                    }

                })
                .on(MOUSEOUT, function (e) {
                    //if (e.currentTarget == self.parent.div && e.toElement == self.parent.div && $(e.toElement).parent() == self.parent.div)
                    //    return;

                    self.parent.clear.apply(self.parent, arguments);
                });

            result.resolve();
        });
        return result;



    };

    TC.wrap.control.Geolocation.prototype.register = function (map) {
        var self = this;
        self.map = map;

        self._snapTrigger = function (e) {
            if (e.dragging)
                return;

            self.initSnap(self.olMap.getEventCoordinate(e.originalEvent));
        };

        self._postcomposeTrigger = function (e) {
            self.duringTrackSnap(e);
        };

        $.when(map.wrap.getMap()).then(function (olMap) {
            self.olMap = olMap;
        });
    };

    TC.wrap.control.Geolocation.prototype.hasCoordinates = function () {
        var self = this;

        return self.trackData && self.trackData.trackFeature && self.trackData.trackFeature.getGeometry().getCoordinates().length >= 1;
    };

    var getTime = function (timeFrom, timeTo) {
        var diff = timeTo - timeFrom;
        var d = {
            s: Math.floor((diff / 1000) % 60),
            m: Math.floor(((diff / (1000 * 60)) % 60)),
            h: Math.floor(((diff / (1000 * 60 * 60)) % 24))
        };

        return $.extend({}, d, { toString: ("00000" + d.h).slice(-2) + ':' + ("00000" + d.m).slice(-2) + ':' + ("00000" + d.s).slice(-2) });
    };
    TC.wrap.control.Geolocation.prototype.getTooltip = function (d) {
        var self = this;

        if (!self.parent.elevationMarker)
            self.parent.elevationMarker = new ol.Overlay({
                element: self.parent.track.htmlElevationMarker,
                offset: [0, -11],
                positioning: ol.Overlay.Positioning.CENTER_CENTER,
                stopEvent: false
            });

        // GLS: si la capa del track est\u00e1 visible mostramos marcamos punto del gr\u00e1fico en el mapa
        if (self.parent.layerTrack.getVisibility() && self.parent.layerTrack.getOpacity() > 0) {
            $(self.parent.track.htmlElevationMarker).show();
            self.olMap.addOverlay(self.parent.elevationMarker);
            self.parent.elevationMarker.setPosition(self.parent.chart.coordinates[d[0].index]);
        }

        var extent = self.map.getExtent();
        var p = self.parent.chart.coordinates[d[0].index];
        if (extent[0] <= p[0] && p[0] <= extent[2] && extent[1] <= p[1] && p[1] <= extent[3]) { }
        else {
            TC.loadJS(!TC.feature || (TC.feature && !TC.feature.Point),
                [TC.apiLocation + 'TC/feature/Point.js'],
                function () {
                    self.map.setCenter(p.slice(0, 2), { animate: true });
                }
            );
        }

        var distance = d[0].x;
        distance = distance / 1000;

        var doneTime;
        if (self.parent.chart.coordinates[0].length == 4 && self.parent.chart.coordinates[0][3] > 0) {
            doneTime = getTime(self.parent.chart.coordinates[0][3], p[3]);
        }

        var locale = self.parent.map.options.locale && self.parent.map.options.locale.replace('_', '-') || undefined;
        var ele = parseInt(d[0].value.toFixed(0)).toLocaleString(locale);
        var dist;
        var measure;
        if (distance < 1) {
            dist = Math.round(distance * 1000);
            measure = ' m';
        } else {
            dist = Math.round(distance * 100) / 100;
            measure = ' km';
        }
        dist = dist.toLocaleString(locale);
        return '<div class="track-elevation-tooltip"><div><span>' + ele + ' m </span><br><span>' + dist + measure + ' </span></div>' + (doneTime ? '<span>' + doneTime.toString + '</span><div/>' : '');
    };

    TC.wrap.control.Geolocation.prototype.addWaypoint = function (position, properties) {
        var self = this;

        var waypoint = new ol.Feature({
            geometry: new ol.geom.Point([position[0], position[1], properties.ele, properties.time], ('XYZM'))
        });
        waypoint.setProperties(properties);

        self.parent.layerTracking.wrap.layer.getSource().addFeature(waypoint);
    };

    var visibleTrack = true;
    var trackingStyleFN = function (feature, resolution) {
        var geometry = feature.getGeometry();
        var type = geometry.getType().toLowerCase();
        var hidden = !visibleTrack;

        var styles = [];

        styles.push(new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 2,
                color: 'rgba(0,206,209, ' + (hidden && feature.get('tracking') ? 0 : 1) + ')',
                lineDash: [.1, 6]
            })
        }));

        if (type == 'point' && !hidden) {
            styles.push(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 3,
                    fill: new ol.style.Fill({ color: 'rgba(0,206,209, ' + (hidden && feature.get('tracking') ? 0 : .5) + ')' }),
                    stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 255, ' + (hidden && feature.get('tracking') ? 0 : 1) + ')', width: 1 })
                }),
                text: new ol.style.Text({
                    textAlign: 'center',
                    textBaseline: 'middle',
                    font: "bold" + ' ' + '14px' + ' ' + "Arial",
                    text: (hidden && feature.get('tracking') ? '' : feature.get('name')),
                    fill: new ol.style.Fill({ color: "rgba(0,206,209, " + (hidden && feature.get('tracking') ? 0 : 1) + ")" }),
                    stroke: new ol.style.Stroke({ color: "rgba(255, 255, 255, " + (hidden && feature.get('tracking') ? 0 : 1) + ")", width: parseInt(3, 10) }),
                    offsetX: parseInt(0, 10),
                    offsetY: parseInt(0, 10)
                })
            }));
        }

        return styles;
    };

    TC.wrap.control.Geolocation.prototype.setTrackOnMapVisibility = function (visible) {
        var self = this;

        visibleTrack = visible;
        self.parent.layerTracking.wrap.layer.setStyle(trackingStyleFN);
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

                if (x != lx || y != ly)
                    self.trackData.trackFeature.getGeometry().appendCoordinate([x, y, heading, m]);
            }
        }

        self.parent.$events.trigger($.Event(self.parent.Const.Event.STATEUPDATED, {
            moving: (heading != undefined && speed != undefined && speed > 0 && heading > 0)
        }));
    };

    TC.wrap.control.Geolocation.prototype.positionChangehandler = function (geoposition) {
        var self = this;
        var deferred = $.Deferred();
        var accuracy, heading, speed, altitude, altitudeAccuracy;

        if (geoposition && geoposition.coords) {
            self.parent.layerGPS.clearFeatures();

            accuracy = geoposition.coords.accuracy || 0;
            heading = geoposition.coords.heading || geoposition[2] || 0;
            speed = geoposition.coords.speed ? geoposition.coords.speed * 3.6 : 0;
            altitude = geoposition.coords.altitude || 0;
            altitudeAccuracy = geoposition.coords.altitudeAccuracy || 0;

            if (self.trackData && self.trackData.trackFeature) {
                var position_ = [geoposition.coords && geoposition.coords.longitude || geoposition[0], geoposition.coords && geoposition.coords.latitude || geoposition[1]];
                var projectedPosition = TC.Util.reproject(position_, 'EPSG:4326', self.parent.map.crs);

                self.addPosition(projectedPosition, heading, new Date().getTime(), speed, accuracy, altitudeAccuracy, altitude);

                var coords = self.trackData.trackFeature.getGeometry().getCoordinates();
                var len = coords.length;
                if (len >= 2) {
                    self.parent.deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
                }

                self.parent.$events.trigger($.Event(self.parent.Const.Event.POSITIONCHANGE, {
                    pd: {
                        "position": [projectedPosition[0], projectedPosition[1]],
                        "altitude": altitude,
                        "accuracy": accuracy,
                        "heading": TC.Util.radToDeg(heading),
                        "speed": speed
                    }
                }));

                $.when(self.parent.layerGPS.addPoint(projectedPosition, {
                    radius: 4,
                    fillColor: '#00CED1',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWidth: 2,
                    showsPopup: false
                }), self.parent.layerGPS.addCircle([projectedPosition, accuracy], {
                    strokeColor: '#00CED1',
                    strokeWidth: 0.4,
                    fillColor: '#ffffff',
                    fillOpacity: 0.2,
                    showsPopup: false
                })).done(function (marker, accuracyCircle) {
                    self.parent.geopositionTracking = true;

                    if (self.parent.firstPosition == false) {
                        self.parent.firstPosition = true;

                        if (!self.parent.$centerDiv) {
                            self.parent.$centerDiv = self.parent._$div.find('.' + self.parent.CLASS + '-track-center');

                            self.parent.$button = self.parent._$div.find('.' + self.parent.CLASS + '-track-center button');
                            self.parent.$button.on('click', function () {
                                self.parent.layerGPS.map.zoomToFeatures(self.parent.layerGPS.features);
                                self.parent.track.$info.find('.prsidebar-body').fadeIn('slide');
                                self.parent.track.$info.find('.prcollapsed').hide();
                            });

                            self.parent.$centerDiv.appendTo(self.parent.map._$div);
                            self.parent.$centerDiv.toggleClass(TC.Consts.classes.HIDDEN, false);

                        } else { self.parent.$centerDiv.toggleClass(TC.Consts.classes.HIDDEN, false); }

                        self.parent.layerGPS.map.zoomToFeatures(self.parent.layerGPS.features);
                    }

                    deferred.resolve({ marker: marker, accuracy: accuracyCircle });
                });

            } else { deferred.resolve(null); }
        } else { deferred.resolve(null); }

        return deferred.promise();
    };

    TC.wrap.control.Geolocation.prototype.setTracking = function (tracking) {
        var self = this;

        if (tracking) {
            self.parent.firstPosition = false;
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
                        self.trackData.trackFeature.setProperties({ 'tracking': true });
                    }
                }

                // qu\u00e9 pasa cuando quiera a\u00f1adir un nuevo segmento ¿? a\u00f1ado nuevo lineString equivalente a segmento pero d\u00f3nde¿?
                // lo que hay en session lo a\u00f1ado como feature a la capa y creo un nuevo linestring que ser\u00e1 el nuevo segmento
                // y lo referencio a self.trackData.trackFeature
            }
            else {
                self.trackData.trackFeature = new ol.Feature({
                    geometry: new ol.geom.LineString([], ('XYZM')),
                    tracking: true
                });
            }

            self.parent.layerTracking.wrap.layer.setSource(new ol.source.Vector({
                features: [self.trackData.trackFeature]
            }));

            if (sessionwaypoint.length > 0) {
                self.parent.layerTracking.wrap.addFeatures(sessionwaypoint);
            }

            self.parent.layerTracking.wrap.layer.setStyle(trackingStyleFN);

            if (self.trackData.trackFeature.getGeometry().getCoordinates().length > 1)
                self.parent.map.setExtent(self.parent.layerTracking.wrap.layer.getSource().getExtent());

            self.parent.currentPositionWaiting = self.parent.getLoadingIndicator().addWait();

            var getCurrentPositionInterval;
            var getCurrentPositionRequest = 0;
            var options = { enableHighAccuracy: true, timeout: 600000 };

            function getCurrentPosition() {
                var id = getCurrentPositionRequest++;
                navigator.geolocation.getCurrentPosition(
                  function (data) {
                      clearInterval(getCurrentPositionInterval);
                      self.parent.getLoadingIndicator().removeWait(self.parent.currentPositionWaiting);
                      self.positionChangehandler(data).then(function (obj) {
                          if (self.parent.geopositionTracking == true && obj && obj.marker && obj.accuracy) {
                              self.currentPositionTrk = navigator.geolocation.watchPosition(
                              self.positionChangehandler.bind(self),
                              self.parent.onGeolocateError.bind(self.parent), options);
                          }
                      });
                  },
                  function (error) {
                      switch (error.code) {
                          case error.TIMEOUT:
                              getCurrentPosition();
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
            }
            getCurrentPositionInterval = setInterval(getCurrentPosition, 1000);

            setTimeout(function () {
                if (self.trackData && self.trackData.trackFeature.getGeometry().getLastCoordinate().length == 0) {
                    clearInterval(getCurrentPositionInterval);

                    self.parent.getLoadingIndicator().removeWait(self.parent.currentPositionWaiting);
                    self.map.toast(self.parent.getLocaleString("geo.error.permission_denied"), { type: TC.Consts.msgType.WARNING });
                    self.parent.track.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
                    self.parent.track.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
                }
            }, options.timeout + 1000); // Wait extra second


        } else {
            visibleTrack = true;
            self.parent.firstPosition = false;
            window.navigator.geolocation.clearWatch(self.currentPositionTrk);

            delete self.trackData;

            if (self.parent.$centerDiv)
                self.parent.$centerDiv.toggleClass(TC.Consts.classes.HIDDEN, true);
        }
    };

    TC.wrap.control.Geolocation.prototype.activateSnapping = function () {
        var self = this;

        visibleTrack = true;

        if (!TC.Util.detectMobile()) {
            self.olMap.on([ol.MapBrowserEvent.EventType.POINTERMOVE, ol.MapBrowserEvent.EventType.SINGLECLICK], self._snapTrigger);
            self.olMap.on(ol.render.Event.Type.POSTCOMPOSE, self._postcomposeTrigger);
        }
    };
    TC.wrap.control.Geolocation.prototype.deactivateSnapping = function () {
        var self = this;

        $.when(self.parent.map.wrap.getMap()).then(function (olMap) {
            if (!TC.Util.detectMobile()) {
                olMap.un([ol.MapBrowserEvent.EventType.POINTERMOVE, ol.MapBrowserEvent.EventType.SINGLECLICK], self._snapTrigger);
                olMap.un(ol.render.Event.Type.POSTCOMPOSE, self._postcomposeTrigger);
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
    };
    TC.wrap.control.Geolocation.prototype.clear = function (layer) {
        var self = this;

        if (layer && layer.wrap.layer) {
            layer.wrap.layer.getSource().clear();
            layer.wrap.layer.setSource(new ol.source.Vector());
        }

        attachedDTD = false;

        self.deactivateSnapping.call(self);
    };
    var vectorCtx;
    TC.wrap.control.Geolocation.prototype.duringTrackSnap = function (e) {
        var self = this;

        var vectorContext = vectorCtx = e.vectorContext;

        if (vectorContext && self.snapLine) {
            if (typeof (vectorContext.setFillStrokeStyle) === 'function')
                vectorContext.setFillStrokeStyle(null, new ol.style.Stroke({
                    color: 'rgba(197, 39, 55, 1)',
                    width: 1
                }));

            if (typeof (vectorContext.drawGeometry) === 'function')
                vectorContext.drawGeometry(self.snapLine.wrap.feature.getGeometry());
        }
    };

    TC.wrap.control.Geolocation.prototype.initSnap = function (coordinate) {
        var self = this;

        if (self.parent.layerTrack) {
            var vectorSource = self.parent.layerTrack.wrap.layer.getSource();
            var closestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate);

            if (closestFeature !== null) {
                var geometry = closestFeature.getGeometry();
                var closestPoint = geometry.getClosestPoint(coordinate);

                var coordinates = [coordinate, [closestPoint[0], closestPoint[1]]];
                if (!self.snapLine) self.snapLine = new TC.feature.Polyline(coordinates);
                else self.snapLine.wrap.feature.getGeometry().setCoordinates(coordinates);


                // informaci\u00f3n del punto
                if (!self.snapInfoElement)
                    self.snapInfoElement = document.getElementsByClassName('tc-ctl-geolocation-track-snap-info')[0];


                self.snapInfoElement.style.display = 'block';

                if (!self.snapInfo) {
                    self.snapInfo = new ol.Overlay({
                        element: self.snapInfoElement,
                        offset: [5, 18]
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
                data.x = Math.round(closestPoint[0]).toLocaleString(locale);
                data.y = Math.round(closestPoint[1]).toLocaleString(locale);
                data.z = closestPoint.length >= 3 ? (Math.round(closestPoint[2] * 100) / 100).toLocaleString(locale) : undefined;
                data.m = closestPoint.length == 4 && closestPoint[3] > 0 ? new Date(closestPoint[3]).toLocaleString(locale) : undefined;

                if (data) {
                    self.parent.getRenderedHtml(self.parent.CLASS + '-track-snapping-node', data, function (html) {
                        self.snapInfoElement.innerHTML = html;
                    });
                }
            }

            self.olMap.render();
        }
    };

    var attachedDTD = false;
    TC.wrap.control.Geolocation.prototype.drawTrackingData = function (data) {
        var self = this;
        var deferred = $.Deferred();
        var featurePromises = [];

        var JSONParser = new TC.wrap.parser.JSON();
        var features = JSONParser.parser.readFeatures(data);

        self.activateSnapping.call(self);
        if (!attachedDTD) {
            $(document).on('mouseover', '.tc-ctl-p-results', function (e) {
                if (!self.parent.layerTrack.getVisibility() && self.parent.layerTrack.getOpacity() == 0)
                    self.deactivateSnapping.call(self);
            });

            $(document).on('mouseout', '.tc-ctl-p-results', function (e) {
                if (self.parent.layerTrack.getVisibility() && self.parent.layerTrack.getOpacity() > 0)
                    self.activateSnapping.call(self);
            });

            attachedDTD = true;
        }

        for (var i = 0, len = features.length; i < len; i++) {
            featurePromises.push(TC.wrap.Feature.createFeature(features[i]));
        }

        $.when.apply($, featurePromises).then(function () {
            for (var i = 0; i < arguments.length; i++) {
                var feat = arguments[i];
                if (feat) {
                    self.parent.layerTrack.addFeature(feat);
                }
            }
            self.parent.map.zoomToFeatures(self.parent.layerTrack.features);

            deferred.resolve();
        });

        return deferred.promise();
    };

    TC.wrap.control.Geolocation.prototype.formattedToStorage = function (layer, setTrackingProperty) {
        var self = this;

        var parser = new TC.wrap.parser.JSON();
        parser = parser.parser;

        var features = layer.wrap.layer.getSource().getFeatures();

        if (setTrackingProperty) {
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

    var segmentsUnion = function (lineStrings) {
        var mergedIndex = [];
        var coords = [];
        if (lineStrings.length > 1) {

            if (lineStrings[0].length == 4) {
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
                    if (mergedIndex.indexOf(ls) == -1) {
                        mergedIndex.push(ls);
                        coords = coords.concat(lineString.getCoordinates());
                    }
                    if (mergedIndex.indexOf(nextLineIndex) == -1) {
                        mergedIndex.push(nextLineIndex);
                        coords = coords.concat(lineStrings[nextLineIndex].getCoordinates());
                    }
                }
            }

            //self.map.toast(self.parent.getLocaleString("geo.trk.simulateWarning"), { type: TC.Consts.msgType.WARNING });

            return coords;
        }

        return lineStrings[0].getCoordinates();
    };

    TC.wrap.control.Geolocation.prototype.processImportedFeatures = function (wait) {
        var self = this;

        var source = self.parent.layerTrack.wrap.layer.getSource();
        var fileName = self.parent.importedFileName;
        var names = [];
        var toAdd = [];
        var toRemove = [];
        var maybeRemove = [];
        var features = source.getFeatures();

        var segments = [];
        var coord = [];
        for (var f = 0; f < features.length; f++) {
            var feature = features[f];

            if (feature instanceof TC.Feature)
                feature = features[f].wrap.feature;

            if (feature.getGeometry() instanceof ol.geom.Point) {
                coord.push(feature.getGeometry().getCoordinates());
                maybeRemove.push(feature);
            }
            else if (feature.getGeometry() instanceof ol.geom.LineString) {
                segments.push(feature.getGeometry());
                toRemove.push(feature);
            }
            else if (feature.getGeometry() instanceof ol.geom.MultiLineString) {
                var clone = feature.clone();

                if (clone.getProperties().hasOwnProperty("name")) {
                    if (clone.getProperties().name.trim().length > 0)
                        names.push(clone.getProperties().name);
                    else names.push(fileName);
                }
                else names.push(fileName);

                var ls = clone.getGeometry().getLineStrings();

                var coords = segmentsUnion(ls);
                toAdd.push(new ol.Feature({ geometry: new ol.geom.LineString(coords) }));
                toRemove.push(feature);
            }
        }

        if (segments.length > 0) {
            var coords = segmentsUnion(segments);
            toAdd.push(new ol.Feature({
                geometry: new ol.geom.LineString(coords)
            }));
        }

        if (coord.length > 0 && maybeRemove.length == features.length) {
            toAdd.push(new ol.Feature({
                geometry: new ol.geom.LineString(coord)
            }));
        }

        if (toRemove.length > 0)
            for (var i = 0; i < toRemove.length; i++)
                source.removeFeature(toRemove[i]);

        if (toAdd.length > 0) {
            var sameName = function (array, element) {
                var indices = [];
                var idx = array.indexOf(element);
                while (idx != -1) {
                    indices.push(idx);
                    idx = array.indexOf(element, idx + 1);

                    if (indices.length > 1)
                        return true;
                }

                return indices.length > 1 ? true : false;
            };

            var importedAll = new $.Deferred();
            var featureToAdd;
            var index = 0;
            var processAdd = function () {
                var promises = [];

                $.each(toAdd, function (ta) {
                    var def = new $.Deferred();

                    if (featureToAdd)
                        source.removeFeature(featureToAdd);

                    var name;
                    if (names.length > ta) {
                        var name = names[ta];
                        if (sameName(names, name))
                            name = '[' + (ta + 1) + ']' + ' ' + name;
                    }

                    self.parent.importedFileName = name ? name : fileName;

                    featureToAdd = toAdd[ta];
                    source.addFeature(featureToAdd);

                    self.parent.saveTrack(self.parent.getLocaleString('geo.trk.upload.ok', {
                        trackName: self.parent.importedFileName
                    })).then(function (importedIndex) {
                        if (ta == 0)
                            index = importedIndex;
                        def.resolve();
                    });

                    promises.push(def);
                });
                return $.when.apply(undefined, promises).promise();
            };
            processAdd().then(function () {
                self.parent.$events.trigger(self.parent.Const.Event.IMPORTEDTRACK, index);
                delete self.parent.importedFileName;

                var showFeatures = self.parent.layerTrack.features;
                if (showFeatures && showFeatures.length > 0) {
                    for (var i = 0; i < showFeatures.length; i++) {
                        showFeatures[i].showsPopup = false;
                    }
                }

                self.parent.map.setExtent(source.getExtent());
                self.parent.getLoadingIndicator().removeWait(wait);
            });
        } else {

            //// GLS: Para que el TOC refleje el cambio
            //for (var i = 0; i < self.parent.layerTrack.features.length; i++) {
            //    self.parent.layerTrack.removeFeature(self.parent.layerTrack.features[i]);
            //}

            if (self.parent.layerTrack) {
                self.parent.map.removeLayer(self.parent.layerTrack);
                self.parent.layerTrack = undefined;
            }

            delete self.parent.importedFileName;
            self.parent.getLoadingIndicator().removeWait(wait);
            TC.alert(self.parent.getLocaleString("geo.trk.upload.error4"));
        }
    };

    TC.wrap.control.Geolocation.prototype.import = function (wait, data, type) {
        var self = this;
        var vectorSource;
        var listenerKey;

        if (data && data.text) {

            var layerOptions = self.parent.layerTrack.wrap.createVectorSource({
                data: data.text,
                type: type
            });
            vectorSource = layerOptions.source;

            listenerKey = vectorSource.on('change', function (e) {
                if (vectorSource.getState() == 'ready') {
                    ol.Observable.unByKey(listenerKey);
                    self.processImportedFeatures(wait);
                }
            });

            var olLayer = self.parent.layerTrack.wrap.layer;
            olLayer.setSource(vectorSource);

        } else {

            if (self.parent.layerTrack) {
                self.parent.map.removeLayer(self.parent.layerTrack);
                self.parent.layerTrack = undefined;
            }

            delete self.parent.importedFileName;
            self.parent.getLoadingIndicator().removeWait(wait);
            TC.alert(self.parent.getLocaleString("geo.trk.upload.error4"));
        }
    };

    var idRequestAnimationFrame;
    TC.wrap.control.Geolocation.prototype.simulateTrackEnd = function () {
        var self = this;

        $(self.miProgressTextDiv).remove();
        $(self.miProgressDiv).remove();
        $(self.miDiv).remove();

        if (self.simulateMarker) {
            window.cancelAnimationFrame(idRequestAnimationFrame);
            if (self.simulateMarker.layer.wrap.layer.getSource().getFeatures().length > 0)
                self.simulateMarker.layer.removeFeature(self.simulateMarker);

            delete self.simulateMarker;
        }
    };

    TC.wrap.control.Geolocation.prototype.simulateTrack = function () {
        var self = this;

        var coordinates;
        var features = self.parent.layerTrack.wrap.layer.getSource().getFeatures();
        for (var ls = 0; ls < features.length; ls++) {
            if (features[ls].getGeometry() instanceof ol.geom.LineString) {
                coordinates = features[ls].getGeometry().getCoordinates();
                break;
            }
        }

        if (coordinates && coordinates.length > 0) {
            var first = coordinates[0];

            var setSimulateMarker = function () {
                var done = new $.Deferred();
                if (!self.simulateMarker) {
                    self.parent.layerTrack.addPoint(first.slice(0, 2), {
                        //url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAlCAYAAABGWhk4AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAABYgAAAWIBXyfQUwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAYGSURBVEiJlZdvaFvXFcB/7+mPI8lvjmxHil0vKkuq1bCuYbVsQrDxFup9aSAezA5pExpGRh26hdF0FOIv+9CyrLCh7dvABARmyIWB6Qad69Ik1PH8h67E0C6anbqTI8myZUeWZE1/nu4+6D7n2VZpcuCgq/vu/d37zjvn3HMVIQS1RFEUxWiaFECYFPE1AGtN6iNRAYv8VWVfRaouf2tKTbDcrQG1AXbZRgKLprGVWrtW93ZIqCJBdsAB1Mfj8d/H4/F3gXrZZyymmMz2SIQQu1RCrYATaAKeDoVC54WUUCh0HnhaPnPKscpejmJ+C5MJrMABQAMOpjY2xgpW13cB6sq5e02NjQPAQyAD/A8oA7tMstcUe8Gu8fHxM41ud/u1Ww/Ua7ceqI1ud/v4+PgZwCXHWOWc3ebYYwKLHOwGfG1tbV2ZbG51IZnT1bdnhfr2rFhI5vRMNrfa1tbWBfjk2AOGvQ2eecfm3dYBznA4fKHe5fS8MbmiVgRUBLwxuaLWu5yecDh8Qdq4rtauVZNtjY9mBxx9fX0tL3QEXv3wyy0xcT+9s/rE/TQffrklXugIvNrX19fCIw+xYvIQ1QRVzeBgMPia3W5zvPlRdJ8rvflRVLHbbY5gMPjaHrBqwC01TOC6evVq++DZs78JLaTUqWiWn//Aw7s/ahOXjh/icL1d+WI9j9OmKj9sb3t2e3t74s6dOymgxKNo3Oe3h4BjiURiUgghbi5vGe4r1lOp5fVUatn4bzxLJBKTwDE5d8evDTvbqEaUd2xsbNCYXNb10szMzGh/f//LwIvAi/39/S/PzMyMlnW9ZIwbGxsbBLySYTO+3S7ww4dbt4QQIrm29unQ0NArQC/QA3RL7QF6h4aGXkmurX0qhBDp9NYne8H7XGx+fv58Op22njp16pb8KCpAIBCoB5ibm8vKb1gBihMTEz1ut7sQCAT+AuSoJqiyERRGYLiohrHW0NDQEA6Hf+L3+497PJ5jLpfLC5DL5VaTyeRiJBL5bHBw8K/pdDpNNbS3gG2qIa4jd+sAGoEjwPeHh4cvbm5uLgqTFPWKKOoVc5fY3NxcHB4evgg8J+c2SpZVka9bJ+1z8ObNmxd7enp+pSiK9at0kd9Nx5mN5VhIbgPwnMdJZ6uLX59owddgRwhRvn379h96e3tvUE1MWaBgkVAHoF2/fr3r3Llzv1UUxfrnf63R/94iUytZYtkSugBdQCxbYi6eY+SzdZqcVjpaXKrP5+tyOp1zk5OTCaqZTleAbwGa3+9vnZ+ff0/TNN+f5lb55cR/9wZcTflj3xF+EfCSyWS+6ujo+GkkEokBmZ0UOTo6ekHTNN/iZoG3Pl55LCjAWx+vsLhZQNM03+jo6AXpBNad/NDa2noc4J2pGNulrz0j98l2qcI7UzEAJMNugC2A1e12Pwvwzwe5x4YaYsyRDCtgUQF1YGCg2eFwNGeKOvdS+ScG30vlyRR1HA5H88DAQDOgqoCIRqMFIYSos6jY1P0H7jeJTVWos6gIIUQ0Gi0AQgUq09PTW7lcbsVuUXje63xi8PNeJ3aLQi6XW5ment4CKirV8CttbGz8G6DniPbEYGOOZJQAXaXq0MVIJDIFcO1kC09p9seGPqXZuXayBQDJ2ElCGtVwbkwkEiNer7frH/fTvBT+D+VK7YLREKuq8LfBZ/jxdxpYXV2dOXz48M+ADSBrLvjUeDx+9/Tp02f8zc66l545yJ2VLMntck3o9w45+PtZP93f1iiVSpnLly8PLSwsJKhmuAJUE7OL6tFydGRk5FI+n08KIUShrIvQ3XXx+gfL4sSNz8WJG5+L1z9YFqG766JQ1oUQQuTz+eTIyMgl4KhkuCRzp/jTAA9wtLu7++TS0tL74htkaWnp/e7u7pMS6pEMO2CpdfQfoJrtXMFgsKOzs7OztbW1vampyQ+QSqUisVjsi9nZ2dkrV67MUz018lQTfBFZxylCiFr1sI1qOq1jd80A1SOpLCEFqSVMx78QQuxUmya4sYBFAo22+aqgSy2b2hVMFWetMtasxkK17iDGlWHnTmIuY/8P3C0FYo4OztIAAAAASUVORK5CYII=",
                        //anchor: [0.5, 0]
                        radius: 7,
                        fillColor: '#ff0000',
                        strokeColor: '#ffffff',
                        strokeWidth: 2
                    }).then(function (f) {
                        done.resolve(f);
                    });
                } else {
                    self.simulateMarker.setCoords(first.slice(0, 2));
                    done.resolve(self.simulateMarker);
                }

                return done;
            };
            setSimulateMarker().then(function (f) {
                self.simulateMarker = f;

                var animationFrameFraction = function () {
                    var trackLength = coordinates.length;
                    var start, finish;
                    var duration;
                    var fraction;
                    var hasTime = false;

                    if (self.parent.hasElevation) {

                        var dataDiv = d3.select(".c3-event-rects,.c3-event-rects-single").node().getBoundingClientRect();
                        $('body').append('<div class="miDiv">');
                        self.miDiv = $('div.miDiv');
                        self.miDiv.width(dataDiv.width);
                        self.miDiv.height(dataDiv.height);

                        self.miDiv.append('<div class="miProgressDiv">');
                        self.miProgressDiv = $('div.miProgressDiv');
                        self.miProgressDiv.addClass("tc-ctl-geolocation-track-elevation-chart-progress");
                        self.miProgressDiv.width('0%');
                        self.miProgressDiv.height(dataDiv.height);

                        self.miProgressDiv.append('<div class="miProgressTextDiv">');
                        self.miProgressTextDiv = $('div.miProgressTextDiv');
                        self.miProgressTextDiv.addClass("tc-ctl-geolocation-track-elevation-chart-progress text");
                        self.miProgressTextDiv.width(dataDiv.width);
                        self.miProgressTextDiv.height(dataDiv.height);

                        self.miDiv.css({
                            top: dataDiv.top, left: dataDiv.left, bottom: dataDiv.bottom, right: dataDiv.right, position: 'absolute', 'z-index': 10000
                        });
                    }

                    var arCoordinates = coordinates;
                    if (arCoordinates[0].length == 4 && arCoordinates[0][3] > 0) {
                        start = arCoordinates[0][3];
                        finish = arCoordinates[arCoordinates.length - 1][3];
                        hasTime = true;
                    } else {
                        arCoordinates[0][3] = Date.now();

                        for (var i = 1; i < arCoordinates.length; i++) {
                            var done;
                            arCoordinates[i][3] = 0;

                            if (i + 1 < arCoordinates.length)
                                done = new ol.geom.LineString(arCoordinates.slice(i - 1, i + 1)).getLength();
                            else
                                done = new ol.geom.LineString(arCoordinates.slice(i - 1)).getLength();

                            arCoordinates[i][3] = arCoordinates[i - 1][3] + (3600000 * done / self.parent.walkingSpeed);
                        }

                        start = arCoordinates[0][3];
                        finish = arCoordinates[arCoordinates.length - 1][3];
                    }

                    var trackFilm = new ol.geom.LineString(arCoordinates);
                    var timestamp = start;
                    var distance = trackFilm.getLength();
                    var done = 0;
                    var getDoneAtM = function (m) {
                        for (var i = 0; i < arCoordinates.length; i++) {
                            if (arCoordinates[i][3] > m)
                                return {
                                    d: new ol.geom.LineString(arCoordinates.slice(0, i)).getLength(),
                                    p: arCoordinates[i - 1].slice(0, 2)
                                };
                        }
                    };

                    var loopAtFraction = function () {

                        if (!self.parent.simulate_paused) {
                            var position = trackFilm.getCoordinateAtM(timestamp);
                            var d = getDoneAtM(timestamp);

                            if (fraction >= 1 || !position || !d) {
                                self.simulateTrackEnd();
                                var li = self.parent.getSelectedTrack();
                                if (li)
                                    self.parent.uiSimulate(false, li);

                                $(self.miProgressTextDiv).remove();
                                $(self.miProgressDiv).remove();
                                $(self.miDiv).remove();

                                return;
                            } else {

                                if (self.parent.hasElevation) {
                                    done = d.d;
                                    var progress = (done + Math.hypot(d.p[0] - position[0], d.p[1] - position[1])) / distance * 100;
                                    self.miProgressDiv.width(progress + '%');

                                    // progress.toFixed(2) + '%' + '<br>' + ;                                              
                                    var doneTime;
                                    if (hasTime) {
                                        doneTime = getTime(arCoordinates[0][3], position[3]);
                                    }

                                    var locale = self.parent.map.options.locale && self.parent.map.options.locale.replace('_', '-') || undefined;
                                    var ele = parseInt(position[2].toFixed(0)).toLocaleString(locale);
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

                                    self.miProgressTextDiv.html('<div><span>' + ele + ' m' + '</span>' + '<br>' + '<span>' + dist + measure + '</span></div>' + (hasTime ? '<br><span>' + doneTime.toString + '</span>' : ''));
                                }

                                if (self.simulateMarker) {
                                    var from = self.simulateMarker.getCoords();
                                    var to = position;
                                    var rotation = Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI;

                                    self.simulateMarker.setCoords(position);
                                    //self.simulateMarker.setStyle({ angle: rotation });
                                }

                                if (self.parent.simulate_speed !== 1)
                                    timestamp = timestamp + (self.parent.delta * self.parent.simulate_speed);
                                else
                                    timestamp = timestamp + self.parent.delta;
                            }
                        }

                        idRequestAnimationFrame = requestAnimationFrame(loopAtFraction);
                    };
                    idRequestAnimationFrame = requestAnimationFrame(loopAtFraction);

                };

                var hasD3 = new $.Deferred();
                if (window.d3) {
                    hasD3.resolve();
                }
                else {
                    TC.loadJS(!window.d3, [TC.Consts.url.D3C3], function () {
                        hasD3.resolve();
                    });
                }
                hasD3.then(function () {
                    idRequestAnimationFrame = requestAnimationFrame(animationFrameFraction);
                });
            });
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

    TC.wrap.control.Geolocation.prototype.pulsate = function (circle) {
        var self = this;

        self.pulsated = true;

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
        listenerKey = self.olMap.on(ol.render.Event.Type.POSTCOMPOSE, function (event) {
            var vectorContext = event.vectorContext;
            var frameState = event.frameState;

            var elapsed = frameState.time - start;

            var f = circle.wrap.feature.getGeometry().clone();
            var r = getRadius(elapsed);
            f.setRadius(r);

            vectorContext.setFillStrokeStyle(
                new ol.style.Fill({
                    color: 'rgba(0, 0, 0, 0.1)'
                }),
                new ol.style.Stroke({ color: 'rgba(255, 0, 0, .8)', width: 1 })
            );
            vectorContext.drawCircleGeometry(f);

            if (elapsed > duration) {
                ol.Observable.unByKey(listenerKey);
                return;
            }

            frameState.animate = true;
        });
    };

    TC.wrap.control.Coordinates.prototype.coordsActivate = function () {
        var self = this;

        self.olMap.on(ol.MapBrowserEvent.EventType.SINGLECLICK, self._coordsTrigger);

        var viewport = self.olMap.getViewport();
        $(viewport).on(MOUSEOUT, self._cleanCoordsTrigger);
    };

    TC.wrap.control.Coordinates.prototype.coordsDeactivate = function () {
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

                            view.animate({ center: newCenter, duration: TC.Consts.ZOOM_ANIMATION_DURATION })
                        })
                        .drag(function (e, dd) {
                            var $drag = $(this);
                            var bottom = parseInt($drag.css('bottom'));
                            var left = parseInt($drag.css('left'));
                            if (dd.limit.top) {
                                $drag.css('bottom', Math.min(Math.max(boxBottom - dd.deltaY, dd.limit.bottom), dd.limit.top) + 'px');
                                $drag.css('left', Math.min(Math.max(boxLeft + dd.deltaX, dd.limit.left), dd.limit.right) + 'px');
                            } else {
                                $drag.css('bottom', (boxBottom - dd.deltaY) + 'px');
                                $drag.css('left', (boxLeft + dd.deltaX) + 'px');
                            }
                        });
                });

            $.when(map.wrap.getMap()).then(function (olMap) {

                // Modificamos mapa para que tenga la proyecci\u00f3n correcta
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
            // La siguiente l\u00ednea es para actualizar mapa de situaci\u00f3n
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
                //Por qu\u00e9 en workLayers est\u00e1n el vectorial de medici\u00f3n, y cosas as\u00ed?
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

    var addLayerToService = function (service, layer, name) {
        var path = layer.getPath(name);
        service.layers.push({
            name: name,
            title: path[path.length - 1],
            path: path.slice(1),
            features: []
        });
    };

    TC.wrap.control.FeatureInfo.prototype.getFeatureInfo = function (xy, options) {
        var self = this;
        var opts = options || {};
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
                    //Por qu\u00e9 en workLayers est\u00e1n el vectorial de medici\u00f3n, y cosas as\u00ed?
                    if (source.getGetFeatureInfoUrl && $.inArray(layer, map.workLayers) >= 0 && layer.names.length > 0
                        && (!opts.serviceUrl || opts.serviceUrl === layer.url)) { // Mirar si en las opciones pone que solo busque en un servicio

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
                        if (opts.layerName) { // Mirar si en las opciones pone que solo busque en una capa
                            if (disgregatedNames.indexOf(opts.layerName) >= 0 && olLayer._wrap.getInfo(opts.layerName).queryable) {
                                addLayerToService(targetService, layer, opts.layerName);
                                auxInfo[layer.title].layers.push(opts.layerName);
                            }
                        }
                        else {
                            for (var i = 0; i < disgregatedNames.length; i++) {
                                var name = disgregatedNames[i];
                                if (olLayer._wrap.getInfo(name).queryable) {
                                    addLayerToService(targetService, layer, name);
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
            }

            var size = opts.mapSize || olMap.getSize();
            var roundedx = Math.round(xy[0]);
            var roundedy = Math.round(xy[1]);
            var bbox = opts.boundingBox || map.getExtent();
            var resolution = olMap.getView().getResolution();

            for (var title in targetServices) {
                var targetService = targetServices[title];
                var source = auxInfo[title].source;
                var layers = auxInfo[title].layers;
                var params = source.getParams();
                source.params_.LAYERS = layers.join(',');
                var url = source.getGetFeatureInfoUrl(xy, resolution, map.crs, {
                    'QUERY_LAYERS': layers.join(','),
                    'INFO_FORMAT': params.INFO_FORMAT,
                    'FEATURE_COUNT': 1000,
                    'radius': map.options.pixelTolerance,
                    'buffer': map.options.pixelTolerance
                });

                url = url
                    .replace(/I=\d+(\.\d+)?/, 'I=' + roundedx) // Se redondea porque en IE pone decimales si el zoom de la p\u00e1gina no es 100%
                    .replace(/J=\d+(\.\d+)?/, 'J=' + roundedy)
                    .replace(/WIDTH=\d+/, 'WIDTH=' + size[0])
                    .replace(/HEIGHT=\d+/, 'HEIGHT=' + size[1])
                    .replace(/BBOX=-?\d+(\.\d+)?\%2C-?\d+(\.\d+)?\%2C-?\d+(\.\d+)?\%2C-?\d+(\.\d+)?/, 'BBOX=' + bbox.join('%2C'))
                    .replace(/sld_body=[a-zA-Z%0-9._]*/); // Quitamos el par\u00e1metro sld_body


                var expUrl = url;
                //proxificar si es necesario
                if (targetService.mapLayer.usesProxy) {
                    url = TC.proxify(url);
                }
                else if (targetService.mapLayer.usesSSL) {
                    url = url.replace(/^(f|ht)tp?:\/\//i, "https://");
                }
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
                                            var pa = layer.getNodePath(na);
                                            var pb = layer.getNodePath(nb);
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
                                                    if (!opts.featureId || feature.getId() === opts.featureId) { // Mirar si en las opciones pone que solo busque una feature
                                                        featurePromises.push(TC.wrap.Feature.createFeature(feature));
                                                        featureInsertionPoints.push(l.features);
                                                    }
                                                    break;
                                                }
                                            }

                                            //si llegamos aqu\u00ed y no he encontrado su layer, es que no cuadraba el prefijo del fid con el id del layer
                                            //esto pasa, p.ej, en cartociudad
                                            if (!found) {
                                                //as\u00ed que creo un layer de palo para la respuesta del featInfo
                                                var fakeLayer;
                                                if (fakeLayers[layerName]) fakeLayer = fakeLayers[layerName];
                                                else {
                                                    fakeLayer = {
                                                        name: layerName, title: layerName, features: []
                                                    };
                                                    fakeLayers[layerName] = fakeLayer;
                                                    service.layers.push(fakeLayer);
                                                }

                                                if (!opts.featureId || feature.getId() === opts.featureId) { // Mirar si en las opciones pone que solo busque una feature
                                                    featurePromises.push(TC.wrap.Feature.createFeature(feature));
                                                    featureInsertionPoints.push(fakeLayer.features);
                                                }
                                            }
                                        }
                                    }//iteraci\u00f3n sobre las features de esta respuesta


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
                                // En este caso lo m\u00e1s probable es que el servidor est\u00e9 devolviendo una excepci\u00f3n
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
                            // Si hay features cargamos el m\u00f3dulo de geometria para encontrar una que se interseque con el punto
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
                                                    name: key,
                                                    value: typeof (value) == "number" ? value.toLocaleString(TC.Util.getMapLocale(self.parent.map)) : value
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
            function (a, b, c) { // error
                map.$events.trigger(TC.Consts.event.NOFEATUREINFO);
                map.toast(self.parent.getLocaleString('featureInfo.error'), {
                    type: TC.Consts.msgType.ERROR
                });
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
                //Por qu\u00e9 en workLayers est\u00e1n el vectorial de medici\u00f3n, y cosas as\u00ed?
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
                olLayer.getSource().on('addfeature', function (event) {
                    event.feature._wrap.parent.showsPopup = false;
                });
                self.drawCtrl.handleEvent = function (event) {
                    //esta \u00f1apa para solucionar cuando haces un primer punto y acontinuaci\u00f3n otro muy r\u00e1pido
                    if (event.type == ol.MapBrowserEvent.EventType.SINGLECLICK) {
                        if (semaforo && this.sketchCoords_[0].length == 2 && this.sketchFeature_ !== null) // GLS: A\u00f1ado la misma validaci\u00f3n (this.sketchFeature_ !== null) que tiene el c\u00f3digo de OL antes de invocar addToDrawing_ 
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
                            if (services[title].request && services[title].request.promise() == this) {
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
                                TC.error("No hay ninguna capa v\u00e1lida para el servicio " + service.mapLayer.title + " por lo que no se consultar\u00e1 dicho servicio");
                                defer.resolve(null);
                                return;
                            }
                            if (capabilities.Operations.GetFeature.CountDefault)
                                _numMaxFeatures = capabilities.Operations.GetFeature.CountDefault.DefaultValue;
                            if (!self.queryBuilder)
                                self.queryBuilder = function (_url, _capabilities, _coordinates, _availableLayers, _onlyHits) {
                                    //a\u00f1adimos los atributos del nodo padre del capabilities al primer nodo del GetFeature
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
                                            err: "NumMaxFeatures", limit: _numMaxFeatures, message: "Se ha superado el m\u00e1ximo de {0} elementos de este servicio", service: service
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
                                                var pa = layer.getPath(na);
                                                var pb = layer.getPath(nb);
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

                                                //si llegamos aqu\u00ed y no he encontrado su layer, es que no cuadraba el prefijo del fid con el id del layer
                                                //esto pasa, p.ej, en cartociudad
                                                if (!found) {
                                                    //as\u00ed que creo un layer de palo para la respuesta del featInfo
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
                                        }//iteraci\u00f3n sobre las features de esta respuesta

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

                    view.animate({
                        center: ct, easing: function (percent) {
                            if (percent === 0) self.parent.map.$events.trigger($.Event(TC.Consts.event.PANANIMATIONSTART));
                            if (percent === 1) self.parent.map.$events.trigger($.Event(TC.Consts.event.PANANIMATIONEND));
                            return percent;
                        }
                    });
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
                    popup, ol.Object.getChangeEventType(ol.Overlay.Property.OFFSET),
                    popup.handleOffsetChanged, popup);
                ol.events.listen(
                    popup, ol.Object.getChangeEventType(ol.Overlay.Property.OFFSET),
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
                    popup, ol.Object.getChangeEventType(ol.Overlay.Property.OFFSET),
                    popup._newHandleOffsetChanged, popup);
                ol.events.listen(
                    popup, ol.Object.getChangeEventType(ol.Overlay.Property.OFFSET),
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
                var stroke = style[0].getStroke();
                var fill = style[0].getFill();
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

    var createNativeFeature = function (coords, geometryConstructor, geometryName) {
        var result;
        var featureOptions = {};
        var gn = geometryName || 'geometry';
        featureOptions[gn] = new geometryConstructor(coords);
        result = new ol.Feature(featureOptions);
        if (geometryName) {
            result.setGeometryName(geometryName);
        }
        return result;
    };

    var createNativeFeature = function (coords, geometryConstructor, geometryName) {
        var result;
        var featureOptions = {};
        var gn = geometryName || 'geometry';
        featureOptions[gn] = new geometryConstructor(coords);
        result = new ol.Feature(featureOptions);
        if (geometryName) {
            result.setGeometryName(geometryName);
        }
        return result;
    };

    TC.wrap.Feature.prototype.createPoint = function (coords, options) {
        var self = this;

        if ($.isArray(coords)) {
            self.feature = createNativeFeature(coords, ol.geom.Point, options.geometryName);
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            self.parent.geometry = coords.getGeometry().getCoordinates();
        }
        self.feature._wrap = self;
        self.feature.setStyle(createNativeStyle({ styles: { point: options } }, self.feature));
    };

    TC.wrap.Feature.prototype.createMarker = function (coords, options) {
        var self = this;

        var iconUrl = TC.Util.getPointIconUrl(options);
        if (iconUrl) {
            options.url = iconUrl;
            if ($.isArray(coords)) {
                self.feature = createNativeFeature(coords, ol.geom.Point, options.geometryName);
            }
            else if (self.isNative(coords)) {
                self.feature = coords;
                self.parent.geometry = coords.getGeometry().getCoordinates();
            }
            self.feature._wrap = self;
            self.feature.setStyle(createNativeStyle({ styles: { marker: options } }, self.feature));
        }
        else {
            self.createPoint(coords, options);
        }
    };

    TC.wrap.Feature.prototype.createPolyline = function (coords, options) {
        var self = this;

        if ($.isArray(coords)) {
            self.feature = createNativeFeature(coords, ol.geom.LineString, options.geometryName);
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            self.parent.geometry = coords.getGeometry().getCoordinates();
        }
        self.feature._wrap = self;
        if (options) {
            self.feature.setStyle(createNativeStyle({ styles: { line: options } }, self.feature));
        }
    };

    TC.wrap.Feature.prototype.createPolygon = function (coords, options) {
        var self = this;

        if ($.isArray(coords)) {
            if (coords.length) {
                var ringCoords = coords[0];
                if ($.isArray(ringCoords) && ringCoords.length) {
                    var pointCoord = ringCoords[0];
                    if (!$.isArray(pointCoord)) {
                        // anillo solo, lo metemos dentro de un array de anillos
                        coords = [coords];
                    }
                    for (var i = 0; i < coords.length; i++) {
                        ringCoords = coords[i];
                        var startPoint = ringCoords[0];
                        var endPoint = ringCoords[ringCoords.length - 1];
                        if (startPoint[0] !== endPoint[0] || startPoint[1] !== endPoint[1]) {
                            ringCoords[ringCoords.length] = startPoint;
                        }
                        self.parent.geometry = coords;
                        self.feature = createNativeFeature(coords, ol.geom.MultiLineString, options.geometryName);
                    }
                    self.parent.geometry = coords;
                    self.feature = createNativeFeature(coords, ol.geom.Polygon, options.geometryName);
                }
            }
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            self.parent.geometry = coords.getGeometry().getCoordinates();
        }
        self.feature._wrap = self;
        var opts = options || {};
        if (opts.strokeColor || opts.strokeWidth || opts.fillColor || opts.fillOpacity) {
            self.feature.setStyle(createNativeStyle({ styles: { polygon: opts } }, self.feature));
        }
    };


    TC.wrap.Feature.prototype.createMultiPolyline = function (coords, options) {
        var self = this;

        if ($.isArray(coords)) {
            if (coords.length) {
                var plnCoords = coords[0];
                if ($.isArray(plnCoords) && plnCoords.length) {
                    var pointCoord = plnCoords[0];
                    if (!$.isArray(pointCoord)) {
                        // polil\u00ednea sola, la metemos dentro de un array de polil\u00edneas
                        coords = [coords];
                    }
                    self.parent.geometry = coords;
                    self.feature = createNativeFeature(coords, ol.geom.MultiLineString, options.geometryName);
                }
            }
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            self.parent.geometry = coords.getGeometry().getCoordinates();
        }
        self.feature._wrap = self;
        if (options) {
            self.feature.setStyle(createNativeStyle({ styles: { line: options } }, self.feature));
        }
    };

    TC.wrap.Feature.prototype.createMultiPolygon = function (coords, options) {
        var self = this;

        if ($.isArray(coords)) {
            if (coords.length) {
                var pgnCoords = coords[0];
                if ($.isArray(pgnCoords) && pgnCoords.length) {
                    var ringCoords = pgnCoords[0];
                    if ($.isArray(ringCoords) && ringCoords.length) {
                        var pointCoord = ringCoords[0];
                        if (!$.isArray(pointCoord)) {
                            // pol\u00edgono solo, lo metemos dentro de un array de pol\u00edgonos
                            coords = [coords];
                        }
                    }
                    else {
                        // anillo solo, lo metemos de un array de anillos y este en un array de pol\u00edgonos
                        coords = [[coords]];
                    }
                    // Close rings
                    for (var i = 0, ii = coords.length; i < ii; i++) {
                        pgnCoords = coords[i];
                        for (var j = 0, jj = pgnCoords.length; j < jj; j++) {
                            ringCoords = pgnCoords[j];
                            var startPoint = ringCoords[0];
                            var endPoint = ringCoords[ringCoords.length - 1];
                            if (startPoint[0] !== endPoint[0] || startPoint[1] !== endPoint[1]) {
                                ringCoords[ringCoords.length] = startPoint;
                            }
                        }
                    }
                    self.parent.geometry = coords;
                    self.feature = createNativeFeature(coords, ol.geom.MultiPolygon, options.geometryName);
                }
            }
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            self.parent.geometry = coords.getGeometry().getCoordinates();
        }
        self.feature._wrap = self;
        var opts = options || {};
        if (opts.strokeColor || opts.strokeWidth || opts.fillColor || opts.fillOpacity) {
            self.feature.setStyle(createNativeStyle({ styles: { polygon: opts } }, self.feature));
        }
    };

    TC.wrap.Feature.prototype.createCircle = function (coords, options) {
        var self = this;

        if ($.isArray(coords) &&
            $.isArray(coords[0])
            && typeof coords[0][0] === 'number' && typeof coords[0][1] === 'number'
            && typeof coords[1] === 'number') {

            var featureOptions = {};
            var geometryName = options.geometryName || 'geometry';
            featureOptions[geometryName] = new ol.geom.Circle(coords[0], coords[1]);
            self.feature = new ol.Feature(featureOptions);
            if (options.geometryName) {
                self.feature.setGeometryName(options.geometryName);
            }
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            var nativeGeometry = coords.getGeometry();
            self.parent.geometry = [nativeGeometry.getCenter(), nativeGeometry.getRadius()];
        }
        self.feature._wrap = self;
        if (options) {
            self.feature.setStyle(
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: options.strokeColor,
                        width: options.strokeWidth,
                        lineDash: options.lineDash
                    }),
                    fill: new ol.style.Fill({
                        color: getRGBA(options.fillColor, options.fillOpacity)
                    })
                })
            );
        }
    };

    TC.wrap.Feature.createFeature = function (olFeat) {
        var result = new $.Deferred();
        var olGeometry = olFeat.getGeometry();
        var options = {
            id: olFeat.getId()
        };

        // geometr\u00eda
        var geomStr;
        switch (true) {
            case olGeometry instanceof ol.geom.Point:
                var olStyle = olFeat.getStyle();
                if ($.isFunction(olStyle)) {
                    olStyle = olStyle.call(olFeat);
                }
                var olStyles = olStyle ? ($.isArray(olStyle) ? olStyle : [olStyle]) : [];
                for (var i = 0, len = olStyles.length; i < len; i++) {
                    olStyle = olStyles[i];
                    if (olStyle.getImage() instanceof ol.style.Icon) {
                        geomStr = 'Marker';
                        break;
                    }
                }
                geomStr = geomStr || 'Point';
                break;
            case olGeometry instanceof ol.geom.LineString:
                geomStr = 'Polyline';
                break;
            case olGeometry instanceof ol.geom.Polygon:
                geomStr = 'Polygon';
                break;
            case olGeometry instanceof ol.geom.MultiLineString:
                geomStr = 'MultiPolyline';
                break;
            case olGeometry instanceof ol.geom.MultiPolygon:
                geomStr = 'MultiPolygon';
                break;
            default:
                break;
        }
        if (geomStr) {
            TC.loadJS(
                !TC.feature || (TC.feature && !TC.feature[geomStr]),
                [TC.apiLocation + 'TC/feature/' + geomStr + '.js'],
                function () {
                    var feat = new TC.feature[geomStr](olFeat, options);
                    feat.data = feat.wrap.getData();
                    result.resolve(feat);
                }
            );
        }
        else {
            TC.loadJS(
                !TC.Feature,
                [TC.apiLocation + 'TC/Feature.js'],
                function () {
                    var feat = new TC.Feature(olFeat, options);
                    feat.data = feat.wrap.getData();
                    result.resolve(feat);
                }
            );
        }

        return result;
    };

    TC.wrap.Feature.prototype.cloneFeature = function () {
        return this.feature.clone();
    };

    TC.wrap.Feature.prototype.getStyle = function () {
        var self = this;
        var result = {};
        var olStyle = self.feature.getStyle();
        if ($.isFunction(olStyle)) {
            olStyle = olStyle.call(self.feature);
        }
        var olStyles = olStyle ? ($.isArray(olStyle) ? olStyle : [olStyle]) : [];

        for (var i = 0, len = olStyles.length; i < len; i++) {
            olStyle = olStyles[i];
            var fill = olStyle.getFill();
            if (fill) {
                result.fillColor = fill.getColor();
                if ($.isArray(result.fillColor)) {
                    result.fillOpacity = result.fillColor[3];
                }
            }
            var stroke = olStyle.getStroke();
            if (stroke) {
                result.strokeColor = stroke.getColor();
                result.strokeWidth = stroke.getWidth();
            }
            var image = olStyle.getImage();
            if (image instanceof ol.style.Icon) {
                result.url = image.getSrc();
                var size = image.getSize();
                var anchor = image.getAnchor();
                result.anchor = [anchor[0], anchor[1]];
                if (image.anchorXUnits_ === ol.style.Icon.AnchorUnits.PIXELS) {
                    result.anchor[0] = result.anchor[0] / size[0];
                }
                if (image.anchorYUnits_ === ol.style.Icon.AnchorUnits.PIXELS) {
                    result.anchor[1] = result.anchor[1] / size[1];
                }
            }
            var text = olStyle.getText();
            if (text) {
                result.label = text.getText();
                var font = text.getFont();
                if (font) {
                    // A 96dpi 3pt = 4px
                    result.fontSize = parseInt(font.match(/\d+pt/)) || parseInt(font.match(/\d+px/)) * 0.75;
                }
                var rotation = text.getRotation();
                if (rotation) {
                    result.angle = -180 * rotation / Math.PI;
                }
                result.labelOffset = [text.getOffsetX(), text.getOffsetY()];
                fill = text.getFill();
                if (fill) {
                    result.fontColor = fill.getColor();
                }
                stroke = text.getStroke();
                if (stroke) {
                    result.labelOutlineColor = stroke.getColor();
                    result.labelOutlineWidth = stroke.getWidth();
                }
            }
        }
        $.extend(self.parent.options, result);
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
            var point,
                points,
                ringsOrPolylines,
                polygons,
                isMultiPolygon,
                isPolygonOrLineString,
                isLineString;
            // punto: array de n\u00fameros
            // l\u00ednea o anillo: array de puntos
            // multil\u00ednea o pol\u00edgono: array de l\u00edneas o anillos
            // multipol\u00edgono: array de pol\u00edgonos
            // Por tanto podemos recorrer los tipos en un switch sin breaks
            switch (true) {
                case (geom instanceof ol.geom.MultiPolygon):
                    isMultiPolygon = true;
                    polygons = geometry;
                    if ($.isArray(polygons)) {
                        ringsOrPolylines = geometry[0];
                    }
                case (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiLineString):
                    isPolygonOrLineString = true;
                    ringsOrPolylines = isMultiPolygon ? ringsOrPolylines : geometry;
                    if ($.isArray(ringsOrPolylines)) {
                        points = ringsOrPolylines[0];
                    }
                case (geom instanceof ol.geom.LineString):
                    isLineString = true;
                    points = isPolygonOrLineString ? points : geometry;
                    if ($.isArray(points)) {
                        point = points[0];
                    }
                case (geom instanceof ol.geom.Point):
                    point = isLineString ? point : geometry;
                    if ($.isArray(point) && typeof point[0] === 'number' && typeof point[1] === 'number') {
                        geom.setCoordinates(geometry);
                        result = true;
                    }
                    break;
                case (geom instanceof ol.geom.Circle):
                    if ($.isArray(geometry) &&
                        $.isArray(geometry[0])
                        && typeof geometry[0][0] === 'number' && typeof geometry[0][1] === 'number'
                        && typeof geometry[1] === 'number') {
                        geom.setCenterAndRadius(geometry[0], geometry[1]);
                        result = true;
                    }
                    break;
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

    TC.wrap.Feature.prototype.setId = function (id) {
        var self = this;
        if (self.feature) {
            self.feature.setId(id);
        };
    };

    TC.wrap.Feature.prototype.setStyle = function (options) {
        var self = this;
        var olFeat = self.feature;
        var feature = self.parent;
        var geom = olFeat.getGeometry();
        if (geom instanceof ol.geom.Point) {
            var imageOptions;
            if (options.anchor) { // Marcador
                var styleIcon = {
                    anchor: getStyleValue(options.anchor, feature),
                    src: TC.Util.getPointIconUrl(options),
                    size: [getStyleValue(options.width, feature), getStyleValue(options.height, feature)]
                };
                if (options.angle)
                    styleIcon.angle = options.angle;

                imageOptions = new ol.style.Icon(styleIcon);
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
                        width: getStyleValue(options.strokeWidth, feature),
                        lineDash: options.lineDash
                    });
                }

                if (!isNaN(circleOptions.radius))
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
                    width: getStyleValue(options.strokeWidth, feature),
                    lineDash: options.lineDash
                })
            }));
        }
        else if (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon) {
            olFeat.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: getStyleValue(options.strokeColor, feature),
                    width: getStyleValue(options.strokeWidth, feature),
                    lineDash: options.lineDash
                }),
                fill: new ol.style.Fill({
                    color: getRGBA(getStyleValue(options.fillColor, feature), getStyleValue(options.fillOpacity, feature))
                })
            }));
        }
    };

    TC.wrap.Feature.prototype.getInnerPoint = function (options) {
        var result;
        var opts = options || {};
        // Funciones para hacer clipping con el extent actual. As\u00ed nos aseguramos de que el popup sale en un punto visible actualmente.
        var feature = this.feature;
        var geometry = feature.getGeometry();

        var clipCoord = function (coord) {
            var clipBox = opts.clipBox;
            coord[0] = Math.min(Math.max(coord[0], clipBox[0]), clipBox[2]);
            coord[1] = Math.min(Math.max(coord[1], clipBox[1]), clipBox[3]);
        };
        var clipGeometry = function clipGeometry(geom) {
            if (opts.clipBox) {
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
            }
        };

        result = geometry.getFirstCoordinate();
        switch (geometry.getType()) {
            case ol.geom.GeometryType.MULTI_POLYGON:
                geometry = geometry.getPolygon(0);
            case ol.geom.GeometryType.POLYGON:
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
                result = geometry.getInteriorPoint().getCoordinates();
                var rings = geometry.getLinearRings();
                // Miramos si el punto est\u00e1 dentro de un agujero
                for (var i = 1; i < rings.length; i++) {
                    if (isInsideRing(result, rings[i].getCoordinates())) {
                        result = geometry.getClosestPoint(result);
                        break;
                    }
                }
                break;
            case ol.geom.GeometryType.MULTI_LINE_STRING:
                geometry = geometry.getLineString(0);
            case ol.geom.GeometryType.LINE_STRING:
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
                result = geometry.getClosestPoint(centroid);
                break;
            default:
                break;
        }
        return result;
    };

    TC.wrap.Feature.prototype.showPopup = function (popupCtl) {
        var self = this;
        var map = popupCtl.map;

        if (map) {
            var feature = self.feature;
            if (feature) {
                map.currentFeature = self.parent;
                var currentExtent = map.getExtent();

                self._innerCentroid = self.getInnerPoint({ clipBox: currentExtent });

                popupCtl.$contentDiv.html(self.parent.getInfo());
                if (popupCtl.options.closeButton) {
                    var n = popupCtl.$popupDiv.find("." + popupCtl.CLASS + '-close').length;
                    if (n == 0) {
                        var $btn = $('<div>').addClass(popupCtl.CLASS + '-close').attr('title', popupCtl.getLocaleString('close')).appendTo(popupCtl.$popupDiv);
                        $btn.on(TC.Consts.event.CLICK, function () {
                            popupCtl.hide();
                        });
                        popupCtl.$contentDiv.addClass(popupCtl.CLASS + '-has-btn');
                        // En OL2 los featureInfo en versi\u00f3n "baraja de cartas" salen sin tama\u00f1o.
                        // Para evitar esto, la clase tc-ctl-finfo tiene ancho y alto establecidos.
                        // Pero eso hace que en el popup salgan barras de scroll, porque contentDiv se crea demasiado peque\u00f1o.
                        // Rehacemos el tama\u00f1o de tc-ctl-finfo para eliminarlas.
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
                                style = layer.wrap.styleFunction(feature);
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
        var self = this;
        var result = self.feature.getProperties();
        // En caso de clusters
        if ($.isArray(result.features)) {
            if (result.features.length === 1) {
                result = result.features[0].getProperties();
            }
            else {
                result = result.features.length + ' elementos';
            }
        }
        var geometryName = self.feature.getGeometryName();
        if (result[geometryName]) {
            delete result[geometryName];
        }
        return result;
    };

    TC.wrap.Feature.prototype.setData = function (data) {
        this.feature.setProperties(data);
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
            if (geom instanceof ol.geom.Polygon) {
                result.geometry = new TC.feature.Polygon(geom.getCoordinates());
            }
            else if (geom instanceof ol.geom.LineString) {
                result.geometry = new TC.feature.Polyline(geom.getCoordinates());
            }
            else if (geom instanceof ol.geom.Point) {
                result.geometry = new TC.feature.Point(geom.getCoordinates());
            }
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

        var type;
        switch (mode) {
            case TC.Consts.geom.POLYGON:
                type = ol.geom.GeometryType.POLYGON;
                break;
            case TC.Consts.geom.POINT:
                type = ol.geom.GeometryType.POINT;
                break;
            default:
                type = ol.geom.GeometryType.LINE_STRING;
                break;
        }
        if (self.parent.map) {
            $.when(self.parent.map.wrap.getMap(), self.parent.getLayer()).then(function (olMap, layer) {
                self.units = olMap.getView().getProjection().getUnits();
                $.when(layer && layer.wrap.getLayer()).then(function (olLayer) {

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

                    if (self.snapInteraction) {
                        olMap.removeInteraction(self.snapInteraction);
                    }

                    if (mode) {
                        self.$viewport
                            .on(TC.Consts.event.CLICK, self, self.clickHandler)
                        if (self.parent.measure)
                            self.$viewport
                            .on(MOUSEMOVE + '.draw', self, self.mouseMoveHandler)
                            .on(MOUSEOVER, self, self.mouseOverHandler);

                        var drawOptions = {
                            type: type,
                            snapTolerance: 0,
                            condition: function () {
                                if (ol.events.condition.shiftKeyOnly(arguments[0])) {
                                    hole = olMap.forEachFeatureAtPixel(olMap.getPixelFromCoordinate(arguments[0].coordinate), function (feature) {
                                        if (ol.geom.GeometryType.POLYGON == feature.getGeometry().getType() ||
                                            ol.geom.GeometryType.MULTI_POLYGON == feature.getGeometry().getType()) {
                                            return feature;
                                        }
                                        return null;
                                    });
                                }
                                return true;
                            }
                        };
                        if (olLayer) {
                            drawOptions.source = olLayer.getSource();
                            drawOptions.style = olLayer.getStyle();
                        }
                        else {
                            var mapStyles = self.parent.map.options.styles.selection;
                            drawOptions.style = createNativeStyle({
                                styles: {
                                    point: $.extend({}, mapStyles.point, { fillOpacity: 0 }),
                                    line: mapStyles.line,
                                    polygon: mapStyles.polygon
                                }
                            });
                        }
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
                            self.parent.$events.trigger($.Event(TC.Consts.event.DRAWSTART));
                        }, this);

                        self.interaction.on('drawend', function (evt) {
                            if (self.parent.measure) {
                                self.parent.$events.trigger($.Event(TC.Consts.event.MEASURE, self.getMeasureData()));
                            }
                            else {
                                self.parent.$events.trigger($.Event(TC.Consts.event.DRAWEND, self.getGeometry()));
                            }
                            self.sketch = null;
                        }, this);

                        olMap.addInteraction(self.interaction);

                        if (self.parent.snapping) {
                            var snapOptions = {};
                            if (olLayer) {
                                snapOptions.source = olLayer.getSource();
                            }
                            else if (self.parent.snapping instanceof TC.Layer) {
                                snapOptions.source = self.parent.snapping.wrap.layer.getSource();
                            }
                            self.snapInteraction = new ol.interaction.Snap(snapOptions);
                            olMap.addInteraction(self.snapInteraction);
                        }
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
                if (self.$viewport) {
                    self.$viewport.off(TC.Consts.event.CLICK, self.clickHandler);
                }
                if (layer) {
                    layer.clearFeatures();
                }
                if (self.interaction) {
                    olMap.removeInteraction(self.interaction);
                    self.interaction = null;
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
                    Al menos con linestring, no necesariamente hay que quitar el \u00faltimo
                    Porque OL mete en coordinates del sketchFeature_ tanto el \u00faltimo marcado como el que flota detr\u00e1s del cursor
                    Para comprobar que realmente es \u00e9se, podemos contrastarlo con self.interaction.sketchPoint_.getGeometry().getCoordinates()
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
            var layer = layers[i];
            var schema = {
                layerId: layer.id
            };
            var olSource = layer.wrap.layer.getSource();
            if (olSource.getUrls) {
                schema.url = olSource.getUrls()[0];
            }
            if (olSource.getTileGrid) {
                var tileGrid = olSource.getTileGrid();
                var resolutions = tileGrid.getResolutions();
                var matrixIds = tileGrid.getMatrixIds();
                var node = layer.getLayerNodeByName(layer.layerNames);
                var tmsLimits = null;
                for (var j = 0, llen = node.TileMatrixSetLink.length; j < llen; j++) {
                    var tmsl = node.TileMatrixSetLink[j];
                    if (tmsl.TileMatrixSet === layer.matrixSet) {
                        tmsLimits = tmsl.TileMatrixSetLimits;
                        break;
                    }
                }
                schema.tileMatrixLimits = [];
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
                    if (tmsLimits) {
                        var tmsLimit = tmsLimits[j];
                        if (tmsLimit) {
                            tml.cl = Math.max(tml.cl, tmsLimit.MinTileCol);
                            tml.cr = Math.min(tml.cr, tmsLimit.MaxTileCol);
                            tml.rt = Math.max(tml.rt, tmsLimit.MinTileRow);
                            tml.rb = Math.min(tml.rb, tmsLimit.MaxTileRow);
                        }
                    }
                    if (tml.cl <= tml.cr && tml.rt <= tml.rb) {
                        schema.tileMatrixLimits.push(tml);
                    }
                }
            }
            result[i] = schema;
        }
        return result;
    };

    TC.wrap.control.CacheBuilder.prototype.getGetTilePattern = function (layer) {
        var result = "";
        var olSource = layer.wrap.layer.getSource();
        if (olSource.getUrls) {
            result = olSource.getUrls()[0];
        }
        if (layer.options.encoding !== TC.Consts.WMTSEncoding.RESTFUL) {
            if (result.indexOf('?') < 0) {
                result = result + '?';
            }
            if (result.indexOf('?') === result.length - 1) {
                result = result + 'layer=' + layer.layerNames + '&style=default&tilematrixset=' + encodeURIComponent(layer.matrixSet) +
                    '&Service=WMTS&Request=GetTile&Version=1.0.0&Format=' + encodeURIComponent(layer.format) +
                    '&TileMatrix={TileMatrix}&TileCol={TileCol}&TileRow={TileRow}';
            }
        }
        return result;
    };

    TC.wrap.control.Edit.prototype.activate = function (mode) {
        var self = this;
        self.cancel(true);
        //if (!self.session) {
        //    self.session = {
        //        features: []
        //        , featuresAdded: []
        //        , featuresRemoved: []
        //        , featuresModified: []
        //    };
        //}
        if (mode === TC.Consts.editMode.SELECT) {
            if (self.parent.map) {
                $.when(self.parent.map.wrap.getMap(), self.parent.layer.wrap.getLayer()).then(function (olMap, olLayer) {
                    var mapStyles = self.parent.map.options.styles.selection;
                    if (self.selectInteraction) {
                        olMap.removeInteraction(self.selectInteraction);
                    }
                    var select = new ol.interaction.Select({
                        layers: [olLayer],
                        style: createNativeStyle({
                            styles: {
                                point: $.extend({}, mapStyles.point, { fillOpacity: 0 }),
                                line: mapStyles.line,
                                polygon: mapStyles.polygon
                            }
                        })
                    });
                    self.selectInteraction = select;
                    olMap.addInteraction(select);
                    var getWrapperFeature = function (elm) {
                        return elm._wrap.parent;
                    };
                    select.on('select', function (event) {
                        //self.measureHandler(event.object, event.feature.geometry, TC.Consts.event.MEASUREPARTIAL);
                        if (event.selected.length > 0) {
                            self.parent.$events.trigger($.Event(TC.Consts.event.FEATURESSELECT, { ctrl: self, features: event.selected.map(getWrapperFeature) }));
                        }
                        if (event.deselected.length > 0 && event.selected.length == 0) {
                            self.parent.$events.trigger($.Event(TC.Consts.event.FEATURESUNSELECT, { ctrl: self.parent, features: event.deselected.map(getWrapperFeature) }));
                        }
                    });
                    if (self.modifyInteraction) {
                        olMap.removeInteraction(self.modifyInteraction);
                    }
                    var modify = new ol.interaction.Modify({
                        features: select.getFeatures(),
                        style: createNativeStyle({
                            styles: {
                                point: $.extend({}, mapStyles.point, { fillOpacity: 0 }),
                                line: mapStyles.line,
                                polygon: mapStyles.polygon
                            }
                        })
                    });
                    modify.on(ol.interaction.Modify.EventType.MODIFYEND, function (e) {
                        e.features.forEach(function (feature) {
                            feature._wrap.parent.geometry = feature._wrap.getGeometry();
                            self.parent.$events.trigger($.Event(TC.Consts.event.FEATUREMODIFY, { feature: feature._wrap.parent, layer: self.parent.layer }));
                        });
                    });
                    self.modifyInteraction = modify;
                    olMap.addInteraction(modify);

                    if (self.snapInteraction) {
                        olMap.removeInteraction(self.snapInteraction);
                    }
                    if (self.parent.snapping) {
                        self.snapInteraction = new ol.interaction.Snap({
                            source: olLayer.getSource()
                        });
                        olMap.addInteraction(self.snapInteraction);
                    }
                });
            }

        }
    };

    TC.wrap.control.Edit.prototype.deactivate = function () {
        var self = this;
        ////unbind de los eventos
        if (self.modifyInteraction) {
            //    self.modifyInteraction.layer.events.un("afterfeaturemodified");
            //    self.modifyInteraction.layer.events.un("beforefeaturemodified");
            //    self.modifyInteraction.layer.events.un("vertexmodified");
            //    self.modifyInteraction.layer.events.un("vertexremoved");
            self.modifyInteraction.setActive(false);
            self.selectInteraction.setActive(false);
            //self.modifyInteraction.destroy();
            $.when(self.parent.map.wrap.getMap()).then(function (olMap) {
                olMap.removeInteraction(self.modifyInteraction);
                self.modifyInteraction = null;
                self.selectInteraction = null;
            });
            //    self.modifyInteraction.destroy();
            //    self.modifyInteraction = null;
        }
        if (self.drawInteraction) {
            self.drawInteraction.abortDrawing_();
            self.drawInteraction.setActive(false);
            //self.drawInteraction.destroy();
            $.when(self.parent.map.wrap.getMap()).then(function (olMap) {
                olMap.removeInteraction(self.drawInteraction);
                self.drawInteraction = null;
            });
            //    self.control.layer.events.un("sketchcomplete");
            //    self.control.deactivate();
            //    self.control.destroy();
            //    self.control = null;
        }
        self.parent.$events.trigger($.Event(TC.Consts.event.CONTROLDEACTIVATE, { ctrl: self }));
        //self.session = null;        
    };

    TC.wrap.control.Edit.prototype.cancel = function (deactivate, cancelTxt) {
        var self = this;
        self.points = [];
        self.histPoints = [];
        var layer = (self.control && self.control.layer) || (self.modifyInteraction && self.modifyInteraction.layer);
        //if (!self.session || ((self.modifyInteraction && self.modifyInteraction.modified) || (self.session.featuresAdded && self.session.featuresAdded.length)) && cancelTxt && !confirm(cancelTxt))
        //    return;
        if (self.selectInteraction) {
            var features = self.selectInteraction.getFeatures();
            self.parent.$events.trigger($.Event(TC.Consts.event.FEATURESUNSELECT, { ctrl: self.parent, feature: features.get(0) }));
            features.clear();
            self.selectInteraction.setActive(false);
        }
        //if (self.drawInteraction) {
        //    self.drawInteraction.abortDrawing_();
        //    if (deactivate) {
        //        self.drawInteraction.setActive(false);
        //    }
        //}
        //if(self.modifyInteraction)
        //{
        //    if (self.modifyInteraction.feature)
        //        self.modifyInteraction.unselectFeature(self.modifyInteraction.feature);
        //    if (deactivate)
        //    {
        //        self.modifyInteraction.deactivate();
        //    }   
        //}
        ////if (self.session.featuresAdded && self.session.featuresAdded.length > 0) {
        ////    layer.removeFeatures(self.session.featuresAdded);
        ////    self.session.featuresAdded = [];
        ////}
        //self.parent.$events.trigger($.Event(TC.Consts.event.EDITIONCANCEL, { ctrl: self }));
        ////no se por que hostias se cambia el renderIntent a las features
        //$.each(layer.features, function (i, feat) {
        //    feat.renderIntent = "";
        //});    
        //layer.removeAllFeatures();
        //layer.addFeatures(self.session.features);        
        //self.clearSession();
    };

    TC.wrap.control.Edit.prototype.getSelectedFeatures = function () {
        var self = this;
        var result = [];
        if (self.selectInteraction) {
            self.selectInteraction.getFeatures().forEach(function (elm) {
                result[result.length] = elm._wrap.parent;
            });
        }
        return result;
    };

    TC.wrap.control.Edit.prototype.setSelectedFeatures = function (features) {
        var self = this;
        if (self.selectInteraction) {
            var source = self.selectInteraction.featureOverlay_.getSource();
            source.clear();
            source.addFeatures(features.map(function (elm) {
                return elm.wrap.feature;
            }));
        }
    };

    TC.wrap.control.Edit.prototype.deleteFeatures = function (features) {
        var self = this;
        if ($.isArray(features)) {
            var olFeatures = features.map(function (elm) {
                return elm.wrap.feature;
            });
            $.when(self.parent.layer.wrap.getLayer()).then(function (olLayer) {
                var selectedFeatures = self.selectInteraction ? self.selectInteraction.getFeatures() : null;
                for (var i = 0, len = olFeatures.length; i < len; i++) {
                    var olFeature = olFeatures[i];
                    if (selectedFeatures) {
                        selectedFeatures.remove(olFeature);
                        self.parent.$events.trigger($.Event(TC.Consts.event.FEATURESUNSELECT, { feature: olFeature._wrap.parent }));
                    }
                    olLayer.getSource().removeFeature(olFeature);
                    self.parent.$events.trigger($.Event(TC.Consts.event.FEATUREREMOVE, { feature: olFeature._wrap.parent }));
                }
            });
        }
    };

    //TC.wrap.control.Edit.prototype.clearSession = function () {
    //    var self = this;
    //    delete self.session;
    //};

})();

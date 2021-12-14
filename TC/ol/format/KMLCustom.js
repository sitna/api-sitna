/**
 * @typedef {Object} Vec2
 * @property {number} x
 * @property {ol.style.IconAnchorUnits} xunits
 * @property {number} y
 * @property {ol.style.IconAnchorUnits} yunits
 * @property {ol.style.IconOrigin} origin
 */

/**
 * @typedef {Object} GxTrackObject
 * @property {Array<number>} flatCoordinates
 * @property {Array<number>} whens
 */

(function () {

    /**
     * @const
     * @type {Array<string>}
     */
    const GX_NAMESPACE_URIS = [
        'http://www.google.com/kml/ext/2.2'
    ];


    /**
     * @const
     * @type {Array<null|string>}
     */
    let NAMESPACE_URIS = [
        null,
        'http://earth.google.com/kml/2.0',
        'http://earth.google.com/kml/2.1',
        'http://earth.google.com/kml/2.2',
        'http://www.opengis.net/kml/2.2'
    ];

    // GLS: Obtenemos las combinaciones posibles
    const getAllCombinations = function (array) {
        var combi = [];
        var temp = [];

        var len = Math.pow(2, array.length);

        for (var i = 0; i < len; i++) {
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
    const cleanCombinationsByFormat = function (customURIS, formatURIS) {
        if (customURIS && customURIS.length > 0) {
            for (var i = 0; i < formatURIS.length; i++) {
                var index = customURIS.indexOf(formatURIS[i]);
                if (index > -1)
                    customURIS.splice(index, 1);
            }
        }
    };

    // GLS: Obtenemos los nuevos URIS para KML
    const CUSTOM_NAMESPACE_URIS = getAllCombinations(NAMESPACE_URIS.slice().slice(1));
    // GLS: Nos quedamos con las combinaciones nuevas
    cleanCombinationsByFormat(CUSTOM_NAMESPACE_URIS, NAMESPACE_URIS);
    NAMESPACE_URIS = NAMESPACE_URIS.concat(CUSTOM_NAMESPACE_URIS);

    /**
     * @type {Object<string, ol.style.IconAnchorUnits>}
     */
    const ICON_ANCHOR_UNITS_MAP = {
        'fraction': ol.style.IconAnchorUnits.FRACTION,
        'pixels': ol.style.IconAnchorUnits.PIXELS,
        'insetPixels': ol.style.IconAnchorUnits.PIXELS
    };

    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const PLACEMARK_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'ExtendedData': extendedDataParser,
            'Region': regionParser,
            'MultiGeometry': ol.xml.makeObjectPropertySetter(
                readMultiGeometry, 'geometry'),
            'LineString': ol.xml.makeObjectPropertySetter(
                readLineString, 'geometry'),
            'LinearRing': ol.xml.makeObjectPropertySetter(
                readLinearRing, 'geometry'),
            'Point': ol.xml.makeObjectPropertySetter(
                readPoint, 'geometry'),
            'Polygon': ol.xml.makeObjectPropertySetter(
                readPolygon, 'geometry'),
            'Style': ol.xml.makeObjectPropertySetter(readStyle),
            'StyleMap': placemarkStyleMapParser,
            'address': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'description': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'name': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'open': ol.xml.makeObjectPropertySetter(ol.format.xsd.readBoolean),
            'phoneNumber': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'styleUrl': ol.xml.makeObjectPropertySetter(readURI),
            'visibility': ol.xml.makeObjectPropertySetter(ol.format.xsd.readBoolean)
        }, ol.xml.makeStructureNS(
            GX_NAMESPACE_URIS, {
                'MultiTrack': ol.xml.makeObjectPropertySetter(
                    readGxMultiTrack, 'geometry'),
                'Track': ol.xml.makeObjectPropertySetter(
                    readGxTrack, 'geometry')
            }
        ));


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const LINK_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'href': ol.xml.makeObjectPropertySetter(readURI)
        });


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const REGION_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'LatLonAltBox': latLonAltBoxParser,
            'Lod': lodParser
        });


    /**
     * @type {import("../color.js").Color}
     */
    let DEFAULT_COLOR;

    /**
     * @type {ol.style.Fill}
     */
    let DEFAULT_FILL_STYLE = null;

    /**
     * Get the default fill style (or null if not yet set).
     * @return {ol.style.Fill} The default fill style.
     */
    function getDefaultFillStyle() {
        return DEFAULT_FILL_STYLE;
    }

    /**
     * @type {import("../size.js").Size}
     */
    let DEFAULT_IMAGE_STYLE_ANCHOR;

    /**
     * @type {ol.style.IconAnchorUnits}
     */
    let DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;

    /**
     * @type {ol.style.IconAnchorUnits}
     */
    let DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;

    /**
     * @type {import("../size.js").Size}
     */
    let DEFAULT_IMAGE_STYLE_SIZE;

    /**
     * @type {string}
     */
    let DEFAULT_IMAGE_STYLE_SRC;

    /**
     * @type {number}
     */
    let DEFAULT_IMAGE_SCALE_MULTIPLIER;

    /**
     * @type {import("../style/Image.js").default}
     */
    let DEFAULT_IMAGE_STYLE = null;

    /**
     * Get the default image style (or null if not yet set).
     * @return {import("../style/Image.js").default} The default image style.
     */
    function getDefaultImageStyle() {
        return DEFAULT_IMAGE_STYLE;
    }

    /**
     * @type {string}
     */
    let DEFAULT_NO_IMAGE_STYLE;

    /**
     * @type {ol.style.Stroke}
     */
    let DEFAULT_STROKE_STYLE = null;

    /**
     * Get the default stroke style (or null if not yet set).
     * @return {ol.style.Stroke} The default stroke style.
     */
    function getDefaultStrokeStyle() {
        return DEFAULT_STROKE_STYLE;
    }

    /**
     * @type {ol.style.Stroke}
     */
    let DEFAULT_TEXT_STROKE_STYLE;

    /**
     * @type {ol.style.Text}
     */
    let DEFAULT_TEXT_STYLE = null;

    /**
     * Get the default text style (or null if not yet set).
     * @return {ol.style.Text} The default text style.
     */
    function getDefaultTextStyle() {
        return DEFAULT_TEXT_STYLE;
    }

    /**
     * @type {ol.style.Style}
     */
    let DEFAULT_STYLE = null;

    /**
     * @type {Array<ol.style.Style>}
     */
    let DEFAULT_STYLE_ARRAY = null;

    const getRGBA = function (color, opacity) {
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


    function createStyleDefaults() {
        // Rehacemos los estilos por defecto de KML para que se adecúen al de la API
        DEFAULT_COLOR = [255, 255, 255, 1];

        DEFAULT_FILL_STYLE = new ol.style.Fill({
            color: getRGBA(TC.Cfg.styles.polygon.fillColor, TC.Cfg.styles.polygon.fillOpacity)
        });

        DEFAULT_IMAGE_STYLE_ANCHOR = [20, 2]; // FIXME maybe [8, 32] ?

        DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS = ol.style.IconAnchorUnits.PIXELS;

        DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS = ol.style.IconAnchorUnits.PIXELS;

        DEFAULT_IMAGE_STYLE_SIZE = [64, 64];

        DEFAULT_IMAGE_STYLE_SRC =
            'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';

        DEFAULT_IMAGE_SCALE_MULTIPLIER = 0.5;

        DEFAULT_IMAGE_STYLE = new ol.style.Icon({
            anchor: DEFAULT_IMAGE_STYLE_ANCHOR,
            anchorOrigin: ol.style.IconOrigin.BOTTOM_LEFT,
            anchorXUnits: DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS,
            anchorYUnits: DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS,
            crossOrigin: 'anonymous',
            rotation: 0,
            scale: DEFAULT_IMAGE_SCALE_MULTIPLIER,
            size: DEFAULT_IMAGE_STYLE_SIZE,
            src: DEFAULT_IMAGE_STYLE_SRC
        });

        DEFAULT_NO_IMAGE_STYLE = 'NO_IMAGE';

        DEFAULT_STROKE_STYLE = new ol.style.Stroke({
            color: getRGBA(TC.Cfg.styles.line.strokeColor, 1),
            width: TC.Cfg.styles.line.strokeWidth || 1
        });

        DEFAULT_TEXT_STROKE_STYLE = new ol.style.Stroke({
            color: [51, 51, 51, 1],
            width: 2
        });

        DEFAULT_TEXT_STYLE = new ol.style.Text({
            font: 'bold 16px Helvetica',
            fill: DEFAULT_FILL_STYLE,
            stroke: DEFAULT_TEXT_STROKE_STYLE,
            scale: 0.8
        });

        DEFAULT_STYLE = new ol.style.Style({
            fill: DEFAULT_FILL_STYLE,
            image: DEFAULT_IMAGE_STYLE,
            text: DEFAULT_TEXT_STYLE,
            stroke: DEFAULT_STROKE_STYLE,
            zIndex: 0
        });

        DEFAULT_STYLE_ARRAY = [DEFAULT_STYLE];

    }

    const namespaceURISmanage = function (source, format) {
        const xml = ol.xml.parse(source);
        const tags = xml.getElementsByTagName(format.toLowerCase());
        if (tags && tags.length > 0) {
            var value = tags[0].getAttribute('xmlns');
            if (value && value.indexOf(' ') > -1 && NAMESPACE_URIS.indexOf(value) > -1) {
                const values = value.split(' ');
                const namespaces = [];
                for (var i = 0; i < values.length; i++) {
                    namespaces.push(('xmlns:' + format.toLowerCase() + i) + "=\"" + values[i].trim() + "\"");
                }
            }
        }

        return source;
    };

    /**
     * @typedef {Object} Options
     * @property {boolean} [extractStyles=true] Extract styles from the KML.
     * @property {boolean} [showPointNames=true] Show names as labels for placemarks which contain points.
     * @property {Array<ol.style.Style>} [defaultStyle] Default style. The
     * default default style is the same as Google Earth.
     * @property {boolean} [writeStyles=true] Write styles into KML.
     */


    class KMLCustom extends ol.format.KML {

        /**
         * @param {Options=} opt_options Options.
         */
        constructor(opt_options) {

            super(opt_options);

            const options = opt_options ? opt_options : {};


            if (!DEFAULT_STYLE_ARRAY) {
                createStyleDefaults();
            }

            this.defaultStyle_ = options.defaultStyle ?
                options.defaultStyle : DEFAULT_STYLE_ARRAY;
        }

        readFeatures(source, opt_options) {
            if (typeof source === 'string') {
                const kmlTag = '<kml';
                let startIdx = source.indexOf(kmlTag);
                if (startIdx >= 0) {
                    startIdx += kmlTag.length;
                    if (source.indexOf('xmlns:xsi=') < 0) {
                        source = source.substr(0, startIdx) + ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' + source.substr(startIdx);
                    }

                    source = namespaceURISmanage(source, 'KML');
                }
            }
            const result = ol.format.KML.prototype.readFeatures.call(this, source, opt_options);
            // El parser no pone id si la entidad del archivo no lo tiene. Añadimos uno.
            result.forEach(function (f) {
                if (!f.getId()) {
                    f.setId(TC.getUID());
                }
            });
            return result;
        }

        readDocumentOrFolder_(node, objectStack) {
            // FIXME use scope somehow
            const parsersNS = ol.xml.makeStructureNS(
                NAMESPACE_URIS, {
                    'Document': ol.xml.makeArrayExtender(this.readDocumentOrFolder_, this),
                    'Folder': ol.xml.makeArrayExtender(this.readDocumentOrFolder_, this),
                    'Placemark': ol.xml.makeArrayPusher(this.readPlacemark_, this),
                    'Style': this.readSharedStyle_.bind(this),
                    'StyleMap': this.readSharedStyleMap_.bind(this)
                });
            /** @type {Array<Feature>} */
            const features = ol.xml.pushParseAndPop([], parsersNS, node, objectStack, this);
            if (features) {
                // Reescritura de código para leer las carpetas del KML
                if (node.localName == 'Folder') {
                    for (let i = 0, ii = features.length; i < ii; i++) {
                        const feature = features[i];
                        if (!Array.isArray(feature._folders)) {
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
                ///////////////////////////////////////////////////////
                return features;
            } else {
                return undefined;
            }
        }

        readPlacemark_(node, objectStack) {
            const object = ol.xml.pushParseAndPop({ 'geometry': null },
                PLACEMARK_PARSERS, node, objectStack);
            if (!object) {
                return undefined;
            }  
            const feature = new ol.Feature();
            const id = node.getAttribute('id');
            if (id !== null) {
                feature.setId(id);
            }
            const options = objectStack[0];

            const geometry = object['geometry'];
            if (geometry) {
                ol.format.Feature.transformWithOptions(geometry, false, options);
            }
            feature.setGeometry(geometry);
            delete object['geometry'];

            if (this.extractStyles_) {
                let style = object['Style'];
                let styleUrl = object['styleUrl'];
                const styleFunction = createFeatureStyleFunction(
                    style, styleUrl, this.defaultStyle_, this.sharedStyles_,
                    this.showPointNames_);
                feature.setStyle(styleFunction);                
            }
            delete object['Style'];
            // we do not remove the styleUrl property from the object, so it
            // gets stored on feature when setProperties is called
            delete object.styleUrl;//URI:Me veo obligado a eliminar el atributo styleUrl porque se muestra en el bocadillo de las features

            feature.setProperties(object, true);

            return feature;
        }


        // TODO: completar con los cambios en ol-es.
        readSharedStyle_(node, objectStack) {
            const id = node.getAttribute('id');
            if (id !== null) {
                const style = readStyle(node, objectStack);
                if (style) {
                    let styleUri;
                    let baseURI = node.baseURI;
                    if (!baseURI || baseURI == 'about:blank') {
                        baseURI = window.location.href;
                    }
                    if (baseURI) {
                        const url = new URL('#' + id, baseURI);
                        styleUri = url.href;
                    } else {
                        styleUri = '#' + id;
                    }
                    this.sharedStyles_[styleUri] = style;
                }
            }
        }

        /**
         * @inheritDoc
         */
        readFeatureFromNode(node, opt_options) {
            if (!ol.array.includes(NAMESPACE_URIS, node.namespaceURI)) {
                return null;
            }
            const feature = this.readPlacemark_(
                node, [this.getReadOptions(node, opt_options)]);
            if (feature) {
                return feature;
            } else {
                return null;
            }
        }

        /**
         * @inheritDoc
         */
        readFeaturesFromNode(node, opt_options) {
            if (!ol.array.includes(NAMESPACE_URIS, node.namespaceURI)) {
                return [];
            }
            let features;
            const localName = node.localName;
            if (localName == 'Document' || localName == 'Folder') {
                features = this.readDocumentOrFolder_(
                    node, [this.getReadOptions(node, opt_options)]);
                if (features) {
                    return features;
                } else {
                    return [];
                }
            } else if (localName == 'Placemark') {
                const feature = this.readPlacemark_(
                    node, [this.getReadOptions(node, opt_options)]);
                if (feature) {
                    return [feature];
                } else {
                    return [];
                }
            } else if (localName == 'kml') {
                features = [];
                for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
                    const fs = this.readFeaturesFromNode(n, opt_options);
                    if (fs) {
                        ol.array.extend(features, fs);
                    }
                }
                return features;
            } else {
                return [];
            }
        }
    };

    /**
     * @param {ol.style.Style|undefined} foundStyle Style.
     * @param {string} name Name.
     * @return {ol.style.Style} style Style.
     */
    function createNameStyleFunction(foundStyle, name) {
        let textStyle = null;
        const textOffset = [0, 0];
        let textAlign = 'start';
        if (foundStyle.getImage()) {
            let imageSize = foundStyle.getImage().getImageSize();
            if (imageSize === null) {
                imageSize = DEFAULT_IMAGE_STYLE_SIZE;
            }
            if (imageSize.length == 2) {
                const imageScale = foundStyle.getImage().getScale();
                // Offset the label to be centered to the right of the icon, if there is
                // one.
                textOffset[0] = imageScale * imageSize[0] / 2;
                textOffset[1] = -imageScale * imageSize[1] / 2;
                textAlign = 'left';
            }
        }
        if (foundStyle.getText() !== null) {
            // clone the text style, customizing it with name, alignments and offset.
            // Note that kml does not support many text options that OpenLayers does (rotation, textBaseline).
            const foundText = foundStyle.getText();
            textStyle = foundText.clone();
            textStyle.setFont(foundText.getFont() || DEFAULT_TEXT_STYLE.getFont());
            textStyle.setScale(foundText.getScale() || DEFAULT_TEXT_STYLE.getScale());
            textStyle.setFill(foundText.getFill() || DEFAULT_TEXT_STYLE.getFill());
            textStyle.setStroke(foundText.getStroke() || DEFAULT_TEXT_STROKE_STYLE);
        } else {
            textStyle = DEFAULT_TEXT_STYLE.clone();
        }
        textStyle.setText(name);
        textStyle.setOffsetX(textOffset[0]);
        textStyle.setOffsetY(textOffset[1]);
        textStyle.setTextAlign(textAlign);

        const nameStyle = new ol.style.Style({
            text: textStyle
        });
        return nameStyle;
    }


    /**
     * @param {Array<ol.style.Style>|undefined} style Style.
     * @param {string} styleUrl Style URL.
     * @param {Array<ol.style.Style>} defaultStyle Default style.
     * @param {!Object<string, (Array<ol.style.Style>|string)>} sharedStyles Shared styles.
     * @param {boolean|undefined} showPointNames true to show names for point placemarks.
     * @return {import("../style/Style.js").StyleFunction} Feature style function.
     */
    function createFeatureStyleFunction(style, styleUrl, defaultStyle, sharedStyles, showPointNames) {

        return (
            /**
             * @param {Feature} feature feature.
             * @param {number} resolution Resolution.
             * @return {Array<ol.style.Style>} Style.
             */
            function (feature, resolution) {
                let drawName = showPointNames;
                /** @type {ol.style.Style|undefined} */
                let nameStyle;
                let name = '';
                if (drawName) {
                    const geometry = feature.getGeometry();
                    if (geometry) {
                        drawName = geometry.getType() === ol.geom.GeometryType.POINT;
                    }
                }

                if (drawName) {
                    name = /** @type {string} */ (feature.get('name'));
                    drawName = drawName && !!name;
                }

                if (style) {
                    if (drawName) {
                        nameStyle = createNameStyleFunction(style[0], name);
                        return style.concat(nameStyle);
                    }
                    return style;
                }
                if (styleUrl) {
                    const foundStyle = findStyle(styleUrl, defaultStyle, sharedStyles);
                    if (drawName) {
                        nameStyle = createNameStyleFunction(foundStyle[0], name);
                        return foundStyle.concat(nameStyle);
                    }
                    return foundStyle;
                }
                if (drawName) {
                    nameStyle = createNameStyleFunction(defaultStyle[0], name);
                    return defaultStyle.concat(nameStyle);
                }
                return defaultStyle;
            }
        );
    }


    /**
     * @param {Array<ol.style.Style>|string|undefined} styleValue Style value.
     * @param {Array<ol.style.Style>} defaultStyle Default style.
     * @param {!Object<string, (Array<ol.style.Style>|string)>} sharedStyles
     * Shared styles.
     * @return {Array<ol.style.Style>} Style.
     */
    function findStyle(styleValue, defaultStyle, sharedStyles) {
        if (Array.isArray(styleValue)) {
            return styleValue;
        } else if (typeof styleValue === 'string') {
            // KML files in the wild occasionally forget the leading `#` on styleUrls
            // defined in the same document.  Add a leading `#` if it enables to find
            // a style.
            if (!(styleValue in sharedStyles) && ('#' + styleValue in sharedStyles)) {
                styleValue = '#' + styleValue;
            }
            return findStyle(sharedStyles[styleValue], defaultStyle, sharedStyles);
        } else {
            return defaultStyle;
        }
    }


    /**
     * @param {Node} node Node.
     * @return {import("../color.js").Color|undefined} Color.
     */
    function readColor(node) {
        const s = ol.xml.getAllTextContent(node, false);
        // The KML specification states that colors should not include a leading `#`
        // but we tolerate them.
        const m = /^\s*#?\s*([0-9A-Fa-f]{8})\s*$/.exec(s);
        if (m) {
            const hexColor = m[1];
            return [
                parseInt(hexColor.substr(6, 2), 16),
                parseInt(hexColor.substr(4, 2), 16),
                parseInt(hexColor.substr(2, 2), 16),
                parseInt(hexColor.substr(0, 2), 16) / 255
            ];

        } else {
            return undefined;
        }
    }


    /**
     * @param {Node} node Node.
     * @return {Array<number>|undefined} Flat coordinates.
     */
    function readFlatCoordinates(node) {
        let s = ol.xml.getAllTextContent(node, false);
        const flatCoordinates = [];
        // The KML specification states that coordinate tuples should not include
        // spaces, but we tolerate them.
        const re =
            /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?))?\s*/i;
        let m;
        while ((m = re.exec(s))) {
            const x = parseFloat(m[1]);
            const y = parseFloat(m[2]);
            const z = m[3] ? parseFloat(m[3]) : 0;
            flatCoordinates.push(x, y, z);
            s = s.substr(m[0].length);
        }
        if (s !== '') {
            return undefined;
        }
        return flatCoordinates;
    }


    /**
     * @param {Node} node Node.
     * @return {string} URI.
     */
    function readURI(node) {
        const s = ol.xml.getAllTextContent(node, false).trim();
        let baseURI = node.baseURI;
        if (!baseURI || baseURI == 'about:blank') {
            baseURI = window.location.href;
        }

        if (baseURI) {
            // flacunza: Parche para evitar peticiones HTTP desde una página HTTPS
            if (location.protocol === 'https:' && baseURI.indexOf('http://') === 0) {
                baseURI = baseURI.substr(5);
            }
            const url = new URL(s, baseURI);
            return url.href;
        } else {
            return s;
        }
    }


    /**
     * @param {Element} node Node.
     * @return {Vec2} Vec2.
     */
    function readVec2(node) {
        const xunits = node.getAttribute('xunits');
        const yunits = node.getAttribute('yunits');
        let origin;
        if (xunits !== 'insetPixels') {
            if (yunits !== 'insetPixels') {
                origin = ol.style.IconOrigin.BOTTOM_LEFT;
            } else {
                origin = ol.style.IconOrigin.TOP_LEFT;
            }
        } else {
            if (yunits !== 'insetPixels') {
                origin = ol.style.IconOrigin.BOTTOM_RIGHT;
            } else {
                origin = ol.style.IconOrigin.TOP_RIGHT;
            }
        }
        return {
            x: parseFloat(node.getAttribute('x')),
            xunits: ICON_ANCHOR_UNITS_MAP[xunits],
            y: parseFloat(node.getAttribute('y')),
            yunits: ICON_ANCHOR_UNITS_MAP[yunits],
            origin: origin
        };
    }


    /**
     * @param {Node} node Node.
     * @return {number|undefined} Scale.
     */
    function readScale(node) {
        return ol.format.xsd.readDecimal(node);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const STYLE_MAP_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'Pair': pairDataParser
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {Array<ol.style.Style>|string|undefined} StyleMap.
     */
    function readStyleMapValue(node, objectStack) {
        return ol.xml.pushParseAndPop(undefined,
            STYLE_MAP_PARSERS, node, objectStack);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const ICON_STYLE_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'Icon': ol.xml.makeObjectPropertySetter(readIcon),
            'heading': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'hotSpot': ol.xml.makeObjectPropertySetter(readVec2),
            'scale': ol.xml.makeObjectPropertySetter(readScale)
        });

    // Creamos un parser para interpretar la plantilla de los bocadillos
    const readText = function (node, objectStack) {
        ol.asserts.assert(node.nodeType == Node.ELEMENT_NODE);
        ol.asserts.assert(node.localName == 'text');
        var s = ol.format.xsd.readString(node);
        return s.trim();
    };

    const balloonStyleParser = function (node, objectStack) {
        ol.asserts.assert(node.nodeType == Node.ELEMENT_NODE);
        ol.asserts.assert(node.localName == 'BalloonStyle');
        // FIXME colorMode
        var object = ol.xml.pushParseAndPop(
            {}, BALLOON_STYLE_PARSERS, node, objectStack);
        if (!object) {
            return;
        }
        const styleObject = objectStack[objectStack.length - 1];
        const type = typeof styleObject;
        ol.asserts.assert(type == 'object' && styleObject != null || type == 'function');
        var textStyle = new ol.style.Text({
            text: (object['text'])
        });
        styleObject['balloonStyle'] = textStyle;
    };

    const BALLOON_STYLE_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'text': ol.xml.makeObjectPropertySetter(readText),
        });

    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function iconStyleParser(node, objectStack) {
        // FIXME refreshMode
        // FIXME refreshInterval
        // FIXME viewRefreshTime
        // FIXME viewBoundScale
        // FIXME viewFormat
        // FIXME httpQuery
        const object = ol.xml.pushParseAndPop(
            {}, ICON_STYLE_PARSERS, node, objectStack);
        if (!object) {
            return;
        }
        const styleObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
        const IconObject = 'Icon' in object ? object['Icon'] : {};
        const drawIcon = (!('Icon' in object) || Object.keys(IconObject).length > 0);
        let src;
        const href = /** @type {string|undefined} */
            (IconObject['href']);
        if (href) {
            src = href;
        } else if (drawIcon) {
            src = DEFAULT_IMAGE_STYLE_SRC;
        }
        let anchor, anchorXUnits, anchorYUnits;
        let anchorOrigin = ol.style.IconOrigin.BOTTOM_LEFT;
        const hotSpot = /** @type {Vec2|undefined} */
            (object['hotSpot']);
        if (hotSpot) {
            anchor = [hotSpot.x, hotSpot.y];
            anchorXUnits = hotSpot.xunits;
            anchorYUnits = hotSpot.yunits;
            anchorOrigin = hotSpot.origin;
        } else if (src === DEFAULT_IMAGE_STYLE_SRC) {
            anchor = DEFAULT_IMAGE_STYLE_ANCHOR;
            anchorXUnits = DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
            anchorYUnits = DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
        } else if (/^http:\/\/maps\.(?:google|gstatic)\.com\//.test(src)) {
            anchor = [0.5, 0];
            anchorXUnits = ol.style.IconAnchorUnits.FRACTION;
            anchorYUnits = ol.style.IconAnchorUnits.FRACTION;
        }

        // Añadimos este control para evitar problemas CORS en Firefox
        if (/Firefox/.test(navigator.userAgent) && location.protocol === 'https:' && src.startsWith("http:")) {
            src = src.replace("http:", "https:");
        }

        let offset;
        const x = /** @type {number|undefined} */
            (IconObject['x']);
        const y = /** @type {number|undefined} */
            (IconObject['y']);
        if (x !== undefined && y !== undefined) {
            offset = [x, y];
        }

        let size;
        const w = /** @type {number|undefined} */
            (IconObject['w']);
        const h = /** @type {number|undefined} */
            (IconObject['h']);
        if (w !== undefined && h !== undefined) {
            size = [w, h];
        }

        let rotation;
        const heading = /** @type {number} */
            (object['heading']);
        if (heading !== undefined) {
            rotation = ol.math.toRadians(heading);
        }

        let scale = /** @type {number|undefined} */
            (object['scale']);

        if (drawIcon) {
            if (src == DEFAULT_IMAGE_STYLE_SRC) {
                size = DEFAULT_IMAGE_STYLE_SIZE;
                if (scale === undefined) {
                    scale = DEFAULT_IMAGE_SCALE_MULTIPLIER;
                }
            }

            const imageStyle = new ol.style.Icon({
                anchor: anchor,
                anchorOrigin: anchorOrigin,
                anchorXUnits: anchorXUnits,
                anchorYUnits: anchorYUnits,
                crossOrigin: 'anonymous', // FIXME should this be configurable?
                offset: offset,
                offsetOrigin: ol.style.IconOrigin.BOTTOM_LEFT,
                rotation: rotation,
                scale: scale,
                size: size,
                src: src
            });
            styleObject['imageStyle'] = imageStyle;
        } else {
            // handle the case when we explicitly want to draw no icon.
            styleObject['imageStyle'] = DEFAULT_NO_IMAGE_STYLE;
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const LABEL_STYLE_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'color': ol.xml.makeObjectPropertySetter(readColor),
            'scale': ol.xml.makeObjectPropertySetter(readScale)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function labelStyleParser(node, objectStack) {
        // FIXME colorMode
        const object = ol.xml.pushParseAndPop(
            {}, LABEL_STYLE_PARSERS, node, objectStack);
        if (!object) {
            return;
        }
        const styleObject = objectStack[objectStack.length - 1];
        const textStyle = new ol.style.Text({
            fill: new ol.style.Fill({
                color: /** @type {import("../color.js").Color} */
                    ('color' in object ? object['color'] : DEFAULT_COLOR)
            }),
            scale: /** @type {number|undefined} */
                (object['scale'])
        });
        styleObject['textStyle'] = textStyle;
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const LINE_STYLE_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'color': ol.xml.makeObjectPropertySetter(readColor),
            'width': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function lineStyleParser(node, objectStack) {
        // FIXME colorMode
        // FIXME gx:outerColor
        // FIXME gx:outerWidth
        // FIXME gx:physicalWidth
        // FIXME gx:labelVisibility
        const object = ol.xml.pushParseAndPop(
            {}, LINE_STYLE_PARSERS, node, objectStack);
        if (!object) {
            return;
        }
        const styleObject = objectStack[objectStack.length - 1];
        const strokeStyle = new ol.style.Stroke({
            color: /** @type {import("../color.js").Color} */
                ('color' in object ? object['color'] : DEFAULT_COLOR),
            width: /** @type {number} */ ('width' in object ? object['width'] : 1)
        });
        styleObject['strokeStyle'] = strokeStyle;
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const POLY_STYLE_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'color': ol.xml.makeObjectPropertySetter(readColor),
            'fill': ol.xml.makeObjectPropertySetter(ol.format.xsd.readBoolean),
            'outline': ol.xml.makeObjectPropertySetter(ol.format.xsd.readBoolean)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function polyStyleParser(node, objectStack) {
        // FIXME colorMode
        const object = ol.xml.pushParseAndPop(
            {}, POLY_STYLE_PARSERS, node, objectStack);
        if (!object) {
            return;
        }
        const styleObject = objectStack[objectStack.length - 1];
        const fillStyle = new ol.style.Fill({
            color: /** @type {import("../color.js").Color} */
                ('color' in object ? object['color'] : DEFAULT_COLOR)
        });
        styleObject['fillStyle'] = fillStyle;
        const fill = /** @type {boolean|undefined} */ (object['fill']);
        if (fill !== undefined) {
            styleObject['fill'] = fill;
        }
        const outline = /** @type {boolean|undefined} */ (object['outline']);
        if (outline !== undefined) {
            styleObject['outline'] = outline;
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const FLAT_LINEAR_RING_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'coordinates': ol.xml.makeReplacer(readFlatCoordinates)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {Array<number>} LinearRing flat coordinates.
     */
    function readFlatLinearRing(node, objectStack) {
        return ol.xml.pushParseAndPop(null,
            FLAT_LINEAR_RING_PARSERS, node, objectStack);
    }


    /**
     * @param {Node} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function gxCoordParser(node, objectStack) {
        const gxTrackObject = /** @type {GxTrackObject} */
            (objectStack[objectStack.length - 1]);
        const flatCoordinates = gxTrackObject.flatCoordinates;
        const s = ol.xml.getAllTextContent(node, false);
        const re =
            /^\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s*$/i;
        const m = re.exec(s);
        if (m) {
            const x = parseFloat(m[1]);
            const y = parseFloat(m[2]);
            const z = parseFloat(m[3]);
            flatCoordinates.push(x, y, z, 0);
        } else {
            flatCoordinates.push(0, 0, 0, 0);
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const GX_MULTITRACK_GEOMETRY_PARSERS = ol.xml.makeStructureNS(
        GX_NAMESPACE_URIS, {
            'Track': ol.xml.makeArrayPusher(readGxTrack)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {ol.geom.MultiLineString|undefined} MultiLineString.
     */
    function readGxMultiTrack(node, objectStack) {
        const lineStrings = ol.xml.pushParseAndPop([],
            GX_MULTITRACK_GEOMETRY_PARSERS, node, objectStack);
        if (!lineStrings) {
            return undefined;
        }
        return new ol.geom.MultiLineString(lineStrings);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const GX_TRACK_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'when': whenParser
        }, ol.xml.makeStructureNS(
            GX_NAMESPACE_URIS, {
                'coord': gxCoordParser
            }));


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {ol.geom.LineString|undefined} LineString.
     */
    function readGxTrack(node, objectStack) {
        const gxTrackObject = ol.xml.pushParseAndPop(
    /** @type {GxTrackObject} */({
                flatCoordinates: [],
                whens: []
            }), GX_TRACK_PARSERS, node, objectStack);
        if (!gxTrackObject) {
            return undefined;
        }
        const flatCoordinates = gxTrackObject.flatCoordinates;
        const whens = gxTrackObject.whens;
        for (let i = 0, ii = Math.min(flatCoordinates.length, whens.length); i < ii; ++i) {
            flatCoordinates[4 * i + 3] = whens[i];
        }
        return new ol.geom.LineString(flatCoordinates, ol.geom.GeometryLayout.XYZM);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const ICON_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'href': ol.xml.makeObjectPropertySetter(readURI)
        }, ol.xml.makeStructureNS(
            GX_NAMESPACE_URIS, {
                'x': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
                'y': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
                'w': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
                'h': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal)
            }));


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {Object} Icon object.
     */
    function readIcon(node, objectStack) {
        const iconObject = ol.xml.pushParseAndPop(
            {}, ICON_PARSERS, node, objectStack);
        if (iconObject) {
            return iconObject;
        } else {
            return null;
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const GEOMETRY_FLAT_COORDINATES_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'coordinates': ol.xml.makeReplacer(readFlatCoordinates)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {Array<number>} Flat coordinates.
     */
    function readFlatCoordinatesFromNode(node, objectStack) {
        return ol.xml.pushParseAndPop(null,
            GEOMETRY_FLAT_COORDINATES_PARSERS, node, objectStack);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const EXTRUDE_AND_ALTITUDE_MODE_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'extrude': ol.xml.makeObjectPropertySetter(ol.format.xsd.readBoolean),
            'tessellate': ol.xml.makeObjectPropertySetter(ol.format.xsd.readBoolean),
            'altitudeMode': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {ol.geom.LineString|undefined} LineString.
     */
    function readLineString(node, objectStack) {
        const properties = ol.xml.pushParseAndPop({},
            EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node,
            objectStack);
        const flatCoordinates =
            readFlatCoordinatesFromNode(node, objectStack);
        if (flatCoordinates) {
            const lineString = new ol.geom.LineString(flatCoordinates, ol.geom.GeometryLayout.XYZ);
            lineString.setProperties(properties, true);
            return lineString;
        } else {
            return undefined;
        }
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {ol.geom.Polygon|undefined} Polygon.
     */
    function readLinearRing(node, objectStack) {
        const properties = ol.xml.pushParseAndPop({},
            EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node,
            objectStack);
        const flatCoordinates =
            readFlatCoordinatesFromNode(node, objectStack);
        if (flatCoordinates) {
            const polygon = new ol.geom.Polygon(flatCoordinates, ol.geom.GeometryLayout.XYZ, [flatCoordinates.length]);
            polygon.setProperties(properties, true);
            return polygon;
        } else {
            return undefined;
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const MULTI_GEOMETRY_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'LineString': ol.xml.makeArrayPusher(readLineString),
            'LinearRing': ol.xml.makeArrayPusher(readLinearRing),
            'MultiGeometry': ol.xml.makeArrayPusher(readMultiGeometry),
            'Point': ol.xml.makeArrayPusher(readPoint),
            'Polygon': ol.xml.makeArrayPusher(readPolygon)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {import("../geom/Geometry.js").default} Geometry.
     */
    function readMultiGeometry(node, objectStack) {
        const geometries = ol.xml.pushParseAndPop([],
            MULTI_GEOMETRY_PARSERS, node, objectStack);
        if (!geometries) {
            return null;
        }
        if (geometries.length === 0) {
            return new ol.geom.GeometryCollection(geometries);
        }
        let multiGeometry;
        let homogeneous = true;
        const type = geometries[0].getType();
        let geometry;
        for (let i = 1, ii = geometries.length; i < ii; ++i) {
            geometry = geometries[i];
            if (geometry.getType() != type) {
                homogeneous = false;
                break;
            }
        }
        if (homogeneous) {
            let layout;
            let flatCoordinates;
            if (type == ol.geom.GeometryType.POINT) {
                const point = geometries[0];
                layout = point.getLayout();
                flatCoordinates = point.getFlatCoordinates();
                for (let i = 1, ii = geometries.length; i < ii; ++i) {
                    geometry = geometries[i];
                    ol.array.extend(flatCoordinates, geometry.getFlatCoordinates());
                }
                multiGeometry = new ol.geom.MultiPoint(flatCoordinates, layout);
                setCommonGeometryProperties(multiGeometry, geometries);
            } else if (type == ol.geom.GeometryType.LINE_STRING) {
                multiGeometry = new ol.geom.MultiLineString(geometries);
                setCommonGeometryProperties(multiGeometry, geometries);
            } else if (type == ol.geom.GeometryType.POLYGON) {
                multiGeometry = new ol.geom.MultiPolygon(geometries);
                setCommonGeometryProperties(multiGeometry, geometries);
            } else if (type == ol.geom.GeometryType.GEOMETRY_COLLECTION) {
                multiGeometry = new ol.geom.GeometryCollection(geometries);
            } else {
                assert(false, 37); // Unknown geometry type found
            }
        } else {
            multiGeometry = new ol.geom.GeometryCollection(geometries);
        }
        return (
    /** @type {import("../geom/Geometry.js").default} */ (multiGeometry)
        );
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {ol.geom.Point|undefined} Point.
     */
    function readPoint(node, objectStack) {
        const properties = ol.xml.pushParseAndPop({},
            EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node,
            objectStack);
        const flatCoordinates =
            readFlatCoordinatesFromNode(node, objectStack);
        if (flatCoordinates) {
            const point = new ol.geom.Point(flatCoordinates, ol.geom.GeometryLayout.XYZ);
            point.setProperties(properties, true);
            return point;
        } else {
            return undefined;
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const FLAT_LINEAR_RINGS_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'innerBoundaryIs': innerBoundaryIsParser,
            'outerBoundaryIs': outerBoundaryIsParser
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {ol.geom.Polygon|undefined} Polygon.
     */
    function readPolygon(node, objectStack) {
        const properties = ol.xml.pushParseAndPop(/** @type {Object<string,*>} */({}),
            EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node,
            objectStack);
        const flatLinearRings = ol.xml.pushParseAndPop([null],
            FLAT_LINEAR_RINGS_PARSERS, node, objectStack);
        if (flatLinearRings && flatLinearRings[0]) {
            const flatCoordinates = flatLinearRings[0];
            const ends = [flatCoordinates.length];
            for (let i = 1, ii = flatLinearRings.length; i < ii; ++i) {
                ol.array.extend(flatCoordinates, flatLinearRings[i]);
                ends.push(flatCoordinates.length);
            }
            const polygon = new ol.geom.Polygon(flatCoordinates, ol.geom.GeometryLayout.XYZ, ends);
            polygon.setProperties(properties, true);
            return polygon;
        } else {
            return undefined;
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const STYLE_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'IconStyle': iconStyleParser,
            'LabelStyle': labelStyleParser,
            'LineStyle': lineStyleParser,
            'PolyStyle': polyStyleParser,
            'BalloonStyle': balloonStyleParser
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {Array<ol.style.Style>} Style.
     */
    function readStyle(node, objectStack) {
        const styleObject = ol.xml.pushParseAndPop(
            {}, STYLE_PARSERS, node, objectStack);
        if (!styleObject) {
            return null;
        }
        let fillStyle = /** @type {ol.style.Fill} */
            ('fillStyle' in styleObject ?
                styleObject['fillStyle'] : DEFAULT_FILL_STYLE);
        const fill = /** @type {boolean|undefined} */ (styleObject['fill']);
        if (fill !== undefined && !fill) {
            fillStyle = null;
        }
        let imageStyle;
        if ('imageStyle' in styleObject) {
            if (styleObject['imageStyle'] != DEFAULT_NO_IMAGE_STYLE) {
                imageStyle = styleObject['imageStyle'];
            }
        } else {
            imageStyle = DEFAULT_IMAGE_STYLE;
        }
        const textStyle = /** @type {ol.style.Text} */
            ('textStyle' in styleObject ?
                styleObject['textStyle'] : DEFAULT_TEXT_STYLE);
        let strokeStyle = /** @type {ol.style.Stroke} */
            ('strokeStyle' in styleObject ?
                styleObject['strokeStyle'] : DEFAULT_STROKE_STYLE);
        // GLS: Comento el machaque del estilo de línea por que no haya outline, según la documentación (https://developers.google.com/kml/documentation/kmlreference#style) 
        // es opcional indicar outline
        // Corregimos el bug 25306 No se carga el estilo de VV-del-Irati.kml
        //const outline = /** @type {boolean|undefined} */
        //    (styleObject['outline']);
        //if (outline !== undefined && !outline) {
        //    strokeStyle = null;
        //}
        const balloonStyle = styleObject['balloonStyle'];
        const returnStyle = new ol.style.Style({
            fill: fillStyle,
            image: imageStyle,
            stroke: strokeStyle,
            text: textStyle,
            zIndex: undefined // FIXME
        });
        if (balloonStyle) {
            returnStyle._balloon = balloonStyle;
        }
        return [returnStyle];
    }


    /**
     * Reads an array of geometries and creates arrays for common geometry
     * properties. Then sets them to the multi geometry.
     * @param {ol.geom.MultiPoint|ol.geom.MultiLineString|ol.geom.MultiPolygon} multiGeometry A multi-geometry.
     * @param {Array<import("../geom/Geometry.js").default>} geometries List of geometries.
     */
    function setCommonGeometryProperties(multiGeometry, geometries) {
        const ii = geometries.length;
        const extrudes = new Array(geometries.length);
        const tessellates = new Array(geometries.length);
        const altitudeModes = new Array(geometries.length);
        let hasExtrude, hasTessellate, hasAltitudeMode;
        hasExtrude = hasTessellate = hasAltitudeMode = false;
        for (let i = 0; i < ii; ++i) {
            const geometry = geometries[i];
            extrudes[i] = geometry.get('extrude');
            tessellates[i] = geometry.get('tessellate');
            altitudeModes[i] = geometry.get('altitudeMode');
            hasExtrude = hasExtrude || extrudes[i] !== undefined;
            hasTessellate = hasTessellate || tessellates[i] !== undefined;
            hasAltitudeMode = hasAltitudeMode || altitudeModes[i];
        }
        if (hasExtrude) {
            multiGeometry.set('extrude', extrudes);
        }
        if (hasTessellate) {
            multiGeometry.set('tessellate', tessellates);
        }
        if (hasAltitudeMode) {
            multiGeometry.set('altitudeMode', altitudeModes);
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const DATA_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'displayName': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'value': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function dataParser(node, objectStack) {
        const name = node.getAttribute('name');
        ol.xml.parseNode(DATA_PARSERS, node, objectStack);
        const featureObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
        if (name !== null) {
            featureObject[name] = featureObject.value;
        } else if (featureObject.displayName !== null) {
            featureObject[featureObject.displayName] = featureObject.value;
        }
        delete featureObject['value'];
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const EXTENDED_DATA_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'Data': dataParser,
            'SchemaData': schemaDataParser
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function extendedDataParser(node, objectStack) {
        ol.xml.parseNode(EXTENDED_DATA_PARSERS, node, objectStack);
    }

    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function regionParser(node, objectStack) {
        ol.xml.parseNode(REGION_PARSERS, node, objectStack);
    }

    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const PAIR_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'Style': ol.xml.makeObjectPropertySetter(readStyle),
            'key': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'styleUrl': ol.xml.makeObjectPropertySetter(readURI)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function pairDataParser(node, objectStack) {
        const pairObject = ol.xml.pushParseAndPop(
            {}, PAIR_PARSERS, node, objectStack);
        if (!pairObject) {
            return;
        }
        const key = /** @type {string|undefined} */
            (pairObject['key']);
        if (key && key == 'normal') {
            const styleUrl = /** @type {string|undefined} */
                (pairObject['styleUrl']);
            if (styleUrl) {
                objectStack[objectStack.length - 1] = styleUrl;
            }
            const style = /** @type {ol.style.Style} */
                (pairObject['Style']);
            if (style) {
                objectStack[objectStack.length - 1] = style;
            }
        }
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function placemarkStyleMapParser(node, objectStack) {
        const styleMapValue = readStyleMapValue(node, objectStack);
        if (!styleMapValue) {
            return;
        }
        const placemarkObject = objectStack[objectStack.length - 1];
        if (Array.isArray(styleMapValue)) {
            placemarkObject['Style'] = styleMapValue;
        } else if (typeof styleMapValue === 'string') {
            placemarkObject['styleUrl'] = styleMapValue;
        } else {
            assert(false, 38); // `styleMapValue` has an unknown type
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const SCHEMA_DATA_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'SimpleData': simpleDataParser
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function schemaDataParser(node, objectStack) {
        ol.xml.parseNode(SCHEMA_DATA_PARSERS, node, objectStack);
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function simpleDataParser(node, objectStack) {
        const name = node.getAttribute('name');
        if (name !== null) {
            const data = ol.format.xsd.readString(node);
            const featureObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
            featureObject[name] = data;
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const LAT_LON_ALT_BOX_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'altitudeMode': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'minAltitude': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'maxAltitude': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'north': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'south': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'east': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'west': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function latLonAltBoxParser(node, objectStack) {
        const object = ol.xml.pushParseAndPop({}, LAT_LON_ALT_BOX_PARSERS, node, objectStack);
        if (!object) {
            return;
        }
        const regionObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
        const extent = [
            parseFloat(object['west']),
            parseFloat(object['south']),
            parseFloat(object['east']),
            parseFloat(object['north'])
        ];
        regionObject['extent'] = extent;
        regionObject['altitudeMode'] = object['altitudeMode'];
        regionObject['minAltitude'] = parseFloat(object['minAltitude']);
        regionObject['maxAltitude'] = parseFloat(object['maxAltitude']);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const LOD_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'minLodPixels': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'maxLodPixels': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'minFadeExtent': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'maxFadeExtent': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function lodParser(node, objectStack) {
        const object = ol.xml.pushParseAndPop({}, LOD_PARSERS, node, objectStack);
        if (!object) {
            return;
        }
        const lodObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
        lodObject['minLodPixels'] = parseFloat(object['minLodPixels']);
        lodObject['maxLodPixels'] = parseFloat(object['maxLodPixels']);
        lodObject['minFadeExtent'] = parseFloat(object['minFadeExtent']);
        lodObject['maxFadeExtent'] = parseFloat(object['maxFadeExtent']);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const INNER_BOUNDARY_IS_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'LinearRing': ol.xml.makeReplacer(readFlatLinearRing)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function innerBoundaryIsParser(node, objectStack) {
        /** @type {Array<number>|undefined} */
        const flatLinearRing = ol.xml.pushParseAndPop(undefined,
            INNER_BOUNDARY_IS_PARSERS, node, objectStack);
        if (flatLinearRing) {
            const flatLinearRings = /** @type {Array<Array<number>>} */
                (objectStack[objectStack.length - 1]);
            flatLinearRings.push(flatLinearRing);
        }
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const OUTER_BOUNDARY_IS_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'LinearRing': ol.xml.makeReplacer(readFlatLinearRing)
        });


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function outerBoundaryIsParser(node, objectStack) {
        /** @type {Array<number>|undefined} */
        const flatLinearRing = ol.xml.pushParseAndPop(undefined,
            OUTER_BOUNDARY_IS_PARSERS, node, objectStack);
        if (flatLinearRing) {
            const flatLinearRings = /** @type {Array<Array<number>>} */
                (objectStack[objectStack.length - 1]);
            flatLinearRings[0] = flatLinearRing;
        }
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function linkParser(node, objectStack) {
        ol.xml.parseNode(LINK_PARSERS, node, objectStack);
    }


    /**
     * @param {Node} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function whenParser(node, objectStack) {
        const gxTrackObject = /** @type {GxTrackObject} */
            (objectStack[objectStack.length - 1]);
        const whens = gxTrackObject.whens;
        const s = ol.xml.getAllTextContent(node, false);
        const when = Date.parse(s);
        whens.push(isNaN(when) ? 0 : when);
    }


    /**
     * @param {Node} node Node to append a TextNode with the color to.
     * @param {import("../color.js").Color|string} color Color.
     */
    function writeColorTextNode(node, color) {
        const rgba = asArray(color);
        const opacity = (rgba.length == 4) ? rgba[3] : 1;
        /** @type {Array<string|number>} */
        const abgr = [opacity * 255, rgba[2], rgba[1], rgba[0]];
        for (let i = 0; i < 4; ++i) {
            const hex = Math.floor(/** @type {number} */(abgr[i])).toString(16);
            abgr[i] = (hex.length == 1) ? '0' + hex : hex;
        }
        ol.format.xsd.writeStringTextNode(node, abgr.join(''));
    }


    /**
     * @param {Node} node Node to append a TextNode with the coordinates to.
     * @param {Array<number>} coordinates Coordinates.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeCoordinatesTextNode(node, coordinates, objectStack) {
        const context = objectStack[objectStack.length - 1];

        const layout = context['layout'];
        const stride = context['stride'];

        let dimension;
        if (layout == ol.geom.GeometryLayout.XY ||
            layout == ol.geom.GeometryLayout.XYM) {
            dimension = 2;
        } else if (layout == ol.geom.GeometryLayout.XYZ ||
            layout == ol.geom.GeometryLayout.XYZM) {
            dimension = 3;
        } else {
            assert(false, 34); // Invalid geometry layout
        }

        const ii = coordinates.length;
        let text = '';
        if (ii > 0) {
            text += coordinates[0];
            for (let d = 1; d < dimension; ++d) {
                text += ',' + coordinates[d];
            }
            for (let i = stride; i < ii; i += stride) {
                text += ' ' + coordinates[i];
                for (let d = 1; d < dimension; ++d) {
                    text += ',' + coordinates[i + d];
                }
            }
        }
        ol.format.xsd.writeStringTextNode(node, text);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const EXTENDEDDATA_NODE_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'Data': ol.xml.makeChildAppender(writeDataNode),
            'value': ol.xml.makeChildAppender(writeDataNodeValue),
            'displayName': ol.xml.makeChildAppender(writeDataNodeName)
        });


    /**
     * @param {Element} node Node.
     * @param {{name: *, value: *}} pair Name value pair.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeDataNode(node, pair, objectStack) {
        node.setAttribute('name', pair.name);
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        const value = pair.value;

        if (typeof value == 'object') {
            if (value !== null && value.displayName) {
                ol.xml.pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS,
                    ol.xml.OBJECT_PROPERTY_NODE_FACTORY, [value.displayName], objectStack, ['displayName']);
            }

            if (value !== null && value.value) {
                ol.xml.pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS,
                    ol.xml.OBJECT_PROPERTY_NODE_FACTORY, [value.value], objectStack, ['value']);
            }
        } else {
            ol.xml.pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS,
                ol.xml.OBJECT_PROPERTY_NODE_FACTORY, [value], objectStack, ['value']);
        }
    }


    /**
     * @param {Node} node Node to append a TextNode with the name to.
     * @param {string} name DisplayName.
     */
    function writeDataNodeName(node, name) {
        ol.format.xsd.writeCDATASection(node, name);
    }


    /**
     * @param {Node} node Node to append a CDATA Section with the value to.
     * @param {string} value Value.
     */
    function writeDataNodeValue(node, value) {
        ol.format.xsd.writeStringTextNode(node, value);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const DOCUMENT_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'Placemark': ol.xml.makeChildAppender(writePlacemark)
        });


    /**
     * @const
     * @param {*} value Value.
     * @param {Array<*>} objectStack Object stack.
     * @param {string=} opt_nodeName Node name.
     * @return {Node|undefined} Node.
     */
    const DOCUMENT_NODE_FACTORY = function (value, objectStack, opt_nodeName) {
        const parentNode = objectStack[objectStack.length - 1].node;
        return ol.xml.createElementNS(parentNode.namespaceURI, 'Placemark');
    };


    /**
     * @param {Node} node Node.
     * @param {Array<Feature>} features Features.
     * @param {Array<*>} objectStack Object stack.
     * @this {KML}
     */
    function writeDocument(node, features, objectStack) {
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        ol.xml.pushSerializeAndPop(context, DOCUMENT_SERIALIZERS,
            DOCUMENT_NODE_FACTORY, features, objectStack, undefined,
            this);
    }


    /**
     * A factory for creating Data nodes.
     * @const
     * @type {function(*, Array<*>): (Node|undefined)}
     */
    const DATA_NODE_FACTORY = ol.xml.makeSimpleNodeFactory('Data');


    /**
     * @param {Node} node Node.
     * @param {{names: Array<string>, values: (Array<*>)}} namesAndValues Names and values.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeExtendedData(node, namesAndValues, objectStack) {
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        const names = namesAndValues.names;
        const values = namesAndValues.values;
        const length = names.length;

        for (let i = 0; i < length; i++) {
            ol.xml.pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS,
                DATA_NODE_FACTORY, [{ name: names[i], value: values[i] }], objectStack);
        }
    }


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const ICON_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'href'
        ],
        ol.xml.makeStructureNS(GX_NAMESPACE_URIS, [
            'x', 'y', 'w', 'h'
        ]));


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const ICON_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'href': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode)
        }, ol.xml.makeStructureNS(
            GX_NAMESPACE_URIS, {
                'x': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
                'y': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
                'w': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
                'h': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode)
            }));


    /**
     * @const
     * @param {*} value Value.
     * @param {Array<*>} objectStack Object stack.
     * @param {string=} opt_nodeName Node name.
     * @return {Node|undefined} Node.
     */
    const GX_NODE_FACTORY = function (value, objectStack, opt_nodeName) {
        return ol.xml.createElementNS(GX_NAMESPACE_URIS[0],
            'gx:' + opt_nodeName);
    };


    /**
     * @param {Node} node Node.
     * @param {Object} icon Icon object.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeIcon(node, icon, objectStack) {
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        const parentNode = objectStack[objectStack.length - 1].node;
        let orderedKeys = ICON_SEQUENCE[parentNode.namespaceURI];
        let values = ol.xml.makeSequence(icon, orderedKeys);
        ol.xml.pushSerializeAndPop(context,
            ICON_SERIALIZERS, ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
            values, objectStack, orderedKeys);
        orderedKeys =
            ICON_SEQUENCE[GX_NAMESPACE_URIS[0]];
        values = ol.xml.makeSequence(icon, orderedKeys);
        ol.xml.pushSerializeAndPop(context, ICON_SERIALIZERS,
            GX_NODE_FACTORY, values, objectStack, orderedKeys);
    }


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const ICON_STYLE_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'scale', 'heading', 'Icon', 'hotSpot'
        ]);


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const ICON_STYLE_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'Icon': ol.xml.makeChildAppender(writeIcon),
            'heading': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
            'hotSpot': ol.xml.makeChildAppender(writeVec2),
            'scale': ol.xml.makeChildAppender(writeScaleTextNode)
        });


    /**
     * @param {Node} node Node.
     * @param {import("../style/Icon.js").default} style Icon style.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeIconStyle(node, style, objectStack) {
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        const properties = {};
        const src = style.getSrc();
        const size = style.getSize();
        const iconImageSize = style.getImageSize();
        const iconProperties = {
            'href': src
        };

        if (size) {
            iconProperties['w'] = size[0];
            iconProperties['h'] = size[1];
            const anchor = style.getAnchor(); // top-left
            const origin = style.getOrigin(); // top-left

            if (origin && iconImageSize && origin[0] !== 0 && origin[1] !== size[1]) {
                iconProperties['x'] = origin[0];
                iconProperties['y'] = iconImageSize[1] - (origin[1] + size[1]);
            }

            if (anchor && (anchor[0] !== size[0] / 2 || anchor[1] !== size[1] / 2)) {
                const /** @type {Vec2} */ hotSpot = {
                    x: anchor[0],
                    xunits: ol.style.IconAnchorUnits.PIXELS,
                    y: size[1] - anchor[1],
                    yunits: ol.style.IconAnchorUnits.PIXELS
                };
                properties['hotSpot'] = hotSpot;
            }
        }

        properties['Icon'] = iconProperties;

        const scale = style.getScale();
        if (scale !== 1) {
            properties['scale'] = scale;
        }

        const rotation = style.getRotation();
        if (rotation !== 0) {
            properties['heading'] = rotation; // 0-360
        }

        const parentNode = objectStack[objectStack.length - 1].node;
        const orderedKeys = ICON_STYLE_SEQUENCE[parentNode.namespaceURI];
        const values = ol.xml.makeSequence(properties, orderedKeys);
        ol.xml.pushSerializeAndPop(context, ICON_STYLE_SERIALIZERS,
            ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
    }


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const LABEL_STYLE_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'color', 'scale'
        ]);


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const LABEL_STYLE_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'color': ol.xml.makeChildAppender(writeColorTextNode),
            'scale': ol.xml.makeChildAppender(writeScaleTextNode)
        });


    /**
     * @param {Node} node Node.
     * @param {ol.style.Text} style style.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeLabelStyle(node, style, objectStack) {
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        const properties = {};
        const fill = style.getFill();
        if (fill) {
            properties['color'] = fill.getColor();
        }
        const scale = style.getScale();
        if (scale && scale !== 1) {
            properties['scale'] = scale;
        }
        const parentNode = objectStack[objectStack.length - 1].node;
        const orderedKeys =
            LABEL_STYLE_SEQUENCE[parentNode.namespaceURI];
        const values = ol.xml.makeSequence(properties, orderedKeys);
        ol.xml.pushSerializeAndPop(context, LABEL_STYLE_SERIALIZERS,
            ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
    }


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const LINE_STYLE_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'color', 'width'
        ]);


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const LINE_STYLE_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'color': ol.xml.makeChildAppender(writeColorTextNode),
            'width': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode)
        });


    /**
     * @param {Node} node Node.
     * @param {ol.style.Stroke} style style.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeLineStyle(node, style, objectStack) {
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        const properties = {
            'color': style.getColor(),
            'width': style.getWidth()
        };
        const parentNode = objectStack[objectStack.length - 1].node;
        const orderedKeys = LINE_STYLE_SEQUENCE[parentNode.namespaceURI];
        const values = ol.xml.makeSequence(properties, orderedKeys);
        ol.xml.pushSerializeAndPop(context, LINE_STYLE_SERIALIZERS,
            ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
    }


    /**
     * @const
     * @type {Object<string, string>}
     */
    const GEOMETRY_TYPE_TO_NODENAME = {
        'Point': 'Point',
        'LineString': 'LineString',
        'LinearRing': 'LinearRing',
        'Polygon': 'Polygon',
        'MultiPoint': 'MultiGeometry',
        'MultiLineString': 'MultiGeometry',
        'MultiPolygon': 'MultiGeometry',
        'GeometryCollection': 'MultiGeometry'
    };


    /**
     * @const
     * @param {*} value Value.
     * @param {Array<*>} objectStack Object stack.
     * @param {string=} opt_nodeName Node name.
     * @return {Node|undefined} Node.
     */
    const GEOMETRY_NODE_FACTORY = function (value, objectStack, opt_nodeName) {
        if (value) {
            const parentNode = objectStack[objectStack.length - 1].node;
            return ol.xml.createElementNS(parentNode.namespaceURI,
                GEOMETRY_TYPE_TO_NODENAME[/** @type {import("../geom/Geometry.js").default} */ (value).getType()]);
        }
    };


    /**
     * A factory for creating Point nodes.
     * @const
     * @type {function(*, Array<*>, string=): (Node|undefined)}
     */
    const POINT_NODE_FACTORY = ol.xml.makeSimpleNodeFactory('Point');


    /**
     * A factory for creating LineString nodes.
     * @const
     * @type {function(*, Array<*>, string=): (Node|undefined)}
     */
    const LINE_STRING_NODE_FACTORY = ol.xml.makeSimpleNodeFactory('LineString');


    /**
     * A factory for creating LinearRing nodes.
     * @const
     * @type {function(*, Array<*>, string=): (Node|undefined)}
     */
    const LINEAR_RING_NODE_FACTORY = ol.xml.makeSimpleNodeFactory('LinearRing');


    /**
     * A factory for creating Polygon nodes.
     * @const
     * @type {function(*, Array<*>, string=): (Node|undefined)}
     */
    const POLYGON_NODE_FACTORY = ol.xml.makeSimpleNodeFactory('Polygon');


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const MULTI_GEOMETRY_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'LineString': ol.xml.makeChildAppender(
                writePrimitiveGeometry),
            'Point': ol.xml.makeChildAppender(
                writePrimitiveGeometry),
            'Polygon': ol.xml.makeChildAppender(writePolygon),
            'GeometryCollection': ol.xml.makeChildAppender(
                writeMultiGeometry)
        });


    /**
     * @param {Node} node Node.
     * @param {import("../geom/Geometry.js").default} geometry Geometry.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeMultiGeometry(node, geometry, objectStack) {
        /** @type {import("../xml.js").NodeStackItem} */
        const context = { node: node };
        const type = geometry.getType();
        /** @type {Array<import("../geom/Geometry.js").default>} */
        let geometries;
        /** @type {function(*, Array<*>, string=): (Node|undefined)} */
        let factory;
        if (type == ol.geom.GeometryType.GEOMETRY_COLLECTION) {
            geometries = /** @type {ol.geom.GeometryCollection} */ (geometry).getGeometries();
            factory = GEOMETRY_NODE_FACTORY;
        } else if (type == ol.geom.GeometryType.MULTI_POINT) {
            geometries = /** @type {ol.geom.MultiPoint} */ (geometry).getPoints();
            factory = POINT_NODE_FACTORY;
        } else if (type == ol.geom.GeometryType.MULTI_LINE_STRING) {
            geometries =
                (/** @type {ol.geom.MultiLineString} */ (geometry)).getLineStrings();
            factory = LINE_STRING_NODE_FACTORY;
        } else if (type == ol.geom.GeometryType.MULTI_POLYGON) {
            geometries =
                (/** @type {ol.geom.MultiPolygon} */ (geometry)).getPolygons();
            factory = POLYGON_NODE_FACTORY;
        } else {
            assert(false, 39); // Unknown geometry type
        }
        ol.xml.pushSerializeAndPop(context,
            MULTI_GEOMETRY_SERIALIZERS, factory,
            geometries, objectStack);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const BOUNDARY_IS_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'LinearRing': ol.xml.makeChildAppender(
                writePrimitiveGeometry)
        });


    /**
     * @param {Node} node Node.
     * @param {import("../geom/LinearRing.js").default} linearRing Linear ring.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeBoundaryIs(node, linearRing, objectStack) {
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        ol.xml.pushSerializeAndPop(context,
            BOUNDARY_IS_SERIALIZERS,
            LINEAR_RING_NODE_FACTORY, [linearRing], objectStack);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const PLACEMARK_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'ExtendedData': ol.xml.makeChildAppender(writeExtendedData),
            'MultiGeometry': ol.xml.makeChildAppender(writeMultiGeometry),
            'LineString': ol.xml.makeChildAppender(writePrimitiveGeometry),
            'LinearRing': ol.xml.makeChildAppender(writePrimitiveGeometry),
            'Point': ol.xml.makeChildAppender(writePrimitiveGeometry),
            'Polygon': ol.xml.makeChildAppender(writePolygon),
            'Style': ol.xml.makeChildAppender(writeStyle),
            'address': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'description': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'name': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'open': ol.xml.makeChildAppender(ol.format.xsd.writeBooleanTextNode),
            'phoneNumber': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'styleUrl': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'visibility': ol.xml.makeChildAppender(ol.format.xsd.writeBooleanTextNode)
        });


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const PLACEMARK_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'name', 'open', 'visibility', 'address', 'phoneNumber', 'description',
            'styleUrl', 'Style'
        ]);


    /**
     * A factory for creating ExtendedData nodes.
     * @const
     * @type {function(*, Array<*>): (Node|undefined)}
     */
    const EXTENDEDDATA_NODE_FACTORY = ol.xml.makeSimpleNodeFactory('ExtendedData');


    /**
     * FIXME currently we do serialize arbitrary/custom feature properties
     * (ExtendedData).
     * @param {Element} node Node.
     * @param {Feature} feature Feature.
     * @param {Array<*>} objectStack Object stack.
     * @this {KML}
     */
    function writePlacemark(node, feature, objectStack) {
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };

        // set id
        if (feature.getId()) {
            node.setAttribute('id', /** @type {string} */(feature.getId()));
        }

        // serialize properties (properties unknown to KML are not serialized)
        const properties = feature.getProperties();

        // don't export these to ExtendedData
        const filter = {
            'address': 1, 'description': 1, 'name': 1, 'open': 1,
            'phoneNumber': 1, 'styleUrl': 1, 'visibility': 1
        };
        filter[feature.getGeometryName()] = 1;
        const keys = Object.keys(properties || {}).sort().filter(function (v) {
            return !filter[v];
        });

        if (keys.length > 0) {
            const sequence = ol.xml.makeSequence(properties, keys);
            const namesAndValues = { names: keys, values: sequence };
            ol.xml.pushSerializeAndPop(context, PLACEMARK_SERIALIZERS,
                EXTENDEDDATA_NODE_FACTORY, [namesAndValues], objectStack);
        }

        const styleFunction = feature.getStyleFunction();
        if (styleFunction) {
            // FIXME the styles returned by the style function are supposed to be
            // resolution-independent here
            const styles = styleFunction(feature, 0);
            if (styles) {
                const style = Array.isArray(styles) ? styles[0] : styles;
                if (this.writeStyles_) {
                    properties['Style'] = style;
                }
                const textStyle = style.getText();
                if (textStyle) {
                    properties['name'] = textStyle.getText();
                }
            }
        }
        const parentNode = objectStack[objectStack.length - 1].node;
        const orderedKeys = PLACEMARK_SEQUENCE[parentNode.namespaceURI];
        const values = ol.xml.makeSequence(properties, orderedKeys);
        ol.xml.pushSerializeAndPop(context, PLACEMARK_SERIALIZERS,
            ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);

        // serialize geometry
        const options = /** @type {import("./Feature.js").WriteOptions} */ (objectStack[0]);
        let geometry = feature.getGeometry();
        if (geometry) {
            geometry = ol.format.Feature.transformGeometryWithOptions(geometry, true, options);
        }
        ol.xml.pushSerializeAndPop(context, PLACEMARK_SERIALIZERS,
            GEOMETRY_NODE_FACTORY, [geometry], objectStack);
    }


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const PRIMITIVE_GEOMETRY_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'extrude', 'tessellate', 'altitudeMode', 'coordinates'
        ]);


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const PRIMITIVE_GEOMETRY_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'extrude': ol.xml.makeChildAppender(ol.format.xsd.writeBooleanTextNode),
            'tessellate': ol.xml.makeChildAppender(ol.format.xsd.writeBooleanTextNode),
            'altitudeMode': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'coordinates': ol.xml.makeChildAppender(writeCoordinatesTextNode)
        });


    /**
     * @param {Node} node Node.
     * @param {import("../geom/SimpleGeometry.js").default} geometry Geometry.
     * @param {Array<*>} objectStack Object stack.
     */
    function writePrimitiveGeometry(node, geometry, objectStack) {
        const flatCoordinates = geometry.getFlatCoordinates();
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        context['layout'] = geometry.getLayout();
        context['stride'] = geometry.getStride();

        // serialize properties (properties unknown to KML are not serialized)
        const properties = geometry.getProperties();
        properties.coordinates = flatCoordinates;

        const parentNode = objectStack[objectStack.length - 1].node;
        const orderedKeys = PRIMITIVE_GEOMETRY_SEQUENCE[parentNode.namespaceURI];
        const values = ol.xml.makeSequence(properties, orderedKeys);
        ol.xml.pushSerializeAndPop(context, PRIMITIVE_GEOMETRY_SERIALIZERS,
            ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const POLYGON_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'outerBoundaryIs': ol.xml.makeChildAppender(
                writeBoundaryIs),
            'innerBoundaryIs': ol.xml.makeChildAppender(
                writeBoundaryIs)
        });


    /**
     * A factory for creating innerBoundaryIs nodes.
     * @const
     * @type {function(*, Array<*>, string=): (Node|undefined)}
     */
    const INNER_BOUNDARY_NODE_FACTORY = ol.xml.makeSimpleNodeFactory('innerBoundaryIs');


    /**
     * A factory for creating outerBoundaryIs nodes.
     * @const
     * @type {function(*, Array<*>, string=): (Node|undefined)}
     */
    const OUTER_BOUNDARY_NODE_FACTORY = ol.xml.makeSimpleNodeFactory('outerBoundaryIs');


    /**
     * @param {Node} node Node.
     * @param {ol.geom.Polygon} polygon Polygon.
     * @param {Array<*>} objectStack Object stack.
     */
    function writePolygon(node, polygon, objectStack) {
        const linearRings = polygon.getLinearRings();
        const outerRing = linearRings.shift();
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        // inner rings
        ol.xml.pushSerializeAndPop(context,
            POLYGON_SERIALIZERS,
            INNER_BOUNDARY_NODE_FACTORY,
            linearRings, objectStack);
        // outer ring
        ol.xml.pushSerializeAndPop(context,
            POLYGON_SERIALIZERS,
            OUTER_BOUNDARY_NODE_FACTORY,
            [outerRing], objectStack);
    }


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const POLY_STYLE_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'color': ol.xml.makeChildAppender(writeColorTextNode)
        });


    /**
     * A factory for creating coordinates nodes.
     * @const
     * @type {function(*, Array<*>, string=): (Node|undefined)}
     */
    const COLOR_NODE_FACTORY = ol.xml.makeSimpleNodeFactory('color');


    /**
     * @param {Node} node Node.
     * @param {ol.style.Fill} style Style.
     * @param {Array<*>} objectStack Object stack.
     */
    function writePolyStyle(node, style, objectStack) {
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        ol.xml.pushSerializeAndPop(context, POLY_STYLE_SERIALIZERS,
            COLOR_NODE_FACTORY, [style.getColor()], objectStack);
    }


    /**
     * @param {Node} node Node to append a TextNode with the scale to.
     * @param {number|undefined} scale Scale.
     */
    function writeScaleTextNode(node, scale) {
        // the Math is to remove any excess decimals created by float arithmetic
        ol.format.xsd.writeDecimalTextNode(node,
            Math.round(scale * 1e6) / 1e6);
    }


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const STYLE_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'IconStyle', 'LabelStyle', 'LineStyle', 'PolyStyle'
        ]);


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const STYLE_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'IconStyle': ol.xml.makeChildAppender(writeIconStyle),
            'LabelStyle': ol.xml.makeChildAppender(writeLabelStyle),
            'LineStyle': ol.xml.makeChildAppender(writeLineStyle),
            'PolyStyle': ol.xml.makeChildAppender(writePolyStyle)
        });


    /**
     * @param {Node} node Node.
     * @param {ol.style.Style} style Style.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeStyle(node, style, objectStack) {
        const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
        const properties = {};
        const fillStyle = style.getFill();
        const strokeStyle = style.getStroke();
        const imageStyle = style.getImage();
        const textStyle = style.getText();
        if (imageStyle && typeof /** @type {?} */ (imageStyle).getSrc === 'function') {
            properties['IconStyle'] = imageStyle;
        }
        if (textStyle) {
            properties['LabelStyle'] = textStyle;
        }
        if (strokeStyle) {
            properties['LineStyle'] = strokeStyle;
        }
        if (fillStyle) {
            properties['PolyStyle'] = fillStyle;
        }
        const parentNode = objectStack[objectStack.length - 1].node;
        const orderedKeys = STYLE_SEQUENCE[parentNode.namespaceURI];
        const values = ol.xml.makeSequence(properties, orderedKeys);
        ol.xml.pushSerializeAndPop(context, STYLE_SERIALIZERS,
            ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
    }


    /**
     * @param {Element} node Node to append a TextNode with the Vec2 to.
     * @param {Vec2} vec2 Vec2.
     */
    function writeVec2(node, vec2) {
        node.setAttribute('x', String(vec2.x));
        node.setAttribute('y', String(vec2.y));
        node.setAttribute('xunits', vec2.xunits);
        node.setAttribute('yunits', vec2.yunits);
    }

    ol.format.KMLCustom = KMLCustom;
})();

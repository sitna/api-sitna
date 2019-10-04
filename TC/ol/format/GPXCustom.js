(function () {
    /**
     * @const
     * @type {Array<null|string>}
     */
    let NAMESPACE_URIS = [
        null,
        'http://www.topografix.com/GPX/1/0',
        'http://www.topografix.com/GPX/1/1'
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

    // FLP: No utilizamos directamente ol.format.xsd.readDateTime porque esta función devuelve un timestamp en segundos.
    const readDateTime = function (node) {
        return ol.format.xsd.readDateTime(node) * 1000;
    };

    /**
     * @const
     * @type {string}
     */
    const SCHEMA_LOCATION = 'http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd';

    /**
     * @const
     * @type {Object<string, function(Node, Array<*>): (ol.Feature|undefined)>}
     */
    const FEATURE_READER = {
        'rte': readRte,
        'trk': readTrk,
        'wpt': readWpt
    };


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const GPX_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'rte': ol.xml.makeArrayPusher(readRte),
            'trk': ol.xml.makeArrayPusher(readTrk),
            'wpt': ol.xml.makeArrayPusher(readWpt)
        });


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const LINK_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'text': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString, 'linkText'),
            'type': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString, 'linkType')
        });


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const GPX_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'rte': ol.xml.makeChildAppender(writeRte),
            'trk': ol.xml.makeChildAppender(writeTrk),
            'wpt': ol.xml.makeChildAppender(writeWpt)
        });

    const writeDateTimeTextNode = function (node, dateTime) {
        var date = new Date(dateTime);
        var string = date.getUTCFullYear() + '-' +
            ol.string.padNumber(date.getUTCMonth() + 1, 2) + '-' +
            ol.string.padNumber(date.getUTCDate(), 2) + 'T' +
            ol.string.padNumber(date.getUTCHours(), 2) + ':' +
            ol.string.padNumber(date.getUTCMinutes(), 2) + ':' +
            ol.string.padNumber(date.getUTCSeconds(), 2) + 'Z';
        node.appendChild(ol.xml.DOCUMENT.createTextNode(string));
    };

    /**
     * @typedef {Object} Options
     * @property {function(Feature, Node)} [readExtensions] Callback function
     * to process `extensions` nodes. To prevent memory leaks, this callback function must
     * not store any references to the node. Note that the `extensions`
     * node is not allowed in GPX 1.0. Moreover, only `extensions`
     * nodes from `wpt`, `rte` and `trk` can be processed, as those are
     * directly mapped to a feature.
     */

    /**
     * @typedef {Object} LayoutOptions
     * @property {boolean} [hasZ]
     * @property {boolean} [hasM]
     */

    /**
     * @classdesc
     * Feature format for reading and writing data in the GPX format.
     *
     * Note that {@link module:ol/format/GPX~GPX#readFeature} only reads the first
     * feature of the source.
     *
     * When reading, routes (`<rte>`) are converted into LineString geometries, and
     * tracks (`<trk>`) into MultiLineString. Any properties on route and track
     * waypoints are ignored.
     *
     * When writing, LineString geometries are output as routes (`<rte>`), and
     * MultiLineString as tracks (`<trk>`).
     *
     * @api
     */
    class GPXCustom extends ol.format.GPX {

        /**
         * @param {Options=} opt_options Options.
         */
        constructor(opt_options) {
            super(opt_options);
        }

        /**
         * @inheritDoc
         */
        readFeatureFromNode(node, opt_options) {
            if (!ol.array.includes(NAMESPACE_URIS, node.namespaceURI)) {
                return null;
            }
            const featureReader = FEATURE_READER[node.localName];
            if (!featureReader) {
                return null;
            }
            const feature = featureReader(node, [this.getReadOptions(node, opt_options)]);
            if (!feature) {
                return null;
            }
            this.handleReadExtensions_([feature]);
            return feature;
        }

        /**
         * @inheritDoc
         */
        readFeaturesFromNode(node, opt_options) {
            if (!ol.array.includes(NAMESPACE_URIS, node.namespaceURI)) {
                return [];
            }
            if (node.localName == 'gpx') {
                /** @type {Array<ol.Feature>} */
                const features = ol.xml.pushParseAndPop([], GPX_PARSERS,
                    node, [this.getReadOptions(node, opt_options)]);
                if (features) {
                    this.handleReadExtensions_(features);
                    return features;
                } else {
                    return [];
                }
            }
            return [];
        }

        writeFeaturesNode(features, opt_options) {
            opt_options = this.adaptOptions(opt_options);
            //FIXME Serialize metadata
            const gpx = ol.xml.createElementNS('http://www.topografix.com/GPX/1/1', 'gpx');
            const xmlnsUri = 'http://www.w3.org/2000/xmlns/';
            gpx.setAttributeNS(xmlnsUri, 'xmlns:xsi', ol.xml.XML_SCHEMA_INSTANCE_URI);
            gpx.setAttributeNS(ol.xml.XML_SCHEMA_INSTANCE_URI, 'xsi:schemaLocation', SCHEMA_LOCATION);
            gpx.setAttribute('version', '1.1');
            gpx.setAttribute('creator', 'OpenLayers');

            ol.xml.pushSerializeAndPop(/** @type {import("../xml.js").NodeStackItem} */
                ({ node: gpx }), GPX_SERIALIZERS, GPX_NODE_FACTORY, features, [opt_options]);
            return gpx;
        }
    };


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const RTE_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'name': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'cmt': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'desc': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'src': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'link': parseLink,
            'number': ol.xml.makeObjectPropertySetter(ol.format.xsd.readNonNegativeInteger),
            'extensions': parseExtensions,
            'type': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'rtept': parseRtePt
        });


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const RTEPT_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'ele': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'time': ol.xml.makeObjectPropertySetter(readDateTime)
        });


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const TRK_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'name': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'cmt': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'desc': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'src': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'link': parseLink,
            'number': ol.xml.makeObjectPropertySetter(ol.format.xsd.readNonNegativeInteger),
            'type': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'extensions': parseExtensions,
            'trkseg': parseTrkSeg
        });


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const TRKSEG_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'trkpt': parseTrkPt
        });


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const TRKPT_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'ele': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'time': ol.xml.makeObjectPropertySetter(readDateTime)
        });


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Parser>>}
     */
    const WPT_PARSERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'ele': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'time': ol.xml.makeObjectPropertySetter(readDateTime),
            'magvar': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'geoidheight': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'name': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'cmt': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'desc': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'src': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'link': parseLink,
            'sym': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'type': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'fix': ol.xml.makeObjectPropertySetter(ol.format.xsd.readString),
            'sat': ol.xml.makeObjectPropertySetter(ol.format.xsd.readNonNegativeInteger),
            'hdop': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'vdop': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'pdop': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'ageofdgpsdata': ol.xml.makeObjectPropertySetter(ol.format.xsd.readDecimal),
            'dgpsid': ol.xml.makeObjectPropertySetter(ol.format.xsd.readNonNegativeInteger),
            'extensions': parseExtensions
        });


    /**
     * @const
     * @type {Array<string>}
     */
    const LINK_SEQUENCE = ['text', 'type'];


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const LINK_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'text': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'type': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode)
        });


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const RTE_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'name', 'cmt', 'desc', 'src', 'link', 'number', 'type', 'rtept'
        ]);


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const RTE_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'name': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'cmt': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'desc': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'src': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'link': ol.xml.makeChildAppender(writeLink),
            'number': ol.xml.makeChildAppender(ol.format.xsd.writeNonNegativeIntegerTextNode),
            'type': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'rtept': ol.xml.makeArraySerializer(ol.xml.makeChildAppender(writeWptType))
        });


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const RTEPT_TYPE_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'ele', 'time'
        ]);


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const TRK_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'name', 'cmt', 'desc', 'src', 'link', 'number', 'type', 'trkseg'
        ]);


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const TRK_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'name': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'cmt': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'desc': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'src': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'link': ol.xml.makeChildAppender(writeLink),
            'number': ol.xml.makeChildAppender(ol.format.xsd.writeNonNegativeIntegerTextNode),
            'type': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'trkseg': ol.xml.makeArraySerializer(ol.xml.makeChildAppender(writeTrkSeg))
        });


    /**
     * @const
     * @type {function(*, Array<*>, string=): (Node|undefined)}
     */
    const TRKSEG_NODE_FACTORY = ol.xml.makeSimpleNodeFactory('trkpt');


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const TRKSEG_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'trkpt': ol.xml.makeChildAppender(writeWptType)
        });


    /**
     * @const
     * @type {Object<string, Array<string>>}
     */
    const WPT_TYPE_SEQUENCE = ol.xml.makeStructureNS(
        NAMESPACE_URIS, [
            'ele', 'time', 'magvar', 'geoidheight', 'name', 'cmt', 'desc', 'src',
            'link', 'sym', 'type', 'fix', 'sat', 'hdop', 'vdop', 'pdop',
            'ageofdgpsdata', 'dgpsid'
        ]);


    /**
     * @const
     * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
     */
    const WPT_TYPE_SERIALIZERS = ol.xml.makeStructureNS(
        NAMESPACE_URIS, {
            'ele': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
            'time': ol.xml.makeChildAppender(writeDateTimeTextNode),
            'magvar': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
            'geoidheight': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
            'name': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'cmt': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'desc': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'src': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'link': ol.xml.makeChildAppender(writeLink),
            'sym': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'type': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'fix': ol.xml.makeChildAppender(ol.format.xsd.writeStringTextNode),
            'sat': ol.xml.makeChildAppender(ol.format.xsd.writeNonNegativeIntegerTextNode),
            'hdop': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
            'vdop': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
            'pdop': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
            'ageofdgpsdata': ol.xml.makeChildAppender(ol.format.xsd.writeDecimalTextNode),
            'dgpsid': ol.xml.makeChildAppender(ol.format.xsd.writeNonNegativeIntegerTextNode)
        });


    /**
     * @const
     * @type {Object<string, string>}
     */
    const GEOMETRY_TYPE_TO_NODENAME = {
        'Point': 'wpt',
        'LineString': 'rte',
        'MultiLineString': 'trk'
    };


    /**
     * @param {*} value Value.
     * @param {Array<*>} objectStack Object stack.
     * @param {string=} opt_nodeName Node name.
     * @return {Node|undefined} Node.
     */
    function GPX_NODE_FACTORY(value, objectStack, opt_nodeName) {
        const geometry = /** @type {ol.Feature} */ (value).getGeometry();
        if (geometry) {
            const nodeName = GEOMETRY_TYPE_TO_NODENAME[geometry.getType()];
            if (nodeName) {
                const parentNode = objectStack[objectStack.length - 1].node;
                return ol.xml.createElementNS(parentNode.namespaceURI, nodeName);
            }
        }
    }


    /**
     * @param {Array<number>} flatCoordinates Flat coordinates.
     * @param {LayoutOptions} layoutOptions Layout options.
     * @param {Element} node Node.
     * @param {!Object} values Values.
     * @return {Array<number>} Flat coordinates.
     */
    function appendCoordinate(flatCoordinates, layoutOptions, node, values) {
        flatCoordinates.push(
            parseFloat(node.getAttribute('lon')),
            parseFloat(node.getAttribute('lat')));
        if ('ele' in values) {
            flatCoordinates.push(/** @type {number} */(values['ele']));
            delete values['ele'];
            layoutOptions.hasZ = true;
        } else {
            flatCoordinates.push(0);
        }
        if ('time' in values) {
            flatCoordinates.push(/** @type {number} */(values['time']));
            delete values['time'];
            layoutOptions.hasM = true;
        } else {
            flatCoordinates.push(0);
        }
        return flatCoordinates;
    }


    /**
     * Choose GeometryLayout based on flags in layoutOptions and adjust flatCoordinates
     * and ends arrays by shrinking them accordingly (removing unused zero entries).
     *
     * @param {LayoutOptions} layoutOptions Layout options.
     * @param {Array<number>} flatCoordinates Flat coordinates.
     * @param {Array<number>=} ends Ends.
     * @return {ol.geom.GeometryLayout} Layout.
     */
    function applyLayoutOptions(layoutOptions, flatCoordinates, ends) {
        let layout = ol.geom.GeometryLayout.XY;
        let stride = 2;
        if (layoutOptions.hasZ && layoutOptions.hasM) {
            layout = ol.geom.GeometryLayout.XYZM;
            stride = 4;
        } else if (layoutOptions.hasZ) {
            layout = ol.geom.GeometryLayout.XYZ;
            stride = 3;
        } else if (layoutOptions.hasM) {
            layout = ol.geom.GeometryLayout.XYM;
            stride = 3;
        }
        if (stride !== 4) {
            for (let i = 0, ii = flatCoordinates.length / 4; i < ii; i++) {
                flatCoordinates[i * stride] = flatCoordinates[i * 4];
                flatCoordinates[i * stride + 1] = flatCoordinates[i * 4 + 1];
                if (layoutOptions.hasZ) {
                    flatCoordinates[i * stride + 2] = flatCoordinates[i * 4 + 2];
                }
                if (layoutOptions.hasM) {
                    flatCoordinates[i * stride + 2] = flatCoordinates[i * 4 + 3];
                }
            }
            flatCoordinates.length = flatCoordinates.length / 4 * stride;
            if (ends) {
                for (let i = 0, ii = ends.length; i < ii; i++) {
                    ends[i] = ends[i] / 4 * stride;
                }
            }
        }
        return layout;
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function parseLink(node, objectStack) {
        const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
        const href = node.getAttribute('href');
        if (href !== null) {
            values['link'] = href;
        }
        ol.xml.parseNode(LINK_PARSERS, node, objectStack);
    }


    /**
     * @param {Node} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function parseExtensions(node, objectStack) {
        const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
        values['extensionsNode_'] = node;
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function parseRtePt(node, objectStack) {
        const values = ol.xml.pushParseAndPop({}, RTEPT_PARSERS, node, objectStack);
        if (values) {
            const rteValues = /** @type {!Object} */ (objectStack[objectStack.length - 1]);
            const flatCoordinates = /** @type {Array<number>} */ (rteValues['flatCoordinates']);
            const layoutOptions = /** @type {LayoutOptions} */ (rteValues['layoutOptions']);
            appendCoordinate(flatCoordinates, layoutOptions, node, values);
        }
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function parseTrkPt(node, objectStack) {
        const values = ol.xml.pushParseAndPop({}, TRKPT_PARSERS, node, objectStack);
        if (values) {
            const trkValues = /** @type {!Object} */ (objectStack[objectStack.length - 1]);
            const flatCoordinates = /** @type {Array<number>} */ (trkValues['flatCoordinates']);
            const layoutOptions = /** @type {LayoutOptions} */ (trkValues['layoutOptions']);
            appendCoordinate(flatCoordinates, layoutOptions, node, values);
        }
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     */
    function parseTrkSeg(node, objectStack) {
        const values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
        ol.xml.parseNode(TRKSEG_PARSERS, node, objectStack);
        const flatCoordinates = /** @type {Array<number>} */
            (values['flatCoordinates']);
        const ends = /** @type {Array<number>} */ (values['ends']);
        ends.push(flatCoordinates.length);
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {ol.Feature|undefined} Track.
     */
    function readRte(node, objectStack) {
        const options = /** @type {import("./Feature.js").ReadOptions} */ (objectStack[0]);
        const values = ol.xml.pushParseAndPop({
            'flatCoordinates': [],
            'layoutOptions': {}
        }, RTE_PARSERS, node, objectStack);
        if (!values) {
            return undefined;
        }
        const flatCoordinates = /** @type {Array<number>} */
            (values['flatCoordinates']);
        delete values['flatCoordinates'];
        const layoutOptions = /** @type {LayoutOptions} */ (values['layoutOptions']);
        delete values['layoutOptions'];
        const layout = applyLayoutOptions(layoutOptions, flatCoordinates);
        const geometry = new ol.geom.LineString(flatCoordinates, layout);
        ol.format.Feature.transformWithOptions(geometry, false, options);
        const feature = new ol.Feature(geometry);
        feature.setProperties(values, true);
        return feature;
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {ol.Feature|undefined} Track.
     */
    function readTrk(node, objectStack) {
        const options = /** @type {import("./Feature.js").ReadOptions} */ (objectStack[0]);
        const values = ol.xml.pushParseAndPop({
            'flatCoordinates': [],
            'ends': [],
            'layoutOptions': {}
        }, TRK_PARSERS, node, objectStack);
        if (!values) {
            return undefined;
        }
        const flatCoordinates = /** @type {Array<number>} */
            (values['flatCoordinates']);
        delete values['flatCoordinates'];
        const ends = /** @type {Array<number>} */ (values['ends']);
        delete values['ends'];
        const layoutOptions = /** @type {LayoutOptions} */ (values['layoutOptions']);
        delete values['layoutOptions'];
        const layout = applyLayoutOptions(layoutOptions, flatCoordinates, ends);
        const geometry = new ol.geom.MultiLineString(flatCoordinates, layout, ends);
        ol.format.Feature.transformWithOptions(geometry, false, options);
        const feature = new ol.Feature(geometry);
        feature.setProperties(values, true);
        return feature;
    }


    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @return {ol.Feature|undefined} Waypoint.
     */
    function readWpt(node, objectStack) {
        const options = /** @type {import("./Feature.js").ReadOptions} */ (objectStack[0]);
        const values = ol.xml.pushParseAndPop({}, WPT_PARSERS, node, objectStack);
        if (!values) {
            return undefined;
        }
        const layoutOptions = /** @type {LayoutOptions} */ ({});
        const coordinates = appendCoordinate([], layoutOptions, node, values);
        const layout = applyLayoutOptions(layoutOptions, coordinates);
        const geometry = new ol.geom.Point(coordinates, layout);
        ol.format.Feature.transformWithOptions(geometry, false, options);
        const feature = new ol.Feature(geometry);
        feature.setProperties(values, true);
        return feature;
    }


    /**
     * @param {Element} node Node.
     * @param {string} value Value for the link's `href` attribute.
     * @param {Array<*>} objectStack Node stack.
     */
    function writeLink(node, value, objectStack) {
        node.setAttribute('href', value);
        const context = objectStack[objectStack.length - 1];
        const properties = context['properties'];
        const link = [
            properties['linkText'],
            properties['linkType']
        ];
        ol.xml.pushSerializeAndPop(/** @type {import("../xml.js").NodeStackItem} */({ node: node }),
            LINK_SERIALIZERS, ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
            link, objectStack, LINK_SEQUENCE);
    }


    /**
     * @param {Element} node Node.
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeWptType(node, coordinate, objectStack) {
        const context = objectStack[objectStack.length - 1];
        const parentNode = context.node;
        const namespaceURI = parentNode.namespaceURI;
        const properties = context['properties'];
        //FIXME Projection handling
        node.setAttributeNS(null, 'lat', String(coordinate[1]));
        node.setAttributeNS(null, 'lon', String(coordinate[0]));
        const geometryLayout = context['geometryLayout'];
        switch (geometryLayout) {
            case ol.geom.GeometryLayout.XYZM:
                if (coordinate[3] !== 0) {
                    properties['time'] = coordinate[3];
                }
            // fall through
            case ol.geom.GeometryLayout.XYZ:
                if (coordinate[2] !== 0) {
                    properties['ele'] = coordinate[2];
                }
                break;
            case ol.geom.GeometryLayout.XYM:
                if (coordinate[2] !== 0) {
                    properties['time'] = coordinate[2];
                }
                break;
            default:
            // pass
        }
        const orderedKeys = (node.nodeName == 'rtept') ?
            RTEPT_TYPE_SEQUENCE[namespaceURI] :
            WPT_TYPE_SEQUENCE[namespaceURI];
        const values = ol.xml.makeSequence(properties, orderedKeys);
        ol.xml.pushSerializeAndPop(/** @type {import("../xml.js").NodeStackItem} */
            ({ node: node, 'properties': properties }),
            WPT_TYPE_SERIALIZERS, ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
            values, objectStack, orderedKeys);
    }


    /**
     * @param {Node} node Node.
     * @param {ol.Feature} feature Feature.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeRte(node, feature, objectStack) {
        const options = /** @type {import("./Feature.js").WriteOptions} */ (objectStack[0]);
        const properties = feature.getProperties();
        const context = { node: node };
        context['properties'] = properties;
        const geometry = feature.getGeometry();
        if (geometry.getType() == ol.geom.GeometryType.LINE_STRING) {
            const lineString = /** @type {ol.geom.LineString} */ (ol.format.Feature.transformWithOptions(geometry, true, options));
            context['geometryLayout'] = lineString.getLayout();
            properties['rtept'] = lineString.getCoordinates();
        }
        const parentNode = objectStack[objectStack.length - 1].node;
        const orderedKeys = RTE_SEQUENCE[parentNode.namespaceURI];
        const values = ol.xml.makeSequence(properties, orderedKeys);
        ol.xml.pushSerializeAndPop(context,
            RTE_SERIALIZERS, ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
            values, objectStack, orderedKeys);
    }


    /**
     * @param {Node} node Node.
     * @param {ol.Feature} feature Feature.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeTrk(node, feature, objectStack) {
        const options = /** @type {import("./Feature.js").WriteOptions} */ (objectStack[0]);
        const properties = feature.getProperties();
        /** @type {import("../xml.js").NodeStackItem} */
        const context = { node: node };
        context['properties'] = properties;
        const geometry = feature.getGeometry();
        if (geometry.getType() == ol.geom.GeometryType.MULTI_LINE_STRING) {
            const multiLineString = /** @type {ol.geom.MultiLineString} */ (ol.format.Feature.transformWithOptions(geometry, true, options));
            properties['trkseg'] = multiLineString.getLineStrings();
        }
        const parentNode = objectStack[objectStack.length - 1].node;
        const orderedKeys = TRK_SEQUENCE[parentNode.namespaceURI];
        const values = ol.xml.makeSequence(properties, orderedKeys);
        ol.xml.pushSerializeAndPop(context,
            TRK_SERIALIZERS, ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
            values, objectStack, orderedKeys);
    }


    /**
     * @param {Node} node Node.
     * @param {ol.geom.LineString} lineString LineString.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeTrkSeg(node, lineString, objectStack) {
        /** @type {import("../xml.js").NodeStackItem} */
        const context = { node: node };
        context['geometryLayout'] = lineString.getLayout();
        context['properties'] = {};
        ol.xml.pushSerializeAndPop(context,
            TRKSEG_SERIALIZERS, TRKSEG_NODE_FACTORY,
            lineString.getCoordinates(), objectStack);
    }


    /**
     * @param {Element} node Node.
     * @param {ol.Feature} feature Feature.
     * @param {Array<*>} objectStack Object stack.
     */
    function writeWpt(node, feature, objectStack) {
        const options = /** @type {import("./Feature.js").WriteOptions} */ (objectStack[0]);
        const context = objectStack[objectStack.length - 1];
        context['properties'] = feature.getProperties();
        const geometry = feature.getGeometry();
        if (geometry.getType() == ol.geom.GeometryType.POINT) {
            const point = /** @type {ol.geom.Point} */ (ol.format.Feature.transformWithOptions(geometry, true, options));
            context['geometryLayout'] = point.getLayout();
            writeWptType(node, point.getCoordinates(), objectStack);
        }
    }

    ol.format.GPXCustom = GPXCustom;

})();

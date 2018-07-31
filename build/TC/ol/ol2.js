if (!window.OpenLayers) {
    TC.syncLoadJS(TC.url.ol);
}

(function () {
    OpenLayers._getScriptLocation = (function () {
        var result = OpenLayers._getScriptLocation();
        if (!result) {
            result = TC.url.ol.substr(0, TC.url.ol.lastIndexOf('/') + 1);
        }
        return (function () { return result; });
    })();

    OpenLayers.CustomTheme = TC.apiLocation + 'OpenLayers/theme/tcsa/style.css';
    OpenLayers.Util.extend(OpenLayers.Feature.Vector.style["default"], {
        fillColor: TC.Cfg.styles.polygon.fillColor,
        fillOpacity: TC.Cfg.styles.polygon.fillOpacity,
        strokeColor: TC.Cfg.styles.line.strokeColor,
        strokeWidth: TC.Cfg.styles.line.strokeWidth
    });

    // IE11 tiene un comportamiento raro en su XMLSerializer nativo
    // esto causa que meta namespaces falsos "NS1" por ahí
    // este parche sale de un foro http://osgeo-org.1560.x6.nabble.com/WFS-and-IE-11-td5090636.html
    OpenLayers.Format.XML.prototype._write = OpenLayers.Format.XML.prototype.write;
    OpenLayers.Format.XML.prototype.write = function () {
        var child = OpenLayers.Format.XML.prototype._write.apply(this, arguments);
        // NOTE: Remove the rogue namespaces as one block of text.
        //       The second fragment "NSd:" is too small on its own and could cause valid text (in, say, ogc:Literal elements) to be erroneously removed.
        child = child.replace(new RegExp('xmlns:NS\\d+="" NS\\d+:', 'g'), '');
        return child;
    };

    OpenLayers.Control.PanZoom.prototype.onButtonClick = function (evt) {
        var btn = evt.buttonElement;
        switch (btn.action) {
            case "panup":
                this.map.pan(0, -this.getSlideFactor("h"));
                break;
            case "pandown":
                this.map.pan(0, this.getSlideFactor("h"));
                break;
            case "panleft":
                this.map.pan(-this.getSlideFactor("w"), 0);
                break;
            case "panright":
                this.map.pan(this.getSlideFactor("w"), 0);
                break;
            case "zoomin":
                this.map.zoomIn();
                break;
            case "zoomout":
                this.map.zoomOut();
                break;
            case "zoomworld":
                this.map.zoomToExtent(this.map.options.extent);
                break;
        }
    };

    OpenLayers.Control.OverviewMap.prototype._updateOverview = OpenLayers.Control.OverviewMap.prototype.updateOverview;
    OpenLayers.Control.OverviewMap.prototype.updateOverview = function () {
        var self = this;
        if (self.active || self.active === null) {
            self._updateOverview();
        }
    };

    /* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
     * full list of contributors). Published under the 2-clause BSD license.
     * See license.txt in the OpenLayers distribution or repository for the
     * full text of the license. */

    /**
     * @requires OpenLayers/Format/XML.js
     */

    /**
     * Class: OpenLayers.Format.WMSGetFeatureInfo
     * Class to read GetFeatureInfo responses from Web Mapping Services
     *
     * Inherits from:
     *  - <OpenLayers.Format.XML>
     */
    OpenLayers.Format.WMSGetFeatureInfo = OpenLayers.Class(OpenLayers.Format.XML, {

        /**
         * APIProperty: layerIdentifier
         * {String} All xml nodes containing this search criteria will populate an
         *     internal array of layer nodes.
         */
        layerIdentifier: '_layer',

        /**
         * APIProperty: featureIdentifier
         * {String} All xml nodes containing this search criteria will populate an 
         *     internal array of feature nodes for each layer node found.
         */
        featureIdentifier: '_feature',

        /**
         * Property: regExes
         * Compiled regular expressions for manipulating strings.
         */
        regExes: {
            trimSpace: (/^\s*|\s*$/g),
            removeSpace: (/\s*/g),
            splitSpace: (/\s+/),
            trimComma: (/\s*,\s*/g)
        },

        /**
         * Property: gmlFormat
         * {<OpenLayers.Format.GML>} internal GML format for parsing geometries
         *     in msGMLOutput
         */
        gmlFormat: null,

        /**
         * Constructor: OpenLayers.Format.WMSGetFeatureInfo
         * Create a new parser for WMS GetFeatureInfo responses
         *
         * Parameters:
         * options - {Object} An optional object whose properties will be set on
         *     this instance.
         */

        /**
         * APIMethod: read
         * Read WMS GetFeatureInfo data from a string, and return an array of features
         *
         * Parameters:
         * data - {String} or {DOMElement} data to read/parse.
         *
         * Returns:
         * {Array(<OpenLayers.Feature.Vector>)} An array of features.
         */
        read: function (data) {
            var result;
            if (typeof data == "string") {
                data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
            }
            var root = data.documentElement;
            if (root) {
                var scope = this;
                var read = this["read_" + root.nodeName];
                if (read) {
                    result = read.call(this, root);
                } else {
                    // fall-back to GML since this is a common output format for WMS
                    // GetFeatureInfo responses
                    result = new OpenLayers.Format.GML((this.options ? this.options : {})).read(data);
                }
            } else {
                result = data;
            }
            return result;
        },


        /**
         * Method: read_msGMLOutput
         * Parse msGMLOutput nodes.
         *
         * Parameters:
         * data - {DOMElement}
         *
         * Returns:
         * {Array}
         */
        read_msGMLOutput: function (data) {
            var response = [];
            var layerNodes = this.getSiblingNodesByTagCriteria(data,
                this.layerIdentifier);
            if (layerNodes) {
                for (var i = 0, len = layerNodes.length; i < len; ++i) {
                    var node = layerNodes[i];
                    var layerName = node.nodeName;
                    if (node.prefix) {
                        layerName = layerName.split(':')[1];
                    }
                    var layerName = layerName.replace(this.layerIdentifier, '');
                    var featureNodes = this.getSiblingNodesByTagCriteria(node,
                        this.featureIdentifier);
                    if (featureNodes) {
                        for (var j = 0; j < featureNodes.length; j++) {
                            var featureNode = featureNodes[j];
                            var geomInfo = this.parseGeometry(featureNode);
                            var attributes = this.parseAttributes(featureNode);
                            var feature = new OpenLayers.Feature.Vector(geomInfo.geometry,
                                attributes, null);
                            feature.bounds = geomInfo.bounds;
                            feature.type = layerName;
                            response.push(feature);
                        }
                    }
                }
            }
            return response;
        },

        /**
         * Method: read_FeatureInfoResponse
         * Parse FeatureInfoResponse nodes.
         *
         * Parameters:
         * data - {DOMElement}
         *
         * Returns:
         * {Array}
         */
        read_FeatureInfoResponse: function (data) {
            var response = [];
            var featureNodes = this.getElementsByTagNameNS(data, '*',
                'FIELDS');

            for (var i = 0, len = featureNodes.length; i < len; i++) {
                var featureNode = featureNodes[i];
                var geom = null;

                // attributes can be actual attributes on the FIELDS tag, 
                // or FIELD children
                var attributes = {};
                var j;
                var jlen = featureNode.attributes.length;
                if (jlen > 0) {
                    for (j = 0; j < jlen; j++) {
                        var attribute = featureNode.attributes[j];
                        attributes[attribute.nodeName] = attribute.nodeValue;
                    }
                } else {
                    var nodes = featureNode.childNodes;
                    for (j = 0, jlen = nodes.length; j < jlen; ++j) {
                        var node = nodes[j];
                        if (node.nodeType != 3) {
                            attributes[node.getAttribute("name")] =
                                node.getAttribute("value");
                        }
                    }
                }

                response.push(
                    new OpenLayers.Feature.Vector(geom, attributes, null)
                );
            }
            return response;
        },

        /**
         * Method: getSiblingNodesByTagCriteria
         * Recursively searches passed xml node and all it's descendant levels for 
         *     nodes whose tagName contains the passed search string. This returns an 
         *     array of all sibling nodes which match the criteria from the highest 
         *     hierarchial level from which a match is found.
         * 
         * Parameters:
         * node - {DOMElement} An xml node
         * criteria - {String} Search string which will match some part of a tagName 
         *                                       
         * Returns:
         * Array({DOMElement}) An array of sibling xml nodes
         */
        getSiblingNodesByTagCriteria: function (node, criteria) {
            var nodes = [];
            var children, tagName, n, matchNodes, child;
            if (node && node.hasChildNodes()) {
                children = node.childNodes;
                n = children.length;

                for (var k = 0; k < n; k++) {
                    child = children[k];
                    while (child && child.nodeType != 1) {
                        child = child.nextSibling;
                        k++;
                    }
                    tagName = (child ? child.nodeName : '');
                    if (tagName.length > 0 && tagName.indexOf(criteria) > -1) {
                        nodes.push(child);
                    } else {
                        matchNodes = this.getSiblingNodesByTagCriteria(
                            child, criteria);

                        if (matchNodes.length > 0) {
                            (nodes.length == 0) ?
                                nodes = matchNodes : nodes.push(matchNodes);
                        }
                    }
                }

            }
            return nodes;
        },

        /**
         * Method: parseAttributes
         *
         * Parameters:
         * node - {<DOMElement>}
         *
         * Returns:
         * {Object} An attributes object.
         * 
         * Notes:
         * Assumes that attributes are direct child xml nodes of the passed node
         * and contain only a single text node. 
         */
        parseAttributes: function (node) {
            var attributes = {};
            if (node.nodeType == 1) {
                var children = node.childNodes;
                var n = children.length;
                for (var i = 0; i < n; ++i) {
                    var child = children[i];
                    if (child.nodeType == 1) {
                        var grandchildren = child.childNodes;
                        var name = (child.prefix) ?
                            child.nodeName.split(":")[1] : child.nodeName;
                        if (grandchildren.length == 0) {
                            attributes[name] = null;
                        } else if (grandchildren.length == 1) {
                            var grandchild = grandchildren[0];
                            if (grandchild.nodeType == 3 ||
                                grandchild.nodeType == 4) {
                                var value = grandchild.nodeValue.replace(
                                    this.regExes.trimSpace, "");
                                attributes[name] = value;
                            }
                        }
                    }
                }
            }
            return attributes;
        },

        /**
         * Method: parseGeometry
         * Parse the geometry and the feature bounds out of the node using 
         *     Format.GML
         *
         * Parameters:
         * node - {<DOMElement>}
         *
         * Returns:
         * {Object} An object containing the geometry and the feature bounds
        */
        parseGeometry: function (node) {
            // we need to use the old Format.GML parser since we do not know the 
            // geometry name
            if (!this.gmlFormat) {
                this.gmlFormat = new OpenLayers.Format.GML();
            }
            var feature = this.gmlFormat.parseFeature(node);
            var geometry, bounds = null;
            if (feature) {
                geometry = feature.geometry && feature.geometry.clone();
                bounds = feature.bounds && feature.bounds.clone();
                feature.destroy();
            }
            return { geometry: geometry, bounds: bounds };
        },

        CLASS_NAME: "OpenLayers.Format.WMSGetFeatureInfo"

    });

    // Parcheo para que OpenLayers interprete el CRS de la feature en el GML y reproyecte en consecuencia.
    OpenLayers.Format.GML.prototype._oldParseFeature = OpenLayers.Format.GML.prototype.parseFeature;
    OpenLayers.Format.GML.prototype.parseFeature = function (node) {
        this.externalProjection = null;
        // only accept one geometry per feature - look for highest "order"
        var order = ["MultiPolygon", "Polygon",
                     "MultiLineString", "LineString",
                     "MultiPoint", "Point", "Envelope"];
        // FIXME: In case we parse a feature with no geometry, but boundedBy an Envelope,
        // this code creates a geometry derived from the Envelope. This is not correct.
        var type, nodeList, geometry;
        for (var i = 0; i < order.length; ++i) {
            type = order[i];
            nodeList = this.getElementsByTagNameNS(node, this.gmlns, type);
            if (nodeList.length > 0) {
                // only deal with first geometry of this type
                var srsName = nodeList[0].getAttribute('srsName');
                if (srsName) {
                    TC.loadProjDef({ crs: srsName, sync: true });
                    this.externalProjection = new OpenLayers.Projection('EPSG:' + srsName.substr(srsName.lastIndexOf('#') + 1));
                }
                // stop looking for different geometry types
                break;
            }
        }
        return this._oldParseFeature(node);
    }

    /* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
     * full list of contributors). Published under the 2-clause BSD license.
     * See license.txt in the OpenLayers distribution or repository for the
     * full text of the license. */


    /**
     * @requires OpenLayers/Control.js
     * @requires OpenLayers/Handler/Click.js
     * @requires OpenLayers/Handler/Hover.js
     * @requires OpenLayers/Request.js
     * @requires OpenLayers/Format/WMSGetFeatureInfo.js
     */

    /**
     * Class: OpenLayers.Control.WMSGetFeatureInfo
     * The WMSGetFeatureInfo control uses a WMS query to get information about a point on the map.  The
     * information may be in a display-friendly format such as HTML, or a machine-friendly format such
     * as GML, depending on the server's capabilities and the client's configuration.  This control
     * handles click or hover events, attempts to parse the results using an OpenLayers.Format, and
     * fires a 'getfeatureinfo' event with the click position, the raw body of the response, and an
     * array of features if it successfully read the response.
     *
     * Inherits from:
     *  - <OpenLayers.Control>
     */
    OpenLayers.Control.WMSGetFeatureInfo = OpenLayers.Class(OpenLayers.Control, {

        /**
          * APIProperty: hover
          * {Boolean} Send GetFeatureInfo requests when mouse stops moving.
          *     Default is false.
          */
        hover: false,

        /**
         * APIProperty: drillDown
         * {Boolean} Drill down over all WMS layers in the map. When
         *     using drillDown mode, hover is not possible, and an infoFormat that
         *     returns parseable features is required. Default is false.
         */
        drillDown: false,

        /**
         * APIProperty: maxFeatures
         * {Integer} Maximum number of features to return from a WMS query. This
         *     sets the feature_count parameter on WMS GetFeatureInfo
         *     requests.
         */
        maxFeatures: 10,

        /**
         * APIProperty: clickCallback
         * {String} The click callback to register in the
         *     {<OpenLayers.Handler.Click>} object created when the hover
         *     option is set to false. Default is "click".
         */
        clickCallback: "click",

        /**
         * APIProperty: output
         * {String} Either "features" or "object". When triggering a getfeatureinfo
         *     request should we pass on an array of features or an object with with
         *     a "features" property and other properties (such as the url of the
         *     WMS). Default is "features".
         */
        output: "features",

        /**
         * APIProperty: layers
         * {Array(<OpenLayers.Layer.WMS>)} The layers to query for feature info.
         *     If omitted, all map WMS layers with a url that matches this <url> or
         *     <layerUrls> will be considered.
         */
        layers: null,

        /**
         * APIProperty: queryVisible
         * {Boolean} If true, filter out hidden layers when searching the map for
         *     layers to query.  Default is false.
         */
        queryVisible: false,

        /**
         * APIProperty: url
         * {String} The URL of the WMS service to use.  If not provided, the url
         *     of the first eligible layer will be used.
         */
        url: null,

        /**
         * APIProperty: layerUrls
         * {Array(String)} Optional list of urls for layers that should be queried.
         *     This can be used when the layer url differs from the url used for
         *     making GetFeatureInfo requests (in the case of a layer using cached
         *     tiles).
         */
        layerUrls: null,

        /**
         * APIProperty: infoFormat
         * {String} The mimetype to request from the server. If you are using
         *     drillDown mode and have multiple servers that do not share a common
         *     infoFormat, you can override the control's infoFormat by providing an
         *     INFO_FORMAT parameter in your <OpenLayers.Layer.WMS> instance(s).
         */
        infoFormat: 'text/html',

        /**
         * APIProperty: vendorParams
         * {Object} Additional parameters that will be added to the request, for
         *     WMS implementations that support them. This could e.g. look like
         * (start code)
         * {
         *     radius: 5
         * }
         * (end)
         */
        vendorParams: {},

        /**
         * APIProperty: format
         * {<OpenLayers.Format>} A format for parsing GetFeatureInfo responses.
         *     Default is <OpenLayers.Format.WMSGetFeatureInfo>.
         */
        format: null,

        /**
         * APIProperty: formatOptions
         * {Object} Optional properties to set on the format (if one is not provided
         *     in the <format> property.
         */
        formatOptions: null,

        /**
         * APIProperty: handlerOptions
         * {Object} Additional options for the handlers used by this control, e.g.
         * (start code)
         * {
         *     "click": {delay: 100},
         *     "hover": {delay: 300}
         * }
         * (end)
         */

        /**
         * Property: handler
         * {Object} Reference to the <OpenLayers.Handler> for this control
         */
        handler: null,

        /**
         * Property: hoverRequest
         * {<OpenLayers.Request>} contains the currently running hover request
         *     (if any).
         */
        hoverRequest: null,

        /**
         * APIProperty: events
         * {<OpenLayers.Events>} Events instance for listeners and triggering
         *     control specific events.
         *
         * Register a listener for a particular event with the following syntax:
         * (code)
         * control.events.register(type, obj, listener);
         * (end)
         *
         * Supported event types (in addition to those from <OpenLayers.Control.events>):
         * beforegetfeatureinfo - Triggered before the request is sent.
         *      The event object has an *xy* property with the position of the
         *      mouse click or hover event that triggers the request.
         * nogetfeatureinfo - no queryable layers were found.
         * getfeatureinfo - Triggered when a GetFeatureInfo response is received.
         *      The event object has a *text* property with the body of the
         *      response (String), a *features* property with an array of the
         *      parsed features, an *xy* property with the position of the mouse
         *      click or hover event that triggered the request, and a *request*
         *      property with the request itself. If drillDown is set to true and
         *      multiple requests were issued to collect feature info from all
         *      layers, *text* and *request* will only contain the response body
         *      and request object of the last request.
         */

        /**
         * Constructor: <OpenLayers.Control.WMSGetFeatureInfo>
         *
         * Parameters:
         * options - {Object}
         */
        initialize: function (options) {
            options = options || {};
            options.handlerOptions = options.handlerOptions || {};

            OpenLayers.Control.prototype.initialize.apply(this, [options]);

            if (!this.format) {
                this.format = new OpenLayers.Format.WMSGetFeatureInfo(
                    options.formatOptions
                );
            }

            if (this.drillDown === true) {
                this.hover = false;
            }

            if (this.hover) {
                this.handler = new OpenLayers.Handler.Hover(
                       this, {
                           'move': this.cancelHover,
                           'pause': this.getInfoForHover
                       },
                       OpenLayers.Util.extend(this.handlerOptions.hover || {}, {
                           'delay': 250
                       }));
            } else {
                var callbacks = {};
                callbacks[this.clickCallback] = this.getInfoForClick;
                this.handler = new OpenLayers.Handler.Click(
                    this, callbacks, this.handlerOptions.click || {});
            }
        },

        /**
         * Method: getInfoForClick
         * Called on click
         *
         * Parameters:
         * evt - {<OpenLayers.Event>}
         */
        getInfoForClick: function (evt) {
            this.events.triggerEvent("beforegetfeatureinfo", { xy: evt.xy });
            // Set the cursor to "wait" to tell the user we're working on their
            // click.
            OpenLayers.Element.addClass(this.map.viewPortDiv, "olCursorWait");
            this.request(evt.xy, {});
        },

        /**
         * Method: getInfoForHover
         * Pause callback for the hover handler
         *
         * Parameters:
         * evt - {Object}
         */
        getInfoForHover: function (evt) {
            this.events.triggerEvent("beforegetfeatureinfo", { xy: evt.xy });
            this.request(evt.xy, { hover: true });
        },

        /**
         * Method: cancelHover
         * Cancel callback for the hover handler
         */
        cancelHover: function () {
            if (this.hoverRequest) {
                this.hoverRequest.abort();
                this.hoverRequest = null;
            }
        },

        /**
         * Method: findLayers
         * Internal method to get the layers, independent of whether we are
         *     inspecting the map or using a client-provided array
         */
        findLayers: function () {

            var candidates = this.layers || this.map.layers;
            var layers = [];
            var layer, url;
            for (var i = candidates.length - 1; i >= 0; --i) {
                layer = candidates[i];
                if (layer instanceof OpenLayers.Layer.WMS &&
                   (!this.queryVisible || layer.getVisibility())) {
                    url = OpenLayers.Util.isArray(layer.url) ? layer.url[0] : layer.url;
                    // if the control was not configured with a url, set it
                    // to the first layer url
                    if (this.drillDown === false && !this.url) {
                        this.url = url;
                    }
                    if (this.drillDown === true || this.urlMatches(url)) {
                        layers.push(layer);
                    }
                }
            }
            return layers;
        },

        /**
         * Method: urlMatches
         * Test to see if the provided url matches either the control <url> or one
         *     of the <layerUrls>.
         *
         * Parameters:
         * url - {String} The url to test.
         *
         * Returns:
         * {Boolean} The provided url matches the control <url> or one of the
         *     <layerUrls>.
         */
        urlMatches: function (url) {
            var matches = OpenLayers.Util.isEquivalentUrl(this.url, url);
            if (!matches && this.layerUrls) {
                for (var i = 0, len = this.layerUrls.length; i < len; ++i) {
                    if (OpenLayers.Util.isEquivalentUrl(this.layerUrls[i], url)) {
                        matches = true;
                        break;
                    }
                }
            }
            return matches;
        },

        /**
         * Method: buildWMSOptions
         * Build an object with the relevant WMS options for the GetFeatureInfo request
         *
         * Parameters:
         * url - {String} The url to be used for sending the request
         * layers - {Array(<OpenLayers.Layer.WMS)} An array of layers
         * clickPosition - {<OpenLayers.Pixel>} The position on the map where the mouse
         *     event occurred.
         * format - {String} The format from the corresponding GetMap request
         */
        buildWMSOptions: function (url, layers, clickPosition, format) {
            var layerNames = [], styleNames = [];
            for (var i = 0, len = layers.length; i < len; i++) {
                if (layers[i].params.LAYERS != null) {
                    layerNames = layerNames.concat(layers[i].params.LAYERS);
                    styleNames = styleNames.concat(this.getStyleNames(layers[i]));
                }
            }
            var firstLayer = layers[0];
            // use the firstLayer's projection if it matches the map projection -
            // this assumes that all layers will be available in this projection
            var projection = this.map.getProjection();
            var layerProj = firstLayer.projection;
            if (layerProj && layerProj.equals(this.map.getProjectionObject())) {
                projection = layerProj.getCode();
            }
            var params = OpenLayers.Util.extend({
                service: "WMS",
                version: firstLayer.params.VERSION,
                request: "GetFeatureInfo",
                exceptions: firstLayer.params.EXCEPTIONS,
                bbox: this.map.getExtent().toBBOX(null,
                    firstLayer.reverseAxisOrder()),
                feature_count: this.maxFeatures,
                height: this.map.getSize().h,
                width: this.map.getSize().w,
                format: format,
                info_format: firstLayer.params.INFO_FORMAT || this.infoFormat
            }, (parseFloat(firstLayer.params.VERSION) >= 1.3) ?
            {
                crs: projection,
                i: parseInt(clickPosition.x),
                j: parseInt(clickPosition.y)
            } :
            {
                srs: projection,
                x: parseInt(clickPosition.x),
                y: parseInt(clickPosition.y)
            }
            );
            if (layerNames.length != 0) {
                params = OpenLayers.Util.extend({
                    layers: layerNames,
                    query_layers: layerNames,
                    styles: styleNames
                }, params);
            }
            OpenLayers.Util.applyDefaults(params, this.vendorParams);
            return {
                url: url,
                params: OpenLayers.Util.upperCaseObject(params),
                callback: function (request) {
                    this.handleResponse(clickPosition, request, url);
                },
                scope: this
            };
        },

        /**
         * Method: getStyleNames
         * Gets the STYLES parameter for the layer. Make sure the STYLES parameter
         * matches the LAYERS parameter
         *
         * Parameters:
         * layer - {<OpenLayers.Layer.WMS>}
         *
         * Returns:
         * {Array(String)} The STYLES parameter
         */
        getStyleNames: function (layer) {
            // in the event of a WMS layer bundling multiple layers but not
            // specifying styles,we need the same number of commas to specify
            // the default style for each of the layers.  We can't just leave it
            // blank as we may be including other layers that do specify styles.
            var styleNames;
            if (layer.params.STYLES) {
                styleNames = layer.params.STYLES;
            } else {
                if (OpenLayers.Util.isArray(layer.params.LAYERS)) {
                    styleNames = new Array(layer.params.LAYERS.length);
                } else { // Assume it's a String
                    styleNames = layer.params.LAYERS.replace(/[^,]/g, "");
                }
            }
            return styleNames;
        },

        /**
         * Method: request
         * Sends a GetFeatureInfo request to the WMS
         *
         * Parameters:
         * clickPosition - {<OpenLayers.Pixel>} The position on the map where the
         *     mouse event occurred.
         * options - {Object} additional options for this method.
         *
         * Valid options:
         * - *hover* {Boolean} true if we do the request for the hover handler
         */
        request: function (clickPosition, options) {
            var layers = this.findLayers();
            if (layers.length == 0) {
                this.events.triggerEvent("nogetfeatureinfo");
                // Reset the cursor.
                OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
                return;
            }

            options = options || {};
            if (this.drillDown === false) {
                var wmsOptions = this.buildWMSOptions(this.url, layers,
                    clickPosition, layers[0].params.FORMAT);
                var request = OpenLayers.Request.GET(wmsOptions);

                if (options.hover === true) {
                    this.hoverRequest = request;
                }
            } else {
                this._requestCount = 0;
                this._numRequests = 0;
                this.features = [];
                // group according to service url to combine requests
                var services = {}, url;
                for (var i = 0, len = layers.length; i < len; i++) {
                    var layer = layers[i];
                    var service, found = false;
                    url = OpenLayers.Util.isArray(layer.url) ? layer.url[0] : layer.url;
                    if (url in services) {
                        services[url].push(layer);
                    } else {
                        this._numRequests++;
                        services[url] = [layer];
                    }
                }
                var layers;
                for (var url in services) {
                    layers = services[url];
                    var wmsOptions = this.buildWMSOptions(url, layers,
                        clickPosition, layers[0].params.FORMAT);
                    OpenLayers.Request.GET(wmsOptions);
                }
            }
        },

        /**
         * Method: triggerGetFeatureInfo
         * Trigger the getfeatureinfo event when all is done
         *
         * Parameters:
         * request - {XMLHttpRequest} The request object
         * xy - {<OpenLayers.Pixel>} The position on the map where the
         *     mouse event occurred.
         * features - {Array(<OpenLayers.Feature.Vector>)} or
         *     {Array({Object}) when output is "object". The object has a url and a
         *     features property which contains an array of features.
         */
        triggerGetFeatureInfo: function (request, xy, features) {
            this.events.triggerEvent("getfeatureinfo", {
                text: request.responseText,
                features: features,
                request: request,
                xy: xy
            });

            // Reset the cursor.
            OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
        },

        /**
         * Method: handleResponse
         * Handler for the GetFeatureInfo response.
         *
         * Parameters:
         * xy - {<OpenLayers.Pixel>} The position on the map where the
         *     mouse event occurred.
         * request - {XMLHttpRequest} The request object.
         * url - {String} The url which was used for this request.
         */
        handleResponse: function (xy, request, url) {

            var doc = request.responseXML;
            if (!doc || !doc.documentElement) {
                doc = request.responseText;
            }
            var features = this.format.read(doc);
            if (this.drillDown === false) {
                this.triggerGetFeatureInfo(request, xy, features);
            } else {
                this._requestCount++;
                if (this.output === "object") {
                    this._features = (this._features || []).concat(
                        { url: url, features: features }
                    );
                } else {
                    this._features = (this._features || []).concat(features);
                }
                if (this._requestCount === this._numRequests) {
                    this.triggerGetFeatureInfo(request, xy, this._features.concat());
                    delete this._features;
                    delete this._requestCount;
                    delete this._numRequests;
                }
            }
        },

        CLASS_NAME: "OpenLayers.Control.WMSGetFeatureInfo"
    });

    OpenLayers.Format.WMSGetFeatureInfo.prototype._defaultRead_FeatureInfoResponse = OpenLayers.Format.WMSGetFeatureInfo.prototype.read_FeatureInfoResponse;
    OpenLayers.Format.WMSGetFeatureInfo.prototype['read_esri_wms:FeatureInfoResponse'] = function (data) {
        var response = [];
        var layerNodes = this.getElementsByTagNameNS(data, 'http://www.esri.com/wms',
            'FeatureInfoCollection');
        for (var i = 0; i < layerNodes.length; i++) {
            var layerNode = layerNodes[i];
            var featureNodes = this.getElementsByTagNameNS(layerNode, 'http://www.esri.com/wms',
            'FeatureInfo');

            for (var j = 0; j < featureNodes.length; j++) {
                var featureNode = featureNodes[j];
                var geom = null;

                var fieldNames = this.getElementsByTagNameNS(featureNode, 'http://www.esri.com/wms', 'FieldName');
                var fieldValues = this.getElementsByTagNameNS(featureNode, 'http://www.esri.com/wms', 'FieldValue');
                var attributes = {};
                for (var k = 0; k < fieldNames.length; k++) {
                    var fieldName = fieldNames[k];
                    var fieldValue = fieldValues[k];
                    // IE: text, rest: textContent
                    var text = fieldName.textContent === undefined ? 'text' : 'textContent'
                    attributes[fieldName[text]] = fieldValue[text];
                }

                var feature = new OpenLayers.Feature.Vector(geom, attributes, null);
                feature.type = layerNode.getAttribute('layername');
                response.push(feature);
            }
        }
        return response;
    };

    OpenLayers.Format.WMSGetFeatureInfo.prototype.read_FeatureInfoResponse = function (data) {
        if (data.namespaceURI === 'http://www.esri.com/wms') {
            return OpenLayers.Format.WMSGetFeatureInfo.prototype['read_esri_wms:FeatureInfoResponse'].call(this, data);
        }
        else {
            return OpenLayers.Format.WMSGetFeatureInfo.prototype._defaultRead_FeatureInfoResponse.call(this, data);
        }
    };

    (function () {
        // IE8 CORS fix

        // Define on browser type
        var bGecko = !!window.controllers,
            bIE = window.document.all && !window.opera,
            bIE7 = bIE && window.navigator.userAgent.match(/MSIE 7.0/);

        // Helper function
        function fReadyStateChange(oRequest) {
            // Sniffing code
            if (OpenLayers.Request.XMLHttpRequest.onreadystatechange)
                OpenLayers.Request.XMLHttpRequest.onreadystatechange.apply(oRequest);

            // Fake event
            oRequest.dispatchEvent({
                'type': "readystatechange",
                'bubbles': false,
                'cancelable': false,
                'timeStamp': new Date + 0
            });
        };

        function fSynchronizeValues(oRequest) {
            try { oRequest.responseText = oRequest._object.responseText; } catch (e) { }
            try { oRequest.responseXML = fGetDocument(oRequest._object); } catch (e) { }
            try { oRequest.status = oRequest._object.status; } catch (e) { }
            try { oRequest.statusText = oRequest._object.statusText; } catch (e) { }
        };

        function fCleanTransport(oRequest) {
            // BUGFIX: IE - memory leak (on-page leak)
            oRequest._object.onreadystatechange = new window.Function;
        };

        OpenLayers.Request.XMLHttpRequest.prototype.open = function (sMethod, sUrl, bAsync, sUser, sPassword) {
            // IE8 CORS fix
            function isSameOrigin(url) {
                var sameOrigin = url.indexOf("http") !== 0 && url.indexOf("//") !== 0;
                var urlParts = !sameOrigin && url.match(this.URL_SPLIT_REGEX);
                if (urlParts) {
                    var location = window.location;
                    sameOrigin =
                        urlParts[1] == location.protocol &&
                        urlParts[3] == location.hostname;
                    var uPort = urlParts[4], lPort = location.port;
                    if (uPort != 80 && uPort != "" || lPort != "80" && lPort != "") {
                        sameOrigin = sameOrigin && uPort == lPort;
                    }
                }
                return sameOrigin;
            }

            if (!isSameOrigin(sUrl)) {
                if (!("withCredentials" in this._object) && window.XDomainRequest) {
                    this._object = new window.XDomainRequest();
                }
            }

            // Delete headers, required when object is reused
            delete this._headers;

            // When bAsync parameter value is omitted, use true as default
            if (arguments.length < 3)
                bAsync = true;

            // Save async parameter for fixing Gecko bug with missing readystatechange in synchronous requests
            this._async = bAsync;

            // Set the onreadystatechange handler
            var oRequest = this,
                nState = this.readyState,
                fOnUnload;

            // BUGFIX: IE - memory leak on page unload (inter-page leak)
            if (bIE && bAsync) {
                fOnUnload = function () {
                    if (nState != OpenLayers.Request.XMLHttpRequest.DONE) {
                        fCleanTransport(oRequest);
                        // Safe to abort here since onreadystatechange handler removed
                        oRequest.abort();
                    }
                };
                window.attachEvent("onunload", fOnUnload);
            }

            // Add method sniffer
            if (OpenLayers.Request.XMLHttpRequest.onopen)
                OpenLayers.Request.XMLHttpRequest.onopen.apply(this, arguments);

            if (arguments.length > 4)
                this._object.open(sMethod, sUrl, bAsync, sUser, sPassword);
            else
                if (arguments.length > 3)
                    this._object.open(sMethod, sUrl, bAsync, sUser);
                else
                    this._object.open(sMethod, sUrl, bAsync);

            this.readyState = OpenLayers.Request.XMLHttpRequest.OPENED;
            fReadyStateChange(this);

            if ("withCredentials" in this._object || "onreadystatechange" in this._object) { // Fix para soportar vista de compatibilidad de IE, XHR tiene la propiedad onreadystatechange pero sigue sin tener withCredentials
                this._object.onreadystatechange = function () {
                    if (bGecko && !bAsync)
                        return;

                    // Synchronize state
                    oRequest.readyState = oRequest._object.readyState;

                    //
                    fSynchronizeValues(oRequest);

                    // BUGFIX: Firefox fires unnecessary DONE when aborting
                    if (oRequest._aborted) {
                        // Reset readyState to UNSENT
                        oRequest.readyState = OpenLayers.Request.XMLHttpRequest.UNSENT;

                        // Return now
                        return;
                    }

                    if (oRequest.readyState == OpenLayers.Request.XMLHttpRequest.DONE) {
                        // Free up queue
                        delete oRequest._data;
                        /*                if (bAsync)
                        fQueue_remove(oRequest);*/
                        //
                        fCleanTransport(oRequest);
                        // Uncomment this block if you need a fix for IE cache
                        /*
                        // BUGFIX: IE - cache issue
                        if (!oRequest._object.getResponseHeader("Date")) {
                        // Save object to cache
                        oRequest._cached    = oRequest._object;
    
                        // Instantiate a new transport object
                        OpenLayers.Request.XMLHttpRequest.call(oRequest);
    
                        // Re-send request
                        if (sUser) {
                        if (sPassword)
                        oRequest._object.open(sMethod, sUrl, bAsync, sUser, sPassword);
                        else
                        oRequest._object.open(sMethod, sUrl, bAsync, sUser);
                        }
                        else
                        oRequest._object.open(sMethod, sUrl, bAsync);
                        oRequest._object.setRequestHeader("If-Modified-Since", oRequest._cached.getResponseHeader("Last-Modified") || new window.Date(0));
                        // Copy headers set
                        if (oRequest._headers)
                        for (var sHeader in oRequest._headers)
                        if (typeof oRequest._headers[sHeader] == "string")    // Some frameworks prototype objects with functions
                        oRequest._object.setRequestHeader(sHeader, oRequest._headers[sHeader]);
    
                        oRequest._object.onreadystatechange    = function() {
                        // Synchronize state
                        oRequest.readyState        = oRequest._object.readyState;
    
                        if (oRequest._aborted) {
                        //
                        oRequest.readyState    = OpenLayers.Request.XMLHttpRequest.UNSENT;
    
                        // Return
                        return;
                        }
    
                        if (oRequest.readyState == OpenLayers.Request.XMLHttpRequest.DONE) {
                        // Clean Object
                        fCleanTransport(oRequest);
    
                        // get cached request
                        if (oRequest.status == 304)
                        oRequest._object    = oRequest._cached;
    
                        //
                        delete oRequest._cached;
    
                        //
                        fSynchronizeValues(oRequest);
    
                        //
                        fReadyStateChange(oRequest);
    
                        // BUGFIX: IE - memory leak in interrupted
                        if (bIE && bAsync)
                        window.detachEvent("onunload", fOnUnload);
                        }
                        };
                        oRequest._object.send(null);
    
                        // Return now - wait until re-sent request is finished
                        return;
                        };
                        */
                        // BUGFIX: IE - memory leak in interrupted
                        if (bIE && bAsync)
                            window.detachEvent("onunload", fOnUnload);
                    }

                    // BUGFIX: Some browsers (Internet Explorer, Gecko) fire OPEN readystate twice
                    if (nState != oRequest.readyState)
                        fReadyStateChange(oRequest);

                    nState = oRequest.readyState;
                }
            } else {
                this._object.onload = function () {
                    if (bGecko && !bAsync)
                        return;
                    oRequest.readyState = OpenLayers.Request.XMLHttpRequest.DONE;
                    oRequest._object.status = 200;
                    oRequest._object.statusText = "OK";
                    fSynchronizeValues(oRequest);
                    // Free up queue
                    delete oRequest._data;
                    /*                if (bAsync)
                    fQueue_remove(oRequest);*/
                    //
                    // BUGFIX: IE - memory leak in interrupted
                    if (bIE && bAsync)
                        window.detachEvent("onunload", fOnUnload);
                    oRequest.onreadystatechange();
                }
            }
        };

        OpenLayers.Request.XMLHttpRequest.prototype.setRequestHeader = function (sName, sValue) {
            // BUGFIX: IE - cache issue
            if (!this._headers)
                this._headers = {};
            this._headers[sName] = sValue;

            if ("setRequestHeader" in this._object) {
                return this._object.setRequestHeader(sName, sValue);
            } else if ("contentType" in this._object && sName == "Content-Type") {    //objeto XDR
                // La propiedad existe pero es de solo lectura, no se puede modificar su contenido y por tanto el content-type de la XDR
                //this._object.contentType = sValue;
                return;
            } else {
                return;
            }
        };

    })();

    OpenLayers.Format.KML.prototype._getNodeText = function (node) {
        var result = "";
        if (node.textContent !== undefined) {
            result = node.textContent;
        }
        else if (node.innerHTML !== undefined) {
            result = node.innerHTML;
        }
        else if (node.text !== undefined) {
            result = node.text;
        }
        return result;
    };

    OpenLayers.Format.KML.prototype._getFolderHierarchy = function (node) {
        var ret = [];
        var cur = node;
        if (cur.parentNode) {
            do {
                cur = cur.parentNode;
                if (cur.nodeName.toLowerCase() == "folder") {
                    //esto es muy lento en IE
                    //var folderName = this.parseProperty(cur, "*", "name"); 

                    //el purgatorio del software está lleno de código como lo que sigue:
                    var folderName;
                    if (cur.childNodes && cur.childNodes.length && cur.childNodes.length > 0) {
                        if (cur.childNodes[0].nodeName == "name") {
                            folderName = this._getNodeText(cur.childNodes[0]);
                        }
                        else if (cur.childNodes.length > 1) {
                            folderName = this._getNodeText(cur.childNodes[1]);
                        }
                    }

                    if (folderName) ret.push(folderName);
                }
            }
            while (cur.parentNode !== null && cur.parentNode.nodeName.toLowerCase() !== "document");
        }
        ret.reverse();

        if (!this._folderTree) {
            this._folderTree = { children: [] };
        }
        TC.Util.addArrayToTree(ret, this._folderTree);

        return ret;
    };

    OpenLayers.Format.KML.prototype.parserTimeout = 0;
    OpenLayers.Format.KML.prototype.parseFeatures = function (nodes, options) {
        var features = [];
        var t0 = new Date();
        var t1, diff;
        for (var i = 0, len = nodes.length; i < len; i++) {
            if (this.parserTimeout > 0) {
                if (i % 10 === 0 && i > 0) {
                    t1 = new Date();
                    diff = parseInt(t1.getTime() - t0.getTime());
                    if (diff > this.parserTimeout) {
                        throw "El archivo KML es demasiado complejo para este navegador." + diff + "ms, " + i + " features";
                    }
                    //console.log(i + " features! - " + parseInt(t1.getTime() - t0.getTime())+"ms");
                }
            }

            var featureNode = nodes[i];
            var feature = this.parseFeature.apply(this, [featureNode]);
            if (feature) {

                // Create reference to styleUrl 
                if (this.extractStyles && feature.attributes &&
                    feature.attributes.styleUrl) {
                    feature.style = this.getStyle(feature.attributes.styleUrl, options);
                }

                if (this.extractStyles) {
                    // Make sure that <Style> nodes within a placemark are 
                    // processed as well
                    var inlineStyleNode = this.getElementsByTagNameNS(featureNode,
                                                        "*",
                                                        "Style")[0];
                    if (inlineStyleNode) {
                        var inlineStyle = this.parseStyle(inlineStyleNode);
                        if (inlineStyle) {
                            feature.style = OpenLayers.Util.extend(
                                feature.style, inlineStyle
                            );
                        }
                    }
                }

                //mvillafranca: parse folder, add it as an attribute
                if (this.parseFolders) {
                    feature._folders = this._getFolderHierarchy(featureNode);
                }


                // check if gx:Track elements should be parsed
                if (this.extractTracks) {
                    var tracks = this.getElementsByTagNameNS(
                        featureNode, this.namespaces.gx, "Track"
                    );
                    if (tracks && tracks.length > 0) {
                        var track = tracks[0];
                        var container = {
                            features: [],
                            feature: feature
                        };
                        this.readNode(track, container);
                        if (container.features.length > 0) {
                            features.push.apply(features, container.features);
                        }
                    }
                } else {
                    // add feature to list of features
                    features.push(feature);
                }
            } else {
                throw "Bad Placemark: " + i;
            }
        }

        // add new features to existing feature list
        this.features = this.features.concat(features);
    };

    OpenLayers.Format.KML.prototype._read = OpenLayers.Format.KML.prototype.read;

    OpenLayers.Format.KML.prototype.read = function (data) {
        var doc = this.getChildEl(data.documentElement, 'Document');
        if (doc) {
            var name = this.getChildEl(doc, 'name');
            if (name) {
                this._documentName = this._getNodeText(name);
            }
        }
        return this._read.call(this, data);
    };


    OpenLayers.Popup.Anchored.prototype.calculateRelativePosition = function () {
        return 'tr';
    };

    OpenLayers.Control.PanZoomBar.prototype._draw = OpenLayers.Control.PanZoomBar.prototype.draw;

    OpenLayers.Control.PanZoomBar.prototype.draw = function (centered) {
        var self = this;
        var result = OpenLayers.Control.PanZoomBar.prototype._draw.call(self, centered);
        $(self.div).removeAttr('style').addClass('tc-ctl-nav');
        var $zoomin = $(self.buttons[0]);
        var height = $zoomin.height();
        $zoomin.removeAttr('style').addClass('tc-ctl-nav-btn tc-ctl-nav-btn-zoomin');
        var offset = $zoomin.height() - height;
        var $zoombarDiv = $(self.zoombarDiv);
        var height = $zoombarDiv.css('height');
        $zoombarDiv.removeAttr('style').addClass('tc-ctl-nav-bar').css('height', height);
        var $slider = $(self.slider);
        height = $slider.css('height');
        $slider.removeAttr('style').addClass('tc-ctl-nav-slider').css('height', height);
        $(self.buttons[1]).removeAttr('style').addClass('tc-ctl-nav-btn tc-ctl-nav-btn-zoomout');
        $(self.buttons[2]).removeAttr('style').addClass('tc-ctl-nav-btn tc-ctl-nav-btn-home');
        return result;
    };

    TC.wrap.Map.prototype.setMap = function () {
        var self = this;
        var options = self.parent.options;

        if (options.proxy) {
            OpenLayers.ProxyHost = options.proxy;
        }

        self.map = new OpenLayers.Map(self.parent.div, {
            projection: options.crs,
            extent: options.initialExtent,
            maxExtent: options.maxExtent,
            restrictedExtent: options.maxExtent,
            controls: [
                    new OpenLayers.Control.Navigation({
                        dragPanOptions: {
                            enableKinetic: true
                        },
                        pinchZoomOptions: {
                            autoActivate: true
                        },
                        zoomWheelEnabled: options.mouseWheelZoom
                    })
            ],
            theme: OpenLayers.CustomTheme
        });

        self.map.events.register('zoomstart', self.parent, function () {
            self.parent.$events.trigger($.Event(TC.Consts.event.BEFOREZOOM));
        });

        self.map.events.register('zoomend', self.parent, function () {
            self.parent.$events.trigger($.Event(TC.Consts.event.ZOOM));
        });

        self.map.events.register('featureclick', self.parent, function (e) {
            if (e.feature && e.feature._wrap) {
                self.parent.$events.trigger($.Event(TC.Consts.event.FEATURECLICK, { feature: e.feature._wrap.parent }));
            }
        });

        self.map.events.register('nofeatureclick', self.parent, function (e) {
            for (var i = 0; i < self.parent.workLayers.length; i++) {
                var layer = self.parent.workLayers[i];
                if (layer.wrap.layer === e.layer) {
                    self.parent.$events.trigger($.Event(TC.Consts.event.NOFEATURECLICK, { layer: layer }));
                }
            }
        });

        var resizeTimeout;
        $(self.parent.div).on('resize', function () {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function () {
                self.map.updateSize();
            }, 200);
        });

        self.mapDeferred.resolve(self.map);
    };

    TC.wrap.Map.prototype.getMetersPerUnit = function () {
        TC.error('TC.wrap.Map.prototype.getMetersPerUnit no está soportada con OpenLayers 2');
    };

    TC.wrap.Map.prototype.setProjection = function (options) {
        TC.error('TC.wrap.Map.prototype.setProjection no está soportada con OpenLayers 2');
    };

    /*
     *  wrap.insertLayer: inserts OpenLayers layer at index
     *  Parameters: OpenLayers.Layer, number
     */
    TC.wrap.Map.prototype.insertLayer = function (olLayer, idx) {
        var self = this;
        var alreadyExists = false;
        for (var i = 0; i < self.map.layers.length; i++) {
            if (self.map.layers[i] === olLayer) {
                alreadyExists = true;
                break;
            }
        }
        if (!alreadyExists) {
            self.map.addLayer(olLayer);
        }
        self.map.setLayerIndex(olLayer, idx);
    };

    TC.wrap.Map.prototype.removeLayer = function (olLayer) {
        this.map.removeLayer(olLayer);
    };

    TC.wrap.Map.prototype.getLayerCount = function () {
        return this.map.getNumLayers();
    };

    TC.wrap.Map.prototype.indexOfFirstVector = function () {
        var self = this;
        var result = -1;
        for (var i = 0, len = self.map.layers.length; i < len; i++) {
            if (self.map.layers[i] instanceof OpenLayers.Layer.Vector) {
                result = i;
                break;
            }
        }
        return result;
    };

    TC.wrap.Map.prototype.getLayerIndex = function (olLayer) {
        return this.map.getLayerIndex(olLayer);
    };

    TC.wrap.Map.prototype.setLayerIndex = function (olLayer, index)
    {
        this.map.setLayerIndex(olLayer, index);
    };


    TC.wrap.Map.prototype.setBaseLayer = function (olLayer) {
        var self = this;
        var result = new $.Deferred();
        self.map.addLayer(olLayer);
        self.map.setBaseLayer(olLayer);
        if (self.parent.baseLayer) {
            self.map.removeLayer(self.parent.baseLayer.wrap.getLayer());
        }
        result.resolve();
        return result;
    };

    TC.wrap.Map.prototype.setExtent = function (extent) {
        this.map.updateSize();
        this.map.zoomToExtent(extent);
    };

    TC.wrap.Map.prototype.getExtent = function () {
        var result = null;
        var bounds = this.map.getExtent();
        if (bounds) {
            result = [bounds.left, bounds.bottom, bounds.right, bounds.top];
        }
        return result;
    };

    TC.wrap.Map.prototype.setCenter = function (coords) {
        this.map.panTo(coords);
    };

    TC.wrap.Map.prototype.getResolution = function () {
        return this.map.getResolution();
    };

    TC.wrap.Map.prototype.setResolution = function (resolution) {
        $.when(this.getMap()).then(function (olMap) {
            olMap.zoomTo(olMap.getZoomForResolution(resolution));
        });
    };

    TC.wrap.Map.prototype.getResolutions = function () {
        var result = [];
        var self = this;
        if (self.map.resolutions) {
            result = self.map.resolutions;
        }
        else {
            if (self.map.baseLayer) {
                result = self.map.baseLayer.resolutions;
            }
            if (!result) {
                for (var i = 0; i < self.map.layers.length && !result; i++) {
                    result = self.map.layers[i].resolutions;
                }
            }
        }
        return result;
    };

    TC.wrap.Map.prototype.getCoordinateFromPixel = function (xy) {
        var coord = this.map.getLonLatFromPixel({ x: xy[0], y: xy[1] });
        return [coord.lon, coord.lat];
    };

    TC.wrap.Map.prototype.getPixelFromCoordinate = function (coord) {
        var xy = this.map.getPixelFromLonLat({ lon: coord[0], lat: coord[1] });
        return [xy.x, xy.y];
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
        return map instanceof OpenLayers.Map;
    };

    TC.wrap.Map.prototype.isGeo = function () {
        var self = this;
        var projection = self.map.getProjectionObject();
        if (projection === null) {
            projection = new OpenLayers.Projection(self.map.projection);
        }
        var units = projection.getUnits();
        return units === 'degrees' || !units;
    };

    TC.wrap.Map.prototype.addPopup = function (popupCtl) {
        // Cargamos provisionalmente un div para que no se rompan ciertas funciones si se llaman antes de TC.wrap.Map.showPopup
        popupCtl.$popupDiv = $('<div>');
    };

    TC.wrap.Map.prototype.hidePopup = function (popupCtl) {
        var self = this;
        var map = self.parent;
        if (popupCtl) {
            $.when(map.wrap.getMap()).then(function (olMap) {
                if (popupCtl.wrap.popup && map.popup === popupCtl) {
                    olMap.removePopup(popupCtl.wrap.popup);
                    popupCtl.wrap.popup.destroy();
                    delete popupCtl.wrap.popup;
                    map.popup = null;
                }
            });
        }
    };

    TC.wrap.Map.prototype.exportFeatures = function (features, options) {
        TC.error('TC.wrap.Map.prototype.exportFeatures no implementado en OpenLayers 2');
    };

    TC.wrap.Map.prototype.enableDragAndDrop = function (options) {
        TC.error('TC.wrap.Map.prototype.enableDragAndDrop no implementado en OpenLayers 2');
    };

    TC.wrap.Map.prototype.loadFiles = function (options) {
        TC.error('TC.wrap.Map.prototype.loadFiles no implementado en OpenLayers 2');
    };

    /*
     *  getVisibility: gets the OpenLayers layer visibility
     *  Result: boolean
     */
    TC.wrap.Layer.prototype.getVisibility = function () {
        var self = this;
        var result = false;
        if (self.layer) {
            result = self.layer.getVisibility();
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
            layer.setVisibility(visible);
        });
    };

    TC.wrap.Layer.prototype.isNative = function (layer) {
        return layer instanceof OpenLayers.Layer;
    };

    TC.wrap.Layer.prototype.setProjection = function (options) {
    };

    TC.wrap.Layer.prototype.WmsParser = OpenLayers.Format.WMSCapabilities;

    TC.wrap.Layer.prototype.WmtsParser = OpenLayers.Format.WMTSCapabilities;

    TC.wrap.Layer.prototype.addCommonEvents = function (layer) {
        var self = this;
        layer.events.register('loadstart', self.parent.map, function () {
            self.parent.state = TC.Layer.state.LOADING;
            if (self.parent.map) {
                self.parent.map.$events.trigger($.Event(TC.Consts.event.BEFORELAYERUPDATE, { layer: self.parent }));
            }
        });
        layer.events.register('loadend', self.parent.map, function () {
            self.parent.state = TC.Layer.state.IDLE;
            if (self.parent.map) {
                self.parent.map.$events.trigger($.Event(TC.Consts.event.LAYERUPDATE, { layer: self.parent }));
            }
        });
        layer.events.register('visibilitychanged', self.parent.map, function () {
            if (self.parent.map) {
                self.parent.map.$events.trigger($.Event(TC.Consts.event.LAYERVISIBILITY, { layer: self.parent }));
            }
        });
    };

    TC.wrap.layer.Raster.prototype.getGetMapUrl = function () {
        var result = null;
        var self = this;
        switch (self.getServiceType()) {
            case TC.Consts.layerType.WMS:
                result = self.parent.capabilities.capability.request.getmap.href;
                break;
            case TC.Consts.layerType.WMTS:
                result = self.parent.capabilities.operationsMetadata.GetTile.dcp.http.get[0].url
                break;
            default:
                break;
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getInfoFormats = function () {
        var result = null;
        var c = this.parent.capabilities;
        if (c.capability && c.capability.request.getfeatureinfo) {
            result = c.capability.request.getfeatureinfo.formats;
        }
        return result;
    };

    TC.wrap.layer.Raster.infoFormatPreference = [
        'application/vnd.ogc.gml',
        'application/json',
        'application/vnd.esri.wms_featureinfo_xml',
        'application/vnd.esri.wms_raw_xml',
        'application/vnd.ogc.wms_xml',
        'text/xml',
        'text/html',
        'text/plain'
    ];

    TC.wrap.layer.Raster.prototype.getWMTSLayer = function () {
        var result = null;
        var self = this;
        var capabilities = self.parent.capabilities;
        if (capabilities && capabilities.contents) {
            for (var i = 0; i < capabilities.contents.layers.length; i++) {
                var layer = capabilities.contents.layers[i];
                for (var j = 0; j < layer.tileMatrixSetLinks.length; j++) {
                    if (self.parent.options.matrixSet === layer.tileMatrixSetLinks[j].tileMatrixSet) {
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
        if (capabilities && capabilities.contents && capabilities.contents.tileMatrixSets[matrixSet]) {
            result = _layer.capabilities.contents.tileMatrixSets[_layer.options.matrixSet].matrixIds;
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getScaleDenominators = function (node) {
        var result = [];
        var self = this;
        if (node.scaleDenominator) {
            result = [node.scaleDenominator, node.scaleDenominator];
        }
        else {
            if (node.minScale || node.maxScale) {
                result = [node.minScale, node.maxScale];
            }
        }
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
        var result = {};
        if (capabilities) {
            if (capabilities.serviceProvider) {
                result.name = capabilities.serviceProvider.providerName.trim();
                result.site = capabilities.serviceProvider.providerSite;
                if (result.site.href) {
                    result.site = result.site.href;
                }
            }
            else if (capabilities.serviceIdentification) {
                result.name = capabilities.serviceIdentification.title.trim();
            }
            else {
                result.name = capabilities.service.title.trim();
            }
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getInfo = function (name) {
        var result = {};
        var capabilities = this.parent.capabilities;
        if (capabilities && capabilities.capability) {
            var nameMatch = function (node, name) {
                var fullName = (node.prefix.length && name.indexOf(node.prefix) !== 0) ? node.prefix + ':' + name : name;
                return node.name === fullName;
            };
            for (var i = 0; i < capabilities.capability.layers.length; i++) {
                var l = capabilities.capability.layers[i];
                if (nameMatch(l, name)) {
                    if (l.title) {
                        result.title = l.title;
                    }
                    if (l['abstract']) {
                        result['abstract'] = l['abstract'];
                    }
                    if (l.styles.length) {
                        result.legend = l.styles[0].legend.href;
                    }
                    if (l.metadataURLs.length) {
                        result.metadata = [];
                        for (var j = 0; j < l.metadataURLs.length; j++) {
                            var md = l.metadataURLs[j];
                            result.metadata.push({ format: md.format, type: md.type, url: md.href });
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
        if (capabilities.capability && capabilities.capability.request && capabilities.capability.request.getmap) {
            result = TC.Consts.layerType.WMS;
        }
        else if (capabilities.operationsMetadata && capabilities.operationsMetadata.GetTile) {
            result = TC.Consts.layerType.WMTS;
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getServiceTitle = function () {
        var result = null;
        var capabilities = this.parent.capabilities;
        if (capabilities.capability && capabilities.service) {
            result = capabilities.service.title;
        }
        else if (capabilities.serviceIdentification) {
            result = capabilities.serviceIdentification.title;
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getRootLayerNode = function () {
        var self = this;
        var result;
        if (self.getServiceType() === TC.Consts.layerType.WMS) {
            result = self.parent.capabilities.capability.nestedLayers[0];
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getName = function (node, ignorePrefix) {
        var result = node.name;
        if (result && ignorePrefix) {
            var idx = result.indexOf(':');
            if (idx >= 0) {
                result = result.substr(idx + 1);
            }
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getIdentifier = function (node) {
        return node.identifier;
    };

    TC.wrap.layer.Raster.prototype.getLayerNodes = function (node) {
        var result = node.nestedLayers;
        if (!$.isArray(result)) {
            result = [];
        }
        return result;
    };

    
    TC.wrap.layer.Raster.prototype.normalizeLayerNode = function (node) {        
        node.Layer = node.nestedLayers;
        if (node.Layer)
        {
            for(var i=0; i<node.Layer.length; i++)
            {
                TC.wrap.layer.Raster.prototype.normalizeLayerNode(node.Layer[i]);
            }
        }
        node.Title = node.title;
        node.Abstract = node['abstract'];

        return node;
    };

    TC.wrap.layer.Raster.prototype.normalizeCapabilities = function (capabilities) {
        return {
            Capability:
                {
                    Exception: cap.capability.exception,
                    Layer: cap.capability.nestedLayers[0]
                },
            Service:cap.service,
            version:cap.version
        };
    };
    
    TC.wrap.layer.Raster.prototype.getAllLayerNodes = function () {
        var self = this;
        var capabilities = this.parent.capabilities;
        switch (self.getServiceType()) {
            case TC.Consts.layerType.WMS:
                return capabilities.capability.layers;
            case TC.Consts.layerType.WMTS:
                return capabilities.contents.layers;
            default:
                return [];
        }
    };

    TC.wrap.layer.Raster.prototype.getLegend = function (node) {
        var result = {};
        var styles = node.styles;
        if (styles && styles.length) {
            var legend = styles[0].legend || {};
            result.src = legend.href;
            // Eliminado porque GeoServer miente con el tamaño de sus imágenes de la leyenda
            //if (legend.width) {
            //    result.width = legend.width;
            //    result.height = legend.height;
            //}
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.isCompatible = function (crs) {
        var self = this;
        var result = false;
        var layer = self.parent;
        switch (self.getServiceType()) {
            case TC.Consts.layerType.WMS:
                if (layer.capabilities && layer.capabilities.capability && layer.capabilities.capability.layers) {
                    if (layer.names.length === 0) {
                        result = true;
                    }
                    else {
                        var names = layer.names.slice(0);
                        for (var i = 0; i < layer.capabilities.capability.layers.length; i++) {
                            var lyr = layer.capabilities.capability.layers[i];
                            var idx = $.inArray(self.getName(lyr), names);
                            if (idx >= 0) {
                                names.splice(idx, 1);
                                result = lyr.srs[crs];
                                if (!result || !names.length) {
                                    break;
                                }
                            }
                        }
                    }
                }
                break;
            case TC.Consts.layerType.WMTS:
                var supportedCrs = layer.capabilities &&
                    layer.capabilities.contents &&
                    layer.capabilities.contents.tileMatrixSets[layer.options.matrixSet] &&
                    layer.capabilities.contents.tileMatrixSets[layer.options.matrixSet].supportedCRS;
                var crsRegExp = new RegExp('^urn:ogc:def:crs:' + crs.replace(':', ':.*:') + '$', 'g');
                result = supportedCrs && (crsRegExp.test(supportedCrs) || supportedCrs === crs);
                break;
            default:
                break;
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.getCompatibleCRS = function () {
        return [];
    }

    TC.wrap.layer.Raster.prototype.getCompatibleLayers = function (crs) {
        var self = this;
        var result = [];
        var layer = self.parent;
        switch (self.getServiceType()) {
            case TC.Consts.layerType.WMS:
                if (layer.capabilities && layer.capabilities.capability && layer.capabilities.capability.layers) {
                    for (var i = 0; i < layer.capabilities.capability.layers.length; i++) {
                        var lyr = layer.capabilities.capability.layers[i];
                        var name = self.getName(lyr);
                        if (lyr.srs[crs] && name) {
                            result[result.length] = name;
                        }
                    }
                }
                break;
            case TC.Consts.layerType.WMTS:
                var tileMatrixSets = layer.capabilities &&
                    layer.capabilities.contents &&
                    layer.capabilities.contents.tileMatrixSets;
                if (tileMatrixSets) {
                    var crsRegExp = new RegExp('^urn:ogc:def:crs:' + crs.replace(':', ':.*:') + '$', 'g');
                    for (var key in tileMatrixSets) {
                        var supportedCrs = tileMatrixSets[key].supportedCRS;
                        if (supportedCrs && (crsRegExp.test(supportedCrs) || supportedCrs === crs)) {
                            result[result.length] = key;
                        }
                    }
                }
                break;
            default:
                break;
        }
        return result;
    };

    TC.wrap.layer.Raster.prototype.createWMSLayer = function (url, params, options) {
        var self = this;
        var result = new OpenLayers.Layer.WMS(
            (options && options.id) ? options.id : params.LAYERS,
            url,
            params,
            {
                isBaseLayer: (options && options.isBase) == true,
                singleTile: true,
                transitionEffect: 'resize',
                projection: self.parent.crs,
                units: 'm',
                ratio: TC.Cfg.imageRatio
            }
        );
        result._wrap = self;

        if (!params.LAYERS.length) {
            result.setVisibility(false);
        }

        self.addCommonEvents(result);

        result._originalGetURL = result.getURL;
        result._noGetURL = function () { return TC.Consts.BLANK_IMAGE }; // imagen en blanco
        result.getURL = result.params.LAYERS.length > 0 ? result._originalGetURL : result._noGetURL;

        return result;
    };

    TC.wrap.layer.Raster.prototype.createWMTSLayer = function (options) {
        var result = new OpenLayers.Format.WMTSCapabilities().createLayer(
                this.parent.capabilities,
                {
                    isBaseLayer: (options && options.isBase) == true,
                    name: (options && options.id) ? options.id : TC.Consts.layerType.WMTS,
                    matrixSet: options.matrixSet,
                    layer: options.layerNames,
                    requestEncoding: options.encoding === TC.Consts.WMTSEncoding.RESTFUL ? 'REST' : 'KVP'
                });
        result._wrap = self;

        this.addCommonEvents(result);
        return result;
    };

    /*
     *  getParams: Gets the WMS layer getmap parameters
     *  Returns: object
     */
    TC.wrap.layer.Raster.prototype.getParams = function () {
        return this.layer.params;
    };

    /*
     *  setParams: Sets the WMS layer getmap parameters
     *  Parameter: object
     */
    TC.wrap.layer.Raster.prototype.setParams = function (params) {
        var self = this;
        self.layer.getURL = params.LAYERS.length > 0 ? self.layer._originalGetURL : self.layer._noGetURL;
        self.layer.mergeNewParams(params);
    };

    TC.wrap.layer.Raster.prototype.setMatrixSet = function (matrixSet) {
    };

    TC.wrap.layer.Raster.prototype.getResolutions = function () {
        return [];
    };

    TC.wrap.layer.Raster.prototype.getCompatibleMatrixSets = function () {
        return [];
    };

    TC.wrap.layer.Raster.prototype.setWMTSUrl = function () {
        
    };

    TC.wrap.Geometry = {
        getNearest: function (point, candidates) {
            var pline = new OpenLayers.Geometry.LineString($.map(candidates, function (coord) {
                return new OpenLayers.Geometry.Point(coord[0], coord[1]);
            }));
            var d = pline.distanceTo(new OpenLayers.Geometry.Point(point[0], point[1]), { details: true });
            return [d.x0, d.y0];
        }
    };

    TC.wrap.layer.Vector.prototype.createVectorLayer = function () {
        var self = this;
        var result = null;
        var options = $.extend({}, TC.Cfg, self.parent.options);

        var defaultStyle = OpenLayers.Feature.Vector.style['default'];
        var getStyle = function (attribute, feature) {
            var geometryType = OpenLayers.Style.prototype.getSymbolizerPrefix(feature.geometry).toLowerCase();
            return (options.styles[geometryType] && options.styles[geometryType][attribute]) || defaultStyle[attribute];
        };
        var customStyle = {
            strokeColor: '${getStrokeColor}',
            strokeWidth: '${getStrokeWidth}',
            strokeOpacity: '${getStrokeOpacity}',
            fillColor: '${getFillColor}',
            fillOpacity: '${getFillOpacity}',
            strokeLinecap: '${getStrokeLinecap}',
            strokeDashstyle: '${getStrokeDashstyle}'
        };
        var context = {
            getStrokeColor: function (feature) {
                return getStyle('strokeColor', feature);
            },
            getStrokeWidth: function (feature) {
                return getStyle('strokeWidth', feature);
            },
            getStrokeOpacity: function (feature) {
                return getStyle('strokeOpacity', feature);
            },
            getStrokeLinecap: function (feature) {
                return getStyle('strokeLinecap', feature);
            },
            getStrokeDashstyle: function (feature) {
                return getStyle('strokeDashstyle', feature);
            },
            getFillColor: function (feature) {
                return getStyle('fillColor', feature);
            },
            getFillOpacity: function (feature) {
                return getStyle('fillOpacity', feature);
            }
        };
        var getValue = function (property) {
            var result = property;
            if ($.isFunction(property)) {
                var functionName = 'f' + TC.getUID();
                context[functionName] = property;
                result = '${' + functionName + '}';
            }
            return result;
        };

        if (options.styles.point) {
            customStyle.pointRadius = getValue(options.styles.point.radius);
            customStyle.graphic = options.styles.point.graphic;
            customStyle.label = getValue(options.styles.point.label);
            customStyle.fontColor = getValue(options.styles.point.fontColor);
            customStyle.fontSize = getValue(options.styles.point.fontSize);
            customStyle.fontWeight = getValue(options.styles.point.fontWeight);
            customStyle.angle = getValue(options.styles.point.angle);
        }
        var style = new OpenLayers.StyleMap({
            'default': new OpenLayers.Style($.extend({}, defaultStyle, customStyle),
            {
                context: context
            })
        });

        var vectorOptions = { styleMap: style, projection: TC.Cfg.crs };

        if (options.isLabeling)
            vectorOptions.renderers = [OpenLayers.Class(OpenLayers.Renderer.SVG, {
                drawText: function (featureId, style, location) {
                    var drawOutline = (!!style.labelOutlineWidth);
                    if (drawOutline) {
                        var outlineStyle = OpenLayers.Util.extend({}, style);
                        outlineStyle.fontColor = getValue(outlineStyle.labelOutlineColor);
                        outlineStyle.fontStrokeColor = getValue(outlineStyle.labelOutlineColor);
                        outlineStyle.fontStrokeWidth = getValue(style.labelOutlineWidth);
                        if (style.labelOutlineOpacity) {
                            outlineStyle.fontOpacity = getValue(style.labelOutlineOpacity);
                        }
                        delete outlineStyle.labelOutlineWidth;
                        this.drawText(featureId, outlineStyle, location);
                    }

                    var resolution = this.getResolution();

                    var x = ((location.x - this.featureDx) / resolution + this.left);
                    var y = (location.y / resolution - this.top);

                    var suffix = (drawOutline) ? this.LABEL_OUTLINE_SUFFIX : this.LABEL_ID_SUFFIX;
                    var label = this.nodeFactory(featureId + suffix, "text");

                    label.setAttributeNS(null, "x", x);
                    label.setAttributeNS(null, "y", -y);

                    if (style.angle || style.angle == 0) {
                        var rotate = 'rotate(-' + style.angle + ',' + x + "," + -y + ')';
                        label.setAttributeNS(null, "transform", rotate);
                    }

                    if (style.fontColor) {
                        label.setAttributeNS(null, "fill", style.fontColor);
                    }
                    if (style.fontStrokeColor) {
                        label.setAttributeNS(null, "stroke", style.fontStrokeColor);
                    }
                    if (style.fontStrokeWidth) {
                        label.setAttributeNS(null, "stroke-width", style.fontStrokeWidth);
                    }
                    if (style.fontOpacity) {
                        label.setAttributeNS(null, "opacity", style.fontOpacity);
                    }
                    if (style.fontFamily) {
                        label.setAttributeNS(null, "font-family", style.fontFamily);
                    }
                    if (style.fontSize) {
                        label.setAttributeNS(null, "font-size", style.fontSize);
                    }
                    if (style.fontWeight) {
                        label.setAttributeNS(null, "font-weight", style.fontWeight);
                    }
                    if (style.fontStyle) {
                        label.setAttributeNS(null, "font-style", style.fontStyle);
                    }
                    if (style.labelSelect === true) {
                        label.setAttributeNS(null, "pointer-events", "visible");
                        label._featureId = featureId;
                    } else {
                        label.setAttributeNS(null, "pointer-events", "none");
                    }
                    var align = style.labelAlign || OpenLayers.Renderer.defaultSymbolizer.labelAlign;
                    label.setAttributeNS(null, "text-anchor",
                        OpenLayers.Renderer.SVG.LABEL_ALIGN[align[0]] || "middle");

                    if (OpenLayers.IS_GECKO === true) {
                        label.setAttributeNS(null, "dominant-baseline",
                            OpenLayers.Renderer.SVG.LABEL_ALIGN[align[1]] || "central");
                    }

                    var labelRows = style.label.split('\n');
                    var numRows = labelRows.length;
                    while (label.childNodes.length > numRows) {
                        label.removeChild(label.lastChild);
                    }
                    for (var i = 0; i < numRows; i++) {
                        var tspan = this.nodeFactory(featureId + suffix + "_tspan_" + i, "tspan");
                        if (style.labelSelect === true) {
                            tspan._featureId = featureId;
                            tspan._geometry = location;
                            tspan._geometryClass = location.CLASS_NAME;
                        }
                        if (OpenLayers.IS_GECKO === false) {
                            tspan.setAttributeNS(null, "baseline-shift",
                                OpenLayers.Renderer.SVG.LABEL_VSHIFT[align[1]] || "-35%");
                        }
                        tspan.setAttribute("x", x);
                        if (i == 0) {
                            var vfactor = OpenLayers.Renderer.SVG.LABEL_VFACTOR[align[1]];
                            if (vfactor == null) {
                                vfactor = -.5;
                            }
                            tspan.setAttribute("dy", (vfactor * (numRows - 1)) + "em");
                        } else {
                            tspan.setAttribute("dy", "1em");
                        }
                        tspan.textContent = (labelRows[i] === '') ? ' ' : labelRows[i];
                        if (!tspan.parentNode) {
                            label.appendChild(tspan);
                        }
                    }

                    if (!label.parentNode) {
                        this.textRoot.appendChild(label);
                    }
                },
                CLASS_NAME: "OpenLayers.Control.CustomSVG"
            })];

        var fixedStrategy = new OpenLayers.Strategy.Fixed();
        if (self.parent.type === TC.Consts.layerType.KML) {
            vectorOptions.strategies = [fixedStrategy];
            vectorOptions.protocol = new OpenLayers.Protocol.HTTP({
                url: TC.proxify(options.url),
                format: new OpenLayers.Format.KML({
                    extractStyles: true,
                    extractAttributes: true,
                    parseFolders: true,
                    internalProjection: new OpenLayers.Projection(TC.Cfg.crs),
                    externalProjection: new OpenLayers.Projection('EPSG:4326')
                })
            });
        }
        else if (options.type === TC.Consts.layerType.WFS) {

            var _createFilter = function (object) {
                var result;
                var filters = [];
                for (var key in object) {
                    var property = object[key];
                    var type, value;
                    var filter;
                    if (property.type) {
                        type = property.type;
                        value = property.value;
                        var f = new OpenLayers.Filter.Comparison({
                            type: type,
                            property: key,
                            value: value
                        });
                        if (property.ignoreHyphens) {
                            f = [
                                f,
                                new OpenLayers.Filter.Comparison({
                                    type: type,
                                    property: key,
                                    value: value.replace(/-/g, '')
                                })
                            ];
                            filter = new OpenLayers.Filter.Logical({
                                type: OpenLayers.Filter.Logical.OR,
                                filters: f
                            });
                        }
                        else {
                            filter = f;
                        }
                    }
                    else {
                        type = OpenLayers.Filter.Comparison.EQUAL_TO;
                        value = property;
                        filter = new OpenLayers.Filter.Comparison({
                            type: type,
                            property: key,
                            value: value
                        });
                    }
                    filters.push(filter);
                }
                switch (filters.length) {
                    case 0:
                        result = null;
                        break;
                    case 1:
                        result = filters[0];
                        break;
                    default:
                        result = new OpenLayers.Filter.Logical({
                            type: OpenLayers.Filter.Logical.AND,
                            filters: filters
                        });
                        break;
                }
                return result;
            };

            var filterObject = {};
            if (options.properties) {
                for (var i = 0; i < options.properties.length; i++) {
                    var property = options.properties[i];
                    if (property.name && property.type) {
                        filterObject[property.name] = { value: property.value || '', type: property.type, ignoreHyphens: property.ignoreHyphens };
                    }
                    else {
                        filterObject[property] = '';
                    }
                }
            }

            vectorOptions.strategies = [fixedStrategy];
            vectorOptions.protocol = new OpenLayers.Protocol.WFS({
                url: options.url,
                version: options.version,
                featureType: options.featureType,
                geometryName: options.geometryName,
                featurePrefix: options.namespace,
                outputFormat: options.outputFormat,
                srsName: TC.Cfg.crs
            });
            vectorOptions.filter = _createFilter(filterObject);
        }

        // Si hay clustering se añade una estrategia especial
        if (options.cluster) {
            if (!$.isArray(vectorOptions.strategies)) {
                vectorOptions.strategies = [];
            }
            vectorOptions.strategies.push(new OpenLayers.Strategy.Cluster({
                distance: options.cluster.distance
            }));
        }
        result = new OpenLayers.Layer.Vector('Vectors', vectorOptions);
        result._wrap = self;

        this.addCommonEvents(result);

        result.events.register('beforefeaturesadded', null, function () {
            self.parent.map.$events.trigger($.Event(TC.Consts.event.BEFOREFEATURESADD, { layer: self.parent }));
        });

        result.events.register('featuresadded', null, function (e) {
            var markers = [];
            var polylines = [];
            var polygons = [];

            for (var i = 0; i < e.features.length; i++) {
                var olFeat = e.features[i];
                if (!olFeat._wrap) { // Solo actuar si no es una feature añadida desde la API
                    if (olFeat.geometry instanceof OpenLayers.Geometry.Point) {
                        markers[markers.length] = olFeat;
                    }
                    else {
                        if (olFeat.geometry instanceof OpenLayers.Geometry.LineString || olFeat.geometry instanceof OpenLayers.Geometry.MultiLineString) {
                            polylines[polylines.length] = olFeat;
                        }
                        else if (olFeat.geometry instanceof OpenLayers.Geometry.Polygon || olFeat.geometry instanceof OpenLayers.Geometry.MultiPolygon) {
                            polygons[polygons.length] = olFeat;
                        }
                    }
                }
            }

            var deferreds = [];
            if (markers.length > 0) {
                deferreds.push(self.parent.addMarkers(markers));
            }
            if (polylines.length > 0) {
                deferreds.push(self.parent.addPolylines(polylines));
            }
            if (polygons.length > 0) {
                deferreds.push(self.parent.addPolygons(polygons));
            }
            $.when.apply(self, deferreds).then(function () {
                var features = [];
                if (arguments.length) {
                    for (var i = 0; i < arguments[0].length; i++) {
                        var feat = features[i] = arguments[0][i];
                        if ($.isArray(feat.wrap.feature.cluster)) {
                            feat.features = $.map(feat.wrap.feature.cluster, function (elm) {
                                return new feat.constructor(elm);
                            });
                        }
                    }
                }
                self.parent.map.$events.trigger($.Event(TC.Consts.event.FEATURESADD, { layer: self.parent, features: features }));
            });
        });

        result.events.register('featureremoved', null, function (e) {
            var olFeat = e.feature;
            if (olFeat._wrap) {
                var idx = $.inArray(olFeat._wrap.parent, self.parent.features);
                if (idx > -1) {
                    self.parent.features.splice(idx, 1);
                    self.parent.map.$events.trigger($.Event(TC.Consts.event.FEATUREREMOVE, { layer: self.parent, feature: olFeat._wrap.parent }));
                }
            }
        });

        var $map = $(self.parent.map);

        result.events.register('featuresadded', null, function () {
            self.parent.map.$events.trigger($.Event(TC.Consts.event.VECTORUPDATE, { layer: self.parent }));
        });

        result.events.register('featuresremoved', null, function () {
            self.parent.map.$events.trigger($.Event(TC.Consts.event.VECTORUPDATE, { layer: self.parent }));
        });

        // En KML activar después de añadir todos los gestores de eventos. En WFS se activa con getFeature.
        // También definir el título de la capa a partir del nombre del documento o del archivo.
        if (self.parent.type === TC.Consts.layerType.KML) {
            result.events.register('added', null, function () {
                fixedStrategy.activate();
            });
            if (!self.parent.options.title) {
                var updateTitle = function updateTitle() {
                    if (result.protocol.format._documentName) {
                        self.parent.title = result.protocol.format._documentName;
                    }
                    result.events.unregister('loadend', null, updateTitle);
                };
                result.events.register('loadend', null, updateTitle);
            }
        }

        return result;
    };

    TC.wrap.layer.Vector.prototype.getGetFeatureUrl = function () {
        return null;
    };

    TC.wrap.layer.Vector.prototype.import = function (options) {
        TC.error('TC.wrap.layer.Vector.prototype.import no está soportada con OpenLayers 2');
    };


    TC.wrap.layer.Vector.prototype.addFeatures = function (features) {
        $.when(this.getLayer()).then(function (olLayer) {
            olLayer.addFeatures(features);
        });
    };

    TC.wrap.layer.Vector.prototype.getFeatures = function () {
        var olLayer = this.getLayer();
        if (olLayer instanceof OpenLayers.Layer) {
            if (olLayer.strategies) {
                for (var i = 0; i < olLayer.strategies.length; i++) {
                    var s = olLayer.strategies[i];
                    if (s instanceof OpenLayers.Strategy.Filter) {
                        s.setFilter(s.filter);
                    }
                }
            }
            return olLayer.features;
        }
        else {
            return [];
        }
    };

    TC.wrap.layer.Vector.prototype.getFeatureById = function (id) {
        var olLayer = this.getLayer();
        if (olLayer instanceof OpenLayers.Layer) {
            if (olLayer.strategies) {
                for (var i = 0; i < olLayer.strategies.length; i++) {
                    var s = olLayer.strategies[i];
                    if (s instanceof OpenLayers.Strategy.Filter) {
                        s.setFilter(s.filter);
                    }
                }
            }
            return olLayer.getFeatureById(id);
        }
        else {
            return null;
        }
    };

    TC.wrap.layer.Vector.prototype.removeFeature = function (feature) {
        $.when(this.getLayer()).then(function (olLayer) {
            olLayer.removeFeatures([feature.wrap.feature]);
        });
    };

    TC.wrap.layer.Vector.prototype.clearFeatures = function () {
        $.when(this.getLayer()).then(function (olLayer) {
            olLayer.removeAllFeatures();
        });
    };

    TC.wrap.layer.Vector.prototype.setFeatureVisibility = function (feature, visible) {
        var self = this;

        var idx = $.inArray(feature, self.parent.features);
        if (idx >= 0) {
            if (visible) {
                delete feature.wrap.feature.style.display;
            }
            else {
                feature.wrap.feature.style.display = 'none';
            }
            // Metemos un timeout para que no se llame a redraw en peticiones masivas hasta que se haya acabado
            if (self._redrawTimeout) {
                clearTimeout(self._redrawTimeout);
            }
            self._redrawTimeout = setTimeout(function () {
                $.when(self.getLayer()).then(function (olLayer) {
                    olLayer.redraw();
                    self.parent.map.$events.trigger($.Event(TC.Consts.event.VECTORUPDATE, { layer: self.parent }));
                });
                delete self._redrawTimeout;
            }, 100);
        }
    };

    TC.wrap.layer.Vector.prototype.getRGBA = function (color, opacity) {
        var result = [0, 0, 0, 1];

        if (typeof color === 'string') {
            var componentLength = color.length === 4 ? 1 : 2;
            result[0] = parseInt(color.substr(1, componentLength), 16);
            result[1] = parseInt(color.substr(1 + componentLength, componentLength), 16);
            result[2] = parseInt(color.substr(1 + 2 * componentLength, componentLength), 16);
            if (componentLength === 1) {
                result[0] = result[0] * 17;
                result[1] = result[1] * 17;
                result[2] = result[2] * 17;
            }
            if (opacity !== undefined) {
                result[3] = opacity;
            }
        }
        return result;
    };

    TC.wrap.layer.Vector.prototype.findFeature = function (values) {
        var self = this;

        $.when(self.getLayer()).then(function (olLayer) {
            var filter = olLayer.filter;
            if (filter) {
                if (filter.filters && filter.filters.length <= values.length) {
                    for (var i = 0; i < filter.filters.length; i++) {
                        var subfilter = filter.filters[i];
                        if (subfilter.type === OpenLayers.Filter.Logical.OR) {
                            subfilter.filters[0].value = values[i];
                            subfilter.filters[1].value = values[i].replace('-', '');
                        }
                        else {
                            subfilter.value = values[i];
                        }
                    }
                }
                else {
                    filter.value = values[0];
                }
                olLayer.removeAllFeatures();
                olLayer.setVisibility(true);
                if (!olLayer.strategies[0].active) {
                    olLayer.strategies[0].activate();
                }
                olLayer.refresh();
            }
        });
    };

    TC.wrap.layer.Vector.prototype.sendTransaction = function (inserts, updates, deletes) {
        var result = $.Deferred();
        TC.error('"sendTransaction" no está soportado por la versión OpenLayers 2 de la API SITNA');
        result.reject();
        return result;
    };

    TC.wrap.layer.Vector.prototype.setDraggable = function (draggable, onend, onstart) {
        var self = this;
        $.when(self.parent.map.wrap.getMap(), self.getLayer()).then(function (olMap, olLayer) {
            if (draggable) {
                if (!self._ctl) {
                    var options = {};
                    if ($.isFunction(onend)) {
                        options.onComplete = function (feature, pixel) {
                            onend.call(this, feature._wrap.parent, [pixel.x, pixel.y]);
                        };
                    }
                    if ($.isFunction(onstart)) {
                        options.onStart = function (feature, pixel) {
                            onstart.call(this, feature._wrap.parent, [pixel.x, pixel.y]);
                        };
                    }
                    self._ctl = new OpenLayers.Control.DragFeature(olLayer, options);
                    olMap.addControl(self._ctl);
                }
                self._ctl.activate();
            }
            else if (self._ctl) {
                self._ctl.deactivate();
            }
        });
    };

    TC.wrap.control.Click.prototype.register = function (map) {
        var self = this;
        self._ctl = new OpenLayers.Control();

        $.when(map.wrap.getMap()).then(function (olMap) {
            var trigger = function (e) {
                var lonlat = olMap.getLonLatFromPixel(e.xy);
                self.parent.callback([lonlat.lon, lonlat.lat], [e.xy.x, e.xy.y]);
            };

            self._ctl.handler = new OpenLayers.Handler.Click(
                    this, {
                        'click': trigger
                    }, {
                        'single': true,
                        'double': false,
                        'pixelTolerance': map.options.pixelTolerance,
                        'stopSingle': false,
                        'stopDouble': false
                    }
                );

            olMap.addControl(self._ctl);
        });
    };

    TC.wrap.control.Click.prototype.activate = function () {
        var self = this;
        self._ctl.activate();
    };

    TC.wrap.control.Click.prototype.deactivate = function () {
        var self = this;
        self._ctl.deactivate();
    };

    TC.wrap.control.ScaleBar.prototype.render = function () {
        var self = this;
        if (!self.ctl) {
            self.ctl = new OpenLayers.Control.ScaleLine({ div: self.parent.div, bottomInUnits: '', bottomOutUnits: '' });
        }
        else {
            self.ctl.draw();
        }
    };

    TC.wrap.control.NavBar.prototype.register = function (map) {
        var self = this;
        $.when(map.wrap.getMap()).then(function (olMap) {
            self.zsCtl = new OpenLayers.Control.PanZoomBar({ panIcons: false, zoomWorldIcon: true });
            olMap.addControl(self.zsCtl);

            olMap.events.register('changebaselayer', null, function () {
                self.zsCtl.moveZoomBar();
            });
        });
    };

    TC.wrap.control.NavBar.prototype.refresh = function () {
        // TO DO
    };

    TC.wrap.control.Coordinates.prototype.register = function (map) {
        var self = this;
        var result = new $.Deferred();
        $.when(map.wrap.getMap()).then(function (olMap) {
            var projection = olMap.getProjectionObject();
            if (projection === null) {
                projection = new OpenLayers.Projection(olMap.projection);
            }
            self.parent.crs = projection.getCode();
            self.parent.units = projection.getUnits();
            self.parent.isGeo = map.wrap.isGeo();
            result.resolve();
        });
        return result;
    };

    TC.wrap.control.Coordinates.prototype.onMouseMove = function (e) {
        var self = this;
        $.when(self.parent.map.wrap.getMap()).then(function (olMap) {
            var coords = olMap.getLonLatFromPixel(olMap.events.getMousePosition(e.originalEvent));
            if (coords) {
                if (self.parent.isGeo) {
                    self.parent.latLon = [coords.lat, coords.lon];
                }
                else {
                    self.parent.xy = [coords.lon, coords.lat];
                }
                self.parent.update.apply(self.parent, arguments);
            }
        });
    };

    TC.wrap.control.Geolocation.prototype.register = function (map) {
    };

    TC.wrap.Parser = function () { };

    TC.wrap.Parser.prototype.read = function (data) {
        var result = [];
        var self = this;
        if (self.parser) {
            if (!TC.Feature) {
                TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
            }
            result = $.map(self.parser.read(data), function (feat) {
                return new TC.Feature(null, { id: feat.fid, data: feat.data });
            });
        }
        return result;
    };

    TC.wrap.parser = {
        WFS: function (options) {
            this.parser = new OpenLayers.Format.GML(options);
        },
        JSON: function (options) {
            this.parser = new OpenLayers.Format.GeoJSON(options);
        }
    };
    TC.inherit(TC.wrap.parser.WFS, TC.wrap.Parser);
    TC.inherit(TC.wrap.parser.JSON, TC.wrap.Parser);

    TC.wrap.control.Search.prototype.addEvents = function () {
        var self = this;
        $.when(self.parent.layer.wrap.getLayer()).then(function (olLayer) {
            var map = self.parent.layer.map;
            var radius = map.wrap.isGeo() ? map.options.pointBoundsRadius / TC.Util.getMetersPerDegree(map.getExtent()) : map.options.pointBoundsRadius;
            olLayer.events.register('featuresadded', olLayer, function (e) {
                var bounds = e.features[0].geometry.getBounds();
                for (var i = 1; i < e.features.length; i++) {
                    bounds.extend(e.features[i].geometry.getBounds());
                }
                if (bounds.left === bounds.right) {
                    bounds.left -= radius;
                    bounds.right += radius;
                }
                if (bounds.top === bounds.bottom) {
                    bounds.bottom -= radius;
                    bounds.top += radius;
                }
                self.parent.layer.map.setExtent(bounds);
            });
        });
    };

    //TC.wrap.control.Measure.prototype.activate = function (mode) {
    //    var self = this;
    //    var handler = mode === TC.Consts.geom.POLYGON ? OpenLayers.Handler.Polygon : OpenLayers.Handler.Path;
    //    if (self.parent.map) {
    //        $.when(self.parent.map.wrap.getMap()).then(function (olMap) {
    //            if (self.control) {
    //                self.control.deactivate();
    //                olMap.removeControl(self.control);
    //            }
    //            if (mode) {
    //                var measureHandler = function (e) {
    //                    var type = e.type === 'measurepartial' ? TC.Consts.event.MEASUREPARTIAL : TC.Consts.event.MEASURE;
    //                    var data = { units: e.units };
    //                    if (e.order === 1) {
    //                        data.length = e.measure;
    //                    }
    //                    else if (e.order === 2) {
    //                        data.area = e.measure;
    //                        data.perimeter = self.control.getLength(e.geometry, e.units);
    //                    }
    //                    self.parent.$events.trigger($.Event(type, data));
    //                };
    //                self.control = new OpenLayers.Control.Measure(handler,
    //                    {
    //                        geodesic: true,
    //                        persist: true,
    //                        immediate: true
    //                    }
    //                );

    //                self.control.handler.callbacks.point = function (point) {
    //                    self.parent.$events.trigger($.Event(TC.Consts.event.POINT, { point: [point.x, point.y] }));
    //                };
    //                self.control.events.on({
    //                    "measure": measureHandler,
    //                    "measurepartial": measureHandler
    //                });

    //                olMap.addControl(self.control);
    //                self.control.activate();
    //                //self.control.handler._originalLayer = self.control.handler.layer;
    //                //self.control.handler.layer = layer.wrap.layer;
    //            }
    //        });
    //    }
    //};

    //TC.wrap.control.Measure.prototype.deactivate = function () {
    //    var self = this;
    //    if (self.control) {
    //        //self.control.handler.layer = self.control.handler._originalLayer;
    //        self.control.deactivate();
    //    }
    //};

    //TC.wrap.control.Measure.prototype.undo = function () {
    //    var self = this;
    //    var result = false;
    //    if (self.control && self.control.handler) {
    //        result = self.control.handler.undo();
    //    }
    //    return result;
    //};

    //TC.wrap.control.Measure.prototype.redo = function () {
    //    var self = this;
    //    var result = false;
    //    if (self.control && self.control.handler) {
    //        result = self.control.handler.redo();
    //    }
    //    return result;
    //};

    //TC.wrap.control.Measure.prototype.end = function () {
    //    var self = this;
    //    if (self.control && self.control.handler) {
    //        self.control.handler.finishGeometry();
    //        if (self.control.handler.layer) {
    //            self.control.handler.layer.redraw();
    //        }
    //    }
    //};

    TC.wrap.control.NavBar.prototype.setInitialExtent = function (extent) {
    };

    TC.wrap.control.OverviewMap.prototype.register = function (map) {
        var self = this;

        var getSize = function () {
            var result = new OpenLayers.Size(self.parent._$div.width(), self.parent._$div.height());
            if (result.w === 0) {
                result.w = 100;
            }
            if (result.h === 0) {
                result.h = 100;
            }
            return result;
        };
        var size = getSize();
        $.when(self.parent.layer.wrap.getLayer()).then(function (olLayer) {
            self.ovMap = new OpenLayers.Control.OverviewMap({
                div: self.parent.div,
                size: size,
                layers: [olLayer],
                minRatio: 24,
                maxRatio: 48,
                autoPan: true,
                theme: OpenLayers.CustomTheme,
                mapOptions: {
                    projection: map.crs,
                    displayProjection: map.crs,
                    baseLayer: olLayer,
                    maxExtent: map.maxExtent,
                    minRatio: 24,
                    maxRatio: 48,
                    minRectSize: 30,
                    theme: OpenLayers.CustomTheme
                },
                maximized: true
            });

            var $load = $(self.parent.div).find('.' + self.parent.CLASS + '-load');
            olLayer.events.register('loadstart', self.parent.layer, function () {
                $load.removeClass(TC.Consts.classes.HIDDEN).addClass(TC.Consts.classes.VISIBLE);
            });
            olLayer.events.register('loadend', self.parent.layer, function () {
                $load.removeClass(TC.Consts.classes.VISIBLE).addClass(TC.Consts.classes.HIDDEN);
            });

            $.when(map.wrap.getMap()).then(function (olMap) {
                olMap.addControl(self.ovMap);

                self.parent.isLoaded = true;
                self.parent.$events.trigger($.Event(TC.Consts.event.MAPLOAD));

                olMap.events.register('updatesize', self.parent, function () {
                    var size = getSize();
                    if (self.ovMap.ovmap) {
                        $ovmap = $(self.ovMap.ovmap.div);
                        $ovmap.css('width', self.parent._$div.css('width')).css('height', self.parent._$div.css('height'));
                        self.ovMap.ovmap.updateSize();
                        self.ovMap.updateRectToMap();
                    }
                });
            });
        });
    };

    TC.wrap.control.OverviewMap.prototype.reset = function () {
        TC.error('TC.wrap.control.OverviewMap.prototype.reset no implementado en OpenLayers 2');
    };

    TC.wrap.control.OverviewMap.prototype.get3DCameraLayer = function () {
        TC.error('TC.wrap.control.OverviewMap.prototype.get3DCameraLayer no implementado en OpenLayers 2');
    };

    TC.wrap.control.OverviewMap.prototype.draw3DCamera = function (options) {
        TC.error('TC.wrap.control.OverviewMap.prototype.draw3DCamera no implementado en OpenLayers 2');
    };

    TC.wrap.control.OverviewMap.prototype.enable = function () {
        var self = this;
        self.ovMap.activate();
        self.ovMap.update();
    };

    TC.wrap.control.OverviewMap.prototype.disable = function () {
        this.ovMap.deactivate();
    };

    TC.wrap.control.FeatureInfo.prototype.register = function (map) {
        var self = this;

        self._map = map;

        $.when(map.wrap.getMap()).then(function (olMap) {

            TC.wrap.control.Click.prototype.register.call(self, map);

            var layers = [];

            var isSuitableLayer = function (layer) {
                var result = false;
                if (layer instanceof TC.layer.Raster && !layer.isBase) {
                    if (layer.wrap.getInfoFormats()) {
                        result = true;
                    }
                }
                return result;
            };
            for (var i = 0; i < map.workLayers.length; i++) {
                var layer = map.workLayers[i];
                if (isSuitableLayer(layer)) {
                    layers.push(layer.wrap.layer);
                }
            }

            self._gfi = new OpenLayers.Control.WMSGetFeatureInfo({
                layers: layers,
                autoActivate: false,
                drillDown: true,
                maxFeatures: 1000,
                queryVisible: true,
                output: 'object',
                formatOptions: {
                    internalProjection: olMap.projection
                }
            });
            if (map.options.pixelTolerance) {
                self._gfi.vendorParams = { radius: map.options.pixelTolerance, buffer: map.options.pixelTolerance };
            }
            olMap.addControl(self._gfi);

            map.on(TC.Consts.event.LAYERADD, function (e) {
                if (isSuitableLayer(e.layer)) {
                    self._gfi.layers.push(e.layer.wrap.layer);
                }
            }).on(TC.Consts.event.LAYERREMOVE, function (e) {
                var idx = $.inArray(e.layer.wrap.layer, self._gfi.layers);
                if (idx >= 0) {
                    self._gfi.layers.splice(idx, 1);
                }
            });

            var gfiLayers = {};

            self._gfi.events.register('beforegetfeatureinfo', self.parent, function (e) {
                // Obtenemos las capas implicadas
                for (var i = 0; i < e.object.layers.length; i++) {
                    for (var j = 0; j < map.workLayers.length; j++) {
                        if (map.workLayers[j].wrap.layer === e.object.layers[i]) {
                            gfiLayers[e.object.layers[i].url] = map.workLayers[j];
                        }
                    }
                }
                var lonLat = map.wrap.map.getLonLatFromPixel(e.xy);
                self.parent.beforeRequest({
                    xy: [e.xy.x, e.xy.y]
                });
            });

            self._gfi.events.register('getfeatureinfo', self.parent, function (e) {

                var featureCount = 0;
                var featurePromises = [];
                var featureInsertionPoints = [];

                // Feature parser
                var targetServices = [];
                var targetService;

                for (var i = 0; i < e.features.length; i++) {
                    var sourceService = e.features[i];
                    targetService = { layers: [], text: e.text };
                    var layer = gfiLayers[sourceService.url];
                    if (layer) {
                        targetService.mapLayer = layer;
                        delete gfiLayers[sourceService.url];
                    }
                    for (var j = 0; j < sourceService.features.length; j++) {
                        var sourceFeature = sourceService.features[j];
                        var layerName = sourceFeature.fid ? sourceFeature.fid.substr(0, sourceFeature.fid.lastIndexOf('.')) : sourceFeature.type || '';
                        var layerTitle = targetService.mapLayer ? targetService.mapLayer.wrap.getInfo(layerName).title || layerName : '[Sin título]';
                        var targetLayer = null;
                        for (var k = 0; k < targetService.layers.length; k++) {
                            if (targetService.layers[k].name === layerName) {
                                targetLayer = targetService.layers[k];
                                break;
                            }
                        }
                        if (!targetLayer) {
                            targetLayer = { name: layerName, title: layerTitle, features: [] };
                            targetService.layers.push(targetLayer);
                        }
                        featurePromises.push(TC.wrap.Feature.createFeature(sourceFeature));
                        featureInsertionPoints.push(targetLayer.features);
                        featureCount = featureCount + 1;
                    }

                    if (!sourceService.features.length) {
                        contentType = e.request.getResponseHeader('Content-Type');
                        if (contentType.indexOf('text/') === 0) {
                            // No hay features porque no hay respuesta parseable, metemos la respuesta en un iframe.
                            targetLayer = { name: layerName, title: layerTitle, features: [] };
                            targetService.layers.push(targetLayer);
                            //console.log(self._gfi.buildWMSOptions(layer, e.xy));
                            targetLayer.features.push({ rawUrl: e.request._object.responseURL, rawContent: e.text });
                            featureCount = featureCount + 1;
                        }
                    }


                    targetServices.push(targetService);
                }

                $.when.apply(this, featurePromises).then(function () {
                    if (arguments.length) {
                        for (var i = 0; i < arguments.length; i++) {
                            var feat = arguments[i];
                            feat.attributes = [];
                            for (var key in feat.data) {
                                feat.attributes.push({ name: key, value: feat.data[key] });
                            }
                            featureInsertionPoints[i].push(feat);
                        }
                    }
                    var lonLat = map.wrap.map.getLonLatFromPixel(e.xy);
                    self.parent.responseCallback({ coords: [lonLat.lon, lonLat.lat], resolution: self._gfi._resolution, services: targetServices, featureCount: featureCount });
                });

            });

            self._gfi.events.register('exception', self.parent, function (e) {
                self.parent.responseError({ status: e.request.status, message: e.request.responseText });
            });
        });
    };

    TC.wrap.control.FeatureInfo.prototype.getFeatureInfo = function (coords, resolution) {
        var self = this;

        if (self._map && self._gfi.layers.length > 0) {
            var xy = map.wrap.map.getPixelFromLonLat({ lon: coords[0], lat: coords[1] });
            self._gfi._resolution = resolution;
            self._gfi.getInfoForClick({ xy: { x: xy[0], y: xy[1] } });
        }
    };

    TC.wrap.control.Popup.prototype = function()
    {
        this.popup = null;
    };

    TC.wrap.control.Popup.prototype.fitToView = function ()
    {
        var self = this;
        setTimeout(function () {
            self.popup.updateSize();
        }, 100);
    };

    TC.wrap.control.Popup.prototype.setDragged = function (dragged) {
    };

    TC.wrap.Feature.prototype.getLegend = function () {
        var self = this;
        var result = {};
        var style = self.feature.style;
        if (style.externalGraphic) {
            result.src = style.externalGraphic;
            result.width = style.graphicWidth;
            result.height = style.graphicHeight;
        }
        else {
            if (style.strokeColor) {
                result.strokeColor = style.strokeColor;
            }
            if (style.strokeWidth) {
                result.strokeWidth = style.strokeWidth;
            }
            if (style.fillColor) {
                result.fillColor = style.fillColor;
            }
            if (style.pointRadius) {
                result.height = result.width = style.pointRadius * 2;
            }
            //var $d = $('<div class="tc-ctl-legend-img">');
            //if (style.strokeColor) {
            //    $d.css('border-style', 'solid');
            //    $d.css('border-color', style.strokeColor);
            //}
            //if (style.strokeWidth) {
            //    $d.css('border-width', style.strokeWidth + 'px');
            //}
            //if (style.fillColor) {
            //    $d.css('background-color', style.fillColor);
            //}
            //$d.appendTo($div);
        }
        return result;
    };

    TC.wrap.Feature.prototype.createPoint = function (coords, options) {
        var self = this;
        if ($.isArray(coords)) {
                var styleOptions = {
                    pointRadius: options.radius || (options.height + options.width) / 4
                };
                if (options.fillColor) {
                    styleOptions.fillColor = options.fillColor;
                    styleOptions.fillOpacity = options.fillOpacity;
                }
                else {
                    styleOptions.fill = false;
                }
                if (options.strokeColor) {
                    styleOptions.strokeColor = options.strokeColor;
                    styleOptions.strokeWidth = options.strokeWidth;
                }
                else {
                    styleOptions.stroke = false;
                }
            self.feature = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(coords[0], coords[1]),
                null,
                styleOptions
            );
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            self.parent.geometry = [coords.geometry.x, coords.geometry.y];
            if (coords.style) {
                self.parent.options.radius = coords.style.pointRadius;
                self.parent.options.fillColor = coords.style.fillColor;
                self.parent.options.fillOpacity = coords.style.fillOpacity;
                self.parent.options.strokeColor = coords.style.strokeColor;
            }
        }
        if (options && options.id) {
            self.feature.id = options.id;
        }
        self.feature._wrap = self;
    };

    TC.wrap.Feature.prototype.createMarker = function (coords, options) {
        var self = this;
        var iconUrl = TC.Util.getPointIconUrl(options);
        if (iconUrl) {
            if ($.isArray(coords)) {
                var styleOptions = {
                        externalGraphic: TC.Util.getPointIconUrl(options),
                        graphicWidth: options.width,
                        graphicHeight: options.height,
                        graphicXOffset: -Math.round(options.anchor[0] * options.width),
                        graphicYOffset: -Math.round(options.anchor[1] * options.height)
                    };
                self.feature = new OpenLayers.Feature.Vector(
                    new OpenLayers.Geometry.Point(coords[0], coords[1]),
                    null,
                    styleOptions
                );
            }
            else if (self.isNative(coords)) {
                self.feature = coords;
                self.parent.geometry = [coords.geometry.x, coords.geometry.y];
                if (coords.style) {
                    self.parent.options.url = coords.style.externalGraphic;
                    self.parent.options.width = coords.style.graphicWidth;
                    self.parent.options.height = coords.style.graphicHeight;
                    self.parent.options.anchor = [-coords.style.graphicXOffset / coords.style.graphicWidth, -coords.style.graphicYOffset / coords.style.graphicHeight];
                }
            }
            if (options && options.id) {
                self.feature.id = options.id;
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
            var points = $.map(coords, function (elm) {
                return new OpenLayers.Geometry.Point(elm[0], elm[1]);
            });
            self.feature = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.LineString(points),
                null,
                {
                    stroke: true,
                    strokeColor: options.strokeColor,
                    strokeWidth: options.strokeWidth
                }
            );
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            var g = self.parent.geometry = coords.geometry.getVertices();
            for (var i = 0; i < g.length; i++) {
                g[i] = [g[i].x, g[i].y];
            }
            if (coords.style) {
                self.parent.options.strokeColor = coords.style.strokeColor;
                self.parent.options.strokeWidth = coords.style.strokeWidth;
            }
        }
        self.feature._wrap = self;
    };

    TC.wrap.Feature.prototype.createPolygon = function (coords, options) {
        var self = this;

        if ($.isArray(coords)) {
            var _getRing = function (points) {
                return new OpenLayers.Geometry.LinearRing($.map(points, function (elm) {
                    return new OpenLayers.Geometry.Point(elm[0], elm[1]);
                }));
            };
            var rings;
            if (coords.length > 0 && $.isArray(coords[0]) && coords[0].length > 0 && $.isArray(coords[0][0])) {
                // several rings
                rings = new Array(coords.length)
                for (var i = 0, len = coords.length; i < len; i++) {
                    rings[i] = _getRing(coords[i]);
                }
            }
            else {
                rings = [_getRing(coords)];
            }

            self.feature = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Polygon(rings),
                null,
                {
                    stroke: true,
                    strokeColor: options.strokeColor,
                    strokeWidth: options.strokeWidth,
                    fillColor: options.fillColor,
                    fillOpacity: options.fillOpacity
                }
            );
        }
        else if (self.isNative(coords)) {
            self.feature = coords;
            if (coords.geometry) {
                var g = self.parent.geometry = coords.geometry.getVertices();
                for (var i = 0; i < g.length; i++) {
                    g[i] = [g[i].x, g[i].y];
                }
            }
            if (coords.style) {
                self.parent.options.strokeColor = coords.style.strokeColor;
                self.parent.options.strokeWidth = coords.style.strokeWidth;
                self.parent.options.fillColor = coords.style.fillColor;
                self.parent.options.fillOpacity = coords.style.fillOpacity;
            }
        }
        self.feature._wrap = self;
    };

    TC.wrap.Feature.prototype.createCircle = function (coords, options) {
    };

    TC.wrap.Feature.createFeature = function (olFeat) {
        var result = new $.Deferred();
        var constructor;
        var condition;
        var options = {
            id: olFeat.fid,
            data: olFeat.attributes
        };
        if (olFeat.geometry instanceof OpenLayers.Geometry.Point) {
            TC.loadJS(
                !TC.feature || (TC.feature && !TC.feature.Point),
                [TC.apiLocation + 'TC/feature/Point'],
                function () {
                    result.resolve(new TC.feature.Point(olFeat, options));
                }
            );
        }
        else {
            if (olFeat.geometry instanceof OpenLayers.Geometry.LineString) {
                TC.loadJS(
                    !TC.feature || (TC.feature && !TC.feature.Polyline),
                    [TC.apiLocation + 'TC/feature/Polyline'],
                    function () {
                        result.resolve(new TC.feature.Polyline(olFeat, options));
                    }
                );
            }
            else {
                if (olFeat.geometry instanceof OpenLayers.Geometry.MultiLineString) {
                    TC.loadJS(
                        !TC.feature || (TC.feature && !TC.feature.MultiPolyline),
                        [TC.apiLocation + 'TC/feature/MultiPolyline'],
                        function () {
                            result.resolve(new TC.feature.MultiPolyline(olFeat, options));
                        }
                    );
                }
                else {
                    if (olFeat.geometry instanceof OpenLayers.Geometry.Polygon) {
                    TC.loadJS(
                        !TC.feature || (TC.feature && !TC.feature.Polygon),
                        [TC.apiLocation + 'TC/feature/Polygon'],
                        function () {
                            result.resolve(new TC.feature.Polygon(olFeat, options));
                        }
                    );
                }
                else {
                        if (olFeat.geometry instanceof OpenLayers.Geometry.MultiPolygon) {
                    TC.loadJS(
                                !TC.feature || (TC.feature && !TC.feature.MultiPolygon),
                                [TC.apiLocation + 'TC/feature/MultiPolygon'],
                                function () {
                                    result.resolve(new TC.feature.MultiPolygon(olFeat, options));
                                }
                            );
                        }
                        else {
                            TC.loadJS(
                        !TC.Feature,
                        [TC.apiLocation + 'TC/Feature'],
                        function () {
                            result.resolve(new TC.Feature(olFeat, options));
                        }
                    );
                }
            }
        }
            }
        }
        return result;
    };

    TC.wrap.Feature.prototype.cloneFeature = function () {
        var self = this;
        return new self.feature.constructor(self.feature.geometry.clone(), self.feature.attributes, self.feature.style);
    };

    TC.wrap.Feature.prototype.getStyle = function () {
        var style = this.feature.style;
        var result = {};
        if (style.fillColor) {
            result.fillColor = style.fillColor;
            result.fillOpacity = style.fillOpacity;
        }
        if (style.strokeColor) {
            result.strokeColor = style.strokeColor;
            result.strokeWidth = style.strokeWidth;
        }
        if (style.externalGraphic) {
            result.url = style.externalGraphic;
            result.anchor = [style.graphicXOffset / style.graphicWidth, style.graphicYOffset / style.graphicHeight];
        }
        if (style.label) {
            result.label = style.label;
            result.labelOffset = [style.labelXOffset, style.labelYOffset];
            result.fontColor = style.fontColor;
            result.labelOutlineColor = style.labelOutlineColor;
            result.labelOutlineWidth = style.labelOutlineWidth;
            result.fontSize = style.fontSize;
        }
        return result;
    };

    TC.wrap.Feature.prototype.getGeometry = function () {
        var result;
        var self = this;
        if (self.feature && self.feature.geometry) {
            var getPoint = function (olPoint) {
                return [olPoint.x, olPoint.y];
            }
            var getVertices = function (olGeom) {
                var result = olGeom.getVertices();
                for (var i = 0, len = result.length; i < len; i++) {
                    result[i] = getPoint(result[i]);
                }
                return result;
            };
            var getPolygon = function (olPolygon) {
                var result = new Array(olPolygon.components.length);
                for (var i = 0, len = olPolygon.components.length; i < len; i++) {
                    result[i] = getVertices(olPolygon.components[i]);
                }
                return result;
            };
            var geom = self.feature.geometry;
            if (geom instanceof OpenLayers.Geometry.Point) {
                result = getPoint(geom);
            }
            else if (geom instanceof OpenLayers.Geometry.LineString) {
                result = getVertices(geom);
            }
            else if (geom instanceof OpenLayers.Geometry.MultiLineString) {
                result = getVertices(geom.components[0]);
            }
            else if (geom instanceof OpenLayers.Geometry.Polygon) {
                result = getPolygon(geom);
            }
            else if (geom instanceof OpenLayers.Geometry.MultiPolygon) {
                result = getPolygon(geom.components[0]);
            }
        }
        return result;
    };

    TC.wrap.Feature.prototype.setGeometry = function (geometry) {
        var result = false;
        var self = this;
        if (self.feature && self.feature.geometry) {
            var geom = self.feature.geometry;
            if (geom instanceof OpenLayers.Geometry.Point) {
                if ($.isArray(geometry) && typeof geometry[0] === 'number' && typeof geometry[1] === 'number') {
                    geom.move(geometry[0] - geom.x, geometry[1] - geom.y);
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
            result = self.feature.fid;
        };
        return result;
    };

    TC.wrap.Feature.prototype.setId = function (id) {
        var self = this;
        if (self.feature) {
            self.feature.fid = id;
        };
    };

    const mapToOLCoords = function (coords) {
        return coords.map(function (coord) {
            return { x: coord[0], y: coord[1] };
        })
    };

    const mapToArrayCoords = function (coords) {
        return coords.map(function (vertex) {
            return [vertex.x, vertex.y];
        })
    };

    TC.wrap.Feature.prototype.getLength = function (options) {
        const self = this;
        options = options || {};

        const geom = self.feature.geometry;
        var coordinates;
        if (geom instanceof OpenLayers.Geometry.Polygon) {
            coordinates = mapToArrayCoords(geom.getVertices());
            if (options.crs) {
                coordinates = TC.Util.reproject(coordinates, self.parent.map.crs, options.crs);
            }
            const ring = new OpenLayers.Geometry.LinearRing(mapToOLCoords(coordinates));
            return ring.getLength();
        }
        else if (geom instanceof OpenLayers.Geometry.LineString) {
            coordinates = mapToArrayCoords(geom.getVertices());
            if (options.crs) {
                coordinates = TC.Util.reproject(coordinates, self.parent.map.crs, options.crs);
            }
            const line = new OpenLayers.Geometry.LineString(mapToOLCoords(coordinates));
            return line.getLength();
        }
    };

    TC.wrap.Feature.prototype.getArea = function (options) {
        const self = this;
        options = options || {};

        const geom = self.feature.geometry;
        var coordinates;
        if (geom instanceof OpenLayers.Geometry.Polygon) {
            coordinates = mapToArrayCoords(geom.getVertices());
            if (options.crs) {
                coordinates = TC.Util.reproject(coordinates, self.parent.map.crs, options.crs);
            }
            const polygon = new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing(mapToOLCoords(coordinates))]);
            return polygon.getArea();
        }
    };

    TC.wrap.Feature.prototype.setStyle = function (options) {
        var self = this;

        var style = self.feature.style || new OpenLayers.Style();

        if (!(options instanceof OpenLayers.Style))
            options = new OpenLayers.Style(options);

        var options = options.createLiterals(OpenLayers.Util.extend({},
            options.defaultStyle), self.feature);

        if (self.feature.geometry instanceof OpenLayers.Geometry.Point) {
            style.externalGraphic = options.url;
            style.graphicWidth = options.width;
            style.graphicHeight = options.height;

            if (options.anchor && options.width)
                style.graphicXOffset = -Math.round(options.anchor[0] * options.width);

            if (options.anchor && options.height)
                style.graphicYOffset = -Math.round(options.anchor[1] * options.height);

            style.graphic = options.graphic;

            if (options.label)
                style.label = options.label.toCamelCase();

            if (options.angle)
                style.angle = options.angle;

            style.fontColor = options.fontColor;
            style.labelOutlineColor = options.labelOutlineColor;
            style.labelOutlineWidth = options.labelOutlineWidth;
        }
        else if (self.feature.geometry.components && self.feature.geometry.components instanceof Array
                        && self.feature.geometry.components[0].CLASS_NAME == (new OpenLayers.Geometry.LineString).CLASS_NAME ||
                 !self.feature.geometry.components && self.feature.geometry instanceof new OpenLayers.Geometry.LineString) {
            style.stroke = true;
            style.strokeColor = options.strokeColor;
            style.strokeWidth = options.strokeWidth;
        }
        else if (self.feature.geometry.components && self.feature.geometry.components instanceof Array
                        && self.feature.geometry.components[0].CLASS_NAME == (new OpenLayers.Geometry.Polygon).CLASS_NAME ||
                 !self.feature.geometry.components && self.feature.geometry instanceof new OpenLayers.Geometry.Polygon) {
            style.stroke = true;
            style.strokeColor = options.strokeColor;
            style.strokeWidth = options.strokeWidth;
            style.fillColor = options.fillColor;
            style.fillOpacity = options.fillOpacity;
        }
        if (self.feature.layer) {
            self.feature.layer.drawFeature(self.feature, style);
        }
    };

    TC.wrap.Feature.prototype.getInnerPoint = function (options) {
        var feature = this.feature;
        var point = feature.geometry.getCentroid(true);
        if (!result.intersects(feature.geometry)) {
            var closest = feature.geometry.distanceTo(result, { details: true });
            point = new OpenLayers.Geometry.Point(closest.x0, closest.y0);
        }
        return [point.x, point.y];
    };

    TC.wrap.Feature.prototype.showPopup = function (popupCtl) {
        var self = this;
        var feature = self.feature;

        // Para IE8: FramedCloud sin modificar
        if (Modernizr.canvas && OpenLayers.Popup.Anchored.prototype.displayClass.indexOf(TC.control.Popup.prototype.CLASS) === -1) {
            OpenLayers.Popup.Anchored.prototype.displayClass = OpenLayers.Popup.Anchored.prototype.displayClass + ' ' + TC.control.Popup.prototype.CLASS + ' ' + TC.Consts.classes.VISIBLE;
        }
        var PopupClass = Modernizr.canvas ? OpenLayers.Popup.Anchored : OpenLayers.Popup.FramedCloud;
        if (!self._innerCentroid) {
            self._innerCentroid = self.getInnerPoint();
        }

        popupCtl.currentFeature = self.parent;
        var map = popupCtl.map;
        if (map) {
            $.when(map.wrap.getMap()).then(function (olMap) {
                if (map.popup) {
                    olMap.removePopup(map.popup.wrap.popup);
                    map.popup.wrap.popup.destroy();
                    delete map.popup.wrap.popup;
                    map.popup = null;
                }
                var html = self.parent.getInfo();
                if (html) {
                    var markerOptions = self.parent.options;
                    var anchor = null;
                    if (Modernizr.canvas && markerOptions.anchor && markerOptions.height) {
                        anchor = {
                            size: new OpenLayers.Size(0, markerOptions.height),
                            offset: new OpenLayers.Pixel(0, -markerOptions.height * markerOptions.anchor[1])
                        };
                    }

                    var popup = new PopupClass(null,
                                    new OpenLayers.LonLat(self._innerCentroid[0], self._innerCentroid[1]),
                                    null,
                                    html,
                                    anchor,
                                    popupCtl.options.closeButton,
                                    function (e) {
                                        this.hide();
                                        OpenLayers.Event.stop(e);
                                        map.$events.trigger($.Event(TC.Consts.event.POPUPHIDE, { control: popupCtl }));
                                    });
                    popup.autoSize = true;
                    popup.panMapIfOutOfView = true;
                    popup.keepInMap = true;
                    popup.maxSize = new OpenLayers.Size(olMap.size.w / 2, olMap.size.h / 2);

                    popupCtl.$popupDiv = $(popup.div);
                    popupCtl.wrap.popup = popup;
                    map.popup = popupCtl;
                    olMap.addPopup(popup);

                    // Para IE8: FramedCloud sin modificar
                    if (Modernizr.canvas) {
                        popupCtl.$popupDiv.css('overflow', '').css('border', '').css('width', '').css('height', '');
                        // Eliminar bug de visualización de Chrome, quitando position:relative.
                        var $content = $(popup.contentDiv).css('position', '');
                        // En OL2 los featureInfo en versión "baraja de cartas" salen sin tamaño.
                        // Para evitar esto, la clase tc-ctl-finfo tiene ancho y alto establecidos.
                        // Pero eso hace que en el popup salgan barras de scroll, porque contentDiv se crea demasiado pequeño.
                        // Rehacemos el tamaño del popup para eliminarlas.
                        popup.updateSize();
                        $content.css('width', '');

                        var $closeBtn = $(popup.groupDiv).find('.olPopupCloseBox').attr('style', '').addClass(popupCtl.CLASS + '-close').attr('title', popupCtl.getLocaleString('close'));
                        if ($closeBtn.length) {
                            $content.css('margin-right', $closeBtn.width());
                        }
                    }
                }
            });
        }
    };

    TC.wrap.Feature.prototype.isNative = function (feature) {
        return feature instanceof OpenLayers.Feature;
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
        if (self.feature && self.feature.geometry) {
            var bounds = self.feature.geometry.getBounds();
            result = [bounds.left, bounds.bottom, bounds.right, bounds.top];
        }
        return result;
    };

    TC.wrap.Feature.prototype.getTemplate = function () {
        var result = null;
        var self = this;
        if (self.feature.style) {
            result = self.feature.style.balloonStyle;
            if (result) {
                result = result.replace(/\$\{(\w+)\}/g, '$$[$1]');
            }
        }
        return result;
    };

    TC.wrap.Feature.prototype.getData = function () {
        var result = $.extend({}, this.feature.attributes);
        for (var key in result) {
            if (result[key].value) {
                result[key] = result[key].value;
            }
        }
        return result;
    };


    TC.wrap.control.Draw.prototype.activate = function (mode) {
        var self = this;
        var handler = mode === TC.Consts.geom.POLYGON ? OpenLayers.Handler.Polygon : OpenLayers.Handler.Path;
        if (self.parent.map) {
            $.when(self.parent.map.wrap.getMap()).then(function (olMap) {
                if (self.control) {
                    self.control.deactivate();
                    olMap.removeControl(self.control);
                }
                if (mode) {
                    var measureHandler = function (e) {
                        var type = e.type === 'measurepartial' ? TC.Consts.event.MEASUREPARTIAL : TC.Consts.event.MEASURE;
                        var data = { units: e.units };
                        if (e.order === 1) {
                            data.length = e.measure;
                        }
                        else if (e.order === 2) {
                            data.area = e.measure;
                            data.perimeter = self.control.getLength(e.geometry, e.units);
                        }
                        if (self.parent.measure) {
                            self.parent.$events.trigger($.Event(type, data));
                        }
                        self.parent.$events.trigger($.Event(TC.Consts.event.DRAWEND, { feature: new TC.feature.Polygon(e.geometry.components) }));

                    };
                    self.control = new OpenLayers.Control.Measure(handler,
                        {
                            geodesic: true,
                            persist: true,
                            immediate: true
                        }
                    );

                    self.control.handler.callbacks.point = function (point) {
                        self.parent.$events.trigger($.Event(TC.Consts.event.POINT, { point: [point.x, point.y] }));
                    };
                    if (self.parent.measure)
                        self.control.events.on({
                            "measure": measureHandler,
                            "measurepartial": measureHandler
                        });
                    else
                        self.control.events.on({
                            "measure": measureHandler
                        });
                    olMap.addControl(self.control);
                    self.control.activate();
                    //self.control.handler._originalLayer = self.control.handler.layer;
                    //self.control.handler.layer = layer.wrap.layer;
                }
            });
        }
    };

    TC.wrap.control.Draw.prototype.deactivate = function () {
        var self = this;
        if (self.control) {
            //self.control.handler.layer = self.control.handler._originalLayer;
            self.control.deactivate();
        }
    };

    TC.wrap.control.Draw.prototype.undo = function () {
        var self = this;
        var result = false;
        if (self.control && self.control.handler) {
            result = self.control.handler.undo();
        }
        return result;
    };

    TC.wrap.control.Draw.prototype.redo = function () {
        var self = this;
        var result = false;
        if (self.control && self.control.handler) {
            result = self.control.handler.redo();
        }
        return result;
    };

    TC.wrap.control.Draw.prototype.end = function () {
        var self = this;
        if (self.control && self.control.handler) {
            self.control.handler.finishGeometry();
            if (self.control.handler.layer) {
                self.control.handler.layer.redraw();
            }
        }
    };

    TC.wrap.control.Draw.prototype.setStyle = function () {
        TC.error('TC.wrap.control.Draw.prototype.setStyle no implementado en OpenLayers 2');
    };

    TC.wrap.control.CacheBuilder.prototype.getRequestSchema = function (extent) {
        return {};
    }

    TC.wrap.control.CacheBuilder.prototype.getGetTilePattern = function (layer) {
        return "";
    }
})();
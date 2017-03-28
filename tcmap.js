/*! async-js descargado de https://www.npmjs.com/package/async-js en 2015-04-23 (Ver https://github.com/th507/asyncJS) */
/**
 * Async JavaScript Loader
 * https://github.com/th507/asyncJS
 *
 * Slightly Deferent JavaScript loader and dependency manager
 *
 * @author Jingwei "John" Liu <liujingwei@gmail.com>
 */

(function (name, context) {
    /*jshint plusplus:false, curly:false, bitwise:false, laxbreak:true*/
    "use strict";

    // some useful shims and variables
    var dataURIPrefix = "data:application/javascript,";

    // do not record return value for asynchronous task
    // if handler is OMITTED
    var OMITTED = "OMITTED";

    // for better compression
    var Document = document;
    var Window = window;
    var ArrayPrototype = Array.prototype;

    // detect Data URI support
    var supportDataURI = true;

    // As much as I love to use a semantic way to
    // detect Data URI support, all the detection
    // methods I could think of are asynchronous,
    // which makes them less reliable when calling
    // asyncJS immediately after its instantiation

    // IE 8 or below does not support Data URI.
    // IE 8 or below returns false
    // http://tanalin.com/en/articles/ie-version-js
    if (Document.all && !Document.addEventListener) {
        supportDataURI = false;
    }

    /**
    * @private
    * @name getCutoffLength
    * Get cut-off length for iteration
    *
    * @param {Array}  arr
    * @param {Number} cutoff
    */
    function getCutoffLength(arr, cutoff) {
        //because AsyncQueue#then could add sync task at any time
        // we must read directly from this.tasks.length
        var length = arr.length;
        if (~cutoff && cutoff < length) length = cutoff;
        return length;
    }

    /**
     * @private
     * @name timeout
     * Run callback in setTimeout
     *
     * @param {Function} fn
     */
    function timeout(fn, s) {
        Window.setTimeout(fn, s || 0);
    }

    /**
     * @private
     * @name immediate
     * Run callback asynchronously (almost immediately)
     *
     * @param {Function} fn
     */
    var immediate = Window.requestAnimationFrame
                || Window.webkitRequestAnimationFrame
                || Window.mozRequestAnimationFrame
                || timeout;

    /**
     * @private
     * @name throwLater
     * Throw Error asynchronously
     *
     * @param {Object}  error
     */
    function throwLater(error) {
        timeout(function () { throw error; });
    }

    /**
     * @private
     * @name isURL
     * Check if str is a URL
     *
     * @param {String} str
     */
    function isURL(str) {
        // supports URL starts with http://, https://, and //
        // or a single line that ends with .js or .php
        return (
            /(^(https?:)?\/\/)|(\.(js|php)$)/.test(str) &&
            !/(\n|\r)/m.test(str)
        );
    }

    /**
     * @private
     * @name isFunction
     * Check if fn is a function
     *
     * @param {Function} fn
     */
    // This is duck typing, aka. guessing
    function isFunction(fn) {
        return fn && fn.constructor && fn.call && fn.apply;
    }

    /**
     * @private
     * @name makeArray
     * Make an array out of given object
     *
     * @param {Object} obj
     */
    function makeArray(obj) {
        var isArray;
        if ((isArray = Array.isArray)) {
            return isArray(obj) ? obj : [obj];
        }
        return ArrayPrototype.concat(obj);
    }

    /**
     * @private
     * @name slice
     * Convert array-like object to array
     *
     * @param {Object} arr
     */
    function slice(arr) {
        return ArrayPrototype.slice.call(arr);
    }

    /**
     * @private
     * @name factory
     * Factory Method producing function
     * that receives reduced arguments
     *
     * @param {Function} fn
     */
    // http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
    var call = Function.call;
    function factory() {
        var defaults = slice(arguments);

        return function () {
            // keep this as simple as possible
            return call.apply(call, defaults.concat(slice(arguments)));
        };
    }

    // end of shims

    /**
     * @private
     * @name resolveScriptEvent
     * Script event handler
     *
     * @param {Object} resolver
     * @param {Object} evt
     */
    function resolveScriptEvent(resolver, evt) {
        /*jshint validthis:true */
        var script = this;

        // run only when ready
        // script.readyState is completed or loaded
        if (script.readyState &&
            !(/^c|loade/.test(script.readyState))
        ) return;

        // never rerun callback
        if (script.loadStatus) return;

        // unbind to avoid rerun
        script.onload = script.onreadystatechange = script.onerror = null;

        script.loadStatus = true;

        if (evt && evt.type === "error") {
            var src = script.src || "Resource",
                fails = " fails to load.";

            // custom error
            // TODO: create a more specific stack for this Error
            var error = {
                name: "ConnectionError",
                source: src,
                evt: evt,
                stack: src + fails,
                message: fails,
                toString: function () {
                    return this.source + this.message;
                }
            };
            throwLater(error);

            resolver.reject(error);
            return;
        }

        resolver.resolve();
    }

    /**
     * @private
     * @name appendScript
     * Append asynchronous script to DOM
     *
     * @param {String|Function} str
     * @param {Object} resolver
     */
    function appendScript(str, resolver) {
        var ScriptTagName = "script";
        var script = Document.createElement(ScriptTagName);

        // at least one script could be found,
        // the one which wraps around asyncJS
        var scripts = Document.getElementsByTagName(ScriptTagName);
        var lastScript = scripts[scripts.length - 1];

        script.async = true;
        script.src = str;

        if (!resolver) return;

        // executes callback if given
        script.loadStatus = false;

        var resolveScript = factory(resolveScriptEvent, script, resolver);

        // onload for all sane browsers
        // onreadystatechange for legacy IE
        script.onload = script.onreadystatechange = script.onerror = resolveScript;

        // inline script tends to change nearby DOM elements
        // so we append script closer to the caller
        // this is at best a ballpark guess and
        // might not work well with some inline script
        var slot = lastScript;

        // in case running from Console
        // we might encounter a scriptless page
        slot = slot || document.body.firstChild;

        slot.parentNode.insertBefore(script, slot);
    }


    /**
     * @private
     * @name loadFunction
     * Loads JS function or script string for
     * browser that does not support Data URI
     *
     * @param {String|Function} js
     * @param {Function} fn
     */
    function loadFunction(js, resolver) {
        immediate(function () {
            try {
                js.call(null, resolver);
            }
            catch (e) {
                resolver.reject(e);
            }
        });
    }

    /**
     * @private
     * @name load
     * Loads one request or executes one chunk of code
     *
     * @param {String|Function} js
     * @param {Function} resolve
     */
    function load(js, resolver) {
        /*jshint newcap:false, evil:true*/
        // js is not a function
        if (!isFunction(js)) {
            if (isURL(js)) {
                appendScript(js, resolver);
                return;
            }
            if (supportDataURI) {
                // wraps up inline JavaScript into external script
                js = dataURIPrefix + encodeURIComponent(js);
                appendScript(js, resolver);
                return;
            }
        }

        var fn = isFunction(js) ? js : Function(js);

        // a synchronous function is wrapped into a special function
        // so that we could use the same logic as an asynchronous function
        if (!resolver.async) {
            var task = fn;
            fn = function (resolver) {
                try {
                    task.call(null);
                    resolver.resolve();
                }
                catch (e) {
                    resolver.reject(e);
                }
            };
        }

        loadFunction(fn, resolver);
    }

    /**
     * @public
     * @name AsyncQueue
     * Create a semi-Promise for asyncJS
     * @constructor
     *
     * @param {Array|String|Function} tasks
     * @param {Function} fn
     */
    function AsyncQueue(tasks, fn) {
        // better compression for shrinking `this`
        var self = this;

        // TODO: exposing this is not safe
        self.tasks = [];
        self.callbacks = [];
        self.errors = [];

        // return values of Promise
        self.data = {};

        // resolved task index
        self.nextTask = 0;

        // resolved callback index
        self.nextCallback = 0;

        // -1 (default) means not waiting for AsyncQueue#then
        self.until = -1;

        // queue is executing callback
        self.digest = false;

        // add tasks and callbacks
        self.add(tasks).whenDone(fn);
    }

    /**
     * @private
     * @name resolveCallback
     * Resolve next asyncJS callback
     */
    function resolveCallback() {
        /*jshint validthis:true*/
        var self = this;

        // if current digestion circle is still active
        // then try again later
        if (self.digest) {
            timeout(factory(resolveCallback, self), 50 / 3);
            return;
        }

        self.digest = true;

        var fn, next, i = self.nextCallback;

        // always update length for next iteration
        for (; i < getCutoffLength(self.callbacks, self.until) ; i++) {
            if (self.nextTask !== self.tasks.length) continue;

            next = self.nextCallback;

            fn = self.callbacks[next];

            if (fn) {
                self.nextCallback = i + 1;

                // passing in current taskIndex
                fn.call(null, self.data, self.nextTask - 1, self.errors);

                // if callback is not to generated function
                // then it would advance to the next iteration
                if (!fn.untilThen) continue;

                // reduce nextCallback count
                self.nextCallback--;

                // release iteration lock
                self.until = -1;
            }

            // remove invalid or untilThen function
            self.callbacks.splice(next, 1);
        }

        self.digest = false;
    }

    /**
     * @private
     * @name nextTick
     * Advance to next tick in the queue
     * For AsyncQueue#reject or AsyncQueue#resolve
     *
     * @param {String} handle
     * @param {Object} data
     */
    function nextTick() {
        /*jshint validthis:true*/
        var self = this;

        // never resolve when tasks are finished
        if (self.nextTask < self.tasks.length) {
            // if tasks are still queueing
            // increment nextTask
            if (++self.nextTask !== self.tasks.length) return self;
        }

        // check callbacks if all tasks are finished
        resolveCallback.call(self);
        return self;
    }

    /**
     * @private
     * @name resolve
     * Resolve next asyncJS queue
     * Normally, you never have to call this
     *
     * @param {String} handle
     * @param {Object} data
     */
    AsyncQueue.prototype.resolve = function (handle, data) {
        /*jshint validthis:true*/
        var self = this;

        // save data if available and necessary
        if (handle && handle !== OMITTED) self.data[handle] = data;

        return nextTick.call(self);
    };

    /**
     * @private
     * @name reject
     * Reject and continue next asyncJS queue
     *
     * @param {Object} error
     */
    AsyncQueue.prototype.reject = function (error) {
        /*jshint validthis:true*/
        var self = this;

        if (error) {
            throwLater(error);

            self.errors.push(error);
        }

        // keep executing other stacked tasks
        return nextTick.call(self);
    };

    /**
     * @public
     * @name AsyncQueue#whenDone
     * Attach extra callback to next asyncJS queue
     *
     * @param {Function} fn
     */
    AsyncQueue.prototype.whenDone = function (fn) {
        // save a few bytes
        var self = this;
        if (!fn) return self;

        // tasks undone
        if (self.nextTask > self.tasks.length) return self;

        // add callback function
        self.callbacks.push(fn);

        // try resolve
        if (self.nextTask === self.tasks.length) self.resolve();

        return self;
    };

    /**
     * @public
     * @name AsyncQueue#add
     * Add tasks to next asyncJS queue
     *
     * @param {Array|String|Function} tasks
     */
    AsyncQueue.prototype.add = function (tasks, handle) {
        var self = this;
        if (!tasks) return self;

        // warn user if returned data could overwrite
        // existing data, without stopping further execution
        if (handle && self[handle]) {
            var error = new Error("Callback value name: " + handle + " is registered");

            throwLater(error);
            self.errors.push(error);
        }

        tasks = makeArray(tasks);

        var resolver = {
            resolve: factory(self.resolve, self, handle),
            reject: self.reject,
            async: !!handle
        };

        for (var i = 0, fn; i < tasks.length; i++) {
            fn = tasks[i];
            if (!fn) continue;

            // this is just for future reference
            self.tasks.push(fn);

            // resolve function
            load(fn, self);
        }

        return self;
    };

    /**
     * @public
     * @name AsyncQueue#then
     * Add a SINGLE dependent task to next asyncJS queue
     * which blocks all following callbacks
     * until this task is finished
     *
     * @param {Array|String|Function} task
     */
    AsyncQueue.prototype.then = function (task, handle) {
        var self = this;

        if (!task) return self;

        // if there are still tasks unfinished
        // add new tasks when this function
        // that has a `untilthen` property
        function addDependent() {
            // when `resolveCallback` sees the
            // property, it will stop executing
            // all other callbacks until it is done
            self.until = self.nextCallback;

            self.add(task, handle);
        }

        addDependent.untilThen = true;

        return self.whenDone(addDependent);
    };

    /**
     * @public
     * @name asyncJS
     * Loads multiple requests or executes inline code
     *
     * @param {String|Array} js
     * @param {Function} fn
     *
     * @return {Object} asyncJS queue
     */
    function asyncJS(js, fn) {
        return new AsyncQueue(js, fn);
    }

    // export asyncJS
    /*jshint node:true*/
    /*global define*/
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = asyncJS;
    }
    else if (typeof define === "function" && define.amd) {
        define(function () { return asyncJS; });
    }
    else {
        context[name] = asyncJS;
    }
}("asyncJS", this));



var TC = TC || {};
/*
 * Initialization
 */
TC.version = '1.2.1';
(function () {
    if (!TC.apiLocation) {
        var src;
        var script;
        if (document.currentScript) {
            script = document.currentScript;
        }
        else {
            var scripts = document.getElementsByTagName('script');
            script = scripts[scripts.length - 1];
        }
        var src = script.getAttribute('src');
        TC.apiLocation = src.substr(0, src.lastIndexOf('/') + 1);
    }
})();

if (!TC.Consts) {
    TC.Consts = {};
    TC.Consts.OLNS_LEGACY = 'OpenLayers';
    TC.Consts.OLNS = 'ol';
    TC.Consts.PROJ4JSOBJ_LEGACY = 'Proj4js';
    TC.Consts.PROJ4JSOBJ = 'proj4';
    TC.Consts.GEOGRAPHIC = 'geographic';
    TC.Consts.UTM = 'UTM';
    TC.Consts.OLD_BROWSER_ALERT = 'TC.oldBrowserAlert';
    TC.Consts.CLUSTER_ANIMATION_DURATION = 200;
    TC.Consts.ZOOM_ANIMATION_DURATION = 300;
    TC.Consts.URL_MAX_LENGTH = 2048;
    TC.Consts.METER_PRECISION = 0;
    TC.Consts.DEGREE_PRECISION = 5;
    TC.Consts.url = {
        SPLIT_REGEX: /([^:]*:)?\/\/([^:]*:?[^@]*@)?([^:\/\?]*):?([^\/\?]*)/,
        MODERNIZR: 'lib/modernizr.js',
        JQUERY_LEGACY: TC.apiLocation + 'lib/jquery/jquery.1.10.2.js',
        JQUERY: '//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.js',
        OL_LEGACY: 'lib/OpenLayers/OpenLayers.debug.js',
        //OL: 'ol/build/ol-min.js',
        OL: 'lib/ol/build/ol-custom.js',
        OL_CONNECTOR_LEGACY: 'TC/ol/ol2.js',
        OL_CONNECTOR: 'TC/ol/ol3.js',
        TEMPLATING: 'lib/dust/dust-full-helpers.min.js',
        TEMPLATING_I18N: 'lib/dust/dustjs-i18n.min.js',
        PROJ4JS_LEGACY: 'lib/proj4js/legacy/proj4js-compressed.js',
        PROJ4JS: 'lib/proj4js/proj4-src.js',
        SPATIALREFERENCE: 'http://spatialreference.org/',
        LOCALFORAGE: TC.apiLocation + 'lib/localForage/localforage.min.js',
        D3C3: TC.apiLocation + 'lib/d3c3/d3c3.min.js',
        CESIUM: TC.apiLocation + 'lib/cesium/debug/Cesium.js',
        JSNLOG: 'lib/jsnlog/jsnlog.min.js',
        ERROR_LOGGER: TC.apiLocation + 'errors/logger.ashx',
        PDFMAKE: TC.apiLocation + 'lib/pdfmake/pdfmake-fonts.min.js',
        JSONPACK: 'lib/jsonpack/jsonpack.min.js',
    };
    TC.Consts.classes = {
        MAP: 'tc-map',
        POINT: 'tc-point',
        MARKER: 'tc-marker',
        VISIBLE: 'tc-visible',
        HIDDEN: 'tc-hidden',
        COLLAPSED: 'tc-collapsed',
        CHECKED: 'tc-checked',
        DISABLED: 'tc-disabled',
        ACTIVE: 'tc-active',
        LASTCHILD: 'tc-lastchild',
        TRANSPARENT: 'tc-transparent',
        DROP: 'tc-drop',
        LOADING: 'tc-loading',
        IPAD_IOS7_FIX: 'tc-ipad-ios7-fix',
        INFO: 'tc-msg-info',
        WARNING: 'tc-msg-warning',
        ERROR: 'tc-msg-error'
    };
    TC.Consts.msgType = {
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error'
    };
    TC.Consts.msgErrorMode = {
        TOAST: 'toast',
        CONSOLE: 'console',
        EMAIL: 'email'
    };
    TC.Consts.event = {
        /**
         * Se lanza cuando el mapa ha cargado todas sus capas iniciales y todos sus controles
         * @event mapload
         */
        MAPLOAD: 'mapload.tc',
        MAPREADY: 'mapready.tc',
        BEFORELAYERADD: 'beforelayeradd.tc',
        LAYERADD: 'layeradd.tc',
        LAYERREMOVE: 'layerremove.tc',
        LAYERORDER: 'layerorder.tc',
        BEFORELAYERUPDATE: 'beforelayerupdate.tc',
        LAYERUPDATE: 'layerupdate.tc',
        LAYERERROR: 'layererror.tc',
        BEFOREBASELAYERCHANGE: 'beforebaselayerchange.tc',
        BASELAYERCHANGE: 'baselayerchange.tc',        
        BEFOREUPDATE: 'beforeupdate.tc',
        UPDATE: 'update.tc',
        BEFOREZOOM: 'beforezoom.tc',
        ZOOM: 'zoom.tc',
        BEFOREUPDATEPARAMS: 'beforeupdateparams.tc',
        UPDATEPARAMS: 'updateparams.tc',
        VECTORUPDATE: 'vectorupdate.tc',
        FEATUREADD: 'featureadd.tc',
        BEFOREFEATURESADD: 'beforefeaturesadd.tc',
        FEATURESADD: 'featuresadd.tc',
        FEATUREREMOVE: 'featureremove.tc',
        FEATURESIMPORT: 'featuresimport.tc',
        FEATURESIMPORTERROR: 'featuresimporterror.tc',
        BEFORETILELOAD: 'beforetileload.tc',
        TILELOAD: 'tileload.tc',
        CONTROLACTIVATE: 'controlactivate.tc',
        CONTROLDEACTIVATE: 'controldeactivate.tc',
        BEFORECONTROLRENDER: 'beforecontrolrender.tc',
        CONTROLRENDER: 'controlrender.tc',
        BEFORELAYOUTLOAD: 'beforelayoutload.tc',
        LAYOUTLOAD: 'layoutload.tc',
        LAYERVISIBILITY: 'layervisibility.tc',
        LAYEROPACITY: 'layeropacity.tc',
        FEATURECLICK: 'featureclick.tc',
        NOFEATURECLICK: 'nofeatureclick.tc',
        BEFOREFEATUREINFO: 'beforefeatureinfo.tc',
        FEATUREINFO: 'featureinfo.tc',
        NOFEATUREINFO: 'nofeatureinfo.tc',
        FEATUREINFOERROR: 'featureinfoerror.tc',
        CLICK: 'click.tc',
        MOUSEUP: 'mouseup.tc',
        STARTLOADING: 'startloading.tc',
        STOPLOADING: 'stoploading.tc',
        EXTERNALSERVICEADDED: 'externalserviceadded.tc'
    };
    TC.Consts.layer = {
        IDENA_ORTHOPHOTO: 'ortofoto',
        IDENA_BASEMAP: 'mapabase',
        IDENA_CADASTER: 'catastro',
        IDENA_CARTO: 'cartografia',
        IDENA_ORTHOPHOTO2012: 'ortofoto2012',
        IDENA_DYNBASEMAP: 'mapabase_dinamico',
        IDENA_BW_RELIEF: 'relieve_bn',
        IDENA_BASEMAP_ORTHOPHOTO: 'base_orto',
        BLANK: 'ninguno'
    };
    TC.Consts.text = {
        API_ERROR: 'Error API SITNA',
        APP_ERROR: 'Error de aplicación'
    };
    /**
     * Colección de identificadores de tipo de capa.
     * No se deberían modificar las propiedades de esta clase.
     * @class TC.consts.LayerType
     * @static
     */
    /**
     * Identificador de capa de tipo WMS.
     * @property WMS
     * @type string
     * @final
     */
    /**
     * Identificador de capa de tipo WMTS.
     * @property WMTS
     * @type string
     * @final
     */
    /**
     * Identificador de capa de tipo WFS.
     * @property WFS
     * @type string
     * @final
     */
    /**
     * Identificador de capa de tipo KML.
     * @property KML
     * @type string
     * @final
     */
    /**
     * Identificador de capa de tipo GPX.
     * @property GPX
     * @type string
     * @final
     */
    /**
     * Identificador de capa de tipo vectorial. Este tipo de capa es la que se utiliza para dibujar marcadores.
     * @property VECTOR
     * @type string
     * @final
     */
    /**
     * Identificador de capa de grupo.
     * @property GROUP
     * @type string
     * @final
     */
    TC.Consts.layerType = {
        WMS: 'WMS',
        WMTS: 'WMTS',
        WFS: 'WFS',
        VECTOR: 'vector',
        KML: 'KML',
        GPX: 'GPX',
        GEOJSON: 'GeoJSON',
        GROUP: 'group'
    };
    TC.Consts.geom = {
        POINT: 'point',
        MULTIPOINT: 'multipoint',
        POLYLINE: 'polyline',
        POLYGON: 'polygon',
        MULTIPOLYLINE: 'multipolyline',
        MULTIPOLYGON: 'multipolygon',
        CIRCLE: 'circle',
        RECTANGLE: 'rectangle'
    };
    TC.Consts.searchType = {
        CADASTRAL: 'cadastral',
        COORDINATES: 'coordinates',
        MUNICIPALITY: 'municipality',
        COUNCIL: 'council',
        LOCALITY: 'locality',
        STREET: 'street',
        NUMBER: 'number',
        URBAN: 'urban',
        COMMONWEALTH: 'commonwealth'
    };
    TC.Consts.mapSearchType = {
    	MUNICIPALITY: TC.Consts.searchType.MUNICIPALITY,
    	COUNCIL: TC.Consts.searchType.COUNCIL,
    	URBAN: TC.Consts.searchType.URBAN,
    	COMMONWEALTH: TC.Consts.searchType.COMMONWEALTH,
    	GENERIC: 'generic'
    };
    TC.Consts.comparison = {
        EQUAL_TO: '=='
    };
    TC.Consts.WMTSEncoding = {
        KVP: 'KVP',
        RESTFUL: 'RESTful'
    };
    TC.Consts.mimeType = {
        PNG: 'image/png',
        JPEG: 'image/jpeg',
        JSON: 'application/json',
        KML: 'application/vnd.google-earth.kml+xml',
        GML: 'application/gml+xml',
        XML: 'application/xml'
    };
    TC.Consts.format = {
        JSON: 'JSON',
        KML: 'KML',
        GML: 'GML',
        GML2: 'GML2',
        GML3: 'GML2',
        GEOJSON: 'GeoJSON',
        TOPOJSON: 'TopoJSON',
        GPX: 'GPX',
        WKT: 'WKT'
};
    /**
     * Colección de identificadores de estados de visibilidad.
     * No se deberían modificar las propiedades de esta clase.
     * @class TC.consts.Visibility
     * @static
     */
    /**
     * Identificador de nodo no visible.
     * @property NOT_VISIBLE
     * @type number
     * @final
     */
    /**
     * Identificador de nodo no visible a la resolución actual.
     * @property NOT_VISIBLE_AT_RESOLUTION
     * @type number
     * @final
     */
    /**
     * Identificador de nodo no visible pero que tiene nodos hijos visibles.
     * @property HAS_VISIBLE
     * @type number
     * @final
     */
    /**
     * Identificador de nodo visible.
     * @property VISIBLE
     * @type number
     * @final
     */
    TC.Consts.visibility = {
        NOT_VISIBLE: 0,
        NOT_VISIBLE_AT_RESOLUTION: 1,
        HAS_VISIBLE: 2,
        VISIBLE: 4
    };

    TC.Consts.MARKER = 'marker';

    TC.Defaults = (function () {

        var clusterRadii = {};
        var getClusterRadius = function (feature) {
            var count = feature.features.length;
            var result = clusterRadii[count];
            if (!result) {
                result = Math.round(Math.sqrt(count) * 15);
                clusterRadii[count] = result;
            }
            return result;
        };

        var clusterFillColors = {};
        var getClusterFillColor = function (feature) {
            var count = feature.features.length;
            var result = clusterFillColors[count];
            if (!result) {
                var r = Math.round(100 + 155 * Math.min(6, count) / 6);
                if (r > 255) r = 255;
                var g = Math.round(255 - 155 * Math.max(0, count - 4) / 6);
                if (g < 100) g = 100;
                var b = 100;
                result = '#' + r.toString(16) + g.toString(16) + b.toString(16);
                clusterFillColors[count] = result;
            }
            return result;
        };

        return {
            imageRatio: 1.05,
            proxy: '',

            crs: 'EPSG:25830',
            utmCrs: 'EPSG:25830',
            geoCrs: 'EPSG:4326',
            initialExtent: [541084.221, 4640788.225, 685574.4632, 4796618.764],
            maxExtent: [480408, 4599748, 742552, 4861892],
            baselayerExtent: [480408, 4599748, 742552, 4861892],
            resolutions: [1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, .5, .25],
            pointBoundsRadius: 30,
            extentMargin: 0.2,
            mouseWheelZoom: true,
            attribution: '<a href="http://sitna.navarra.es/" target="_blank">SITNA</a>',
            oldBrowserAlert: true,
            notifyApplicationErrors: false,
            maxErrorCount: 10,

            locale: 'es_ES',

            screenSize: 20,
            pixelTolerance: 10,

            toastDuration: 5000,

            avgTileSize: 31000,

            availableBaseLayers: [
                {
                    id: TC.Consts.layer.IDENA_BASEMAP,
                    title: 'Mapa base',
                    type: TC.Consts.layerType.WMTS,
                    url: '//idena.navarra.es/ogc/wmts/',
                    matrixSet: 'epsg25830extended',
                    layerNames: 'mapabase',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/png',
                    isDefault: true,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-basemap.png'
                },
                {
                    id: TC.Consts.layer.IDENA_ORTHOPHOTO,
                    title: 'Ortofoto 2014',
                    type: TC.Consts.layerType.WMTS,
                    url: '//idena.navarra.es/ogc/wmts/',
                    matrixSet: 'epsg25830reduced',
                    layerNames: 'ortofoto2014',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-orthophoto.jpg'
                },
                {
                    id: TC.Consts.layer.IDENA_ORTHOPHOTO2012,
                    title: 'Ortofoto 2012',
                    type: TC.Consts.layerType.WMTS,
                    url: '//idena.navarra.es/ogc/wmts/',
                    matrixSet: 'epsg25830',
                    layerNames: 'ortofoto2012',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-ortho2012.jpg'
                },
                {
                    id: TC.Consts.layer.IDENA_CADASTER,
                    title: 'Catastro',
                    type: TC.Consts.layerType.WMS,
                    url: '//idena.navarra.es/ogc/wms',
                    layerNames: 'catastro,regionesFronterizas',
                    format: 'image/png',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-cadaster.png'
                },
                {
                    id: TC.Consts.layer.IDENA_CARTO,
                    title: 'Cartografía topográfica',
                    type: TC.Consts.layerType.WMS,
                    url: '//idena.navarra.es/ogc/wms',
                    layerNames: 'IDENA:cartografia_topografica',
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-carto.png'
                },
                {
                    id: TC.Consts.layer.IDENA_BW_RELIEF,
                    title: 'Relieve',
                    type: TC.Consts.layerType.WMS,
                    url: '//idena.navarra.es/ogc/wms',
                    layerNames: 'IDENA:mapa_relieve_bn',
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-relief_bw.jpg'
                },
                {
                    id: TC.Consts.layer.IDENA_BASEMAP_ORTHOPHOTO,
                    title: 'Mapa base/ortofoto 2014',
                    type: TC.Consts.layerType.WMS,
                    url: '//idena.navarra.es/ogc/wms',
                    layerNames: 'mapaBase_orto',
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-base_ortho.jpg'
                },
                {
                    id: TC.Consts.layer.IDENA_DYNBASEMAP,
                    title: 'Mapa base',
                    type: TC.Consts.layerType.WMS,
                    url: '//idena.navarra.es/ogc/wms',
                    layerNames: 'mapaBase,regionesFronterizas',
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-basemap.png'
                },
                {
                    id: TC.Consts.layer.BLANK,
                    title: 'Mapa en blanco',
                    type: TC.Consts.layerType.VECTOR
                }
            ],

            baseLayers: [
                TC.Consts.layer.IDENA_BASEMAP,
                TC.Consts.layer.IDENA_ORTHOPHOTO,
                TC.Consts.layer.IDENA_CADASTER,
                TC.Consts.layer.IDENA_CARTO
            ],

            defaultBaseLayer: TC.Consts.layer.IDENA_BASEMAP,

            workLayers: [],

            controls: {
                loadingIndicator: true,
                navBar: false,
                scaleBar: false,
                scale: false,
                scaleSelector: false,
                overviewMap: false,
                basemapSelector: false,
                attribution: true,
                TOC: false,
                coordinates: true,
                legend: false,
                popup: false,
                search: {
                    url: '//idena.navarra.es/ogc/wfs',
                    allowedSearchTypes: {
                        coordinates: {},
                        municipality: {}
                    }
                },
                measure: false,
                streetView: true,
                featureInfo: true
            },

            layout: null,

            styles: {
                point: {
                    fillColor: '#f00',
                    fillOpacity: 0.5,
                    strokeColor: '#f00',
                    strokeWidth: 2,
                    radius: 6
                },
                marker: {
                    classes: [
                        TC.Consts.classes.MARKER + 1,
                        TC.Consts.classes.MARKER + 2,
                        TC.Consts.classes.MARKER + 3,
                        TC.Consts.classes.MARKER + 4,
                        TC.Consts.classes.MARKER + 5
                    ],
                    anchor: [.5, 1],
                    width: 32,
                    height: 32
                },
                line: {
                    strokeColor: '#f00',
                    strokeWidth: 2
                },
                polygon: {
                    strokeColor: '#f00',
                    strokeWidth: 2,
                    fillColor: '#000',
                    fillOpacity: .3
                },
                cluster: {
                    point: {
                        cssClass: '',
                        anchor: [0.5, 0.5],
                        fillColor: getClusterFillColor,
                        fillOpacity: 0.6,
                        width: getClusterRadius,
                        height: getClusterRadius,
                        label: '${features.length}',
                        fontColor: "#000",
                        fontSize: 12
                    }
                },
                selection: {
                    point: {
                        fillColor: '#00f',
                        fillOpacity: 0.5,
                        strokeColor: '#00f',
                        strokeWidth: 2,
                        radius: 6
                    },
                    line: {
                        strokeColor: '#00f',
                        strokeWidth: 2
                    },
                    polygon: {
                        strokeColor: '#00f',
                        strokeWidth: 2,
                        fillColor: '#000',
                        fillOpacity: .3
                    }
                }
            }
        };
    })();

    (function () {
        if (!Array.prototype.map) {
            Array.prototype.map = function (fun /*, thisArg */) {
                "use strict";

                if (this === void 0 || this === null)
                    throw new TypeError();

                var t = Object(this);
                var len = t.length >>> 0;
                if (typeof fun !== "function")
                    throw new TypeError();

                var res = new Array(len);
                var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
                for (var i = 0; i < len; i++) {
                    // NOTE: Absolute correctness would demand Object.defineProperty
                    //       be used.  But this method is fairly new, and failure is
                    //       possible only if Object.prototype or Array.prototype
                    //       has a property |i| (very unlikely), so use a less-correct
                    //       but more portable alternative.
                    if (i in t)
                        res[i] = fun.call(thisArg, t[i], i, t);
                }

                return res;
            };
        }

        /* 
         * proxify: returns cross-origin safe URL
         */
        TC.proxify = function (url) {
            url = $.trim(url);
            var result = url;
            if (TC.Cfg.proxy) {
                var prevent = false;
                if (TC.Cfg.proxyExceptions) {
                    for (var i = 0; i < TC.Cfg.proxyExceptions.length; i++) {
                        if (url.indexOf(TC.Cfg.proxyExceptions[i]) > -1) {
                            prevent = true;
                            break;
                        }
                    }
                }

                if (!prevent && !TC.Util.isSameOrigin(url)) {
                    if (typeof TC.Cfg.proxy == "function") {
                        result = TC.Cfg.proxy(url);
                    } else {
                        result = TC.Cfg.proxy;
                        if (url.substr(0, 4) != "http") result += window.location.protocol;
                        result += encodeURIComponent(url);
                    }
                }
            }
            return result;
        };

        var getHead = function () {
            var result;
            var d = document;
            var ah = d.getElementsByTagName("head");
            if (ah.length === 0) {
                result = d.createElement("head");
                d.documentElement.insertBefore(result, document.body);
            }
            else {
                result = ah[0];
            }
            return result;
        };

        TC.syncLoadJS = function (url) {
            var req = new XMLHttpRequest();
            req.open("GET", url, false); // 'false': synchronous.
            req.send(null);

            var script = document.createElement("script");
            script.type = "text/javascript";
            script.text = req.responseText;
            getHead().appendChild(script);
        };

        if (!window.yepnope) {
            TC.syncLoadJS(TC.apiLocation + TC.Consts.url.MODERNIZR);
        }

        TC.isLegacy = TC.isLegacy || !Modernizr.canvas;

        if (!window.jQuery) {
            if (Modernizr.canvas && !TC.isLegacy) { // > ie8
                TC.syncLoadJS(TC.Consts.url.JQUERY);
            }
            else {
                TC.syncLoadJS(TC.Consts.url.JQUERY_LEGACY);
            }
        }

        TC.isDebug = true;

        // Completamos los datos de versión
        $(document).ready(function () {
            var build;
            var mapLibrary = 'Unknown library';
            var OL2 = 'OpenLayers 2';
            var OL3 = 'OpenLayers 3';
            if (TC.Control) {
                build = 'Compiled';
                if (TC.isLegacy) {
                    if (window.OpenLayers) {
                        mapLibrary = OL2;
                    }
                }
                else {
                    if (window.ol) {
                        mapLibrary = OL3;
                    }
                }
            }
            else {
                build = 'On demand';
                mapLibrary = TC.isLegacy ? OL2 : OL3;
            }
            TC.version = TC.version + ' (' + build + '; ' + mapLibrary + '; @ ' + TC.apiLocation + ')';
        });

        //if (!$.support.cors && window.XDomainRequest) {
        //    // IE8 cross-domain patch
        //    TC.syncLoadJS(TC.proxify(TC.apiLocation + 'lib/jQuery/jquery.xdomainrequest.min.js'));
        //}

        //puede pasar que varios lleguen a pedir el mismo js antes de que se resuelva ninguno
        //en ese caso, me guardo todos los callbacks y los disparo cuando llegue

        //este contiene las URLs de los que ya se han descargado
        TC.downloadedJSs = [];
        //este tiene como claves las urls, y como valor la cola asyncJS que lo gestiona
        TC.requestedJSs = {};
        TC.loadJSInOrder = function (condition, url, callback) {
            TC.loadJS(condition, url, callback, true);
        }
        TC.loadJS = function (condition, url, callback, inOrder) {
            if (arguments.length < 4) inOrder = false;
            var urls = $.isArray(url) ? url : [url];
            //si tiene canvas, es que es un navegador nuevo
            if (Modernizr.canvas) {
                if (condition) {
                    //de las que quiere, ver cuáles ya están descargadas, y cuáles están en proceso
                    var newTasks = [];
                    var pendingTasks = [];
                    var curl;
                    for (var i = 0; i < urls.length; i++) {
                        curl = urls[i];
                        if (!TC.downloadedJSs[curl]) {
                            if (TC.requestedJSs[curl]) pendingTasks.push(curl);
                            else newTasks.push(curl);
                        }
                    }

                    
                    //si ya está todo, no hay que hacer nada
                    if (newTasks.length == 0 && pendingTasks.length == 0) {
                        callback();
                    }
                    //si son todas nuevas (ninguna descargada ni en proceso), caso normal con una nueva cola
                    else if (newTasks.length > 0 && pendingTasks.length == 0) {
                        var q = asyncJS();
                        for (var i = 0; i < newTasks.length; i++)        //para cada una, registro quién se está ocupando
                        {
                            TC.requestedJSs[newTasks[i]] = q;
                        }

                        if (inOrder) {
                            for (var i = 0; i < newTasks.length; i++) {
                                if (i == 0) q.add(newTasks[i]);
                                else q.then(newTasks[i]);
                            }
                        }
                        else
                            q.add(newTasks);


                        q.whenDone(function () {
                            for (var i = 0; i < newTasks.length; i++) {
                                TC.downloadedJSs.push(newTasks[i]);
                                delete TC.requestedJSs[newTasks[i]];
                            }
                            callback();
                        });
                    }
                    //si están todas en proceso
                    //tengo que esperar a que terminen todas las colas que están pendientes
                    //y entonces lanzar el callback
                    else if (newTasks.length == 0 && pendingTasks.length > 0) {
                        var curTask;
                        var n = pendingTasks.length;
                        var done = 0;
                        for (var i = 0; i < pendingTasks.length; i++) {
                            var curTask = pendingTasks[i];
                            var q = TC.requestedJSs[curTask];
                            //no hace falta borrar de las referencias, ni añadir a descargadas, porque ya se ocupará el handler anterior
                            q.whenDone(function (a, b, c) {
                                done++;
                                if (done >= n)      //si es la última
                                {
                                    //console.log("Callback de " + curTask);
                                    callback();
                                }
                            });
                        }
                    }
                    else {
                        //horror
                        //caso mezclado: unas están en proceso, y otras no
                        console.error("Mezcla de tareas en proceso y nuevas!!");
                    }
                }
                else {
                    callback();
                }
            }
            else {
                if (condition) {
                    for (var i = 0; i < urls.length; i++) {
                        TC.syncLoadJS(urls[i]);
                    }
                }
                if (callback) {
                    callback();
                }
            }
        };

        var testCSS = function (url) {
            var result = false;
            for (var i = 0; i < document.styleSheets.length; i++) {
                var href = document.styleSheets[i].href;
                if (href) {
                    var idx = href.indexOf(url);
                    if (idx >= 0 && idx === href.length - url.length) {
                        result = true;
                        break;
                    }
                }
            }
            return result;
        };

        TC.loadCSS = function (url) {
            if (!testCSS(url)) {
                var link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = url;
                getHead().appendChild(link);
            }
        };

        var transformCrsCode = function (crs) {

        };

        TC.loadProjDef = function (crs, syncOrCallback) {
            var epsgPrefix = 'EPSG:';
            var urnPrefix = 'urn:ogc:def:crs:EPSG::';
            var gmlPrefix = 'http://www.opengis.net/gml/srs/epsg.xml#';
            var epsgCode = epsgPrefix + '25830';
            var urnCode = urnPrefix + '25830';
            var gmlCode = gmlPrefix + '25830';

            var getDef;
            if (TC.isLegacy) {
                Proj4js.defs[epsgCode] = '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs';
                Proj4js.defs[urnCode] = Proj4js.defs[epsgCode];
                Proj4js.defs[gmlCode] = Proj4js.defs[epsgCode];
                getDef = function (name) {
                    return Proj4js.defs[name];
                };
            }
            else {
                proj4.defs(epsgCode, '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs');
                proj4.defs(urnCode, proj4.defs(epsgCode));
                proj4.defs(gmlCode, proj4.defs(epsgCode));
                getDef = function (name) {
                    return proj4.defs(name);
                };
            }
            if (!window.Proj4js) {
                window.Proj4js = {
                    Proj: function (code) { return proj4(Proj4js.defs[code]); },
                    defs: proj4.defs,
                    transform: proj4
                };
            }
            var loadDef = function (code) {
                epsgCode = epsgPrefix + code;
                urnCode = urnPrefix + code;
                gmlCode = gmlPrefix + code;
                Proj4js.defs[urnCode] = Proj4js.defs[epsgCode];
                Proj4js.defs[gmlCode] = Proj4js.defs[epsgCode];
                if (!TC.isLegacy) {
                    proj4.defs(epsgCode, Proj4js.defs[epsgCode]);
                    proj4.defs(urnCode, Proj4js.defs[epsgCode]);
                    proj4.defs(gmlCode, Proj4js.defs[epsgCode]);
                }
            };
            if (!getDef(crs)) {
                var idx = crs.lastIndexOf('#');
                if (idx < 0) {
                    idx = crs.lastIndexOf(':');
                }
                var code = crs.substr(idx + 1);
                
                var url = TC.proxify(TC.Consts.url.SPATIALREFERENCE + 'ref/epsg/' + code + '/proj4js/');
                if (typeof syncOrCallback === 'boolean') {
                    if (syncOrCallback) {
                        TC.syncLoadJS(url);
                        loadDef(code);
                    }
                    else {
                        TC.loadJS(true, url);
                    }
                }
                else {
                    TC.loadJS(true, url, function () {
                        loadDef(code);
                        syncOrCallback();
                    });
                }
            }
            else if ($.isFunction(syncOrCallback)) {
                loadDef(code);
                syncOrCallback();
            }
        };

        TC.url = {
            templating: [
                TC.apiLocation + TC.Consts.url.TEMPLATING,
                TC.apiLocation + TC.Consts.url.TEMPLATING_I18N
            ]
        };

        if (TC.isLegacy) {
            TC.url.ol = TC.apiLocation + TC.Consts.url.OL_LEGACY;
            TC.url.olConnector = TC.apiLocation + TC.Consts.url.OL_CONNECTOR_LEGACY;
            TC.url.proj4js = TC.apiLocation + TC.Consts.url.PROJ4JS_LEGACY;
        }
        else {
            TC.url.ol = TC.apiLocation + TC.Consts.url.OL;
            TC.url.olConnector = TC.apiLocation + TC.Consts.url.OL_CONNECTOR;
            TC.url.proj4js = TC.apiLocation + TC.Consts.url.PROJ4JS;
        }

        TC.Cfg = $.extend(true, {}, TC.Defaults, TC.Cfg);

        TC.capabilities = {};

        TC.WFScapabilities = {};

        TC.cache = {};

        TC.inherit = function (childCtor, parentCtor) {
            function tempCtor() {
            };
            tempCtor.prototype = parentCtor.prototype;
            childCtor._super = parentCtor.prototype;
            childCtor.prototype = new tempCtor();
            childCtor.prototype.constructor = childCtor;
        };

        TC.alert = function (text) {
            alert(text);
        };

        TC.prompt = function (text, value, callback) {
            var newValue = prompt(text, value);
            if ($.isFunction(callback)) {
                callback(newValue);
            }
        };

        TC.confirm = function (text, accept, cancel) {
            if (confirm(text)) {
                if ($.isFunction(accept)) {
                    accept();
                }
            }
            else {
                if ($.isFunction(cancel)) {
                    cancel();
                }
            }
        };

        TC.error = function (text) {
            if (window.console) {
                console.error(text);
            }
        };

        /**
         * <p>Objeto base de la API que gestiona eventos.
         * @class TC.Object
         * @constructor
         */
        TC.Object = function () {
            var obj = this;
            /**
             * <p>Propiedad que lanza los eventos en el objeto. Para suscribirse a un evento, utilizar los mecanismos de jQuery.</p>
             * <p>Los métodos {{#crossLink "TC.Object/on:method"}}{{/crossLink}}, {{#crossLink "TC.Object/one:method"}}{{/crossLink}} y {{#crossLink "TC.Object/off:method"}}{{/crossLink}}
             * de <code>TC.Map</code> se mapean a los métodos homónimos de este objeto.
             * @property $events
             * @type jQuery
             */
            obj.$events = $(obj);
        };

        /**
         * Asigna un callback a uno o varios eventos.
         * @method on
         * @chainable
         * @param {string} events Nombre de evento o nombres de evento separados por espacios.
         * @param {function} callback Función a ejecutar.
         * @return {TC.Object}
         */
        TC.Object.prototype.on = function (events, callback) {
            var obj = this;
            obj.$events.on(events, callback);
            return obj;
        };

        /**
         * Asigna un callback a uno o varios eventos. Este se ejecutará a lo sumo una vez por evento.
         * @method one
         * @chainable
         * @param {string} events Nombre de evento o nombres de evento separados por espacios.
         * @param {function} callback Función a ejecutar.
         * @return {TC.Object}
         */
        TC.Object.prototype.one = function (events, callback) {
            var obj = this;
            obj.$events.one(events, callback);
            return obj;
        };

        /**
         * Desasigna un callback o todos los callbacks de uno o varios eventos.
         * @method off
         * @chainable
         * @param {string} events Nombre de evento o nombres de evento separados por espacios.
         * @param {function} [callback] Función a desasignar.
         * @return {TC.Object}
         */
        TC.Object.prototype.off = function (events, callback) {
            var obj = this;
            obj.$events.off(events, callback);
            return obj;
        };

        // OpenLayers connectors
        TC.wrap = {
            Map: function (map) {
                var self = this;
                self.parent = map;
                self.map = null;
                self.mapDeferred = new $.Deferred();
                /*
                 *  wrap.getMap: Gets OpenLayers map or a promise for the OpenLayers map
                 */
                self.getMap = function () {
                    return self.map || self.mapDeferred.promise();
                };
            },
            Layer: function (layer) {
                var self = this;
                self.parent = layer;
                self.layer = null;
                self.layerDeferred = new $.Deferred();
                /*
                 *  getLayer: Gets OpenLayers layer or a promise for the OpenLayers layer
                 */
                self.getLayer = function () {
                    return self.layer || self.layerDeferred.promise();
                };
                /*
                 *  setLayer: Resolves the deferred layer object
                 * Parameter: the OpenLayers layer
                 */
                self.setLayer = function (olLayer) {
                    self.layer = olLayer;
                    if (olLayer) {
                        self.layerDeferred.resolve(olLayer);
                    }
                    else {
                        self.layerDeferred.reject();
                    }
                };
            },
            layer: {
                Raster: function () { TC.wrap.Layer.apply(this, arguments); },
                Vector: function () { TC.wrap.Layer.apply(this, arguments); }
            },
            Control: function (ctl) {
                var self = this;
                self.parent = ctl;
            },
            control: {
                Click: function () { TC.wrap.Control.apply(this, arguments); },
                ScaleBar: function () { TC.wrap.Control.apply(this, arguments); },
                NavBar: function () { TC.wrap.Control.apply(this, arguments); },
                Coordinates: function () { TC.wrap.Control.apply(this, arguments); },
                Search: function () { TC.wrap.Control.apply(this, arguments); },
                Measure: function () { TC.wrap.Control.apply(this, arguments); },
                OverviewMap: function () { TC.wrap.Control.apply(this, arguments); },
                FeatureInfo: function () { TC.wrap.Control.apply(this, arguments); },
                Popup: function () { TC.wrap.Control.apply(this, arguments); },
                PolygonFeatureInfo: function () { TC.wrap.Control.apply(this, arguments); },
                Geolocation: function () { TC.wrap.Control.apply(this, arguments); },
                Draw: function () { TC.wrap.Control.apply(this, arguments); },
                CacheBuilder: function () { TC.wrap.Control.apply(this, arguments); },
                Edit: function () { TC.wrap.Control.apply(this, arguments); }
            },
            Feature: function () { }
        };
        TC.inherit(TC.wrap.layer.Raster, TC.wrap.Layer);
        TC.inherit(TC.wrap.layer.Vector, TC.wrap.Layer);
        TC.inherit(TC.wrap.control.Click, TC.wrap.Control);
        TC.inherit(TC.wrap.control.ScaleBar, TC.wrap.Control);
        TC.inherit(TC.wrap.control.NavBar, TC.wrap.Control);
        TC.inherit(TC.wrap.control.Coordinates, TC.wrap.Control);
        TC.inherit(TC.wrap.control.Measure, TC.wrap.Control);
        TC.inherit(TC.wrap.control.OverviewMap, TC.wrap.Control);
        TC.inherit(TC.wrap.control.Popup, TC.wrap.Control);
        TC.inherit(TC.wrap.control.FeatureInfo, TC.wrap.control.Click);
        TC.inherit(TC.wrap.control.PolygonFeatureInfo, TC.wrap.control.Click);        
        TC.inherit(TC.wrap.control.Geolocation, TC.wrap.Control);
        TC.inherit(TC.wrap.control.Draw, TC.wrap.Control);
        TC.inherit(TC.wrap.control.CacheBuilder, TC.wrap.Control);
        TC.inherit(TC.wrap.control.Edit, TC.wrap.Control);

        TC.loadCSS(TC.apiLocation + 'TC/css/tcmap.css');

        if (!TC.Map) {
            TC.syncLoadJS(TC.apiLocation + 'TC/Map.js');
        }
        if (!TC.Util) {
            TC.syncLoadJS(TC.apiLocation + 'TC/Util.js');
        }

        var uid = 1;
        TC.getUID = function () {
            var result = uid.toString();
            uid = uid + 1;
            return result;
        };

    })();

    (function ($, document) {

        var pluses = /\+/g;
        function raw(s) {
            return s;
        }
        function decoded(s) {
            return decodeURIComponent(s.replace(pluses, ' '));
        }

        $.cookie = function (key, value, options) {

            // key and at least value given, set cookie...
            if (arguments.length > 1 && (!/Object/.test(Object.prototype.toString.call(value)) || value === null)) {
                options = $.extend({}, $.cookie.defaults, options);

                if (value === null) {
                    options.expires = -1;
                }

                if (typeof options.expires === 'number') {
                    var days = options.expires, t = options.expires = new Date();
                    t.setDate(t.getDate() + days);
                }

                value = String(value);

                return (document.cookie = [
                    encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
                    options.expires ? ';expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                    options.path ? ';path=' + options.path : '',
                    options.domain ? ';domain=' + options.domain : '',
                    options.secure ? ';secure' : ''
                ].join(''));
            }

            // key and possibly options given, get cookie...
            options = value || $.cookie.defaults || {};
            var decode = options.raw ? raw : decoded;
            var cookies = document.cookie.split('; ');
            for (var i = 0, parts; (parts = cookies[i] && cookies[i].split('=')) ; i++) {
                if (decode(parts.shift()) === key) {
                    return decode(parts.join('='));
                }
            }
            return null;
        };

        $.cookie.defaults = {};

    })(jQuery, document);
}

$(function () {
    var getBrowser = function () {
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browserName = navigator.appName;
        var fullVersion = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        // In Opera, the true version is after "Opera" or after "Version"
        if ((verOffset = nAgt.indexOf("Opera")) != -1) {
            browserName = "Opera";
            fullVersion = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf("Version")) != -1)
                fullVersion = nAgt.substring(verOffset + 8);
        }
            // In MSIE, the true version is after "MSIE" in userAgent
        else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
            browserName = "Microsoft Internet Explorer";
            fullVersion = nAgt.substring(verOffset + 5);
        }
            // In Chrome, the true version is after "Chrome" 
        else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
            browserName = "Chrome";
            fullVersion = nAgt.substring(verOffset + 7);
        }
            // In Safari, the true version is after "Safari" or after "Version" 
        else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
            browserName = "Safari";
            fullVersion = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf("Version")) != -1)
                fullVersion = nAgt.substring(verOffset + 8);
        }
            // In Firefox, the true version is after "Firefox" 
        else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
            browserName = "Firefox";
            fullVersion = nAgt.substring(verOffset + 8);
        }
            // In most other browsers, "name/version" is at the end of userAgent 
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
                  (verOffset = nAgt.lastIndexOf('/'))) {
            browserName = nAgt.substring(nameOffset, verOffset);
            fullVersion = nAgt.substring(verOffset + 1);
            if (browserName.toLowerCase() == browserName.toUpperCase()) {
                browserName = navigator.appName;
            }
        }
        // trim the fullVersion string at semicolon/space if present
        if ((ix = fullVersion.indexOf(";")) != -1)
            fullVersion = fullVersion.substring(0, ix);
        if ((ix = fullVersion.indexOf(" ")) != -1)
            fullVersion = fullVersion.substring(0, ix);

        majorVersion = parseInt('' + fullVersion, 10);
        if (isNaN(majorVersion)) {
            fullVersion = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        return { name: browserName, version: majorVersion };
    };
    TC.browser = getBrowser();

    if (TC.Cfg.oldBrowserAlert && !Modernizr.mq('only all')) {
        if (!TC.Util.storage.getCookie(TC.Consts.OLD_BROWSER_ALERT)) {
            alert('Con su ' + TC.browser.name + ' ' + TC.browser.version + ' la aplicación no funcionará. Le recomendamos que utilice un navegador más actualizado.');
            TC.Util.storage.setCookie(TC.Consts.OLD_BROWSER_ALERT, 1);
        }
    }

    if (/ip(ad|hone|od)/i.test(navigator.userAgent)) {
        // En iOS, el primer click es un mouseover, por eso usamos touchstart como sustituto.
        TC.Consts.event.CLICK = "touchstart.tc";
    }

    // Gestión de errores
    if (!window.JL) {
        TC.syncLoadJS(TC.apiLocation + TC.Consts.url.JSNLOG);
    }
    JL.defaultAjaxUrl = TC.Consts.url.ERROR_LOGGER;

    window.addEventListener('error', (function () {
        var errorCount = 0;

        var mapObj = $('.' + TC.Consts.classes.MAP).data('map');

        return function (e) {
            var errorMsg = e.message;
            var url = e.filename;
            var lineNumber = e.lineno;
            var column = e.colno;
            var errorObj = e.error;
            var apiError = url.indexOf(TC.apiLocation) > 0;
            // Si notifyApplicationErrors === false solo capturamos los errores de la API
            if ((TC.Cfg.notifyApplicationErrors || apiError) && errorCount < TC.Cfg.maxErrorCount) {
                // Send object with all data to server side log, using severity fatal, 
                // from logger "onerrorLogger"
                var msg = apiError ? TC.Consts.text.API_ERROR : TC.Consts.text.APP_ERROR;
                JL("onerrorLogger").fatalException({
                    "msg": msg,
                    "errorMsg": errorMsg,
                    "url": url,
                    "lineNumber": lineNumber,
                    "column": column,
                    "appUrl": location.href,
                    "prevState": mapObj.getPreviousMapState(),
                    "userAgent": navigator.userAgent
                }, errorObj);
                errorCount++;

               if (!TC.isDebug) {
                    var DEFAULT_CONTACT_EMAIL = "webmaster@itracasa.es";
                    $.when(TC.i18n.loadResources(!TC.i18n[mapObj.options.locale], TC.apiLocation + 'TC/resources/', mapObj.options.locale))
                        .done(function () {
                            TC.error(TC.Util.getLocaleString(mapObj.options.locale, "genericError") + (mapObj.options.contactEmail || DEFAULT_CONTACT_EMAIL), { type: TC.Consts.msgType.ERROR });
                        });
                }
            }
            // Tell browser to run its own error handler as well   
            return false;
        };
    })(), false);
});
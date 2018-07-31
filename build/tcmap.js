/**
 * LoadJS descargado de https://github.com/muicss/loadjs
 * @version 3.5.2
 */
loadjs = function () { var n = function () { }, e = {}, t = {}, r = {}; function c(n, e) { if (n) { var c = r[n]; if (t[n] = e, c) for (; c.length;) c[0](n, e), c.splice(0, 1) } } function i(e, t) { e.call && (e = { success: e }), t.length ? (e.error || n)(t) : (e.success || n)(e) } function o(e, t, r, c) { var i, s, u = document, f = r.async, a = (r.numRetries || 0) + 1, h = r.before || n; c = c || 0, /(^css!|\.css$)/.test(e) ? (i = !0, (s = u.createElement("link")).rel = "stylesheet", s.href = e.replace(/^css!/, "")) : ((s = u.createElement("script")).src = e, s.async = void 0 === f || f), s.onload = s.onerror = s.onbeforeload = function (n) { var u = n.type[0]; if (i && "hideFocus" in s) try { s.sheet.cssText.length || (u = "e") } catch (n) { u = "e" } if ("e" == u && (c += 1) < a) return o(e, t, r, c); t(e, u, n.defaultPrevented) }, !1 !== h(e, s) && u.head.appendChild(s) } function s(n, t, r) { var s, u; if (t && t.trim && (s = t), u = (s ? r : t) || {}, s) { if (s in e) throw "LoadJS"; e[s] = !0 } !function (n, e, t) { var r, c, i = (n = n.push ? n : [n]).length, s = i, u = []; for (r = function (n, t, r) { if ("e" == t && u.push(n), "b" == t) { if (!r) return; u.push(n) } --i || e(u) }, c = 0; c < s; c++) o(n[c], r, t) }(n, function (n) { i(u, n), c(s, n) }, u) } return s.ready = function (n, e) { return function (n, e) { var c, i, o, s = [], u = (n = n.push ? n : [n]).length, f = u; for (c = function (n, t) { t.length && s.push(n), --f || e(s) }; u--;) i = n[u], (o = t[i]) ? c(i, o) : (r[i] = r[i] || []).push(c) }(n, function (n) { i(e, n) }), s }, s.done = function (n) { c(n, []) }, s.reset = function () { e = {}, t = {}, r = {} }, s.isDefined = function (n) { return n in e }, s }();

var TC = TC || {};
/*
 * Initialization
 */
TC.version = '1.5.0';
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
    TC.Consts.EXTENT_TOLERANCE = 0.9998;/*URI: debido al redondeo del extente en el hash se obtiene un nivel de resolución mayor al debido. Con este valor definimos una tolerancia para que use una resolución si es muy muy muy próxima*/
    TC.Consts.url = {
        SPLIT_REGEX: /([^:]*:)?\/\/([^:]*:?[^@]*@)?([^:\/\?]*):?([^\/\?]*)/,
        MODERNIZR: 'lib/modernizr.js',
        JQUERY_LEGACY: TC.apiLocation + 'lib/jquery/jquery.1.10.2.js',
        JQUERY: '//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.js',
        OL_LEGACY: 'lib/OpenLayers/OpenLayers.sitna.js',
        OL: 'lib/ol/build/ol-custom.js',
        OL_CONNECTOR_LEGACY: 'TC/ol/ol2.js',
        OL_CONNECTOR: 'TC/ol/ol.js',
        TEMPLATING: 'lib/dust/dust-full-helpers.min.js',
        TEMPLATING_I18N: 'lib/dust/dustjs-i18n.min.js',
        TEMPLATING_OVERRIDES: 'lib/dust/dust.overrides.js',
        PROJ4JS_LEGACY: 'lib/proj4js/legacy/proj4js-compressed.js',
        PROJ4JS: 'lib/proj4js/proj4-src.js',
        EPSG: 'https://epsg.io/',
        LOCALFORAGE: TC.apiLocation + 'lib/localForage/localforage.min.js',
        D3C3: TC.apiLocation + 'lib/d3c3/d3c3.min.js',
        CESIUM: TC.apiLocation + 'lib/cesium/release/Cesium.js',
        JSNLOG: 'lib/jsnlog/jsnlog.min.js',
        ERROR_LOGGER: TC.apiLocation + 'errors/logger.ashx',
        PDFMAKE: TC.apiLocation + 'lib/pdfmake/pdfmake-fonts.min.js',
        JSONPACK: 'lib/jsonpack/jsonpack.min.js',
        UA_PARSER: 'lib/ua-parser/ua-parser.min.js',
        HASH: 'lib/jshash/md5-min.js',
        URL_POLYFILL: 'lib/polyfill/url.js'
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
        DEFAULT: 'tc-default',
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
        FEATURESCLEAR: 'featuresclear.tc',
        FEATURESIMPORT: 'featuresimport.tc',
        FEATURESIMPORTERROR: 'featuresimporterror.tc',
        BEFORETILELOAD: 'beforetileload.tc',
        TILELOAD: 'tileload.tc',
        TILELOADERROR: 'tileloaderror.tc',
        CONTROLADD: 'controladd.tc',
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
        FEATUREOVER: 'featureover.tc',
        FEATUREOUT: 'featureout.tc',
        BEFOREFEATUREINFO: 'beforefeatureinfo.tc',
        FEATUREINFO: 'featureinfo.tc',
        NOFEATUREINFO: 'nofeatureinfo.tc',
        FEATUREINFOERROR: 'featureinfoerror.tc',
        CLICK: 'click.tc',
        MOUSEUP: 'mouseup.tc',
        MOUSEMOVE: 'mousemove.tc',
        MOUSELEAVE: 'mouseleave.tc',
        STARTLOADING: 'startloading.tc',
        STOPLOADING: 'stoploading.tc',
        EXTERNALSERVICEADDED: 'externalserviceadded.tc',
        ZOOMTO: 'zoomto.tc',
        PROJECTIONCHANGE: 'projectionchange.tc'
    };
    TC.Consts.layer = {
        IDENA_ORTHOPHOTO: 'ortofoto',
        IDENA_BASEMAP: 'mapabase',
        IDENA_CADASTER: 'catastro',
        IDENA_CARTO: 'cartografia',
        IDENA_ORTHOPHOTO2014: 'ortofoto2014',
        IDENA_ORTHOPHOTO2012: 'ortofoto2012',
        IDENA_DYNBASEMAP: 'mapabase_dinamico',
        IDENA_DYNORTHOPHOTO: 'ortofoto_dinamico',
        IDENA_DYNORTHOPHOTO2014: 'ortofoto2014_dinamico',
        IDENA_DYNORTHOPHOTO2012: 'ortofoto2012_dinamico',
        IDENA_DYNCARTO: 'cartografia_dinamico',
        IDENA_BW_RELIEF: 'relieve_bn',
        IDENA_BASEMAP_ORTHOPHOTO: 'base_orto',
        OSM: 'osm',
        CARTO_VOYAGER: 'carto_voyager',
        CARTO_LIGHT: 'carto_light',
        CARTO_DARK: 'carto_dark',
        MAPBOX_STREETS: 'mapbox_streets',
        MAPBOX_SATELLITE: 'mapbox_satellite',
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
        GML: 'GML',
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
        COMMONWEALTH: 'commonwealth',
        ROAD: 'road',
        ROADPK: 'roadpk',
        PLACENAME: 'placename',
        PLACENAMEMUNICIPALITY: 'placenamemunicipality'
    };
    TC.Consts.mapSearchType = {
        MUNICIPALITY: TC.Consts.searchType.MUNICIPALITY,
        COUNCIL: TC.Consts.searchType.COUNCIL,
        URBAN: TC.Consts.searchType.URBAN,
        COMMONWEALTH: TC.Consts.searchType.COMMONWEALTH,
        GENERIC: 'generic'
    };
    TC.Consts.comparison = {
        EQUAL_TO: '==',
        NOT_EQUAL_TO: '!=',
        LESS_THAN: '<',
        GREATER_THAN: '>',
        LESS_THAN_EQUAL_TO: '=<',
        GREATER_THAN_EQUAL_TO: '>=',
        LIKE: 'is'
    };
    TC.Consts.logicalOperator = {
        AND: 'and',
        OR: 'or'
    };
    TC.Consts.WMTSEncoding = {
        KVP: 'KVP',
        RESTFUL: 'RESTful'
    };
    TC.Consts.mimeType = {
        PNG: 'image/png',
        JPEG: 'image/jpeg',
        JSON: 'application/json',
        GEOJSON: 'application/vnd.geo+json',
        KML: 'application/vnd.google-earth.kml+xml',
        GML: 'application/gml+xml',
        GPX: 'application/gpx+xml',
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
    //enumerado de errores y warninqs derivados de descargas, getfeatures
    TC.Consts.WFSErrors = {
        GetFeatureNotAvailable: "GetFeatureNotAvailable",
        LayersNotAvailable: "LayersNotAvailable",
        NoLayers: "NoLayers",
        NoValidLayers: "noValidLayers",
        QueryNotAvailable: "QueryNotAvailable",
        CapabilitiesParseError: "CapabilitiesParseError",
        NumMaxFeatures: "NumMaxFeatures",
        GetCapabilities: "GetCapabilities",
        Indeterminate: "Indeterminate",
        NoFeatures: "NoFeatures"
    }
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
                result = 2 + Math.round(Math.sqrt(count) * 5);
                clusterRadii[count] = result;
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
            maxExtent: false,
            baselayerExtent: [480408, 4599748, 742552, 4861892],
            resolutions: [1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, .5, .25],
            pointBoundsRadius: 30,
            extentMargin: 0.2,
            mouseWheelZoom: true,
            attribution: '<a href="http://sitna.navarra.es/" target="_blank">SITNA</a>',
            oldBrowserAlert: true,
            notifyApplicationErrors: false,
            loggingErrorsEnabled: true,
            maxErrorCount: 10,
            layoutURLParamName: 'layout', // Parámetro donde leer en la URL de la aplicación para cargar un layout.
            titleURLParamName: 'title', // Parámetro donde leer en la URL de la aplicación para cargar un título de mapa, p. e. al imprimir.

            locale: 'es-ES',

            screenSize: 20,
            pixelTolerance: 10, // Used in GFI requests
            maxResolutionError: 0.01, // Max error ratio to consider two resolutions equivalent

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
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-basemap.png',
                    fallbackLayer: TC.Consts.layer.IDENA_DYNBASEMAP
                },
                {
                    id: TC.Consts.layer.IDENA_ORTHOPHOTO,
                    title: 'Ortofoto 2017',
                    type: TC.Consts.layerType.WMTS,
                    url: '//idena.navarra.es/ogc/wmts/',
                    matrixSet: 'epsg25830',
                    layerNames: 'ortofoto2017',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-orthophoto.jpg',
                    fallbackLayer: TC.Consts.layer.IDENA_DYNORTHOPHOTO
                },
                {
                    id: TC.Consts.layer.IDENA_ORTHOPHOTO2014,
                    title: 'Ortofoto 2014',
                    type: TC.Consts.layerType.WMTS,
                    url: '//idena.navarra.es/ogc/wmts/',
                    matrixSet: 'epsg25830reduced',
                    layerNames: 'ortofoto2014',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-ortho2014.jpg',
                    fallbackLayer: TC.Consts.layer.IDENA_DYNORTHOPHOTO2014
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
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-ortho2012.jpg',
                    fallbackLayer: TC.Consts.layer.IDENA_DYNORTHOPHOTO2012
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
                    type: TC.Consts.layerType.WMTS,
                    url: '//idena.navarra.es/ogc/wmts/',
                    matrixSet: 'epsg25830',
                    layerNames: 'mapaTopografico',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/png',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-bta.png',
                    fallbackLayer: TC.Consts.layer.IDENA_DYNCARTO
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
                    title: 'Mapa base/ortofoto',
                    type: TC.Consts.layerType.WMS,
                    url: '//idena.navarra.es/ogc/wms',
                    layerNames: 'mapaBase_orto',
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-base_ortho.png'
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
                    id: TC.Consts.layer.IDENA_DYNORTHOPHOTO,
                    title: 'Ortofoto',
                    type: TC.Consts.layerType.WMS,
                    url: '//idena.navarra.es/ogc/wms',
                    layerNames: 'ortofoto_maxima_actualidad',
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-orthophoto.jpg'
                },
                {
                    id: TC.Consts.layer.IDENA_DYNORTHOPHOTO2014,
                    title: 'Ortofoto 2014',
                    type: TC.Consts.layerType.WMS,
                    url: '//idena.navarra.es/ogc/wms',
                    layerNames: 'ortofoto_5000_2014',
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-ortho2014.jpg'
                },
                {
                    id: TC.Consts.layer.IDENA_DYNORTHOPHOTO2012,
                    title: 'Ortofoto 2012',
                    type: TC.Consts.layerType.WMS,
                    url: '//idena.navarra.es/ogc/wms',
                    layerNames: 'ortofoto_5000_2012',
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-ortho2012.jpg'
                },
                {
                    id: TC.Consts.layer.IDENA_DYNCARTO,
                    title: 'Cartografía topográfica',
                    type: TC.Consts.layerType.WMS,
                    url: '//idena.navarra.es/ogc/wms',
                    layerNames: 'MTNa5_BTA',
                    format: 'image/png',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-bta.png'
                },
                {
                    id: TC.Consts.layer.OSM,
                    title: 'OSM',
                    type: TC.Consts.layerType.WMTS,
                    url: TC.apiLocation + 'wmts/osm/',
                    matrixSet: 'WorldWebMercatorQuad',
                    layerNames: 'osm',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/png',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-osm.png'
                },
                {
                    id: TC.Consts.layer.CARTO_VOYAGER,
                    title: 'CARTO Voyager',
                    type: TC.Consts.layerType.WMTS,
                    url: TC.apiLocation + 'wmts/carto/',
                    matrixSet: 'WorldWebMercatorQuad',
                    layerNames: 'voyager',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/png',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-carto-voyager.png'
                },
                {
                    id: TC.Consts.layer.CARTO_LIGHT,
                    title: 'CARTO light',
                    type: TC.Consts.layerType.WMTS,
                    url: TC.apiLocation + 'wmts/carto/',
                    matrixSet: 'WorldWebMercatorQuad',
                    layerNames: 'light_all',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/png',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-carto-light.png'
                },
                {
                    id: TC.Consts.layer.CARTO_DARK,
                    title: 'CARTO dark',
                    type: TC.Consts.layerType.WMTS,
                    url: TC.apiLocation + 'wmts/carto/',
                    matrixSet: 'WorldWebMercatorQuad',
                    layerNames: 'dark_all',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/png',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-carto-dark.png'
                },
                {
                    id: TC.Consts.layer.MAPBOX_STREETS,
                    title: 'Mapbox Streets',
                    type: TC.Consts.layerType.WMTS,
                    url: TC.apiLocation + 'wmts/mapbox/',
                    matrixSet: 'WorldWebMercatorQuad',
                    layerNames: 'streets',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/png',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-mapbox-streets.png'
                },
                {
                    id: TC.Consts.layer.MAPBOX_SATELLITE,
                    title: 'Mapbox Satellite',
                    type: TC.Consts.layerType.WMTS,
                    url: TC.apiLocation + 'wmts/mapbox/',
                    matrixSet: 'WorldWebMercatorQuad',
                    layerNames: 'satellite',
                    encoding: TC.Consts.WMTSEncoding.RESTFUL,
                    format: 'image/jpeg',
                    isDefault: false,
                    hideTree: true,
                    thumbnail: TC.apiLocation + 'TC/css/img/thumb-mapbox-satellite.jpg'
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
                        municipality: {},
                        urban: {},
                        street: {},
                        number: {},
                        cadastral: {}
                    }
                },
                measure: false,
                streetView: true,
                featureInfo: true
            },

            layout: null,

            styles: {
                point: {
                    fillColor: '#000',
                    fillOpacity: 0.1,
                    strokeColor: '#f00',
                    strokeWidth: 2,
                    radius: 6,
                    labelOutlineWidth: 2,
                    labelOutlineColor: '#fff',
                    labelOffset: [0, -16],
                    fontColor: '#000',
                    fontSize: 10
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
                    height: 32,
                    labelOutlineWidth: 2,
                    labelOutlineColor: '#fff',
                    labelOffset: [0, -32],
                    fontColor: '#000',
                    fontSize: 10
                },
                line: {
                    strokeColor: '#f00',
                    strokeWidth: 2,
                    labelOutlineWidth: 2,
                    labelOutlineColor: '#fff',
                    fontColor: '#000',
                    fontSize: 10
                },
                polygon: {
                    strokeColor: '#f00',
                    strokeWidth: 2,
                    fillColor: '#000',
                    fillOpacity: 0.3,
                    labelOutlineWidth: 2,
                    labelOutlineColor: '#fff',
                    fontColor: '#000',
                    fontSize: 10
                },
                cluster: {
                    point: {
                        fillColor: '#336',
                        fillOpacity: 0.6,
                        radius: getClusterRadius,
                        label: '${features.length}',
                        fontColor: "#fff",
                        fontSize: 9
                    }
                },
                selection: {
                    point: {
                        fillColor: '#00f',
                        fillOpacity: 0.5,
                        strokeColor: '#00f',
                        strokeWidth: 2,
                        radius: 6,
                        labelOutlineWidth: 2,
                        labelOutlineColor: '#fff',
                        labelOffset: [0, -16],
                        fontColor: '#000',
                        fontSize: 10
                    },
                    line: {
                        strokeColor: '#00f',
                        strokeWidth: 2,
                        labelOutlineWidth: 2,
                        labelOutlineColor: '#fff',
                        fontColor: '#000',
                        fontSize: 10
                    },
                    polygon: {
                        strokeColor: '#00f',
                        strokeWidth: 2,
                        fillColor: '#000',
                        fillOpacity: .3,
                        labelOutlineWidth: 2,
                        labelOutlineColor: '#fff',
                        fontColor: '#000',
                        fontSize: 10
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

        if (typeof TC.isDebug != "boolean") {
            TC.isDebug = true;
        };

        var _showLoadFailedError = function (url) {
            var mapObj = $('.' + TC.Consts.classes.MAP).data('map');
            TC.error(
                TC.Util.getLocaleString(mapObj.options.locale, "urlFailedToLoad",
                    { url: url }),
                [TC.Consts.msgErrorMode.TOAST, TC.Consts.msgErrorMode.EMAIL],
                "Error al cargar " + url);
        };

        TC.syncLoadJS = function (url) {
            var _sendRequest = function (url, callbackErrorFn) {
                var req = new XMLHttpRequest();
                req.open("GET", url, false); // 'false': synchronous.
                var result;

                req.onreadystatechange = function (e) {
                    if (req.readyState === 4) {
                        if (req.status === 404) {
                            result = false;
                        } else if (req.status !== 200) {
                            callbackErrorFn();
                            result = false;
                        } else {
                            result = req.responseText;
                        }
                    }
                };

                req.send(null);

                return result;
            };

            if (!/(\.js|\/)$/i.test(url)) { // Si pedimos un archivo sin extensión se la ponemos según el entorno
                url = url + (TC.isDebug ? '.js' : '.min.js');
            }

            var reqResult = _sendRequest(url, function () {
                return _sendRequest(url, function () {
                    _showLoadFailedError(url);
                });
            });

            if (reqResult) {
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.text = reqResult;
                getHead().appendChild(script);
            }
        };

        if (!window.Modernizr) {
            TC.syncLoadJS(TC.apiLocation + TC.Consts.url.MODERNIZR);
        }
        Modernizr.touch = Modernizr.touchevents; // compatibilidad hacia atrás

        TC.isLegacy = TC.isLegacy || !Modernizr.canvas;

        if (!window.jQuery) {
            if (Modernizr.canvas && !TC.isLegacy) { // > ie8
                TC.syncLoadJS(TC.Consts.url.JQUERY);
            }
            else {
                TC.syncLoadJS(TC.Consts.url.JQUERY_LEGACY);
            }
        }

        // Completamos los datos de versión
        $(document).ready(function () {
            var build;
            var mapLibrary = 'Unknown library';
            var OL2 = 'OpenLayers 2';
            var OL = 'OpenLayers 4';
            if (TC.Control) {
                build = 'Compiled';
                if (TC.isLegacy) {
                    if (window.OpenLayers) {
                        mapLibrary = OL2;
                    }
                }
                else {
                    if (window.ol) {
                        mapLibrary = OL;
                    }
                }
            }
            else {
                build = 'On demand';
                mapLibrary = TC.isLegacy ? OL2 : OL;
            }
            TC.version = TC.version + ' (' + build + '; ' + mapLibrary + '; @ ' + TC.apiLocation + ')';
        });

        //if (!$.support.cors && window.XDomainRequest) {
        //    // IE8 cross-domain patch
        //    TC.syncLoadJS(TC.proxify(TC.apiLocation + 'lib/jQuery/jquery.xdomainrequest.min.js'));
        //}


        TC.loadJSInOrder = function (condition, url, callback) {
            TC.loadJS(condition, url, callback, true);
        };

        TC.loadJS = function (condition, url, callback, inOrder) {
            if (arguments.length < 4) {
                inOrder = false;
            }

            var urls = $.isArray(url) ? url : [url];
            urls = urls.map(function (elm) {
                if (!/\.js$/i.test(elm) && elm.indexOf(TC.apiLocation) === 0) { // Si pedimos un archivo sin extensión y es nuestro se la ponemos según el entorno
                    return elm + (TC.isDebug ? '.js' : '.min.js');
                }
                return elm;
            });

            //si tiene canvas, es que es un navegador nuevo
            if (Modernizr.canvas) {
                if (condition) {
                    loadjs(urls, {
                        success: function () {
                            callback();
                        },
                        error: function (pathsNotFound) {
                            _showLoadFailedError(pathsNotFound);
                        },
                        async: !inOrder,
                        numRetries: 1
                    });
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
                loadjs(url, {
                    error: function (pathsNotFound) {
                        _showLoadFailedError(pathsNotFound);
                    },
                    numRetries: 1
                });
            }
        };

        var projectionDataCache = {};

        TC.getProjectionData = function (options) {
            var deferred = $.Deferred();
            options = options || {};
            var code = options.crs.substr(options.crs.indexOf(':') + 1);
            if (parseInt(code) === Number.NaN) {
                // El CRS no está en modo urn o EPSG
                code = options.crs.substr(options.crs.lastIndexOf('/') + 1);
            }
            var projData = projectionDataCache[code];
            if (projData) {
                deferred.resolve(projData);
            }
            else {
                var url = TC.Consts.url.EPSG + '?format=json&q=' + code;
                var ajaxOptions = {
                    dataType: 'json',
                    success: function (data) {
                        projectionDataCache[code] = data;
                        deferred.resolve(data);
                    },
                    error: function (error) {
                        deferred.reject(error);
                    }
                };
                if (options.sync) {
                    ajaxOptions.async = false;
                }
                $.ajax(url, ajaxOptions);
            }
            return deferred.promise();
        };

        TC.loadProjDef = function (options) {
            options = options || {};
            const crs = options.crs;
            const epsgPrefix = 'EPSG:';
            const urnPrefix = 'urn:ogc:def:crs:EPSG::';
            const gmlPrefix = 'http://www.opengis.net/gml/srs/epsg.xml#';

            var getDef;
            if (TC.isLegacy) {
                if (!window[TC.Consts.PROJ4JSOBJ_LEGACY]) {
                    TC.syncLoadJS(TC.url.proj4js);
                }
                getDef = function (name) {
                    return Proj4js.defs[name];
                };
            }
            else {
                if (!window[TC.Consts.PROJ4JSOBJ]) {
                    TC.syncLoadJS(TC.url.proj4js);
                }
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
            const loadProj4Def = function (code, def) {
                Proj4js.defs[code] = def;
                if (!TC.isLegacy) {
                    proj4.defs(code, def);
                }
            };
            const loadDef = function (code, def, name) {
                const epsgCode = epsgPrefix + code;
                const urnCode = urnPrefix + code;
                const gmlCode = gmlPrefix + code;
                var axisUnawareDef;
                if (typeof def === 'object') {
                    axisUnawareDef = $.extend({}, def);
                    def = $.extend({}, def);
                    if (axisUnawareDef.axis) {
                        delete axisUnawareDef.axis;
                    }
                }
                else if (typeof def === 'string') {
                    axisUnawareDef = def.replace('+axis=neu', '');
                }
                loadProj4Def(epsgCode, def);
                loadProj4Def(urnCode, def);
                // Por convención, los CRS definidos por URI siempre tienen orden de coordenadas X-Y.
                loadProj4Def(gmlCode, axisUnawareDef);
                if (crs.indexOf('http') === 0) {
                    // El CRS es tipo URI, usado seguramente en un GML.
                    loadProj4Def(crs, axisUnawareDef);
                    getDef(crs).name = name;
                }
                getDef(epsgCode).name = name;
                getDef(gmlCode).name = name;
            };
            const loadDefResponse = function (data) {
                var result = data.status === 'ok' && data.number_result === 1;
                if (result) {
                    var def = data.results[0];
                    loadDef(def.code, def.proj4, def.name);
                }
                return result;
            };

            var idx = crs.lastIndexOf('#');
            if (idx < 0) {
                idx = crs.lastIndexOf('/');
            }
            if (idx < 0) {
                idx = crs.lastIndexOf(':');
            }
            var code = crs.substr(idx + 1);
            var def = getDef(crs);
            if (def) {
                loadDef(code, def, options.name);
                if ($.isFunction(options.callback)) {
                    options.callback();
                }
            }
            else {
                if (options.def) {
                    loadDef(code, options.def, options.name);
                    if ($.isFunction(options.callback)) {
                        options.callback();
                    }
                }
                else {
                    TC.getProjectionData(options).then(function (data) {
                        if (loadDefResponse(data) && $.isFunction(options.callback)) {
                            options.callback();
                        };
                    });
                }
            }
        };

        TC.url = {
            templating: [
                TC.apiLocation + TC.Consts.url.TEMPLATING,
                TC.apiLocation + TC.Consts.url.TEMPLATING_I18N,
                TC.apiLocation + TC.Consts.url.TEMPLATING_OVERRIDES
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

        // Precargamos el CRS por defecto
        TC.loadProjDef({ crs: 'EPSG:25830', name: 'ETRS89 / UTM zone 30N', def: '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs' });
        // Precargamos los CRS de IDENA que tienen orden de ejes neu
        TC.loadProjDef({ crs: 'EPSG:4258', name: 'ETRS89', def: '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +axis=neu' });
        TC.loadProjDef({ crs: 'EPSG:3040', name: 'ETRS89 / UTM zone 28N (N-E)', def: '+proj=utm +zone=28 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +axis=neu' });
        TC.loadProjDef({ crs: 'EPSG:3041', name: 'ETRS89 / UTM zone 29N (N-E)', def: '+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +axis=neu' });
        TC.loadProjDef({ crs: 'EPSG:3042', name: 'ETRS89 / UTM zone 30N (N-E)', def: '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +axis=neu' });
        TC.loadProjDef({ crs: 'EPSG:3043', name: 'ETRS89 / UTM zone 31N (N-E)', def: '+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +axis=neu' });
        TC.loadProjDef({ crs: 'EPSG:4230', name: 'ED50', def: '+proj=longlat +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +no_defs +axis=neu' });

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
                GeometryFeatureInfo: function () { TC.wrap.Control.apply(this, arguments); },
                Geolocation: function () { TC.wrap.Control.apply(this, arguments); },
                Draw: function () { TC.wrap.Control.apply(this, arguments); },
                Modify: function () { TC.wrap.Control.apply(this, arguments); },
                CacheBuilder: function () { TC.wrap.Control.apply(this, arguments); },
                Edit: function () { TC.wrap.Control.apply(this, arguments); },
                ResultsPanel: function () { TC.wrap.Control.apply(this, arguments); }
            },
            Feature: function () { },
            Geometry: function () { }
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
        TC.inherit(TC.wrap.control.GeometryFeatureInfo, TC.wrap.control.Click);
        TC.inherit(TC.wrap.control.Geolocation, TC.wrap.Control);
        TC.inherit(TC.wrap.control.Draw, TC.wrap.Control);
        TC.inherit(TC.wrap.control.CacheBuilder, TC.wrap.Control);
        TC.inherit(TC.wrap.control.Edit, TC.wrap.Control);
        TC.inherit(TC.wrap.control.ResultsPanel, TC.wrap.Control);

        TC.loadCSS(TC.apiLocation + 'TC/css/tcmap.css');

        if (!TC.Map) {
            TC.syncLoadJS(TC.apiLocation + 'TC/Map');
        }
        if (!TC.Util) {
            TC.syncLoadJS(TC.apiLocation + 'TC/Util');
        }

        TC.loadJS(!Modernizr.urlparser, TC.apiLocation + TC.Consts.url.URL_POLYFILL, function () { });

        var uids = {};
        TC.getUID = function (prefix) {
            prefix = prefix || '';
            var value = uids[prefix];
            if (!value) {
                value = uids[prefix] = 1;
            }
            var result = prefix + value;
            uids[prefix] = value + 1;
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

    TC.browser = TC.Util.getBrowser();

    TC.loadJS(!TC.Cfg.acceptedBrowserVersions, TC.apiLocation + 'TC/config/browser-versions.js', function (result) {
        var isSupported = true;
        var versions = TC.Cfg.acceptedBrowserVersions;

        var match = versions.filter(function (item) {
            return item.name.toLowerCase() === TC.browser.name.toLowerCase();
        });

        if (match.length > 0 && !isNaN(match[0].version)) {
            if (TC.browser.version < match[0].version) {
                isSupported = false;
            }
        }

        if (TC.Cfg.oldBrowserAlert && !isSupported) {
            TC.Cfg.loggingErrorsEnabled = false;
            var mapObj = $('.' + TC.Consts.classes.MAP).data('map');

            $.when(TC.i18n.loadResources(!TC.i18n[mapObj.options.locale], TC.apiLocation + 'TC/resources/', mapObj.options.locale)).done(function () {
                TC.error(TC.Util.getLocaleString(mapObj.options.locale, 'outdatedBrowser'), TC.Consts.msgErrorMode.TOAST);
            });
        }
    });

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

        var mapObj;

        return function (e) {
            mapObj = mapObj || $('.' + TC.Consts.classes.MAP).data('map');
            var errorMsg = e.message;
            var url = e.filename;
            var lineNumber = e.lineno;
            var column = e.colno;
            var errorObj = e.error;
            var apiError = url.indexOf(TC.apiLocation) > 0;
            // Si notifyApplicationErrors === false solo capturamos los errores de la API
            if ((TC.Cfg.notifyApplicationErrors || apiError) && errorCount < TC.Cfg.maxErrorCount && TC.Cfg.loggingErrorsEnabled) {
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
import TC from '../TC';

/**
 * Espacio de nombres donde se encuentran las constantes de utilidad.
 * @namespace SITNA.Consts
 */
TC.Consts = {};

TC.Consts.OLNS = 'ol';
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
TC.Consts.SRSDOWNLOAD_GEOJSON_KML = "EPSG:4326";

TC.Consts.url = {
    SPLIT_REGEX: /([^:]*:)?\/\/([^:]*:?[^@]*@)?([^:\/\?]*):?([^\/\?]*)/,
    TEMPLATING_FULL: 'lib/handlebars/handlebars',
    TEMPLATING_RUNTIME: 'lib/handlebars/handlebars.runtime',
    TEMPLATING_HELPERS: 'lib/handlebars/helpers.js',
    EPSG: 'https://epsg.io/',
    D3C3: TC.apiLocation + 'lib/d3c3/d3c3.min.js',
    CESIUM: TC.isDebug ? 'lib/cesium/build/cesium-sitna.js' : 'lib/cesium/build/cesium-sitna.min.js',
    CESIUM_CONNECTOR: 'TC/cesium/cesium.js',
    JSNLOG: 'lib/jsnlog/jsnlog.min.js',
    INTERACTJS: 'lib/interactjs/interact.min.js',
    ERROR_LOGGER: TC.apiLocation + 'errors/logger.ashx',
    HASH: 'lib/jshash/md5-min.js',
    DRAGGABILLY: 'lib/draggabilly/draggabilly.pkgd',
    URL_POLYFILL: 'lib/polyfill/url.js',
    PROMISE_POLYFILL: 'lib/polyfill/promise/polyfill.min.js'
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
    ERROR: 'tc-msg-error',
    THREED: 'tc-3d',
    TOAST: 'tc-toast',
    TOAST_CONTAINER: 'tc-toast-container'
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
    MAPCHANGE: 'mapchange.tc',
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
    BEFOREFEATUREREMOVE: 'beforefeatureremove.tc',
    FEATUREREMOVE: 'featureremove.tc',
    FEATURESCLEAR: 'featuresclear.tc',
    FEATURESIMPORT: 'featuresimport.tc',
    FEATURESIMPORTERROR: 'featuresimporterror.tc',
    FEATURESIMPORTPARTIAL: 'featuresimportpartial.tc',
    FEATURESIMPORTWARN: 'featuresimportwarn.tc',
    FILESAVE: 'filesave.tc',
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
    CLICK: 'click',
    MOUSEUP: 'mouseup',
    MOUSEMOVE: 'mousemove',
    MOUSELEAVE: 'mouseleave',
    STARTLOADING: 'startloading.tc',
    STOPLOADING: 'stoploading.tc',
    EXTERNALSERVICEADDED: 'externalserviceadded.tc',
    ZOOMTO: 'zoomto.tc',
    PROJECTIONCHANGE: 'projectionchange.tc',
    VIEWCHANGE: 'viewchange.tc',
    TERRAINPROVIDERADD: 'terrainprovideradd.tc',
    TERRAINPROVIDERREMOVE: 'terrainproviderremove.tc',
    OVERVIEWBASELAYERCHANGE: 'overviewbaselayerchange.tc',
    POPUP: 'popup.tc',
    BEFOREAPPLYQUERY: 'beforeapplyquery.tc'
};

/**
 * Colección de identificadores de capas útiles de IDENA y otros servicios de terceros.
 * @namespace SITNA.Consts.layer
 * @see MapOptions
 * @see SITNA.Map#addLayer
 * @see SITNA.Map#setBaseLayer
 */
TC.Consts.layer = {
    /**
     * Identificador de la capa de ortofoto de máxima actualidad del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_ORTHOPHOTO: 'ortofoto',
    /**
     * Identificador de la capa de mapa base del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_BASEMAP: 'mapabase',
    /**
     * Identificador de la capa de catastro del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_CADASTER: 'catastro',
    /**
     * Identificador de la capa de cartografía topográfica 2017 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_CARTO: 'cartografia',
    /**
     * Identificador de la capa de ortofoto 2021 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_ORTHOPHOTO2021: 'ortofoto2021',
    /**
     * Identificador de la capa de ortofoto 2020 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_ORTHOPHOTO2020: 'ortofoto2020',
    /**
     * Identificador de la capa de ortofoto 2019 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_ORTHOPHOTO2019: 'ortofoto2019',
    /**
     * Identificador de la capa de ortofoto 2018 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_ORTHOPHOTO2018: 'ortofoto2018',
    /**
     * Identificador de la capa de ortofoto 2017 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_ORTHOPHOTO2017: 'ortofoto2017',
    /**
     * Identificador de la capa de ortofoto 2014 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_ORTHOPHOTO2014: 'ortofoto2014',
    /**
     * Identificador de la capa de ortofoto 2012 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_ORTHOPHOTO2012: 'ortofoto2012',
    /**
     * Identificador de la capa de ortofoto de la comarca de Pamplona 2020 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_PAMPLONA_ORTHOPHOTO2020: 'ortofoto_pamplona2020',
    /**
     * Identificador de la capa de mapa base del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_DYNBASEMAP: 'mapabase_dinamico',
    /**
     * Identificador de la capa de ortofoto de máxima actualidad del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_DYNORTHOPHOTO: 'ortofoto_dinamico',
    /**
     * Identificador de la capa de ortofoto 2021 del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_DYNORTHOPHOTO2021: 'ortofoto2021_dinamico',
    /**
     * Identificador de la capa de ortofoto 2020 del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_DYNORTHOPHOTO2020: 'ortofoto2020_dinamico',
    /**
     * Identificador de la capa de ortofoto 2019 del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_DYNORTHOPHOTO2019: 'ortofoto2019_dinamico',
    /**
     * Identificador de la capa de ortofoto 2018 del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_DYNORTHOPHOTO2018: 'ortofoto2018_dinamico',
    /**
     * Identificador de la capa de ortofoto 2017 del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_DYNORTHOPHOTO2017: 'ortofoto2017_dinamico',
    /**
     * Identificador de la capa de ortofoto 2014 del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_DYNORTHOPHOTO2014: 'ortofoto2014_dinamico',
    /**
     * Identificador de la capa de ortofoto 2012 del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_DYNORTHOPHOTO2012: 'ortofoto2012_dinamico',
    /**
     * Identificador de la capa de ortofoto de la comarca de Pamplona 2020 del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_PAMPLONA_DYNORTHOPHOTO2020: 'ortofoto_pamplona2020_dinamico',
    /**
     * Identificador de la capa de cartografía topográfica 2017 del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_DYNCARTO: 'cartografia_dinamico',
    /**
     * Identificador de la capa de relieve en blanco y negro del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_BW_RELIEF: 'relieve_bn',
    /**
     * Identificador de la capa de la combinación de ortofoto de máxima actualidad y mapa base del WMS de IDENA.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IDENA_BASEMAP_ORTHOPHOTO: 'base_orto',

    /**
     * Identificador de la capa de cartografía raster del WMTS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_CARTO: "ign-raster",
    /**
     * Identificador de la capa del callejero del WMTS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_BASEMAP: "ign-base",
    /**
     * Identificador de la capa del callejero en gris del WMTS del Instituto Geográfico Nacional. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_BASEMAP_GREY: "ign-base-gris",
    /**
     * Identificador de la capa de relieve del WMTS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_RELIEF: "ign-mtn",
    /**
     * Identificador de la capa del PNOA del WMTS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_ORTHOPHOTO: "ign-pnoa",
    /**
     * Identificador de la capa del modelo digital de superficies LIDAR del WMTS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_LIDAR: "ign-lidar",

    /**
     * Identificador de la capa de cartografía raster del WMS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_DYNCARTO: "ign-raster-dyn",
    /**
     * Identificador de la capa del callejero del WMS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_DYNBASEMAP: "ign-base-dyn",
    /**
     * Identificador de la capa del callejero en gris del WMS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_DYNBASEMAP_GREY: "ign-base-gris-dyn",
    /**
     * Identificador de la capa de relieve del WMS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_DYNRELIEF: "ign-mtn-dyn",
    /**
     * Identificador de la capa del PNOA del WMS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_DYNORTHOPHOTO: "ign-pnoa-dyn",
    /**
     * Identificador de la capa del modelo digital de superficies LIDAR del WMS del Instituto Geográfico Nacional.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_ES_DYNLIDAR: "ign-lidar-dyn",

    /*
     * Identificador de la capa de cartografía raster del WMTS del Instituto Geográfico Nacional Francés. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    //IGN_FR_CARTO: "ign-fr-cartes",
    /**
     * Identificador de la capa de mapa base del WMTS del Instituto Geográfico Nacional Francés. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_FR_BASEMAP: "ign-fr-base",
    /**
     * Identificador de la capa de relieve del WMTS del Instituto Geográfico Nacional Francés. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_FR_RELIEF: "ign-fr-estompage",
    /**
     * Identificador de la capa de ortofoto del WMTS del Instituto Geográfico Nacional Francés. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_FR_ORTHOPHOTO: "ign-fr-orto",

    /*
     * Identificador de la capa de cartografía raster del WMS del Instituto Geográfico Nacional Francés.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    //IGN_FR_DYNCARTO: "ign-fr-cartes-dyn",
    /**
     * Identificador de la capa de mapa base del WMS del Instituto Geográfico Nacional Francés.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_FR_DYNBASEMAP: "ign-fr-base-dyn",
    /**
     * Identificador de la capa de relieve del WMS del Instituto Geográfico Nacional Francés.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_FR_DYNRELIEF: "ign-fr-estompage-dyn",
    /**
     * Identificador de la capa de ortofoto del WMS del Instituto Geográfico Nacional Francés.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    IGN_FR_DYNORTHOPHOTO: "ign-fr-orto-dyn",

    /**
     * Identificador de la capa de OpenStreetMap a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    OSM: 'osm',
    /**
     * Identificador de la capa de Carto Voyager a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    CARTO_VOYAGER: 'carto_voyager',
    /**
     * Identificador de la capa de Carto Light a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    CARTO_LIGHT: 'carto_light',
    /**
     * Identificador de la capa de Carto Dark a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    CARTO_DARK: 'carto_dark',
    /**
     * Identificador de la capa de Mapbox Streets a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    MAPBOX_STREETS: 'mapbox_streets',
    /**
     * Identificador de la capa de Mapbox Satellite a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    MAPBOX_SATELLITE: 'mapbox_satellite',
    /** 
     * Identificador de una capa en blanco.
     * @var {string}
     * @readonly
     * @memberof SITNA.Consts.layer
     */
    BLANK: 'ninguno'
};
TC.Consts.text = {
    API_ERROR: 'Error API SITNA',
    APP_ERROR: 'Error de aplicación'
};

/**
 * Colección de identificadores de tipo de capa.
 * @namespace SITNA.Consts.layerType
 * @see LayerOptions
 */
TC.Consts.layerType = {
    /**
     * Identificador de capa de tipo WMS.
     * @var {string}
     * @memberof SITNA.Consts.layerType
     * @readonly
     */
    WMS: 'WMS',
    /**
     * Identificador de capa de tipo WMTS.
     * @var {string}
     * @memberof SITNA.Consts.layerType
     * @readonly
     */
    WMTS: 'WMTS',
    /**
     * Identificador de capa de tipo WFS.
     * @var {string}
     * @memberof SITNA.Consts.layerType
     * @readonly
     */
    WFS: 'WFS',
    /**
     * Identificador de capa de tipo vectorial. Este tipo de capa es la que se utiliza para dibujar marcadores.
     * @var {string}
     * @memberof SITNA.Consts.layerType
     * @readonly
     */
    VECTOR: 'vector',
    /**
     * Identificador de capa de tipo KML.
     * @var {string}
     * @memberof SITNA.Consts.layerType
     * @deprecated En lugar de esta propiedad es recomendable usar {@link SITNA.Consts.layerType.VECTOR} para cargar archivos KML.
     * @readonly
     */
    KML: 'KML',
    GPX: 'GPX',
    GML: 'GML',
    GEOJSON: 'GeoJSON',
    GROUP: 'group'
};

/**
 * Colección de identificadores de tipo de geometría.
 * @namespace SITNA.Consts.geom
 */
TC.Consts.geom = {
    /**
     * Identificador de geometría de tipo punto.
     * @var {string}
     * @memberof SITNA.Consts.geom
     * @readonly
     */
    POINT: 'point',
    MULTIPOINT: 'multipoint',
    /**
     * Identificador de geometría de tipo línea.
     * @var {string}
     * @memberof SITNA.Consts.geom
     * @readonly
     */
    POLYLINE: 'polyline',
    /**
     * Identificador de geometría de tipo polígono.
     * @var {string}
     * @memberof SITNA.Consts.geom
     * @readonly
     */
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
    ROADMILESTONE: 'roadmilestone',
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

/**
 * Colección de tipos MIME de utilidad.
 * @namespace SITNA.Consts.mimeType
 * @see LayerOptions
 */
TC.Consts.mimeType = {
    /** 
     * Tipo MIME de imagen PNG.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default
     */
    PNG: 'image/png',
    /** 
     * Tipo MIME de imagen JPEG.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    JPEG: 'image/jpeg',
    /** 
     * Tipo MIME de documento JSON.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    JSON: 'application/json',
    /** 
     * Tipo MIME de documento GeoJSON.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    GEOJSON: 'application/vnd.geo+json',
    /** 
     * Tipo MIME de documento KML.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    KML: 'application/vnd.google-earth.kml+xml',
    /** 
     * Tipo MIME de documento KMZ (KML comprimido en ZIP).
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    KMZ: 'application/vnd.google-earth.kmz',
    /** 
     * Tipo MIME de documento GML.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    GML: 'application/gml+xml',
    /** 
     * Tipo MIME de documento GPX.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    GPX: 'application/gpx+xml',
    /** 
     * Tipo MIME de documento XML.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    XML: 'application/xml',
    /** 
     * Tipo MIME de archivo GeoPackage.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    GEOPACKAGE: 'application/geopackage+sqlite3',
    /** 
     * Tipo MIME de archivo Shapefile.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    SHAPEFILE: 'x-gis/x-shapefile',
    /** 
     * Tipo MIME de archivo ZIP.
     * @var {string}
     * @memberof SITNA.Consts.mimeType
     * @readonly
     * @default 
     */
    ZIP: 'application/x-zip'
};
/**
 * Colección de tipos de formatos de utilidad.
 * @namespace SITNA.Consts.format
 */
TC.Consts.format = {
    /** 
     * Leer y escribir datos en formato JSON.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    JSON: 'JSON',
    /** 
    * Leer y escribir datos en formato KML.
    * @var {string}
    * @memberof SITNA.Consts.format
    * @readonly
    * @default
    */
    KML: 'KML',
    /** 
    * Leer y escribir datos en formato KMZ.
    * @var {string}
    * @memberof SITNA.Consts.format
    * @readonly
    * @default
    */
    KMZ: 'KMZ',
    /** 
     * Leer y escribir datos en formato GML.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    GML: 'GML',
    /** 
     * Leer y escribir datos en formato GML2.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    GML2: 'GML2',
    /** 
     * Leer y escribir datos en formato GML3.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    GML3: 'GML3',
    /** 
     * Leer y escribir datos en formato GML3.2.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    GML32: 'GML32',
    /** 
     * Leer y escribir datos en formato GeoJSON.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    GEOJSON: 'GeoJSON',
    /** 
     * Leer y escribir datos en formato TopoJSON.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    TOPOJSON: 'TopoJSON',
    /** 
     * Leer y escribir datos en formato GPX.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    GPX: 'GPX',
    /** 
     * Leer y escribir datos en formato WKT.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    WKT: 'WKT',
    /** 
     * Leer y escribir datos en formato ShapeFile.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    SHAPEFILE: 'SHP',
    /** 
     * Leer y escribir datos en formato ZIP.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    ZIP: 'ZIP',
    /** 
     * Leer y escribir datos en formato GeoPackage.
     * @var {string}
     * @memberof SITNA.Consts.format
     * @readonly
     * @default
     */
    GEOPACKAGE: 'GPKG'
};

//enumerado de errores y warninqs derivados de descargas, getfeatures
TC.Consts.WFSErrors = {
    GETFEATURE_NOT_AVAILABLE: "GetFeatureNotAvailable",
    LAYERS_NOT_AVAILABLE: "LayersNotAvailable",
    NO_LAYERS: "NoLayers",
    NO_VALID_LAYERS: "noValidLayers",
    QUERY_NOT_AVAILABLE: "QueryNotAvailable",
    //CapabilitiesParseError: "CapabilitiesParseError",
    MAX_NUM_FEATURES: "NumMaxFeatures",
    GETCAPABILITIES: "GetCapabilities",
    INDETERMINATE: "Indeterminate",
    NO_FEATURES: "NoFeatures"
};

TC.Consts.visibility = {
    NOT_VISIBLE: 0,
    NOT_VISIBLE_AT_RESOLUTION: 1,
    HAS_VISIBLE: 2,
    VISIBLE: 4
};

TC.Consts.view = {
    DEFAULT: 0,
    THREED: 1,
    PRINTING: 2
};

TC.Consts.units = {
    DEGREES: "degrees",
    METERS: "m"
};

TC.Consts.MARKER = 'marker';

TC.Consts.infoContainer = {
    POPUP: 'popup',
    RESULTS_PANEL: 'resultsPanel'
};

TC.Consts.DownloadError = {
    MIMETYPE_NOT_SUPORTED: "MimeTypeNotSupported"
};

const Consts = TC.Consts;
export default Consts;
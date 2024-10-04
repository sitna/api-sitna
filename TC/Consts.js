/**
 * Dentro de este objeto estático se definen las constantes de utilidad que utiliza la API SITNA.
 * @member Consts
 * @memberof SITNA
 * @type object
 * @readonly
 * @property {object} format - Colección de tipos de formatos de archivo de utilidad.
 * @property {string} format.GEOJSON - Leer y escribir datos en formato GeoJSON.
 * @property {string} format.GEOPACKAGE - Leer y escribir datos en formato GeoPackage.
 * @property {string} format.GML - Leer y escribir datos en formato GML.
 * @property {string} format.GML2 - Leer y escribir datos en formato GML versión 2.
 * @property {string} format.GML3 - Leer y escribir datos en formato GML versión 3.
 * @property {string} format.GML32 - Leer y escribir datos en formato GML versión 3.2.
 * @property {string} format.GPX - Leer y escribir datos en formato GPX.
 * @property {string} format.JSON - Leer y escribir datos en formato JSON.
 * @property {string} format.KML - Leer y escribir datos en formato KML.
 * @property {string} format.KMZ - Leer y escribir datos en formato KMZ.
 * @property {string} format.SHAPEFILE - Leer y escribir datos en formato ShapeFile.
 * @property {string} format.TOPOJSON - Leer y escribir datos en formato TopoJSON.
 * @property {string} format.WKT - Leer y escribir datos en formato WKT.
 * @property {string} format.ZIP - Leer y escribir datos archivados en formato ZIP.
 * @property {object} geom - Colección de identificadores de tipo de geometría.
 * @property {string} geom.POINT - Identificador de geometría de tipo punto.
 * @property_ {string} geom.MULTIPOINT - Identificador de geometría de tipo multipunto.
 * @property {string} geom.POLYLINE - Identificador de geometría de tipo línea de varios segmentos.
 * @property_ {string} geom.MULTIPOLYLINE - Identificador de geometría lineal compuesta de líneas de varios segmentos.
 * @property {string} geom.POLYGON - Identificador de geometría de tipo polígono.
 * @property_ {string} geom.MULTIPOLYLINE - Identificador de geometría compuesta de polígonos.
 * @property_ {string} geom.CIRCLE - Identificador de geometría circular.
 * @property {object} layer - Colección de identificadores de capas útiles de IDENA y otros servicios de terceros.
 * @property {string} layer.BLANK - Identificador de una capa en blanco.
 * @property {string} layer.CARTO_DARK - Identificador de la capa de Carto Dark a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {string} layer.CARTO_LIGHT - Identificador de la capa de Carto Light a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {string} layer.CARTO_VOYAGER - Identificador de la capa de Carto Voyager a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {string} layer.IDENA_BASEMAP - Identificador de la capa de mapa base del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property {string} layer.IDENA_BASEMAP_GREY - Identificador de la capa de mapa base gris del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property {string} layer.IDENA_BASEMAP_ORTHOPHOTO - Identificador de la capa de la combinación de ortofoto de máxima actualidad y mapa base del WMS de IDENA.
 * @property {string} layer.IDENA_BW_RELIEF - Identificador de la capa de relieve en blanco y negro del WMS de IDENA.
 * @property {string} layer.IDENA_CADASTER - Identificador de la capa de catastro del WMS de IDENA.
 * @property {string} layer.IDENA_CARTO - Identificador de la capa de cartografía topográfica del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property {string} layer.IDENA_DYNBASEMAP - Identificador de la capa de mapa base del WMS de IDENA.
 * @property {string} layer.IDENA_DYNBASEMAP_GREY - Identificador de la capa de mapa base gris del WMS de IDENA.
 * @property {string} layer.IDENA_DYNCARTO - Identificador de la capa de cartografía topográfica del WMS de IDENA.
 * @property {string} layer.IDENA_DYNORTHOPHOTO - Identificador de la capa de ortofoto de máxima actualidad del WMS de IDENA.
 * @property {string} layer.IDENA_DYNORTHOPHOTO2012 - Identificador de la capa de ortofoto 2012 del WMS de IDENA.
 * @property {string} layer.IDENA_DYNORTHOPHOTO2014 - Identificador de la capa de ortofoto 2014 del WMS de IDENA.
 * @property {string} layer.IDENA_DYNORTHOPHOTO2017 - Identificador de la capa de ortofoto 2017 del WMS de IDENA.
 * @property {string} layer.IDENA_DYNORTHOPHOTO2018 - Identificador de la capa de ortofoto 2018 del WMS de IDENA.
 * @property {string} layer.IDENA_DYNORTHOPHOTO2019 - Identificador de la capa de ortofoto 2019 del WMS de IDENA.
 * @property {string} layer.IDENA_DYNORTHOPHOTO2020 - Identificador de la capa de ortofoto 2020 del WMS de IDENA.
 * @property {string} layer.IDENA_DYNORTHOPHOTO2021 - Identificador de la capa de ortofoto 2021 del WMS de IDENA.
 * @property {string} layer.IDENA_DYNORTHOPHOTO2022 - Identificador de la capa de ortofoto 2022 del WMS de IDENA.
 * @property {string} layer.IDENA_DYNORTHOPHOTO2023 - Identificador de la capa de ortofoto 2023 del WMS de IDENA.
 * @property {string} layer.IDENA_ORTHOPHOTO - Identificador de la capa de ortofoto de máxima actualidad del WMTS de IDENA. Esta capa solo es compatible con los sistemas de referencia EPSG:25830 y EPSG:4326.
 * @property {string} layer.IDENA_ORTHOPHOTO2012 - Identificador de la capa de ortofoto 2012 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property {string} layer.IDENA_ORTHOPHOTO2014 - Identificador de la capa de ortofoto 2014 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property {string} layer.IDENA_ORTHOPHOTO2017 - Identificador de la capa de ortofoto 2017 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property {string} layer.IDENA_ORTHOPHOTO2018 - Identificador de la capa de ortofoto 2018 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property {string} layer.IDENA_ORTHOPHOTO2019 - Identificador de la capa de ortofoto 2019 del WMTS de IDENA. Esta capa solo es compatible con los sistemas de referencia EPSG:25830 y EPSG:4326.
 * @property {string} layer.IDENA_ORTHOPHOTO2020 - Identificador de la capa de ortofoto 2020 del WMTS de IDENA. Esta capa solo es compatible con los sistemas de referencia EPSG:25830 y EPSG:4326.
 * @property {string} layer.IDENA_ORTHOPHOTO2021 - Identificador de la capa de ortofoto 2021 del WMTS de IDENA. Esta capa solo es compatible con los sistemas de referencia EPSG:25830 y EPSG:4326.
 * @property {string} layer.IDENA_ORTHOPHOTO2022 - Identificador de la capa de ortofoto 2022 del WMTS de IDENA. Esta capa solo es compatible con los sistemas de referencia EPSG:25830 y EPSG:4326.
 * @property {string} layer.IDENA_ORTHOPHOTO2023 - Identificador de la capa de ortofoto 2023 del WMTS de IDENA. Esta capa solo es compatible con los sistemas de referencia EPSG:25830 y EPSG:4326.
 * @property {string} layer.IDENA_PAMPLONA_DYNORTHOPHOTO2020 - Identificador de la capa de ortofoto de la comarca de Pamplona 2020 del WMS de IDENA.
 * @property {string} layer.IDENA_PAMPLONA_DYNCARTO - Identificador de la capa de la cartografía topográfica de Pamplona del WMS de IDENA.
 * @property {string} layer.IDENA_PAMPLONA_ORTHOPHOTO2020 - Identificador de la capa de ortofoto de la comarca de Pamplona 2020 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property {string} layer.IDENA_PAMPLONA_CARTO - Identificador de la capa de la cartografía topográfica de Pamplona del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property {string} layer.IGN_ES_BASEMAP - Identificador de la capa del callejero del WMTS del Instituto Geográfico Nacional.
 * @property {string} layer.IGN_ES_BASEMAP_GREY - Identificador de la capa del callejero en gris del WMTS del Instituto Geográfico Nacional. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {string} layer.IGN_ES_CARTO - Identificador de la capa de cartografía raster del WMTS del Instituto Geográfico Nacional.
 * @property {string} layer.IGN_ES_DYNBASEMAP - Identificador de la capa del callejero del WMS del Instituto Geográfico Nacional.
 * @property {string} layer.IGN_ES_DYNBASEMAP_GREY - Identificador de la capa del callejero en gris del WMS del Instituto Geográfico Nacional.
 * @property {string} layer.IGN_ES_DYNCARTO - Identificador de la capa de cartografía raster del WMS del Instituto Geográfico Nacional.
 * @property {string} layer.IGN_ES_DYNLIDAR - Identificador de la capa del modelo digital de superficies LIDAR del WMS del Instituto Geográfico Nacional.
 * @property {string} layer.IGN_ES_DYNORTHOPHOTO - Identificador de la capa del PNOA del WMS del Instituto Geográfico Nacional.
 * @property {string} layer.IGN_ES_LIDAR - Identificador de la capa del modelo digital de superficies LIDAR del WMTS del Instituto Geográfico Nacional.
 * @property {string} layer.IGN_ES_ORTHOPHOTO - Identificador de la capa del PNOA del WMTS del Instituto Geográfico Nacional.
 * @property {string} layer.IGN_ES_RELIEF - Identificador de la capa de relieve del WMTS del Instituto Geográfico Nacional.
 * @property {string} layer.IGN_FR_BASEMAP - Identificador de la capa de mapa base del WMTS del Instituto Geográfico Nacional Francés. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {string} layer.IGN_FR_DYNBASEMAP - Identificador de la capa de mapa base del WMS del Instituto Geográfico Nacional Francés.
 * @property {string} layer.IGN_FR_DYNORTHOPHOTO - Identificador de la capa de ortofoto del WMS del Instituto Geográfico Nacional Francés.
 * @property {string} layer.IGN_FR_DYNRELIEF - Identificador de la capa de relieve del WMS del Instituto Geográfico Nacional Francés.
 * @property {string} layer.IGN_FR_ORTHOPHOTO - Identificador de la capa de ortofoto del WMTS del Instituto Geográfico Nacional Francés. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {string} layer.IGN_FR_RELIEF - Identificador de la capa de relieve del WMTS del Instituto Geográfico Nacional Francés. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {string} layer.MAPBOX_SATELLITE - Identificador de la capa de Mapbox Satellite a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {string} layer.MAPBOX_STREETS - Identificador de la capa de Mapbox Streets a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {string} layer.OPENTOPOMAP - Identificador de la capa de OpenTopoMap a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {string} layer.OSM - Identificador de la capa de OpenStreetMap a través del WMTS de la API SITNA. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
 * @property {object} layerType - Colección de identificadores de tipo de capa.
 * @property {string} layerType.KML - *__Obsoleta__: En lugar de esta propiedad es recomendable usar `SITNA.Consts.layerType.VECTOR` para cargar archivos KML.*
 *
 * Identificador de capa de tipo KML.
 * @property {string} layerType.VECTOR - Identificador de capa de tipo vectorial.
 * Este tipo de capa es la que se utiliza para representar entidades geográficas de {@link SITNA.feature}.
 * @property {string} layerType.WFS - Identificador de capa de tipo WFS.
 * @property {string} layerType.WMS - Identificador de capa de tipo WMS.
 * @property {string} layerType.WMTS - Identificador de capa de tipo WMTS.
 * @property {object} mimeType - Colección de tipos MIME de utilidad.
 * @property {string} mimeType.GEOJSON - Tipo MIME de documento GeoJSON.
 * @property {string} mimeType.GEOPACKAGE - Tipo MIME de archivo GeoPackage.
 * @property {string} mimeType.GML - Tipo MIME de documento GML.
 * @property {string} mimeType.GPX - Tipo MIME de documento GPX.
 * @property {string} mimeType.JPEG - Tipo MIME de imagen JPEG.
 * @property {string} mimeType.JSON - Tipo MIME de documento JSON.
 * @property {string} mimeType.KML - Tipo MIME de documento KML.
 * @property {string} mimeType.KMZ - Tipo MIME de documento KMZ (KML comprimido en ZIP).
 * @property {string} mimeType.PNG - Tipo MIME de imagen PNG.
 * @property {string} mimeType.SHAPEFILE - Tipo MIME de archivo Shapefile.
 * @property {string} mimeType.XML - Tipo MIME de documento XML.
 * @property {string} mimeType.ZIP - Tipo MIME de archivo ZIP.
 * @example <caption>Paso de constantes como parámetros al constructor de una capa vectorial con un documento KML como fuente de datos.</caption> {@lang javascript}
 * const myVectorLayer = new SITNA.layer.Vector({
 *      id: 'myLayer',
 *      type: SITNA.Consts.layerType.VECTOR,
 *      format: SITNA.Consts.format.KML,
 *      url: 'https://sitna.navarra.es/api/examples/data/MUSEOSNAVARRA.kml'
 * });
 */

const Consts = {};

Consts.OLNS = 'ol';
Consts.PROJ4JSOBJ = 'proj4';
Consts.GEOGRAPHIC = 'geographic';
Consts.UTM = 'UTM';
Consts.OLD_BROWSER_ALERT = 'TC.oldBrowserAlert';
Consts.CLUSTER_ANIMATION_DURATION = 200;
Consts.ZOOM_ANIMATION_DURATION = 300;
Consts.URL_MAX_LENGTH = 2048;
Consts.METER_PRECISION = 0;
Consts.DEGREE_PRECISION = 5;
Consts.EXTENT_TOLERANCE = 0.9998;/*URI: debido al redondeo del extente en el hash se obtiene un nivel de resolución mayor al debido. Con este valor definimos una tolerancia para que use una resolución si es muy muy muy próxima*/
Consts.SRSDOWNLOAD_GEOJSON_KML = "urn:ogc:def:crs:OGC::CRS84";

Consts.url = {
    SPLIT_REGEX: /([^:]*:)?\/\/([^:]*:?[^@]*@)?([^:\/\?]*):?([^\/\?]*)/,
    EPSG: 'https://epsg.io/'
};
if (typeof SITNA_BASE_URL !== "undefined") {
    Consts.url.ERROR_LOGGER = SITNA_BASE_URL + 'errors/logger.ashx';
}
else {
    // Obtenemos la URL base de la dirección del script
    const script = document.currentScript;
    const src = script.getAttribute('src');
    const apiLocation = src.substr(0, src.lastIndexOf('/') + 1);
    Consts.url.ERROR_LOGGER = apiLocation + 'errors/logger.ashx';
}
Consts.classes = {
    MAP: 'tc-map',
    POINT: 'tc-point',
    MARKER: 'tc-marker',
    VISIBLE: 'tc-visible',
    HIDDEN: 'tc-hidden',
    COLLAPSED: 'tc-collapsed',
    COLLAPSED_LEFT: 'tc-collapsed-left',
    COLLAPSED_RIGHT: 'tc-collapsed-right',
    CHECKED: 'tc-checked',
    DISABLED: 'tc-disabled',
    ACTIVE: 'tc-active',
    HIGHLIGHTED: 'tc-highlighted',
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
    TOAST_CONTAINER: 'tc-toast-container',
    LEFT_PANEL: 'tc-left-panel',
    RIGHT_PANEL: 'tc-right-panel',
    SLIDE_PANEL: 'tc-slide-panel',
    TOOLS_PANEL: 'tc-tools-panel',
    LEGEND_PANEL: 'tc-legend-panel',
    OVERVIEW_MAP_PANEL: 'tc-ovmap-panel',
    PANEL_CONTENT: 'tc-panel-content',
    PANEL_TAB: 'tc-panel-tab',
    FULL_SCREEN: 'tc-fullscreen',
    NOT_AVAILABLE: 'tc-legend-not-available'
};
Consts.msgType = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
};
Consts.msgErrorMode = {
    TOAST: 'toast',
    CONSOLE: 'console',
    EMAIL: 'email'
};
Consts.event = {
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
    CONTROLHIGHLIGHT: 'controlhighlight.tc',
    CONTROLUNHIGHLIGHT: 'controlunhighlight.tc',
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
    CAMERACHANGE: 'camerachange.tc',
    TERRAINPROVIDERADD: 'terrainprovideradd.tc',
    TERRAINPROVIDERREMOVE: 'terrainproviderremove.tc',
    OVERVIEWBASELAYERCHANGE: 'overviewbaselayerchange.tc',
    POPUP: 'popup.tc',
    BEFOREAPPLYQUERY: 'beforeapplyquery.tc',
    RECENTFILEADD: 'recentfileadd.tc'
};

Consts.layer = {
    IDENA_ORTHOPHOTO: 'ortofoto',
    IDENA_BASEMAP: 'mapabase',
    IDENA_BASEMAP_GREY: 'mapabase_gris',
    IDENA_CADASTER: 'catastro',
    IDENA_CARTO: 'cartografia',
    IDENA_ORTHOPHOTO2023: 'ortofoto2023',
    IDENA_ORTHOPHOTO2022: 'ortofoto2022',
    IDENA_ORTHOPHOTO2021: 'ortofoto2021',
    IDENA_ORTHOPHOTO2020: 'ortofoto2020',
    IDENA_ORTHOPHOTO2019: 'ortofoto2019',
    IDENA_ORTHOPHOTO2018: 'ortofoto2018',
    IDENA_ORTHOPHOTO2017: 'ortofoto2017',
    IDENA_ORTHOPHOTO2014: 'ortofoto2014',
    IDENA_ORTHOPHOTO2012: 'ortofoto2012',
    IDENA_PAMPLONA_ORTHOPHOTO2020: 'ortofoto_pamplona2020',
    IDENA_PAMPLONA_CARTO: 'cartografia_pamplona',
    IDENA_DYNBASEMAP: 'mapabase_dinamico',
    IDENA_DYNBASEMAP_GREY: 'mapabase_gris_dinamico',
    IDENA_DYNORTHOPHOTO: 'ortofoto_dinamico',
    IDENA_DYNORTHOPHOTO2023: 'ortofoto2023_dinamico',
    IDENA_DYNORTHOPHOTO2022: 'ortofoto2022_dinamico',
    IDENA_DYNORTHOPHOTO2021: 'ortofoto2021_dinamico',
    IDENA_DYNORTHOPHOTO2020: 'ortofoto2020_dinamico',
    IDENA_DYNORTHOPHOTO2019: 'ortofoto2019_dinamico',
    IDENA_DYNORTHOPHOTO2018: 'ortofoto2018_dinamico',
    IDENA_DYNORTHOPHOTO2017: 'ortofoto2017_dinamico',
    IDENA_DYNORTHOPHOTO2014: 'ortofoto2014_dinamico',
    IDENA_DYNORTHOPHOTO2012: 'ortofoto2012_dinamico',
    IDENA_PAMPLONA_DYNORTHOPHOTO2020: 'ortofoto_pamplona2020_dinamico',
    IDENA_PAMPLONA_DYNCARTO: 'cartografia_pamplona_dinamico',
    IDENA_DYNCARTO: 'cartografia_dinamico',
    IDENA_BW_RELIEF: 'relieve_bn',
    IDENA_BASEMAP_ORTHOPHOTO: 'base_orto',

    IGN_ES_CARTO: "ign-raster",
    IGN_ES_BASEMAP: "ign-base",
    IGN_ES_BASEMAP_GREY: "ign-base-gris",
    IGN_ES_RELIEF: "ign-mtn",
    IGN_ES_ORTHOPHOTO: "ign-pnoa",
    IGN_ES_LIDAR: "ign-lidar",
    IGN_ES_DYNCARTO: "ign-raster-dyn",
    IGN_ES_DYNBASEMAP: "ign-base-dyn",
    IGN_ES_DYNBASEMAP_GREY: "ign-base-gris-dyn",
    IGN_ES_DYNORTHOPHOTO: "ign-pnoa-dyn",
    IGN_ES_DYNLIDAR: "ign-lidar-dyn",

    /*
     * Identificador de la capa de cartografía raster del WMTS del Instituto Geográfico Nacional Francés. Esta capa solo es compatible con el sistema de referencia EPSG:3857.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    //IGN_FR_CARTO: "ign-fr-cartes",
    IGN_FR_BASEMAP: "ign-fr-base",
    IGN_FR_RELIEF: "ign-fr-estompage",
    IGN_FR_ORTHOPHOTO: "ign-fr-orto",
    /*
     * Identificador de la capa de cartografía raster del WMS del Instituto Geográfico Nacional Francés.
     * @var {string}
     * @memberof SITNA.Consts.layer
     * @readonly
     */
    //IGN_FR_DYNCARTO: "ign-fr-cartes-dyn",
    IGN_FR_DYNBASEMAP: "ign-fr-base-dyn",
    IGN_FR_DYNRELIEF: "ign-fr-estompage-dyn",
    IGN_FR_DYNORTHOPHOTO: "ign-fr-orto-dyn",

    OSM: 'osm',
    OPENTOPOMAP: 'opentopomap',

    CARTO_VOYAGER: 'carto_voyager',
    CARTO_LIGHT: 'carto_light',
    CARTO_DARK: 'carto_dark',

    MAPBOX_STREETS: 'mapbox_streets',
    MAPBOX_SATELLITE: 'mapbox_satellite',

    BLANK: 'ninguno'
};
Consts.text = {
    API_ERROR: 'Error API SITNA',
    APP_ERROR: 'Error de aplicación'
};

Consts.layerType = {
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

Consts.geom = {
    POINT: 'point',
    MULTIPOINT: 'multipoint',
    POLYLINE: 'polyline',
    POLYGON: 'polygon',
    MULTIPOLYLINE: 'multipolyline',
    MULTIPOLYGON: 'multipolygon',
    CIRCLE: 'circle',
    RECTANGLE: 'rectangle',
    GEOMETRY: 'geometry'
};

Consts.dataType = {
    BOOLEAN: 'boolean',
    TINYINT: 'tinyint',
    SMALLINT: 'smallint',
    MEDIUMINT: 'mediumint',
    BIGINT: 'bigint',
    INTEGER: 'integer',
    FLOAT: 'float',
    DOUBLE: 'double',
    DECIMAL: 'decimal',
    STRING: 'string',
    DATE: 'date',
    TIME: 'time',
    DATETIME: 'datetime'
}

Consts.searchType = {
    CADASTRALPARCEL: 'cadastralParcel',
    COORDINATES: 'coordinates',
    MUNICIPALITY: 'municipality',
    COUNCIL: 'council',
    TOWN: 'town',
    STREET: 'street',
    POSTALADDRESS: 'postalAddress',
    COMMONWEALTH: 'commonwealth',
    ROAD: 'road',
    ROADMILESTONE: 'roadMilestone',
    PLACENAME: 'placeName',
    PLACENAMEMUNICIPALITY: 'placeNameMunicipality'
};
Consts.mapSearchType = {
    MUNICIPALITY: Consts.searchType.MUNICIPALITY,
    COUNCIL: Consts.searchType.COUNCIL,
    TOWN: Consts.searchType.TOWN,
    COMMONWEALTH: Consts.searchType.COMMONWEALTH,
    GENERIC: 'generic'
};
Consts.comparison = {
    EQUAL_TO: '==',
    NOT_EQUAL_TO: '!=',
    LESS_THAN: '<',
    GREATER_THAN: '>',
    LESS_THAN_EQUAL_TO: '=<',
    GREATER_THAN_EQUAL_TO: '>=',
    LIKE: 'is'
};
Consts.logicalOperator = {
    AND: 'and',
    OR: 'or'
};
Consts.WMTSEncoding = {
    KVP: 'KVP',
    RESTFUL: 'RESTful'
};

Consts.mimeType = {
    PNG: 'image/png',
    JPEG: 'image/jpeg',
    JSON: 'application/json',
    GEOJSON: 'application/vnd.geo+json',
    KML: 'application/vnd.google-earth.kml+xml',
    KMZ: 'application/vnd.google-earth.kmz',
    GML: 'application/gml+xml',
    GPX: 'application/gpx+xml',
    XML: 'application/xml',
    GEOPACKAGE: 'application/geopackage+sqlite3',
    SHAPEFILE: 'x-gis/x-shapefile',
    ZIP: 'application/x-zip'
};

Consts.format = {
    JSON: 'JSON',
    KML: 'KML',
    KMZ: 'KMZ',
    GML: 'GML',
    GML2: 'GML2',
    GML3: 'GML3',
    GML32: 'GML32',
    GEOJSON: 'GeoJSON',
    TOPOJSON: 'TopoJSON',
    GPX: 'GPX',
    WKT: 'WKT',
    WKB: 'WKB',
    SHAPEFILE: 'SHP',
    ZIP: 'ZIP',
    GEOPACKAGE: 'GPKG'
};

//enumerado de errores y warninqs derivados de descargas, getfeatures
Consts.WFSErrors = {
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

Consts.visibility = {
    NOT_VISIBLE: 0,
    NOT_VISIBLE_AT_RESOLUTION: 1,
    HAS_VISIBLE: 2,
    VISIBLE: 4
};

Consts.view = {
    DEFAULT: 0,
    THREED: 1,
    PRINTING: 2
};

Consts.units = {
    DEGREES: "degrees",
    METERS: "m"
};

Consts.MARKER = 'marker';

Consts.infoContainer = {
    POPUP: 'popup',
    RESULTS_PANEL: 'resultsPanel'
};

Consts.DownloadError = {
    MIMETYPE_NOT_SUPORTED: "MimeTypeNotSupported"
};

export default Consts;
import TC from '../TC';
import Consts from './Consts';
import Util from './Util';

TC.Util = Util;

/**
 * Opciones de configuración del mapa. Para más información de como usar objetos de este tipo, consultar {@tutorial 2-configuration}.
 * @typedef MapOptions
 * @memberof SITNA
 * @see 2-configuration
 * @property {LayerOptions[]|string[]} [baseLayers=[SITNA.Consts.layer.IDENA_BASEMAP]{@link SITNA.Consts}, 
 * [SITNA.Consts.layer.IDENA_ORTHOPHOTO]{@link SITNA.Consts}, [SITNA.Consts.layer.IDENA_CADASTER]{@link SITNA.Consts}, 
 * [SITNA.Consts.layer.IDENA_CARTO]{@link SITNA.Consts}] - Lista con cualquier combinación de objetos de definición de capa o de identificadores de capas de la API SITNA
 * (miembros de [SITNA.Consts.layer]{@link SITNA.Consts}) para incluir dichas capas como mapas de fondo.
 * @property {SITNA.control.MapControlOptions} [controls] - Opciones de controles de mapa, define qué controles se incluyen en un mapa y qué opciones se pasan a cada control.     
 * @property {string} [crossOrigin] - Valor del atributo `crossorigin` de las imágenes del mapa para habilitar CORS. Es necesario establecer esta opción para poder utilizar el método {@link SITNA.Map#exportImage}.
 *
 * Los valores soportados son `anonymous` y `use-credentials`. Para más información, consulte [la documentación de MDN Web Docs](https://developer.mozilla.org/es/docs/Web/HTML/CORS_enabled_image).
 * @property {string} [crs=["EPSG:25830"]{@link https://epsg.io/25830}] - Código EPSG del sistema de referencia de coordenadas del mapa.
 * @property {string} [defaultBaseLayer=[SITNA.Consts.layer.IDENA_BASEMAP]{@link SITNA.Consts}] - Identificador de la capa base por defecto o índice de la capa base por defecto en la lista de capas base del mapa (Definida con la propiedad `baseLayers`).
 * @property {number[]} [initialExtent=[541084.221, 4640788.225, 685574.4632, 4796618.764]] - Extensión inicial del mapa definida por x mínima, y mínima, x máxima, y máxima, en las unidades del sistema de referencia de coordenadas del mapa (Ver propiedad `crs`). Por defecto la extensión es la de Navarra.
 * @property {string|SITNA.LayoutOptions} [layout="//sitna.navarra.es/api/layout/responsive"] - URL de la carpeta de maquetación u objeto de opciones de maquetación. Para prescindir de maquetación, establecer esta propiedad a `null`. Para más información al respecto de esta propiedad,
 * consulte el tutorial {@tutorial layout_cfg}.
 * @property {string} [locale="es-ES"] - Código de idioma de la interfaz de usuario. Este código debe obedecer la sintaxis definida por la IETF. Los valores posibles son `es-ES`, `eu-ES` y `en-US`.
 * @property {number[]|boolean} [maxExtent=false] - Extensión máxima del mapa definida por x mínima, y mínima, x máxima, y máxima, de forma que el centro del mapa nunca saldrá fuera de estos límites. 
 * Estos valores deben estar en las unidades definidas por el sistema de referencia de coordenadas del mapa (Ver propiedad `crs`).
 *
 * Si en vez de un array el valor es `false`, el mapa no tiene limitada la extensión máxima.
 * @property {boolean} [mouseWheelZoom=true] - Si se establece a un valor verdadero, la rueda de scroll del ratón se puede utilizar para hacer zoom en el mapa.
 * @property {boolean} [stateful=false] - Si se establece a un valor verdadero, el mapa mantiene un historial de estados 
 * añadiendo a la URL de la aplicación que lo contiene un código _hash_.
 * 
 * Con esta opción activa, el mapa puede pasar al estado previo o siguiente con los botones de historial del navegador. Así mismo, si se recarga la página el mapa conservará el estado en el que se encontraba.
 * @property {number} [pixelTolerance=10] - Tolerancia en pixels a las consultas de información de capa.
 *
 * En ciertas capas, por ejemplo las que representan geometrías de puntos, puede ser difícil pulsar precisamente en el punto donde está la entidad geográfica que interesa.
 * 
 * La propiedad `pixelTolerance` define un área de un número de pixels hacia cada lado del punto de pulsación, de forma que toda entidad geográfica que esté dentro de ese área, total o parcialmente, se incluye en el resultado de la consulta.
 * 
 * Por ejemplo, si el valor establecido es 10, toda entidad geográfica que esté dentro de un cuadrado de 21 pixels de lado (10 pixels por cuadrante más el pixel central) 
 * centrado en el punto de pulsación se mostrará en el resultado. A tener en cuenta: Esta propiedad establece el valor de los llamados *parámetros de vendedor* 
 * que los servidores de mapas admiten para modificar el comportamiento de las peticiones `getFeatureInfo` del standard WMS. Pero este comportamiento puede ser modificado también por otras circunstancias, 
 * como los estilos aplicados a las capas en el servidor.
 * 
 * Como estas circunstancias están fuera del ámbito de alcance de esta API, es posible que los resultados obtenidos desde algún servicio WMS sean inesperados en lo referente a `pixelTolerance`.
 * @property {string} [proxy] - URL del proxy utilizado para peticiones a dominios remotos.
 * 
 * Debido a restricciones de seguridad implementadas en Javascript, a través de `XMLHttpRequest` no es posible obtener información de dominios distintos al de la página web.
 * 
 * Hay dos maneras de solventar esta restricción. La primera es que el servidor remoto permita el acceso entre dominios estableciendo la cabecera `Access-Control-Allow-Origin` a la respuesta HTTP. 
 * Dado que esta solución la implementan terceras personas (los administradores del dominio remoto), no siempre es aplicable.
 * 
 * La segunda solución es desplegar en el dominio propio un proxy. Un proxy es un servicio que recibe peticiones HTTP y las redirige a otra URL.
 * 
 * Si la propiedad `proxy` está establecida, todas las peticiones a dominios remotos las mandará al proxy para que este las redirija. 
 * De esta manera no infringimos las reglas de seguridad de JavaScript, dado que el proxy está alojado en el dominio propio.
 * @property {SITNA.layer.StyleOptions} [styles] - Opciones de estilo de las entidades geográficas.
 * @property {SITNA.MapViewOptions} [views] - Opciones de vistas de mapa, define qué vistas estarán disponibles para conmutar entre el mapa y las vistas adicionales configuradas aquí, y qué opciones se pasan a cada vista. Actualmente, únicamente existe la opción de configurar la vista `threed` que gestiona el control `threed` de {@link SITNA.control.MapControlOptions}.
 * @property {LayerOptions[]} [workLayers] - Lista de objetos de definición de capa para incluir dichas capas como contenido activo del mapa.
 */

const Defaults = (function () {

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
        acceptedBrowserVersions: [],

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

        locale: 'es-ES',

        view: Consts.view.DEFAULT,

        screenSize: 27,
        pixelTolerance: 10, // Used in GFI requests
        maxResolutionError: 0.01, // Max error ratio to consider two resolutions equivalent

        toastDuration: 5000,

        averageTileSize: 31000,

        availableBaseLayers: [
            {
                id: Consts.layer.IDENA_BASEMAP,
                title: 'Mapa base',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830extended',
                layerNames: 'mapabase',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/png',
                isDefault: true,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-basemap.png',
                fallbackLayer: Consts.layer.IDENA_DYNBASEMAP,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_BASEMAP_GREY,
                title: 'Mapa base gris',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830extended',
                layerNames: 'mapaBaseGris',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-basemap-grey.png',
                fallbackLayer: Consts.layer.IDENA_DYNBASEMAP_GREY,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_ORTHOPHOTO,
                title: 'Ortofoto máxima actualidad',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830',
                layerNames: 'ortofoto_maxima_actualidad',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-orthophoto.jpg',
                fallbackLayer: Consts.layer.IDENA_DYNORTHOPHOTO,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_ORTHOPHOTO2022,
                title: 'Ortofoto 2022',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830',
                layerNames: 'ortofoto2022',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2022.jpg',
                fallbackLayer: Consts.layer.IDENA_DYNORTHOPHOTO2022,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_ORTHOPHOTO2021,
                title: 'Ortofoto 2021',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830',
                layerNames: 'ortofoto2021',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2021.jpg',
                fallbackLayer: Consts.layer.IDENA_DYNORTHOPHOTO2021,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_ORTHOPHOTO2020,
                title: 'Ortofoto 2020',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830',
                layerNames: 'ortofoto2020',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2020.jpg',
                fallbackLayer: Consts.layer.IDENA_DYNORTHOPHOTO2020,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_ORTHOPHOTO2019,
                title: 'Ortofoto 2019',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830',
                layerNames: 'ortofoto2019',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2019.jpg',
                fallbackLayer: Consts.layer.IDENA_DYNORTHOPHOTO2019,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_ORTHOPHOTO2018,
                title: 'Ortofoto 2018',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830',
                layerNames: 'ortofoto2018',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2018.jpg',
                fallbackLayer: Consts.layer.IDENA_DYNORTHOPHOTO2018,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_ORTHOPHOTO2017,
                title: 'Ortofoto 2017',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830',
                layerNames: 'ortofoto2017',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2017.jpg',
                fallbackLayer: Consts.layer.IDENA_DYNORTHOPHOTO2017,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_ORTHOPHOTO2014,
                title: 'Ortofoto 2014',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830reduced',
                layerNames: 'ortofoto2014',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2014.jpg',
                fallbackLayer: Consts.layer.IDENA_DYNORTHOPHOTO2014,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_ORTHOPHOTO2012,
                title: 'Ortofoto 2012',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830',
                layerNames: 'ortofoto2012',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2012.jpg',
                fallbackLayer: Consts.layer.IDENA_DYNORTHOPHOTO2012,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_PAMPLONA_ORTHOPHOTO2020,
                title: 'Ortofoto comarca de Pamplona 2020',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830deep',
                layerNames: 'ortofotoPamplona2020',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho-pamplona2020.jpg',
                fallbackLayer: Consts.layer.IDENA_PAMPLONA_DYNORTHOPHOTO2020,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_CARTO,
                title: 'Cartografía topográfica',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830extended',
                layerNames: 'mapaTopografico',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-bta.png',
                fallbackLayer: Consts.layer.IDENA_DYNCARTO,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_PAMPLONA_CARTO,
                title: 'Cartografía topográfica Pamplona',
                type: Consts.layerType.WMTS,
                url: '//idena.navarra.es/ogc/wmts/',
                matrixSet: 'epsg25830deep',
                layerNames: 'mapaTopograficoPamplona',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-topo-pamplona.jpg',
                fallbackLayer: Consts.layer.IDENA_PAMPLONA_DYNCARTO,
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_CADASTER,
                title: 'Catastro',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'catastro,regionesFronterizas',
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-cadaster.png',
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_BW_RELIEF,
                title: 'Relieve',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'IDENA:mapa_relieve_bn',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-relief_bw.jpg',
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_BASEMAP_ORTHOPHOTO,
                title: 'Mapa base/ortofoto',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'mapaBase_orto',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-base_ortho.png',
                overviewMapLayer: Consts.layer.IDENA_BASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNBASEMAP,
                title: 'Mapa base',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'mapaBase,regionesFronterizas',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-basemap.png',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNBASEMAP_GREY,
                title: 'Mapa base gris',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'mapaBaseGris,regionesFronterizas',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-basemap-grey.png',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNORTHOPHOTO,
                title: 'Ortofoto máxima actualidad',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'ortofoto_maxima_actualidad',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-orthophoto.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNORTHOPHOTO2022,
                title: 'Ortofoto 2022',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'ortofoto_5000_2022',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2022.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNORTHOPHOTO2021,
                title: 'Ortofoto 2021',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'ortofoto_5000_2021',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2021.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNORTHOPHOTO2020,
                title: 'Ortofoto 2020',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'ortofoto_5000_2020',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2020.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNORTHOPHOTO2019,
                title: 'Ortofoto 2019',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'ortofoto_5000_2019',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2019.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNORTHOPHOTO2018,
                title: 'Ortofoto 2018',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'ortofoto_5000_2018',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2018.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNORTHOPHOTO2017,
                title: 'Ortofoto 2017',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'ortofoto_5000_2017',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2017.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNORTHOPHOTO2014,
                title: 'Ortofoto 2014',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'ortofoto_5000_2014',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2014.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNORTHOPHOTO2012,
                title: 'Ortofoto 2012',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'ortofoto_5000_2012',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho2012.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_PAMPLONA_DYNORTHOPHOTO2020,
                title: 'Ortofoto comarca de Pamplona 2020',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'ortofoto_500_Pamplona_2020',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-ortho-pamplona2020.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_DYNCARTO,
                title: 'Cartografía topográfica 2017',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'MTNa5_BTA',
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-bta.png',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IDENA_PAMPLONA_DYNCARTO,
                title: 'Cartografía topográfica Pamplona',
                type: Consts.layerType.WMS,
                url: '//idena.navarra.es/ogc/wms',
                layerNames: 'MTNa05_BTU_201',
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-topo-pamplona.jpg',
                overviewMapLayer: Consts.layer.IDENA_DYNBASEMAP
            },
            {
                id: Consts.layer.IGN_ES_CARTO,
                type: Consts.layerType.WMTS,
                title: "Cartografía raster \r\n (IGN ES)",
                url: "//www.ign.es/wmts/mapa-raster",
                encoding: Consts.WMTSEncoding.KVP,
                layerNames: "MTN",
                matrixSet: "EPSG:25830",
                format: "image/jpeg",
                thumbnail: TC.apiLocation + "css/img/thumb-carto_ign.png",
                fallbackLayer: Consts.layer.IGN_ES_DYNCARTO,
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            {
                id: Consts.layer.IGN_ES_BASEMAP,
                title: "Callejero \r\n (IGN ES)",
                type: Consts.layerType.WMTS,
                url: "//www.ign.es/wmts/ign-base",
                encoding: Consts.WMTSEncoding.KVP,
                layerNames: "IGNBaseTodo",
                matrixSet: "EPSG:25830",
                format: "image/jpeg",
                thumbnail: TC.apiLocation + "css/img/thumb-basemap_ign.png",
                fallbackLayer: Consts.layer.IGN_ES_DYNBASEMAP,
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            {
                id: Consts.layer.IGN_ES_BASEMAP_GREY,
                title: "Callejero gris \r\n (IGN ES)",
                type: Consts.layerType.WMTS,
                url: "//www.ign.es/wmts/ign-base",
                encoding: Consts.WMTSEncoding.KVP,
                layerNames: "IGNBase-gris",
                matrixSet: "GoogleMapsCompatible",
                format: "image/jpeg",
                thumbnail: TC.apiLocation + "css/img/thumb-basemap_grey_ign.png",
                fallbackLayer: Consts.layer.IGN_ES_DYNBASEMAP_GREY,
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            {
                id: Consts.layer.IGN_ES_RELIEF,
                title: "Relieve \r\n (IGN ES)",
                type: Consts.layerType.WMTS,
                url: "//servicios.idee.es/wmts/mdt",
                encoding: Consts.WMTSEncoding.KVP,
                layerNames: "Relieve",
                matrixSet: "EPSG:25830",
                format: "image/jpeg",
                thumbnail: TC.apiLocation + "css/img/thumb-relief_ign.jpg",
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            {
                id: Consts.layer.IGN_ES_ORTHOPHOTO,
                title: "Ortofoto PNOA",
                type: Consts.layerType.WMTS,
                url: "//www.ign.es/wmts/pnoa-ma",
                encoding: Consts.WMTSEncoding.KVP,
                layerNames: "OI.OrthoimageCoverage",
                matrixSet: "EPSG:25830",
                format: "image/jpeg",
                thumbnail: TC.apiLocation + "css/img/thumb-orthophoto_pnoa.jpg",
                fallbackLayer: Consts.layer.IGN_ES_DYNORTHOPHOTO,
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            {
                id: Consts.layer.IGN_ES_LIDAR,
                title: "Modelo digital LIDAR (IGN ES)",
                type: Consts.layerType.WMTS,
                url: "//wmts-mapa-lidar.idee.es/lidar",
                encoding: Consts.WMTSEncoding.KVP,
                layerNames: "EL.GridCoverageDSM",
                matrixSet: "GoogleMapsCompatible",
                format: "image/png",
                thumbnail: TC.apiLocation + "css/img/thumb-lidar_ign.jpg",
                fallbackLayer: Consts.layer.IGN_ES_DYNLIDAR,
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            {
                id: Consts.layer.IGN_ES_DYNBASEMAP,
                title: 'Callejero \r\n (IGN ES)',
                type: Consts.layerType.WMS,
                url: '//www.ign.es/wms-inspire/ign-base',
                layerNames: 'IGNBaseTodo',
                thumbnail: TC.apiLocation + 'css/img/thumb-basemap_ign.png',
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            {
                id: Consts.layer.IGN_ES_DYNBASEMAP_GREY,
                title: 'Callejero gris \r\n (IGN ES)',
                type: Consts.layerType.WMS,
                url: '//www.ign.es/wms-inspire/ign-base',
                layerNames: 'IGNBaseTodo-gris',
                thumbnail: TC.apiLocation + 'css/img/thumb-basemap_grey_ign.png',
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            {
                id: Consts.layer.IGN_ES_DYNORTHOPHOTO,
                title: 'Ortofoto PNOA',
                type: Consts.layerType.WMS,
                url: '//www.ign.es/wms-inspire/pnoa-ma',
                layerNames: 'OI.OrthoimageCoverage',
                thumbnail: TC.apiLocation + 'css/img/thumb-orthophoto_pnoa.jpg',
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            {
                id: Consts.layer.IGN_ES_DYNCARTO,
                title: 'Cartografía raster \r\n (IGN ES)',
                type: Consts.layerType.WMS,
                url: '//www.ign.es/wms-inspire/mapa-raster',
                layerNames: 'mtn_rasterizado',
                thumbnail: TC.apiLocation + 'css/img/thumb-carto_ign.png',
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            {
                id: Consts.layer.IGN_ES_DYNLIDAR,
                title: 'Modelo digital LIDAR (IGN ES)',
                type: Consts.layerType.WMS,
                url: '//wms-mapa-lidar.idee.es/lidar',
                layerNames: 'EL.GridCoverage',
                thumbnail: TC.apiLocation + "css/img/thumb-lidar_ign.jpg",
                overviewMapLayer: Consts.layer.IGN_ES_BASEMAP
            },
            /*{
                id: Consts.layer.IGN_FR_CARTO,
                title: "Cartografía raster \r\n (IGN FR)",
                type: Consts.layerType.WMTS,
                url: "//wxs.ign.fr/njfzwf3vgc55gekk8ra4zezx/geoportail/wmts",
                encoding: Consts.WMTSEncoding.KVP,
                layerNames: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
                matrixSet: "PM",
                format: "image/jpeg",
                thumbnail: TC.apiLocation + "css/img/thumb-carto-fr-ign.png",
                fallbackLayer: Consts.layer.IGN_FR_DYNCARTO,
                ignoreProxification: true,
                overviewMapLayer: Consts.layer.IGN_FR_BASEMAP
            },*/
            {
                id: Consts.layer.IGN_FR_BASEMAP,
                title: "Mapa base \r\n (IGN FR)",
                type: Consts.layerType.WMTS,
                url: "//wxs.ign.fr/essentiels/geoportail/wmts",
                encoding: Consts.WMTSEncoding.KVP,
                layerNames: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
                matrixSet: "PM",
                format: "image/png",
                thumbnail: TC.apiLocation + "css/img/thumb-base-fr-ign.png",
                fallbackLayer: Consts.layer.IGN_FR_DYNBASEMAP,
                ignoreProxification: true,
                overviewMapLayer: Consts.layer.IGN_FR_BASEMAP
            },
            {
                id: Consts.layer.IGN_FR_RELIEF,
                title: "Relieve \r\n (IGN FR)",
                type: Consts.layerType.WMTS,
                url: "//wxs.ign.fr/altimetrie/geoportail/wmts",
                encoding: Consts.WMTSEncoding.KVP,
                layerNames: "ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW",
                matrixSet: "PM",
                format: "image/png",
                thumbnail: TC.apiLocation + "css/img/thumb-estom-fr-ign.jpg",
                fallbackLayer: Consts.layer.IGN_FR_DYNRELIEF,
                ignoreProxification: true,
                overviewMapLayer: Consts.layer.IGN_FR_BASEMAP
            },
            {
                id: Consts.layer.IGN_FR_ORTHOPHOTO,
                title: "Ortofoto \r\n (IGN FR)",
                type: Consts.layerType.WMTS,
                url: "//wxs.ign.fr/essentiels/geoportail/wmts",
                encoding: Consts.WMTSEncoding.KVP,
                layerNames: "ORTHOIMAGERY.ORTHOPHOTOS",
                matrixSet: "PM",
                format: "image/jpeg",
                thumbnail: TC.apiLocation + "css/img/thumb-ortho-fr-ign.jpg",
                fallbackLayer: Consts.layer.IGN_FR_DYNORTHOPHOTO,
                ignoreProxification: true,
                overviewMapLayer: Consts.layer.IGN_FR_BASEMAP
            },
            /*{
                id: Consts.layer.IGN_FR_DYNCARTO,
                title: 'Cartografía raster \r\n (IGN FR)',
                type: Consts.layerType.WMS,
                url: "//wxs.ign.fr/njfzwf3vgc55gekk8ra4zezx/geoportail/r/wms",
                layerNames: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
                thumbnail: TC.apiLocation + "tc/css/img/thumb-carto-fr-ign.png",
                ignoreProxification: true,
                overviewMapLayer: Consts.layer.IGN_FR_BASEMAP
            },*/
            {
                id: Consts.layer.IGN_FR_DYNBASEMAP,
                title: 'Mapa base \r\n (IGN FR)',
                type: Consts.layerType.WMS,
                url: "//wxs.ign.fr/essentiels/geoportail/r/wms",
                layerNames: "GEOGRAPHICALGRIDSYSTEMS.PLANIGN",
                thumbnail: TC.apiLocation + "css/img/thumb-base-fr-ign.png",
                ignoreProxification: true,
                overviewMapLayer: Consts.layer.IGN_FR_BASEMAP
            },
            {
                id: Consts.layer.IGN_FR_DYNRELIEF,
                title: 'Relieve \r\n (IGN FR)',
                type: Consts.layerType.WMS,
                url: "//wxs.ign.fr/altimetrie/geoportail/r/wms",
                layerNames: "ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW",
                thumbnail: TC.apiLocation + "css/img/thumb-estom-fr-ign.jpg",
                ignoreProxification: true,
                overviewMapLayer: Consts.layer.IGN_FR_BASEMAP
            },
            {
                id: Consts.layer.IGN_FR_DYNORTHOPHOTO,
                title: 'Ortofoto \r\n (IGN FR)',
                type: Consts.layerType.WMS,
                url: "//wxs.ign.fr/essentiels/geoportail/r/wms",
                layerNames: "ORTHOIMAGERY.ORTHOPHOTOS",
                thumbnail: TC.apiLocation + "css/img/thumb-ortho-fr-ign.jpg",
                ignoreProxification: true,
                overviewMapLayer: Consts.layer.IGN_FR_BASEMAP
            },
            {
                id: Consts.layer.OSM,
                title: 'OSM',
                type: Consts.layerType.WMTS,
                url: TC.apiLocation + 'wmts/osm/',
                matrixSet: 'WorldWebMercatorQuad',
                layerNames: 'osm',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-osm.png',
                overviewMapLayer: Consts.layer.OSM
            },
            {
                id: Consts.layer.OPENTOPOMAP,
                title: 'OpenTopoMap',
                type: Consts.layerType.WMTS,
                url: TC.apiLocation + 'wmts/opentopomap/',
                matrixSet: 'WorldWebMercatorQuad',
                layerNames: 'opentopomap',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-opentopomap.png',
                overviewMapLayer: Consts.layer.OSM
            },
            {
                id: Consts.layer.CARTO_VOYAGER,
                title: 'CARTO Voyager',
                type: Consts.layerType.WMTS,
                url: TC.apiLocation + 'wmts/carto/',
                matrixSet: 'WorldWebMercatorQuad',
                layerNames: 'voyager',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-carto-voyager.png',
                overviewMapLayer: Consts.layer.CARTO_VOYAGER
            },
            {
                id: Consts.layer.CARTO_LIGHT,
                title: 'CARTO light',
                type: Consts.layerType.WMTS,
                url: TC.apiLocation + 'wmts/carto/',
                matrixSet: 'WorldWebMercatorQuad',
                layerNames: 'light_all',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-carto-light.png',
                overviewMapLayer: Consts.layer.CARTO_VOYAGER
            },
            {
                id: Consts.layer.CARTO_DARK,
                title: 'CARTO dark',
                type: Consts.layerType.WMTS,
                url: TC.apiLocation + 'wmts/carto/',
                matrixSet: 'WorldWebMercatorQuad',
                layerNames: 'dark_all',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-carto-dark.png',
                overviewMapLayer: Consts.layer.CARTO_VOYAGER
            },
            {
                id: Consts.layer.MAPBOX_STREETS,
                title: 'Mapbox Streets',
                type: Consts.layerType.WMTS,
                url: TC.apiLocation + 'wmts/mapbox/',
                matrixSet: 'WorldWebMercatorQuad',
                layerNames: 'streets',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/png',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-mapbox-streets.png',
                overviewMapLayer: Consts.layer.MAPBOX_STREETS
            },
            {
                id: Consts.layer.MAPBOX_SATELLITE,
                title: 'Mapbox Satellite',
                type: Consts.layerType.WMTS,
                url: TC.apiLocation + 'wmts/mapbox/',
                matrixSet: 'WorldWebMercatorQuad',
                layerNames: 'satellite',
                encoding: Consts.WMTSEncoding.RESTFUL,
                format: 'image/jpeg',
                isDefault: false,
                hideTree: true,
                thumbnail: TC.apiLocation + 'css/img/thumb-mapbox-satellite.jpg',
                overviewMapLayer: Consts.layer.MAPBOX_STREETS
            },
            {
                id: Consts.layer.BLANK,
                title: 'Mapa en blanco',
                type: Consts.layerType.VECTOR
            }
        ],

        baseLayers: [
            Consts.layer.IDENA_BASEMAP,
            Consts.layer.IDENA_ORTHOPHOTO,
            Consts.layer.IDENA_CADASTER,
            Consts.layer.IDENA_CARTO
        ],

        defaultBaseLayer: Consts.layer.IDENA_BASEMAP,

        workLayers: [],


        /**
        * Opciones de vistas de mapa, define qué vistas estarán disponibles para conmutar entre el mapa y las vistas adicionales configuradas aquí, y qué opciones se pasan a cada vista. Actualmente, únicamente existe la opción de configurar la vista `threed` que gestiona el control `threed` de {@link SITNA.control.MapControlOptions}.
        * @typedef MapViewOptions
        * @memberof SITNA
        * @see SITNA.MapOptions
        * @property {SITNA.ThreeDViewOptions} [threeD] - Se establece un valor *truthy* con las opciones de la vista del mapa.
        * @example <caption>Definición objeto SITNA.MapViewOptions</caption> {@lang javascript}
        *     { 
        *         threeD: { }
        *     }            
        * @example <caption>[Ver en vivo](../examples/cfg.ThreeDOptions.html)</caption> {@lang html}
        * <div id="mapa"/>
        * <div id="vista3d"/>
        * <script>
        *     // Configuración adicional de una vista en la cual se renderizará la vista 3D.
        *     SITNA.Cfg.views = { // Establecemos la propiedad `views` del mapa indicando como valor un objeto con la estructura definida en `SITNA.MapViewOptions`.
        *         threeD: { // Establecemos la propiedad `threeD` configurando como valor un objeto siguiendo la estructura de `SITNA.ThreeDViewOptions`.
        *             div: "vista3d" // Indicamos el identificador del DIV en el marcado en el cual cargar la vista 3D.
        *         }
        *     };
        * </script>
        */

        /**
         * Espacio de nombres de los controles de la interfaz de usuario.
         * @namespace SITNA.control
         */

        /**
        * Opciones de controles de mapa, define qué controles se incluyen en un mapa y qué opciones se pasan a cada control.
        * @typedef MapControlOptions
        * @memberof SITNA.control
        * @see SITNA.MapOptions
        * @property {boolean|SITNA.control.ControlOptions} [attribution=true] - Si se establece a un valor *truthy*, el mapa tiene atribución. 
        * @property {boolean|SITNA.control.ControlOptions} [basemapSelector=false] - Si se establece a un valor *truthy*, el mapa tiene un selector de mapas de fondo.
        * @property {boolean|SITNA.control.ClickOptions} [click=false] - Si se establece a un valor *truthy*, el mapa tiene un control que gestiona los clics del usuario sobre su ventana de visualización.
        * La atribución es un texto superpuesto al mapa que actúa como reconocimiento de la procedencia de los datos que se muestran.
        * @property {boolean|SITNA.control.CoordinatesOptions} [coordinates=true] - Si se establece a un valor *truthy*, el mapa tiene un indicador de coordenadas y de sistema de referencia espacial.
        * @property {boolean|SITNA.control.DataLoaderOptions} [dataLoader=false] - Si se establece a un valor *truthy*,  se muestra un control para añadir datos externos, en concreto servicios WMS y archivos locales de datos geográficos.
        * 
        * Hay más información sobre el funcionamiento del control en la página de documentación de {@link DataLoaderOptions}.
        * @property {boolean|SITNA.control.TabContainerOptions} [download=false] - Si se establece a un valor *truthy*, el mapa tiene un control que permite descargar la imagen actual del mapa o las capas cargadas como un archivo de datos vectoriales.
        * Para llevar a cabo esta segunda operación, es necesario que las capas del mapa tengan asociado un servicio WFS al servicio WMS que muestra las entidades en el mapa (software como GeoServer realiza esto automáticamente).
        * El control infiere la URL del servicio WFS a partir de la [operación DescribeLayer del estándar WMS-SLD](https://docs.geoserver.org/latest/en/user/services/wms/reference.html#describelayer).
        * @property {boolean|SITNA.control.DrawMeasureModifyOptions} [drawMeasureModify=false] - Si se establece a un valor *truthy*, el mapa tiene un control para dibujar, medir y modificar geometrías en el mapa.
        * @property {boolean|SITNA.control.FeatureInfoOptions} [featureInfo=true] - Si se establece a un valor *truthy*, el mapa responde a los clics con un información de las capas cargadas de tipo WMS. Se usa para ello la petición `getFeatureInfo` del standard WMS.
        * @property {boolean|SITNA.control.ControlOptions} [fullScreen=false] - Si se establece a un valor *truthy*, el mapa incorpora un botón para activar el modo de pantalla completa.
        * @property {boolean|SITNA.control.GeolocationOptions} [geolocation=false] - Si se establece a un valor *truthy*, se muestra un control para geolocalizar y crear, visualizar y guardar rutas.
        * @property {boolean|SITNA.control.LayerCatalogOptions} [layerCatalog=false] - Si se establece a un valor *truthy*, se muestra un control para añadir capas de trabajo desde uno o varios servicios WMS.
        *
        * Este control se usa habitualmente en combinación con `workLayerManager`. Hay más información de cómo funcionan ambos controles en 
        * la página de documentación de {@link LayerCatalogOptions}.
        * @property {boolean|SITNA.control.ControlOptions} [legend=false] - Si se establece a un valor *truthy*, el mapa tiene leyenda.
        * @property {boolean|SITNA.control.ControlOptions} [loadingIndicator=true] - Si se establece a un valor *truthy*, el mapa tiene un indicador de espera de carga.
        * @property {boolean|SITNA.control.ControlOptions} [measure=false] - Si se establece a un valor *truthy*, el mapa tiene un medidor de longitudes, áreas y perímetros.
        * @property {boolean|SITNA.control.MultiFeatureInfoOptions} [multiFeatureInfo=false] - Si se establece a un valor *truthy*, el mapa incluye un control que permite la
        * obtención de información de las entidades que se intersecan con puntos, líneas o polígonos dibujados por el usuario. Para líneas y polígonos, 
        * es necesario que las capas del mapa tengan asociado un servicio WFS al servicio WMS que muestra las entidades en el mapa (software como GeoServer realiza esto automáticamente).
        * El control infiere la URL del servicio WFS a partir de la [operación DescribeLayer del estándar WMS-SLD](https://docs.geoserver.org/latest/en/user/services/wms/reference.html#describelayer).
        * @property {boolean|SITNA.control.ControlOptions} [navBar=false] - Si se establece a un valor *truthy*, el mapa tiene una barra de navegación con control de zoom.
        * @property {boolean|SITNA.control.OfflineMapMakerOptions} [offlineMapMaker=false] - Si se establece a un valor *truthy*, el mapa tiene un creador de mapas sin conexión para uso sin acceso a Internet.
        * 
        * Hay más información sobre los requisitos necesarios para el correcto funcionamiento del control en la página de documentación de
        * {@link OfflineMapMakerOptions}.
        * @property {boolean|SITNA.control.OverviewMapOptions} [overviewMap=false] - Si se establece a un valor *truthy*, el mapa tiene un mapa de situación.
        * @property {boolean|SITNA.control.ControlOptions} [popup=false] - Si se establece a un valor *truthy*, el mapa muestra los datos asociados a los marcadores cuando se pulsa sobre ellos.
        * @property {boolean|SITNA.control.PrintMapOptions} [printMap=false] - Si se establece a un valor *truthy*, se muestra una herramienta para imprimir el mapa en PDF.
        *
        * El control permite al usuario elegir entre varios tamaños de hoja y orientación horizontal o vertical, además se le puede poner un título al documento de impresión.
        * 
        * Al pulsar el botón de imprimir se abre una previsualización como paso previo a la impresión. Ahí el usuario puede realizar unos últimos ajustes a la extensión del mapa.
        * 
        * El PDF se generará al pulsar en el botón dentro de la previsualización.
        * @property {boolean|SITNA.control.ControlOptions} [scale=false] - Si se establece a un valor *truthy*, el mapa tiene un indicador numérico de escala.
        * @property {boolean|SITNA.control.ControlOptions} [scaleBar=false] - Si se establece a un valor *truthy*, el mapa tiene un indicador gráfico de escala.
        * @property {boolean|SITNA.control.ControlOptions} [scaleSelector=false] - Si se establece a un valor *truthy*, el mapa tiene un selector numérico de escala.
        * @property {boolean|SITNA.control.SearchOptions} [search=false] - Si se establece a un valor *truthy*, el mapa tiene un buscador.
        * El buscador localiza coordenadas y busca entidades geográficas tales como: municipios, cascos urbanos, vías, portales, topónimos, topónimos por municipio, carreteras, puntos kilométricos y parcelas catastrales de IDENA. 
        * Es posible establecer un origen de datos distinto a IDENA en el que buscar, consultar en {@link SearchOptions}.
        * @property {boolean|SITNA.control.ControlOptions} [share=false] - Si se establece a un valor *truthy*, el mapa tiene un control para compartir mapas por distintos canales.
        * 
        * Para que el control funcione correctamente, hay que establecer un valor verdadero a la opción `stateful` del mapa (Ver {@link SITNA.MapOptions}).
        * @property {boolean|SITNA.control.StreetViewOptions} [streetView=true] - Si se establece a un valor *truthy*, el usuario podrá abrir una ventana de Google StreetView en la ubicación seleccionada en el mapa.
        * @property {boolean} [threed=false] - Si se establece a true, el mapa incorpora un botón para conmutar entre las vistas 2D y 3D.
        * Este control requiere de la configuración adicional de una vista en la cual se renderizará la vista 3D, para ello se deben seguir los siguientes pasos:
        *
        *    - Añadir en el marcado elemento del DOM en el cual renderizar la vista 3D.
        *    - Establecer la propiedad `views` del mapa (Ver {@link SITNA.MapOptions}) indicando como valor un objeto con la estructura definida en {@link SITNA.MapViewOptions}.
        *    - Establecer la propiedad `threeD` del objeto anterior configurando como valor un objeto siguiendo la estructura de {@link SITNA.ThreeDViewOptions}.
        *            
        * @property {boolean|SITNA.control.ControlOptions} [TOC=false] - Si se establece a un valor *truthy*, el mapa tiene una tabla de contenidos mostrando las capas de trabajo y los grupos de marcadores.
        * Los controles `TOC` y `workLayerManager` realizan varias funciones comunes, así rara vez será necesario tener los dos a la vez en un visor.
        * @property {boolean|SITNA.control.WFSEditOptions} [WFSEdit=false] - Si se establece a un valor *truthy*, se añade un control para editar las entidades de las capas vectoriales de tipo [WFS]{@link SITNA.Consts} o de las
        * capas de tipo [WMS]{@link SITNA.Consts} si estas tienen asociado un servicio WFS. Con este control se pueden crear, modificar y eliminar entidades. Las modificaciones pueden ser de geometría o de atributos.
        * @property {boolean|SITNA.control.WFSQueryOptions} [WFSQuery=false] - Si se establece a un valor *truthy*, desde el control `workLayerManager` se pueden hacer consultas alfanuméricas a las capas del mapa.
        * @property {boolean|SITNA.control.ControlOptions} [workLayerManager=false] - Si se establece a un valor *truthy*, se muestra un control para consultar y gestionar las capas de trabajo que están cargadas en el mapa.
        * Con este control se dispone de las siguientes funcionalidades: 
        * 
        *    - Consultar qué capas están cargadas en el mapa
        *    - Ver en qué orden están superpuestas y modificar ese orden
        *    - Comprobar si una capa es visible al nivel de zoom actual
        *    - Activar y desactivar la visibilidad de las capas
        *    - Establecer el grado de transparencia de cada capa
        *    - Borrar capas cargadas
        *    - Consultar metadatos asociados a la capa
        *    - Si está también el control `WFSQuery`, ejecutar consultas alfanuméricas sobre las capas cargadas en el mapa, si cuentan con un servicio WFS pareado al WMS.
        * 
        * Los controles `workLayerManager` y `TOC` realizan varias funciones comunes, así rara vez será necesario tener los dos a la vez en un visor.
        * @example <caption>Ejemplo de uso de propiedad `featureInfo` - [Ver en vivo](../examples/cfg.MapControlOptions.featureInfo.html)</caption> {@lang html}
        * <div id="mapa"></div>
        * <script>
        *     // Añadimos el control featureInfo.
        *     SITNA.Cfg.controls.featureInfo = true;
        *     // Añadimos una capa WMS sobre la que hacer las consultas.
        *     SITNA.Cfg.workLayers = [
        *         {
        *             id: "terremotos",
        *             title: "Terremotos últimos 365 días",
        *             type: SITNA.Consts.layerType.WMS,
        *             url: "https://www.ign.es/wms-inspire/geofisica",
        *             layerNames: ["Ultimos365dias"]
        *         }
        *     ];
        *     var map = new SITNA.Map("mapa");
        * </script>
        * @example <caption>Ejemplo de uso de propiedad `fullScreen` - [Ver en vivo](../examples/cfg.MapControlOptions.fullScreen.html)</caption> {@lang html}
        * <div id="mapa"></div>
        * <script>
        *     // Añadimos el control fullScreen.
        *     SITNA.Cfg.controls.fullScreen = true;
        *     var map = new SITNA.Map("mapa");
        * </script>
        * @example <caption>Ejemplo de uso de propiedad `printMap` - [Ver en vivo](../examples/cfg.MapControlOptions.printMap.html)</caption> {@lang html}
        * <div id="mapa"></div>
        * <script>
        *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
        *     SITNA.Cfg.layout = "layout/ctl-container";
        *     // Añadimos el control de impresión en el primer contenedor.
        *     SITNA.Cfg.controls.printMap = {
        *         div: "slot1"
        *     };
        *     var map = new SITNA.Map("mapa");
        * </script>
        * @example <caption>Ejemplo de uso de propiedad `share` - [Ver en vivo](../examples/cfg.MapControlOptions.share.html)</caption> {@lang html}
        * <div id="mapa"></div>
        * <script>
        *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
        *     SITNA.Cfg.layout = "layout/ctl-container";
        *     // Establecemos el mapa con estado (necesario para añadir el control de compartir)
        *     SITNA.Cfg.stateful = true;
        *     // Añadimos el control de mapas de fondo en el primer contenedor.
        *     SITNA.Cfg.controls.basemapSelector = {
        *         div: "slot1"
        *     };
        *     // Añadimos el control de compartir en el segundo contenedor.
        *     SITNA.Cfg.controls.share = {
        *         div: "slot2"
        *     };
        *     var map = new SITNA.Map("mapa");
        * </script>
        * @example <caption>Ejemplo de uso de propiedad `workLayerManager` - [Ver en vivo](../examples/cfg.MapControlOptions.workLayerManager.html)</caption> {@lang html}
        * <div id="mapa"></div>
        * <script>
        *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
        *     SITNA.Cfg.layout = "layout/ctl-container";
        *     // Añadimos el control de capas cargadas en la primera posición.
        *     SITNA.Cfg.controls.workLayerManager = {
        *         div: "slot1"
        *     };
        *     // Añadimos tres capas WMS.
        *     SITNA.Cfg.workLayers = [
        *         {
        *             id: "relieve",
        *             type: SITNA.Consts.layerType.WMS,
        *             url: "//idena.navarra.es/ogc/wms",
        *             layerNames: ["IDENA:mapa_relieve_bn"]
        *         },
        *         {
        *             id: "pefc",
        *             type: SITNA.Consts.layerType.WMS,
        *             url: "//idena.navarra.es/ogc/wms",
        *             layerNames: ["IDENA:FOREST_Pol_MontesPEFC"]
        *         },
        *         {
        *             id: "pistas",
        *             type: SITNA.Consts.layerType.WMS,
        *             url: "//idena.navarra.es/ogc/wms",
        *             layerNames: ["IDENA:FOREST_Lin_PistasForP"]
        *         }
        *     ];
        *     var map = new SITNA.Map("mapa");
        * </script>
        */
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
            workLayerManager: false,
            layerCatalog: false,
            coordinates: true,
            legend: false,
            popup: false,
            search: {
                url: 'https://idena.navarra.es/ogc/wfs',
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
            streetView: false,
            click: false,
            printMap: false,
            featureInfo: {
                active: true,
                persistentHighlights: true
            },
            featureTools: true
        },

        layout: null,
        /**
        * Opciones de estilo de trazo.
        * @typedef StrokeStyleOptions
        * @memberof SITNA.feature
        * @mixin
        * @property {string} [strokeColor] - Color de trazo de línea, representado en formato hex triplet (`#RRGGBB`).
        * @property {number} [strokeOpacity] - Opacidad de trazo de línea, valor en el rango de 0 (tranparente) a 1 (opaco).
        * @property {number} [strokeWidth] - Anchura de trazo en píxeles del trazo de la línea.
        * @see SITNA.feature.PointStyleOptions
        * @see SITNA.feature.PolylineStyleOptions
        * @see SITNA.feature.PolygonStyleOptions
        */

        /**
         * Opciones de estilo de relleno.
         * @typedef FillStyleOptions
         * @memberof SITNA.feature
         * @mixin
         * @property {string} [fillColor] - Color de relleno, representado en formato hex triplet (`#RRGGBB`).
         * @property {number} [fillOpacity] - Opacidad de relleno, valor en el rango de 0 (tranparente) a 1 (opaco).
         * @see SITNA.feature.PointStyleOptions
         * @see SITNA.feature.PolygonStyleOptions
         */

        /**
         * Opciones de estilo de etiqueta.
         * @typedef LabelStyleOptions
         * @memberof SITNA.feature
         * @mixin
         * @property {string} [labelRotationKey] - Nombre del campo del cual extraer la rotación a aplicar a la etiqueta. El valor tiene que estar en grados.
         * @property {string} [fontColor="#000000"] - Color del texto de la etiqueta descriptiva de la entidad geográfica, representado en formato hex triplet (`#RRGGBB`).
         * @property {number} [fontSize=10] - Tamaño en puntos tipográficos (`pt`) de la fuente del texto de la etiqueta descriptiva de la entidad geográfica.
         * @property {string} [labelOutlineColor="#ffffff"] - Color del contorno del texto de la etiqueta descriptiva de la entidad geográfica, representado en formato hex triplet (`#RRGGBB`).
         * @property {number} [labelOutlineWidth=2] - Anchura en píxeles del trazo del contorno del texto de la etiqueta.
         * @see SITNA.feature.PointStyleOptions
         * @see SITNA.feature.PolylineStyleOptions
         * @see SITNA.feature.PolygonStyleOptions
         */

        /**
        * Opciones de estilo de entidades geográficas.
        * @typedef StyleOptions
        * @memberof SITNA.layer
        * @property {SITNA.feature.PointStyleOptions} [point] - Opciones de estilo de punto.
        * @property {SITNA.feature.PolylineStyleOptions} [line] - Opciones de estilo de línea.
        * @property {SITNA.feature.PolygonStyleOptions} [polygon] - Opciones de estilo de polígono.
        * @property {SITNA.feature.MarkerStyleOptions} [marker] - Opciones de estilo de marcador (punto de mapa con icono).
        * @property {SITNA.layer.ClusterStyleOptions} [cluster] - Opciones de estilo de cluster de puntos. Consultar la propiedad `cluster` de {@link LayerOptions} para saber cómo mostrar clusters.
        * @property {SITNA.layer.HeatmapStyleOptions} [heatmap] - Opciones de estilo de mapa de calor.
        * @see SITNA.MapOptions
        * @see SITNA.control.WFSQueryOptions
        * @see SITNA.control.CadastralSearchOptions
        * @see SITNA.control.MunicipalitySearchOptions
        * @see SITNA.control.PostalAddressSearchOptions
        * @see SITNA.control.StreetSearchOptions
        * @see SITNA.control.UrbanAreaSearchOptions
        */
        styles: {
            point: {
                fillColor: '#000000',
                fillOpacity: 0.1,
                strokeColor: '#ff0000',
                strokeWidth: 2,
                strokeOpacity: 1,
                radius: 6,
                labelOutlineWidth: 2,
                labelOutlineColor: '#ffffff',
                labelOffset: [0, -16],
                fontColor: '#000000',
                fontSize: 10
            },
            marker: {
                classes: [
                    Consts.classes.MARKER + 1,
                    Consts.classes.MARKER + 2,
                    Consts.classes.MARKER + 3,
                    Consts.classes.MARKER + 4,
                    Consts.classes.MARKER + 5
                ],
                anchor: [.5, 1],
                width: 32,
                height: 32,
                labelOutlineWidth: 2,
                labelOutlineColor: '#ffffff',
                labelOffset: [0, -32],
                fontColor: '#000000',
                fontSize: 10
            },
            line: {
                strokeColor: '#ff0000',
                strokeWidth: 2,
                strokeOpacity: 1,
                labelOutlineWidth: 2,
                labelOutlineColor: '#ffffff',
                fontColor: '#000000',
                fontSize: 10
            },
            polygon: {
                strokeColor: '#ff0000',
                strokeWidth: 2,
                strokeOpacity: 1,
                fillColor: '#000000',
                fillOpacity: 0.3,
                labelOutlineWidth: 2,
                labelOutlineColor: '#ffffff',
                fontColor: '#000000',
                fontSize: 10
            },
            label: {
                strokeColor: '#ffffff',
                strokeWidth: 1,
                fillColor: '#000000'
            },
            cluster: {
                point: {
                    fillColor: '#333366',
                    fillOpacity: 0.6,
                    radius: getClusterRadius,
                    label: '${features.length}',
                    fontColor: "#ffffff",
                    fontSize: 9
                }
            },
            selection: {
                point: {
                    fillColor: '#008000',
                    fillOpacity: 0.5,
                    strokeColor: '#008000',
                    strokeWidth: 2,
                    radius: 6,
                    labelOutlineWidth: 2,
                    labelOutlineColor: '#ffffff',
                    labelOffset: [0, -16],
                    fontColor: '#000000',
                    fontSize: 10,
                    zIndex:1
                },
                line: {
                    strokeColor: '#008000',
                    strokeWidth: 2,
                    labelOutlineWidth: 2,
                    labelOutlineColor: '#ffffff',
                    fontColor: '#000000',
                    fontSize: 10,
                    zIndex: 1
                },
                polygon: {
                    strokeColor: '#008000',
                    strokeWidth: 2,
                    fillColor: '#000000',
                    fillOpacity: .3,
                    labelOutlineWidth: 2,
                    labelOutlineColor: '#ffffff',
                    fontColor: '#000000',
                    fontSize: 10,
                    zIndex: 1
                }
            },
            snapping: {
                point: {
                    fillColor: '#00ffff',
                    fillOpacity: 0.3,
                    strokeColor: '#00ffff',
                    strokeWidth: 2,
                    radius: 6,
                    labelOutlineWidth: 2,
                    labelOutlineColor: '#ffffff',
                    labelOffset: [0, -16],
                    fontColor: '#000000',
                    fontSize: 10,
                    zIndex: 1
                }
            }
        }
    };
})();

/**
 * Configuración general de la API. Cualquier llamada a un método o un constructor de la API sin parámetro de opciones toma las opciones de aquí. 
 * Hay que tener en cuenta que el archivo config.json de una maquetación puede sobreescribir los valores por defecto de las propiedades de este espacio de nombres 
 * (consultar el tutorial {@tutorial layout_cfg} para ver instrucciones de uso de maquetaciones).
 * @member Cfg
 * @type SITNA.MapOptions
 * @memberof SITNA
 * @example <caption>Configuración de capas base - [Ver en vivo](../examples/Cfg.baseLayers.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Establecer un proxy porque se hacen peticiones a otro dominio.
 *     SITNA.Cfg.proxy = "proxy/proxy.ashx?";
 * 
 *     // Añadir PNOA y establecerla como mapa de fondo por defecto.
 *     SITNA.Cfg.baseLayers.push({
 *         id: "PNOA",
 *         url: "http://www.ign.es/wms-inspire/pnoa-ma",
 *         layerNames: "OI.OrthoimageCoverage",
 *         isBase: true
 *     });
 *     SITNA.Cfg.defaultBaseLayer = "PNOA";
 * 
 *     var map = new SITNA.Map("mapa");
 * </script>
 * @example <caption>Configuración de CRS - [Ver en vivo](../examples/Cfg.crs.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // SITNA.Cfg.baseLayers[0] (capa por defecto) no es compatible con WGS 84, lo cambiamos por SITNA.Consts.layer.IDENA_DYNBASEMAP.
 *     SITNA.Cfg.baseLayers[0] = SITNA.Consts.layer.IDENA_DYNBASEMAP;
 *     SITNA.Cfg.defaultBaseLayer = SITNA.Consts.layer.IDENA_DYNBASEMAP;
 *     
 *     // WGS 84
 *     SITNA.Cfg.crs = "EPSG:4326";
 *     // Coordenadas en grados decimales, porque el sistema de referencia espacial es WGS 84.
 *     SITNA.Cfg.initialExtent = [-2.848205, 41.789124, -0.321350, 43.557898];
 *     SITNA.Cfg.maxExtent = [-2.848205, 41.789124, -0.321350, 43.557898];
 *     
 *     var map = new SITNA.Map("mapa", {
 *         // SITNA.Cfg.baseLayers[0] (capa por defecto) no es compatible con WGS 84, establecer la capa SITNA.Consts.layer.IDENA_DYNBASEMAP en el control de mapa de situación.
 *         controls: {
 *             overviewMap: {
 *                 layer: SITNA.Consts.layer.IDENA_DYNBASEMAP
 *             }
 *         }
 *     });
 * </script>
 * @example <caption>Configuración de capas de trabajo - [Ver en vivo](../examples/Cfg.workLayers.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Establecer un proxy porque se hacen peticiones a otro dominio.
 *     SITNA.Cfg.proxy = "proxy/proxy.ashx?";
 * 
 *     SITNA.Cfg.workLayers = [{
 *              id: "terremotos",
 *              title: "Terremotos últimos 365 días",
 *              type: SITNA.Consts.layerType.WMS,
 *              url: "https://www.ign.es/wms-inspire/geofisica",
 *              layerNames: ["Ultimos365dias"]
 *          }
 *     ];
 *     var map = new SITNA.Map("mapa");
 * </script>
 * @example <caption>Configuración de uso de proxy</caption> {@lang javascript}
 * SITNA.Cfg.proxy = ""; // Las peticiones a http://www.otrodominio.com se hacen directamente
 * 
 * SITNA.Cfg.proxy = "/cgi-bin/proxy.cgi?url="; // Las peticiones a http://www.otrodominio.com se convierten en peticiones a /cgi-bin/proxy.cgi?url=http://www.otrodominio.com
 */
const Cfg = TC.Util.extend(true, {}, Defaults);

export default Cfg;
export { Defaults };
/**
 * @overview API SITNA: API JavaScript para la visualización de datos georreferenciados en aplicaciones web.
 * @version 2.1.0
 * @copyright 2019 Gobierno de Navarra
 * @license BSD-2-Clause
 * @author Fernando Lacunza <flacunza@itracasa.es>
 */
 
/**
 * Espacio de nombres donde se encuentran las clases de la API SITNA.
 * @namespace
 */

var SITNA = window.SITNA || {};
var TC = window.TC || {};
TC.isDebug = true;

(function () {
    if (!window.TC || !window.TC.Cfg) {
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
        var url = TC.apiLocation + (TC.isDebug ? 'tcmap.js' : 'tcmap.min.js');
        var req = new XMLHttpRequest();
        req.open("GET", url, false); // 'false': synchronous.
        req.send(null);

        var head = document.getElementsByTagName("head")[0];
        script = document.createElement("script");
        script.type = "text/javascript";
        script.text = req.responseText;
        head.appendChild(script);
    }
})();

/**
 * Espacio de nombres donde se encuentran las constantes de utilidad.
 * @namespace SITNA.Consts
 */
SITNA.Consts = TC.Consts;

/**
 * Configuración general de la API. Cualquier llamada a un método o un constructor de la API sin parámetro de opciones toma las opciones de aquí. 
 * Hay que tener en cuenta que el archivo config.json de una maquetación puede sobreescribir los valores por defecto de las propiedades de este espacio de nombres 
 * (consultar el tutorial {@tutorial layout_cfg} para ver instrucciones de uso de maquetaciones).
 * @member Cfg
 * @type MapOptions
 * @memberof SITNA
 * @example <caption>Configuración de capas base - [Ver en vivo](../examples/Cfg.baseLayers.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Establecer un proxy porque se hacen peticiones a otro dominio.
 *     SITNA.Cfg.proxy = "proxy.ashx?";
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
 *     SITNA.Cfg.proxy = "proxy.ashx?";
 * 
 *     SITNA.Cfg.workLayers = [{
 *         id: "csantiago",
 *         title: "Camino de Santiago",
 *         url: "http://www.ign.es/wms-inspire/camino-santiago",
 *         layerNames: "PS.ProtectedSite,GN.GeographicalNames,AU.AdministrativeUnit"
 *     }];
 *     var map = new SITNA.Map("mapa");
 * </script>
 * @example <caption>Configuración de uso de proxy</caption> {@lang javascript}
 * SITNA.Cfg.proxy = ""; // Las peticiones a http://www.otrodominio.com se hacen directamente
 * 
 * SITNA.Cfg.proxy = "/cgi-bin/proxy.cgi?url="; // Las peticiones a http://www.otrodominio.com se convierten en peticiones a /cgi-bin/proxy.cgi?url=http://www.otrodominio.com
 */
SITNA.Cfg = TC.Cfg;

SITNA.Cfg.layout = TC.apiLocation + 'TC/layout/responsive';

/**
 * Objeto principal de la API, instancia un mapa dentro de un elemento del DOM. Nótese que la inicialización del mapa es asíncrona, por tanto cualquier código
 * que haga uso de este objeto debería estar dentro de una función de callback pasada como parámetro al método [loaded]{@link SITNA.Map#loaded}.
 *
 * Las opciones de configuración del mapa son una combinación de las opciones de configuración global (definidas en {@link SITNA.Cfg},
 * las opciones definidas por la [maquetación]{@tutorial layout_cfg} que utilicemos, y las opciones pasadas como parámetro al
 * constructor. Estas opciones están ordenadas de menor a mayor prevalencia, de modo que por ejemplo una opción pasada como parámetro del constructor
 * siempre sobreescribirá una opción de la configuración global.
 * @class Map
 * @memberof SITNA
 * @param {HTMLElement|string} div Elemento del DOM en el que crear el mapa o valor de atributo id de dicho elemento.
 * @param {MapOptions} [options] Objeto de opciones de configuración del mapa. Sus propiedades sobreescriben las del objeto de configuración global {@link SITNA.Cfg}.
 * @see SITNA.Cfg
 * @see layout_cfg
 * @example <caption>[Ver en vivo](../examples/Map.1.html)</caption> {@lang html}
 * <div id="mapa"/>
 * <script>
 *     // Crear un mapa con las opciones por defecto.
 *     var map = new SITNA.Map("mapa");
 * </script>
 * @example <caption>[Ver en vivo](../examples/Map.2.html)</caption> {@lang html}
 * <div id="mapa"/>
 * <script>
 *     // Crear un mapa en el sistema de referencia WGS 84 con el de mapa de fondo.
 *     var map = new SITNA.Map("mapa", {
 *         crs: "EPSG:4326",
 *         initialExtent: [ // Coordenadas en grados decimales, porque el sistema de referencia espacial es WGS 84.
 *             -2.84820556640625,
 *             41.78912492257675,
 *             -0.32135009765625,
 *             43.55789822064767
 *         ],
 *         maxExtent: [
 *             -2.84820556640625,
 *             41.78912492257675,
 *             -0.32135009765625,
 *             43.55789822064767
 *         ],
 *         baselayerExtent: [
 *             -2.84820556640625,
 *             41.78912492257675,
 *             -0.32135009765625,
 *             43.55789822064767
 *         ],
 *         baseLayers: [
 *             SITNA.Consts.layer.IDENA_DYNBASEMAP
 *         ],
 *         defaultBaseLayer: SITNA.Consts.layer.IDENA_DYNBASEMAP,
 *         // Establecemos el mapa de situación con una capa compatible con WGS 84
 *         controls: {
 *             overviewMap: {
 *                 layer: SITNA.Consts.layer.IDENA_DYNBASEMAP
 *             }
 *         }
 *     });
 * </script>
 * @example <caption>[Ver en vivo](../examples/Map.3.html)</caption> {@lang html}
 * <div id="mapa"/>
 * <script>
 *     // Crear un mapa que tenga como contenido las capas de toponimia y mallas cartográficas del WMS de IDENA.
 *     var map = new SITNA.Map("mapa", {
 *         workLayers: [
 *             {
 *                 id: "topo_mallas",
 *                 title: "Toponimia y mallas cartográficas",
 *                 type: SITNA.Consts.layerType.WMS,
 *                 url: "//idena.navarra.es/ogc/wms",
 *                 layerNames: "IDENA:TOPONI_Txt_Toponimos,IDENA:mallas"
 *             }
 *         ]
 *     });
 * </script>
 */

SITNA.Map = function (div, options) {
    var map = this;

    // Por defecto en SITNA todas las búsquedas están habilitadas
    TC.Cfg.controls.search.allowedSearchTypes = TC.Util.extend(TC.Cfg.controls.search.allowedSearchTypes, {
        urban: {},
        street: {},
        number: {},
        cadastral: {}
    });

    if (options && options.controls && options.controls.search) {
        var keys = Object.keys(options.controls.search);

        var searchCfg = TC.Util.extend(options.controls.search, { allowedSearchTypes: {} });

        keys.forEach(function (key) {
            if (typeof (options.controls.search[key]) === "boolean" || TC.Util.isPlainObject(options.controls.search[key])) {
                if (options.controls.search[key]) {

                    switch (true) {
                        case (key === "postalAddress"):
                            searchCfg.allowedSearchTypes[TC.Consts.searchType.NUMBER] = TC.Util.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                            break;
                        case (key === "cadastralParcel"):
                            searchCfg.allowedSearchTypes[TC.Consts.searchType.CADASTRAL] = TC.Util.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                            break;
                        case (key === "town"):
                            searchCfg.allowedSearchTypes[TC.Consts.searchType.URBAN] = TC.Util.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                            break;
                        default:
                            searchCfg.allowedSearchTypes[key] = TC.Util.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                    }
                }

                delete searchCfg[key];
            }
        });

        options.controls.search = searchCfg;
    }

    var tcMap = new TC.Map(div, options);
    var tcSearch;
    var tcSearchLayer;

/**
 * Añade una capa al mapa. Si se le pasa un objeto del Tipo {@link LayerOptions} como parámetro `layer`
 * y tiene definida la propiedad `url`, establece por defecto
 * el tipo de capa a {@link SITNA.Consts.layerType.KML} si la URL acaba en _**.kml**_.
 * 
 * El tipo de la capa no puede ser {@link SITNA.Consts.layerType.WFS}.
 * @method addLayer
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {string|LayerOptions} layer Identificador de capa u objeto de opciones de capa.
 * @param {function} [callback] Función a la que se llama tras ser añadida la capa.     
 * @example <caption>[Ver en vivo](../examples/Map.addLayer.1.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Crear un mapa con las opciones por defecto.
 *     var map = new SITNA.Map("mapa");
 *     // Cuando esté todo cargado proceder a trabajar con el mapa.
 *     map.loaded(function () {
 *         // Añadir al mapa la capa de cartografía topográfica de IDENA
 *         map.addLayer(SITNA.Consts.layer.IDENA_CARTO);
 *     });
 * </script>
 * @example <caption>[Ver en vivo](../examples/Map.addLayer.2.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Crear un mapa con las opciones por defecto.
 *     var map = new SITNA.Map("mapa");
 * 
 *     // Cuando esté todo cargado proceder a trabajar con el mapa.
 *     map.loaded(function () {
 *         // Añadir al mapa un documento KML
 *         map.addLayer({
 *             id: "capa_kml",
 *             title: "Museos en Navarra",
 *             type: SITNA.Consts.layerType.KML,
 *             url: "data/MUSEOSNAVARRA.kml"
 *         });
 *     });
 * </script>
 */
    map.addLayer = function (layer, callback) {
        tcMap.addLayer(layer, callback);
    };

/**
 * Hace visible una capa como mapa de fondo. Esta capa debe existir previamente en la lista de mapas de fondo del mapa.
 * @method setBaseLayer
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {string|LayerOptions} layer Identificador de capa u objeto de opciones de capa. 
 * @param {function} [callback] Función al que se llama tras ser establecida la capa como mapa de fondo.
 * @example <caption>[Ver en vivo](../examples/Map.setBaseLayer.1.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa con opciones por defecto. Esto incluye la capa del catastro de Navarra entre los mapas de fondo.
 *     var map = new SITNA.Map("mapa");
 *     // Cuando esté todo cargado establecer como mapa de fondo visible el catastro de Navarra.
 *     map.loaded(function () {
 *         map.setBaseLayer(SITNA.Consts.layer.IDENA_CADASTER);
 *     });
 * </script>
 * @example <caption>[Ver en vivo](../examples/Map.setBaseLayer.2.html)</caption> {@lang html} 
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa con opciones por defecto.
 *     var map = new SITNA.Map("mapa");
 *     // Cuando el mapa esté cargado, añadir la ortofoto de 1956/1957 como mapa de fondo y establecerla como mapa de fondo visible.
 *     map.loaded(function () {
 *         map.addLayer({
 *             id: "orto_56_57",
 *             title: "Ortofoto de 1956/1957",
 *             url: "http://idena.navarra.es/ogc/wms",
 *             layerNames: "ortofoto_10000_1957",
 *             isBase: true
 *         }, function () {
 *             map.setBaseLayer("orto_56_57");
 *         });
 *     });
 * </script>
 */
    map.setBaseLayer = function (layer, callback) {
        tcMap.setBaseLayer(layer, callback);
    };

/**
 * Añade un marcador (un punto asociado a un icono) al mapa.
 * @method addMarker
 * @memberof SITNA.Map
 * @instance
 * @param {array} coords Coordenadas x e y del punto en las unidades del sistema de referencia del mapa.
 * @param {MarkerOptions} [options] Objeto de opciones de marcador.
 * @example <caption>[Ver en vivo](../examples/Map.addMarker.1.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 * 
 *     // Cuando esté todo cargado proceder a trabajar con el mapa.
 *     map.loaded(function () {
 *         // Añadir un marcador.
 *         map.addMarker([610749, 4741648]);
 *         // Centrar el mapa en el marcador.
 *         map.zoomToMarkers();
 *     });
 * </script> 
 * @example <caption>[Ver en vivo](../examples/Map.addMarker.2.html)</caption> {@lang html}   
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 *     
 *     // Cuando esté todo cargado proceder a trabajar con el mapa.
 *     map.loaded(function () {
 *         // Añadir marcadores al grupo "Marcadores colgantes"
 *         // cuyo icono se ancle al punto en el centro hacia abajo.
 *         // Establecer un icono adecuado.
 *         var markerOptions = {
 *             group: "Marcadores colgantes",
 *             url: "data/colgante.png",
 *             anchor: [0.5, 0]
 *         };
 *         map.addMarker([610887, 4741244], markerOptions);
 *         map.addMarker([615364, 4657556], markerOptions);
 *         // Centrar el mapa en los marcadores.
 *         map.zoomToMarkers();
 *     });
 * </script> 
 * @example <caption>[Ver en vivo](../examples/Map.addMarker.3.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Crear un mapa con una capa vectorial, centrado en la Ciudadela de Pamplona.
 *     var map = new SITNA.Map("mapa", {
 *         initialExtent: [
 *             609627,
 *             4740225,
 *             611191,
 *             4741395
 *         ],
 *         workLayers: [{
 *             id: "markers",
 *             title: "Marcadores geográficos",
 *             type: SITNA.Consts.layerType.VECTOR
 *         }]
 *     });
 *     // Cuando esté todo cargado proceder a trabajar con el mapa.
 *     map.loaded(function () {
 *         // Añadir un marcador en la capa "markers",
 *         // asignarle un grupo para que salga en tabla de contenidos y leyenda.
 *         map.addMarker([610431, 4740837], {
 *             layer: "markers",
 *             group: "Ciudadela"
 *         });
 *     });
 * </script>
 * @example <caption>[Ver en vivo](../examples/Map.addMarker.4.html)</caption> {@lang html}  
 * <div id="mapa"></div>
 * <script>
 *     // Añadir información emergente al mapa.
 *     SITNA.Cfg.controls.popup = true;
 *     
 *     // Crear un mapa.
 *     var map = new SITNA.Map("mapa");
 *     // Cuando esté todo cargado proceder a trabajar con el mapa.
 *     map.loaded(function () {
 *         // Añadir un marcador con un icono de 40x40 píxeles definido por la clase CSS kiosko.
 *         // Asignarle unos datos asociados que se muestren por defecto.
 *         map.addMarker([615366, 4657426], {
 *             cssClass: "kiosko",
 *             width: 40,
 *             height: 40,
 *             data: {
 *                 "Nombre": "Plaza de la Constitución, Tudela",
 *                 "Sitio web": "http://www.tudela.es/"
 *             },
 *             showPopup: true
 *         });
 *         // Centrar el mapa en el marcador.
 *         map.zoomToMarkers();
 *     });
 * </script> 
 */
    map.addMarker = function (coords, options) {
        tcMap.addMarker(coords, options);
    };

/**
 * Centra y escala el mapa a la extensión que ocupan todos sus marcadores.
 * @method zoomToMarkers
 * @memberof SITNA.Map
 * @instance
 * @param {object} [options] Objeto de opciones de zoom.
 * @param {number} [options.pointBoundsRadius=30] Radio en metros del área alrededor del marcador que se respetará al hacer zoom. Por defecto es 30.
 * @param {number} [options.extentMargin=0.2] Tamaño del margen que se aplicará a la extensión total de todas los marcadores.
 * El valor es la relación de crecimiento en ancho y alto entre la extensión resultante y la original. Por ejemplo, el valor por defecto 0,2 indica un crecimiento del 20% de la extensión, 10% por cada lado.
 * @example <caption>[Ver en vivo](../examples/Map.zoomToMarkers.html)</caption> {@lang html}  
 * <div class="controls">
 *     <div><button id="addMarkerBtn">Añadir marcador aleatorio</button></div>
 *     <div><input type="number" step="1" id="pbrVal" value="30" /> <label for="pbrVal">pointBoundsRadius</label></div>
 *     <div><input type="number" step="0.1" id="emVal" value="0.2" /> <label for="emVal">extentMargin</label></div>
 *     <div><button id="zoomBtn">Hacer zoom a los marcadores</button></div>
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 *       
 *     // Añadir un marcador en un punto aleatorio
 *     var addRandomMarker = function () {
 *         var xmin = SITNA.Cfg.initialExtent[0];
 *         var ymin = SITNA.Cfg.initialExtent[1];
 *         var width = SITNA.Cfg.initialExtent[2] - SITNA.Cfg.initialExtent[0];
 *         var height = SITNA.Cfg.initialExtent[3] - SITNA.Cfg.initialExtent[1];
 *         map.addMarker([xmin + Math.random() width, ymin + Math.random() height]);
 *     };
 * 
 *     // Hacer zoom a los marcadores con las opciones elegidas
 *     var zoomToMarkers = function () {
 *         map.zoomToMarkers({
 *             pointBoundsRadius: parseInt(document.getElementById("pbrVal").value),
 *             extentMargin: parseFloat(document.getElementById("emVal").value)
 *         });
 *     };
 *     
 *     document.getElementById("addMarkerBtn").addEventListener("click", addRandomMarker);
 *     document.getElementById("zoomBtn").addEventListener("click", zoomToMarkers);
 * </script> 
 */
    map.zoomToMarkers = function (options) {
        tcMap.zoomToMarkers(options);
    };

/**
 * Añade una función de callback que se ejecutará cuando el mapa, sus controles y todas sus capas se hayan cargado.
 * @method loaded
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {function} callback Función a la que se llama tras la carga del mapa.
 * @example {@lang javascript}
 * // Notificar cuando se haya cargado el mapa.
 * map.loaded(function () { 
 *     console.log("Código del mapa y de sus controles cargado, cargando datos...");
 * });
 */
    map.loaded = function (callback) {
        tcMap.loaded(callback);
    };

    // Si existe el control featureInfo lo activamos.
    tcMap.loaded(function () {

        TC.loadJS(
            !TC.control.Search,
            TC.apiLocation + 'TC/control/Search',
            function () {
                tcSearch = new TC.control.Search();
                tcSearch.register(tcMap);

                tcSearch.getLayer().then(function (layer) {
                    tcSearchLayer = layer;
                });
            }
        );

        if (!tcMap.activeControl) {
            var fi = tcMap.getControlsByClass('TC.control.FeatureInfo')[0];
            if (fi) {
                fi.activate();
            }
        }
    });
/**
 * Objeto proporcionado en las respuestas a peticiones de datos de búsqueda ({@link SITNA.Map#getMunicipalities}, etc.).
 * @typedef SITNA.Map~SearchResultItem
 * @see SITNA.Map#getCommonwealths
 * @see SITNA.Map#getCouncils
 * @see SITNA.Map#getMunicipalities
 * @see SITNA.Map#getUrbanAreas
 * @property {string} id - Identificador del elemento a buscar.
 * @property {string} label - Texto descriptivo del elemento a buscar que se mostrará en la lista de sugerencias de resultados de búsqueda.
 */

/**
 * Función de callback que gestiona las respuestas a peticiones de datos de búsqueda ({@link SITNA.Map#getMunicipalities}, etc.).
 * @callback SITNA.Map~SearchDataCallback
 * @param {SITNA.Map~SearchResultItem[]} data - Lista de elementos de búsqueda. Cada elemento tiene un identificador y un texto descriptivo.
 */

/**
 * Función de callback que gestiona las respuestas a búsquedas por identfificador ({@link SITNA.Map#searchMunicipality}, etc.).
 * @callback SITNA.Map~SearchByIdCallback
 * @param {string} queryId - Identificador de consulta realizada. Su valor es `undefined` si no hay resultado.
 */

    /*
      Obtiene los valores ({@link SITNA.Map~SearchResultItem}) de las entidades geográficas disponibles en la capa de IDENA que corresponda según el parámetro searchType. 
      Puede consultar también online el [ejemplo 1](../examples/Map.getQueryableData.html). 
    
     method getQueryableData
     async
     param {string|SITNA.consts.MapSearchType} searchType Fuente de datos del cual obtendremos los valores disponibles para buscar posteriormente.
     param {function} [callback] Función a la que se llama tras obtener los datos.  
     example
        <div class="instructions divSelect">
            <div>
                Municipios
                <select id="municipality" onchange="applyFilter(this)">
                    <option value="-1">Seleccione...</option>
                </select>
                <br />
                <br />
                Concejos
                <select id="council" onchange="applyFilter(this)">
                    <option value="-1">Seleccione...</option>
                </select>
                <br />
                <br />
                Casco Urbano
                <select id="urban" onchange="applyFilter(this)">
                    <option value="-1">Seleccione...</option>
                </select>
                <br />
                <br />
                Manconmunidad
                <select id="commonwealth" onchange="applyFilter(this)">
                    <option value="-1">Seleccione...</option>
                </select>
            </div>
        </div>
        <div id="mapa"></div>
        <script>
        // Crear mapa.
        var map = new SITNA.Map("mapa");

        map.loaded(function () {
            // completamos el desplegable de municipios
            map.getQueryableData(SITNA.Consts.mapSearchType.MUNICIPALITY, function (data) {
                var fragment = document.createDocumentFragment();
                data.forEach(function (value) {
                    var option = document.createElement("option");
                    option.setAttribute("value", value.id);
                    option.textContent = value.label;
                    fragment.appendChild(option);
                });
                document.querySelector("#municipality").appendChild(fragment);
            });

            // completamos el desplegable de concejos
            map.getQueryableData(SITNA.Consts.mapSearchType.COUNCIL, function (data) {
                var fragment = document.createDocumentFragment();
                data.forEach(function (value) {
                    var option = document.createElement("option");
                    option.setAttribute("value", value.id);
                    option.textContent = value.label;
                    fragment.appendChild(option);
                });
                document.querySelector("#council").appendChild(fragment);
            });

            // completamos el desplegable de cascos urbanos
            map.getQueryableData(SITNA.Consts.mapSearchType.URBAN, function (data) {
                var fragment = document.createDocumentFragment();
                data.forEach(function (value) {
                    var option = document.createElement("option");
                    option.setAttribute("value", value.id);
                    option.textContent = value.label;
                    fragment.appendChild(option);
                });
                document.querySelector("#urban").appendChild(fragment);
            });

            // completamos el desplegable de mancomunidades de residuos
            map.getQueryableData(SITNA.Consts.mapSearchType.COMMONWEALTH, function (data) {
                var fragment = document.createDocumentFragment();
                data.forEach(function (value) {
                    var option = document.createElement("option");
                    option.setAttribute("value", value.id);
                    option.textContent = value.label;
                    fragment.appendChild(option);
                });
                document.querySelector("#commonwealth").appendChild(fragment);
            });
        });

        // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
        function applyFilter(target) {
            if (target) {
                var municipalitySelect = document.querySelector("#municipality");
                var councilSelect = document.querySelector("#council");
                var urbanSelect = document.querySelector("#urban");
                var commonwealthSelect = document.querySelector("#commonwealth");
                var id = target.querySelector('option:checked').value;
                var searchType;
                switch (true) {
                    case target.id == SITNA.Consts.mapSearchType.MUNICIPALITY:
                        searchType = SITNA.Consts.mapSearchType.MUNICIPALITY;

                        councilSelect.value = -1;
                        urbanSelect.value = -1;
                        commonwealthSelect.value = -1;
                        break;
                    case target.id == SITNA.Consts.mapSearchType.COUNCIL:
                        searchType = SITNA.Consts.mapSearchType.COUNCIL;

                        municipalitySelect.value = -1;
                        urbanSelect.value = -1;
                        commonwealthSelect.value = -1;
                        break;
                    case target.id == SITNA.Consts.mapSearchType.URBAN:
                        searchType = SITNA.Consts.mapSearchType.URBAN;

                        municipalitySelect.value = -1;
                        councilSelect.value = -1;
                        commonwealthSelect.value = -1;
                        break;
                    case target.id == SITNA.Consts.mapSearchType.COMMONWEALTH:
                        searchType = SITNA.Consts.mapSearchType.COMMONWEALTH;

                        municipalitySelect.value = -1;
                        councilSelect.value = -1;
                        urbanSelect.value = -1;
                        break;
                }

                if (id == -1)
                    map.removeSearch();
                else {
                    map.searchTyped(searchType, id, function (idQuery) {
                        if (idQuery == null) {
                            alert('No se han encontrado resultados');
                        }
                    });
                }
            }
        };
        </script>
    */
    map.getQueryableData = function (searchType, callback) {
        var queryable = tcSearch.availableSearchTypes[searchType];

        if (queryable.queryableData) {
            if (callback)
                callback(queryable.queryableData);
        } else {
            var params = {
                request: 'GetFeature',
                service: 'WFS',
                typename: queryable.featurePrefix + ':' + queryable.featureType,
                version: queryable.version,
                propertyname: (!(queryable.dataIdProperty instanceof Array) ? [queryable.dataIdProperty] : queryable.dataIdProperty)
                    .concat((!(queryable.outputProperties instanceof Array) ? [queryable.outputProperties] : queryable.outputProperties)).join(','),
                outputformat: TC.Consts.format.JSON
            };

            var url = queryable.url + '?' + TC.Util.getParamString(params);
            TC.ajax({
                url: url,
                responseType: TC.Consts.mimeType.JSON
            }).then(function (response) {
                const responseData = response.data;
                queryable.queryableData = [];

                if (responseData.features) {
                    var features = responseData.features;

                    for (var i = 0; i < features.length; i++) {
                        var f = features[i];
                        var data = {};

                        data.id = [];
                        if (!(queryable.dataIdProperty instanceof Array))
                            queryable.dataIdProperty = [queryable.dataIdProperty];

                        for (var ip = 0; ip < queryable.dataIdProperty.length; ip++) {
                            if (f.properties.hasOwnProperty(queryable.dataIdProperty[ip])) {
                                data.id.push(f.properties[queryable.dataIdProperty[ip]]);
                            }
                        }

                        data.id = queryable.idPropertiesIdentifier ? data.id.join(queryable.idPropertiesIdentifier) : data.id.join('');

                        data.label = [];
                        if (!(queryable.outputProperties instanceof Array))
                            queryable.outputProperties = [queryable.outputProperties];

                        for (var lbl = 0; lbl < queryable.outputProperties.length; lbl++) {
                            if (f.properties.hasOwnProperty(queryable.outputProperties[lbl])) {
                                data.label.push(f.properties[queryable.outputProperties[lbl]]);
                            }
                        }

                        var add = (data.label instanceof Array && data.label.join('').trim().length > 0) || (!(data.label instanceof Array) && data.label.trim().length > 0);
                        data.label = queryable.outputFormatLabel ? queryable.outputFormatLabel.tcFormat(data.label) : data.label.join('-');

                        if (add)
                            queryable.queryableData.push(data);
                    }
                }

                queryable.queryableData = queryable.queryableData.sort(function (a, b) {
                    if (queryable.idPropertiesIdentifier ? a.id.indexOf(queryable.idPropertiesIdentifier) == -1 : false) {
                        if (tcSearch.removePunctuation(a.label) < tcSearch.removePunctuation(b.label))
                            return -1;
                        else if (tcSearch.removePunctuation(a.label) > tcSearch.removePunctuation(b.label))
                            return 1;
                        else
                            return 0;
                    } else {
                        if (tcSearch.removePunctuation(a.label.split(' ')[0]) < tcSearch.removePunctuation(b.label.split(' ')[0]))
                            return -1;
                        else if (tcSearch.removePunctuation(a.label.split(' ')[0]) > tcSearch.removePunctuation(b.label.split(' ')[0]))
                            return 1;
                        else
                            return 0;
                    }
                });
                queryable.queryableData = queryable.queryableData.filter(function (value, index, arr) {
                    if (index < 1)
                        return true;
                    else
                        return value.id !== arr[index - 1].id && value.label !== arr[index - 1].label;
                });

                if (callback)
                    callback(queryable.queryableData);
            });
        }
    };
/**
 * Obtiene los valores ({@link SITNA.Map~SearchResultItem}) de los municipios disponibles en la capa de IDENA.
 * @method getMunicipalities
 * @memberof SITNA.Map
 * @instance
 * @async  
 * @param {SITNA.Map~SearchDataCallback} callback - Función a la que se llama tras obtener los datos.
 * @example <caption>[Ver en vivo](../examples/Map.getMunicipalities.html)</caption> {@lang html} 
 * <div class="instructions divSelect">
 *     <div>
 *         Municipios
 *         <select id="municipality" onchange="applyFilter()">
 *             <option value="-1">Seleccione...</option>
 *         </select>
 *     </div>
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 * 
 *     map.loaded(function () {
 *         // completamos el desplegable
 *         map.getMunicipalities(function (data) {
 *             var fragment = document.createDocumentFragment();
 *             data.forEach(function (value) {
 *                 var option = document.createElement("option");
 *                 option.setAttribute("value", value.id);
 *                 option.textContent = value.label;
 *                 fragment.appendChild(option);
 *             });
 *             document.querySelector("#municipality").appendChild(fragment);
 *         });
 *     });
 *
 *     // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
 *     function applyFilter() {
 *         var id = document.querySelector("#council").querySelector("option:checked").value;
 *         if (id == -1)
 *             map.removeSearch();
 *         else {
 *             map.searchMunicipality(id, function (idQuery) {
 *                 if (idQuery == null) {
 *                     alert("No se han encontrado resultados");
 *                 }
 *             });
 *         }
 *     };
 * </script> 
 */
    map.getMunicipalities = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.MUNICIPALITY, callback);
    };
/**
 * Obtiene los valores ({@link SITNA.Map~SearchResultItem}) de los cascos urbanos disponibles en la capa de IDENA.
 * @method getUrbanAreas
 * @memberof SITNA.Map
 * @instance
 * @async  
 * @param {SITNA.Map~SearchDataCallback} callback - Función a la que se llama tras obtener los datos.  
 * @example <caption>[Ver en vivo](../examples/Map.getUrbanAreas.html)</caption> {@lang html} 
 * <div class="instructions divSelect">
 *     <div>
 *         Cascos urbanos
 *         <select id="urban" onchange="applyFilter()">
 *             <option value="-1">Seleccione...</option>
 *         </select>
 *     </div>
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 *     
 *     map.loaded(function () {
 *         // completamos el desplegable
 *         map.getUrbanAreas(function (data) {
 *             var fragment = document.createDocumentFragment();
 *             data.forEach(function (value) {
 *                 var option = document.createElement("option");
 *                 option.setAttribute("value", value.id);
 *                 option.textContent = value.label;
 *                 fragment.appendChild(option);
 *             });
 *             document.querySelector("#urban").appendChild(fragment);
 *         });
 *     });
 *
 *     // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
 *     function applyFilter() {
 *         var id = document.querySelector("#urban").querySelector("option:checked").value;
 *         if (id == -1)
 *             map.removeSearch();
 *         else {
 *             map.searchUrbanArea(id, function (idQuery) {
 *                 if (idQuery == null) {
 *                     alert('No se han encontrado resultados');
 *                 }
 *             });
 *         }
 *     };
 * </script>
 */
    map.getUrbanAreas = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.URBAN, callback);
    };
/**
 * Obtiene los valores ({@link SITNA.Map~SearchResultItem}) de las mancomunidades de residuos disponibles en la capa de IDENA. 
 * @method getCommonwealths
 * @memberof SITNA.Map
 * @instance
 * @async  
 * @param {SITNA.Map~SearchDataCallback} callback - Función a la que se llama tras obtener los datos.  
 * @example <caption>[Ver en vivo](../examples/Map.getCommonwealths.html)</caption> {@lang html} 
 * <div class="instructions divSelect">
 *     <div>
 *         Mancomunidades de residuos
 *         <select id="commonwealths" onchange="applyFilter()">
 *             <option value="-1">Seleccione...</option>
 *         </select>
 *     </div>
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 *     
 *     map.loaded(function () {
 *         // completamos el desplegable
 *         map.getCommonwealths(function (data) {
 *             var fragment = document.createDocumentFragment();
 *             data.forEach(function (value) {
 *                 var option = document.createElement("option");
 *                 option.setAttribute("value", value.id);
 *                 option.textContent = value.label;
 *                 fragment.appendChild(option);
 *             });
 *             document.querySelector("#commonwealths").appendChild(fragment);
 *         });
 *     });
 *         
 *     // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
 *     function applyFilter() {
 *         var id = document.querySelector("#commonwealths").querySelector("option:checked").value;
 *         if (id == -1)
 *             map.removeSearch();
 *         else {
 *             map.searchCommonwealth(id, function (idQuery) {
 *                 if (idQuery == null) {
 *                     alert("No se han encontrado resultados");
 *                 }
 *             });
 *         }
 *     };
 * </script>     
 */
    map.getCommonwealths = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.COMMONWEALTH, callback);
    };
/**
 * Obtiene los valores ({@link SITNA.Map~SearchResultItem}) de los concejos disponibles en la capa de IDENA. 
 * @method getCouncils
 * @memberof SITNA.Map
 * @instance
 * @async  
 * @param {SITNA.Map~SearchDataCallback} callback - Función a la que se llama tras obtener los datos.  
 * @example <caption>[Ver en vivo](../examples/Map.getCouncils.html)</caption> {@lang html} 
 * <div class="instructions divSelect">
 *     <div>
 *         Concejos
 *         <select id="council" onchange="applyFilter()">
 *             <option value="-1">Seleccione...</option>
 *         </select>
 *     </div>
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 *     
 *     map.loaded(function () {
 *         // completamos el desplegable
 *         map.getCouncils(function (data) {
 *             var fragment = document.createDocumentFragment();
 *             data.forEach(function (value) {
 *                 var option = document.createElement("option");
 *                 option.setAttribute("value", value.id);
 *                 option.textContent = value.label;
 *                 fragment.appendChild(option);
 *             });
 *             document.querySelector("#council").appendChild(fragment);
 *         });
 *     });
 *     
 *     // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
 *     function applyFilter() {
 *         var id = document.querySelector("#council").querySelector("option:checked").value;
 *         if (id == -1)
 *             map.removeSearch();
 *         else {
 *             map.searchCouncil(id, function (idQuery) {
 *                 if (idQuery == null) {
 *                     alert("No se han encontrado resultados");
 *                 }
 *             });
 *         }
 *     };
 * </script>
 */
    map.getCouncils = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.COUNCIL, callback);
    };
/**
 * Busca la mancomunidad de residuos y pinta en el mapa la entidad geográfica encontrada que corresponda al identificador indicado.
 * @method searchCommonwealth
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {string} id Identificador de la entidad geográfica a pintar.
 * @param {SITNA.Map~SearchByIdCallback} [callback] Función a la que se llama tras aplicar el filtro.  
 * @example <caption>[Ver en vivo](../examples/Map.searchCommonwealth.html)</caption> {@lang html} 
 * <div class="instructions searchCommonwealth">    
 *     <div><button id="searchPamplonaBtn">Buscar Mancomunidad de la Comarca de Pamplona</button></div>    
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 *     map.loaded(function () {
 *         document.getElementById("searchPamplonaBtn").addEventListener("click", search);
 *     });
 *           
 *     var search = function () {
 *         map.removeSearch();
 *         map.searchCommonwealth("8", function (idQuery) {
 *             if (idQuery == null) {
 *                 alert("No se ha encontrado la mancomunidad con código 8.");
 *             }
 *         });
 *     };
 * </script>
 */
    map.searchCommonwealth = function (id, callback) {
        map.searchTyped(SITNA.Consts.mapSearchType.COMMONWEALTH, id, callback);
    };
/**
 * Busca el concejo que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
 * @method searchCouncil
 * @memberof SITNA.Map
 * @instance
 * @async    
 * @param {string} id - Identificador de la entidad geográfica a pintar.
 * @param {SITNA.Map~SearchByIdCallback} [callback] - Función a la que se llama tras aplicar el filtro.  
 * @example <caption>[Ver en vivo](../examples/Map.searchCouncil.html)</caption> {@lang html} 
 * <div class="instructions search">    
 *     <div><button id="searchBtn">Buscar concejo Esquíroz (Galar)</button></div>    
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 *     map.loaded(function () {
 *         document.getElementById("searchBtn").addEventListener("click", search);
 *     });
 *     
 *     var search = function () {
 *         map.removeSearch();
 *         map.searchCouncil("109#5", function (idQuery) {
 *             if (idQuery == null) {
 *                 alert("No se ha encontrado el concejo con código 109#5.");
 *             }
 *         });
 *     };    
 * </script>    
 */
    map.searchCouncil = function (id, callback) {
        map.searchTyped(SITNA.Consts.mapSearchType.COUNCIL, id, callback);
    };
/**
 * Busca el casco urbano que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
 * @method searchUrbanArea
 * @memberof SITNA.Map
 * @instance
 * @async    
 * @param {string} id Identificador de la entidad geográfica a pintar.
 * @param {SITNA.Map~SearchByIdCallback} [callback] Función a la que se llama tras aplicar el filtro.  
 * @example <caption>[Ver en vivo](../examples/Map.searchUrbanArea.html)</caption> {@lang html} 
 * <div class="instructions search">
 *     <div><button id="searchBtn">Buscar casco urbano de Arbizu</button></div>
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 *     map.loaded(function () {
 *         document.getElementById("searchBtn").addEventListener("click", search);
 *     });
 *     var search = function () {
 *         map.removeSearch();
 *         map.searchUrbanArea("27", function (idQuery) {
 *             if (idQuery == null) {
 *                 alert("No se ha encontrado el casco urbano con código 27.");
 *             }
 *         });
 *     };
 * </script>
 */
    map.searchUrbanArea = function (id, callback) {
        map.searchTyped(SITNA.Consts.mapSearchType.URBAN, id, callback);
    };
/**
 * Busca el municipio que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
 * @method searchMunicipality
 * @memberof SITNA.Map
 * @instance
 * @async    
 * @param {string} id Identificador de la entidad geográfica a pintar.
 * @param {SITNA.Map~SearchByIdCallback} [callback] Función a la que se llama tras aplicar el filtro.  
 * @example <caption>[Ver en vivo](../examples/Map.searchMunicipality.html)</caption> {@lang html} 
 * <div class="instructions search">
 *     <div><button id="searchBtn">Buscar Arbizu</button></div>
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 *     map.loaded(function () {
 *         document.getElementById("searchBtn").addEventListener("click", search);
 *     });
 *          
 *     var search = function () {
 *         map.removeSearch();
 *         map.searchMunicipality("27", function (idQuery) {
 *             if (idQuery == null) {
 *                 alert("No se ha encontrado el municipio con código 27.");
 *             }
 *         });
 *     };
 * </script>
 */
    map.searchMunicipality = function (id, callback) {
        map.searchTyped(SITNA.Consts.mapSearchType.MUNICIPALITY, id, callback);
    };

    // Busca en la configuración que corresponda según el parámetro searchType el identificador pasado como parámetro
    map.searchTyped = function (searchType, id, callback) {
        var idQuery = TC.getUID();
        var query = tcSearch.availableSearchTypes[searchType];

        if (id instanceof Array && query.goToIdFormat)
            id = query.goToIdFormat.tcFormat(id);

        tcSearch._search.data = tcSearch._search.data || [];
        tcSearch._search.data.push({
            dataLayer: query.featureType,
            dataRole: searchType,
            id: id,
            label: "",
            text: ""
        });

        map.removeSearch();

        if (tcSearch.availableSearchTypes[searchType] && !tcSearch.getSearchTypeByRole(searchType)) {

            if (!tcSearch.availableSearchTypes[searchType].goTo) {
                tcSearch.availableSearchTypes[searchType].goTo = function (id) {
                    var getProperties = function (id) {

                        if (!TC.filter) {
                            TC.syncLoadJS(TC.apiLocation + 'TC/Filter');
                        }

                        var filter = [];
                        if (query.idPropertiesIdentifier) id = id.split(query.idPropertiesIdentifier);
                        if (!(id instanceof Array)) id = [id];
                        for (var i = 0; i < query.dataIdProperty.length; i++) {
                            filter.push(
                                new TC.filter.equalTo(query.dataIdProperty[i], id[i].trim())
                            );
                        }

                        if (filter.length > 1) {
                            filter = new TC.filter.and(filter);
                        } else {
                            filter = filter[0];
                        }

                        return filter;
                    };
                    var properties = getProperties(id);

                    return {
                        params: {
                            type: TC.Consts.layerType.WFS,
                            url: this.url,
                            version: this.version,
                            geometryName: this.geometryName,
                            featurePrefix: this.featurePrefix,
                            featureType: this.featureType,
                            properties: properties,
                            outputFormat: this.outputFormat,
                            styles: this.styles
                        }
                    };
                }.bind(query);
            }

            tcSearch.addAllowedSearchType(searchType, tcSearch.availableSearchTypes[searchType], tcSearch);
        }

        tcMap.one(TC.Consts.event.SEARCHQUERYEMPTY, function (e) {
            tcMap.toast(tcSearch.EMPTY_RESULTS_LABEL, {
                type: TC.Consts.msgType.INFO, duration: 5000
            });

            if (callback)
                callback(null);
        });

        tcMap.one(TC.Consts.event.FEATURESADD, function (e) {
            if (e.layer == tcSearchLayer && e.layer.features && e.layer.features.length > 0)
                tcMap.zoomToFeatures(e.layer.features);

            map.search = {
                layer: e.layer, type: searchType
            };

            if (callback)
                callback(e.layer.id !== idQuery ? e.layer.id : idQuery);
        });

        tcSearch.goToResult(id, searchType);
    };
/**
 * Busca y pinta en el mapa la entidad geográfica encontrada correspondiente al identificador establecido.
 * @method searchFeature
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {string} layer - Nombre de la capa de IDENA en la cual buscar.
 * @param {string} field - Campo de la capa de IDENA en el cual buscar.
 * @param {string} id - Identificador de la entidad geográfica por el cual filtrar.
 * @param {IDENA.Map~SearchByIdCallback} [callback] - Función a la que se llama tras aplicar el filtro.  
 * @example <caption>[Ver en vivo](../examples/Map.searchFeature.html)</caption> {@lang html} 
 * <div class="instructions query">
 *     <div><label>Capa</label><input type="text" id="capa" placeholder="Nombre capa de IDENA" /> </div>
 *     <div><label>Campo</label><input type="text" id="campo" placeholder="Nombre campo" /> </div>
 *     <div><label>Valor</label><input type="text" id="valor" placeholder="Valor a encontrar" /> </div>
 *     <div><button id="searchBtn">Buscar</button></div>
 *     <div><button id="removeBtn">Eliminar filtro</button></div>
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 * 
 *     map.loaded(function () {
 *         document.getElementById("searchBtn").addEventListener("click", search);
 *         document.getElementById("removeBtn").addEventListener("click", remove);
 *     });
 *     
 *     var search = function () {
 *         var capa = document.getElementById("capa").value;
 *         capa = capa.trim();
 *         
 *         var campo = document.getElementById("campo").value;
 *         campo = campo.trim();
 *         
 *         var valor = document.getElementById("valor").value;
 *         valor = valor.trim();
 *         
 *         map.searchFeature(capa, campo, valor, function (idQuery) {
 *             if (idQuery == null) {
 *                 alert("No se han encontrado resultados en la capa: " + capa + " en el campo: " + campo + " el valor: " + valor + ".");
 *             }
 *         });
 *     };
 *     
 *     // Limpiar el mapa 
 *     var remove = function () {
 *         map.removeSearch();
 *     };
 * </script>
 */
    map.searchFeature = function (layer, field, id, callback) {
        var idQuery = TC.getUID();
        var prefix = tcSearch.featurePrefix;

        map.removeSearch();

        layer = (layer || '').trim(); field = (field || '').trim(); id = (id || '').trim();
        if (layer.length == 0 || field.length == 0 || id.length == 0) {
            tcMap.toast(tcSearch.EMPTY_RESULTS_LABEL, {
                type: TC.Consts.msgType.INFO, duration: 5000
            });

            if (callback)
                callback(null);
        } else {

            if (layer.indexOf(':') > -1) {
                prefix = layer.split(':')[0];
                layer = layer.split(':')[1];
            }

            var transformFilter = function (properties) {
                var self = this;

                if (!TC.filter) {
                    TC.syncLoadJS(TC.apiLocation + 'TC/Filter');
                }

                if (properties && properties instanceof Array) {
                    var filters = properties.map(function (elm) {
                        if (elm.hasOwnProperty("type")) {
                            switch (true) {
                                case elm.type == TC.Consts.comparison.EQUAL_TO: {
                                    return new TC.filter.equalTo(elm.name, elm.value);
                                }
                            }
                        } else {
                            return new TC.filter.equalTo(elm.name, elm.value);
                        }
                    });

                    if (filters.length > 1) {
                        return TC.filter.and.apply(null, filters);
                    } else {
                        return filters[0];
                    }
                }
            }

            var layerOptions = {
                id: idQuery,
                type: SITNA.Consts.layerType.WFS,
                url: tcSearch.url,
                version: tcSearch.version,
                stealth: true,
                geometryName: 'the_geom',
                featurePrefix: prefix,
                featureType: layer,
                maxFeatures: 1,
                properties: transformFilter([{
                    name: field, value: id, type: TC.Consts.comparison.EQUAL_TO
                }]),
                outputFormat: TC.Consts.format.JSON
            };

            var tcSrchGenericLayer;
            tcMap.addLayer(layerOptions).then(function (layer) {
                tcSrchGenericLayer = layer;

                map.search = {
                    layer: layer, type: SITNA.Consts.mapSearchType.GENERIC
                };
            });

            tcMap.on(TC.Consts.event.FEATURESADD, function (e) {
                const layer = e.layer;
                if (layer == tcSrchGenericLayer && layer.features && layer.features.length > 0) {

                    for (var i = 0; i < layer.features.length; i++) {
                        if (layer.features[i].showsPopup != tcSearch.queryableFeatures)
                            layer.features[i].showsPopup = tcSearch.queryableFeatures;
                    }

                    tcMap.zoomToFeatures(layer.features);
                }
            });

            tcMap.on(TC.Consts.event.LAYERUPDATE, function (e) {
                const layer = e.layer;
                const newData = e.newData;
                if (layer == tcSrchGenericLayer && newData && newData.features && newData.features.length == 0)
                    tcMap.toast(tcSearch.EMPTY_RESULTS_LABEL, {
                        type: TC.Consts.msgType.INFO, duration: 5000
                    });

                if (callback)
                    callback(layer == tcSrchGenericLayer && newData && newData.features && newData.features.length == 0 ? null : idQuery);
            });
        }
    };
/**
 * Elimina del mapa la entidad geográfica encontrada en la última búsqueda. 
 * @method removeSearch
 * @memberof SITNA.Map
 * @instance
 * @async   
 * @param {function} [callback] Función a la que se llama tras eliminar la entidad geográfica.  
 * @example <caption>[Ver en vivo](../examples/Map.removeSearch.html)</caption> {@lang html} 
 * <div class="instructions query">
 *     <div><label>Capa</label><input type="text" id="capa" placeholder="Nombre capa de IDENA" /> </div>
 *     <div><label>Campo</label><input type="text" id="campo" placeholder="Nombre campo" /> </div>
 *     <div><label>Valor</label><input type="text" id="valor" placeholder="Valor a encontrar" /> </div>
 *     <div><button id="searchBtn">Buscar</button></div>
 *     <div><button id="removeBtn">Eliminar filtro</button></div>
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear mapa.
 *     var map = new SITNA.Map("mapa");
 *         
 *     map.loaded(function () {
 *         document.getElementById("addFilterBtn").addEventListener("click", addFilter);
 *         document.getElementById("removeFilterBtn").addEventListener("click", removeFilter);
 *     });
 *         
 *     // Establecer como filtro del mapa el municipio Valle de Egüés
 *     var addFilter = function () {
 *         var capa = document.getElementById("capa").value;
 *         capa = capa.trim();
 *         
 *         var campo = document.getElementById("campo").value;
 *         campo = campo.trim();
 *         
 *         var valor = document.getElementById("valor").value;
 *         valor = valor.trim();
 *         
 *         map.searchFeature(capa, campo, valor, function (idQuery) {
 *             if (idQuery == null) {
 *                 alert("No se han encontrado resultados en la capa: " + capa + " en el campo: " + campo + " el valor: " + valor + ".");
 *             }
 *         });
 *     };
 *     
 *     // Limpiar el mapa del filtro
 *     var remove = function () {
 *         map.removeSearch();
 *     };
 * </script>
 */
    map.removeSearch = function (callback) {
        if (map.search) {
            if (!tcSearch.availableSearchTypes[map.search.type] || !tcSearch.availableSearchTypes[map.search.type].hasOwnProperty('goTo')) {
                tcMap.removeLayer(map.search.layer).then(function () {
                    map.search = null;
                });
            } else {
                for (var i = 0; i < map.search.layer.features.length; i++) {
                    map.search.layer.removeFeature(map.search.layer.features[i]);
                }
                map.search = null;
            }
        }

        if (callback)
            callback();
    };

    /**
 * Exporta el mapa a una imagen PNG. Para poder utilizar este método hay que establecer la opción `crossOrigin` al instanciar {@link SITNA.Map}. 
 * @method exportImage
 * @memberof SITNA.Map
 * @instance
 * @return {string} Imagen en un [data URI](https://developer.mozilla.org/es/docs/Web/HTTP/Basics_of_HTTP/Datos_URIs).
 * @see [Atributos de configuración CORS]{@link https://developer.mozilla.org/es/docs/Web/HTML/Atributos_de_configuracion_CORS}
 * @example <caption>[Ver en vivo](../examples/Map.exportImage.html)</caption> {@lang html} 
 * <div id="controls" class="controls">
 *     <button id="imageBtn">Exportar imagen</button>
 * </div>
 * <div id="mapa"></div>
 * <script>
 *     // Crear un mapa con la opción de imágenes CORS habilitada.
 *     var map = new SITNA.Map("mapa", { crossOrigin: "anonymous" });
 *     
 *     var exportImage = function () {
 *         var dataUrl = map.exportImage();
 *         var image = document.createElement("img");
 *         image.setAttribute("src", dataUrl);
 *         image.style.width = '25vw';
 *         var div = document.createElement("div");
 *         div.appendChild(image);
 *         document.getElementById("controls").appendChild(div);
 *     };
 *     
 *     document.getElementById("imageBtn").addEventListener("click", exportImage);
 * </script>
     */
    map.exportImage = function () {
        return tcMap.exportImage();
    };

    map.search = null;
};

var SITNA = window.SITNA || {};
var TC = window.TC || {};
TC.isDebug = true;

(function () {
    if (!window.TC || !window.TC.Cfg) {
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
        var url = TC.apiLocation + (TC.isDebug ? 'tcmap.js' : 'tcmap.min.js');
        var req = new XMLHttpRequest();
        req.open("GET", url, false); // 'false': synchronous.
        req.send(null);

        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.text = req.responseText;
        head.appendChild(script);
    }
})();

/**
 * <p>Objeto principal de la API, instancia un mapa dentro de un elemento del DOM. Nótese que el constructor es asíncrono, por tanto cualquier código que haga uso de este objeto debería
 * estar dentro de una función de callback pasada como parámetro al método {{#crossLink "SITNA.Map/loaded:method"}}{{/crossLink}}.</p>
 * <p>Las opciones de configuración del mapa son una combinación de las opciones de configuración global (definidas en {{#crossLink "SITNA.Cfg"}}{{/crossLink}}), las opciones
 * definidas por el {{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} que utilicemos, y las opciones pasadas como parámetro al constructor. Estas opciones están ordenadas de menor a mayor prevalencia,
 * de modo que por ejemplo una opción pasada como parámetro del constructor siempre sobreescribirá una opción de la configuración global.</p>
 * <p>Puede consultar también online el <a href="../../examples/Map.1.html">ejemplo 1</a>, el <a href="../../examples/Map.2.html">ejemplo 2</a> y el <a href="../../examples/Map.3.html">ejemplo 3</a>.</p>
 * @class SITNA.Map
 * @constructor
 * @async
 * @param {HTMLElement|string} div Elemento del DOM en el que crear el mapa o valor de atributo id de dicho elemento.
 * @param {object} [options] Objeto de opciones de configuración del mapa. Sus propiedades sobreescriben el objeto de configuración global {{#crossLink "SITNA.Cfg"}}{{/crossLink}}.
 * @param {string} [options.crs="EPSG:25830"] Código EPSG del sistema de referencia espacial del mapa. Por defecto es <code>"EPSG:25830"</code>.
 * @param {array} [options.initialExtent] Extensión inicial del mapa definida por x mínima, y mínima, x máxima, y máxima. 
 * Esta opción es obligatoria si el sistema de referencia espacial del mapa es distinto del sistema por defecto (ver SITNA.Cfg.{{#crossLink "SITNA.Cfg/crs:property"}}{{/crossLink}}).
 * Para más información consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/initialExtent:property"}}{{/crossLink}}.
 * @param {array} [options.maxExtent] Extensión máxima del mapa definida por x mínima, y mínima, x máxima, y máxima. Para más información consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/maxExtent:property"}}{{/crossLink}}.
 * @param {string} [options.layout] URL de una carpeta de maquetación. Consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones.
 * @param {array} [options.baseLayers] Lista de identificadores de capa o instancias de la clase {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}} para incluir dichas capas como mapas de fondo. 
 * @param {array} [options.workLayers] Lista de identificadores de capa o instancias de la clase {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}} para incluir dichas capas como contenido del mapa. 
 * @param {string|number} [options.defaultBaseLayer] Identificador o índice en <code>baseLayers</code> de la capa base por defecto. 
 * @param {SITNA.cfg.MapControlOptions} [options.controls] Opciones de controles de mapa.
 * @param {SITNA.cfg.StyleOptions} [options.styles] Opciones de estilo de entidades geográficas.
 * @param {string} [options.locale="es-ES"] Código de idioma de la interfaz de usuario. Este código debe obedecer la sintaxis definida por la <a href="https://en.wikipedia.org/wiki/IETF_language_tag">IETF</a>.
 * Los valores posibles son <code>"es-ES"</code>, <code>"eu-ES"</code> y <code>"en-US"</code>. Por defecto es <code>"es-ES"</code>.
 * @param {string} [options.crossOrigin] Valor del atributo <code>crossorigin</code> de las imágenes del mapa para <a href="https://developer.mozilla.org/es/docs/Web/HTML/Imagen_con_CORS_habilitado">habilitar CORS</a>.
 * Es necesario establecer esta opción para poder utilizar el método SITNA.Map.{{#crossLink "SITNA.Map/exportImage:method"}}{{/crossLink}}. 
 * Los valores soportados son <code>anonymous</code> y <code>use-credentials</code>.
 * @param {boolean} [options.mouseWheelZoom] Si se establece a <code>true</code>, la rueda del ratón se puede utilizar para hacer zoom en el mapa.
 * @param {string} [options.proxy] URL del proxy utilizado para peticiones a dominios remotos (ver SITNA.Cfg.{{#crossLink "SITNA.Cfg/proxy:property"}}{{/crossLink}}).
 * @example
 *     <div id="mapa"/>
 *     <script>
 *         // Crear un mapa con las opciones por defecto.
 *         var map = new SITNA.Map("mapa");
 *     </script>
 * @example
 *     <div id="mapa"/>
 *     <script>
 *         // Crear un mapa en el sistema de referencia WGS 84 con el  de mapa de fondo.
 *         var map = new SITNA.Map("mapa", {
 *             crs: "EPSG:4326",
 *             initialExtent: [ // Coordenadas en grados decimales, porque el sistema de referencia espacial es WGS 84.
 *                 -2.84820556640625,
 *                 41.78912492257675,
 *                 -0.32135009765625,
 *                 43.55789822064767
 *             ],
 *             maxExtent: [
 *                 -2.84820556640625,
 *                 41.78912492257675,
 *                 -0.32135009765625,
 *                 43.55789822064767
 *             ],
 *             baselayerExtent: [
 *                 -2.84820556640625,
 *                 41.78912492257675,
 *                 -0.32135009765625,
 *                 43.55789822064767
 *             ],
 *             baseLayers: [
 *                 SITNA.Consts.layer.IDENA_DYNBASEMAP
 *             ],
 *             defaultBaseLayer: SITNA.Consts.layer.IDENA_DYNBASEMAP,
 *             // Establecemos el mapa de situación con una capa compatible con WGS 84
 *             controls: {
 *                 overviewMap: {
 *                     layer: SITNA.Consts.layer.IDENA_DYNBASEMAP
 *                 }
 *             }
 *         });
 *     </script>
 * @example
 *     <div id="mapa"></div>
 *     <script>
 *         // Crear un mapa que tenga como contenido las capas de toponimia y mallas cartográficas del WMS de IDENA.
 *         var map = new SITNA.Map("mapa", {
 *             workLayers: [
 *                 {
 *                     id: "topo_mallas",
 *                     title: "Toponimia y mallas cartográficas",
 *                     type: SITNA.Consts.layerType.WMS,
 *                     url: "//idena.navarra.es/ogc/wms",
 *                     layerNames: "IDENA:toponimia,IDENA:mallas"
 *                 }
 *             ]
 *         });
 *     </script>
 */

/**
 * Búsqueda actual de consulta de entidad geográfica aplicado al mapa.
 * property search
 * type SITNA.Search|null
 */

SITNA.Map = function (div, options) {
    var map = this;

    // Por defecto en SITNA todas las búsquedas están habilitadas
    TC.Cfg.controls.search.allowedSearchTypes = $.extend(TC.Cfg.controls.search.allowedSearchTypes, {
        urban: {},
        street: {},
        number: {},
        cadastral: {}
    });

    if (options && options.controls && options.controls.search) {
        var searchCfg = $.extend(options.controls.search, { allowedSearchTypes: {} });

        for (key in options.controls.search) {
            if (typeof (options.controls.search[key]) === "boolean") {
                if (options.controls.search[key]) {

                    switch (true) {
                        case (key === "postalAddress"):
                            searchCfg.allowedSearchTypes[TC.Consts.searchType.NUMBER] = {};
                            break;
                        case (key === "cadastralParcel"):
                            searchCfg.allowedSearchTypes[TC.Consts.searchType.CADASTRAL] = {};
                            break;
                        case (key === "town"):
                            searchCfg.allowedSearchTypes[TC.Consts.searchType.URBAN] = {};
                            break;
                        default:
                            searchCfg.allowedSearchTypes[key] = {};
                    }                    
                }

                delete searchCfg[key];
            }
        }

        options.controls.search = searchCfg;
    }

    var tcMap = new TC.Map(div, options);
    var tcSearch;
    var tcSearchLayer;

    /**
     * <p>Añade una capa al mapa. Si se le pasa una instancia de la clase {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}} como parámetro <code>layer</code> y tiene definida 
     * la propiedad SITNA.cfg.LayerOptions.{{#crossLink "SITNA.cfg.LayerOptions/url:property"}}{{/crossLink}}, establece por defecto el tipo de capa a 
     * {{#crossLink "SITNA.consts.LayerType/KML:property"}}{{/crossLink}} si la URL acaba en ".kml".
     * El tipo de la capa no puede ser {{#crossLink "SITNA.consts.LayerType/WFS:property"}}{{/crossLink}}.</p>
     * <p>Puede consultar también online el <a href="../../examples/Map.addLayer.1.html">ejemplo 1</a> y el <a href="../../examples/Map.addLayer.2.html">ejemplo 2</a>.</p>
     *
     * @method addLayer
     * @async
     * @param {string|SITNA.cfg.LayerOptions} layer Identificador de capa u objeto de opciones de capa.
     * @param {function} [callback] Función a la que se llama tras ser añadida la capa. 
     * @example
     *     <div id="mapa"></div>
     *     <script>
     *         // Crear un mapa con las opciones por defecto.
     *         var map = new SITNA.Map("mapa");
     *         // Cuando esté todo cargado proceder a trabajar con el mapa.
     *         map.loaded(function () {
     *             // Añadir al mapa la capa de cartografía topográfica de IDENA
     *             map.addLayer(SITNA.Consts.layer.IDENA_CARTO);
     *         });
     *     </script>
     * @example
     *     <div id="mapa"></div>
     *     <script>
     *         // Crear un mapa con las opciones por defecto.
     *         var map = new SITNA.Map("mapa");
     * 
     *         // Cuando esté todo cargado proceder a trabajar con el mapa.
     *         map.loaded(function () {
     *             // Añadir al mapa un documento KML
     *             map.addLayer({
     *                 id: "capa_kml",
     *                 title: "Museos en Navarra",
     *                 type: SITNA.Consts.layerType.KML,
     *                 url: "data/MUSEOSNAVARRA.kml"
     *             });
     *         });
     *     </script>
     */
    map.addLayer = function (layer, callback) {
        tcMap.addLayer(layer, callback);
    };

    /**
     * <p>Hace visible una capa como mapa de fondo. Esta capa debe existir previamente en la lista de mapas de fondo del mapa.</p>
     * <p>Puede consultar también online el <a href="../../examples/Map.setBaseLayer.1.html">ejemplo 1</a> y el <a href="../../examples/Map.setBaseLayer.2.html">ejemplo 2</a>.</p>
     * @method setBaseLayer
     * @async
     * @param {string|SITNA.cfg.LayerOptions} layer Identificador de capa u objeto de opciones de capa. 
     * @param {function} [callback] Función al que se llama tras ser establecida la capa como mapa de fondo.
     * @example
     *     <div id="mapa"></div>
     *     <script>
     *         // Crear mapa con opciones por defecto. Esto incluye la capa del catastro de Navarra entre los mapas de fondo.
     *         var map = new SITNA.Map("mapa");
     *         // Cuando esté todo cargado establecer como mapa de fondo visible el catastro de Navarra.
     *         map.loaded(function () {
     *             map.setBaseLayer(SITNA.Consts.layer.IDENA_CADASTER);
     *         });
     *     </script>
     * @example
     *     <div id="mapa"></div>
     *     <script>
     *         // Crear mapa con opciones por defecto.
     *         var map = new SITNA.Map("mapa");
     *         // Cuando el mapa esté cargado, añadir la ortofoto de 1956/1957 como mapa de fondo y establecerla como mapa de fondo visible.
     *         map.loaded(function () {
     *             map.addLayer({
     *                 id: "orto_56_57",
     *                 title: "Ortofoto de 1956/1957",
     *                 url: "http://idena.navarra.es/ogc/wms",
     *                 layerNames: "ortofoto_10000_1957",
     *                 isBase: true
     *             }, function () {
     *                 map.setBaseLayer("orto_56_57");
     *             });
     *         });
     *     </script>
     */
    map.setBaseLayer = function (layer, callback) {
        tcMap.setBaseLayer(layer, callback);
    };

    /**
     * Añade un marcador (un punto asociado a un icono) al mapa.
     * <p>Puede consultar también online el <a href="../../examples/Map.addMarker.1.html">ejemplo 1</a>, el <a href="../../examples/Map.addMarker.2.html">ejemplo 2</a>,
     * el <a href="../../examples/Map.addMarker.3.html">ejemplo 3</a> y el <a href="../../examples/Map.addMarker.4.html">ejemplo 4</a>.</p>
     * @method addMarker
     * @async
     * @param {array} coords Coordenadas x e y del punto en las unidades del sistema de referencia del mapa.
     * @param {object} [options] Objeto de opciones de marcador.
     * @param {string} [options.group] <p>Nombre de grupo en el que incluir el marcador. Estos grupos se muestran en la tabla de contenidos y en la leyenda.</p>
     * <p>Todos los marcadores pertenecientes al mismo grupo tienen el mismo icono. Los iconos se asignan automáticamente, rotando por la lista disponible en
     * SITNA.cfg.MarkerStyleOptions.{{#crossLink "SITNA.cfg.MarkerStyleOptions/classes:property"}}{{/crossLink}}.</p>
     * @param {string} [options.cssClass] Nombre de clase CSS. El marcador adoptará como icono el valor del atributo <code>background-image</code> de dicha clase.
     * @param {string} [options.url] URL de archivo de imagen que será el icono del marcador.
     * @param {number} [options.width] Anchura en píxeles del icono del marcador.
     * @param {number} [options.height] Altura en píxeles del icono del marcador.
     * @param {array} [options.anchor] Coordenadas proporcionales (entre 0 y 1) del punto de anclaje del icono al punto del mapa. La coordenada [0, 0] es la esquina superior izquierda del icono.
     * @param {object} [options.data] Objeto de datos en pares clave/valor para mostrar cuando se pulsa sobre el marcador. Si un valor es una URL, se mostrará como un enlace.
     * @param {boolean} [options.showPopup] Si se establece a <code>true</code>, al añadirse el marcador al mapa se muestra con el bocadillo de información asociada visible por defecto.
     * @param {string} [options.layer] Identificador de capa de tipo SITNA.consts.LayerType.{{#crossLink "SITNA.consts.LayerType/VECTOR:property"}}{{/crossLink}} en la que se añadirá el marcador. Si no se especifica se creará una capa específica para marcadores.
     * @example
     *     <div id="mapa"></div>
     *     <script>
     *         // Crear mapa.
     *         var map = new SITNA.Map("mapa");
     * 
     *         // Cuando esté todo cargado proceder a trabajar con el mapa.
     *         map.loaded(function () {
     *             // Añadir un marcador.
     *             map.addMarker([610749, 4741648]);
     * 			// Centrar el mapa en el marcador.
     * 			map.zoomToMarkers();
     *         });
     *     </script>
     * @example
     *     <div id="mapa"></div>
     *     <script>
     *         // Crear mapa.
     *         var map = new SITNA.Map("mapa");
     * 
     *         // Cuando esté todo cargado proceder a trabajar con el mapa.
     *         map.loaded(function () {
     *             // Añadir marcadores al grupo "Marcadores colgantes" cuyo icono se ancle al punto en el centro hacia abajo. Establecer un icono adecuado.
     *             var markerOptions = {
     *                 group: "Marcadores colgantes",
     *                 url: "data/colgante.png",
     *                 anchor: [0.5, 0]
     *             };
     *             map.addMarker([610887, 4741244], markerOptions);
     *             map.addMarker([615364, 4657556], markerOptions);
     * 			// Centrar el mapa en los marcadores.
     * 			map.zoomToMarkers();
     *         });
     *     </script>
     * @example
     *     <div id="mapa"></div>
     *     <script>
     *         // Crear un mapa con una capa vectorial, centrado en la Ciudadela de Pamplona.
     *         var map = new SITNA.Map("mapa", {
     *             initialExtent: [
     *                 609627,
     *                 4740225,
     *                 611191,
     *                 4741395
     *             ],
     *             workLayers: [{
     *                 id: "markers",
     *                 title: "Marcadores geográficos",
     *                 type: SITNA.Consts.layerType.VECTOR
     *             }]
     *         });
     *         // Cuando esté todo cargado proceder a trabajar con el mapa.
     *         map.loaded(function () {
     *             // Añadir un marcador en la capa "markers", asignarle un grupo para que salga en tabla de contenidos y leyenda.
     *             map.addMarker([610431, 4740837], {
     *                 layer: "markers",
     *                 group: "Ciudadela"
     *             });
     *         });
     *     </script>
     * @example
     *     <style type="text/css">
     *         .kiosko {
     *             background-image: url("data/icono-kiosko.png");
     *         }
     *     </style>
     *     <div id="mapa"></div>
     *     <script>
     *         // SITNA.Cfg.baseLayers[0] (capa por defecto) no es compatible con WGS 84, lo cambiamos por SITNA.Consts.layer.IDENA_DYNBASEMAP.
     *         SITNA.Cfg.baseLayers[0] = SITNA.Consts.layer.IDENA_DYNBASEMAP;
     *         SITNA.Cfg.defaultBaseLayer = SITNA.Consts.layer.IDENA_DYNBASEMAP;
     *         // Añadir información emergente al mapa.
     *         SITNA.Cfg.controls.popup = true;
     * 
     *         // Crear un mapa en el sistema de referencia WGS 84.
     *         var map = new SITNA.Map("mapa", {
     *             crs: "EPSG:4326",
     *             initialExtent: [ // Coordenadas en grados decimales, porque el sistema de referencia espacial es WGS 84.
     *                 -2.84820556640625,
     *                 41.78912492257675,
     *                 -0.32135009765625,
     *                 43.55789822064767
     *             ],
     *             maxExtent: [
     *                 -2.84820556640625,
     *                 41.78912492257675,
     *                 -0.32135009765625,
     *                 43.55789822064767
     *             ],
     *             // Establecemos el mapa de situación con una capa compatible con WGS 84
     *             controls: {
     *                 overviewMap: {
     *                     layer: SITNA.Consts.layer.IDENA_DYNBASEMAP
     *                 }
     *             }
     *         });
     *         // Cuando esté todo cargado proceder a trabajar con el mapa.
     *         map.loaded(function () {
     *             // Añadir un marcador con un icono de 40x40 píxeles definido por la clase CSS kiosko. Asignarle unos datos asociados que se muestren por defecto.
     *             map.addMarker([-1.605691, 42.060453], { // Coordenadas en grados decimales porque el mapa está en WGS 84.
     *                 cssClass: "kiosko",
     *                 width: 40,
     *                 height: 40,
     *                 data: {
     *                     "Nombre": "Plaza de la Constitución, Tudela",
     *                     "Sitio web": "http://www.tudela.es/"
     *                 },
     *                 showPopup: true
     *             });
     * 			// Centrar el mapa en el marcador.
     * 			map.zoomToMarkers();
     *         });
     *     </script>
     */
    map.addMarker = function (coords, options) {
        tcMap.addMarker(coords, options);
    };

    /**
     * Centra y escala el mapa a la extensión que ocupan todos sus marcadores.
     * <p>Puede consultar también el ejemplo <a href="../../examples/Map.zoomToMarkers.html">online</a>.</p>
     * @method zoomToMarkers
     * @param {object} [options] Objeto de opciones de zoom.
     * @param {number} [options.pointBoundsRadius=30] Radio en metros del área alrededor del marcador que se respetará al hacer zoom. Por defecto es 30.
     * @param {number} [options.extentMargin=0.2] Tamaño del margen que se aplicará a la extensión total de todas los marcadores.
     * El valor es la relación de crecimiento en ancho y alto entre la extensión resultante y la original. Por ejemplo, el valor por defecto 0,2 indica un crecimiento del 20% de la extensión, 10% por cada lado.
     * @async
     * @example
     *     <div class="controls">
     *         <div><button id="addMarkerBtn">Añadir marcador aleatorio</button></div>
     *         <div><input type="number" step="1" id="pbrVal" value="30" /> <label for="pbrVal">pointBoundsRadius</label></div>
     *         <div><input type="number" step="0.1" id="emVal" value="0.2" /> <label for="emVal">extentMargin</label></div>
     *         <div><button id="zoomBtn">Hacer zoom a los marcadores</button></div>
     *     </div>
     *     <div id="mapa"></div>
     *     <script>
     *         // Crear mapa.
     *         var map = new SITNA.Map("mapa");
     *
     *         // Añadir un marcador en un punto aleatorio
     *         var addRandomMarker = function () {
     *             var xmin = SITNA.Cfg.initialExtent[0];
     *             var ymin = SITNA.Cfg.initialExtent[1];
     *             var width = SITNA.Cfg.initialExtent[2] - SITNA.Cfg.initialExtent[0];
     *             var height = SITNA.Cfg.initialExtent[3] - SITNA.Cfg.initialExtent[1];
     *             map.addMarker([xmin + Math.random() * width, ymin + Math.random() * height]);
     *         };
     *
     *         // Hacer zoom a los marcadores con las opciones elegidas
     *         var zoomToMarkers = function () {
     *             map.zoomToMarkers({
     *                 pointBoundsRadius: parseInt(document.getElementById("pbrVal").value),
     *                 extentMargin: parseFloat(document.getElementById("emVal").value)
     *             });
     *         };
     *
     *         document.getElementById("addMarkerBtn").addEventListener("click", addRandomMarker);
     *         document.getElementById("zoomBtn").addEventListener("click", zoomToMarkers);
     *     </script>
     */
    map.zoomToMarkers = function (options) {
        tcMap.zoomToMarkers(options);
    };

    /**
     * Añade una función de callback que se ejecutará cuando el mapa, sus controles y todas sus capas se hayan cargado.
     *
     * @method loaded
     * @async
     * @param {function} callback Función a la que se llama tras la carga del mapa.
     * @example
     *      // Notificar cuando se haya cargado el mapa.
     *      map.loaded(function () { 
     *          console.log("Código del mapa y de sus controles cargado, cargando datos...");
     *      });
     */
    map.loaded = function (callback) {
        tcMap.loaded(callback);
    };

    // Si existe el control featureInfo lo activamos.
    tcMap.loaded(function () {

        tcSearch = new TC.control.Search();
        tcSearch.register(tcMap);

        tcSearch.getLayer().then(function (layer) {
            tcSearchLayer = layer;
        });

        if (!tcMap.activeControl) {
            var fi = tcMap.getControlsByClass('TC.control.FeatureInfo')[0];
            if (fi) {
                fi.activate();
            }
        }
    });

    /**
    * <p>Obtiene los valores (id y label) de las entidades geográficas disponibles en la capa de IDENA que corresponda según el parámetro searchType. 
    * <p>Puede consultar también online el <a href="../../examples/Map.getQueryableData.html">ejemplo 1</a>.</p>
    *
    * method getQueryableData
    * async
    * param {string|SITNA.consts.MapSearchType} searchType Fuente de datos del cual obtendremos los valores disponibles para buscar posteriormente.
    * param {function} [callback] Función a la que se llama tras obtener los datos.    
    * example
    *     <div id="mapa"></div>
    *     <script>
    *         // Crear un mapa con las opciones por defecto.
    *         var map = new SITNA.Map("mapa");
    *     
    *         // Cuando esté todo cargado proceder a trabajar con el mapa.
    *         map.loaded(function () {    
    *             // Retorna un array de objetos (id, label) con todos los municipios de Navarra
    *             map.getQueryableData(SITNA.Consts.mapSearchType.MUNICIPALITY, function (data) {
    *                 $.each(data, function (key, value) {
    *                     $('#municipality')    // Completamos el combo '#municipality' con los datos recibidos
    *                       .append($("<option></option>")
    *                       .attr("value", value.id)
    *                       .text(value.label));
    *                 });
    *             });
    *
    *             // Retorna un array de objetos (id, label) con todas las mancomunidades de residuos de Navarra
    *             map.getQueryableData(SITNA.Consts.mapSearchType.COMMONWEALTH, function (data) {
    *                 $.each(data, function (key, value) {
    *                     $('#commonwealth')    // Completamos el combo '#community' con los datos recibidos
    *                       .append($("<option></option>")
    *                       .attr("value", value.id)
    *                       .text(value.label));
    *                 });
    *             });
    *         });
    *     </script>
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

            var url = queryable.url + '?' + $.param(params);
            $.ajax({
                url: url
            }).done(function (data) {
                queryable.queryableData = [];

                if (data.features) {
                    var features = data.features;

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
    * <p>Obtiene los valores (id y label) de los municipios disponibles en la capa de IDENA. 
    * <p>Puede consultar también online el <a href="../../examples/Map.getMunicipalities.html">ejemplo 1</a>.</p>
    *
    * @method getMunicipalities
    * @async    
    * @param {function} [callback] Función a la que se llama tras obtener los datos.    
    * @example
    *     <div class="instructions divSelect">
    *        <div>
    *            Municipios
    *            <select id="municipality" onchange="applyFilter()">
    *                <option value="-1">Seleccione...</option>
    *            </select>
    *        </div>
    *     </div>
    *     <div id="mapa"></div>
    *     <script>
    *        // Crear mapa.
    *        var map = new SITNA.Map("mapa");
    *        map.loaded(function () {
    *            // completamos el desplegable
    *            map.getMunicipalities(function (data) {
    *                $.each(data, function (key, value) {
    *                    $('#municipality').append($("<option></option>")
    *                         .attr("value", value.id)
    *                         .text(value.label));
    *                    });
    *                });
    *            });
    *        // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
    *        function applyFilter() {
    *            var id = $('#municipality').find('option:selected').val();
    *            if (id == -1)
    *                map.removeSearch();
    *            else {
    *                map.searchMunicipality(id, function (idQuery) {
    *                    if (idQuery == null)
    *                        alert('No se han encontrado resultados');
    *                });
    *            }
    *        };
    *   </script>
    */
    map.getMunicipalities = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.MUNICIPALITY, callback);
    };
    /**
        * <p>Obtiene los valores (id y label) de los cascos urbanos disponibles en la capa de IDENA. 
        * <p>Puede consultar también online el <a href="../../examples/Map.getUrbanAreas.html">ejemplo 1</a>.</p>
        *
        * @method getUrbanAreas
        * @async    
        * @param {function} [callback] Función a la que se llama tras obtener los datos.    
        * @example
        *     <div class="instructions divSelect">
        *        <div>
        *            Cascos urbanos
        *            <select id="urban" onchange="applyFilter()">
        *                <option value="-1">Seleccione...</option>
        *            </select>
        *        </div>
        *     </div>
        *     <div id="mapa"></div>
        *     <script>
        *        // Crear mapa.
        *        var map = new SITNA.Map("mapa");
        *        map.loaded(function () {
        *            // completamos el desplegable
        *            map.getUrbanAreas(function (data) {
        *                $.each(data, function (key, value) {
        *                    $('#urban').append($("<option></option>")
        *                         .attr("value", value.id)
        *                         .text(value.label));
        *                    });
        *                });
        *            });
        *        // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
        *        function applyFilter() {
        *            var id = $('#urban').find('option:selected').val();
        *            if (id == -1)
        *                map.removeSearch();
        *            else {
        *                map.searchUrbanArea(id, function (idQuery) {
        *                    if (idQuery == null)
        *                        alert('No se han encontrado resultados');
        *                });
        *            }
        *        };
        *   </script>
        */
    map.getUrbanAreas = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.URBAN, callback);
    };
    /**
    * <p>Obtiene los valores (id y label) de las mancomunidades de residuos disponibles en la capa de IDENA. 
    * <p>Puede consultar también online el <a href="../../examples/Map.getCommonwealths.html">ejemplo 1</a>.</p>
    *
    * @method getCommonwealths
    * @async    
    * @param {function} [callback] Función a la que se llama tras obtener los datos.    
    * @example
    *     <div class="instructions divSelect">
   *        <div>
   *            Mancomunidades de residuos
   *            <select id="commonwealths" onchange="applyFilter()">
   *                <option value="-1">Seleccione...</option>
   *            </select>
   *        </div>
   *     </div>
   *     <div id="mapa"></div>
   *     <script>
   *        // Crear mapa.
   *        var map = new SITNA.Map("mapa");
   *        map.loaded(function () {
   *            // completamos el desplegable
   *            map.getCommonwealths(function (data) {
   *                $.each(data, function (key, value) {
   *                    $('#commonwealths').append($("<option></option>")
   *                        .attr("value", value.id)
   *                        .text(value.label));
   *                    });
   *                });
   *            });
   *        // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
   *        function applyFilter() {
   *            var id = $('#commonwealths').find('option:selected').val();
   *            if (id == -1)
   *                map.removeSearch();
   *            else {
   *                map.searchCommonwealth(id, function (idQuery) {
   *                    if (idQuery == null)
   *                        alert('No se han encontrado resultados');
   *                });
   *            }
   *        };
   *   </script>
    */
    map.getCommonwealths = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.COMMONWEALTH, callback);
    };
    /**
      * <p>Obtiene los valores (id y label) de los concejos disponibles en la capa de IDENA. 
      * <p>Puede consultar también online el <a href="../../examples/Map.getCouncils.html">ejemplo 1</a>.</p>
      *
      * @method getCouncils
      * @async    
      * @param {function} [callback] Función a la que se llama tras obtener los datos.    
      * @example
      *     <div class="instructions divSelect">
      *        <div>
      *            Concejos
      *            <select id="council" onchange="applyFilter()">
      *                <option value="-1">Seleccione...</option>
      *            </select>
      *        </div>
      *     </div>
      *     <div id="mapa"></div>
      *     <script>
      *        // Crear mapa.
      *        var map = new SITNA.Map("mapa");
      *        map.loaded(function () {
      *            // completamos el desplegable
      *            map.getCouncils(function (data) {
      *                $.each(data, function (key, value) {
      *                    $('#council').append($("<option></option>")
      *                        .attr("value", value.id)
      *                        .text(value.label));
      *                    });
      *                });
      *            });
      *        // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
      *        function applyFilter() {
      *            var id = $('#council').find('option:selected').val();
      *            if (id == -1)
      *                map.removeSearch();
      *            else {
      *                map.searchCouncil(id, function (idQuery) {
      *                    if (idQuery == null)
      *                        alert('No se han encontrado resultados');
      *                });
      *            }
      *        };
      *   </script>
      */
    map.getCouncils = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.COUNCIL, callback);
    };
    /**
        * <p>Busca la mancomunidad de residuos y pinta en el mapa la entidad geográfica encontrada que corresponda al identificador indicado.
        * <p>Puede consultar también online el <a href="../../examples/Map.searchCommonwealth.html">ejemplo 1</a>.</p>
        *
        * @method searchCommonwealth
        * @async
        * @param {string} id Identificador de la entidad geográfica a pintar.
        * @param {function} [callback] Función a la que se llama tras aplicar el filtro.    
        * @example
        *           <div class="instructions searchCommonwealth">        
        *              <div><button id="searchPamplonaBtn">Buscar Mancomunidad de la Comarca de Pamplona</button></div>        
        *           </div>
        *           <div id="mapa"></div>
        *           <script>
        *               // Crear mapa.
        *               var map = new SITNA.Map("mapa");
        *               map.loaded(function () {
        *                   document.getElementById("searchPamplonaBtn").addEventListener("click", search);
        *               });
        *
        *               var search = function () {
        *                   map.removeSearch();
        *                   map.searchCommonwealth("8", function (idQuery) {
        *                       if (idQuery == null) {
        *                           alert("No se ha encontrado la mancomunidad con código 8.");
        *                       }
        *                   });
        *               };
        *           </script>
        */

    map.searchCommonwealth = function (id, callback) {
        map.searchTyped(SITNA.Consts.mapSearchType.COMMONWEALTH, id, callback);
    };
    /**
        * <p>Busca el concejo que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
        * <p>Puede consultar también online el <a href="../../examples/Map.searchCouncil.html">ejemplo 1</a>.</p>
        *
        * @method searchCouncil
        * @async        
        * @param {string} id Identificador de la entidad geográfica a pintar.
        * @param {function} [callback] Función a la que se llama tras aplicar el filtro.    
        * @example
        *            <div class="instructions search">        
        *               <div><button id="searchBtn">Buscar concejo Esquíroz (Galar)</button></div>        
        *            </div>
        *            <div id="mapa"></div>
        *            <script>
        *               // Crear mapa.
        *               var map = new SITNA.Map("mapa");
        *               map.loaded(function () {
        *                   document.getElementById("searchBtn").addEventListener("click", search);
        *               });
        *
        *               var search = function () {
        *                   map.removeSearch();
        *                   map.searchCouncil("109#5", function (idQuery) {
        *                       if (idQuery == null) {
        *                               alert("No se ha encontrado el concejo con código 109#5.");
        *                       }
        *                   });
        *               };        
        *            </script>        
        **/
    map.searchCouncil = function (id, callback) {
        map.searchTyped(SITNA.Consts.mapSearchType.COUNCIL, id, callback);
    };
    /**
        * <p>Busca el casco urbano que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
        * <p>Puede consultar también online el <a href="../../examples/Map.searchUrbanArea.html">ejemplo 1</a>.</p>
        *
        * @method searchUrbanArea
        * @async        
        * @param {string} id Identificador de la entidad geográfica a pintar.
        * @param {function} [callback] Función a la que se llama tras aplicar el filtro.    
        * @example
        *           <div class="instructions search">
        *           <div><button id="searchBtn">Buscar casco urbano de Arbizu</button></div>
        *           </div>
        *           <div id="mapa"></div>
        *           <script>
        *               // Crear mapa.
        *               var map = new SITNA.Map("mapa");
        *               map.loaded(function () {
        *                   document.getElementById("searchBtn").addEventListener("click", search);
        *               });
        *               var search = function () {
        *                   map.removeSearch();
        *                   map.searchUrbanArea("27", function (idQuery) {
        *                       if (idQuery == null) {
        *                           alert("No se ha encontrado el casco urbano con código 27.");
        *                       }
        *                   });
        *               };
        *           </script>
        **/
    map.searchUrbanArea = function (id, callback) {
        map.searchTyped(SITNA.Consts.mapSearchType.URBAN, id, callback);
    };
    /**
        * <p>Busca el municipio que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
        * <p>Puede consultar también online el <a href="../../examples/Map.searchMunicipality.html">ejemplo 1</a>.</p>
        *
        * @method searchMunicipality
        * @async        
        * @param {string} id Identificador de la entidad geográfica a pintar.
        * @param {function} [callback] Función a la que se llama tras aplicar el filtro.    
        * @example
        *            <div class="instructions search">
        *               <div><button id="searchBtn">Buscar Arbizu</button></div>
        *            </div>
        *            <div id="mapa"></div>
        *            <script>
        *               // Crear mapa.
        *               var map = new SITNA.Map("mapa");
        *               map.loaded(function () {
        *                   document.getElementById("searchBtn").addEventListener("click", search);
        *               });
        *
        *               var search = function () {
        *                    map.removeSearch();
        *                    map.searchCouncil("27", function (idQuery) {
        *                       if (idQuery == null) {
        *                           alert("No se ha encontrado el municipio con código 27.");
        *                       }
        *                    });
        *               };
        *            </script>
        **/
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

        if (tcSearch.availableSearchTypes[searchType] && !(tcSearch.allowedSearchTypes[searchType])) {
            tcSearch.allowedSearchTypes = {};
            tcSearch.allowedSearchTypes[searchType] = {};

            if (!tcSearch.availableSearchTypes[searchType].hasOwnProperty('goTo')) {
                tcSearch.allowedSearchTypes[searchType] = {
                    goTo: function () {
                        var getProperties = function (id) {

                            if (!TC.filter) {
                                TC.syncLoadJS(TC.apiLocation + 'TC/Filter');
                            }

                            var filter = [];
                            if (query.idPropertiesIdentifier) id = id.split(query.idPropertiesIdentifier);
                            if (!(id instanceof Array)) id = [id];
                            for (var i = 0; i < query.dataIdProperty.length; i++) {
                                filter.push(
                                    new TC.filter.equalTo(query.dataIdProperty[i], $.trim(id[i]))                                    
                                );
                            }

                            if (filter.length > 1) {
                                filter = new TC.filter.and(filter);
                            } else {
                                filter = filter[0];
                            }

                            return filter;
                        };
                        var layerOptions = {
                            id: idQuery,
                            type: SITNA.Consts.layerType.WFS,
                            url: query.url,
                            version: query.version,
                            stealth: true,
                            geometryName: 'the_geom',
                            featurePrefix: query.featurePrefix,
                            featureType: query.featureType,
                            properties: getProperties(id),
                            outputFormat: TC.Consts.format.JSON,
                            styles: query.styles[query.featureType]                            
                        };

                        var tcSrchTypedLayer;
                        tcMap.addLayer(layerOptions).then(function (layer) {
                            tcSrchTypedLayer = layer;

                            map.search = {
                                layer: layer, type: searchType
                            };
                            delete tcSearch.allowedSearchTypes[searchType];
                        });

                        tcMap.one(TC.Consts.event.FEATURESADD, function (e) {
                            if (e.layer == tcSrchTypedLayer && e.layer.features && e.layer.features.length > 0) {
                                for (var i = 0; i < e.layer.features.length; i++) {
                                    if (e.layer.features[i].showsPopup != tcSearch.queryableFeatures)
                                        e.layer.features[i].showsPopup = tcSearch.queryableFeatures;
                                }

                                tcMap.zoomToFeatures(e.layer.features);
                            }
                        });
                    }
                };
            }
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

        tcSearch.goToResult(id);
    };
    /**
            * <p>Busca y pinta en el mapa la entidad geográfica encontrada correspondiente al identificador establecido.
            * <p>Puede consultar también online el <a href="../../examples/Map.searchFeature.html">ejemplo 1</a>.</p>
            *
            * @method searchFeature
            * @async
            * @param {string} layer Capa de IDENA en la cual buscar.
            * @param {string} field Campo de la capa de IDENA en el cual buscar.
            * @param {string} id Identificador de la entidad geográfica por el cual filtrar.
            * @param {function} [callback] Función a la que se llama tras aplicar el filtro.    
            * @example
                  *     <div class="instructions query">
                  *          <div><label>Capa</label><input type="text" id="capa" placeholder="Nombre capa de IDENA" /> </div>
                  *          <div><label>Campo</label><input type="text" id="campo" placeholder="Nombre campo" /> </div>
                  *          <div><label>Valor</label><input type="text" id="valor" placeholder="Valor a encontrar" /> </div>
                  *          <div><button id="searchBtn">Buscar</button></div>
                  *          <div><button id="removeBtn">Eliminar filtro</button></div>
                  *      </div>
                  *      <div id="mapa"></div>
                  *      <script>
                  *          // Crear mapa.
                  *            var map = new SITNA.Map("mapa");
                  *          
                  *            map.loaded(function () {
                  *                document.getElementById("searchBtn").addEventListener("click", search);
                  *                document.getElementById("removeBtn").addEventListener("click", remove);
                  *            });
                  *            
                  *            var search = function () {
                  *                var capa = document.getElementById("capa").value;
                  *                capa = capa.trim();
                  *          
                  *                var campo = document.getElementById("campo").value;
                  *                campo = campo.trim();
                  *          
                  *                var valor = document.getElementById("valor").value;
                  *                valor = valor.trim();
                  *          
                  *                map.searchFeature(capa, campo, valor, function (idQuery) {
                  *                    if (idQuery == null) {
                  *                        alert("No se han encontrado resultados en la capa: " + capa + " en el campo: " + campo + " el valor: " + valor + ".");
                  *                    }
                  *                });
                  *            };
                  *          
                  *            // Limpiar el mapa 
                  *            var remove = function () {
                  *                map.removeSearch();
                  *            };
                  *      </script>
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
                properties: tcSearch.transformFilter([{
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
                if (e.layer == tcSrchGenericLayer && e.layer.features && e.layer.features.length > 0) {

                    for (var i = 0; i < e.layer.features.length; i++) {
                        if (e.layer.features[i].showsPopup != tcSearch.queryableFeatures)
                            e.layer.features[i].showsPopup = tcSearch.queryableFeatures;
                    }

                    tcMap.zoomToFeatures(e.layer.features);
                }
            });

            tcMap.on(TC.Consts.event.LAYERUPDATE, function (e) {
                if (e.layer == tcSrchGenericLayer && e.newData && e.newData.features && e.newData.features.length == 0)
                    tcMap.toast(tcSearch.EMPTY_RESULTS_LABEL, {
                        type: TC.Consts.msgType.INFO, duration: 5000
                    });

                if (callback)
                    callback(e.layer == tcSrchGenericLayer && e.newData && e.newData.features && e.newData.features.length == 0 ? null : idQuery);
            });
        }
    };
    /**
      * <p>Elimina del mapa la entidad geográfica encontrada. 
      * <p>Puede consultar también online el <a href="../../examples/Map.removeSearch.html">ejemplo 1</a>.</p>
      *
      * @method removeSearch
      * @async      
      * @param {function} [callback] Función a la que se llama tras eliminar la entidad geográfica.    
      * @example
      *     <div class="instructions query">
      *          <div><label>Capa</label><input type="text" id="capa" placeholder="Nombre capa de IDENA" /> </div>
      *          <div><label>Campo</label><input type="text" id="campo" placeholder="Nombre campo" /> </div>
      *          <div><label>Valor</label><input type="text" id="valor" placeholder="Valor a encontrar" /> </div>
      *          <div><button id="searchBtn">Buscar</button></div>
      *          <div><button id="removeBtn">Eliminar filtro</button></div>
      *      </div>
      *      <div id="mapa"></div>
      *      <script>
      *          // Crear mapa.
      *          var map = new SITNA.Map("mapa");
      *
      *          map.loaded(function () {
      *              document.getElementById("addFilterBtn").addEventListener("click", addFilter);
      *              document.getElementById("removeFilterBtn").addEventListener("click", removeFilter);
      *          });
      *
      *          // Establecer como filtro del mapa el municipio Valle de Egüés
      *          var addFilter = function () {
      *              var capa = document.getElementById("capa").value;
      *              capa = capa.trim();
      *
      *             var campo = document.getElementById("campo").value;
      *              campo = campo.trim();
      *
      *              var valor = document.getElementById("valor").value;
      *              valor = valor.trim();
      *     
      *              map.setQuery(capa, campo, valor, function (idQuery) {
      *                  if (idQuery == null) {
      *                      alert("No se han encontrado resultados en la capa: " + capa + " en el campo: " + campo + " el valor: " + valor + ".");
      *                  }
      *              });
      *          };
      *         
      *          // Limpiar el mapa del filtro
      *          var remove = function () {
      *              map.removeSearch();
      *          };
      *      </script>
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
      * <p>Exporta el mapa a una imagen PNG. Para poder utilizar este método hay que establecer la opción <code>crossOrigin</code> al instanciar
      * {{#crossLink "SITNA.Map"}}{{/crossLink}}.</p>
      * <p>Puede consultar también el ejemplo <a href="../../examples/Map.exportImage.html">online</a>.</p>
      *
      * @method exportImage
      * @return {String} Imagen en un <a href="https://developer.mozilla.org/es/docs/Web/HTTP/Basics_of_HTTP/Datos_URIs">data URI</a>.
      * @example
      *     <div id="controls" class="controls">
      *          <button id="imageBtn">Exportar imagen</button>
      *     </div>
      *      <div id="mapa"></div>
      *      <script>
      *          // Crear un mapa con la opción de imágenes CORS habilitada.
      *          var map = new SITNA.Map("mapa", { crossOrigin: "anonymous" });
      *
      *          var exportImage = function () {
      *              var dataUrl = map.exportImage();
      *              var image = document.createElement("img");
      *              image.setAttribute("src", dataUrl);
      *              image.style.width = '25vw';
      *              var div = document.createElement("div");
      *              div.appendChild(image);
      *              document.getElementById("controls").appendChild(div);
      *          };
      *         
      *          document.getElementById("imageBtn").addEventListener("click", exportImage);
      *      </script>
      */
    map.exportImage = function () {
        return tcMap.exportImage();
    };

    map.search = null;
};


/**
 * Colección de constantes utilizadas por la API. Se recomienda utilizar las propiedades de esta clase estática para referirse a valores conocidos.
 * No deberían modificarse las propiedades de esta clase.
 * @class SITNA.Consts
 * @static
 */
SITNA.Consts = TC.Consts;
/**
 * Identificadores de capas útiles de IDENA y otros servicios de terceros.
 * @property layer
 * @type SITNA.consts.Layer
 * @final
 */
/**
 * Identificadores de tipo de capa.
 * @property layerType
 * @type SITNA.consts.LayerType
 * @final
 */
/**
 * Identificadores de tipo de consulta al mapa.
 * property mapSearchType
 * type SITNA.consts.MapSearchType
 * final
 */
/**
 * Tipos MIME de utilidad.
 * @property mimeType
 * @type SITNA.consts.MimeType
 * @final
 */

/**
 * Colección de identificadores de tipo de capa.
 * No se deberían modificar las propiedades de esta clase.
 * @class SITNA.consts.LayerType
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
 * Identificador de capa de tipo vectorial. Este tipo de capa es la que se utiliza para dibujar marcadores.
 * @property VECTOR
 * @type string
 * @final
 */

/**
 * Colección de identificadores de capas útiles de IDENA y otros servicios de terceros.
 * No se deberían modificar las propiedades de esta clase.
 * @class SITNA.consts.Layer
 * @static
 */
/**
 * Identificador de la capa de ortofoto de máxima actualidad del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property IDENA_ORTHOPHOTO
 * @type string
 * @final
 */
/**
 * Identificador de la capa de mapa base del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property IDENA_BASEMAP
 * @type string
 * @final
 */
/**
 * Identificador de la capa de catastro del WMS de IDENA.
 * @property IDENA_CADASTER
 * @type string
 * @final
 */
/**
 * Identificador de la capa de cartografía topográfica del WMS de IDENA.
 * @property IDENA_CARTO
 * @type string
 * @final
 */
/**
 * Identificador de la capa de la combinación de ortofoto de máxima actualidad y mapa base del WMS de IDENA.
 * @property IDENA_BASEMAP_ORTHOPHOTO
 * @type string
 * @final
 */
/**
 * Identificador de la capa de relieve en blanco y negro del WMS de IDENA.
 * @property IDENA_BW_RELIEF
 * @type string
 * @final
 */
/**
 * Identificador de la capa de ortofoto 2014 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property IDENA_ORTHOPHOTO2014
 * @type string
 * @final
 */
/**
 * Identificador de la capa de ortofoto 2012 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
 * @property IDENA_ORTHOPHOTO2012
 * @type string
 * @final
 */
/**
 * Identificador de la capa de mapa base del WMS de IDENA.
 * @property IDENA_DYNBASEMAP
 * @type string
 * @final
 */
/**
 * Identificador de la capa de ortofoto de máxima actualidad del WMS de IDENA.
 * @property IDENA_DYNORTHOPHOTO
 * @type string
 * @final
 */
/**
 * Identificador de la capa de ortofoto 2014 del WMS de IDENA.
 * @property IDENA_DYNORTHOPHOTO2014
 * @type string
 * @final
 */
/**
 * Identificador de la capa de ortofoto 2012 del WMS de IDENA.
 * @property IDENA_DYNORTHOPHOTO2012
 * @type string
 * @final
 */
/**
 * Identificador de la capa de OpenStreetMap a través del WMTS de la API SITNA.
 * @property OSM
 * @type string
 * @final
 */
/**
 * Identificador de la capa de Carto Voyager a través del WMTS de la API SITNA.
 * @property CARTO_VOYAGER
 * @type string
 * @final
 */
/**
 * Identificador de la capa de Carto Light a través del WMTS de la API SITNA.
 * @property CARTO_LIGHT
 * @type string
 * @final
 */
/**
 * Identificador de la capa de Carto Dark a través del WMTS de la API SITNA.
 * @property CARTO_DARK
 * @type string
 * @final
 */
/**
 * Identificador de la capa de Mapbox Streets a través del WMTS de la API SITNA.
 * @property MAPBOX_STREETS
 * @type string
 * @final
 */
/**
 * Identificador de la capa de Mapbox Satellite a través del WMTS de la API SITNA.
 * @property MAPBOX_SATELLITE
 * @type string
 * @final
 */
/**
 * Identificador de una capa en blanco.
 * @property BLANK
 * @type string
 * @final
 */

/**
 * Colección de tipos MIME de utilidad.
 * No se deberían modificar las propiedades de esta clase.
 * @class SITNA.consts.MimeType
 * @static
 */
/**
 * Tipo MIME de imagen PNG.
 * @property PNG
 * @type string
 * @final
 */
/**
 * Tipo MIME de imagen JPEG.
 * @property JPEG
 * @type string
 * @final
 */

/*
 * Colección de tipos de filtros.
 * No se deberían modificar las propiedades de este objeto.
 * @class SITNA.consts.MapSearchType
 * @static
 */
/*
 * Identificador de filtro de consulta de tipo municipio.
 * @property MUNICIPALITY
 * @type string
 * @final
 */
/*
 * Identificador de filtro de consulta de tipo concejo.
 * @property COUNCIL
 * @type string
 * @final
 */
/*
 * Identificador de filtro de consulta de tipo casco urbano.
 * @property URBAN
 * @type string
 * @final
 */
/*
 * Identificador de filtro de consulta de tipo mancomunidad.
 * @property COMMONWEALTH
 * @type string
 * @final
 */
/*
 * Identificador de filtro de consulta de tipo genérico.
 * @property GENERIC
 * @type string
 * @final
 */

/**
 * <p>Configuración general de la API. Cualquier llamada a un método o un constructor de la API sin parámetro de opciones toma las opciones de esta clase. 
 * Hay que tener en cuenta que el archivo <code>config.json</code> de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
 * (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones).</p><p>La clase es estática.</p>
 * @class SITNA.Cfg
 * @static
 */
SITNA.Cfg = TC.Cfg;
/**
 * <p>URL del proxy utilizado para peticiones a dominios remotos.</p>
 * <p>Debido a restricciones de seguridad implementadas en Javascript, a través de <code>XMLHttpRequest</code> no es posible obtener información de dominios distintos al de la página web.</p>
 * <p>Hay dos maneras de solventar esta restricción. La primera es que el servidor remoto permita el acceso entre dominios estableciendo la cabecera <code>Access-Control-Allow-Origin</code> a 
 * la respuesta HTTP. Dado que esta solución la implementan terceras personas (los administradores del dominio remoto), no siempre es aplicable.</p>
 * <p>La segunda solución es desplegar en el dominio propio un proxy. Un proxy es un servicio que recibe peticiones HTTP y las redirige a otra URL.</p>
 * <p>Si la propiedad <code>proxy</code> está establecida, todas las peticiones a dominios remotos las mandará al proxy para que este las redirija. De esta manera no infringimos las reglas de
 * seguridad de Javascript, dado que el proxy está alojado en el dominio propio.</p>
 * @property proxy
 * @type string
 * @default ""
 * @example
 *      SITNA.Cfg.proxy = ""; // Las peticiones a http://www.otrodominio.com se hacen directamente
 *
 *      SITNA.Cfg.proxy = "/cgi-bin/proxy.cgi?url="; // Las peticiones a http://www.otrodominio.com se convierten en peticiones a /cgi-bin/proxy.cgi?url=http://www.otrodominio.com
 */
/**
 * <p>Código EPSG del sistema de referencia espacial del mapa.</p>
 * <p>Puede consultar el ejemplo <a href="../../examples/Cfg.crs.html">online</a>.</p>
 * @property crs
 * @type string
 * @default "EPSG:25830"
 * @example
 *     <div id="mapa"></div>
 *     <script>
 *         // SITNA.Cfg.baseLayers[0] (capa por defecto) no es compatible con WGS 84, lo cambiamos por SITNA.Consts.layer.IDENA_DYNBASEMAP.
 *         SITNA.Cfg.baseLayers[0] = SITNA.Consts.layer.IDENA_DYNBASEMAP;
 *         SITNA.Cfg.defaultBaseLayer = SITNA.Consts.layer.IDENA_DYNBASEMAP;
 * 
 *         // WGS 84
 *         SITNA.Cfg.crs = "EPSG:4326";
 *         // Coordenadas en grados decimales, porque el sistema de referencia espacial es WGS 84.
 *         SITNA.Cfg.initialExtent = [-2.848205, 41.789124, -0.321350, 43.557898];
 *         SITNA.Cfg.maxExtent = [-2.848205, 41.789124, -0.321350, 43.557898];
 * 
 *         var map = new SITNA.Map("mapa", {
 *             // SITNA.Cfg.baseLayers[0] (capa por defecto) no es compatible con WGS 84, establecer la capa SITNA.Consts.layer.IDENA_DYNBASEMAP en el control de mapa de situación.
 *             controls: {
 *                 overviewMap: {
 *                     layer: SITNA.Consts.layer.IDENA_DYNBASEMAP
 *                 }
 *             }
 *         });
 *     </script>
 */
/**
 * Extensión inicial del mapa definida por x mínima, y mínima, x máxima, y máxima. Estos valores deben estar en las unidades definidas por 
 * el sistema de referencia espacial del mapa. Por defecto la extensión es la de Navarra.
 * @property initialExtent
 * @type array
 * @default [541084.221, 4640788.225, 685574.4632, 4796618.764]
 */
/**
 * Extensión máxima del mapa definida por x mínima, y mínima, x máxima, y máxima, de forma que el centro del mapa nunca saldrá fuera de estos límites. Estos valores deben estar en las unidades definidas por 
 * el sistema de referencia espacial del mapa. Por defecto la extensión es la de Navarra y sus alrededores.
 * @property maxExtent
 * @type array
 * @default [480408, 4599748, 742552, 4861892]
 */
/**
 * <p>Si se establece a <code>true</code>, la rueda de scroll del ratón se puede utilizar para hacer zoom en el mapa.</p>
 * @property mouseWheelZoom
 * @type boolean
 * @default true
 */
/**
 * <p>Tolerancia en pixels a las consultas de información de capa.</p>
 * <p>En ciertas capas, por ejemplo las que representan geometrías de puntos, puede ser difícil pulsar precisamente en el punto donde está la entidad geográfica que interesa.
 * La propiedad <code>pixelTolerance</code> define un área de un número de pixels hacia cada lado del punto de pulsación, de forma que toda entidad geográfica que se interseque con ese área se incluye en el resultado de la consulta.</p>
 * <p>Por ejemplo, si el valor establecido es 10, toda entidad geográfica que esté dentro de un cuadrado de 21 pixels de lado (10 pixels por cuadrante más el pixel central) centrado en el punto de pulsación 
 * se mostrará en el resultado.</p>
 * <p><em>A tener en cuenta:</em> Esta propiedad establece el valor de los llamados "parámetros de vendedor" que los servidores de mapas admiten para modificar el comportamiento de las peticiones
 * <code>getFeatureInfo</code> del standard WMS. Pero este comportamiento puede ser modificado también por otras circunstancias, como los estilos aplicados a las capas en el servidor. 
 * Como estas circunstancias están fuera del ámbito de alcance de esta API, es posible que los resultados obtenidos desde algún servicio WMS sean inesperados en lo referente a <code>pixelTolerance</code>.</p>
 * @property pixelTolerance
 * @type number
 * @default 10
 */
/**
 * <p>Lista de objetos de definición de capa (instancias de la clase {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}}) para incluir dichas capas como mapas de fondo.</p>
 * <p>Puede consultar el ejemplo <a href="../../examples/Cfg.baseLayers.html">online</a>.</p>
 * @property baseLayers
 * @type array
 * @default La lista incluye las siguientes capas de IDENA: Ortofoto 2014 (capa por defecto), Mapa base, Catastro, Cartografía topográfica.
 * @example
 *     <div id="mapa"></div>
 *     <script>
 *         // Establecer un proxy porque se hacen peticiones a otro dominio.
 *         SITNA.Cfg.proxy = "proxy.ashx?";
 * 
 *         // Añadir PNOA y establecerla como mapa de fondo por defecto.
 *         SITNA.Cfg.baseLayers.push({
 *             id: "PNOA",
 *             url: "http://www.ign.es/wms-inspire/pnoa-ma",
 *             layerNames: "OI.OrthoimageCoverage",
 *             isBase: true
 *         });
 *         SITNA.Cfg.defaultBaseLayer = "PNOA";
 * 
 *         var map = new SITNA.Map("mapa");
 *     </script>
 */
/**
 * Identificador de la capa base por defecto o índice de la capa base por defecto en la lista de capas base del mapa (Consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/baseLayers:property"}}{{/crossLink}}).
 * @property defaultBaseLayer
 * @type string|number
 * @default SITNA.consts.Layer.IDENA_ORTHOPHOTO
 */
/**
 * <p>Lista de objetos de definición de capa (instancias de la clase {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}}) para incluir dichas capas como contenido del mapa.</p>
 * <p>Puede consultar el ejemplo <a href="../../examples/Cfg.workLayers.html">online</a>.</p>
 * @property workLayers
 * @type array
 * @default []
 * @example
 *     <div id="mapa"></div>
 *     <script>
 *         // Establecer un proxy porque se hacen peticiones a otro dominio.
 *         SITNA.Cfg.proxy = "proxy.ashx?";

 *         SITNA.Cfg.workLayers = [{
 *             id: "csantiago",
 *             title: "Camino de Santiago",
 *             url: "http://www.ign.es/wms-inspire/camino-santiago",
 *             layerNames: "PS.ProtectedSite,GN.GeographicalNames,AU.AdministrativeUnit"
 *         }];
 *         var map = new SITNA.Map("mapa");
 *     </script>
 */
/**
 * Opciones de controles de mapa.
 * @property controls
 * @type SITNA.cfg.MapControlOptions
 * @default Se incluyen controles de indicador de espera de carga, atribución, indicador de coordenadas.
 */
/**
 * <p>URL de la carpeta de maquetación. Para prescindir de maquetación, establecer esta propiedad a <code>null</code>.</p>
 * <p>La API busca en la carpeta de maquetación los siguientes archivos:</p>
 * <ul>
 *      <li><code>markup.html</code>, con la plantilla HTML que se inyectará en el elemento del DOM del mapa.</li>
 *      <li><code>config.json</code>, con un objeto JSON que sobreescribirá propiedades de {{#crossLink "SITNA.Cfg"}}{{/crossLink}}.</li>
 *      <li><code>style.css</code>, para personalizar el estilo del visor y sus controles.</li>
 *      <li><code>script.js</code>, para añadir lógica nueva. Este es el lugar idóneo para la lógica de la nueva interfaz definida por el marcado inyectado con <code>markup.html</code>.</li>
 *      <li><code>ie8.css</code>, para adaptar el estilo a Internet Explorer 8, dado que este navegador tiene soporte CSS3 deficiente.</li>
 *      <li><code>resources/&#42;.json</code>, donde <code>&#42;</code> es el código IETF del idioma que tendrá la interfaz de usuario, por ejemplo <code>resources/es-ES.json</code>.
 *      Si se van a soportar varios idiomas hay que preparar un archivo por idioma. Para saber cómo establecer un idioma de interfaz de usuario, consultar la opción <code>locale</code> del constructor de {{#crossLink "SITNA.Map"}}{{/crossLink}}.
 *  </ul>
 * <p>Todos estos archivos son opcionales.</p>
 * <p>La maquetación por defecto añade los siguientes controles al conjunto por defecto: <code>navBar</code>, <code>basemapSelector</code>,
 * <code>TOC</code>, <code>legend</code>, <code>scaleBar</code>, <code>search</code>, <code>measure</code>, <code>overviewMap</code> y <code>popup</code>. Puede <a href="../../tc/layout/responsive/responsive.zip">descargar la maquetación por defecto</a>.</p>
 * <h4>Soporte multiidioma</h4>
 * <p>La API soporta actualmente tres idiomas: castellano, euskera e inglés. Para saber cómo establecer un idioma de interfaz de usuario, consultar la opción <code>locale</code> del constructor de {{#crossLink "SITNA.Map"}}{{/crossLink}}.
 * Los textos específicos para cada idioma se guardan en archivos <code>*.json</code>, donde <code>*</code> es el código IETF del idioma de la interfaz de usuario, dentro de la subcarpeta
 * resources en la dirección donde se aloja la API SITNA. Por ejemplo, los textos en castellano se guardan en <code>resources/es-ES.json</code>. Estos archivos contienen un diccionario en formato JSON de pares clave/valor, siendo la clave un identificador
 * único de cadena y el valor el texto en el idioma elegido.</p>
 * <p>Para añadir soporte multiidioma a la maquetación, hay que crear un archivo de recursos de texto para cada idioma soportado y colocarlo en la subcarpeta <code>resources</code>
 * dentro de la carpeta de maquetación. Este diccionario se combinará con el diccionario de textos propio de la API.</p>
 * <p>Por otro lado, la plantilla contenida en <code>markup.html</code> puede tener identificadores de cadena de texto en el siguiente formato: <code>&#123;&#123;identificador&#125;&#125;</code>. La API sustituirá estos textos por los valores del
 * diccionario correspondiente al idioma de la interfaz de usuario.</p>
 * <p>Finalmente, hay que activar el soporte multiidioma añadiendo a <code>config.json</code> una clave <code>"i18n": true</code>.</p>
 * <p>Puede consultar el ejemplo <a href="../../examples/Cfg.layout.html">online</a>.
 * Sus archivos de maquetación son <a href="../../examples/layout/example/markup.html">markup.html</a>, <a href="../../examples/layout/example/config.json">config.json</a>, 
 * <a href="../../examples/layout/example/style.css">style.css</a>, <a href="../../examples/layout/example/resources/es-ES.json">resources/es-ES.json</a>,
 * <a href="../../examples/layout/example/resources/eu-ES.json">resources/eu-ES.json</a> y <a href="../../examples/layout/example/resources/en-US.json">resources/en-US.json</a>.</p>
 * @property layout
 * @type string
 * @default "//sitna.tracasa.es/api/tc/layout/responsive"
 * @example
 *     <!-- layout/example/markup.html -->
 *      <div id="controls">
 *          <h1>{{stJamesWayInNavarre}}</h1>
 *          <div id="toc" />
 *          <div id="legend" />
 *      </div>
 *     <div id="languages">
 *         <a class="lang" href="?lang=es-ES" title="{{spanish}}">ES</a>
 *         <a class="lang" href="?lang=eu-ES" title="{{basque}}">EU</a>
 *         <a class="lang" href="?lang=en-US" title="{{english}}">EN</a>
 *     </div>
 * @example
 *     resources/es-ES.json
 *     {
 *         "stJamesWayInNavarre": "Camino de Santiago en Navarra",
 *         "spanish": "castellano",
 *         "basque": "euskera",
 *         "english": "inglés"
 *     }
 * @example
 *     resources/eu-ES.json
 *     {
 *         "stJamesWayInNavarre": "Nafarroan Donejakue bidea",
 *         "spanish": "gaztelania",
 *         "basque": "euskara",
 *         "english": "ingelesa"
 *     }
 * @example
 *     resources/en-US.json
 *     {
 *         "stJamesWayInNavarre": "St. James' Way in Navarre",
 *         "spanish": "spanish",
 *         "basque": "basque",
 *         "english": "english"
 *     }
 * @example
 *     <div id="mapa"></div>
 *     <script>
 *        // Obtener el idioma de interfaz de usuario
 *        var selectedLocale = location.search.substr(location.search.indexOf("?lang=") + 6) || "es-ES";
 *        // Establecer un proxy porque se hacen peticiones a otro dominio.
 *        SITNA.Cfg.proxy = "proxy.ashx?";
 *
 *        SITNA.Cfg.layout = "layout/example";
 *        var map = new SITNA.Map("mapa", {
 *            locale: selectedLocale
 *        });
 *     </script>
 */
SITNA.Cfg.layout = TC.apiLocation + 'TC/layout/responsive';
/**
 * Opciones de estilo de entidades geográficas.
 * @property styles
 * @type SITNA.cfg.StyleOptions
 */

/**
 * Opciones de capa.
 * Esta clase no tiene constructor.
 * @class SITNA.cfg.LayerOptions
 * @static
 */
/**
 * Identificador único de capa.
 * @property id
 * @type string
 */
/**
 * Título de capa. Este valor se mostrará en la tabla de contenidos y la leyenda.
 * @property title
 * @type string|undefined
 */
/**
 * Tipo de capa. Si no se especifica se considera que la capa es WMS. La lista de valores posibles está definida en {{#crossLink "SITNA.consts.LayerType"}}{{/crossLink}}.
 * @property type
 * @type string|undefined
 */
/**
 * URL del servicio OGC o del archivo KML que define la capa. Propiedad obligatoria en capas de tipo WMS, WMTS, WFS y KML.
 * @property url
 * @type string|undefined
 */
/**
 * Lista separada por comas de los nombres de capa del servicio OGC.
 * @property layerNames
 * @type string|undefined
 */
/**
 * Nombre de grupo de matrices del servicio WMTS. Propiedad obligatoria para capas de tipo WMTS.
 * @property matrixSet
 * @type string|undefined
 */
/**
 * Tipo MIME del formato de archivo de imagen a obtener del servicio. Si esta propiedad no está definida, se comprobará si la capa es un mapa de fondo 
 * (consultar propiedad {{#crossLink "SITNA.cfg.LayerOptions/isBase:property"}}{{/crossLink}}). En caso afirmativo, el formato elegido será <code>"image/jpeg"</code>, 
 * de lo contrario el formato será <code>"image/png"</code>.
 * @property format
 * @type string|undefined
 */
/**
 * Si se establece a <code>true</code>, la capa se muestra por defecto si forma parte de los mapas de fondo.
 * @property isDefault
 * @type boolean|undefined
 * @deprecated En lugar de esta propiedad es recomendable usar SITNA.Cfg.defaultBaseLayer.
 */
/**
 * Si se establece a <code>true</code>, la capa es un mapa de fondo.
 * @property isBase
 * @type boolean|undefined
 */
/**
 * Aplicable a capas de tipo WMS y KML. Si se establece a <code>true</code>, la capa no muestra la jerarquía de grupos de capas en la tabla de contenidos ni en la leyenda.
 * @property hideTree
 * @type boolean|undefined
 */
/**
 * Si se establece a <code>true</code>, la capa no aparece en la tabla de contenidos ni en la leyenda. De este modo se puede añadir una superposición de capas de trabajo que el usuario la perciba como parte del mapa de fondo.
 * @property stealth
 * @type boolean|undefined
 */
/**
 * URL de una imagen en miniatura a mostrar en el selector de mapas de fondo.
 * @property thumbnail
 * @type string|undefined
 */
/**
 * <p>La capa agrupa sus entidades puntuales cercanas entre sí en grupos (clusters). Aplicable a capas de tipo VECTOR, WFS y KML.</p>
 * <p>Puede consultar el ejemplo <a href="../../examples/cfg.LayerOptions.cluster.html">online</a>.</p>
 * @property cluster
 * @type SITNA.cfg.ClusterOptions|undefined
 * @example
 *     <div id="mapa"></div>
 *     <script>
 *         // Creamos un mapa con una capa de puntos de un KML,
 *         // clustering activado a 50 pixels y transiciones animadas.
 *         var map = new SITNA.Map("mapa", {
 *             workLayers: [
 *                {
 *                    id: "cluster",
 *                    type: SITNA.Consts.layerType.KML,
 *                    url: "data/PromocionesViviendas.kml",
 *                    title: 'Clusters',
 *                    cluster: {
 *                        distance: 50,
 *                        animate: true
 *                    }
 *                }
 *            ]
 *         });
 *     </script>
 */

/**
 * <p>Opciones de clustering de puntos de una capa, define si los puntos se tienen que agrupar cuando están más cerca entre sí que un valor umbral.
 * Hay que tener en cuenta que el archivo <code>config.json</code> de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
 * (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones).</p>
 * <p>Esta clase no tiene constructor.</p>
 * @class SITNA.cfg.ClusterOptions
 * @static
 */
/**
 * Distancia en píxels que tienen que tener como máximo los puntos entre sí para que se agrupen en un cluster.
 * @property distance
 * @type number
 */
/**
 * Si se establece a <code>true</code>, los puntos se agrupan y desagrupan con una transición animada.
 * @property animate
 * @type boolean|undefined
 */
/**
 * Opciones de estilo de los clusters.
 * @property styles
 * @type SITNA.cfg.ClusterStyleOptions|undefined
 */

/**
 * <p>Opciones de controles de mapa, define qué controles se incluyen en un mapa y qué opciones se pasan a cada control.
 * Las propiedades de esta clase son de tipo boolean, en cuyo caso define la existencia o no del control asociado, o una instancia de la clase {{#crossLink "SITNA.cfg.ControlOptions"}}{{/crossLink}}.
 * Hay que tener en cuenta que el archivo <code>config.json</code> de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
 * (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones).</p>
 * <p>Esta clase no tiene constructor.</p>
 * @class SITNA.cfg.MapControlOptions
 * @static
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen un indicador de espera de carga.
 * @property loadingIndicator
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default true
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen una barra de navegación con control de zoom.
 * @property navBar
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen una barra de escala.
 * @property scaleBar
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen un indicador numérico de escala.
 * @property scale
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen un selector numérico de escala.
 * @property scaleSelector
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen un mapa de situación.
 * @property overviewMap
 * @type boolean|SITNA.cfg.OverviewMapOptions|undefined
 * @default false
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen un selector de mapas de fondo.
 * @property basemapSelector
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen atribución. La atribución es un texto superpuesto al mapa que actúa como reconocimiento de la procedencia de los datos que se muestran.
 * @property attribution
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default true
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen una tabla de contenidos mostrando las capas de trabajo y los grupos de marcadores.
 * @property TOC
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen un indicador de coordenadas y de sistema de referencia espacial.
 * @property coordinates
 * @type boolean|SITNA.cfg.CoordinatesOptions|undefined
 * @default true
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen leyenda.
 * @property legend
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas muestran los datos asociados a los marcadores cuando se pulsa sobre ellos.
 * @property popup
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen un buscador. El buscador localiza coordenadas y busca entidades geográficas tales como: municipios, cascos urbanos, vías, portales y parcelas catastrales de IDENA.
 * @property search
 * @type boolean|SITNA.cfg.SearchOptions|undefined
 * @default false
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas tienen un medidor de longitudes, áreas y perímetros.
 * @property measure
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * <p>Si se establece a un valor <em>truthy</em>, los mapas tienen un control que gestiona los clics del usuario en ellos.</p>
 * @property click
 * @type boolean|SITNA.cfg.ClickOptions|undefined
 * @default false
 */
/**
 * <p>Si se establece a un valor <em>truthy</em>, los mapas pueden abrir una ventana de Google StreetView.</p>
 * @property streetView
 * @type boolean|SITNA.cfg.StreetViewOptions|undefined
 * @default true
 */
/**
 * Si se establece a un valor <em>truthy</em>, los mapas responden a los clics con un información de las capas cargadas de tipo WMS. Se usa para ello la petición <code>getFeatureInfo</code> del standard WMS.
 * Puede consultar el ejemplo <a href="../../examples/cfg.MapControlOptions.featureInfo.html">online</a>.
 * @property featureInfo
 * @type boolean|SITNA.cfg.ClickOptions|undefined
 * @default true
 * @example
 *     <div id="mapa"></div>
 *     <script>
 *         // Activamos el proxy para poder acceder a servicios de otro dominio.
 *         SITNA.Cfg.proxy = "proxy.ashx?";
 *         // Añadimos el control featureInfo.
 *         SITNA.Cfg.controls.featureInfo = true;
 *         // Añadimos una capa WMS sobre la que hacer las consultas.
 *         SITNA.Cfg.workLayers = [
 *             {
 *                 id: "ocupacionSuelo",
 *                 title: "Ocupación del suelo",
 *                 type: SITNA.Consts.layerType.WMS,
 *                 url: "http://www.ign.es/wms-inspire/ocupacion-suelo",
 *                 layerNames: ["LC.LandCoverSurfaces"]
 *             }
 *         ];
 *         var map = new SITNA.Map("mapa");
 *     </script>
 */

/**
 * Opciones de control.
 * Esta clase no tiene constructor.
 * @class SITNA.cfg.ControlOptions
 * @static
 */
/**
 * Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
 * @property div
 * @type HTMLElement|string|undefined
 */

/**
 * Opciones de control de mapa de situación.
 * Esta clase no tiene constructor.
 * @class SITNA.cfg.OverviewMapOptions
 * @extends SITNA.cfg.ControlOptions
 * @static
 */
/**
 * Identificador de capa para usar como mapa de fondo u objeto de opciones de capa. 
 * @property layer
 * @type string|SITNA.cfg.LayerOptions
 */

/**
 * <p>Opciones de control de coordenadas.
 * Esta clase no tiene constructor.</p>
 * <p>Puede consultar el ejemplo <a href="../../examples/cfg.CoordinatesOptions.html">online</a>.</p>
 * @class SITNA.cfg.CoordinatesOptions
 * @extends SITNA.cfg.ControlOptions
 * @static
 */
/**
 * Determina si se muestran coordenadas geográficas (en EPSG:4326) además de las del mapa, que por defecto son UTM (EPSG:25830). 
 * @property showGeo
 * @type boolean|undefined
 * @example
 *     <div id="mapa"/>
 *     <script>
 *        // Hacemos que el control que muestra las coordenadas en pantalla
 *        // muestre también las coordenadas geográficas
 *        SITNA.Cfg.controls.coordinates = {
 *            showGeo: true
 *        };
 *        var map = new SITNA.Map('map');
 *     </script>
 */

/**
 * Opciones de control de clic.
 * Esta clase no tiene constructor.
 * <p>Estas opciones se utilizan si se desea tener un control en el mapa que reaccione a los clic del ratón o los toques en el mapa.</p>
 * <p>Puede consultar el ejemplo <a href="../../examples/cfg.ClickOptions.html">online</a>.</p>
 * @class SITNA.cfg.ClickOptions
 * @extends SITNA.cfg.ControlOptions
 * @static
 */
/**
 * Si se establece a <code>true</code>, el control asociado está activo, es decir, responde a los clics hechos en el mapa desde que se carga.
 * @property active
 * @type boolean|undefined
 */
/**
 * Función de callback que gestiona la respuesta al clic. Es válida cualquier función que acepta un parámetro de coordenada, que es un array de dos números.
 * @property callback
 * @type function|undefined
 * @default Una función que escribe en consola las coordenadas pulsadas
 * @example
 *     <div id="mapa"/>
 *     <script>
 *        // Creamos un mapa con el control de gestión de clics, con una función de callback personalizada
 *        var map = new SITNA.Map("mapa", {
 *            controls: {
 *                click: {
 *                    active: true,
 *                    callback: function (coord) {
 *                        alert("Has pulsado en la posición " + coord[0] + ", " + coord[1]);
 *                    }
 *                }
 *            }
 *        });
 *     </script>
 */

/**
 * Opciones de control de Google StreetView.
 * Esta clase no tiene constructor.
 * <p>Para incrustar StreetView en el visor se utiliza la versión 3 de la API de Google Maps. Esta se carga automáticamente al instanciar el control.</p>
 * <p>Puede consultar el ejemplo <a href="../../examples/cfg.StreetViewOptions.html">online</a>.</p>
 * @class SITNA.cfg.StreetViewOptions
 * @extends SITNA.cfg.ControlOptions
 * @static
 */
/**
 * Elemento del DOM en el que mostrar la vista de StreetView o valor de atributo id de dicho elemento.
 * @property viewDiv
 * @type HTMLElement|string|undefined
 * @example
 *     <div id="mapa"/>
 *     <div id="sv"/>
 *     <script>
 *         // Creamos un mapa con el control de StreetView.
 *         // La vista de StreetView se debe dibujar en el elemento con identificador "sv".
 *         // Se utilizará la clave de Google Maps para IDENA.
 *         var map = new SITNA.Map("mapa", {
 *             controls: {
 *                 streetView: {
 *                     viewDiv: "sv",
 *                     googleMapsKey: "AIzaSyDXDQza0kXXHNHqq0UqNWulbYmGZmPY6TM"
 *                 }
 *             }
 *         });
 *     </script>
 */
/**
 * <p>El control de StreetView hace uso de la API de Google Maps para funcionar. Esta propiedad establece la clave de uso asociada al sitio
 * donde está alojada la aplicación que usa la API SITNA. No es necesaria para hacer funcionar el control pero es recomendable obtener una para garantizar el servicio por parte de Google.</p>
 * <p>Puede obtener más información en el <a href="https://developers.google.com/maps/documentation/javascript/get-api-key">sitio para desarrolladores de Google</a>.
 * @property googleMapsKey
 * @type string|undefined
 */

/**
 * Opciones de control de búsquedas.
 * Esta clase no tiene constructor.
 * <p>Puede consultar el ejemplo <a href="../../examples/cfg.SearchOptions.html">online</a>.</p>
 * @class SITNA.cfg.SearchOptions
 * @extends SITNA.cfg.ControlOptions
 * @static  
 */
/**
 * <p>Esta propiedad establece el atributo "placeHolder" del cajetín del buscador del mapa.</p>
 * @property placeHolder
 * @type string
 * @default Municipio, casco urbano, calle, dirección… 
 */
/**
 * <p>Esta propiedad establece el atributo "title" del cajetín y del botón del buscador del mapa.</p>
 * @property instructions
 * @type string
 * @default Buscar municipio, casco urbano, calle, dirección, referencia catastral, coordenadas UTM o latitud-longitud
 */
/**
 * <p>Esta propiedad activa/desactiva la localización de coordenadas en Sistema de Referencia ETRS89, bien UTM Huso 30 Norte (EPSG:25830) o latitud-longitud (EPSG:4258, EPSG:4326 o CRS:84) en el buscador del mapa.</p>
 * @property coordinates
 * @type boolean
 * @default true
 */
/**
 * <p>Esta propiedad activa/desactiva la búsqueda de municipios en el buscador del mapa.</p>
 * @property municipality
 * @type boolean
 * @default true
 */
/**
 * <p>Esta propiedad activa/desactiva la búsqueda de cascos urbanos en el buscador del mapa.</p>
 * @property town
 * @type boolean
 * @default true
 */
/**
 * <p>Esta propiedad activa/desactiva la búsqueda de vías en el buscador del mapa. Formato: entidad de población, vía</p>
 * @property street
 * @type boolean
 * @default true
 */
/**
 * <p>Esta propiedad activa/desactiva la búsqueda de direcciones postales en el buscador del mapa. Formato: entidad de población, vía, portal.</p>
 * @property postalAddress
 * @type boolean
 * @default true
 */
/**
 * <p>Esta propiedad activa/desactiva la búsqueda de parcelas catastrales en el buscador del mapa. Formato: municipio, polígono, parcela.</p>
 * @property cadastralParcel
 * @type boolean
 * @default true
 * @example
 *     <div id="mapa"/> 
 *     <script>
 *         // Creamos un mapa con el control de búsquedas. 
 *         // Configuramos el buscador desactivando la búsqueda de parcelas y la localización de coordenadas.
 *         // Indicamos un placeHolder y tooltip (propiedad "instructions") acorde con las búsquedas configuradas.
 *         var map = new SITNA.Map("mapa", {
 *             controls: {
 *                 search: { 
 *                     coordinates: false,
 *                     cadastralParcel: false,
 *                     municipality: false,
 *                     town: true,
 *                     street: true,
 *                     postalAddress: true,
 *                     placeHolder: "Municipio, casco urbano, calle o portal",
 *                     instructions: "Buscar municipio, casco urbano, calle o portal"
 *                 }
 *             }
 *         });
 *     </script> 
 */

///**
// * Opciones de control de búsquedas.
// * Esta clase no tiene constructor.
// * @class SITNA.cfg.SearchOptions
// * @extends SITNA.cfg.ControlOptions
// * @static
// */
///**
// * URL del servicio WFS que ofrece los datos de las entidades geográficas.
// * @property url
// * @type string
// */
///**
// * Versión del servicio WFS que ofrece los datos de las entidades geográficas.
// * @property version
// * @type string
// */
///**
// * Formato de respuesta del servicio WFS.
// * @property outputFormat
// * @type string|undefined
// */
///**
// * Prefijo de los nombres de entidad geográfica en el servicio WFS que ofrece los datos de las entidades geográficas.
// * @property featurePrefix
// * @type string
// */
///**
// * Nombre del campo de la tabla de entidades geográficas donde se encuentra la geometría.
// * @property geometryName
// * @type string
// */
///**
// * <p>Conjunto de tipos de búsqueda. Debe ser un objeto cuyas propiedades son instancias de la clase {{#crossLink "SITNA.cfg.SearchTypeOptions"}}{{/crossLink}}.</p>
// * <p>Puede consultar el ejemplo <a href="../../examples/cfg.SearchOptions.types.html">online</a>.</p>
// * @property types
// * @type object
// * @example
// *     <div id="mapa"></div>
// *     <script>
// *         // Quitar maquetación. Se eliminan así las opciones por defecto del control de búsqueda.
// *         SITNA.Cfg.layout = null;
// * 
// *         // Objeto de opciones de búsqueda de municipios en el servicio WFS de IDENA.
// *         var searchOptions = {
// *             url: "http://idena.navarra.es/ogc/wfs",
// *             version: "1.1.0",
// *             featurePrefix: "IDENA_WFS",
// *             geometryName: "SHAPE",
// *             types: {
// *                 municipality: {
// *                     featureType: "Municipios",
// *                     properties: ["CMUNICIPIO", "MUNICIPIO"]
// *                 }
// *             }
// *         };
// *         SITNA.Cfg.controls.search = searchOptions;
// *         var map = new SITNA.Map("mapa");
// *     </script>
// */

///**
// * <p>Opciones de tipo de búsqueda. Las propiedades de SITNA.cfg.SearchOptions.{{#crossLink "SITNA.cfg.SearchOptions/types:property"}}{{/crossLink}} son instancias de esta clase.</p>
// * <p>Esta clase no tiene constructor.</p>
// * @class SITNA.cfg.SearchTypeOptions
// * @static
// */
///**
// * Nombre del tipo de entidad geográfica a buscar.
// * @property featureType
// * @type string
// */
///**
// * Lista de nombres de propiedad a obtener de las entidades geográficas encontradas.
// * @property properties
// * @type Array
// */

/**
 * Opciones de estilo de entidades geográficas.
 * Esta clase no tiene constructor.
 * @class SITNA.cfg.StyleOptions
 * @static
 */
/**
 * Opciones de estilo de marcador (punto de mapa con icono).
 * @property marker
 * @type SITNA.cfg.MarkerStyleOptions|undefined
 */
/**
 * Opciones de estilo de línea.
 * @property line
 * @type SITNA.cfg.LineStyleOptions|undefined
 */
/**
 * Opciones de estilo de polígono.
 * @property polygon
 * @type SITNA.cfg.PolygonStyleOptions|undefined
 */
/**
 * Opciones de estilo de cluster de puntos. Consultar SITNA.cfg.LayerOptions.{{#crossLink "SITNA.cfg.LayerOptions/cluster:property"}}{{/crossLink}}
 * para saber cómo mostrar clusters.
 * @property cluster
 * @type SITNA.cfg.ClusterStyleOptions|undefined
 */

/**
 * <p>Opciones de estilo de marcador (punto de mapa con icono).
 * Hay que tener en cuenta que el archivo <code>config.json</code> de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
 * (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones).</p><p>Esta clase no tiene constructor.</p>
 * @class SITNA.cfg.MarkerStyleOptions
 * @static
 */
/**
 * Lista de nombres de clase CSS a utilizar para los iconos de los marcadores. La API extraerá la URL de las imágenes del atributo <code>background-image</code> asociado a la clase.
 * @property classes
 * @type Array
 * @default ["tc-marker1", "tc-marker2", "tc-marker3", "tc-marker4", "tc-marker5"]
 */
/**
 * Posicionamiento relativo del icono respecto al punto del mapa, representado por un array de dos números entre 0 y 1, siendo [0, 0] la esquina superior izquierda del icono.
 * @property anchor
 * @type Array
 * @default [.5, 1]
 */
/**
 * Anchura en píxeles del icono.
 * @property width
 * @type number
 * @default 32
 */
/**
 * Altura en píxeles del icono.
 * @property height
 * @type number
 * @default 32
 */

/**
 * <p>Opciones de estilo de línea. Hay que tener en cuenta que el archivo <code>config.json</code> de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
 * (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones).</p><p>Esta clase no tiene constructor.</p>
 * @class SITNA.cfg.LineStyleOptions
 * @static
 */
/**
 * Color de trazo de la línea, representado en formato hex triplet (<code>"#RRGGBB"</code>).
 * @property strokeColor
 * @type string
 * @default "#f00" en polígonos y líneas
 */
/**
 * Anchura de trazo en píxeles de la línea.
 * @property width
 * @type number
 * @default 2 en polígonos y líneas
 */

/**
 * <p>Opciones de estilo de polígono. Hay que tener en cuenta que el archivo <code>config.json</code> de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
 * (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones).</p><p>Esta clase no tiene constructor.</p>
 * @class SITNA.cfg.PolygonStyleOptions
 * @extends SITNA.cfg.LineStyleOptions
 * @static
 */
/**
 * Color de relleno, representado en formato hex triplet (<code>"#RRGGBB"</code>).
 * @property fillColor
 * @type string
 * @default "#000" en polígonos, "#336" en clusters
 */
/**
 * Opacidad de relleno, valor de 0 a 1.
 * @property fillOpacity
 * @type number
 * @default 0.3 en polígonos, 0.6 en clusters
 */

/**
 * <p>Opciones de estilo de punto. Hay que tener en cuenta que el archivo <code>config.json</code> de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
 * (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones).</p><p>Esta clase no tiene constructor.</p>
 * @class SITNA.cfg.PointStyleOptions
 * @extends SITNA.cfg.PolygonStyleOptions
 * @static
 */
/**
 * Radio en pixels del símbolo que representa el punto.
 * @property radius
 * @type number|undefined
 * @default 6 en puntos
 */
/**
 * Color del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (<code>"#RRGGBB"</code>).
 * @property fontColor
 * @type string|undefined
 * @default "#fff" en clusters
 */
/**
 * Tamaño de fuente del texto de la etiqueta descriptiva del punto.
 * @property fontSize
 * @type number|undefined
 * @default 9 en clusters
 */

/**
 * <p>Opciones de estilo de cluster de puntos. Hay que tener en cuenta que el archivo <code>config.json</code> de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
 * (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones).</p><p>Esta clase no tiene constructor.</p>
 * @class SITNA.cfg.ClusterStyleOptions
 * @static
 */
/**
 * <p>Opciones de estilo del punto que representa el cluster. Hay que tener en cuenta que el archivo <code>config.json</code> de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
 * (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones).</p><p>Esta clase no tiene constructor.</p>
 * <p>Puede consultar también el ejemplo <a href="../../examples/cfg.ClusterStyleOptions.point.html">online</a>.</p>
 * @property point
 * @type SITNA.cfg.PointStyleOptions|undefined
 * @example
 *     <div id="mapa"></div>
 *     <script>
 *         // Creamos un mapa con una capa vectorial,
 *         // clustering activado a 50 pixels y estilos personalizados.
 *         var map = new SITNA.Map("mapa", {
 *             workLayers: [
 *                {
 *                    id: "cluster",
 *                    type: SITNA.Consts.layerType.VECTOR,
 *                    title: "Clusters",
 *                    cluster: {
 *                        distance: 50,
 *                        styles: {
 *                            point: {
 *                                fillColor: "#f90",
 *                                fillOpacity: 1,
 *                                strokeColor: "#c60",
 *                                strokeWidth: 2,
 *                                fontColor: "#f90"
 *                            }
 *                        }
 *                    }
 *                }
 *            ]
 *         });
 *
 *        map.loaded(function () {
 *            // Añadimos puntos aleatorios
 *            var extent = TC.Cfg.initialExtent;
 *            var dx = extent[2] - extent[0];
 *            var dy = extent[3] - extent[1];
 *
 *            var randomPoint = function () {
 *                var x = extent[0] + Math.random() * dx;
 *                var y = extent[1] + Math.random() * dy;
 *                return [x, y];
 *            }
 *
 *            for (var i = 0; i < 200; i++) {
 *                var point = randomPoint();
 *                map.addMarker(point, {
 *                    layer: "cluster",
 *                    data: {
 *                        x: point[0],
 *                        y: point[1]
 *                    }
 *                });
 *            }
 *        });
 *     </script>
 */

/**
 * <p>Opciones de marcador. El icono se obtiene de las propiedades {{#crossLink "SITNA.cfg.MarkerOptions/url:property"}}{{/crossLink}}, 
 * {{#crossLink "SITNA.cfg.MarkerOptions/cssClass:property"}}{{/crossLink}} y {{#crossLink "SITNA.cfg.MarkerOptions/group:property"}}{{/crossLink}}, por ese orden de preferencia.</p>
 * <p>Esta clase no tiene constructor.</p>
 * @class SITNA.cfg.MarkerOptions
 * @extends SITNA.cfg.MarkerStyleOptions
 * @static
 */
/**
 * Nombre de grupo en el que incluir el marcador. Estos grupos se muestran en la tabla de contenidos y en la leyenda.
 * Todos los marcadores pertenecientes al mismo grupo tienen el mismo icono. Los iconos se asignan automáticamente, rotando por la lista disponible en
 * SITNA.cfg.MarkerStyleOptions.{{#crossLink "SITNA.cfg.MarkerStyleOptions/classes:property"}}{{/crossLink}}.
 * @property group
 * @type string|undefined
 */
/**
 * Nombre de clase CSS. El marcador adoptará como icono el valor del atributo <code>background-image</code> de dicha clase.
 * @property cssClass
 * @type string|undefined
 */
/**
 * URL de archivo de imagen que se utilizará para el icono.
 * @property url
 * @type string|undefined
 */
/**
 * Identificador de la capa vectorial a la que añadir el marcador.
 * @property layer
 * @type string|undefined
 */
/**
 * Objeto de datos en pares clave/valor para mostrar cuando se pulsa sobre el marcador.
 * @property data
 * @type object|undefined
 */
/**
 * Si se establece a <code>true</code>, al añadirse el marcador al mapa se muestra con el bocadillo de información asociada visible por defecto.
 * @property showPopup
 * @type boolean|undefined
 */

/**
 * <p>Búsqueda realizada de entidades geográficas en el mapa. Define el tipo de consulta y a qué capa afecta.</p>
 * <p>Esta clase no tiene constructor.</p>
 * class SITNA.Search
 * static
 */
/**
 * Tipo de consulta que se está realizando al mapa.
 * property type
 * type SITNA.consts.MapSearchType
 */
/**
 * Capa del mapa sobre la que se hace la consulta.
 * property layer
 * type SITNA.consts.Layer
 */
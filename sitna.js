var SITNA = window.SITNA || {};

SITNA.syncLoadJS = function (url) {
    var req = new XMLHttpRequest();
    req.open("GET", url, false); // 'false': synchronous.
    req.send(null);

    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.text = req.responseText;
    head.appendChild(script);
};

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
        SITNA.syncLoadJS(src.substr(0, src.lastIndexOf('/') + 1) + 'tcmap.js');
    }
})();

/**
 * <p>Objeto principal de la API, instancia un mapa dentro de un elemento del DOM. Nótese que el constructor es asíncrono, por tanto cualquier código que haga uso de este objeto debería
 * estar dentro de una función de callback pasada como parámetro al método {{#crossLink "SITNA.Map/loaded:method"}}{{/crossLink}}.</p>
 * <p>Puede consultar también online el <a href="../../examples/Map.1.html">ejemplo 1</a>, el <a href="../../examples/Map.2.html">ejemplo 2</a> y el <a href="../../examples/Map.3.html">ejemplo 3</a>.</p>
 * @class SITNA.Map
 * @constructor
 * @async
 * @param {HTMLElement|string} div Elemento del DOM en el que crear el mapa o valor de atributo id de dicho elemento.
 * @param {object} [options] Objeto de opciones de configuración del mapa. Sus propiedades sobreescriben el objeto de configuración global {{#crossLink "SITNA.Cfg"}}{{/crossLink}}.
 * @param {string} [options.crs="EPSG:25830"] Código EPSG del sistema de referencia espacial del mapa.
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
 * @param {boolean} [options.mouseWheelZoom] La rueda del ratón se puede utilizar para hacer zoom en el mapa.
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
 *             baseLayers: [
 * 				SITNA.Consts.layer.IDENA_DYNBASEMAP
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
 *                     url: "http://idena.navarra.es/ogc/wms",
 *                     layerNames: "IDENA:toponimia,IDENA:mallas"
 *                 }
 *             ]
 *         });
 *     </script>
 */
SITNA.Map = function (div, options) {
    var map = this;
    var tcMap = new TC.Map(div, options);

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
     * @param {boolean} [options.showPopup] Al añadirse el marcador al mapa se muestra con el bocadillo de información asociada visible por defecto.
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
     * @param {number} [options.pointBoundsRadius=30] Radio en metros del área alrededor del marcador que se respetará al hacer zoom.
     * @param {number} [options.extentMargin=0.2] Tamaño del margen que se aplicará a la extensión total de todas los marcadores. 
     * El valor es la relación de crecimiento en ancho y alto entre la extensión resultante y la original. Por ejemplo, 0,2 indica un crecimiento del 20% de la extensión, 10% por cada lado.
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
        if (!tcMap.activeControl) {
            var fi = tcMap.getControlsByClass('TC.control.FeatureInfo')[0];
            if (fi) {
                fi.activate();
            }
        }
    });
};


/**
 * Colección de constantes utilizadas por la API. Se recomienda utilizar las propiedades de esta clase estática para referirse a valores conocidos.
 * No deberían modificarse las propiedades de esta clase.
 * @class SITNA.Consts
 * @static
 */
SITNA.Consts = TC.Consts;
/**
 * Identificadores de capas útiles de IDENA.
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
 * Colección de identificadores de capas útiles de IDENA.
 * No se deberían modificar las propiedades de esta clase.
 * @class SITNA.consts.Layer
 * @static
 */
/**
 * Identificador de la capa de ortofoto 2014 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
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
 * Identificador de la capa de la combinación de ortofoto 2014 y mapa base del WMS de IDENA.
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
 * Identificador de la capa de mapa base del WMS de IDENA.
 * @property IDENA_DYNBASEMAP
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
 * <p>La rueda de scroll del ratón se puede utilizar para hacer zoom en el mapa.</p>
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
 *      <li><code>markup.html</code>, con código HTML que se inyectará en el elemento del DOM del mapa.</li>
 *      <li><code>config.json</code>, con un objeto JSON que sobreescribirá propiedades de {{#crossLink "SITNA.Cfg"}}{{/crossLink}}.</li>
 *      <li><code>style.css</code>, para personalizar el estilo del visor y sus controles.</li>
 *      <li><code>script.js</code>, para añadir lógica nueva. Este es el lugar idóneo para la lógica de la nueva interfaz definida por el marcado inyectado con <code>markup.html</code>.</li>
 *      <li><code>ie8.css</code>, para adaptar el estilo a Internet Explorer 8, dado que este navegador tiene soporte CSS3 deficiente.</li>
 *  </ul>
 * <p>Todos estos archivos son opcionales.</p><p>La maquetación por defecto añade los siguientes controles al conjunto por defecto: <code>navBar</code>, <code>basemapSelector</code>, 
 * <code>TOC</code>, <code>legend</code>, <code>scaleBar</code>, <code>search</code>, <code>measure</code>, <code>overviewMap</code> y <code>popup</code>. Puede <a href="../../tc/layout/responsive/responsive.zip">descargar la maquetación por defecto</a>.</p>
 * <p>Puede consultar el ejemplo <a href="../../examples/Cfg.layout.html">online</a>. 
 * Sus archivos de maquetación son <a href="../../examples/layout/example/markup.html">markup.html</a>, <a href="../../examples/layout/example/config.json">config.json</a> y 
 * <a href="../../examples/layout/example/style.css">style.css</a>.</p>
 * @property layout
 * @type string
 * @default "//sitna.tracasa.es/api/tc/layout/responsive"
 * @example
 *     <div id="mapa"></div>
 *     <script>
 *         // Establecer un proxy porque se hacen peticiones a otro dominio.
 *         SITNA.Cfg.proxy = "proxy.ashx?";
 *
 *         SITNA.Cfg.layout = "layout/example";
 *         var map = new SITNA.Map("mapa");
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
 * La capa se muestra por defecto si forma parte de los mapas de fondo.
 * @property isDefault
 * @type boolean|undefined
 * @deprecated En lugar de esta propiedad es recomendable usar SITNA.Cfg.defaultBaseLayer.
 */
/**
 * La capa es un mapa de fondo.
 * @property isBase
 * @type boolean|undefined
 */
/**
 * Aplicable a capas de tipo WMS y KML. La capa no muestra la jerarquía de grupos de capas en la tabla de contenidos ni en la leyenda.
 * @property hideTree
 * @type boolean|undefined
 */
/**
 * La capa no aparece en la tabla de contenidos ni en la leyenda. De este modo se puede añadir una superposición de capas de trabajo que el usuario la perciba como parte del mapa de fondo.
 * @property stealth
 * @type boolean|undefined
 */
/**
 * URL de una imagen en miniatura a mostrar en el selector de mapas de fondo.
 * @property thumbnail
 * @type string|undefined
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
 * Los mapas tienen un indicador de espera de carga.
 * @property loadingIndicator
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default true
 */
/**
 * Los mapas tienen una barra de navegación con control de zoom.
 * @property navBar
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Los mapas tienen una barra de escala.
 * @property scaleBar
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Los mapas tienen un indicador numérico de escala.
 * @property scale
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Los mapas tienen un selector numérico de escala.
 * @property scaleSelector
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Los mapas tienen un mapa de situación.
 * @property overviewMap
 * @type boolean|SITNA.cfg.OverviewMapOptions|undefined
 * @default false
 */
/**
 * Los mapas tienen un selector de mapas de fondo.
 * @property basemapSelector
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Los mapas tienen atribución. La atribución es un texto superpuesto al mapa que actúa como reconocimiento de la procedencia de los datos que se muestran.
 * @property attribution
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default true
 */
/**
 * Los mapas tienen una tabla de contenidos mostrando las capas de trabajo y los grupos de marcadores.
 * @property TOC
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Los mapas tienen un indicador de coordenadas y de sistema de referencia espacial.
 * @property coordinates
 * @type boolean|SITNA.cfg.CoordinatesOptions|undefined
 * @default true
 */
/**
 * Los mapas tienen leyenda.
 * @property legend
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Los mapas muestran los datos asociados a los marcadores cuando se pulsa sobre ellos.
 * @property popup
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Los mapas tienen un buscador de entidades geográficas y localizador de coordenadas.
 * @property search
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * Los mapas tienen un medidor de longitudes, áreas y perímetros.
 * @property measure
 * @type boolean|SITNA.cfg.ControlOptions|undefined
 * @default false
 */
/**
 * <p>Los mapas tienen un control que gestiona los clics del usuario en ellos.</p>
 * @property click
 * @type boolean|SITNA.cfg.ClickOptions|undefined
 * @default false
 */
/**
 * <p>Los mapas pueden abrir una ventana de Google StreetView.</p>
 * @property streetView
 * @type boolean|SITNA.cfg.StreetViewOptions|undefined
 * @default true
 */
/**
 * Los mapas responden a los clics con un información de las capas cargadas de tipo WMS. Se usa para ello la petición <code>getFeatureInfo</code> del standard WMS.
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
 * El control asociado está activo, es decir, responde a los clics hechos en el mapa desde que se carga.
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
 *         var map = new SITNA.Map("mapa", {
 *             controls: {
 *                 streetView: {
 *                     viewDiv: "sv"
 *                 }
 *             }
 *         });
 *     </script>
 */

///**
// * Opciones de control de búsqueda de entidades geográficas y localizador de coordenadas.
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
 * @default "#f00"
 */
/**
 * Anchura de trazo en píxeles de la línea.
 * @property width
 * @type number
 * @default 2
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
 * @default "#000"
 */
/**
 * Opacidad de relleno, valor de 0 a 1.
 * @property fillOpacity
 * @type number
 * @default .3
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
 * Al añadirse el marcador al mapa se muestra con el bocadillo de información asociada visible por defecto.
 * @property showPopup
 * @type boolean|undefined
 */

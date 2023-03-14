import TC from '../TC';
import Consts from '../TC/Consts';
import Cfg from '../TC/Cfg';
import Util from '../TC/Util';
import BasicMap from '../TC/Map';
import Search from '../TC/control/Search';
import filter from '../TC/filter';
TC.Map = BasicMap;
TC.filter = filter;
TC.control = TC.control || {};
TC.control.Search = Search;

/**
  * Opciones de maquetación de mapa (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
  * @typedef SITNA.LayoutOptions
  * @property {string} [config] - URL de un archivo de configuración del mapa.
  * @property {string} [i18n] - URL de la carpeta donde se encuentran los archivos de textos para internacionalización (Ver 
  * la documentación de [soporte multiidioma](tutorial-layout_cfg.html#soporte-multiidioma) de las maquetaciones).
  * @property {string} [markup] - URL de un documento con el HTML a incrustar en el mapa.
  * Necesario para especificar la distribución de controles y elementos de interfaz de usuario.
  * @property {string} [script] - URL de un documento JavaScript. Útil para añadir
  * lógica a los elementos de interfaz de usuario que se añaden con la maquetación.
  * @property {string} [style] - URL de una hoja de estilos para los elementos de interfaz de usuario que se añaden con la maquetación.
  * @see SITNA.MapOptions
  * @see layout_cfg
  * @example <caption>[Ver en vivo](../examples/cfg.LayoutOptions.html)</caption> {@lang html}
  * <div id="mapa"></div>
  * <script>
  *     // Instanciamos un mapa cuya maquetación tiene la configuración y el marcado personalizados
  *     // y el resto de elementos se obtienen de la maquetación por defecto
  *     var map = new SITNA.Map("mapa", {
  *         layout: {
  *             config: "layout/ctl-container/config.json",
  *             markup: "layout/ctl-container/markup.html",
  *             style: "//sitna.navarra.es/api/layout/responsive/style.css",
  *             script: "//sitna.navarra.es/api/layout/responsive/script.js",
  *             i18n: "//sitna.navarra.es/api/layout/responsive/resources"
  *         }
  *     });
  * </script>
  */

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
 * @param {SITNA.MapOptions} [options] Objeto de opciones de configuración del mapa. Sus propiedades sobreescriben las del objeto de configuración global {@link SITNA.Cfg}.
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

const Map = function (div, options) {
    const self = this;

    if (Cfg.controls.search) {
        // Por defecto en SITNA todas las búsquedas están habilitadas
        Cfg.controls.search.allowedSearchTypes = Util.extend(Cfg.controls.search.allowedSearchTypes, {
            urban: {},
            street: {},
            number: {},
            cadastral: {}
        });

        if (options && options.controls && options.controls.search) {
            const keys = Object.keys(options.controls.search);

            const searchCfg = Util.extend(options.controls.search, { allowedSearchTypes: {} });

            keys.forEach(function (key) {
                if (typeof options.controls.search[key] === "boolean" || Util.isPlainObject(options.controls.search[key])) {
                    if (options.controls.search[key]) {

                        switch (true) {
                            case key === "placeName":
                                searchCfg.allowedSearchTypes[Consts.searchType.PLACENAME] = Util.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                                break;
                            case key === "placeNameMunicipality":
                                searchCfg.allowedSearchTypes[Consts.searchType.PLACENAMEMUNICIPALITY] = Util.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                                break;
                            case key === "postalAddress":
                                searchCfg.allowedSearchTypes[Consts.searchType.NUMBER] = Util.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                                break;
                            case key === "cadastralParcel":
                                searchCfg.allowedSearchTypes[Consts.searchType.CADASTRAL] = Util.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                                break;
                            case key === "town":
                                searchCfg.allowedSearchTypes[Consts.searchType.URBAN] = Util.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                                break;
                            default:
                                searchCfg.allowedSearchTypes[key] = Util.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                        }
                    }

                    delete searchCfg[key];
                }
            });

            options.controls.search = searchCfg;
        }
    }

    if (Cfg.controls.threeD) {
        if (Cfg.views && Cfg.views.threeD) {
            Cfg.views.threeD.controls = [
                "search",
                "toc",
                "attribution",
                "basemapSelector",
                "workLayerManager",
                "layerCatalog",
                "featureInfo",
                "fullScreen",
                "loadingIndicator",
                "navBarHome",
                "navBar",
                "overviewMap",
                "legend",
                "threeD",
                "coordinates",
                "geolocation",
                "resultsPanel",
                "share"
            ];
        }
    }

    TC.Map.call(self, div, options);

    self.search = null;

    self.loaded(async function () {
        const search = self._searchControl = new TC.control.Search();
        search.register(self);

        // Si existe el control featureInfo lo activamos.
        if (!self.activeControl) {
            const fi = self.getControlsByClass('TC.control.FeatureInfo')[0];
            if (fi) {
                fi.activate();
            }
        }

        self._searchLayer = await search.getLayer();
    });
};

TC.inherit(Map, TC.Map);

(function () {
    const mapProto = Map.prototype;

/**
 * Añade una capa al mapa. Si se le pasa un objeto del Tipo {@link LayerOptions} como parámetro `layer`
 * y tiene definida la propiedad `url`, establece por defecto
 * el tipo de capa a [SITNA.Consts.layerType.KML]{@link SITNA.Consts} si la URL acaba en _**.kml**_.
 * 
 * El tipo de la capa no puede ser [SITNA.Consts.layerType.WFS]{@link SITNA.Consts}.
 * @method addLayer
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {string|SITNA.layer.LayerOptions|SITNA.layer.Layer} layer - Identificador de capa, objeto de opciones de capa o
 * instancia de la clase {@link SITNA.layer.Layer}.
 * @param {function} [callback] Función a la que se llama tras ser añadida la capa.     
 * @returns {Promise<SITNA.layer.Layer>} Objeto de capa añadido.
 * 
 * La clase del objeto dependerá del valor de la propiedad `type` del parámetro `layer`. Si es 
 * [SITNA.Consts.layerType.VECTOR]{@link SITNA.Consts}, [SITNA.Consts.layerType.WFS]{@link SITNA.Consts} 
 * o [SITNA.Consts.layerType.KML]{@link SITNA.Consts}, el objeto será de la clase {@link SITNA.layer.Vector}.
 * En cualquier otro caso será de la clase {@link SITNA.layer.Raster}.
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

/**
 * Obtiene una capa del mapa.
 * @method getLayer
 * @memberof SITNA.Map
 * @instance
 * @param {string|SITNA.layer.Layer} layer Identificador de capa u objeto de capa.
 * @returns {SITNA.layer.Layer|null} Objeto de capa si esta existe y está en el mapa, 
 * o `null` si el mapa no tiene ninguna capa que cumpla el requisito del parámetro.
 */

/**
 * Hace visible una capa como mapa de fondo. Esta capa debe existir previamente en la lista de mapas de fondo del mapa.
 * @method setBaseLayer
 * @memberof SITNA.Map
 * @instance
 * @param {string|LayerOptions} layer - Identificador de capa u objeto de opciones de capa. 
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

/**
 * Añade un marcador (un punto asociado a un icono) al mapa.
 * @method addMarker
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {(number[]|SITNA.feature.Marker)} coordinatesOrMarker - Coordenadas x e y del punto en las unidades del sistema 
 * de referencia del mapa, u objeto de marcador.
 * @param {(MarkerOptions|SITNA.Map~AddMarkerCallback)} [options] Objeto de opciones de marcador o función a la que se llama tras añadir el marcador.
 * @param {SITNA.Map~AddMarkerCallback} [callback] Función a la que se llama tras añadir el marcador.
 * @returns {Promise<SITNA.feature.Marker>} Marcador añadido.
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

/**
 * Elimina una colección de entidades geográficas del mapa.
 * @method removeFeatures
 * @memberof SITNA.Map
 * @instance
 * @param {SITNA.feature.Feature[]} features - Lista de entidades geográficas a eliminar.
 * @example <caption>[Ver en vivo](../examples/Map.removeFeatures.html)</caption> {@lang html}
 *   <div class="instructions div-select">
 *      <button id="add-btn">Añadir marcador</button>
 *      <button id="rem-btn">Eliminar marcadores</button>
 *  </div>
 *  <div id="mapa"></div>
 *  <script>
 *      // Crear mapa.
 *      var map = new SITNA.Map("mapa");
 *
 *      var getRandomPointInExtent = function (extent) {
 *          const dx = extent[2] - extent[0];
 *          const dy = extent[3] - extent[1];
 *          const x = extent[0] + Math.random() * dx;
 *          const y = extent[1] + Math.random() * dy;
 *          return [x, y];
 *      };
 *
 *      // Cuando esté todo cargado proceder a trabajar con el mapa.
 *      map.loaded(function () {
 *          // Colección de marcadores añadidos
 *          const markers = [];
 *          // Añadir un marcador en un punto al azar
 *          document.getElementById("add-btn").addEventListener("click", function (e) {
 *              map.addMarker(getRandomPointInExtent(map.getExtent())).then(m => markers.push(m));
 *          });
 *
 *          // Eliminar todos los marcadores añadidos
 *          document.getElementById("rem-btn").addEventListener("click", function (e) {
 *              map.removeFeatures(markers);
 *              markers.length = 0;
 *          });
 *      });
 *  </script>
 */

/**
 * Añade una función de callback que se ejecutará cuando el mapa, sus controles y todas sus capas se hayan cargado.
 * @method loaded
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {function} callback Función a la que se llama tras la carga del mapa.
 * @returns {Promise} Promesa que se resuelve cuando el mapa se carga.
 * @example {@lang javascript}
 * // Notificar cuando se haya cargado el mapa (mediante callback)
 * map.loaded(() => { 
 *     console.log("Código del mapa y de sus controles cargado, datos cargados.");
 * });
 * @example {@lang javascript}
 * // Notificar cuando se haya cargado el mapa (mediante promesa)
 * map.loaded().then(() => {
 *     console.log("Código del mapa y de sus controles cargado, datos cargados.");
 * });
 */

/**
 * Devuelve la extensión actual del mapa.
 * @method getExtent
 * @memberof SITNA.Map
 * @instance
 * @returns {number[]} Array con los valores de coordenadas [xmin, ymin, xmax, ymax] en el CRS del mapa.
 * @example <caption>[Ver en vivo](../examples/Map.getExtent-setExtent.html)</caption> {@lang html}
 * <div class="instructions div-select">
 *      <p class="y-axis"><label>Y max</label> <input type="number" id="ymax" /></p>
 *      <p class="x-axis">
 *          <label>X min</label> <input type="number" id="xmin" />
 *          <button onclick="applyExtent()">Aplicar</button>
 *          <label>X max</label> <input type="number" id="xmax" />
 *      </p>
 *      <p class="y-axis"><label>Y min</label> <input type="number" id="ymin" /></p>
 *  </div>
 *  <div id="mapa"></div>
 *  <script>
 *      // Crear mapa.
 *      var map = new SITNA.Map("mapa");
 *
 *      map.loaded(function () {
 *          const extent = map.getExtent();
 *          displayExtent(extent);
 *      });
 *
 *      // Actualiza los valores de la extensión del mapa
 *      function displayExtent(extent) {
 *          document.getElementById("xmin").value = extent[0];
 *          document.getElementById("ymin").value = extent[1];
 *          document.getElementById("xmax").value = extent[2];
 *          document.getElementById("ymax").value = extent[3];
 *      };
 *
 *      // Establece la extensión del mapa y actualiza los valores
 *      function applyExtent() {
 *          const xmin = parseFloat(document.getElementById("xmin").value);
 *          const ymin = parseFloat(document.getElementById("ymin").value);
 *          const xmax = parseFloat(document.getElementById("xmax").value);
 *          const ymax = parseFloat(document.getElementById("ymax").value);
 *          map.setExtent([xmin, ymin, xmax, ymax], { animate: false }, displayExtent);
 *      };
 *  </script>
 */

/**
 * Establece una extensión al mapa. Hay que tener en cuenta que puede haber factores que impidan que el ajuste sea
 * exacto, como los niveles de zoom discretos de la capa base o que la relación de aspecto del visor no coincida con 
 * la de la extensión especificada. En cualquier caso, se garantiza que todos los puntos dentro de la extensión 
 * especificada se mostrarán en la nueva extensión.
 * @method setExtent
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {number[]} extent - Array de valores de coordenadas [xmin, ymin, xmax, ymax] especificadas en el CRS del mapa.
 * @param {object} [options] - Opciones del método.
 * @param {boolean} [options.animate=true] - Si tiene un valor verdadero, la nueva extensión no se establecerá 
 * instantáneamente, sino que se alcanzará dicha extensión tras una animación de desplazamiento y zoom.
 * @param {SITNA.Map~SetExtentCallback} [callback] - Función a la que se llama tras el establecimiento 
 * de la nueva extensión. Se le pasa como parámetro la extensión real que ha alcanzado el mapa.
 * @returns {Promise<number[]>} Nueva extensión del mapa.
 * @example <caption>[Ver en vivo](../examples/Map.getExtent-setExtent.html)</caption> {@lang html}
 * <div class="instructions div-select">
 *      <p class="y-axis"><label>Y max</label> <input type="number" id="ymax" /></p>
 *      <p class="x-axis">
 *          <label>X min</label> <input type="number" id="xmin" />
 *          <button onclick="applyExtent()">Aplicar</button>
 *          <label>X max</label> <input type="number" id="xmax" />
 *      </p>
 *      <p class="y-axis"><label>Y min</label> <input type="number" id="ymin" /></p>
 *  </div>
 *  <div id="mapa"></div>
 *  <script>
 *      // Crear mapa.
 *      var map = new SITNA.Map("mapa");
 *
 *      map.loaded(function () {
 *          const extent = map.getExtent();
 *          displayExtent(extent);
 *      });
 *
 *      // Actualiza los valores de la extensión del mapa
 *      function displayExtent(extent) {
 *          document.getElementById("xmin").value = extent[0];
 *          document.getElementById("ymin").value = extent[1];
 *          document.getElementById("xmax").value = extent[2];
 *          document.getElementById("ymax").value = extent[3];
 *      };
 *
 *      // Establece la extensión del mapa y actualiza los valores
 *      function applyExtent() {
 *          const xmin = parseFloat(document.getElementById("xmin").value);
 *          const ymin = parseFloat(document.getElementById("ymin").value);
 *          const xmax = parseFloat(document.getElementById("xmax").value);
 *          const ymax = parseFloat(document.getElementById("ymax").value);
 *          map.setExtent([xmin, ymin, xmax, ymax], { animate: false }, displayExtent);
 *      };
 *  </script>
 */

/**
 * Devuelve la extensión máxima del mapa.
 * @method getMaxExtent
 * @memberof SITNA.Map
 * @instance
 * @returns {number[]|null} Array con los valores de coordenadas [xmin, ymin, xmax, ymax] en el CRS actual del mapa, o `null` 
 * si el mapa no tiene establecida extensión máxima.
 * @example {@lang javascript}
 * const maxExtent = map.getMapExtent();
 * if (maxExtent === null) {
 *     alert("El mapa no tiene extensión máxima definida");
 * }
 * else {
 *     alert(`El mapa se extiende de ${maxExtent[0]} a ${maxExtent[2]} en el eje x, de ${maxExtent[1]} a ${maxExtent[3]} en el eje y`);
 * }
 */

/**
 * Devuelve el [código EPSG](https://spatialreference.org/ref/epsg/) del sistema de referencia de coordenadas del mapa.
 * @method getCrs
 * @memberof SITNA.Map
 * @instance
 * @returns {string} Código EPSG del sistema de referencias del mapa.
 * @example <caption>[Ver en vivo](../examples/Map.getCrs-setCrs.html)</caption> {@lang html}
 * <div class="instructions div-select">
 *      <p>CRS actual: <span id="crs-display"></span></p>
 *      <p>
 *          <select id="crs-selector" onchange="applyCrs()">
 *              <option value="">Seleccione CRS...</option>
 *              <option value="EPSG:3857">EPSG:3857</option>
 *              <option value="EPSG:4326">EPSG:4326</option>
 *              <option value="EPSG:25829">EPSG:25829</option>
 *              <option value="EPSG:25830">EPSG:25830</option>
 *              <option value="EPSG:25831">EPSG:25831</option>
 *          </select>
 *      </p>
 *  </div>
 *  <div id="mapa"></div>
 *  <script>
 *      // Crear mapa.
 *      var map = new SITNA.Map("mapa");
 *
 *      map.loaded(function () {
 *          displayCrs();
 *      });
 *
 *      // Obtiene el CRS del mapa, lo muestra y restablece el selector
 *      function displayCrs() {
 *          document.getElementById("crs-display").innerHTML = map.getCrs();
 *          document.getElementById("crs-selector").value = "";
 *      };
 *
 *      // Establece CRS del mapa
 *      function applyCrs() {
 *          const crs = document.getElementById("crs-selector").value;
 *          map.setCrs(crs, displayCrs);
 *      };
 *  </script>
 */

/**
 * Establece un sistema de referencia de coordenadas al mapa especificando su [código EPSG](https://spatialreference.org/ref/epsg/).
 * @method setCrs
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {string} crs - Código EPSG del sistema de referencia de coordenadas.
 * @param {SITNA.Map~SetCrsCallback} [callback] Función a la que se llama tras la resolución del cambio de CRS.
 * @returns {Promise<string>} Código EPSG del nuevo sistema de referencia de coordenadas.
 * @example <caption>[Ver en vivo](../examples/Map.getCrs-setCrs.html)</caption> {@lang html}
 * <div class="instructions div-select">
 *      <p>CRS actual: <span id="crs-display"></span></p>
 *      <p>
 *          <select id="crs-selector" onchange="applyCrs()">
 *              <option value="">Seleccione CRS...</option>
 *              <option value="EPSG:3857">EPSG:3857</option>
 *              <option value="EPSG:4326">EPSG:4326</option>
 *              <option value="EPSG:25829">EPSG:25829</option>
 *              <option value="EPSG:25830">EPSG:25830</option>
 *              <option value="EPSG:25831">EPSG:25831</option>
 *          </select>
 *      </p>
 *  </div>
 *  <div id="mapa"></div>
 *  <script>
 *      // Crear mapa.
 *      var map = new SITNA.Map("mapa");
 *
 *      map.loaded(function () {
 *          displayCrs();
 *      });
 *
 *      // Obtiene el CRS del mapa, lo muestra y restablece el selector
 *      function displayCrs() {
 *          document.getElementById("crs-display").innerHTML = map.getCrs();
 *          document.getElementById("crs-selector").value = "";
 *      };
 *
 *      // Establece CRS del mapa
 *      function applyCrs() {
 *          const crs = document.getElementById("crs-selector").value;
 *          map.setCrs(crs, displayCrs);
 *      };
 *  </script>
 */

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

/**
 * Objeto proporcionado en las respuestas a peticiones de datos de búsqueda ({@link SITNA.Map#getMunicipalities}, etc.).
 * @typedef SearchResultItem
 * @memberof SITNA
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
 * @see SITNA.Map#getCommonwealths
 * @see SITNA.Map#getCouncils
 * @see SITNA.Map#getMunicipalities
 * @see SITNA.Map#getUrbanAreas
 * @param {SITNA.SearchResultItem[]} data - Lista de elementos de búsqueda. Cada elemento tiene un identificador y un texto descriptivo.
 */

/**
 * Función de callback que gestiona las respuestas a búsquedas por identfificador ({@link SITNA.Map#searchMunicipality}, etc.).
 * @callback SITNA.Map~SearchByIdCallback
 * @param {?string} queryId - Identificador de consulta realizada. Su valor es `null` si no hay resultado.
 */

/**
 * Función de callback que se lanza tras llamar al método {@link SITNA.Map#addMarker}.
 * @callback SITNA.Map~AddMarkerCallback
 * @see SITNA.Map#addMarker
 * @param {SITNA.feature.Marker} marker - Marcador añadido.
 */

/**
 * Función de callback que se ejecuta tras completarse la ejecución del método {@link SITNA.Map#setCrs}.
 * @callback SITNA.Map~SetCrsCallback
 * @see SITNA.Map#setCrs
 * @param {string} newCrs - Código EPSG del nuevo CRS del mapa.
 */

/**
 * Función de callback que se ejecuta tras completarse la ejecución del método {@link SITNA.Map#setExtent}.
 * @callback SITNA.Map~SetExtentCallback
 * @see SITNA.Map#setExtent
 * @param {number[]} newExtent - Nueva extensión del mapa. Hay que tener en cuenta que no tiene por qué ser la misma que la que se
 * pasó al método {@link SITNA.Map#setExtent}, bien por limitaciones en los niveles de zoom del mapa, bien por tener este una 
 * relación de aspecto distinta a la extensión especificada.
 */

/*
    Obtiene los valores ({@link SITNA.SearchResultItem}) de las entidades geográficas disponibles en la capa de IDENA que corresponda según el parámetro searchType. 
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

    mapProto.getQueryableData = async function (searchType, callback) {
        const self = this;
        const queryable = self._searchControl.availableSearchTypes[searchType];

        if (queryable.queryableData) {
            if (callback) {
                callback(queryable.queryableData);
            }
        } else {
            const params = {
                request: 'GetFeature',
                service: 'WFS',
                typename: queryable.featurePrefix + ':' + queryable.featureType,
                version: queryable.version,
                propertyname: (!(queryable.dataIdProperty instanceof Array) ? [queryable.dataIdProperty] : queryable.dataIdProperty)
                    .concat(!(queryable.outputProperties instanceof Array) ? [queryable.outputProperties] : queryable.outputProperties).join(','),
                outputformat: Consts.format.JSON
            };

            const url = queryable.url + '?' + Util.getParamString(params);
            const response = await TC.ajax({
                url: url,
                responseType: Consts.mimeType.JSON
            });
            const responseData = response.data;
            queryable.queryableData = [];

            if (responseData.features) {
                const features = responseData.features;

                for (var i = 0, ii = features.length; i < ii; i++) {
                    const f = features[i];
                    const data = {};

                    data.id = [];
                    if (!Array.isArray(queryable.dataIdProperty)) {
                        queryable.dataIdProperty = [queryable.dataIdProperty];
                    }

                    for (var ip = 0, iip = queryable.dataIdProperty.length; ip < iip; ip++) {
                        const prop = queryable.dataIdProperty[ip];
                        if (Object.prototype.hasOwnProperty.call(f.properties, prop)) {
                            data.id.push(f.properties[prop]);
                        }
                    }

                    data.id = queryable.idPropertiesIdentifier ? data.id.join(queryable.idPropertiesIdentifier) : data.id.join('');

                    data.label = [];
                    if (!Array.isArray(queryable.outputProperties)) {
                        queryable.outputProperties = [queryable.outputProperties];
                    }

                    for (var lbl = 0, lbll = queryable.outputProperties.length; lbl < lbll; lbl++) {
                        const prop = queryable.outputProperties[lbl];
                        if (Object.prototype.hasOwnProperty.call(f.properties, prop)) {
                            data.label.push(f.properties[prop]);
                        }
                    }

                    const add = (Array.isArray(data.label) ? data.label.join('') : data.label).trim().length > 0;
                    data.label = queryable.outputFormatLabel ? queryable.outputFormatLabel.tcFormat(data.label) : data.label.join('-');

                    if (add) {
                        queryable.queryableData.push(data);
                    }
                }
            }

            queryable.queryableData = queryable.queryableData.sort(function (a, b) {
                const search = self._searchControl;
                if (queryable.idPropertiesIdentifier ? a.id.indexOf(queryable.idPropertiesIdentifier) === -1 : false) {
                    if (search.removePunctuation(a.label) < search.removePunctuation(b.label)) {
                        return -1;
                    }
                    if (search.removePunctuation(a.label) > search.removePunctuation(b.label)) {
                        return 1;
                    }
                    return 0;
                }
                if (search.removePunctuation(a.label.split(' ')[0]) < search.removePunctuation(b.label.split(' ')[0])) {
                    return -1;
                }
                if (search.removePunctuation(a.label.split(' ')[0]) > search.removePunctuation(b.label.split(' ')[0])) {
                    return 1;
                }
                return 0;
            });
            queryable.queryableData = queryable.queryableData.filter(function (value, index, arr) {
                if (index < 1) {
                    return true;
                }
                return value.id !== arr[index - 1].id && value.label !== arr[index - 1].label;
            });

            if (callback) {
                callback(queryable.queryableData);
            }
        }

        return queryable.queryableData;
    };

/**
 * Obtiene los valores ({@link SITNA.SearchResultItem}) de los municipios disponibles en la capa de IDENA.
 * @method getMunicipalities
 * @memberof SITNA.Map
 * @instance
 * @async  
 * @param {SITNA.Map~SearchDataCallback} callback - Función a la que se llama tras obtener los datos.
 * @returns {Promise<SITNA.SearchResultItem[]>} Lista de municipios.
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
    mapProto.getMunicipalities = function (callback) {
        return this.getQueryableData(Consts.mapSearchType.MUNICIPALITY, callback);
    };
/**
 * Obtiene los valores ({@link SITNA.SearchResultItem}) de los cascos urbanos disponibles en la capa de IDENA.
 * @method getUrbanAreas
 * @memberof SITNA.Map
 * @instance
 * @async  
 * @param {SITNA.Map~SearchDataCallback} callback - Función a la que se llama tras obtener los datos.  
 * @returns {Promise<SITNA.SearchResultItem[]>} Lista de cascos urbanos.
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
    mapProto.getUrbanAreas = function (callback) {
        return this.getQueryableData(Consts.mapSearchType.URBAN, callback);
    };

/**
 * Obtiene los valores ({@link SITNA.SearchResultItem}) de las mancomunidades de residuos disponibles en la capa de IDENA. 
 * @method getCommonwealths
 * @memberof SITNA.Map
 * @instance
 * @async  
 * @param {SITNA.Map~SearchDataCallback} callback - Función a la que se llama tras obtener los datos.  
 * @returns {Promise<SITNA.SearchResultItem[]>} Lista de mancomunidades.
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
    mapProto.getCommonwealths = function (callback) {
        return this.getQueryableData(Consts.mapSearchType.COMMONWEALTH, callback);
    };

/**
 * Obtiene los valores ({@link SITNA.SearchResultItem}) de los concejos disponibles en la capa de IDENA. 
 * @method getCouncils
 * @memberof SITNA.Map
 * @instance
 * @async  
 * @param {SITNA.Map~SearchDataCallback} callback - Función a la que se llama tras obtener los datos.  
 * @returns {Promise<SITNA.SearchResultItem[]>} Lista de concejos.
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
    mapProto.getCouncils = function (callback) {
        return this.getQueryableData(Consts.mapSearchType.COUNCIL, callback);
    };

/**
 * Busca la mancomunidad de residuos y pinta en el mapa la entidad geográfica encontrada que corresponda al identificador indicado.
 * @method searchCommonwealth
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {string} id Identificador de la entidad geográfica a pintar.
 * @param {SITNA.Map~SearchByIdCallback} [callback] Función a la que se llama tras aplicar el filtro.  
 * @returns {Promise<string>} Identificador de consulta realizada. Su valor es `null` si no hay resultado.
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
    mapProto.searchCommonwealth = function (id, callback) {
        return this.searchTyped(Consts.mapSearchType.COMMONWEALTH, id, callback);
    };

/**
 * Busca el concejo que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
 * @method searchCouncil
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {string} id - Identificador de la entidad geográfica a pintar.
 * @param {SITNA.Map~SearchByIdCallback} [callback] - Función a la que se llama tras aplicar el filtro.  
 * @returns {Promise<string>} Identificador de consulta realizada. Su valor es `null` si no hay resultado.
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
    mapProto.searchCouncil = function (id, callback) {
        return this.searchTyped(Consts.mapSearchType.COUNCIL, id, callback);
    };

/**
 * Busca el casco urbano que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
 * @method searchUrbanArea
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {string} id Identificador de la entidad geográfica a pintar.
 * @param {SITNA.Map~SearchByIdCallback} [callback] Función a la que se llama tras aplicar el filtro.  
 * @returns {Promise<string>} Identificador de consulta realizada. Su valor es `null` si no hay resultado.
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
    mapProto.searchUrbanArea = function (id, callback) {
        return this.searchTyped(Consts.mapSearchType.URBAN, id, callback);
    };

/**
 * Busca el municipio que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
 * @method searchMunicipality
 * @memberof SITNA.Map
 * @instance
 * @async
 * @param {string} id Identificador de la entidad geográfica a pintar.
 * @param {SITNA.Map~SearchByIdCallback} [callback] Función a la que se llama tras aplicar el filtro.  
 * @returns {Promise<string>} Identificador de consulta realizada. Su valor es `null` si no hay resultado.
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
    mapProto.searchMunicipality = function (id, callback) {
        return this.searchTyped(Consts.mapSearchType.MUNICIPALITY, id, callback);
    };

    // Busca en la configuración que corresponda según el parámetro searchType el identificador pasado como parámetro
    mapProto.searchTyped = function (searchType, id, callback) {
        const self = this;
        const idQuery = TC.getUID();
        const search = self._searchControl;
        const query = search.availableSearchTypes[searchType];

        if (Array.isArray(id) && query.goToIdFormat) {
            id = query.goToIdFormat.tcFormat(id);
        }

        search.data = search.data || [];
        search.data.push({
            dataLayer: query.featureType,
            dataRole: searchType,
            id: id,
            label: "",
            text: ""
        });

        self.removeSearch();

        if (search.availableSearchTypes[searchType] && !search.getSearchTypeByRole(searchType)) {

            if (!search.availableSearchTypes[searchType].goTo) {
                search.availableSearchTypes[searchType].goTo = function (id) {
                    const getProperties = function (id) {

                        let filter = [];
                        if (query.idPropertiesIdentifier) {
                            id = id.split(query.idPropertiesIdentifier);
                        }
                        if (!Array.isArray(id)) {
                            id = [id];
                        }
                        for (var i = 0, ii = query.dataIdProperty.length; i < ii; i++) {
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

                    return {
                        params: {
                            type: Consts.layerType.WFS,
                            url: this.url,
                            version: this.version,
                            geometryName: this.geometryName,
                            featurePrefix: this.featurePrefix,
                            featureType: this.featureType,
                            properties: getProperties(id),
                            outputFormat: this.outputFormat,
                            styles: this.styles
                        }
                    };
                }.bind(query);
            }

            search.addAllowedSearchType(searchType, search.availableSearchTypes[searchType], search);
        }

        return new Promise(function (resolve, _reject) {
            self.one(Consts.event.SEARCHQUERYEMPTY, function (_e) {
                self.toast(search.EMPTY_RESULTS_LABEL, {
                    type: Consts.msgType.INFO, duration: 5000
                });

                if (callback) {
                    callback(null);
                }
                resolve(null);
            });

            self.one(Consts.event.FEATURESADD, function (e) {
                if (e.layer === self._searchLayer && e.layer.features && e.layer.features.length > 0) {
                    self.zoomToFeatures(e.layer.features);
                }

                self.search = {
                    layer: e.layer, type: searchType
                };

                const value = e.layer.id !== idQuery ? e.layer.id : idQuery;
                if (callback) {
                    callback(value);
                }
                resolve(value);
            });

            search.goToResult(id, searchType);
        });
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
 * @param {SITNA.Map~SearchByIdCallback} [callback] - Función a la que se llama tras aplicar el filtro.  
 * @returns {Promise<string>} Identificador de consulta realizada. Su valor es `null` si no hay resultado.
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
    mapProto.searchFeature = function (layer, field, id, callback) {
        const self = this;
        const idQuery = TC.getUID();
        let prefix = self._searchControl.featurePrefix;

        self.removeSearch();

        layer = (layer || '').trim();
        field = (field || '').trim();
        id = (id || '').trim();
        if (layer.length === 0 || field.length === 0 || id.length === 0) {
            self.toast(self._searchControl.EMPTY_RESULTS_LABEL, {
                type: Consts.msgType.INFO, duration: 5000
            });

            if (callback) {
                callback(null);
            }
        } else {

            if (layer.indexOf(':') > -1) {
                prefix = layer.split(':')[0];
                layer = layer.split(':')[1];
            }

            const transformFilter = function (properties) {
                if (Array.isArray(properties)) {
                    const filters = properties.map(function (elm) {
                        if (Object.prototype.hasOwnProperty.call(elm, "type")) {
                            switch (true) {
                                case elm.type === Consts.comparison.EQUAL_TO: {
                                    return new TC.filter.equalTo(elm.name, elm.value);
                                }
                            }
                        } else {
                            return new TC.filter.equalTo(elm.name, elm.value);
                        }
                    });

                    if (filters.length > 1) {
                        return TC.filter.and.apply(null, filters);
                    }
                    return filters[0];
                }
            };

            const layerOptions = {
                id: idQuery,
                type: Consts.layerType.WFS,
                url: self._searchControl.url,
                version: self._searchControl.version,
                stealth: true,
                geometryName: 'the_geom',
                featurePrefix: prefix,
                featureType: layer,
                maxFeatures: 1,
                properties: transformFilter([{
                    name: field, value: id, type: Consts.comparison.EQUAL_TO
                }]),
                outputFormat: Consts.format.JSON
            };

            let tcSrchGenericLayer;
            self.addLayer(layerOptions).then(function (layer) {
                tcSrchGenericLayer = layer;

                self.search = {
                    layer: layer, type: Consts.mapSearchType.GENERIC
                };
            });

            self.on(Consts.event.FEATURESADD, function (e) {
                const layer = e.layer;
                if (layer === tcSrchGenericLayer && layer.features && layer.features.length > 0) {

                    for (var i = 0, ii = layer.features.length; i < ii; i++) {
                        if (layer.features[i].showsPopup != self._searchControl.queryableFeatures) {
                            layer.features[i].showsPopup = self._searchControl.queryableFeatures;
                        }
                    }

                    self.zoomToFeatures(layer.features);
                }
            });

            return new Promise(function (resolve, _reject) {
                self.on(Consts.event.LAYERUPDATE, function (e) {
                    const layer = e.layer;
                    const newData = e.newData;
                    if (layer === tcSrchGenericLayer && newData && newData.features && newData.features.length === 0)
                        self.toast(self._searchControl.EMPTY_RESULTS_LABEL, {
                            type: Consts.msgType.INFO, duration: 5000
                        });

                    const value = layer === tcSrchGenericLayer && newData && newData.features && newData.features.length === 0 ? null : idQuery;
                    if (callback) {
                        callback(value);
                    }
                    resolve(value);
                });
            });
        }
    };

/**
 * Elimina del mapa la entidad geográfica encontrada en la última búsqueda. 
 * @method removeSearch
 * @memberof SITNA.Map
 * @instance
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
    mapProto.removeSearch = function (callback) {
        const self = this;
        if (self.search) {
            const searchType = self._searchControl.availableSearchTypes[self.search.type];
            if (!searchType || !Object.prototype.hasOwnProperty.call(searchType, 'goTo')) {
                self.removeLayer(self.search.layer).then(function () {
                    self.search = null;
                });
            } else {
                for (var i = 0, ii = self.search.layer.features.length; i < ii; i++) {
                    self.search.layer.removeFeature(self.search.layer.features[i]);
                }
                self.search = null;
            }
        }

        if (callback) {
            callback();
        }
    };

})();

export default Map;
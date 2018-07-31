

/**
Para crear la interfaz de usuario, la API SITNA dibuja en la página una gran cantidad de elementos HTML. Para marcarlos como elementos de la
interfaz de usuario de los objetos de la API SITNA, se les añade una serie de clases CSS con un nombre convenido, de forma que es fácil modificar
el aspecto de los controles de la API mediante reglas CSS, e identificar elementos de interfaz mediante selectores CSS.

El nombre de las clases CSS usadas en la API SITNA es sistemático: todas empiezan con el prefijo `tc-`, y si un elemento está anidado dentro de otro,
generalmente su nombre empieza con el nombre del elemento padre (p.e. el elemento con la clase `tc-ctl-lcat-search` está dentro del elemento
con la clase `tc-ctl-lcat`). Esta no es una regla estricta, porque ciertos elementos son muy genéricos y tienen un nombre más sencillo
(p. e., dentro de un elemento con clase `tc-ctl-lcat` existe un elemento con clase `tc-textbox`, que se utiliza para dar estilo a todas las cajas
de texto de la API SITNA).

Aparte de las clases CSS que definen elementos de la interfaz de usuario, hay otras clases CSS que definen estados de elementos que son relevantes
desde el punto de vista de esa interfaz (p. e., el elemento está oculto, o es un nodo de un árbol que está replegado, o es una herramienta que está
activa).

En general, cualquier cambio de estado en la interfaz de usuario se define añadiendo o quitando clases de este tipo a elementos HTML de la aplicación
(p. e., si un elemento debe ocultarse de la interfaz, en vez de ponerle una regla de estilo `display:none` la API le añade la clase `tc-hidden`).

Para comprobar la estructura de elementos HTML y clases CSS de los controles de la API SITNA puede consultar el siguiente
[ejemplo](../../examples/CSS.html).

@module 3. Clases CSS
 */
/**
A continuación se describen todas las clases CSS que definen la estructura y/o afectan el comportamiento y aspecto del control
{{#crossLink "SITNA.cfg.MapControlOptions/layerCatalog:property"}}{{/crossLink}}.

## Clases que definen elementos de interfaz

| Clase CSS | Función que desempeña el elemento que tiene la clase |
|-----------|------------------------------------------------------|
| `tc-map` | Interfaz de una instancia de la clase SITNA.Map. Generalmente un `<div>`, es el elemento cuyo id se pasa como parámetro al constructor de la clase SITNA.Map. En él se dibuja el viewport del mapa y todos los elementos del layout. |
| `tc-ctl` | Interfaz de un control. Los controles se renderizan en un elemento definido por la opción div de la configuración propia del control. |
| `tc-ctl-lcat` | Interfaz del control layerCatalog. |
| `tc-ctl-lcat-search` | Parte de la interfaz que contiene el buscador de capas disponibles, con su cuadro de texto y su lista de resultados. |
| `tc-group` | Un elemento de interfaz que contiene un grupo de subelementos. |
| `tc-ctl-lcat-input` | Un elemento de introducción de texto en el control layerCatalog. |
| `tc-textbox` | Un elemento de introducción de texto de un control. |
| `tc-ctl-lcat-search-group` | En los resultados de búsqueda de capas, el conjunto de resultados que se corresponden con uno de los nodos raíz del árbol de capas disponibles. En la práctica, suele ser el conjunto de resultados de búsqueda de uno de los servicios WMS que tenemos añadidos al catálogo. |
| `tc-ctl-lcat-search-btn-info` | Botón junto al nombre de la capa que nos abre el panel de información adicional de la capa. |
| `tc-ctl-lcat-tree` | Elemento donde se muestra el árbol de capas disponibles. |
| `tc-ctl-lcat-branch` | Lista de nodos del árbol de capas disponibles. |
| `tc-ctl-lcat-node` | Nodo del árbol de capas disponibles. |
| `tc-ctl-lcat-info` | Panel que muestra información adicional de la capa (descripción, enlaces a metadatos) |
| `tc-ctl-lcat-info-close` | Botón para cerrar el panel de información adicional de la capa |
| `tc-ctl-lcat-title` | En el panel de información adicional de la capa, título de la capa |
| `tc-ctl-lcat-abstract` | Texto descriptivo de la capa. |
| `tc-ctl-lcat-metadata` | Sección con los enlaces a los metadatos de la capa. |

## Clases que definen estados

| Clase CSS | Función que desempeña el elemento que tiene la clase |
|-----------|------------------------------------------------------|
| `tc-collapsed` | Un elemento desplegable de la interfaz (por ejemplo, una rama del árbol de capas disponibles) está replegado. |
| `tc-checked` | En un nodo de capas disponibles, indica que la capa ya está añadida. |
| `tc-hidden` | El elemento está oculto a la vista del usuario. |
| `tc-selectable` | El elemento corresponde a una capa que es elegible para ser añadida al mapa. |
| `tc-loading` | El elemento es un nodo del árbol o de los resultados de búsqueda que ha sido seleccionado por el usuario para añadirse al mapa, pero la carga de la capa en el mapa no ha terminado todavía. |
| `tc-active` | Elemento biestado que está activo. Por ejemplo, el botón del idioma en el que está el visor actualmente. |
  
#### Ejemplo:

```javascript
   <div id="catalog" class="tc-ctl tc-ctl-lcat">
     <h2>Capas disponibles<button class="tc-ctl-lcat-btn-search" title="Buscar capas por texto"></button></h2>
     <div class="tc-ctl-lcat-search tc-hidden tc-collapsed">
       <div class="tc-group"><input type="search" class="tc-ctl-lcat-input tc-textbox" placeholder="Texto para buscar en las capas"></div>
       <ul></ul>
     </div>
     <div class="tc-ctl-lcat-tree">
       <ul class="tc-ctl-lcat-branch">
         <li class="tc-ctl-lcat-node" data-tc-layer-name="" data-tc-layer-uid="10"><span>IDENA</span>
           <ul class="tc-ctl-lcat-branch">
             <li class="tc-ctl-lcat-node tc-collapsed" data-tc-layer-name="nombresGeograficos" data-tc-layer-uid="656"><span data-tooltip="Pulse para añadir al mapa" class="tc-selectable">Nombres geográficos</span><button class="tc-ctl-lcat-btn-info"></button>
               <ul class="tc-ctl-lcat-branch tc-collapsed">
                 <li class="tc-ctl-lcat-node tc-collapsed" data-tc-layer-name="IDENA:toponimia" data-tc-layer-uid="657"><span data-tooltip="Pulse para añadir al mapa" class="tc-selectable">Toponimia</span><button class="tc-ctl-lcat-btn-info"></button>
                   <ul class="tc-ctl-lcat-branch tc-collapsed">
                     <li class="tc-ctl-lcat-node tc-ctl-lcat-leaf" data-tc-layer-name="IDENA:TOPONI_Txt_Toponimos" data-tc-layer-uid="658"><span data-tooltip="Pulse para añadir al mapa" class="tc-selectable">Nombres de lugar (topónimos)</span><button class="tc-ctl-lcat-btn-info"></button>
                       <ul class="tc-ctl-lcat-branch tc-collapsed"></ul>
                     </li>
                   </ul>
                 </li>
               </ul>
             </li>
           </ul>
         </li>
         <li class="tc-ctl-lcat-node tc-collapsed" data-tc-layer-name="" data-tc-layer-uid="962"><span>IGN - Unidades administrativas</span>
           <ul class="tc-ctl-lcat-branch tc-collapsed">
             <li class="tc-ctl-lcat-node tc-ctl-lcat-leaf" data-tc-layer-name="AU.AdministrativeBoundary" data-tc-layer-uid="963"><span data-tooltip="Pulse para añadir al mapa" class="tc-selectable">Límite administrativo</span><button class="tc-ctl-lcat-btn-info"></button>
               <ul class="tc-ctl-lcat-branch tc-collapsed"></ul>
             </li>
             <li class="tc-ctl-lcat-node tc-ctl-lcat-leaf" data-tc-layer-name="AU.AdministrativeUnit" data-tc-layer-uid="964"><span data-tooltip="Pulse para añadir al mapa" class="tc-selectable">Unidad administrativa</span><button class="tc-ctl-lcat-btn-info"></button>
               <ul class="tc-ctl-lcat-branch tc-collapsed"></ul>
             </li>
           </ul>
         </li>
       </ul>
     </div>
     <div class="tc-ctl-lcat-info tc-hidden"><a class="tc-ctl-lcat-info-close"></a>
       <h2>Información de capa</h2>
       <h3 class="tc-ctl-lcat-title"></h3>
     </div>
   </div>
    ```


@module 3. Clases CSS
@submodule 3.1. layerCatalog
 */

/**
### 1.5.0

- Añadido el control de catálogo de capas.
- Añadido el control de administración de capas de trabajo.
- Añadido el control para añadir datos geográficos externos.
- Añadido el control de impresión de mapas en PDF.
- Las capas de tipo VECTOR soportan más formatos de archivos geográficos.
- Se ha eliminado la limitación de extensión máxima por defecto del mapa.
- Corrección de errores.

### 1.4.0

- Añadida la capacidad de cambiar la proyección del mapa.
- Añadidos mapas de fondo de OpenStreetMap, Carto y Mapbox.
- Mejora de soporte a peticiones CORS.
- Corrección de errores.

### 1.3.0

- Añadida opción de clustering para capas de puntos.
- Añadido soporte multiidioma.
- El control de búsqueda soporta nuevos tipos de búsqueda: vías, direcciones postales y parcelas catastrales.
- Mejora de soporte a peticiones CORS.
- Corrección de errores.

### 1.2.2

- Actualización a OpenLayers 4.
- Corrección de errores.

### 1.2.1

- Corrección de errores.

### 1.2.0

- Añadida la capacidad de exportar el mapa a una imagen.
- Añadido a la documentación ejemplo de exportación de imagen.
- El control {{#crossLink "SITNA.cfg.MapControlOptions/featureInfo:property"}}{{/crossLink}} permite compartir entidades geográficas o descargarlas en distintos formatos.
- Corrección de errores.

### 1.1.3

- Añadidos a la clase {{#crossLink "SITNA.Map"}}{{/crossLink}} métodos de consulta y visualización de entidades geográficas.
- Añadidos ejemplos a la documentación para los métodos anteriores.
- Mejorada la interfaz del control de búsquedas añadiendo a los resultados distinción por tipo.
- Añadido registro centralizado de errores JavaScript.
- Corrección de errores.

### 1.1.2

- El control {{#crossLink "SITNA.cfg.MapControlOptions/featureInfo:property"}}{{/crossLink}} pasa a estar incluido por defecto en el mapa.
- La [página de incrustación de visores con KML](//sitna.tracasa.es/kml/) pasa a usar OpenLayers 3.
- Correción de errores de la [página de incrustación de visores con KML](//sitna.tracasa.es/kml/).
- Añadido ejemplo a la documentación de {{#crossLink "SITNA.cfg.ClickOptions"}}{{/crossLink}}.
- Añadido ejemplo a la documentación de {{#crossLink "SITNA.cfg.CoordinatesOptions"}}{{/crossLink}}.
- Mejorada con botones triestado la usabilidad del control de medición.
- Añadido indicador de carga de los elementos del visor.
- Añadido registro centralizado de errores JavaScript.
- Corrección de errores.

### 1.1.1

- Añadido el control de Google StreetView ({{#crossLink "SITNA.cfg.MapControlOptions/streetView:property"}}{{/crossLink}}).
- Añadido el control de gestión de clics en el mapa ({{#crossLink "SITNA.cfg.MapControlOptions/click:property"}}{{/crossLink}}).
- Añadidas [opciones](./classes/SITNA.cfg.CoordinatesOptions.html) de representación de coordenadas en el control {{#crossLink "SITNA.cfg.MapControlOptions/coordinates:property"}}{{/crossLink}}.
- Compatibilidad mejorada con dispositivos móviles.
- Mejoras de rendimiento en el layout por defecto.
- Mejoras en la documentación.
- Corrección de errores.

### 1.1.0

- Mejoras en el control {{#crossLink "SITNA.cfg.MapControlOptions/featureInfo:property"}}{{/crossLink}}: visualización de geometrías
 de las entidades geográficas, bocadillo arrastrable.
- Se retira el soporte a OpenLayers 2.
- Corrección de errores.

### 1.0.6

- Añadido el control de información de entidades basado en la petición `getFeatureInfo` de WMS, activable con la opción
 SITNA.cfg.MapControlOptions.{{#crossLink "SITNA.cfg.MapControlOptions/featureInfo:property"}}{{/crossLink}}.
- Añadidas las opciones de zoom al método SITNA.Map.{{#crossLink "SITNA.Map/zoomToMarkers:method"}}{{/crossLink}}: radio del
 área alrededor del marcador a mostrar y margen a dejar en los bordes.
- Corregido error en el layout por defecto que impedía la funcionalidad de deslizar dedo para colapsar paneles.

### 1.0.5

- Corregido error que impedía en ver en la tabla de contenidos si una capa cargada es visible a la escala actual.
- Corregido error que impedía que se pudieran ocultar desde la tabla de contenidos todas las entidades de una capa KML.
- Correcciones de estilo en Internet Explorer.
- Eliminada la necesidad de que el mapa de situación tenga un mapa de fondo de los disponibles en el mapa principal.
- Cambios menores del estilo por defecto.

### 1.0.4

- Añadidas etiquetas `form` en el HTML de la tabla de contenidos.
- Añadida compatibilidad con OpenLayers 3.
- Actualizada para la maquetación por defecto la fuente [FontAwesome](http://fortawesome.github.io/Font-Awesome/) a la versión 4.3.0.
- La leyenda ahora oculta los servicios que no tienen capas visibles.
- Cambios en el estilo por defecto.
- Corrección de errores.

### 1.0.3

- Añadida la opción de deshabilitar el zoom en el mapa con la rueda de ratón mediante la propiedad SITNA.Cfg.{{#crossLink "SITNA.Cfg/mousewWheelZoom:property"}}{{/crossLink}}.
- Añadida la posibilidad de mostrar un marcador con su bocadillo de información asociada visible por defecto, mediante la propiedad SITNA.cfg.MarkerOptions.{{#crossLink "SITNA.cfg.MarkerOptions/showPopup:property"}}{{/crossLink}}.
- Corrección de errores.

### 1.0

- Despliegue inicial.

@module 4. Historial de cambios
 */

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
La dirección principal de acceso a la API es **[//sitna.tracasa.es/api/](//sitna.tracasa.es/api/)**. No obstante, hay otras direcciones disponibles para
otras necesidades concretas:

- Lógica de la API compilada en un solo archivo:
  + OpenLayers 4 como motor, minimizada: [//sitna.tracasa.es/api/sitna.ol.min.js](//sitna.tracasa.es/api/sitna.ol.min.js).
  + OpenLayers 4 como motor, sin minimizar: [//sitna.tracasa.es/api/sitna.ol.debug.js](//sitna.tracasa.es/api/sitna.ol.debug.js).
  + OpenLayers 2 como motor, minimizada: [//sitna.tracasa.es/api/sitna.ol2.min.js](//sitna.tracasa.es/api/sitna.ol2.min.js).
  + OpenLayers 2 como motor, sin minimizar: [//sitna.tracasa.es/api/sitna.ol2.debug.js](//sitna.tracasa.es/api/sitna.ol2.debug.js).

- Lógica de la API repartida en varios archivos que se solicitan bajo demanda. En este caso se utiliza OpenLayers 4 como motor a no ser que el navegador sea incompatible,
 en cuyo caso será OpenLayers 2:
  + Minimizada: [//sitna.tracasa.es/api/sitna.min.js](//sitna.tracasa.es/api/sitna.min.js).
  + Sin minimizar: [//sitna.tracasa.es/api/sitna.js](//sitna.tracasa.es/api/sitna.js).

_Aviso: a las opciones basadas en OpenLayers 2 se les ha retirado el soporte desde la versión 1.1.0 de la API SITNA._

@module 1. Direcciones de la API
 */


/**
La configuración por defecto de {{#crossLink "SITNA.cfg.SearchOptions"}}{{/crossLink}} tiene como origen de datos el WFS de IDENA. Es posible establecer un origen de datos distinto en el que consultar, para ello en lugar de indicar un booleano, que activa o desactiva la búsqueda, se indicará un objeto con las propiedades a sobrescribir. Las propiedades a sobrescribir no siempre serán las mismas, variarán en función de la configuración que tenga la búsqueda que se quiera modificar.


@module 2.3. Objeto de configuración global
@submodule 2.3.1. Objeto de configuración de opciones del buscador
 */

/**
  Opciones de configuración del origen de datos de la búsqueda de direcciones postales.

  Esta clase no tiene constructor.
  
  Puede consultar el ejemplo [online](../../examples/Cfg.SearchPostalAddressSource.html). 
  #### Ejemplo:

  ```javascript
  {
    url: '//idena.navarra.es/ogc/wfs',        
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Txt_Portal',
        dataIdProperty: ['CMUNICIPIO', 'CENTIDADC', 'CVIA', 'PORTAL'],
        queryProperties: {
            firstQueryWord: ['ENTIDADC', 'ENTINOAC'],
            secondQueryWord: ['VIA', 'VIANOAC'],
            thirdQueryWord: ['PORTAL']
        },
        suggestionListHead: {
            label: "search.list.number",
            color: "fontColor"
        },
        outputProperties: ['ENTIDADC', 'VIA', 'PORTAL', 'CVIA', 'CENTIDADC', 'CMUNICIPIO'],
        outputFormatLabel: '{1} {2}, {0}',
        styles: [
            {
                point: {
                    radius: 0,
                    label: "PORTAL",
                    angle: "CADANGLE",
                    fontColor: "#CB0000",
                    fontSize: 14,
                    labelOutlineColor: "#FFFFFF",
                    labelOutlineWidth: 4
                }
            }
        ]
  }
  ``` 
  @class SITNA.cfg.SearchPostalAddressSource
  @static
 */

/**
  Dirección del servicio WFS (las búsquedas en el API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
  @property url
  @type String 
 */

/**
  Prefijo del nombre de la capa o capas a definir en la propiedad {{#crossLink "SITNA.cfg.SearchPostalAddressSource/featureType:property"}}{{/crossLink}}. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).  
  @property featurePrefix
  @type String
 */

/**
  Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en {{#crossLink "SITNA.cfg.SearchPostalAddressSource/queryProperties:property"}}{{/crossLink}}.
  @property featureType
  @type Array
*/

/**
  Definición de los campos por los que filtrar la búsqueda de direcciones postales. 
  <pre><strong>Requerido</strong> {{#crossLink "SITNA.cfg.SearchQueryProperties/firstQueryWord:property"}}{{/crossLink}}: se indicará el campo o campos en los que buscar el nombre de la entidad de población.</pre>  
  <pre><strong>Requerido</strong> {{#crossLink "SITNA.cfg.SearchQueryProperties/secondQueryWord:property"}}{{/crossLink}}: se indicará el campo o campos en los que buscar el nombre de la vía.</pre>  
  <pre><strong>Requerido</strong> {{#crossLink "SITNA.cfg.SearchQueryProperties/thirdQueryWord:property"}}{{/crossLink}}: se indicará el campo o campos en los que buscar el número de portal.</pre>  
  @property queryProperties
  @type SITNA.cfg.SearchQueryProperties
 */

/**
  Nombre del campo de la geometría de la dirección postal.
  @property geometryName
  @type String
*/

/**
  Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a la dirección postal. Los campos definidos deben existir en la capa o capas definidas en la propiedad {{#crossLink "SITNA.cfg.SearchPostalAddressSource/featureType:property"}}{{/crossLink}}.
  @property dataIdProperty
  @type Array
*/

/**
  Colección con los nombres de campos a mostrar (según el patrón indicando en {{#crossLink "SITNA.cfg.SearchPostalAddressSource/outputFormatLabel:property"}}{{/crossLink}}) en la lista de sugerencias. Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. Los campos definidos deben existir en la capa o capas definidas en la propiedad {{#crossLink "SITNA.cfg.SearchPostalAddressSource/featureType:property"}}{{/crossLink}}.
  @property outputProperties
  @type Array
*/

/**
  Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección {{#crossLink "SITNA.cfg.SearchPostalAddressSource/outputProperties:property"}}{{/crossLink}} con el valor del campo. Las llaves de cierre y apertura son necesarias.
  
Por ejemplo: {{#crossLink "SITNA.cfg.SearchPostalAddressSource/outputProperties:property"}}{{/crossLink}} como `[EntidadPoblacion, Via, Numero]` y {{#crossLink "SITNA.cfg.SearchPostalAddressSource/outputFormatLabel:property"}}{{/crossLink}} como `“{1} {2}, {0}”` mostrará en la lista resultados del tipo: <em>Calle Estafeta 13, Pamplona</em>.
  @property outputFormatLabel
  @type String
*/

/**
  Colección de instancias {{#crossLink "SITNA.cfg.StyleOptions"}}{{/crossLink}}. 
   
La relación entre capa y estilo se hace mediante el índice en la colección en {{#crossLink "SITNA.cfg.SearchPostalAddressSource/featureType:property"}}{{/crossLink}} y en {{#crossLink "SITNA.cfg.SearchPostalAddressSource/styles:property"}}{{/crossLink}}, por tanto, deberá haber tantas instancias como capas definidas en {{#crossLink "SITNA.cfg.SearchPostalAddressSource/featureType:property"}}{{/crossLink}}.  
   
No está disponible {{#crossLink "SITNA.cfg.StyleOptions/cluster:property"}}{{/crossLink}}.  
  @property styles
  @type Array
*/

/**
  Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  @property suggestionListHead
  @type SITNA.cfg.SearchSuggestionListProperties
*/

/**
  Opciones de configuración del origen de datos de la búsqueda de parcelas catastrales.
  
Esta clase no tiene constructor.

  Puede consultar el ejemplo [online](../../examples/Cfg.SearchCadastralSource.html). 
  #### Ejemplo:

  ```javascript
  {   
    url:'//idena.navarra.es/ogc/wfs',                
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',        
        featureType: ['CATAST_Pol_ParcelaUrba', 'CATAST_Pol_ParcelaRusti', 'CATAST_Pol_ParcelaMixta'],
        municipality: {
            featureType: 'CATAST_Pol_Municipio',
            labelProperty: 'MUNICIPIO',
            idProperty: 'CMUNICIPIO'
        },
        queryProperties: {
            firstQueryWord: 'CMUNICIPIO',
            secondQueryWord: 'POLIGONO',
            thirdQueryWord: 'PARCELA'
        },
        suggestionListHead: {
            label: "search.list.cadastral",
            color: [
                {
                    CATAST_Pol_ParcelaUrba: {
                        title: "search.list.cadastral.urban",
                        color: {
                            geomType: "polygon",
                            css: "strokeColor"
                        }
                    }
                },
                {
                    CATAST_Pol_ParcelaRusti: {
                        title: "search.list.cadastral.rustic",
                        color: {
                            geomType: "polygon",
                            css: "strokeColor"
                        }
                    }
                },
                {
                    CATAST_Pol_ParcelaMixta: {
                        title: "search.list.cadastral.mixed",
                        color: {
                            geomType: "polygon",
                            css: "strokeColor"
                        }
                    }
                }
            ]
        },
        styles: [
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#136278',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            },
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#0c8b3d',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            },
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#e5475f',
                    strokeWidth: 2,
                    strokeOpacity: 1
                },
            }
        ]
  }
  ``` 
  @class SITNA.cfg.SearchCadastralSource
  @static
 */

/**
  Definición de la fuente de datos para la búsqueda de parcela por nombre de municipio en lugar de por código del mismo.
  @property municipality
  @type SITNA.cfg.SearchCadastralSourceExt
  @required
*/

/**
  Dirección del servicio WFS (las búsquedas en el API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs").
  @property url
  @type String 
 */

/**
  Prefijo del nombre de la capa o capas a definir en la propiedad {{#crossLink "SITNA.cfg.SearchCadastralSource/featureType:property"}}{{/crossLink}}. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  @property featurePrefix
  @type String
 */

/**
  Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en {{#crossLink "SITNA.cfg.SearchCadastralSource/queryProperties:property"}}{{/crossLink}}.
  @property featureType
  @type Array
*/

/**
  Definición de los campos por los que filtrar la búsqueda de parcelas. 
  <pre><strong>Requerido</strong> {{#crossLink "SITNA.cfg.SearchQueryProperties/firstQueryWord:property"}}{{/crossLink}}: se indicará el campo o campos en los que buscar el código de municipio.</pre>
  <pre><strong>Requerido</strong> {{#crossLink "SITNA.cfg.SearchQueryProperties/secondQueryWord:property"}}{{/crossLink}}: se indicará el campo o campos en los que buscar el polígono.</pre>
  <pre><strong>Requerido</strong> {{#crossLink "SITNA.cfg.SearchQueryProperties/thirdQueryWord:property"}}{{/crossLink}}: se indicará el campo o campos en los que buscar la parcela. </pre>
  @property queryProperties
  @type SITNA.cfg.SearchQueryProperties
 */

/**
  Nombre del campo de la geometría de la parcela catastral.
  @property geometryName
  @type String
*/

/**
  Colección de instancias {{#crossLink "SITNA.cfg.StyleOptions"}}{{/crossLink}}.
   
La relación entre capa y estilo se hace mediante el índice en la colección en {{#crossLink "SITNA.cfg.SearchCadastralSource/featureType:property"}}{{/crossLink}} y en {{#crossLink "SITNA.cfg.SearchCadastralSource/styles:property"}}{{/crossLink}}, por tanto, deberá haber tantas instancias como capas definidas en {{#crossLink "SITNA.cfg.SearchCadastralSource/featureType:property"}}{{/crossLink}}.  
   
No está disponible {{#crossLink "SITNA.cfg.StyleOptions/cluster:property"}}{{/crossLink}}.  
  @property styles
  @type Array
*/

/**
  Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  @property suggestionListHead
  @type SITNA.cfg.SearchSuggestionListProperties
*/

/**
  Opciones de configuración del origen de datos de la búsqueda de municipios.
  
Esta clase no tiene constructor.

  Puede consultar el ejemplo [online](../../examples/Cfg.SearchMunicipalitySource.html). 
  #### Ejemplo:

  ```javascript
  {
    url:'//idena.navarra.es/ogc/wfs',        
        url: '//idena.navarra.es/ogc/wfs',
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Pol_Municipio',
        dataIdProperty: ['CMUNICIPIO'],
        queryProperties: {
            firstQueryWord: ['MUNINOAC', 'MUNICIPIO']
        },
        suggestionListHead: {
            label: "search.list.municipality",
            color: "strokeColor"
        },
        outputProperties: ['MUNICIPIO'],
        outputFormatLabel: '{0}',        
        styles: [
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#fe06a5',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            }
        ]
  }
  ``` 
  @class SITNA.cfg.SearchMunicipalitySource
  @static
 */

/**
  Dirección del servicio WFS (las búsquedas en el API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
  @property url
  @type String 
 */

/**
  Prefijo del nombre de la capa o capas a definir en la propiedad {{#crossLink "SITNA.cfg.SearchMunicipalitySource/featureType:property"}}{{/crossLink}}. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace). 
  @property featurePrefix
  @type String
 */

/**
  Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en {{#crossLink "SITNA.cfg.SearchMunicipalitySource/queryProperties:property"}}{{/crossLink}}.
  @property featureType
  @type Array
*/

/**
  Definición de los campos por los que filtrar la búsqueda de municipios. 
  <pre><strong>Requerido</strong> {{#crossLink "SITNA.cfg.SearchQueryProperties/firstQueryWord:property"}}{{/crossLink}}: se indicará el campo o campos en los que buscar el nombre del municipio.</pre>  
  @property queryProperties
  @type SITNA.cfg.SearchQueryProperties
 */

/**
  Nombre del campo de la geometría del municipio.
  @property geometryName
  @type String
*/

/**
  Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a un municipio. Los campos definidos deben existir en la capa o capas definidas en la propiedad {{#crossLink "SITNA.cfg.SearchMunicipalitySource/featureType:property"}}{{/crossLink}}.
  @property dataIdProperty
  @type Array
*/

/**
  Colección con los nombres de campos a mostrar (según el patrón indicando en {{#crossLink "SITNA.cfg.SearchMunicipalitySource/outputFormatLabel:property"}}{{/crossLink}}) en la lista de sugerencias. Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. Los campos definidos deben existir en la capa o capas definidas en la propiedad {{#crossLink "SITNA.cfg.SearchMunicipalitySource/featureType:property"}}{{/crossLink}}.
  @property outputProperties
  @type Array
*/

/**
  Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección {{#crossLink "SITNA.cfg.SearchMunicipalitySource/outputProperties:property"}}{{/crossLink}} con el valor del campo. Las llaves de cierre y apertura son necesarias.
  
Por ejemplo: {{#crossLink "SITNA.cfg.SearchMunicipalitySource/outputProperties:property"}}{{/crossLink}} como `[NombreMunicipio]` y {{#crossLink "SITNA.cfg.SearchMunicipalitySource/outputFormatLabel:property"}}{{/crossLink}} como `“{0}”` mostrará en la lista resultados del tipo: <em>Pamplona</em>.
  @property outputFormatLabel
  @type String
*/

/**
  Colección de instancias {{#crossLink "SITNA.cfg.StyleOptions"}}{{/crossLink}}. 
  
La relación entre capa y estilo se hace mediante el índice en la colección en {{#crossLink "SITNA.cfg.SearchMunicipalitySource/featureType:property"}}{{/crossLink}} y en {{#crossLink "SITNA.cfg.SearchMunicipalitySource/styles:property"}}{{/crossLink}}, por tanto, deberá haber tantas instancias como capas definidas en {{#crossLink "SITNA.cfg.SearchMunicipalitySource/featureType:property"}}{{/crossLink}}.  
  
No está disponible {{#crossLink "SITNA.cfg.StyleOptions/cluster:property"}}{{/crossLink}}. 
  @property styles
  @type Array
*/

/**
  Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  @property suggestionListHead
  @type SITNA.cfg.SearchSuggestionListProperties
*/

/**
  Opciones de configuración del origen de datos de la búsqueda de cascos urbanos.
  
Esta clase no tiene constructor.

  Puede consultar el ejemplo [online](../../examples/Cfg.SearchTownSource.html). 
  #### Ejemplo:
 
  ```javascript
  {
    url: '//idena.navarra.es/ogc/wfs',        
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',
        featureType: 'ESTADI_Pol_EntidadPob',        
        dataIdProperty: ['CMUNICIPIO', 'CENTIDAD'],        
        queryProperties: {
            firstQueryWord: ['ENTINOAC', 'ENTIDAD']
        },
        suggestionListHead: {
            label: "search.list.urban",
            color: "strokeColor"
        },
        outputProperties: ['MUNICIPIO', 'ENTIDAD'],
        outputFormatLabel: '{1} ({0})',        
        styles: [
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#feba1e',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            }
        ]
  }
  ``` 
  @class SITNA.cfg.SearchTownSource
  @static
 */

/**
  Dirección del servicio WFS (las búsquedas en el API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
  @property url
  @type String 
 */

/**
  Prefijo del nombre de la capa o capas a definir en la propiedad {{#crossLink "SITNA.cfg.SearchTownSource/featureType:property"}}{{/crossLink}}. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace). 
  @property featurePrefix
  @type String
 */

/**
  Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en {{#crossLink "SITNA.cfg.SearchTownSource/queryProperties:property"}}{{/crossLink}}.
  @property featureType
  @type Array
*/

/**
  Definición de los campos por los que filtrar la búsqueda de cascos urbanos. 
  <pre><strong>Requerido</strong> {{#crossLink "SITNA.cfg.SearchQueryProperties/firstQueryWord:property"}}{{/crossLink}}: se indicará el campo o campos en los que buscar el nombre del casco urbano.</pre>  
  @property queryProperties
  @type SITNA.cfg.SearchQueryProperties
 */

/**
  Nombre del campo de la geometría del casco urbano.
  @property geometryName
  @type String
*/

/**
  Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a un casco urbano. Los campos definidos deben existir en la capa o capas definidas en la propiedad {{#crossLink "SITNA.cfg.SearchTownSource/featureType:property"}}{{/crossLink}}.
  @property dataIdProperty
  @type Array
*/

/**
  Colección con los nombres de campos a mostrar (según el patrón indicando en {{#crossLink "SITNA.cfg.SearchTownSource/outputFormatLabel:property"}}{{/crossLink}}) en la lista de sugerencias. Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. Los campos definidos deben existir en la capa o capas definidas en la propiedad {{#crossLink "SITNA.cfg.SearchTownSource/featureType:property"}}{{/crossLink}}.
  @property outputProperties
  @type Array
*/

/**
  Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección {{#crossLink "SITNA.cfg.SearchTownSource/outputProperties:property"}}{{/crossLink}} con el valor del campo. Las llaves de cierre y apertura son necesarias.
  
Por ejemplo: {{#crossLink "SITNA.cfg.SearchTownSource/outputProperties:property"}}{{/crossLink}} como `[NombreMunicipio, NombreCascoUrbano]` y {{#crossLink "SITNA.cfg.SearchTownSource/outputFormatLabel:property"}}{{/crossLink}} como `“{1} ({0})”` mostrará en la lista resultados del tipo: <em>Salinas de Pamplona (Galar)</em>.
  @property outputFormatLabel
  @type String
*/

/**
  Colección de instancias {{#crossLink "SITNA.cfg.StyleOptions"}}{{/crossLink}}. 
   
La relación entre capa y estilo se hace mediante el índice en la colección en {{#crossLink "SITNA.cfg.SearchTownSource/featureType:property"}}{{/crossLink}} y en {{#crossLink "SITNA.cfg.SearchTownSource/styles:property"}}{{/crossLink}}, por tanto, deberá haber tantas instancias como capas definidas en {{#crossLink "SITNA.cfg.SearchTownSource/featureType:property"}}{{/crossLink}}.  
   
No está disponible {{#crossLink "SITNA.cfg.StyleOptions/cluster:property"}}{{/crossLink}}.  
  @property styles
  @type Array
*/

/**
  Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  @property suggestionListHead
  @type SITNA.cfg.SearchSuggestionListProperties
*/

/**
  Opciones de configuración del origen de datos de la búsqueda de vías.
  
Esta clase no tiene constructor.

  Puede consultar el ejemplo [online](../../examples/Cfg.SearchStreetSource.html). 
  #### Ejemplo:
 
  ```javascript
  {
    url: '//idena.navarra.es/ogc/wfs',        
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',
        renderFeatureType: 'CATAST_Txt_Calle',
        featureType: 'CATAST_Lin_CalleEje',
        dataIdProperty: ['CVIA'],        
        queryProperties: {
            firstQueryWord: ['ENTINOAC', 'ENTIDADC'],
            secondQueryWord: ['VIA', 'VIANOAC']
        },
        suggestionListHead: {
            label: "search.list.street",
            color: "strokeColor"
        },
        outputProperties: ['ENTIDADC', 'VIA', 'CVIA', 'CENTIDADC', 'CMUNICIPIO'],
        outputFormatLabel: '{1}, {0}',
        styles: [
            {
                line: {
                    strokeColor: "#CB0000",
                    strokeOpacity: 1,
                    strokeWidth: 2,
                    strokeLinecap: "round",
                    strokeDashstyle: "solid"
                }
            },
            {
                point: {
                    label: "VIA",
                    angle: "CADANGLE",
                    fontColor: "#000000",
                    fontSize: 7,
                    labelOutlineColor: "#ffffff",
                    labelOutlineWidth: 2
                }
            }
        ]
  }
  ``` 
  @class SITNA.cfg.SearchStreetSource
  @static
 */

/**
  Dirección del servicio WFS (las búsquedas en el API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
  @property url
  @type String 
 */

/**
  Prefijo del nombre de la capa o capas a definir en la propiedad {{#crossLink "SITNA.cfg.SearchStreetSource/featureType:property"}}{{/crossLink}}. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).  
  @property featurePrefix
  @type String
 */

/**
  Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en {{#crossLink "SITNA.cfg.SearchStreetSource/queryProperties:property"}}{{/crossLink}}.
  @property featureType
  @type Array
*/

/**
  Colección con los nombres de las capas auxiliares a añadir al resultado de la búsqueda en el mapa. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en {{#crossLink "SITNA.cfg.SearchStreetSource/dataIdProperty:property"}}{{/crossLink}}.
   
No se muestran sugerencias en base a las capas auxiliares, únicamente se añade información en el momento de pintar en el mapa, es por ello que debe existir relación en los datos entre las capas definidas en {{#crossLink "SITNA.cfg.SearchStreetSource/featureType:property"}}{{/crossLink}} y {{#crossLink "SITNA.cfg.SearchStreetSource/renderFeatureType:property"}}{{/crossLink}} y que ambas cuenten con los campos definidos en {{#crossLink "SITNA.cfg.SearchStreetSource/dataIdProperty:property"}}{{/crossLink}}. 
  @property renderFeatureType
  @type Array
  @optional
*/

/**
  Definición de los campos por los que filtrar la búsqueda de vías. 
  <pre><strong>Requerido</strong> {{#crossLink "SITNA.cfg.SearchQueryProperties/firstQueryWord:property"}}{{/crossLink}}: se indicará el campo o campos en los que buscar el nombre de la entidad de población.</pre>  
  <pre><strong>Requerido</strong> {{#crossLink "SITNA.cfg.SearchQueryProperties/secondQueryWord:property"}}{{/crossLink}}: se indicará el campo o campos en los que buscar el nombre de la vía.</pre>  
  @property queryProperties
  @type SITNA.cfg.SearchQueryProperties
 */

/**
  Nombre del campo de la geometría de la vía.
  @property geometryName
  @type String
*/

/**
  Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a una vía. Los campos definidos deben existir en la capa o capas definidas en la propiedad {{#crossLink "SITNA.cfg.SearchStreetSource/featureType:property"}}{{/crossLink}}.
  @property dataIdProperty
  @type Array
*/

/**
  Colección con los nombres de campos a mostrar (según el patrón indicando en {{#crossLink "SITNA.cfg.SearchStreetSource/outputFormatLabel:property"}}{{/crossLink}}) en la lista de sugerencias. Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. Los campos definidos deben existir en la capa o capas definidas en la propiedad {{#crossLink "SITNA.cfg.SearchStreetSource/featureType:property"}}{{/crossLink}}.
  @property outputProperties
  @type Array
*/

/**
  Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección {{#crossLink "SITNA.cfg.SearchStreetSource/outputProperties:property"}}{{/crossLink}} con el valor del campo. Las llaves de cierre y apertura son necesarias.
  
Por ejemplo: {{#crossLink "SITNA.cfg.SearchStreetSource/outputProperties:property"}}{{/crossLink}} como `[EntidadPoblacion, Via]` y {{#crossLink "SITNA.cfg.SearchStreetSource/outputFormatLabel:property"}}{{/crossLink}} como `“{1}, {0}”` mostrará en la lista resultados del tipo: <em>Calle Estafeta, Pamplona</em>.
  @property outputFormatLabel
  @type String
*/

/**
  Colección de instancias {{#crossLink "SITNA.cfg.StyleOptions"}}{{/crossLink}}. 
   
La relación entre capa y estilo se hace mediante el índice en las colecciones 1 y 2 siendo 1 la concatenación de {{#crossLink "SITNA.cfg.SearchStreetSource/featureType:property"}}{{/crossLink}} y {{#crossLink "SITNA.cfg.SearchStreetSource/renderFeatureType:property"}}{{/crossLink}} y 2 {{#crossLink "SITNA.cfg.SearchStreetSource/styles:property"}}{{/crossLink}}, por tanto, deberá haber tantas instancias como la suma de las capas definidas en {{#crossLink "SITNA.cfg.SearchStreetSource/featureType:property"}}{{/crossLink}} y en {{#crossLink "SITNA.cfg.SearchStreetSource/renderFeatureType:property"}}{{/crossLink}}  
   
No está disponible {{#crossLink "SITNA.cfg.StyleOptions/cluster:property"}}{{/crossLink}}.  
  @property styles
  @type Array
*/

/**
  Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  @property suggestionListHead
  @type SITNA.cfg.SearchSuggestionListProperties
*/

/**
  Definición del color en la cabecera de la lista de sugerencias (para una capa concreta) de una búsqueda con resultados posibles de varias capas. Se establece como clave el nombre de la capa a la cual afecta ésta configuración.
  
Esta clase no tiene constructor.
  #### Ejemplo:

  ```javascript
    CATAST_Pol_ParcelaUrba: {
      title: "search.list.cadastral.urban",
      color: {
        geomType: "polygon",
        css: "strokeColor"
      }
    }
  ```
  @class SITNA.cfg.SearchSuggestionListColorByFeatureType
  @static
 */

/**
  Title para identificar al color. Se define con la clave del diccionario de traducciones. Revisar la sección "Soporte multiidioma" en {{#crossLinkModule "2.2. Maquetación"}}{{/crossLinkModule}}. 
  @property title
  @type String
  @required
 */

/**
  Configuración para obtener el color. 
  @property color
  @type SITNA.cfg.SearchSuggestionListColor
  @required
 */

/**
  Definición del color en la cabecera de la lista de sugerencias de una búsqueda con resultados posibles de una sola capa.
  
Esta clase no tiene constructor.
  #### Ejemplo:

  ```javascript
     {
        geomType: "point",
        css: "fontColor"
     }
  ```
  @class SITNA.cfg.SearchSuggestionListColor
  @static
 */

/**
  Nombre del tipo de geometría.
  @property geomType
  @type SITNA.consts.Geom
  @required
 */

/**
  Nombre de la propiedad de las sugerencias de la cual extraer el color. Ha de ser alguna de las distintas propiedades de colores presentes en {{#crossLink "SITNA.cfg.PointStyleOptions"}}{{/crossLink}} o {{#crossLink "SITNA.cfg.LineStyleOptions"}}{{/crossLink}} o {{#crossLink "SITNA.cfg.PolygonStyleOptions"}}{{/crossLink}}.
  @property css
  @type String
  @required
 */


/**
  Opciones de configuración del origen de datos de una búsqueda.
  
Esta clase no tiene constructor. 
  @class SITNA.cfg.SearchQueryProperties
  @static
 */

/**
  Colección de nombre de campo o campos a consultar para el 1º término del criterio de búsqueda, deben existir en la capa o capas definidas en la propiedad {{#crossLink "featureType"}}{{/crossLink}}.
  @property firstQueryWord
  @type Array
  @required
 */

/**
  Colección de nombre de campo o campos a consultar para el 2º término del criterio de búsqueda, deben existir en la capa o capas definidas en la propiedad {{#crossLink "featureType"}}{{/crossLink}}.
  @property secondQueryWord
  @type Array
  @optional
*/

/**
  Colección de nombre de campo o campos a consultar para el 3º término del criterio de búsqueda, deben existir en la capa o capas definidas en la propiedad {{#crossLink "featureType"}}{{/crossLink}}.
  @property thirdQueryWord
  @type Array
  @optional
*/

/**
  Opciones de configuración para la composición de la cabecera de una lista de sugerencias de búsqueda.
  
Esta clase no tiene constructor.
  #### Ejemplo:
  ```javascript
  {
    label: "search.list.town",
    color: "strokeColor"
  }
  @class SITNA.cfg.SearchSuggestionListProperties
  @static
 */

/**
  Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… Revisar la sección "Soporte multiidioma" en {{#crossLinkModule "2.2. Maquetación"}}{{/crossLinkModule}}. 
  @property label
  @type String
  @required
 */

/**
  Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en {{#crossLink "SITNA.cfg.SearchCadastralSource/styles:property"}}{{/crossLink}} que cumpla con la configuración. 
  
La definición como String String ha de ser para indicar el nombre de una propiedad presente en {{#crossLink "SITNA.cfg.PointStyleOptions"}}{{/crossLink}} o {{#crossLink "SITNA.cfg.LineStyleOptions"}}{{/crossLink}} o {{#crossLink "SITNA.cfg.PolygonStyleOptions"}}{{/crossLink}}.
  @property color
  @type SITNA.cfg.SearchSuggestionListColorByFeatureType|SITNA.cfg.SearchSuggestionListColor|String
  @required
 */

/**
  Configuración del origen de datos auxiliar a la búsqueda de parcelas catastrales para la codificación de los nombres de municipio.
  
Esta clase no tiene constructor.

  Puede consultar el ejemplo [online](../../examples/Cfg.SearchCadastralSource.html). 
  #### Ejemplo:
 
  ```javascript
  {
    url: '//miServicioWFS/ogc/wfs',
    featurePrefix: 'IDENA',    
    featureType: ['Pol_ParcelaUrbana', 'Pol_ParcelaRustica', 'Pol_ParcelaMixta'],
    municipality: {
      featureType: 'Pol_Municipio',
      labelProperty: 'MUNICIPIO',
      idProperty: 'COD_MUNICIPIO'      
    },
    queryProperties: {
      firstQueryWord: 'COD_MUNICIPIO',
      secondQueryWord: 'POLIGONO',
      thirdQueryWord: 'PARCELA'
    }
  }
  @class SITNA.cfg.SearchCadastralSourceExt
  @static
 */

/**
  Colección de nombre de capa o capas a consultar.
  @property featureType
  @type Array
  @required
 */

/**
  Nombre de campo que identifica unívocamente el municipio cuyos valores deben coincidir con los posibles valores del campo indicado en {{#crossLink "SITNA.cfg.SearchQueryProperties/firstQueryWord:property"}}{{/crossLink}}.
  @property idProperty
  @type String
  @required
*/

/**
  Nombre de campo en el que buscar el texto indicado.
  @property labelProperty
  @type String
  @required
*/


/**
  Colección de identificadores de tipo de geometría.
  
No se deberían modificar las propiedades de esta clase.
  @class SITNA.consts.Geom
  @static
 */

/**
  Identificador de geometría de tipo polígono.
  @property polygon
  @type string
  @final
 */

/**
  Identificador de geometría de tipo línea.
  @property line
  @type string
  @final
 */

/**
  Identificador de geometría de tipo punto.
  @property point
  @type string
  @final
 */



/**
Para modificar el aspecto y los datos del mapa existen varias opciones de configuración. Estas opciones se le pueden pasar por tres medios
no excluyentes. Son los siguientes:

1. Parámetros del constructor de [SITNA.Map](../classes/SITNA.Map.html).
2. Maquetación del visor (ver [SITNA.Cfg.layout](../classes/SITNA.Cfg.html#property_layout)).
3. Objeto de configuración global (ver [SITNA.Cfg](../classes/SITNA.Cfg.html)).

Esta lista está ordenada por orden de mayor a menor prevalencia, de manera que si una configuración por un medio entra en conflicto por otra los
conflictos se resuelven en ese orden.

@module 2. Configuración
 */

/**
  Colección de constantes utilizadas por la API. Se recomienda utilizar las propiedades de esta clase estática para referirse a valores conocidos.
  
No deberían modificarse las propiedades de esta clase.
  @class SITNA.Consts
  @static
 */
SITNA.Consts = TC.Consts;
/**
  Identificadores de capas útiles de IDENA y otros servicios de terceros.
  @property layer
  @type SITNA.consts.Layer
  @final
 */
/**
  Identificadores de tipo de capa.
  @property layerType
  @type SITNA.consts.LayerType
  @final
 */
/*
  Identificadores de tipo de consulta al mapa.
  property mapSearchType
  type SITNA.consts.MapSearchType
  final
 */
/**
  Tipos MIME de utilidad.
  @property mimeType
  @type SITNA.consts.MimeType
  @final
 */

/**
  Colección de identificadores de tipo de capa.
  
No se deberían modificar las propiedades de esta clase.
  @class SITNA.consts.LayerType
  @static
 */
/**
  Identificador de capa de tipo WMS.
  @property WMS
  @type string
  @final
 */
/**
  Identificador de capa de tipo WMTS.
  @property WMTS
  @type string
  @final
 */
/**
  Identificador de capa de tipo WFS.
  @property WFS
  @type string
  @final
 */
/**
  Identificador de capa de tipo KML.
  @property KML
  @type string
  @final
  @deprecated En lugar de esta propiedad es recomendable usar VECTOR para cargar archivos KML.
 */
/**
  Identificador de capa de tipo vectorial. Este tipo de capa es la que se utiliza para dibujar marcadores o para cargar
  archivos de datos geográficos vectoriales de los siguientes tipos: KML, GeoJSON, GPX, GML, WKT y TopoJSON.
  @property VECTOR
  @type string
  @final
 */

/**
  Colección de identificadores de capas útiles de IDENA y otros servicios de terceros.
  
No se deberían modificar las propiedades de esta clase.
  @class SITNA.consts.Layer
  @static
 */
/**
  Identificador de la capa de ortofoto de máxima actualidad del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
  @property IDENA_ORTHOPHOTO
  @type string
  @final
 */
/**
  Identificador de la capa de mapa base del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
  @property IDENA_BASEMAP
  @type string
  @final
 */
/**
  Identificador de la capa de catastro del WMS de IDENA.
  @property IDENA_CADASTER
  @type string
  @final
 */
/**
  Identificador de la capa de cartografía topográfica del WMS de IDENA.
  @property IDENA_CARTO
  @type string
  @final
 */
/**
  Identificador de la capa de la combinación de ortofoto de máxima actualidad y mapa base del WMS de IDENA.
  @property IDENA_BASEMAP_ORTHOPHOTO
  @type string
  @final
 */
/**
  Identificador de la capa de relieve en blanco y negro del WMS de IDENA.
  @property IDENA_BW_RELIEF
  @type string
  @final
 */
/**
  Identificador de la capa de ortofoto 2014 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
  @property IDENA_ORTHOPHOTO2014
  @type string
  @final
 */
/**
  Identificador de la capa de ortofoto 2012 del WMTS de IDENA. Esta capa solo es compatible con el sistema de referencia EPSG:25830.
  @property IDENA_ORTHOPHOTO2012
  @type string
  @final
 */
/**
  Identificador de la capa de mapa base del WMS de IDENA.
  @property IDENA_DYNBASEMAP
  @type string
  @final
 */
/**
  Identificador de la capa de ortofoto de máxima actualidad del WMS de IDENA.
  @property IDENA_DYNORTHOPHOTO
  @type string
  @final
 */
/**
  Identificador de la capa de ortofoto 2014 del WMS de IDENA.
  @property IDENA_DYNORTHOPHOTO2014
  @type string
  @final
 */
/**
  Identificador de la capa de ortofoto 2012 del WMS de IDENA.
  @property IDENA_DYNORTHOPHOTO2012
  @type string
  @final
 */
/**
  Identificador de la capa de OpenStreetMap a través del WMTS de la API SITNA.
  @property OSM
  @type string
  @final
 */
/**
  Identificador de la capa de Carto Voyager a través del WMTS de la API SITNA.
  @property CARTO_VOYAGER
  @type string
  @final
 */
/**
  Identificador de la capa de Carto Light a través del WMTS de la API SITNA.
  @property CARTO_LIGHT
  @type string
  @final
 */
/**
  Identificador de la capa de Carto Dark a través del WMTS de la API SITNA.
  @property CARTO_DARK
  @type string
  @final
 */
/**
  Identificador de la capa de Mapbox Streets a través del WMTS de la API SITNA.
  @property MAPBOX_STREETS
  @type string
  @final
 */
/**
  Identificador de la capa de Mapbox Satellite a través del WMTS de la API SITNA.
  @property MAPBOX_SATELLITE
  @type string
  @final
 */
/**
  Identificador de una capa en blanco.
  @property BLANK
  @type string
  @final
 */

/**
  Colección de tipos MIME de utilidad.
  
No se deberían modificar las propiedades de esta clase.
  @class SITNA.consts.MimeType
  @static
 */
/**
  Tipo MIME de imagen PNG (`image/png`).
  @property PNG
  @type string
  @final
 */
/**
  Tipo MIME de imagen JPEG (`image/jpeg`).
  @property JPEG
  @type string
  @final
 */
/**
  Tipo MIME de documento GeoJSON (`application/vnd.geo+json`).
  @property GEOJSON
  @type string
  @final
 */
/**
  Tipo MIME de documento KML (`application/vnd.google-earth.kml+xml`).
  @property KML
  @type string
  @final
 */
/**
  Tipo MIME de documento GML (`application/gml+xml`).
  @property GML
  @type string
  @final
 */
/**
  Tipo MIME de documento GPX (`application/gpx+xml`).
  @property GPX
  @type string
  @final
 */

/*
  Colección de tipos de filtros.
  
No se deberían modificar las propiedades de este objeto.
  @class SITNA.consts.MapSearchType
  @static
 */
/*
  Identificador de filtro de consulta de tipo municipio.
  @property MUNICIPALITY
  @type string
  @final
 */
/*
  Identificador de filtro de consulta de tipo concejo.
  @property COUNCIL
  @type string
  @final
 */
/*
  Identificador de filtro de consulta de tipo casco urbano.
  @property URBAN
  @type string
  @final
 */
/*
  Identificador de filtro de consulta de tipo mancomunidad.
  @property COMMONWEALTH
  @type string
  @final
 */
/*
  Identificador de filtro de consulta de tipo genérico.
  @property GENERIC
  @type string
  @final
 */

/**
Un objeto {{#crossLink "SITNA.Cfg"}}{{/crossLink}} está accesible para todas las instancias del la clase {{#crossLink "SITNA.Map"}}{{/crossLink}}.

Por tanto, se puede configurar un mapa asignando valores a las propiedades de ese objeto:
  #### Ejemplo:

```javascript
SITNA.Cfg.crs = "EPSG:4326";
SITNA.Cfg.initialExtent = [
  -2.84820556640625,
  41.78912492257675,
  -0.32135009765625,
  43.55789822064767
];
var map = new SITNA.Map("mapa");
```
@module 2. Configuración
@submodule 2.3. Objeto de configuración global
 */


/**
  Configuración general de la API. Cualquier llamada a un método o un constructor de la API sin parámetro de opciones toma las opciones de esta clase. 
  Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
  (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones). 

La clase es estática. 
  @class SITNA.Cfg
  @static
 */
SITNA.Cfg = TC.Cfg;
/**
  URL del proxy utilizado para peticiones a dominios remotos. 
  
Debido a restricciones de seguridad implementadas en Javascript, a través de `XMLHttpRequest` no es posible obtener información de dominios distintos al de la página web. 

  Hay dos maneras de solventar esta restricción. La primera es que el servidor remoto permita el acceso entre dominios estableciendo la cabecera `Access-Control-Allow-Origin` a 
  la respuesta HTTP. Dado que esta solución la implementan terceras personas (los administradores del dominio remoto), no siempre es aplicable. 

  La segunda solución es desplegar en el dominio propio un proxy. Un proxy es un servicio que recibe peticiones HTTP y las redirige a otra URL. 

  Si la propiedad `proxy` está establecida, todas las peticiones a dominios remotos las mandará al proxy para que este las redirija. De esta manera no infringimos las reglas de
  seguridad de Javascript, dado que el proxy está alojado en el dominio propio. 
 #### Ejemplo:

  ```javascript
    SITNA.Cfg.proxy = ""; // Las peticiones a http://www.otrodominio.com se hacen directamente
 
    SITNA.Cfg.proxy = "/cgi-bin/proxy.cgi?url="; // Las peticiones a http://www.otrodominio.com se convierten en peticiones a /cgi-bin/proxy.cgi?url=http://www.otrodominio.com
  ```
  @property proxy
  @type string
  @default ""  
 */
/**
  Código EPSG del sistema de referencia espacial del mapa. 

  Puede consultar el ejemplo [online](../../examples/Cfg.crs.html). 
#### Ejemplo:
```javascript
    <div id="mapa"></div>
    <script>
      // SITNA.Cfg.baseLayers[0] (capa por defecto) no es compatible con WGS 84, lo cambiamos por SITNA.Consts.layer.IDENA_DYNBASEMAP.
      SITNA.Cfg.baseLayers[0] = SITNA.Consts.layer.IDENA_DYNBASEMAP;
      SITNA.Cfg.defaultBaseLayer = SITNA.Consts.layer.IDENA_DYNBASEMAP;
  
      // WGS 84
      SITNA.Cfg.crs = "EPSG:4326";
      // Coordenadas en grados decimales, porque el sistema de referencia espacial es WGS 84.
      SITNA.Cfg.initialExtent = [-2.848205, 41.789124, -0.321350, 43.557898];
      SITNA.Cfg.maxExtent = [-2.848205, 41.789124, -0.321350, 43.557898];
  
      var map = new SITNA.Map("mapa", {
        // SITNA.Cfg.baseLayers[0] (capa por defecto) no es compatible con WGS 84, establecer la capa SITNA.Consts.layer.IDENA_DYNBASEMAP en el control de mapa de situación.
        controls: {
          overviewMap: {
            layer: SITNA.Consts.layer.IDENA_DYNBASEMAP
          }
        }
      });
    </script>
 ```
  @property crs
  @type string
  @default "EPSG:25830"  
 */
/**
  Extensión inicial del mapa definida por x mínima, y mínima, x máxima, y máxima. Estos valores deben estar en las unidades definidas por 
  el sistema de referencia espacial del mapa. Por defecto la extensión es la de Navarra.
  @property initialExtent
  @type array
  @default [541084.221, 4640788.225, 685574.4632, 4796618.764]
 */
/**
  Extensión máxima del mapa definida por x mínima, y mínima, x máxima, y máxima, de forma que el centro del mapa nunca saldrá fuera de estos límites.
  Estos valores deben estar en las unidades definidas por el sistema de referencia espacial del mapa.

  Si en vez de un array el valor es `false`, el mapa no tiene limitada la extensión máxima.
  @property maxExtent
  @type array|boolean
  @default false
 */
/**
  Si se establece a `true`, la rueda de scroll del ratón se puede utilizar para hacer zoom en el mapa. 
  @property mouseWheelZoom
  @type boolean
  @default true
 */
/**
  Tolerancia en pixels a las consultas de información de capa. 
  
En ciertas capas, por ejemplo las que representan geometrías de puntos, puede ser difícil pulsar precisamente en el punto donde está la entidad geográfica que interesa.

  La propiedad `pixelTolerance` define un área de un número de pixels hacia cada lado del punto de pulsación, de forma que toda entidad geográfica que se interseque con ese área se incluye en el resultado de la consulta. 

  Por ejemplo, si el valor establecido es 10, toda entidad geográfica que esté dentro de un cuadrado de 21 pixels de lado (10 pixels por cuadrante más el pixel central) centrado en el punto de pulsación 
  se mostrará en el resultado. 
  <em>A tener en cuenta:</em> Esta propiedad establece el valor de los llamados "parámetros de vendedor" que los servidores de mapas admiten para modificar el comportamiento de las peticiones
  `getFeatureInfo` del standard WMS. Pero este comportamiento puede ser modificado también por otras circunstancias, como los estilos aplicados a las capas en el servidor. 
  
Como estas circunstancias están fuera del ámbito de alcance de esta API, es posible que los resultados obtenidos desde algún servicio WMS sean inesperados en lo referente a `pixelTolerance`. 
  @property pixelTolerance
  @type number
  @default 10
 */
/**
  Lista de objetos de definición de capa (instancias de la clase {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}}) para incluir dichas capas como mapas de fondo. 

  Puede consultar el ejemplo [online](../../examples/Cfg.baseLayers.html). 
  #### Ejemplo:
    ```javascript
        <div id="mapa"></div>
        <script>
          // Establecer un proxy porque se hacen peticiones a otro dominio.
          SITNA.Cfg.proxy = "proxy.ashx?";
  
          // Añadir PNOA y establecerla como mapa de fondo por defecto.
          SITNA.Cfg.baseLayers.push({
            id: "PNOA",
            url: "http://www.ign.es/wms-inspire/pnoa-ma",
            layerNames: "OI.OrthoimageCoverage",
            isBase: true
          });
          SITNA.Cfg.defaultBaseLayer = "PNOA";
  
          var map = new SITNA.Map("mapa");
        </script>
  ```
  @property baseLayers
  @type array
  @default La lista incluye las siguientes capas de IDENA: Ortofoto 2014 (capa por defecto), Mapa base, Catastro, Cartografía topográfica.
  
 */
/**
  Identificador de la capa base por defecto o índice de la capa base por defecto en la lista de capas base del mapa (Consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/baseLayers:property"}}{{/crossLink}}).
  @property defaultBaseLayer
  @type string|number
  @default SITNA.consts.Layer.IDENA_ORTHOPHOTO
 */
/**
  Lista de objetos de definición de capa (instancias de la clase {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}}) para incluir dichas capas como contenido del mapa. 

  Puede consultar el ejemplo [online](../../examples/Cfg.workLayers.html). 
    #### Ejemplo:
  ```javascript
    <div id="mapa"></div>
    <script>
      // Establecer un proxy porque se hacen peticiones a otro dominio.
      SITNA.Cfg.proxy = "proxy.ashx?";

      SITNA.Cfg.workLayers = [{
        id: "csantiago",
        title: "Camino de Santiago",
        url: "http://www.ign.es/wms-inspire/camino-santiago",
        layerNames: "PS.ProtectedSite,GN.GeographicalNames,AU.AdministrativeUnit"
      }];
      var map = new SITNA.Map("mapa");
    </script>
  ```
  @property workLayers
  @type array
  @default []  
 */
/**
  Opciones de controles de mapa.
  @property controls
  @type SITNA.cfg.MapControlOptions
  @default Se incluyen controles de indicador de espera de carga, atribución, indicador de coordenadas.
 */
/**
URL de la carpeta de maquetación. Para prescindir de maquetación, establecer esta propiedad a `null`.

Puede consultar el ejemplo [online](../../examples/Cfg.layout.html). 

Sus archivos de maquetación son
[markup.html](../../examples/layout/example/markup.html), [config.json](../../examples/layout/example/config.json),
[style.css](../../examples/layout/example/style.css), [resources/es-ES.json](../../examples/layout/example/resources/es-ES.json),
[resources/eu-ES.json](../../examples/layout/example/resources/eu-ES.json) y [resources/en-US.json](../../examples/layout/example/resources/en-US.json).

Para saber cómo utilizar maquetaciones, consulte la sección {{#crossLinkModule "2.2. Maquetación"}}{{/crossLinkModule}}.

#### Ejemplo:
```javascript
  <!-- layout/example/markup.html -->
   <div id="controls">
     <h1>{{stJamesWayInNavarre}}</h1>
     <div id="toc" />
     <div id="legend" />
   </div>
  <div id="languages">
    <a class="lang" href="?lang=es-ES" title="{{spanish}}">ES</a>
    <a class="lang" href="?lang=eu-ES" title="{{basque}}">EU</a>
    <a class="lang" href="?lang=en-US" title="{{english}}">EN</a>
  </div>
```
```javascript
  resources/es-ES.json
  {
    "stJamesWayInNavarre": "Camino de Santiago en Navarra",
    "spanish": "castellano",
    "basque": "euskera",
    "english": "inglés"
  }
```
```javascript
  resources/eu-ES.json
  {
    "stJamesWayInNavarre": "Nafarroan Donejakue bidea",
    "spanish": "gaztelania",
    "basque": "euskara",
    "english": "ingelesa"
  }
```
```javascript
  resources/en-US.json
  {
    "stJamesWayInNavarre": "St. James' Way in Navarre",
    "spanish": "spanish",
    "basque": "basque",
    "english": "english"
  }
```
```javascript
  <div id="mapa"></div>
  <script>
    // Obtener el idioma de interfaz de usuario
    var selectedLocale = location.search.substr(location.search.indexOf("?lang=") + 6) || "es-ES";
    // Establecer un proxy porque se hacen peticiones a otro dominio.
    SITNA.Cfg.proxy = "proxy.ashx?";

    SITNA.Cfg.layout = "layout/example";
    var map = new SITNA.Map("mapa", {
      locale: selectedLocale
    });
  </script>
```


@property layout
@type string
@default "//sitna.tracasa.es/api/tc/layout/responsive"
 */
SITNA.Cfg.layout = TC.apiLocation + 'TC/layout/responsive';
/**
  Opciones de estilo de entidades geográficas.
  @property styles
  @type SITNA.cfg.StyleOptions
 */

/**
  Opciones de capa.
  
Esta clase no tiene constructor.
  @class SITNA.cfg.LayerOptions
  @static
 */
/**
  Identificador único de capa.
  @property id
  @type string
 */
/**
  Título de capa. Este valor se mostrará en la tabla de contenidos y la leyenda.
  @property title
  @type string|undefined
 */
/**
  Tipo de capa. Si no se especifica se considera que la capa es WMS. La lista de valores posibles está definida en {{#crossLink "SITNA.consts.LayerType"}}{{/crossLink}}.
  @property type
  @type string|undefined
 */
/**
  URL del servicio OGC o del archivo de datos geográficos que define la capa. Propiedad obligatoria en capas de tipo
  {{#crossLink "SITNA.consts.LayerType/WMS:property"}}{{/crossLink}}, {{#crossLink "SITNA.consts.LayerType/WMTS:property"}}{{/crossLink}},
  {{#crossLink "SITNA.consts.LayerType/WFS:property"}}{{/crossLink}} y {{#crossLink "SITNA.consts.LayerType/KML:property"}}{{/crossLink}}. 
  
En las capas de tipo VECTOR los archivos de datos geográficos soportados son KML, GeoJSON, GPX, GML, WKT y TopoJSON.

  El formato se deduce de la extensión del nombre de archivo, pero también se puede especificar utilizando la propiedad {{#crossLink "SITNA.cfg.LayerOptions/format:property"}}{{/crossLink}}. 
  
  Puede consultar el ejemplo [online](../../examples/cfg.LayerOptions.url.html). 
#### Ejemplo:
```javascript
    <div id="mapa"></div>
    <script>
      // Establecemos un layout simplificado apto para hacer demostraciones de controles.
      SITNA.Cfg.layout = "layout/ctl-container";
      // Añadimos el control de tabla de contenidos en la primera posición.
      SITNA.Cfg.controls.TOC = {
        div: "slot1"
      };
      // Añadimos una capa raster desde un servicio WMS y cuatro capas vectoriales
      // a partir de archivos geográficos: GeoJSON, GPX, KML y GML.
      SITNA.Cfg.workLayers = [
        {
          id: "wms",
          title: "Camino de Santiago",
          type: SITNA.Consts.layerType.WMS,
          url: "//idena.navarra.es/ogc/wms",
          layerNames: "IDENA:PATRIM_Lin_CaminoSantR",
          format: SITNA.Consts.mimeType.PNG
        },
        {
          id: "geojson",
          type: SITNA.Consts.layerType.VECTOR,
          url: "data/PARQUESNATURALES.json",
          format: SITNA.Consts.mimeType.GEOJSON
        },
        {
          id: "gpx",
          type: SITNA.Consts.layerType.VECTOR,
          url: "data/CAMINOFRANCES.gpx"
        },
        {
          id: "kml",
          type: SITNA.Consts.layerType.VECTOR,
          url: "data/MUSEOSNAVARRA.kml"
        },
        {
          id: "gml",
          type: SITNA.Consts.layerType.VECTOR,
          url: "data/ESTACIONESTREN.gml"
        },
      ];
      var map = new SITNA.Map("mapa");
    </script>
```
  @property url
  @type string|undefined  
 */
/**
  Lista separada por comas de los nombres de capa del servicio OGC.
  @property layerNames
  @type string|undefined
 */
/**
  Nombre de grupo de matrices del servicio WMTS. Propiedad obligatoria para capas de tipo WMTS.
  @property matrixSet
  @type string|undefined
 */
/**
  En las capas de tipo {{#crossLink "SITNA.consts.LayerType/WMS:property"}}{{/crossLink}} y {{#crossLink "SITNA.consts.LayerType/WMTS:property"}}{{/crossLink}},
  es el tipo MIME del formato de archivo de imagen a obtener del servicio. En las capas de tipo {{#crossLink "SITNA.consts.LayerType/VECTOR:property"}}{{/crossLink}},
  es el tipo MIME del formato de archivo de datos geográficos que queremos cargar (GeoJSON, KML, etc.). 
  
Si esta propiedad no está definida, si la capa es un mapa de fondo (consultar propiedad {{#crossLink "SITNA.cfg.LayerOptions/isBase:property"}}{{/crossLink}}),
  se asume que el formato es `"image/jpeg"`, en caso contrario se asume que el formato es `"image/png"`. 
  @property format
  @type SITNA.consts.MimeType|undefined
 */
/**
  Si se establece a `true`, la capa se muestra por defecto si forma parte de los mapas de fondo.
  @property isDefault
  @type boolean|undefined
  @deprecated En lugar de esta propiedad es recomendable usar SITNA.Cfg.defaultBaseLayer.
 */
/**
  Si se establece a `true`, la capa es un mapa de fondo.
  @property isBase
  @type boolean|undefined
 */
/**
  Aplicable a capas de tipo WMS y KML. Si se establece a `true`, la capa no muestra la jerarquía de grupos de capas en la tabla de contenidos ni en la leyenda.
  @property hideTree
  @type boolean|undefined
 */
/**
  Si se establece a `true`, la capa no aparece en la tabla de contenidos ni en la leyenda. De este modo se puede añadir una superposición de capas de trabajo que el usuario la perciba como parte del mapa de fondo.
  @property stealth
  @type boolean|undefined
 */
/**
  URL de una imagen en miniatura a mostrar en el selector de mapas de fondo.
  @property thumbnail
  @type string|undefined
 */
/**
  La capa agrupa sus entidades puntuales cercanas entre sí en grupos (clusters). Aplicable a capas de tipo VECTOR, WFS y KML. 

  Puede consultar el ejemplo [online](../../examples/cfg.LayerOptions.cluster.html). 
#### Ejemplo:
```javascript
    <div id="mapa"></div>
    <script>
      // Creamos un mapa con una capa de puntos de un KML,
      // clustering activado a 50 pixels y transiciones animadas.
      var map = new SITNA.Map("mapa", {
        workLayers: [
         {
           id: "cluster",
           type: SITNA.Consts.layerType.KML,
           url: "data/PromocionesViviendas.kml",
           title: 'Clusters',
           cluster: {
             distance: 50,
             animate: true
           }
         }
       ]
      });
    </script>
```
  @property cluster
  @type SITNA.cfg.ClusterOptions|undefined  
 */
///**
//  Propiedad que establece si deseamos que el título de la capa se oculte cuando esté cargada como capa de trabajo. La utilizan controles como
//  {{#crossLink "SITNA.cfg.MapControlOptions/layerCatalog:property"}}{{/crossLink}} para componer los elementos que la representan.
//  @property hideTitle
//  @type boolean|undefined
// */

/**
  Opciones de clustering de puntos de una capa, define si los puntos se tienen que agrupar cuando están más cerca entre sí que un valor umbral.
  
Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
  (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones). 
  
Esta clase no tiene constructor. 
  @class SITNA.cfg.ClusterOptions
  @static
 */
/**
  Distancia en píxels que tienen que tener como máximo los puntos entre sí para que se agrupen en un cluster.
  @property distance
  @type number
 */
/**
  Si se establece a `true`, los puntos se agrupan y desagrupan con una transición animada.
  @property animate
  @type boolean|undefined
 */
/**
  Opciones de estilo de los clusters.
  @property styles
  @type SITNA.cfg.ClusterStyleOptions|undefined
 */

/**
  Opciones de controles de mapa, define qué controles se incluyen en un mapa y qué opciones se pasan a cada control.
  
Las propiedades de esta clase son de tipo boolean, en cuyo caso define la existencia o no del control asociado, o una instancia de la clase {{#crossLink "SITNA.cfg.ControlOptions"}}{{/crossLink}}.

  Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
  (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones). 
  
Esta clase no tiene constructor. 
  @class SITNA.cfg.MapControlOptions
  @static
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene un indicador de espera de carga.
  @property loadingIndicator
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default true
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene una barra de navegación con control de zoom.
  @property navBar
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene una barra de escala.
  @property scaleBar
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene un indicador numérico de escala.
  @property scale
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene un selector numérico de escala.
  @property scaleSelector
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene un mapa de situación.
  @property overviewMap
  @type boolean|SITNA.cfg.OverviewMapOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene un selector de mapas de fondo.
  @property basemapSelector
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene atribución. La atribución es un texto superpuesto al mapa que actúa como reconocimiento de la procedencia de los datos que se muestran.
  @property attribution
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default true
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene una tabla de contenidos mostrando las capas de trabajo y los grupos de marcadores.
.* Los controles TOC y {{#crossLink "SITNA.cfg.MapControlOptions/workLayerManager:property"}}{{/crossLink}} realizan varias funciones comunes, así
  rara vez será necesario tener los dos a la vez en un visor. 
  @property TOC
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene un indicador de coordenadas y de sistema de referencia espacial.
  @property coordinates
  @type boolean|SITNA.cfg.CoordinatesOptions|undefined
  @default true
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene leyenda.
  @property legend
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa muestra los datos asociados a los marcadores cuando se pulsa sobre ellos.
  @property popup
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene un buscador. El buscador localiza coordenadas y busca entidades geográficas tales como: municipios, cascos urbanos, vías, portales y parcelas catastrales de IDENA. Es posible establecer un origen de datos distinto a IDENA en el que buscar, consultar la sección: {{#crossLinkModule "2.3.1. Objeto de configuración de opciones del buscador"}}{{/crossLinkModule}} 
  @property search
  @type boolean|SITNA.cfg.SearchOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene un medidor de longitudes, áreas y perímetros.
  @property measure
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa tiene un control que gestiona los clics del usuario en ellos. 
  @property click
  @type boolean|SITNA.cfg.ClickOptions|undefined
  @default false
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa puede abrir una ventana de Google StreetView. 
  @property streetView
  @type boolean|SITNA.cfg.StreetViewOptions|undefined
  @default true
 */
/**
  Si se establece a un valor <em>truthy</em>, el mapa responde a los clics con un información de las capas cargadas de tipo WMS. Se usa para ello la petición `getFeatureInfo` del standard WMS.

  Puede consultar el ejemplo [online](../../examples/cfg.MapControlOptions.featureInfo.html).
#### Ejemplo:
```javascript
    <div id="mapa"></div>
    <script>
      // Activamos el proxy para poder acceder a servicios de otro dominio.
      SITNA.Cfg.proxy = "proxy.ashx?";
      // Añadimos el control featureInfo.
      SITNA.Cfg.controls.featureInfo = true;
      // Añadimos una capa WMS sobre la que hacer las consultas.
      SITNA.Cfg.workLayers = [
        {
          id: "ocupacionSuelo",
          title: "Ocupación del suelo",
          type: SITNA.Consts.layerType.WMS,
          url: "http://www.ign.es/wms-inspire/ocupacion-suelo",
          layerNames: ["LC.LandCoverSurfaces"]
        }
      ];
      var map = new SITNA.Map("mapa");
    </script>
```
  @property featureInfo
  @type boolean|SITNA.cfg.ClickOptions|undefined
  @default true  
 */
/**
  Si se establece a un valor <em>truthy</em>, se muestra una herramienta para imprimir el mapa en PDF. 
  
El control permite al usuario elegir entre varios tamaños de hoja y orientación horizontal o vertical, además se le puede poner un título al documento de impresión. 

  Al pulsar el botón de imprimir se abre una previsualización como paso previo a la impresión. Ahí el usuario puede realizar unos últimos ajustes a la extensión del mapa.

  El PDF se generará al pulsar en el botón dentro de la previsualización. 

  Puede consultar el ejemplo [online](../../examples/cfg.MapControlOptions.printMap.html). 
#### Ejemplo:
```javascript
    <div id="mapa"></div>
    <script>
      // Establecemos un layout simplificado apto para hacer demostraciones de controles.
      SITNA.Cfg.layout = "layout/ctl-container";
      // Añadimos el control de impresión en el primer contenedor.
      SITNA.Cfg.controls.printMap = {
        div: "slot1"
      };
      var map = new SITNA.Map("mapa");
    </script>
```
  @property printMap
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false
  
 */
/**
  Si se establece a un valor <em>truthy</em>, se muestra un control para consultar y gestionar las capas de trabajo que están cargadas en el mapa. Con este control
  se dispone de las siguientes funcionalidades: 
  <ul>
    <li>Consultar qué capas están cargadas en el mapa</li>
    <li>Ver en qué orden están superpuestas y modificar ese orden</li>
    <li>Comprobar si una capa es visible al nivel de zoom actual</li>
    <li>Activar y desactivar la visibilidad de las capas</li>
    <li>Establecer el grado de transparencia de cada capa</li>
    <li>Borrar capas cargadas</li>
    <li>Consultar metadatos asociados a la capa</li>
  </ul>
  
Los controles workLayerManager y {{#crossLink "SITNA.cfg.MapControlOptions/TOC:property"}}{{/crossLink}} realizan varias funciones comunes, así
  rara vez será necesario tener los dos a la vez en un visor. 

  Puede consultar el ejemplo [online](../../examples/cfg.MapControlOptions.layerCatalog_workLayerManager.html). 
#### Ejemplo:
````javascript
    <div id="mapa"></div>
    <script>
      // Establecemos un layout simplificado apto para hacer demostraciones de controles.
      SITNA.Cfg.layout = "layout/ctl-container";
      // Añadimos el control de capas cargadas en la primera posición.
      SITNA.Cfg.controls.workLayerManager = {
        div: "slot1"
      };
      // Añadimos en la segunda posición el catálogo de capas con dos servicios.
      SITNA.Cfg.controls.layerCatalog = {
        div: "slot2",
        enableSearch: true,
        layers: [
          {
            id: "idena",
            title: "IDENA",
            hideTitle: true,
            type: SITNA.Consts.layerType.WMS,
            url: "//idena.navarra.es/ogc/wms",
            hideTree: false
          },
          {
            id: "sismica",
            title: "Información sísmica y volcánica",
            type: SITNA.Consts.layerType.WMS,
            url: "//www.ign.es/wms-inspire/geofisica",
            layerNames: ["Ultimos10dias", "Ultimos30dias", "Ultimos365dias"],
            hideTree: false
          }
        ]
      };
      var map = new SITNA.Map("mapa");
    </script>
```
  @property workLayerManager
  @type boolean|SITNA.cfg.ControlOptions|undefined
  @default false  
 */
/**
  Si se establece a un valor <em>truthy</em>, se muestra un control para añadir datos externos, en concreto servicios WMS y archivos locales de datos geográficos. 

  Se pueden añadir WMS escribiendo la dirección del servicio o eligiendo un servicio de la lista de sugerencias de servicios de interés. 

  Se pueden añadir datos de archivos buscándolos en el cuadro de diálogo que se abre tras pulsar “Abrir archivo” o arrastrándolos y soltándolos dentro del área del mapa. 

  Puede consultar el ejemplo [online](../../examples/cfg.DataLoaderOptions.html). 
#### Ejemplo:
```javascript
    <div id="mapa"></div>
    <script>
      // Establecemos un layout simplificado apto para hacer demostraciones de controles.
      SITNA.Cfg.layout = "layout/ctl-container";
      // Activamos el proxy para poder acceder a servicios de otro dominio.
      SITNA.Cfg.proxy = "proxy.ashx?";
      // Añadimos el control de tabla de contenidos en el primer contenedor.
      SITNA.Cfg.controls.TOC = {
        div: "slot1"
      };
      // Añadimos el control de datos externos en el segundo contenedor.
      SITNA.Cfg.controls.dataLoader = {
        div: "slot2",
        enableDragAndDrop: true,
        wmsSuggestions: [
          {
            group: "Estatales",
            items: [
              {
                name: "Mapa Base (IGN)",
                url: "https://www.ign.es/wms-inspire/ign-base"
              },
              {
                name: "Unidades Administrativas (IGN)",
                url: "https://www.ign.es/wms-inspire/unidades-administrativas"
              },
              {
                name: "Cartografía Topográfica (IGN)",
                url: "https://www.ign.es/wms-inspire/mapa-raster"
              },
              {
                name: "Ortofotos PNOA Máxima Actualidad (IGN)",
                url: "https://www.ign.es/wms-inspire/pnoa-ma"
              }
            ]
          },
          {
            group: "Comunidades limítrofes",
            items: [
              {
                name: "Aragón",
                url: "http://idearagon.aragon.es/Visor2D"
              },
              {
                name: "La Rioja",
                url: "https://ogc.larioja.org/wms/request.php"
              },
              {
                name: "País Vasco",
                url: "http://www.geo.euskadi.eus/WMS_KARTOGRAFIA"
              }
            ]
          }
        ]
      };
      var map = new SITNA.Map("mapa");
    </script>
```
  @property dataLoader
  @type boolean|SITNA.cfg.DataLoaderOptions|undefined
  @default false
  
 */
/**
  Si se establece a un valor <em>truthy</em>, se muestra un control para añadir capas de trabajo desde uno o varios servicios WMS. Con este control
  se dispone de las siguientes funcionalidades: 
  <ul>
    <li>Consultar las capas disponibles en uno o varios WMS.</li>
    <li>Buscar capas mediante texto libre. Se busca el texto en los títulos y los resúmenes descriptivos de cada capa, que se publican en el
    [documento de capacidades](https://github.com/7o9/implementer-friendly-standards/blob/master/introduction.rst#getcapabilities") del servicio.</li>
    <li>Añadir capas al mapa como capas de trabajo.</li>
  </ul>

  Puede consultar el ejemplo [online](../../examples/cfg.MapControlOptions.layerCatalog_workLayerManager.html). 
#### Ejemplo:
```javascript
    <div id="mapa"></div>
    <script>
      // Establecemos un layout simplificado apto para hacer demostraciones de controles.
      SITNA.Cfg.layout = "layout/ctl-container";
      // Añadimos el control de capas cargadas en la primera posición.
      SITNA.Cfg.controls.workLayerManager = {
        div: "slot1"
      };
      // Añadimos en la segunda posición el catálogo de capas con dos servicios.
      SITNA.Cfg.controls.layerCatalog = {
        div: "slot2",
        enableSearch: true,
        layers: [
          {
            id: "idena",
            title: "IDENA",
            hideTitle: true,
            type: SITNA.Consts.layerType.WMS,
            url: "//idena.navarra.es/ogc/wms",
            hideTree: false
          },
          {
            id: "sismica",
            title: "Información sísmica y volcánica",
            type: SITNA.Consts.layerType.WMS,
            url: "//www.ign.es/wms-inspire/geofisica",
            layerNames: ["Ultimos10dias", "Ultimos30dias", "Ultimos365dias"],
            hideTree: false
          }
        ]
      };
      var map = new SITNA.Map("mapa");
    </script>
```
  @property layerCatalog
  @type boolean|SITNA.cfg.LayerCatalogOptions|undefined
  @default false  
 */

/**
  Opciones de control.
  Esta clase no tiene constructor.
  @class SITNA.cfg.ControlOptions
  @static
 */
/**
  Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  @property div
  @type HTMLElement|string|undefined
 */

/**
  Opciones de control de mapa de situación.
  Esta clase no tiene constructor.
  @class SITNA.cfg.OverviewMapOptions
  @extends SITNA.cfg.ControlOptions
  @static
 */
/**
  Identificador de capa para usar como mapa de fondo u objeto de opciones de capa. 
  @property layer
  @type string|SITNA.cfg.LayerOptions
 */

/**
  Opciones de control de coordenadas.
  Esta clase no tiene constructor. 

  Puede consultar el ejemplo [online](../../examples/cfg.CoordinatesOptions.html). 
  @class SITNA.cfg.CoordinatesOptions
  @extends SITNA.cfg.ControlOptions
  @static
 */
/**
  Determina si se muestran coordenadas geográficas (en EPSG:4326) además de las del mapa, que por defecto son UTM (EPSG:25830). 
#### Ejemplo:
```javascript
    <div id="mapa"/>
    <script>
     // Hacemos que el control que muestra las coordenadas en pantalla
     // muestre también las coordenadas geográficas
     SITNA.Cfg.controls.coordinates = {
       showGeo: true
     };
     var map = new SITNA.Map('map');
    </script>
```
  @property showGeo
  @type boolean|undefined  
 */

/**
  Opciones de control de clic.
  
Esta clase no tiene constructor.

  Estas opciones se utilizan si se desea tener un control en el mapa que reaccione a los clic del ratón o los toques en el mapa. 

  Puede consultar el ejemplo [online](../../examples/cfg.ClickOptions.html). 
  @class SITNA.cfg.ClickOptions
  @extends SITNA.cfg.ControlOptions
  @static
 */
/**
  Si se establece a `true`, el control asociado está activo, es decir, responde a los clics hechos en el mapa desde que se carga.
  @property active
  @type boolean|undefined
 */
/**
  Función de callback que gestiona la respuesta al clic. Es válida cualquier función que acepta un parámetro de coordenada, que es un array de dos números.
#### Ejemplo:
```javascript
    <div id="mapa"/>
    <script>
     // Creamos un mapa con el control de gestión de clics, con una función de callback personalizada
     var map = new SITNA.Map("mapa", {
       controls: {
         click: {
           active: true,
           callback: function (coord) {
             alert("Has pulsado en la posición " + coord[0] + ", " + coord[1]);
           }
         }
       }
     });
    </script>
```  
@property callback
  @type function|undefined
  @default Una función que escribe en consola las coordenadas pulsadas  
 */

/**
  Opciones de control de Google StreetView.
  
Esta clase no tiene constructor.

  Para incrustar StreetView en el visor se utiliza la versión 3 de la API de Google Maps. Esta se carga automáticamente al instanciar el control. 

  Puede consultar el ejemplo [online](../../examples/cfg.StreetViewOptions.html). 
  @class SITNA.cfg.StreetViewOptions
  @extends SITNA.cfg.ControlOptions
  @static
 */
/**
  Elemento del DOM en el que mostrar la vista de StreetView o valor de atributo id de dicho elemento.
#### Ejemplo:
```javascript
    <div id="mapa"/>
    <div id="sv"/>
    <script>
      // Creamos un mapa con el control de StreetView.
      // La vista de StreetView se debe dibujar en el elemento con identificador "sv".
      // Se utilizará la clave de Google Maps para IDENA.
      var map = new SITNA.Map("mapa", {
        controls: {
          streetView: {
            viewDiv: "sv",
            googleMapsKey: "AIzaSyDXDQza0kXXHNHqq0UqNWulbYmGZmPY6TM"
          }
        }
      });
    </script>
```
  @property viewDiv
  @type HTMLElement|string|undefined
  
 */
/**
  El control de StreetView hace uso de la API de Google Maps para funcionar. Esta propiedad establece la clave de uso asociada al sitio
  donde está alojada la aplicación que usa la API SITNA. No es necesaria para hacer funcionar el control pero es recomendable obtener una para garantizar el servicio por parte de Google. 
  
Puede obtener más información en el [sitio para desarrolladores de Google](https://developers.google.com/maps/documentation/javascript/get-api-key">).
  @property googleMapsKey
  @type string|undefined
 */

/**
  Opciones de control de búsquedas.
  Esta clase no tiene constructor.

  Puede consultar el ejemplo [online](../../examples/cfg.SearchOptions.html). 
#### Ejemplo:
  ```javascript
      <div id="mapa"/> 
        <script>
          // Creamos un mapa con el control de búsquedas. 
          // Configuramos el buscador desactivando la búsqueda de parcelas y la localización de coordenadas.
          // Indicamos un placeHolder y tooltip (propiedad "instructions") acorde con las búsquedas configuradas.
          var map = new SITNA.Map("mapa", {
            controls: {
              search: { 
                coordinates: false,
                cadastralParcel: false,
                municipality: false,
                town: true,
                street: true,
                postalAddress: true,
                placeHolder: "Municipio, casco urbano, calle o portal",
                instructions: "Buscar municipio, casco urbano, calle o portal"
              }
            }
          });
        </script> 
  ```
  @class SITNA.cfg.SearchOptions
  @extends SITNA.cfg.ControlOptions
  @static 
 */
/**
  Esta propiedad establece el atributo "placeHolder" del cajetín del buscador del mapa. 
  @property placeHolder
  @type string
  @default Municipio, casco urbano, calle, dirección… 
 */
/**
  Esta propiedad establece el atributo "title" del cajetín y del botón del buscador del mapa. 
  @property instructions
  @type string
  @default Buscar municipio, casco urbano, calle, dirección, referencia catastral, coordenadas UTM o latitud-longitud
 */
/**
  Esta propiedad activa/desactiva la localización de coordenadas en Sistema de Referencia ETRS89, bien UTM Huso 30 Norte (EPSG:25830) o latitud-longitud (EPSG:4258, EPSG:4326 o CRS:84) en el buscador del mapa. 
  @property coordinates
  @type boolean
  @default true
 */
/**
  Esta propiedad activa/desactiva la búsqueda de municipios en el buscador del mapa. 
  
Para configurar un origen de datos distinto a IDENA, establecer como valor una instancia de {{#crossLink "SITNA.cfg.SearchMunicipalitySource"}}{{/crossLink}}. 
  @property municipality
  @type boolean|SITNA.cfg.SearchMunicipalitySource
  @default true
 */

/**
  Esta propiedad activa/desactiva la búsqueda de cascos urbanos en el buscador del mapa. 
  
Para configurar un origen de datos distinto a IDENA, establecer como valor una instancia de {{#crossLink "SITNA.cfg.SearchTownSource"}}{{/crossLink}}. 
  @property town
  @type boolean|SITNA.cfg.SearchTownSource
  @default true 
    
 */

/**
  Esta propiedad activa/desactiva la búsqueda de vías en el buscador del mapa. Formato: entidad de población, vía 
  
Para configurar un origen de datos distinto a IDENA, establecer como valor una instancia de {{#crossLink "SITNA.cfg.SearchStreetSource"}}{{/crossLink}}. 
  @property street
  @type boolean|SITNA.cfg.SearchStreetSource
  @default true
 */
/**
  Esta propiedad activa/desactiva la búsqueda de direcciones postales en el buscador del mapa. Formato: entidad de población, vía, portal. 
  
Para configurar un origen de datos distinto a IDENA, establecer como valor una instancia de {{#crossLink "SITNA.cfg.SearchPostalAddressSource"}}{{/crossLink}}. 
  @property postalAddress
  @type boolean|SITNA.cfg.SearchPostalAddressSource
  @default true
 */
/**
  Esta propiedad activa/desactiva la búsqueda de parcelas catastrales en el buscador del mapa. Formato: municipio, polígono, parcela. 
  
Para configurar un origen de datos distinto a IDENA, establecer como valor una instancia de {{#crossLink "SITNA.cfg.SearchCadastralSource"}}{{/crossLink}}. 
  @property cadastralParcel
  @type boolean|SITNA.cfg.SearchCadastralSource
  @default true 
 */

/**
  Opciones de control de catálogo de capas.

  Esta clase no tiene constructor.

  Puede consultar el ejemplo [online](../../examples/cfg.MapControlOptions.layerCatalog_workLayerManager.html). 
  @class SITNA.cfg.LayerCatalogOptions
  @extends SITNA.cfg.ControlOptions
  @static
 */
/**
  Propiedad que establece si se puede buscar capas por texto. La búsqueda del texto se realiza en los títulos y los resúmenes descriptivos de cada capa, que se publican en el
  [documento de capacidades](https://github.com/7o9/implementer-friendly-standards/blob/master/introduction.rst#getcapabilities") del servicio.
  @property enableSearch
  @type boolean|undefined
 */

/**
  Lista de objetos {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}} que se corresponden con capas de servicios WMS que queremos añadir al catálogo.
  
En estos objetos, si se asigna un valor a la propiedad {{#crossLink "SITNA.cfg.LayerOptions/layerNames:property"}}{{/crossLink}}, solo las capas
  especificadas y sus hijas estarán disponibles para ser añadidas al mapa. Sin embargo, si esta propiedad se deja sin asignar, todas las capas publicadas
  en el servicio WMS estarán disponibles para ser añadidas. 
#### Ejemplo:
```javascript
    <div id="mapa"></div>
    <script>
      // Establecemos un layout simplificado apto para hacer demostraciones de controles.
      SITNA.Cfg.layout = "layout/ctl-container";
      // Añadimos el control de capas cargadas en la primera posición.
      SITNA.Cfg.controls.workLayerManager = {
        div: "slot1"
      };
      // Añadimos en la segunda posición el catálogo de capas con dos servicios.
      SITNA.Cfg.controls.layerCatalog = {
        div: "slot2",
        enableSearch: true,
        layers: [
          {
            id: "idena",
            title: "IDENA",
            hideTitle: true,
            type: SITNA.Consts.layerType.WMS,
            url: "//idena.navarra.es/ogc/wms",
            hideTree: false
          },
          {
            id: "sismica",
            title: "Información sísmica y volcánica",
            type: SITNA.Consts.layerType.WMS,
            url: "//www.ign.es/wms-inspire/geofisica",
            layerNames: ["Ultimos10dias", "Ultimos30dias", "Ultimos365dias"],
            hideTree: false
          }
        ]
      };
      var map = new SITNA.Map("mapa");
    </script>
```
  @property layers
  @type Array
  @default []
  
 */

/**
  Opciones de control para añadir datos geográficos.
  
Esta clase no tiene constructor.

  Puede consultar el ejemplo [online](../../examples/cfg.DataLoaderOptions.html). 
  @class SITNA.cfg.DataLoaderOptions
  @extends SITNA.cfg.ControlOptions
  @static
 */
/**
  Lista de grupos de sugerencias de servicios WMS ofrecidos por el control. Es un array de instancias de la clase {{#crossLink "SITNA.cfg.WMSGroupOptions"}}{{/crossLink}},
  que establece grupos de servicios WMS sugeridos. Por ejemplo se puede establecer un grupo de servicios WMS estatales y otro de servicios WMS mundiales.
  @property wmsSuggestions
  @type Array|undefined
 */
/**
  Propiedad que establece si está permitido arrastrar y soltar archivos al área del mapa, además de abrirlos de la manera convencional abriendo el cuadro de diálogo de búsqueda de archivos.
  @property enableDragAndDrop
  @type boolean|undefined
 */

/**
  Opciones de grupo de sugerencias de servicios externos WMS.
  
Esta clase no tiene constructor.
  @class SITNA.cfg.WMSGroupOptions
  @static
 */
/**
  Nombre del grupo de sugerencias. Se mostrará como una sección en la lista de opciones del control.
  @property group
  @type String
 */
/**
  Lista de sugerencias de servicios externos WMS. Es un array de instancias de la clase {{#crossLink "SITNA.cfg.WMSOptions"}}{{/crossLink}}.
  @property items
  @type String
 */

/**
  Opciones de sugerencia de servicio externo WMS.
  
Esta clase no tiene constructor.
  @class SITNA.cfg.WMSOptions
  @static
 */
/**
  Nombre del servicio WMS. Se mostrará como un elemento en la lista de opciones del control.
  @property name
  @type String
 */
/**
  URL de acceso al servicio WMS.
  @property url
  @type String
 */

/**
  Opciones de estilo de entidades geográficas.
  
Esta clase no tiene constructor.
  @class SITNA.cfg.StyleOptions
  @static
 */
/**
  Opciones de estilo de marcador (punto de mapa con icono).
  @property marker
  @type SITNA.cfg.MarkerStyleOptions|undefined
 */
/**
  Opciones de estilo de punto.
  @property marker
  @type SITNA.cfg.PointStyleOptions|undefined
 */
/**
  Opciones de estilo de línea.
  @property line
  @type SITNA.cfg.LineStyleOptions|undefined
 */
/**
  Opciones de estilo de polígono.
  @property polygon
  @type SITNA.cfg.PolygonStyleOptions|undefined
 */
/**
  Opciones de estilo de cluster de puntos. Consultar SITNA.cfg.LayerOptions.{{#crossLink "SITNA.cfg.LayerOptions/cluster:property"}}{{/crossLink}}
  para saber cómo mostrar clusters.
  @property cluster
  @type SITNA.cfg.ClusterStyleOptions|undefined
 */

/**
  Opciones de estilo de marcador (punto de mapa con icono).
  
Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
  (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones). 

Esta clase no tiene constructor. 
  @class SITNA.cfg.MarkerStyleOptions
  @static
 */
/**
  Lista de nombres de clase CSS a utilizar para los iconos de los marcadores. La API extraerá la URL de las imágenes del atributo `background-image` asociado a la clase.
  @property classes
  @type Array
  @default ["tc-marker1", "tc-marker2", "tc-marker3", "tc-marker4", "tc-marker5"]
 */
/**
  Posicionamiento relativo del icono respecto al punto del mapa, representado por un array de dos números entre 0 y 1, siendo [0, 0] la esquina superior izquierda del icono.
  @property anchor
  @type Array
  @default [.5, 1]
 */
/**
  Anchura en píxeles del icono.
  @property width
  @type number
  @default 32
 */
/**
  Altura en píxeles del icono.
  @property height
  @type number
  @default 32
 */

/**
  Opciones de estilo de línea. Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
  (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones). 

Esta clase no tiene constructor. 
  @class SITNA.cfg.LineStyleOptions
  @static
 */
/**
  Color de trazo de la línea, representado en formato hex triplet (`"#RRGGBB"`).
  @property strokeColor
  @type string
  @default "#f00" en polígonos y líneas
 */
/**
  Anchura de trazo en píxeles de la línea.
  @property strokeWidth
  @type number
  @default 2 en polígonos y líneas
 */
/**
  Opacidad de trazo, valor de 0 a 1.
  @property strokeOpacity
  @type number
  @default 1 en polígonos y líneas
 */

/**
  Opciones de estilo de polígono. Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
  (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones). 

Esta clase no tiene constructor. 
  @class SITNA.cfg.PolygonStyleOptions
  @extends SITNA.cfg.LineStyleOptions
  @static
 */
/**
  Color de relleno, representado en formato hex triplet (`"#RRGGBB"`).
  @property fillColor
  @type string
  @default "#000" en polígonos, "#336" en clusters
 */
/**
  Opacidad de relleno, valor de 0 a 1.
  @property fillOpacity
  @type number
  @default 0.3 en polígonos, 0.6 en clusters
 */

/**
  Opciones de estilo de punto. Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
  (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones). 

Esta clase no tiene constructor. 
  @class SITNA.cfg.PointStyleOptions
  @extends SITNA.cfg.PolygonStyleOptions
  @static
 */
/**
  Colección de nombre de campo o campos de los cuales extraer el valor de la etiqueta.
  @property label
  @type string|undefined
  @default null
 */
/**
  Nombre del campo del cual extraer la rotación a aplicar a la etiqueta.
  @property angle
  @type string|undefined
  @default null
 */
/**
  Radio en pixels del símbolo que representa el punto.
  @property radius
  @type number|undefined
  @default 6 en puntos
 */
/**
  Color del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`"#RRGGBB"`).
  @property fontColor
  @type string|undefined
  @default "#fff" en clusters
 */
/**
  Color del contorno del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`"#RRGGBB"`).
  @property labelOutlineColor
  @type string|undefined
  @default null
 */
/**
  Anchura de trazo del contorno del texto de la etiqueta en píxeles.
  @property labelOutlineWidth
  @type number|undefined
  @default null
 */
/**
  Tamaño de fuente del texto de la etiqueta descriptiva del punto.
  @property fontSize
  @type number|undefined
  @default 9 en clusters
 */

/**
  Opciones de estilo de cluster de puntos. Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
  (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones). 

Esta clase no tiene constructor. 
  @class SITNA.cfg.ClusterStyleOptions
  @static
 */
/**
  Opciones de estilo del punto que representa el cluster. Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de las propiedades de esta clase
  (consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones). 

Esta clase no tiene constructor. 
  
Puede consultar también el ejemplo [online](../../examples/cfg.ClusterStyleOptions.point.html). 
#### Ejemplo:
```javascript
    <div id="mapa"></div>
    <script>
      // Creamos un mapa con una capa vectorial,
      // clustering activado a 50 pixels y estilos personalizados.
      var map = new SITNA.Map("mapa", {
        workLayers: [
         {
           id: "cluster",
           type: SITNA.Consts.layerType.VECTOR,
           title: "Clusters",
           cluster: {
             distance: 50,
             styles: {
               point: {
                 fillColor: "#f90",
                 fillOpacity: 1,
                 strokeColor: "#c60",
                 strokeWidth: 2,
                 fontColor: "#f90"
               }
             }
           }
         }
       ]
      });

     map.loaded(function () {
       // Añadimos puntos aleatorios
       var extent = TC.Cfg.initialExtent;
       var dx = extent[2] - extent[0];
       var dy = extent[3] - extent[1];

       var randomPoint = function () {
         var x = extent[0] + Math.random()  dx;
         var y = extent[1] + Math.random()  dy;
         return [x, y];
       }

       for (var i = 0; i < 200; i++) {
         var point = randomPoint();
         map.addMarker(point, {
           layer: "cluster",
           data: {
             x: point[0],
             y: point[1]
           }
         });
       }
     });
    </script>
```
  @property point
  @type SITNA.cfg.PointStyleOptions|undefined  
 */

/**
  Opciones de marcador. El icono se obtiene de las propiedades {{#crossLink "SITNA.cfg.MarkerOptions/url:property"}}{{/crossLink}}, 
  {{#crossLink "SITNA.cfg.MarkerOptions/cssClass:property"}}{{/crossLink}} y {{#crossLink "SITNA.cfg.MarkerOptions/group:property"}}{{/crossLink}}, por ese orden de preferencia. 
  
Esta clase no tiene constructor. 
  @class SITNA.cfg.MarkerOptions
  @extends SITNA.cfg.MarkerStyleOptions
  @static
 */
/**
  Nombre de grupo en el que incluir el marcador. Estos grupos se muestran en la tabla de contenidos y en la leyenda.

  Todos los marcadores pertenecientes al mismo grupo tienen el mismo icono. Los iconos se asignan automáticamente, rotando por la lista disponible en
  SITNA.cfg.MarkerStyleOptions.{{#crossLink "SITNA.cfg.MarkerStyleOptions/classes:property"}}{{/crossLink}}.
  @property group
  @type string|undefined
 */
/**
  Nombre de clase CSS. El marcador adoptará como icono el valor del atributo `background-image` de dicha clase.
  @property cssClass
  @type string|undefined
 */
/**
  URL de archivo de imagen que se utilizará para el icono.
  @property url
  @type string|undefined
 */
/**
  Identificador de la capa vectorial a la que añadir el marcador.
  @property layer
  @type string|undefined
 */
/**
  Objeto de datos en pares clave/valor para mostrar cuando se pulsa sobre el marcador.
  @property data
  @type object|undefined
 */
/**
  Si se establece a `true`, al añadirse el marcador al mapa se muestra con el bocadillo de información asociada visible por defecto.
  @property showPopup
  @type boolean|undefined
 */

/*
  Búsqueda realizada de entidades geográficas en el mapa. Define el tipo de consulta y a qué capa afecta. 
  Esta clase no tiene constructor. 
  class SITNA.Search
  static
/*
  Tipo de consulta que se está realizando al mapa.
  property type
  type SITNA.consts.MapSearchType
 */
/*
  Capa del mapa sobre la que se hace la consulta.
  property layer
  type SITNA.consts.Layer
 */

/**
Objeto principal de la API, instancia un mapa dentro de un elemento del DOM. Nótese que el constructor es asíncrono, por tanto cualquier código
que haga uso de este objeto debería estar dentro de una función de callback pasada como parámetro al método {{#crossLink "SITNA.Map/loaded:method"}}{{/crossLink}}.

Las opciones de configuración del mapa son una combinación de las opciones de configuración global (definidas en {{#crossLink "SITNA.Cfg"}}{{/crossLink}}),
las opciones definidas por el {{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}} que utilicemos, y las opciones pasadas como parámetro al
constructor. Estas opciones están ordenadas de menor a mayor prevalencia, de modo que por ejemplo una opción pasada como parámetro del constructor
siempre sobreescribirá una opción de la configuración global.

Puede consultar también online el [ejemplo 1](../../examples/Map.1.html), el [ejemplo 2](../../examples/Map.2.html) y el [ejemplo 3](../../examples/Map.3.html).
#### Ejemplo:
```javascript
  <div id="mapa"/>
  <script>
    // Crear un mapa con las opciones por defecto.
    var map = new SITNA.Map("mapa");
  </script>

  <div id="mapa"/>
  <script>
    // Crear un mapa en el sistema de referencia WGS 84 con el de mapa de fondo.
    var map = new SITNA.Map("mapa", {
      crs: "EPSG:4326",
      initialExtent: [ // Coordenadas en grados decimales, porque el sistema de referencia espacial es WGS 84.
        -2.84820556640625,
        41.78912492257675,
        -0.32135009765625,
        43.55789822064767
      ],
      maxExtent: [
        -2.84820556640625,
        41.78912492257675,
        -0.32135009765625,
        43.55789822064767
      ],
      baselayerExtent: [
        -2.84820556640625,
        41.78912492257675,
        -0.32135009765625,
        43.55789822064767
      ],
      baseLayers: [
        SITNA.Consts.layer.IDENA_DYNBASEMAP
      ],
      defaultBaseLayer: SITNA.Consts.layer.IDENA_DYNBASEMAP,
      // Establecemos el mapa de situación con una capa compatible con WGS 84
      controls: {
        overviewMap: {
          layer: SITNA.Consts.layer.IDENA_DYNBASEMAP
        }
      }
    });
  </script>
```
```javascript
  <div id="mapa"></div>
  <script>
    // Crear un mapa que tenga como contenido las capas de toponimia y mallas cartográficas del WMS de IDENA.
    var map = new SITNA.Map("mapa", {
      workLayers: [
        {
          id: "topo_mallas",
          title: "Toponimia y mallas cartográficas",
          type: SITNA.Consts.layerType.WMS,
          url: "//idena.navarra.es/ogc/wms",
          layerNames: "IDENA:toponimia,IDENA:mallas"
        }
      ]
    });
  </script>
```

@class SITNA.Map
@constructor
@async
@param {HTMLElement|string} div Elemento del DOM en el que crear el mapa o valor de atributo id de dicho elemento.
@param {object} [options] Objeto de opciones de configuración del mapa. Sus propiedades sobreescriben el objeto de configuración global {{#crossLink "SITNA.Cfg"}}{{/crossLink}}.
@param {string} [options.crs="EPSG:25830"] Código EPSG del sistema de referencia espacial del mapa. Por defecto es `"EPSG:25830"`.
@param {array} [options.initialExtent] Extensión inicial del mapa definida por x mínima, y mínima, x máxima, y máxima. 
Esta opción es obligatoria si el sistema de referencia espacial del mapa es distinto del sistema por defecto (ver SITNA.Cfg.{{#crossLink "SITNA.Cfg/crs:property"}}{{/crossLink}}).

Para más información consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/initialExtent:property"}}{{/crossLink}}.
@param {array} [options.maxExtent] Extensión máxima del mapa definida por x mínima, y mínima, x máxima, y máxima. Para más información consultar SITNA.Cfg.{{#crossLink "SITNA.Cfg/maxExtent:property"}}{{/crossLink}}.
@param {string} [options.layout] URL de una carpeta de maquetación. Consultar la sección {{#crossLinkModule "2.2. Maquetación"}}{{/crossLinkModule}} para ver instrucciones de uso de maquetaciones.
@param {array} [options.baseLayers] Lista de identificadores de capa o instancias de la clase {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}} para incluir dichas capas como mapas de fondo. 
@param {array} [options.workLayers] Lista de identificadores de capa o instancias de la clase {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}} para incluir dichas capas como contenido del mapa. 
@param {string|number} [options.defaultBaseLayer] Identificador o índice en `baseLayers` de la capa base por defecto. 
@param {SITNA.cfg.MapControlOptions} [options.controls] Opciones de controles de mapa.
@param {SITNA.cfg.StyleOptions} [options.styles] Opciones de estilo de entidades geográficas.
@param {string} [options.locale="es-ES"] Código de idioma de la interfaz de usuario. Este código debe obedecer la sintaxis definida por la <a href="https://en.wikipedia.org/wiki/IETF_language_tag">IETF</a>.
Los valores posibles son `"es-ES"`, `"eu-ES"` y `"en-US"`. Por defecto es `"es-ES"`.
@param {string} [options.crossOrigin] Valor del atributo `crossorigin` de las imágenes del mapa para  <a href="https://developer.mozilla.org/es/docs/Web/HTML/Imagen_con_CORS_habilitado">habilitar CORS</a>
Es necesario establecer esta opción para poder utilizar el método SITNA.Map.{{#crossLink "SITNA.Map/exportImage:method"}}{{/crossLink}}. 

Los valores soportados son `"anonymous"` y `"use-credentials"`.
@param {boolean} [options.mouseWheelZoom] Si se establece a `true`, la rueda del ratón se puede utilizar para hacer zoom en el mapa.
@param {string} [options.proxy] URL del proxy utilizado para peticiones a dominios remotos (ver SITNA.Cfg.{{#crossLink "SITNA.Cfg/proxy:property"}}{{/crossLink}}).
 */

/*
  Búsqueda actual de consulta de entidad geográfica aplicado al mapa.
  property search
  type SITNA.Search|null
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
        var keys = Object.keys(options.controls.search);

        var searchCfg = $.extend(options.controls.search, { allowedSearchTypes: {} });

        keys.forEach(function (key) {
            if (typeof (options.controls.search[key]) === "boolean" || $.isPlainObject(options.controls.search[key])) {
                if (options.controls.search[key]) {

                    switch (true) {
                        case (key === "postalAddress"):
                            searchCfg.allowedSearchTypes[TC.Consts.searchType.NUMBER] = $.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                            break;
                        case (key === "cadastralParcel"):
                            searchCfg.allowedSearchTypes[TC.Consts.searchType.CADASTRAL] = $.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                            break;
                        case (key === "town"):
                            searchCfg.allowedSearchTypes[TC.Consts.searchType.URBAN] = $.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
                            break;
                        default:
                            searchCfg.allowedSearchTypes[key] = $.isPlainObject(options.controls.search[key]) ? options.controls.search[key] : {};
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
    Añade una capa al mapa. Si se le pasa una instancia de la clase {{#crossLink "SITNA.cfg.LayerOptions"}}{{/crossLink}} como parámetro `layer`
    y tiene definida la propiedad SITNA.cfg.LayerOptions.{{#crossLink "SITNA.cfg.LayerOptions/url:property"}}{{/crossLink}}, establece por defecto
    el tipo de capa a {{#crossLink "SITNA.consts.LayerType/KML:property"}}{{/crossLink}} si la URL acaba en ".kml".
    
El tipo de la capa no puede ser {{#crossLink "SITNA.consts.LayerType/WFS:property"}}{{/crossLink}}.
  
    Puede consultar también online el [ejemplo 1](../../examples/Map.addLayer.1.html) y el [ejemplo 2](../../examples/Map.addLayer.2.html). 
  #### Ejemplo:
```javascript
      <div id="mapa"></div>
      <script>
        // Crear un mapa con las opciones por defecto.
        var map = new SITNA.Map("mapa");
        // Cuando esté todo cargado proceder a trabajar con el mapa.
        map.loaded(function () {
          // Añadir al mapa la capa de cartografía topográfica de IDENA
          map.addLayer(SITNA.Consts.layer.IDENA_CARTO);
        });
      </script>
```
    ```javascript
      <div id="mapa"></div>
      <script>
        // Crear un mapa con las opciones por defecto.
        var map = new SITNA.Map("mapa");
  
        // Cuando esté todo cargado proceder a trabajar con el mapa.
        map.loaded(function () {
          // Añadir al mapa un documento KML
          map.addLayer({
            id: "capa_kml",
            title: "Museos en Navarra",
            type: SITNA.Consts.layerType.KML,
            url: "data/MUSEOSNAVARRA.kml"
          });
        });
      </script>
```

    @method addLayer
    @async
    @param {string|SITNA.cfg.LayerOptions} layer Identificador de capa u objeto de opciones de capa.
    @param {function} [callback] Función a la que se llama tras ser añadida la capa.     
     */
    map.addLayer = function (layer, callback) {
        tcMap.addLayer(layer, callback);
    };

    /**
    Hace visible una capa como mapa de fondo. Esta capa debe existir previamente en la lista de mapas de fondo del mapa.
  
    Puede consultar también online el [ejemplo 1](../../examples/Map.setBaseLayer.1.html) y el [ejemplo 2](../../examples/Map.setBaseLayer.2.html).
#### Ejemplo:

```javascript
      <div id="mapa"></div>
      <script>
        // Crear mapa con opciones por defecto. Esto incluye la capa del catastro de Navarra entre los mapas de fondo.
        var map = new SITNA.Map("mapa");
        // Cuando esté todo cargado establecer como mapa de fondo visible el catastro de Navarra.
        map.loaded(function () {
          map.setBaseLayer(SITNA.Consts.layer.IDENA_CADASTER);
        });
      </script>
```
    ```javascript
      <div id="mapa"></div>
      <script>
        // Crear mapa con opciones por defecto.
        var map = new SITNA.Map("mapa");
        // Cuando el mapa esté cargado, añadir la ortofoto de 1956/1957 como mapa de fondo y establecerla como mapa de fondo visible.
        map.loaded(function () {
          map.addLayer({
            id: "orto_56_57",
            title: "Ortofoto de 1956/1957",
            url: "http://idena.navarra.es/ogc/wms",
            layerNames: "ortofoto_10000_1957",
            isBase: true
          }, function () {
            map.setBaseLayer("orto_56_57");
          });
        });
      </script>
```

    @method setBaseLayer
    @async
    @param {string|SITNA.cfg.LayerOptions} layer Identificador de capa u objeto de opciones de capa. 
    @param {function} [callback] Función al que se llama tras ser establecida la capa como mapa de fondo.    
     */
    map.setBaseLayer = function (layer, callback) {
        tcMap.setBaseLayer(layer, callback);
    };

    /**
    Añade un marcador (un punto asociado a un icono) al mapa.
  
    Puede consultar también online el [ejemplo 1](../../examples/Map.addMarker.1.html), el [ejemplo 2](../../examples/Map.addMarker.2.html),
    el [ejemplo 3](../../examples/Map.addMarker.3.html) y el [ejemplo 4](../../examples/Map.addMarker.4.html).
    @method addMarker
    @async
    @param {array} coords Coordenadas x e y del punto en las unidades del sistema de referencia del mapa.
    @param {object} [options] Objeto de opciones de marcador.
    @param {string} [options.group] Nombre de grupo en el que incluir el marcador. Estos grupos se muestran en la tabla de contenidos y en la leyenda.
  
    Todos los marcadores pertenecientes al mismo grupo tienen el mismo icono. Los iconos se asignan automáticamente, rotando por la lista disponible en
    SITNA.cfg.MarkerStyleOptions.{{#crossLink "SITNA.cfg.MarkerStyleOptions/classes:property"}}{{/crossLink}}.
    @param {string} [options.cssClass] Nombre de clase CSS. El marcador adoptará como icono el valor del atributo `background-image` de dicha clase.
    @param {string} [options.url] URL de archivo de imagen que será el icono del marcador.
    @param {number} [options.width] Anchura en píxeles del icono del marcador.
    @param {number} [options.height] Altura en píxeles del icono del marcador.
    @param {array} [options.anchor] Coordenadas proporcionales (entre 0 y 1) del punto de anclaje del icono al punto del mapa. La coordenada (0, 0) es la esquina superior izquierda del icono.
    @param {object} [options.data] Objeto de datos en pares clave/valor para mostrar cuando se pulsa sobre el marcador. Si un valor es una URL, se mostrará como un enlace.
    @param {boolean} [options.showPopup] Si se establece a `true`, al añadirse el marcador al mapa se muestra con el bocadillo de información asociada visible por defecto.
    @param {string} [options.layer] Identificador de capa de tipo SITNA.consts.LayerType.{{#crossLink "SITNA.consts.LayerType/VECTOR:property"}}{{/crossLink}} en la que se añadirá el marcador. Si no se especifica se creará una capa específica para marcadores.
    
     */
    map.addMarker = function (coords, options) {
        tcMap.addMarker(coords, options);
    };

    /**
     Centra y escala el mapa a la extensión que ocupan todos sus marcadores.
  
     Puede consultar también el ejemplo [online](../../examples/Map.zoomToMarkers.html).
#### Ejemplo:
```javascript
       <div class="controls">
         <div><button id="addMarkerBtn">Añadir marcador aleatorio</button></div>
         <div><input type="number" step="1" id="pbrVal" value="30" /> <label for="pbrVal">pointBoundsRadius</label></div>
         <div><input type="number" step="0.1" id="emVal" value="0.2" /> <label for="emVal">extentMargin</label></div>
         <div><button id="zoomBtn">Hacer zoom a los marcadores</button></div>
       </div>
       <div id="mapa"></div>
       <script>
         // Crear mapa.
         var map = new SITNA.Map("mapa");
  
         // Añadir un marcador en un punto aleatorio
         var addRandomMarker = function () {
           var xmin = SITNA.Cfg.initialExtent[0];
           var ymin = SITNA.Cfg.initialExtent[1];
           var width = SITNA.Cfg.initialExtent[2] - SITNA.Cfg.initialExtent[0];
           var height = SITNA.Cfg.initialExtent[3] - SITNA.Cfg.initialExtent[1];
           map.addMarker([xmin + Math.random() width, ymin + Math.random() height]);
         };
  
         // Hacer zoom a los marcadores con las opciones elegidas
         var zoomToMarkers = function () {
           map.zoomToMarkers({
             pointBoundsRadius: parseInt(document.getElementById("pbrVal").value),
             extentMargin: parseFloat(document.getElementById("emVal").value)
           });
         };
  
         document.getElementById("addMarkerBtn").addEventListener("click", addRandomMarker);
         document.getElementById("zoomBtn").addEventListener("click", zoomToMarkers);
       </script>
```

     @method zoomToMarkers
     @param {object} [options] Objeto de opciones de zoom.
     @param {number} [options.pointBoundsRadius=30] Radio en metros del área alrededor del marcador que se respetará al hacer zoom. Por defecto es 30.
     @param {number} [options.extentMargin=0.2] Tamaño del margen que se aplicará a la extensión total de todas los marcadores.
     El valor es la relación de crecimiento en ancho y alto entre la extensión resultante y la original. Por ejemplo, el valor por defecto 0,2 indica un crecimiento del 20% de la extensión, 10% por cada lado.
     @async
     
     */
    map.zoomToMarkers = function (options) {
        tcMap.zoomToMarkers(options);
    };

    /**
    Añade una función de callback que se ejecutará cuando el mapa, sus controles y todas sus capas se hayan cargado.
#### Ejemplo:
```javascript
       // Notificar cuando se haya cargado el mapa.
       map.loaded(function () { 
         console.log("Código del mapa y de sus controles cargado, cargando datos...");
       });
```
    @method loaded
    @async
    @param {function} callback Función a la que se llama tras la carga del mapa.
    
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

    /*
      Obtiene los valores (id y label) de las entidades geográficas disponibles en la capa de IDENA que corresponda según el parámetro searchType. 
      Puede consultar también online el [ejemplo 1](../../examples/Map.getQueryableData.html). 
    
     method getQueryableData
     async
     param {string|SITNA.consts.MapSearchType} searchType Fuente de datos del cual obtendremos los valores disponibles para buscar posteriormente.
     param {function} [callback] Función a la que se llama tras obtener los datos.  
     example
       <div id="mapa"></div>
       <script>
         // Crear un mapa con las opciones por defecto.
         var map = new SITNA.Map("mapa");
       
         // Cuando esté todo cargado proceder a trabajar con el mapa.
         map.loaded(function () {  
           // Retorna un array de objetos (id, label) con todos los municipios de Navarra
           map.getQueryableData(SITNA.Consts.mapSearchType.MUNICIPALITY, function (data) {
             $.each(data, function (key, value) {
               $('#municipality')  // Completamos el combo '#municipality' con los datos recibidos
                .append($("<option></option>")
                .attr("value", value.id)
                .text(value.label));
             });
           });
   
           // Retorna un array de objetos (id, label) con todas las mancomunidades de residuos de Navarra
           map.getQueryableData(SITNA.Consts.mapSearchType.COMMONWEALTH, function (data) {
             $.each(data, function (key, value) {
               $('#commonwealth')  // Completamos el combo '#community' con los datos recibidos
                .append($("<option></option>")
                .attr("value", value.id)
                .text(value.label));
             });
           });
         });
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
    Obtiene los valores (id y label) de los municipios disponibles en la capa de IDENA.
  
    Puede consultar también online el [ejemplo 1](../../examples/Map.getMunicipalities.html).
#### Ejemplo:  
```javascript
      <div class="instructions divSelect">
        <div>
          Municipios
          <select id="municipality" onchange="applyFilter()">
            <option value="-1">Seleccione...</option>
          </select>
        </div>
      </div>
      <div id="mapa"></div>
      <script>
        // Crear mapa.
        var map = new SITNA.Map("mapa");
        map.loaded(function () {
          // completamos el desplegable
          map.getMunicipalities(function (data) {
            $.each(data, function (key, value) {
              $('#municipality').append($("<option></option>")
                .attr("value", value.id)
                .text(value.label));
              });
            });
          });
        // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
        function applyFilter() {
          var id = $('#municipality').find('option:selected').val();
          if (id == -1)
            map.removeSearch();
          else {
            map.searchMunicipality(id, function (idQuery) {
              if (idQuery == null)
                alert('No se han encontrado resultados');
            });
          }
        };
     </script>
```

    @method getMunicipalities
    @async  
    @param {function} [callback] Función a la que se llama tras obtener los datos.
    
    */
    map.getMunicipalities = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.MUNICIPALITY, callback);
    };
    /**
    Obtiene los valores (id y label) de los cascos urbanos disponibles en la capa de IDENA.
  
    Puede consultar también online el [ejemplo 1](../../examples/Map.getUrbanAreas.html).
#### Ejemplo:
```javascript
      <div class="instructions divSelect">
       <div>
         Cascos urbanos
         <select id="urban" onchange="applyFilter()">
           <option value="-1">Seleccione...</option>
         </select>
       </div>
      </div>
      <div id="mapa"></div>
      <script>
       // Crear mapa.
       var map = new SITNA.Map("mapa");
       map.loaded(function () {
         // completamos el desplegable
         map.getUrbanAreas(function (data) {
           $.each(data, function (key, value) {
             $('#urban').append($("<option></option>")
                .attr("value", value.id)
                .text(value.label));
             });
           });
         });
       // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
       function applyFilter() {
         var id = $('#urban').find('option:selected').val();
         if (id == -1)
           map.removeSearch();
         else {
           map.searchUrbanArea(id, function (idQuery) {
             if (idQuery == null)
               alert('No se han encontrado resultados');
           });
         }
       };
      </script>
```  

    @method getUrbanAreas
    @async  
    @param {function} [callback] Función a la que se llama tras obtener los datos.  
    
    */
    map.getUrbanAreas = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.URBAN, callback);
    };
    /**
      Obtiene los valores (id y label) de las mancomunidades de residuos disponibles en la capa de IDENA. 
      
Puede consultar también online el [ejemplo 1](../../examples/Map.getCommonwealths.html). 
#### Ejemplo:
```javascript
       <div class="instructions divSelect">
         <div>
           Mancomunidades de residuos
           <select id="commonwealths" onchange="applyFilter()">
             <option value="-1">Seleccione...</option>
           </select>
         </div>
       </div>
       <div id="mapa"></div>
       <script>
         // Crear mapa.
         var map = new SITNA.Map("mapa");
         map.loaded(function () {
           // completamos el desplegable
           map.getCommonwealths(function (data) {
             $.each(data, function (key, value) {
               $('#commonwealths').append($("<option></option>")
                 .attr("value", value.id)
                 .text(value.label));
               });
             });
           });
         // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
         function applyFilter() {
           var id = $('#commonwealths').find('option:selected').val();
           if (id == -1)
             map.removeSearch();
           else {
             map.searchCommonwealth(id, function (idQuery) {
               if (idQuery == null)
                 alert('No se han encontrado resultados');
             });
           }
         };
      </script>
```    

     @method getCommonwealths
     @async  
     @param {function} [callback] Función a la que se llama tras obtener los datos.  
     
    */
    map.getCommonwealths = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.COMMONWEALTH, callback);
    };
    /**
       Obtiene los valores (id y label) de los concejos disponibles en la capa de IDENA. 
       
Puede consultar también online el [ejemplo 1](../../examples/Map.getCouncils.html). 
 #### Ejemplo:    
 ```javascript
        <div class="instructions divSelect">
          <div>
            Concejos
            <select id="council" onchange="applyFilter()">
              <option value="-1">Seleccione...</option>
            </select>
          </div>
        </div>
        <div id="mapa"></div>
        <script>
          // Crear mapa.
          var map = new SITNA.Map("mapa");
          map.loaded(function () {
            // completamos el desplegable
            map.getCouncils(function (data) {
              $.each(data, function (key, value) {
                $('#council').append($("<option></option>")
                  .attr("value", value.id)
                  .text(value.label));
                });
              });
            });
          // Establecer como filtro del mapa el valor seleccionado del desplegable que lance el evento change
          function applyFilter() {
            var id = $('#council').find('option:selected').val();
            if (id == -1)
              map.removeSearch();
            else {
              map.searchCouncil(id, function (idQuery) {
                if (idQuery == null)
                  alert('No se han encontrado resultados');
              });
            }
          };
       </script>
```

      @method getCouncils
      @async  
      @param {function} [callback] Función a la que se llama tras obtener los datos.  
     
     */
    map.getCouncils = function (callback) {
        map.getQueryableData(SITNA.Consts.mapSearchType.COUNCIL, callback);
    };
    /**
        Busca la mancomunidad de residuos y pinta en el mapa la entidad geográfica encontrada que corresponda al identificador indicado.
        
Puede consultar también online el [ejemplo 1](../../examples/Map.searchCommonwealth.html). 
#### Ejemplo:
```javascript
            <div class="instructions searchCommonwealth">    
              <div><button id="searchPamplonaBtn">Buscar Mancomunidad de la Comarca de Pamplona</button></div>    
            </div>
            <div id="mapa"></div>
            <script>
              // Crear mapa.
              var map = new SITNA.Map("mapa");
              map.loaded(function () {
                document.getElementById("searchPamplonaBtn").addEventListener("click", search);
              });
      
              var search = function () {
                map.removeSearch();
                map.searchCommonwealth("8", function (idQuery) {
                  if (idQuery == null) {
                    alert("No se ha encontrado la mancomunidad con código 8.");
                  }
                });
              };
            </script>
```      

       @method searchCommonwealth
       @async
       @param {string} id Identificador de la entidad geográfica a pintar.
       @param {function} [callback] Función a la que se llama tras aplicar el filtro.  
       
      */

    map.searchCommonwealth = function (id, callback) {
        map.searchTyped(SITNA.Consts.mapSearchType.COMMONWEALTH, id, callback);
    };
    /**
        Busca el concejo que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
        
Puede consultar también online el [ejemplo 1](../../examples/Map.searchCouncil.html). 
#### Ejemplo:     
```javascript
             <div class="instructions search">    
              <div><button id="searchBtn">Buscar concejo Esquíroz (Galar)</button></div>    
             </div>
             <div id="mapa"></div>
             <script>
              // Crear mapa.
              var map = new SITNA.Map("mapa");
              map.loaded(function () {
                document.getElementById("searchBtn").addEventListener("click", search);
              });
     
              var search = function () {
                map.removeSearch();
                map.searchCouncil("109#5", function (idQuery) {
                  if (idQuery == null) {
                      alert("No se ha encontrado el concejo con código 109#5.");
                  }
                });
              };    
             </script>    
```

       @method searchCouncil
       @async    
       @param {string} id Identificador de la entidad geográfica a pintar.
       @param {function} [callback] Función a la que se llama tras aplicar el filtro.  
       
      **/
    map.searchCouncil = function (id, callback) {
        map.searchTyped(SITNA.Consts.mapSearchType.COUNCIL, id, callback);
    };
    /**
        Busca el casco urbano que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
        
Puede consultar también online el [ejemplo 1](../../examples/Map.searchUrbanArea.html). 
#### Ejemplo:
```javascript
            <div class="instructions search">
            <div><button id="searchBtn">Buscar casco urbano de Arbizu</button></div>
            </div>
            <div id="mapa"></div>
            <script>
              // Crear mapa.
              var map = new SITNA.Map("mapa");
              map.loaded(function () {
                document.getElementById("searchBtn").addEventListener("click", search);
              });
              var search = function () {
                map.removeSearch();
                map.searchUrbanArea("27", function (idQuery) {
                  if (idQuery == null) {
                    alert("No se ha encontrado el casco urbano con código 27.");
                  }
                });
              };
            </script>
```     

       @method searchUrbanArea
       @async    
       @param {string} id Identificador de la entidad geográfica a pintar.
       @param {function} [callback] Función a la que se llama tras aplicar el filtro.  
       
      **/
    map.searchUrbanArea = function (id, callback) {
        map.searchTyped(SITNA.Consts.mapSearchType.URBAN, id, callback);
    };
    /**
        Busca el municipio que corresponda con el identificador pasado como parámetro y pinta la entidad geográfica encontrada en el mapa.
        
Puede consultar también online el [ejemplo 1](../../examples/Map.searchMunicipality.html). 
#### Ejemplo:     
```javascript
             <div class="instructions search">
              <div><button id="searchBtn">Buscar Arbizu</button></div>
             </div>
             <div id="mapa"></div>
             <script>
              // Crear mapa.
              var map = new SITNA.Map("mapa");
              map.loaded(function () {
                document.getElementById("searchBtn").addEventListener("click", search);
              });
     
              var search = function () {
                 map.removeSearch();
                 map.searchCouncil("27", function (idQuery) {
                  if (idQuery == null) {
                    alert("No se ha encontrado el municipio con código 27.");
                  }
                 });
              };
             </script>
```

       @method searchMunicipality
       @async    
       @param {string} id Identificador de la entidad geográfica a pintar.
       @param {function} [callback] Función a la que se llama tras aplicar el filtro.  
       
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
          Busca y pinta en el mapa la entidad geográfica encontrada correspondiente al identificador establecido.
          
Puede consultar también online el [ejemplo 1](../../examples/Map.searchFeature.html). 
#### Ejemplo:       
```javascript
              <div class="instructions query">
                 <div><label>Capa</label><input type="text" id="capa" placeholder="Nombre capa de IDENA" /> </div>
                 <div><label>Campo</label><input type="text" id="campo" placeholder="Nombre campo" /> </div>
                 <div><label>Valor</label><input type="text" id="valor" placeholder="Valor a encontrar" /> </div>
                 <div><button id="searchBtn">Buscar</button></div>
                 <div><button id="removeBtn">Eliminar filtro</button></div>
               </div>
               <div id="mapa"></div>
               <script>
                 // Crear mapa.
                  var map = new SITNA.Map("mapa");
                 
                  map.loaded(function () {
                    document.getElementById("searchBtn").addEventListener("click", search);
                    document.getElementById("removeBtn").addEventListener("click", remove);
                  });
                  
                  var search = function () {
                    var capa = document.getElementById("capa").value;
                    capa = capa.trim();
                 
                    var campo = document.getElementById("campo").value;
                    campo = campo.trim();
                 
                    var valor = document.getElementById("valor").value;
                    valor = valor.trim();
                 
                    map.searchFeature(capa, campo, valor, function (idQuery) {
                      if (idQuery == null) {
                        alert("No se han encontrado resultados en la capa: " + capa + " en el campo: " + campo + " el valor: " + valor + ".");
                      }
                    });
                  };
                 
                  // Limpiar el mapa 
                  var remove = function () {
                    map.removeSearch();
                  };
               </script>
```

         @method searchFeature
         @async
         @param {string} layer Capa de IDENA en la cual buscar.
         @param {string} field Campo de la capa de IDENA en el cual buscar.
         @param {string} id Identificador de la entidad geográfica por el cual filtrar.
         @param {function} [callback] Función a la que se llama tras aplicar el filtro.  
         
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
       Elimina del mapa la entidad geográfica encontrada. 
       
Puede consultar también online el [ejemplo 1](../../examples/Map.removeSearch.html). 
#### Ejemplo:    
```javascript
        <div class="instructions query">
           <div><label>Capa</label><input type="text" id="capa" placeholder="Nombre capa de IDENA" /> </div>
           <div><label>Campo</label><input type="text" id="campo" placeholder="Nombre campo" /> </div>
           <div><label>Valor</label><input type="text" id="valor" placeholder="Valor a encontrar" /> </div>
           <div><button id="searchBtn">Buscar</button></div>
           <div><button id="removeBtn">Eliminar filtro</button></div>
         </div>
         <div id="mapa"></div>
         <script>
           // Crear mapa.
           var map = new SITNA.Map("mapa");
    
           map.loaded(function () {
             document.getElementById("addFilterBtn").addEventListener("click", addFilter);
             document.getElementById("removeFilterBtn").addEventListener("click", removeFilter);
           });
    
           // Establecer como filtro del mapa el municipio Valle de Egüés
           var addFilter = function () {
             var capa = document.getElementById("capa").value;
             capa = capa.trim();
    
            var campo = document.getElementById("campo").value;
             campo = campo.trim();
    
             var valor = document.getElementById("valor").value;
             valor = valor.trim();
        
             map.searchFeature(capa, campo, valor, function (idQuery) {
               if (idQuery == null) {
                 alert("No se han encontrado resultados en la capa: " + capa + " en el campo: " + campo + " el valor: " + valor + ".");
               }
             });
           };
          
           // Limpiar el mapa del filtro
           var remove = function () {
             map.removeSearch();
           };
         </script>
```

      @method removeSearch
      @async   
      @param {function} [callback] Función a la que se llama tras eliminar la entidad geográfica.  
      
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
      Exporta el mapa a una imagen PNG. Para poder utilizar este método hay que establecer la opción `crossOrigin` al instanciar {{#crossLink "SITNA.Map"}}{{/crossLink}}. 
      
Puede consultar también el ejemplo [online](../../examples/Map.exportImage.html).0    
#### Ejemplo:    
```javascript
                <div id="controls" class="controls">
                   <button id="imageBtn">Exportar imagen</button>
                </div>
                 <div id="mapa"></div>
                 <script>
                   // Crear un mapa con la opción de imágenes CORS habilitada.
                   var map = new SITNA.Map("mapa", { crossOrigin: "anonymous" });
    
                   var exportImage = function () {
                     var dataUrl = map.exportImage();
                     var image = document.createElement("img");
                     image.setAttribute("src", dataUrl);
                     image.style.width = '25vw';
                     var div = document.createElement("div");
                     div.appendChild(image);
                     document.getElementById("controls").appendChild(div);
                   };
          
                   document.getElementById("imageBtn").addEventListener("click", exportImage);
                 </script>
```
      @method exportImage
      @return {String} Imagen en un [data URI](https://developer.mozilla.org/es/docs/Web/HTTP/Basics_of_HTTP/Datos_URIs).
     */
    map.exportImage = function () {
        return tcMap.exportImage();
    };

    map.search = null;
};

/**
Cuando se instancia un mapa, se carga una maquetación que establece qué datos se cargan, qué controles y en que distribución se muestran, y qué estilo
va a tener el visor. La API SITNA tiene una maquetación definida por defecto, pero esto se puede cambiar utilizando la opción
{{#crossLink "SITNA.Cfg/layout:property"}}{{/crossLink}}:
#### Ejemplo:
```javascript
var map = new SITNA.Map("mapa", {
  layout: "layouts/mylayout"
});
```

El valor de esa opción es una ruta a una carpeta, donde se encontrarán todos o alguno de los siguientes archivos:

- `markup.html`, con la plantilla HTML que se inyectará en el elemento del DOM del mapa.
- `config.json`, con un objeto JSON que sobreescribirá propiedades de {{#crossLink "SITNA.Cfg"}}{{/crossLink}}.
- `style.css`, para personalizar el estilo del visor y sus controles.
- `script.js`, para añadir lógica nueva. Este es el lugar idóneo para la lógica de la nueva interfaz definida por el marcado inyectado con `markup.html`.
- `ie8.css`, para adaptar el estilo a Internet Explorer 8, dado que este navegador tiene soporte CSS3 deficiente.
- `resources/*.json`, donde `*` es el código IETF del idioma que tendrá la interfaz de usuario, por ejemplo `resources/es-ES.json`.
 Si se van a soportar varios idiomas hay que preparar un archivo por idioma. Para saber cómo establecer un idioma de interfaz de usuario, consultar
 la opción `locale` del constructor de {{#crossLink "SITNA.Map"}}{{/crossLink}}.

La maquetación por defecto añade los siguientes controles al conjunto por defecto: {{#crossLink "SITNA.cfg.MapControlOptions/navBar:property"}}{{/crossLink}},
{{#crossLink "SITNA.cfg.MapControlOptions/basemapSelector:property"}}{{/crossLink}}, {{#crossLink "SITNA.cfg.MapControlOptions/TOC:property"}}{{/crossLink}},
{{#crossLink "SITNA.cfg.MapControlOptions/legend:property"}}{{/crossLink}}, {{#crossLink "SITNA.cfg.MapControlOptions/scaleBar:property"}}{{/crossLink}},
{{#crossLink "SITNA.cfg.MapControlOptions/search:property"}}{{/crossLink}}, {{#crossLink "SITNA.cfg.MapControlOptions/measure:property"}}{{/crossLink}},
{{#crossLink "SITNA.cfg.MapControlOptions/overviewMap:property"}}{{/crossLink}} y {{#crossLink "SITNA.cfg.MapControlOptions/popup:property"}}{{/crossLink}}.
Puede [descargar la maquetación por defecto](../../tc/layout/responsive/responsive.zip).

### Soporte multiidioma

La API soporta actualmente tres idiomas: castellano, euskera e inglés. Para saber cómo establecer un idioma de interfaz de usuario, consultar la opción
`locale` del constructor de {{#crossLink "SITNA.Map"}}{{/crossLink}}. Los textos específicos para cada idioma se guardan en archivos `*.json`,
donde `*` es el código IETF del idioma de la interfaz de usuario, dentro de la subcarpeta resources en la dirección donde se aloja la API SITNA.
Por ejemplo, los textos en castellano se guardan en `resources/es-ES.json`. Estos archivos contienen un diccionario en formato JSON de pares clave/valor,
siendo la clave un identificador único de cadena y el valor el texto en el idioma elegido.

Para añadir soporte multiidioma a la maquetación, hay que crear un archivo de recursos de texto para cada idioma soportado y colocarlo en la subcarpeta
`resources` dentro de la carpeta de maquetación. Este diccionario se combinará con el diccionario de textos propio de la API.

Por otro lado, la plantilla contenida en `markup.html` puede tener identificadores de cadena de texto entre dobles llaves. La API
sustituirá estos textos por los valores del diccionario correspondiente al idioma de la interfaz de usuario.

Finalmente, hay que activar el soporte multiidioma añadiendo a config.json una clave `"i18n": true`.

@module 2. Configuración
@submodule 2.2. Maquetación
 */

/**
Al instanciar {{#crossLink "SITNA.Map"}}{{/crossLink}} se le puede pasar como parámetro un objeto de opciones con la estructura de la clase [SITNA.Cfg](../classes/SITNA.Cfg.html):
#### Ejemplo:
```javascript
var map = new SITNA.Map("mapa", {
  crs: "EPSG:4326",
  initialExtent: [
    -2.84820556640625,
    41.78912492257675,
    -0.32135009765625,
    43.55789822064767
  ]
});
```
@module 2. Configuración
@submodule 2.1. Parámetros del constructor
 */


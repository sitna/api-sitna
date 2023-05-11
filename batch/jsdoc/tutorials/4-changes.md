### [4.0.0](https://github.com/sitna/api-sitna/releases/tag/v4.0.0)
- Añadido espacio de nombres {@link SITNA.feature} con las clases que representan entidades geográficas.
- Añadido espacio de nombres {@link SITNA.layer} con las clases que representan capas del mapa.
- Añadida herramienta para eliminar vértices de entidades geográficas dibujadas previamente.
- Añadidas las capas OpenTopoMap y ortofoto 2022 a la [lista de capas disponibles]{@linkplain SITNA.Consts}.
- Añadido operador "no es igual a" para cadenas en el [control de consultas WFS]{@linkplain SITNA.control.WFSQueryOptions}.
- Cambios de clases CSS para paliar interferencias con CSS de terceros.
- Corrección de errores.

### [3.0.1](https://github.com/sitna/api-sitna/releases/tag/v3.0.1)
- Corrección de dependencias de proyecto.
- Añadido código necesario para la compilación del proyecto.
- Corrección de error en el generador de documentación.

### [3.0.0](https://github.com/sitna/api-sitna/releases/tag/v3.0.0)
- Añadida clase {@link SITNA.feature.Marker} para representar marcadores en un mapa.
- Añadido control `download` para descarga de mapas.
- Añadido control `drawMeasureModify` de [dibujo y medición]{@linkplain SITNA.control.DrawMeasureModifyOptions}.
- Añadido control `WFSEdit` de [edición por medio de servicios WFS]{@linkplain SITNA.control.WFSEditOptions}.
- Añadido control `share` para compartir mapa.
- Añadido control `geolocation` para [geoposicionamiento]{@linkplain SITNA.control.GeolocationOptions}.
- Añadido control `offlineMapMaker` que permite [crear mapas que son utilizables sin conexión a Internet]{@linkplain SITNA.control.OfflineMapMakerOptions}.
- Añadido control `fullScreen` para la visualización a pantalla completa.
- Añadido control `threed` para la visualización en 3D sobre un globo terráqueo.
- Añadido control `multiFeatureInfo` para la obtención de información de entidades geográficas.
[a través de tres tipos de filtros espaciales]{@linkplain SITNA.control.MultiFeatureInfoOptions}: punto, línea y recinto.
- El control de búsquedas permite la búsqueda por carretera y punto kilométrico.
- Añadida la opción de configurar qué capa de fondo se utilizará en el mapa de situación según qué capa de fondo está en el mapa principal.
- Añadido el estilo de mapa de calor para capas vectoriales.
- Añadidos métodos para la obtención del [CRS]{@linkplain SITNA.Map#getCrs}, la [extensión actual]{@linkplain SITNA.Map#getExtent} y 
la [extensión máxima]{@linkplain SITNA.Map#getMaxExtent} del mapa.
- Cambios de CSS para favorecer la incrustación de mapas sin interferencia de estilos.
- Eliminada la dependencia del motor de plantillas *dust*.
- Eliminada la variante de carga bajo demanda de la API SITNA.
- Actualización a OpenLayers 6.
- Corrección de errores.

### [2.2.1](https://github.com/sitna/api-sitna/releases/tag/v2.2.1)
- Añadida la ortofoto 2021 a la [lista de capas disponibles]{@linkplain SITNA.Consts}.
- Corrección de errores.

### [2.2.0](https://github.com/sitna/api-sitna/releases/tag/v2.2.0)

- Añadida la ortofoto 2020 a la [lista de capas disponibles]{@linkplain SITNA.Consts}.
- Añadida la ortofoto 2020 de la comarca de Pamplona a la [lista de capas disponibles]{@linkplain SITNA.Consts}.
- Añadida herramienta para obtener datos de elevación de entidades puntuales. Si estas tienen datos de elevación, se muestran junto con las obtenidas de servicios MDT.
- Añadida herramienta para obtener perfil de elevación de entidades lineales. Si estas tienen datos de elevación, se permite la representación simultánea de perfiles de elevaciones propias y obtenidas de servicios MDT.
- Definida [convención de nombres de atributo de entidad](tutorial-4-embedding.html) para incrustar imágenes, vídeos y otros recursos. Se utiliza 
esa convención para mostrar esos elementos en tablas de atributos y de resultados de consulta.
- Añadidas notificaciones para ayudar a impedir interrupción de grabación del track.
- Mejorada la importación de archivos replicando las capas en las que están organizadas las entidades dentro del archivo.
- Mejorada la representación de fechas y horas respetando el formato local en tablas de atributos y resultados de consulta WFS.
- Añadida capacidad de ordenar resultados por columna en las consultas WFS.
- Añadida capacidad de compartir consulta WFS.
- Corrección de errores.

### [2.1.0](https://github.com/sitna/api-sitna/releases/tag/v2.1.0)

- Añadido el control de [consultas]{@linkplain WFSQueryOptions}.
- Rediseño de la interfaz de usuario del control de capas cargadas.
- Añadidas herramientas a los controles de información de entidades del mapa: mostrar, borrar, descargar y hacer zoom a todos los resultados.
- Cambiado el motor de plantillas a Handlebars.
- Corrección de errores.

### [2.0.1](https://github.com/sitna/api-sitna/releases/tag/v2.0.1)

- Añadida la ortofoto 2019 a la [lista de capas disponibles]{@linkplain SITNA.Consts}.
- Corrección de errores.

### [2.0.0](https://github.com/sitna/api-sitna/releases/tag/v2.0.0)

- Eliminadas todas las referencias a OpenLayers 2.
- Eliminada la dependencia de jQuery.
- Se retira el soporte a Internet Explorer.
- Corrección de errores.

### [1.6.0](https://github.com/sitna/api-sitna/releases/tag/v1.6.0)

- Añadida capacidad de compartir entidades vectoriales.
- Cambiada interfaz de usuario del control de información del mapa.
- Añadido control de dibujo y medida.
- Añadido control con herramientas para aplicar a una entidad geográfica: zoom, compartir, descargar, borrar.
- Corrección de errores.

### [1.5.1](https://github.com/sitna/api-sitna/releases/tag/v1.5.1)

- Cambiada la interfaz de usuario del control de mapas de fondo para mostrar una preselección de mapas.
- Corrección de errores.

### [1.5.0](https://github.com/sitna/api-sitna/releases/tag/v1.5.0)

- Añadido el control de catálogo de capas.
- Añadido el control de administración de capas de trabajo.
- Añadido el control para añadir datos geográficos externos.
- Añadido el control de impresión de mapas en PDF.
- Las capas de tipo [vectorial]{@linkplain SITNA.Consts.layerType.VECTOR} soportan más formatos de archivos geográficos.
- Se ha eliminado la limitación de extensión máxima por defecto del mapa.
- Corrección de errores.

### [1.4.0](https://github.com/sitna/api-sitna/releases/tag/v1.4.0)

- Añadida la capacidad de cambiar la proyección del mapa.
- Añadidos mapas de fondo de OpenStreetMap, Carto y Mapbox.
- Mejora de soporte a peticiones CORS.
- Corrección de errores.

### [1.3.0](https://github.com/sitna/api-sitna/releases/tag/v1.3.0)

- Añadida opción de clustering para capas de puntos.
- Añadido soporte multiidioma.
- El control de búsqueda soporta nuevos tipos de búsqueda: vías, direcciones postales y parcelas catastrales.
- Mejora de soporte a peticiones CORS.
- Corrección de errores.

### [1.2.2](https://github.com/sitna/api-sitna/releases/tag/v1.2.2)

- Actualización a OpenLayers 4.
- Corrección de errores.

### [1.2.1](https://github.com/sitna/api-sitna/releases/tag/v1.2.1)

- Corrección de errores.

### [1.2.0](https://github.com/sitna/api-sitna/releases/tag/v1.2.0)

- Añadida la capacidad de exportar el mapa a una imagen.
- Añadido a la documentación ejemplo de exportación de imagen.
- El control `featureInfo` permite compartir entidades geográficas o descargarlas en distintos formatos.
- Corrección de errores.

### 1.1.3

- Añadidos a la clase {@link SITNA.Map} métodos de consulta y visualización de entidades geográficas.
- Añadidos ejemplos a la documentación para los métodos anteriores.
- Mejorada la interfaz del control de búsquedas añadiendo a los resultados distinción por tipo.
- Añadido registro centralizado de errores JavaScript.
- Corrección de errores.

### 1.1.2

- El control `featureInfo` pasa a estar incluido por defecto en el mapa.
- La [página de incrustación de visores con KML](//sitna.tracasa.es/kml/) pasa a usar OpenLayers 3.
- Correción de errores de la [página de incrustación de visores con KML](//sitna.tracasa.es/kml/).
- Añadido ejemplo a la documentación de {@link ClickOptions}.
- Añadido ejemplo a la documentación de {@link CoordinatesOptions}.
- Mejorada con botones triestado la usabilidad del control de medición.
- Añadido indicador de carga de los elementos del visor.
- Añadido registro centralizado de errores JavaScript.
- Corrección de errores.

### 1.1.1

- Añadido el control de Google StreetView.
- Añadido el control de gestión de clics en el mapa.
- Añadidas [opciones]{@linkplain CoordinatesOptions} de representación de coordenadas en el control `coordinates`.
- Compatibilidad mejorada con dispositivos móviles.
- Mejoras de rendimiento en el layout por defecto.
- Mejoras en la documentación.
- Corrección de errores.

### 1.1.0

- Mejoras en el control `featureInfo`: visualización de geometrías
 de las entidades geográficas, bocadillo arrastrable.
- Se retira el soporte a OpenLayers 2.
- Corrección de errores.

### 1.0.6

- Añadido el control de información de entidades basado en la petición `getFeatureInfo` de WMS, activable con la propiedad
 `featureInfo` en {@link MapControlOptions}.
- Añadidas las opciones de zoom al método {@link SITNA.Map#zoomToMarkers}: radio del
 área alrededor del marcador a mostrar y margen a dejar en los bordes.
- Corregido error en el layout por defecto que impedía la funcionalidad de deslizar dedo para colapsar paneles.

### 1.0.5

- Corregido error que impedía en ver en la tabla de contenidos si una capa cargada es visible a la escala actual.
- Corregido error que impedía que se pudieran ocultar desde la tabla de contenidos todas las entidades de una capa [KML]{@linkplain SITNA.Consts.layerType.KML}.
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

- Añadida la opción de deshabilitar el zoom en el mapa con la rueda de ratón mediante la propiedad `mousewWheelZoom` de {@link SITNA.MapOptions}.
- Añadida la posibilidad de mostrar un marcador con su bocadillo de información asociada visible por defecto, mediante la propiedad `showPopup` de {@link MarkerOptions}.
- Corrección de errores.

### 1.0

- Despliegue inicial.
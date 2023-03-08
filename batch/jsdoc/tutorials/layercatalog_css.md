A continuación se describen todas las clases CSS que definen la estructura y/o afectan el comportamiento y aspecto del control
`layerCatalog`.

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

``` html
<div id="catalog" class="tc-ctl tc-ctl-lcat">
 <h2>Capas disponibles<button class="tc-ctl-lcat-btn-search" title="Buscar capas por texto"></button></h2>
 <div class="tc-ctl-lcat-search tc-hidden tc-collapsed">
   <div class="tc-group"><input type="search" class="tc-ctl-lcat-input tc-textbox" placeholder="Texto para buscar en las capas"></div>
   <ul></ul>
 </div>
 <div class="tc-ctl-lcat-tree">
   <ul class="tc-ctl-lcat-branch">
	 <li class="tc-ctl-lcat-node" data-layer-name="" data-layer-uid="10"><span>IDENA</span>
	   <ul class="tc-ctl-lcat-branch">
		 <li class="tc-ctl-lcat-node tc-collapsed" data-layer-name="nombresGeograficos" data-layer-uid="656"><span data-tooltip="Pulse para añadir al mapa" class="tc-selectable">Nombres geográficos</span><button class="tc-ctl-lcat-btn-info"></button>
		   <ul class="tc-ctl-lcat-branch tc-collapsed">
			 <li class="tc-ctl-lcat-node tc-collapsed" data-layer-name="IDENA:toponimia" data-layer-uid="657"><span data-tooltip="Pulse para añadir al mapa" class="tc-selectable">Toponimia</span><button class="tc-ctl-lcat-btn-info"></button>
			   <ul class="tc-ctl-lcat-branch tc-collapsed">
				 <li class="tc-ctl-lcat-node tc-ctl-lcat-leaf" data-layer-name="IDENA:TOPONI_Txt_Toponimos" data-layer-uid="658"><span data-tooltip="Pulse para añadir al mapa" class="tc-selectable">Nombres de lugar (topónimos)</span><button class="tc-ctl-lcat-btn-info"></button>
				   <ul class="tc-ctl-lcat-branch tc-collapsed"></ul>
				 </li>
			   </ul>
			 </li>
		   </ul>
		 </li>
	   </ul>
	 </li>
	 <li class="tc-ctl-lcat-node tc-collapsed" data-layer-name="" data-layer-uid="962"><span>IGN - Unidades administrativas</span>
	   <ul class="tc-ctl-lcat-branch tc-collapsed">
		 <li class="tc-ctl-lcat-node tc-ctl-lcat-leaf" data-layer-name="AU.AdministrativeBoundary" data-layer-uid="963"><span data-tooltip="Pulse para añadir al mapa" class="tc-selectable">Límite administrativo</span><button class="tc-ctl-lcat-btn-info"></button>
		   <ul class="tc-ctl-lcat-branch tc-collapsed"></ul>
		 </li>
		 <li class="tc-ctl-lcat-node tc-ctl-lcat-leaf" data-layer-name="AU.AdministrativeUnit" data-layer-uid="964"><span data-tooltip="Pulse para añadir al mapa" class="tc-selectable">Unidad administrativa</span><button class="tc-ctl-lcat-btn-info"></button>
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

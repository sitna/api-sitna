Cuando se instancia un mapa, se carga una maquetación que establece qué datos se cargan, qué controles y en que distribución se muestran, y qué estilo va a tener el visor. La API SITNA tiene una maquetación definida por defecto, pero esto se puede cambiar utilizando la opción layout:
### Ejemplo básico

``` javascript
var map = new SITNA.Map("mapa", {
  layout: "layouts/mylayout"
});
```

El valor de esa opción es una ruta a una carpeta, donde se encontrarán todos o alguno de los siguientes archivos:

* `markup.html`, con la plantilla HTML que se inyectará en el elemento del DOM del mapa.
* `config.json`, con un [objeto]{@linkplain MapOptions} JSON que sobreescribirá propiedades de {@link SITNA.Cfg}.
* `style.css`, para personalizar el estilo del visor y sus controles.
* `script.js`, para añadir lógica nueva. Este es el lugar idóneo para la lógica de la nueva interfaz definida por el marcado inyectado con markup.html.
* `resources/*.json`, donde `*` es el código IETF del idioma que tendrá la interfaz de usuario, por ejemplo `resources/es-ES.json`. Si se van a soportar varios idiomas hay que preparar un archivo por idioma. Para saber cómo establecer un idioma de interfaz de usuario, consultar la opción locale del constructor de {@link SITNA.Map}.

La maquetación por defecto añade los siguientes controles al conjunto por defecto: navBar, basemapSelector, TOC, legend, scaleBar, search, streetView , measure, overviewMap y popup. Puede descargar la maquetación por defecto.

### Soporte multiidioma

La API soporta actualmente tres idiomas: castellano, euskera e inglés. Para saber cómo establecer un idioma de interfaz de usuario, consultar la opción locale del constructor de {@link SITNA.Map}. Los textos específicos para cada idioma se guardan en archivos *.json, donde * es el código IETF del idioma de la interfaz de usuario, dentro de la subcarpeta resources en la dirección donde se aloja la API SITNA. Por ejemplo, los textos en castellano se guardan en _resources/es-ES.json_. Estos archivos contienen un diccionario en formato JSON de pares clave/valor, siendo la clave un identificador único de cadena y el valor el texto en el idioma elegido.

Para añadir soporte multiidioma a la maquetación, hay que crear un archivo de recursos de texto para cada idioma soportado y colocarlo en la subcarpeta resources dentro de la carpeta de maquetación. Este diccionario se combinará con el diccionario de textos propio de la API.

Por otro lado, la plantilla contenida en `markup.html` puede tener identificadores de cadena de texto entre dobles llaves. La API sustituirá estos textos por los valores del diccionario correspondiente al idioma de la interfaz de usuario.

Finalmente, hay que activar el soporte multiidioma añadiendo a `config.json` una clave `"i18n": true`.

### Ejemplos de archivos de maquetación
#### markup.html
``` HTML
<!-- layout/example/markup.html -->
<div id="controls">
    <h1></h1>
    <div id="toc" />
    <div id="legend" />
</div>
<div id="languages">
    <a class="lang" href="?lang=es-ES" title="">ES</a>
    <a class="lang" href="?lang=eu-ES" title="">EU</a>
    <a class="lang" href="?lang=en-US" title="">EN</a>
</div>
```
#### resources/es-ES.json
``` javascript
{
    "stJamesWayInNavarre": "Camino de Santiago en Navarra",
    "spanish": "castellano",
     "basque": "euskera",
    "english": "inglés"
}
```
#### resources/eu-ES.json
``` javascript
{
    "stJamesWayInNavarre": "Nafarroan Donejakue bidea",
    "spanish": "gaztelania",
    "basque": "euskara",
    "english": "ingelesa"
}
```
#### resources/en-US.json
``` javascript
{
    "stJamesWayInNavarre": "St. James' Way in Navarre",
    "spanish": "spanish",
    "basque": "basque",
    "english": "english"
}
``` 

 Puede consultar el [en vivo](../examples/Cfg.layout.html) el resultado de aplicar la maquetación del ejemplo, cuyos archivos pueden descargarse aquí:
 [markup.html](../examples/layout/example/markup.html), [config.json](../examples/layout/example/config.json),
 [style.css](../examples/layout/example/style.css), [resources/es-ES.json](../examples/layout/example/resources/es-ES.json),
 [resources/eu-ES.json](../examples/layout/example/resources/eu-ES.json) y [resources/en-US.json](../examples/layout/example/resources/en-US.json).
 
# Introducción
Esta es la documentación de referencia de la API SITNA, una API JavaScript para el desarrollo de mapas interactivos de manera sencilla.

## Cómo empezar a usar la API SITNA
Para empezar a usar la API, basta seguir estos tres pasos: primero hay que añadir en la página una etiqueta <code>script</code> con la dirección de la API:
``` HTML
<script src="//sitna.navarra.es/api/"></script>
```

A continuación, añade un elemento HTML a la página donde se va a crear el visor geográfico:
``` HTML
<div id="mapa"></div>
```

Finalmente, en un script de la página instanciar un objeto de la clase {@link SITNA.Map}, pasándole como parámetro el 
identificador creado en el paso anterior:
``` javascript
var map = new SITNA.Map("mapa");
```

El resultado es el siguiente:

<iframe class="example" src="../examples/getting-started.html"></iframe>

A lo largo de la documentación hay ejemplos comentados con enlaces a su versión funcional online. Es recomendable abrir el código fuente de 
estas versiones funcionales para ver el ejemplo completo.

## Cómo usar versiones anteriores
La dirección [https://sitna.navarra.es/api/](https://sitna.navarra.es/api/) siempre tendrá la última versión disponible 
de la API SITNA. Si se desea utilizar una versión anterior, esta deberá descargarse de [GitHub](https://github.com/sitna/api-sitna/releases). 

La [lista de versiones de la API SITNA]{@tutorial 4-changes} de esta documentación contiene enlaces a todas las 
versiones disponibles. En la página de la versión **x.y.z**, descargar el archivo `api-sitna-vx.y.z-build.zip` 
correspondiente y descomprimir el contenido en una carpeta accesible para la aplicación que estemos desarrollando.

Para las versiones a partir de la **3.0.0**, el archivo que hay que enlazar desde la aplicación es `sitna.js`.
En las versiones desde la **1.3.0** hasta la **2.2.1**, este archivo debe ser `sitna.ol.min.js`.
En versiones anteriores a la **1.3.0** el archivo es `sitna.ol3.min.js`.

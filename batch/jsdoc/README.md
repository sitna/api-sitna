# Introducción
Esta es la documentación de referencia de la API SITNA, una API JavaScript para el desarrollo de mapas interactivos de manera sencilla.

## Cómo empezar a usar la API SITNA
Para empezar a usar la API, basta seguir estos tres pasos: primero hay que añadir en la página una etiqueta <code>script</code> con la dirección de la API:
``` HTML
<script src="//sitna.tracasa.es/api/"></script>
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

La dirección principal de acceso a la API es [//sitna.tracasa.es/api/](//sitna.tracasa.es/api/). No obstante, hay otras direcciones disponibles para otras necesidades concretas:

* Lógica de la API compilada en un solo archivo:
	- Minimizada: [//sitna.tracasa.es/api/sitna.ol.min.js](//sitna.tracasa.es/api/sitna.ol.min.js).
	- Sin minimizar: [//sitna.tracasa.es/api/sitna.ol.debug.js](//sitna.tracasa.es/api/sitna.ol.debug.js).

* Lógica de la API repartida en varios archivos que se solicitan bajo demanda:
	- Minimizada: [//sitna.tracasa.es/api/sitna.min.js](//sitna.tracasa.es/api/sitna.min.js).
	- Sin minimizar: [//sitna.tracasa.es/api/sitna.js](//sitna.tracasa.es/api/sitna.js).

Se puede observar que todas las direcciones omiten el indicador de protocolo (`http:` o `https:`). Esto es a propósito: así se hace que la API se cargue con el mismo protocolo que la página que la utiliza.

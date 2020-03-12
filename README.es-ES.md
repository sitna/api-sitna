# API SITNA
API JavaScript para la visualización de datos georreferenciados en aplicaciones web.

*Read this in [English](./README.md).*

## Documentación
http://sitna.navarra.es/api/doc/

## Sobre la API SITNA
La API SITNA es una API JavaScript que permite incluir en páginas y aplicaciones web un visor de mapas interactivo y así representar información georreferenciada.

Es un producto SITNA desarrollado para su uso en aplicaciones web de Gobierno de Navarra, pero puede ser utilizado por cualquier usuario y organización en sus páginas web.

Entre otras capacidades, la API SITNA:
- Ofrece funciones habituales de navegación de los visores de mapas, como zoom, mapa de situación y herramientas de medición.
- Permite buscar un municipio de Navarra por su denominación, una dirección, una parcela catastral o un punto por sus coordenadas, entre otras opciones.
- Tiene una configuración por defecto que permite de manera fácil crear un mapa básico de Navarra, con herramientas de uso común y mapas de fondo procedentes de IDENA, como ortofotos, el mapa base, la cartografía topográfica o el catastro.
- Es posible añadir información geográfica mediante servicios WMS y WMTS.
- Permite crear marcadores puntuales con información asociada.
- También es posible cargar información geográfica desde un fichero en formato KML, GeoJSON u otros.

Este es el aspecto del mapa básico que se obtiene con la configuración por defecto de la API SITNA ([ver en vivo](http://sitna.tracasa.es/api/examples/Map.1.html)).

![Captura de pantalla de un visor básico](https://sitna.navarra.es/geoportal/galeria/ejemploAPI1.jpg)

La API está basada en diversas bibliotecas JavaScript de terceros, pero está completamente autocontenida y simplemente cargando en la página el script de la API se cargan dinámicamente los recursos que necesita. El objetivo ha sido facilitar su uso para un desarrollador sin grandes conocimientos GIS.

Con el fin de facilitar la comprensión de la API consulte la documentación y ejemplos disponibles en [este recurso](http://sitna.navarra.es/api/doc/).

- [Manual de usuario](https://sitna.navarra.es/geoportal/recursos/Manual%20usuario%20Visor%20API%20SITNA.pdf) del visor geográfico de la API SITNA.
- [Manual técnico de uso](http://sitna.navarra.es/api/doc/) de la API SITNA.

## Sitios web desarrollados con la API SITNA
Puede acceder a una lista de sitios web que contienen visores desarrollados con la API SITNA en [este documento](./websites.es-ES.md).

## Hoja de ruta
Consultar [aquí](./roadmap.es-ES.md).

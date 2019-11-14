# API SITNA
JavaScript API for georeferenced data viewing in web applications.

*Leer esto en [español](./README.es-ES.md).*

## Documentation (in Spanish)
http://sitna.navarra.es/api/doc/

## About API SITNA
API SITNA is a JavaScript API that enables us to include an interactive map viewer, representing geographically referenced information, in web pages and web application.

This SITNA product has been developed to be used in the web applications of the Government of Navarra. However it can be used by any user or organization in their web pages.

Among other, API SITNA provides the following functionalities:

- It provides navigation tools included in common map viewers, such as zoom, location map and basic measuring tools.
- It allows you to search for a municipality in Navarre by its name, an address, a cadastral parcel or a point by its coordinates, among other options.
- Its default configuration facilitates the creation of a basic map of Navarra with common tools and background maps from IDENA, such as ortophotos, a base map, topographic mapping or cadastre.
- Geographic information can be added through WMS and WMTS services.
-It creates specific markers with associated information.
- Geographical information can be uploaded from a file in KML, GeoJSON or other formats.

This is the aspect of a basic map that it has been created with the default configuration of API SITNA ([see live](http://sitna.tracasa.es/api/examples/Map.1.html)).

![Screenshot of a basic viewer](https://sitna.navarra.es/geoportal/galeria/ejemploAPI1.jpg)

The API is based on various third-party JavaScript libraries, but it is completely self-contained. All the related resources are dynamically loaded by simply inserting the API script in the page. This development approach had as main goal to make it accessible for a developer with a limited GIS knowledge.

Some documentation and examples have been developed and made available [here](http://sitna.navarra.es/api/doc/) in order to facilitate the understanding of the presented API.

- API SITNA geographical viewer's [user manual](https://sitna.navarra.es/geoportal/recursos/Manual%20usuario%20Visor%20API%20SITNA.pdf).
- API SITNA's [technical utilization manual](http://sitna.navarra.es/api/doc/).

## Websites developed with API SITNA
You can get to a list of websites that have been developed with API SITNA in [this document](./websites.md).

## Roadmap
See [here](./roadmap.md).

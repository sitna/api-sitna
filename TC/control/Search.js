
/**
  * Opciones de control de búsquedas. La configuración por defecto tiene como origen de datos el WFS de IDENA. 
  * Es posible establecer un origen de datos distinto en el que consultar, para ello en lugar de asignar un booleano a la propiedad, que activa o desactiva la búsqueda, 
  * se asignará un objeto con las propiedades a sobrescribir. Las propiedades a sobrescribir no siempre serán las mismas, variarán en función de la configuración que tenga la búsqueda que se quiera modificar.
  * @typedef SearchOptions
  * @extends SITNA.control.ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {boolean|SITNA.control.CadastralSearchOptions} [cadastralParcel=true] - Esta propiedad activa/desactiva la búsqueda de parcelas catastrales en el buscador del mapa. Formato: municipio, polígono, parcela.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link CadastralSearchOptions}.
  *
  * @property {boolean} [coordinates=true] - Esta propiedad activa/desactiva la localización de coordenadas en Sistema de Referencia ETRS89, bien UTM Huso 30 Norte (EPSG:25830) o latitud-longitud (EPSG:4258, EPSG:4326 o CRS:84) en el buscador del mapa.
  * @property {string} [instructions="Buscar municipio, casco urbano, calle, dirección, referencia catastral, coordenadas UTM o latitud-longitud"] - Esta propiedad establece el atributo `title` del cajetín y del botón del buscador del mapa.
  * @property {boolean|SITNA.control.MunicipalitySearchOptions} [municipality=true] - Esta propiedad activa/desactiva la búsqueda de municipios en el buscador del mapa.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link MunicipalitySearchOptions}.
  * @property {boolean|SITNA.control.PlaceNameSearchOptions} [placeName=false] - Esta propiedad activa/desactiva la búsqueda de topónimos en el buscador del mapa.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link PlaceNameSearchOptions}.
  * @property {boolean|SITNA.control.PlaceNameMunicipalitySearchOptions} [placeNameMunicipality=false] - Esta propiedad activa/desactiva la búsqueda de topónimo en un municipio en el buscador del mapa. Formato: municipio, topónimo.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link PlaceNameMunicipalitySearchOptions}.
  * @property {boolean|SITNA.control.PostalAddressSearchOptions} [postalAddress=true] - Esta propiedad activa/desactiva la búsqueda de direcciones postales en el buscador del mapa. Formato: entidad de población, vía, portal.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link PostalAddressSearchOptions}.
  * @property {boolean|SITNA.control.RoadSearchOptions} [road=false] - Esta propiedad activa/desactiva la búsqueda de carreteras en el buscador del mapa.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link RoadSearchOptions}.
  * @property {boolean|SITNA.control.RoadMilestoneSearchOptions} [roadMilestone=false] - Esta propiedad activa/desactiva la búsqueda de punto kilométrico en una carretera en el buscador del mapa. Formato: carretera, pk.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link RoadMilestoneSearchOptions}.
  * @property {boolean|SITNA.control.StreetSearchOptions} [street=true] - Esta propiedad activa/desactiva la búsqueda de vías en el buscador del mapa.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link StreetSearchOptions}.
  * @property {boolean|SITNA.control.UrbanAreaSearchOptions} [town=true] - Esta propiedad activa/desactiva de cascos urbanos en el buscador del mapa.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link UrbanAreaSearchOptions}.
  * @example <caption>[Ver en vivo](../examples/cfg.SearchOptions.html)</caption> {@lang html}
  * <div id="mapa"></div>    
  * <script>
  *     // Creamos un mapa con el control de búsquedas. 
  *     // Configuramos el buscador desactivando la búsqueda de parcelas y la localización de coordenadas.
  *     // Indicamos un placeHolder y tooltip (propiedad "instructions") acorde con las búsquedas configuradas.
  *     var map = new SITNA.Map("mapa", {
  *         controls: {
  *             search: {
  *                 coordinates: false,
  *                 cadastralParcel: false,
  *                 municipality: true,
  *                 town: true,
  *                 street: true,
  *                 postalAddress: true,
  *                 placeHolder: "Municipio, casco urbano, calle o portal",
  *                 instructions: "Buscar municipio, casco urbano, calle o portal"
  *             }
  *         }
  *     });
  * </script>
  */


/**
  * Opciones de configuración del origen de datos de la búsqueda de parcelas catastrales.
  * @typedef CadastralSearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría de la parcela catastral.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts}, 
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}.
  * @property {CadastralSearchOptionsExt} municipality - Definición de la fuente de datos para la búsqueda de parcela por nombre de municipio en lugar de por código del mismo.
  * @property {SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de parcelas.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a las siguientes propiedades:
  * - `firstQueryWord`: se indicará el campo o campos en los que buscar el código de municipio.
  * - `secondQueryWord`: se indicará el campo o campos en los que buscar el polígono.
  * - `thirdQueryWord`: se indicará el campo o campos en los que buscar la parcela.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto,
  * deberá haber tantas instancias como capas definidas en `featureType`.
  * 
  * No está disponible `cluster`.
  * @property {SearchSuggestionHeaderOptions} suggestionListHead - Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {string} url - Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs)).
  * @example <caption>[Ver en vivo](../examples/Cfg.SearchCadastralSource.html)</caption> {@lang html}
    <div id="mapa"></div>
    <script>
        var map = new SITNA.Map("mapa", {
            controls: {
                search: {
                    placeHolder: 'Parcela catastral', // Texto que se mostrará en el cajetín de búsqueda.
                    instructions: 'Buscar parcela catastral', // Texto que se mostrará como tooltip del botón buscar.
                    cadastralParcel: { // Objeto de configuración del origen de datos en el cual buscar las parcelas catastrales.
                        url: '//idena.navarra.es/ogc/wfs', // Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`.En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['CATAST_Pol_ParcelaUrba', 'CATAST_Pol_ParcelaRusti', 'CATAST_Pol_ParcelaMixta'], // Colección con el nombre de las capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        municipality: { // Definición de la fuente de datos para la búsqueda de parcela por nombre de municipio en lugar de por código del mismo.
                            featureType: 'CATAST_Pol_Municipio', // Colección de nombre de capa a consultar.
                            labelProperty: 'MUNICIPIO', // Nombre de campo en el que buscar el texto indicado.
                            idProperty: 'CMUNICIPIO' // Nombre de campo que identifica unívocamente el municipio cuyos valores deben coincidir con los posibles valores del campo indicado en firstQueryWord.
                        },
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de parcelas.
                            firstQueryWord: 'CMUNICIPIO', // Campo en el que buscar el código de municipio.
                            secondQueryWord: 'POLIGONO', // Campo en el que buscar el polígono.
                            thirdQueryWord: 'PARCELA' // Campo en el que buscar la parcela.
                        },
                        suggestionListHead: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            label: "search.list.cadastral", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Parcela catastral
                            color: [ // En este caso la consulta se hace sobre varias capas. Con el siguiente objeto se define el color de los resultados de la búsqueda de cada capa. Estos colores también se mostrarán en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
                                {
                                    CATAST_Pol_ParcelaUrba: { // Nombre de capa presente en la propiedad `featureType`.
                                        title: "search.list.cadastral.urban", // Clave del diccionario de traducciones a mostrar como literal en la lista de sugerencias que indentificará a los resultados obtenidos de la capa CATAST_Pol_ParcelaUrba.
                                        color: { // Definición del color con el que se dibujará los resultados de la búsqueda en el mapa. Este color también se mostrará en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
                                            geomType: "polygon", // Nombre del tipo de geometría presente en `styles` en la cual buscar la propiedad `css`.
                                            css: "strokeColor" // Nombre de la propiedad de los estilos de la cual extraer el color.
                                        }
                                        // El resultado de la configuración anterior será: '#136278'
                                    }
                                },
                                {
                                    CATAST_Pol_ParcelaRusti: { // Nombre de capa presente en la propiedad `featureType`.
                                        title: "search.list.cadastral.rustic", // Clave del diccionario de traducciones a mostrar como literal en la lista de sugerencias que indentificará a los resultados obtenidos de la capa CATAST_Pol_ParcelaRusti.
                                        color: { // Definición del color con el que se dibujará los resultados de la búsqueda en el mapa. Este color también se mostrará en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
                                            geomType: "polygon", // Nombre del tipo de geometría presente en `styles` en la cual buscar la propiedad `css`.
                                            css: "strokeColor" // Nombre de la propiedad de los estilos de la cual extraer el color.
                                        }
                                        // El resultado de la configuración anterior será: '#0C8B3D'
                                    }
                                },
                                {
                                    CATAST_Pol_ParcelaMixta: { // Nombre de capa presente en la propiedad `featureType`.
                                        title: "search.list.cadastral.mixed", // Clave del diccionario de traducciones a mostrar como literal en la lista de sugerencias que indentificará a los resultados obtenidos de la capa CATAST_Pol_ParcelaMixta.
                                        color: { // Definición del color con el que se dibujará los resultados de la búsqueda en el mapa. Este color también se mostrará en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
                                            geomType: "polygon", // Nombre del tipo de geometría presente en `styles` en la cual buscar la propiedad `css`.
                                            css: "strokeColor" // Nombre de la propiedad de los estilos de la cual extraer el color.
                                        }
                                        // El resultado de la configuración anterior será: '#E5475F'
                                    }
                                }
                            ]
                        },
                        styles: [ //  Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                polygon: { // Opciones de estilo de polígono para los resultados obtenidos de la capa CATAST_Pol_ParcelaUrba.
                                    fillColor: '#000000', // Color de relleno, representado en formato hex triplet (`#RRGGBB`).
                                    fillOpacity: 0.1, // Opacidad de relleno, valor de 0 a 1.
                                    strokeColor: '#136278', // Color de trazo de los lados del polígono, representado en formato hex triplet (`#RRGGBB`).
                                    strokeWidth: 2, // Anchura de trazo en de los lados del polígono.
                                    strokeOpacity: 1 // Opacidad de trazo de los lados del polígono, valor de 0 a 1.
                                }
                            },
                            {
                                polygon: { // Opciones de estilo de polígono para los resultados obtenidos de la capa CATAST_Pol_ParcelaRusti.
                                    fillColor: '#000000', // Color de relleno, representado en formato hex triplet (`#RRGGBB`).
                                    fillOpacity: 0.1, // Opacidad de relleno, valor de 0 a 1.
                                    strokeColor: '#0c8b3d', // Color de trazo de los lados del polígono, representado en formato hex triplet (`#RRGGBB`).
                                    strokeWidth: 2, // Anchura de trazo en de los lados del polígono.
                                    strokeOpacity: 1 // Opacidad de trazo de los lados del polígono, valor de 0 a 1.
                                }
                            },
                            {
                                polygon: { // Opciones de estilo de polígono para los resultados obtenidos de la capa CATAST_Pol_ParcelaMixta.
                                    fillColor: '#000000', // Color de relleno, representado en formato hex triplet (`#RRGGBB`).
                                    fillOpacity: 0.1, //Opacidad de relleno, valor de 0 a 1.
                                    strokeColor: '#e5475f', // Color de trazo de los lados del polígono, representado en formato hex triplet (`#RRGGBB`).
                                    strokeWidth: 2, // Anchura de trazo en de los lados del polígono.
                                    strokeOpacity: 1 // Opacidad de trazo de los lados del polígono, valor de 0 a 1.
                                }
                            }
                        ]
                    },
                    municipality: false, // Desactivamos la búsqueda de municipios.
                    town: false, // Desactivamos la búsqueda de cascos urbanos.
                    street: false, // Desactivamos la búsqueda de vías.
                    postalAddress: false // Desactivamos la búsqueda de direcciones postales.
                }
            }
        });
    </script>
  */

/**
  * Configuración del origen de datos auxiliar a la búsqueda de parcelas catastrales para la codificación de los nombres de municipio.
  * @typedef CadastralSearchOptionsExt
  * @memberof SITNA.control
  * @see SITNA.control.CadastralSearchOptions
  * @property {string[]} featureType - Colección de nombre de capa o capas a consultar.
  * @property {string} idProperty - Nombre de campo que identifica unívocamente el municipio cuyos valores deben coincidir con los posibles valores del campo indicado en firstQueryWord.
  * @property {string} labelProperty - Nombre de campo en el que buscar el texto indicado.
  * @example
  * {
  *     url: '//miServicioWFS/ogc/wfs',
  *     featurePrefix: 'IDENA',    
  *     featureType: ['Pol_ParcelaUrbana', 'Pol_ParcelaRustica', 'Pol_ParcelaMixta'],
  *     municipality: {
  *         featureType: 'Pol_Municipio',
  *         labelProperty: 'MUNICIPIO',
  *         idProperty: 'COD_MUNICIPIO'      
  *     },
  *     queryProperties: {
  *         firstQueryWord: 'COD_MUNICIPIO',
  *         secondQueryWord: 'POLIGONO',
  *         thirdQueryWord: 'PARCELA'
  *     }
  * }
  */

/**
  * Opciones de configuración del origen de datos de una búsqueda.
  * @typedef SearchQueryPropertyOptions
  * @memberof SITNA.control
  * @see SITNA.control.CadastralSearchOptions
  * @see SITNA.control.MunicipalitySearchOptions
  * @see SITNA.control.PostalAddressSearchOptions
  * @see SITNA.control.RoadSearchOptions
  * @see SITNA.control.RoadMilestoneSearchOptions
  * @see SITNA.control.StreetSearchOptions
  * @see SITNA.control.UrbanAreaSearchOptions
  * @property {string[]} firstQueryWord - Colección de nombre de campo o campos a consultar para el 1º término del criterio de búsqueda, deben existir en la capa o capas definidas en la propiedad `FeatureType`.
  * @property {string[]} secondQueryWord - Colección de nombre de campo o campos a consultar para el 2º término del criterio de búsqueda, deben existir en la capa o capas definidas en la propiedad `FeatureType`.
  * @property {string[]} thirdQueryWord - Colección de nombre de campo o campos a consultar para el 3º término del criterio de búsqueda, deben existir en la capa o capas definidas en la propiedad `FeatureType`.
  */

/**
  * Opciones de configuración para la composición de la cabecera de una lista de sugerencias de búsqueda.
  * @typedef SearchSuggestionHeaderOptions
  * @memberof SITNA.control
  * @see SITNA.control.CadastralSearchOptions
  * @see SITNA.control.MunicipalitySearchOptions
  * @see SITNA.control.PostalAddressSearchOptions
  * @see SITNA.control.RoadSearchOptions
  * @see SITNA.control.RoadMilestoneSearchOptions
  * @see SITNA.control.StreetSearchOptions
  * @see SITNA.control.UrbanAreaSearchOptions
  * @property {string} label - Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… Revisar la sección **Soporte multiidioma** en {@tutorial layout_cfg}.
  * @property {SearchResultColorDictionary|SearchResultColor|string} color - Configuración para obtener el color que representa al tipo de búsqueda.
  * Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
  * 
  * La definición como string ha de ser para indicar el nombre de una propiedad presente en {@link PointStyleOptions}, {@link LineStyleOptions} o {@link PolygonStyleOptions}.
  * @example
  * {
  *     label: "search.list.town",
  *     color: "strokeColor"
  * }
  */

/**
  * Algunas búsquedas hacen la consulta sobre varias capas. Este objeto define el color de los resultados de la búsqueda de cada capa. Estos colores también se mostrarán en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
  * @typedef SearchResultColorDictionary
  * @memberof SITNA.control
  * @see SITNA.control.SearchSuggestionHeaderOptions
  * @property {SearchResultColor} color - Configuración para obtener el color.
  * @property {string} title - Title para identificar al color. Se define con la clave del diccionario de traducciones. Revisar la sección **Soporte multiidioma** en {@tutorial layout_cfg}.
  * @example
  * CATAST_Pol_ParcelaUrba: {
  *     title: "search.list.cadastral.urban",
  *     color: {
  *         geomType: "polygon",
  *         css: "strokeColor"
  *     } 
  * }
  */

/**
  * Definición del color con el que se dibujará los resultados de la búsqueda en el mapa. Este color también se mostrará en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
  * @typedef SearchResultColor
  * @memberof SITNA.control
  * @see SITNA.control.SearchSuggestionHeaderOptions
  * @property {string} css - Nombre de la propiedad de los estilos de la cual extraer el color. Ha de ser alguna de las distintas propiedades de colores presentes en {@link PointStyleOptions}, 
  * {@link PolylineStyleOptions} o {@link PolygonStyleOptions}.
  * @property {string} geomType - Nombre del tipo de geometría (el valor es un miembro de [SITNA.Consts.geom]{@link SITNA.Consts}).
  * @example
  * color: {
  *     geomType: "point",
  *     css: "fontColor"
  * } 
  */

/**
  * Opciones de configuración del origen de datos de la búsqueda de municipios.
  * @typedef MunicipalitySearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string[]} dataIdProperty - Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a un municipio. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría del municipio.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts}, 
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}.
  * @property {string} outputFormatLabel - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `[NombreMunicipio]` y `outputFormatLabel` como `“{0}”` para un resultado con valor del campo `NombreMunicipio` a `Pamplona` mostrará en la lista resultados del tipo: *Pamplona*.
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias. 
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de municipios.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a la propiedad `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre del municipio.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto,
  * deberá haber tantas instancias como capas definidas en `featureType`.
  * 
  * No está disponible `cluster`.
  * @property {SearchSuggestionHeaderOptions} suggestionListHead - Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {string} url - Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs)).
  * @example <caption>[Ver en vivo](../examples/Cfg.SearchMunicipalitySource.html)</caption> {@lang html}
    <div id="mapa"></div>
    <script>
        var map = new SITNA.Map("mapa", {
            controls: {
                search: {
                    placeHolder: 'Municipio', // Texto que se mostrará en el cajetín de búsqueda.
                    instructions: 'Buscar municipio', // Texto que se mostrará como tooltip del botón buscar.
                    municipality: { // Objeto de configuración del origen de datos en el cual buscar los municipios.
                        url: '//idena.navarra.es/ogc/wfs', // Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa a definir en la propiedad `featureType`.En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['CATAST_Pol_Municipio'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CMUNICIPIO'], // Colección con el nombre del campo que nos servirá para identificar unívocamente a un municipio. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de municipios.
                            firstQueryWord: ['MUNINOAC', 'MUNICIPIO'] // Campos en los que buscar el nombre de municipio.
                        },
                        suggestionListHead: { //  Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            label: "search.list.municipality", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Municipio.
                            color: "strokeColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#FE06A5'.
                        outputProperties: ['MUNICIPIO'], // Colección con el nombre del campo a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias.
                        outputFormatLabel: '{0}', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                polygon: { // Opciones de estilo de polígono para los resultados obtenidos.
                                    fillColor: '#000000', // Color de relleno, representado en formato hex triplet (`#RRGGBB`).
                                    fillOpacity: 0.1, // Opacidad de relleno, valor de 0 a 1.
                                    strokeColor: '#fe06a5', // Color de trazo de los lados del polígono, representado en formato hex triplet (`#RRGGBB`).
                                    strokeWidth: 2, // Anchura de trazo en de los lados del polígono.
                                    strokeOpacity: 1 // Opacidad de trazo de los lados del polígono, valor de 0 a 1.
                                }
                            }
                        ]
                    },
                    cadastralParcel: false, // Desactivamos la búsqueda de parcelas catastrales.
                    town: false, // Desactivamos la búsqueda de cascos urbanos.
                    street: false, // Desactivamos la búsqueda de vías.
                    postalAddress: false // Desactivamos la búsqueda de direcciones postales.
                }
            }
        });
    </script>
  */

/**
  * Opciones de configuración del origen de datos de la búsqueda de direcciones postales.
  * @typedef PostalAddressSearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string[]} dataIdProperty - Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a la dirección postal. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría de la dirección postal.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts}, 
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}.
  * @property {string} outputFormatLabel - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `[EntidadPoblacion, Via, Numero]` y `outputFormatLabel` como `“{1} {2}, {0}”` para un resultado con valor del campo `EntidadPoblacion` a `Pamplona`, valor del campo `Via` a `Calle Estafeta` y valor del campo `Numero` a 13 mostrará en la lista resultados del tipo: *Calle Estafeta 13, Pamplona*.
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias. 
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de direcciones postales.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a las siguientes propiedades:
  * - `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre de la entidad de población.
  * - `secondQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre de la vía.
  * - `thirdQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el número de portal.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto,
  * deberá haber tantas instancias como capas definidas en `featureType`.
  * 
  * No está disponible cluster.
  * @property {SearchSuggestionHeaderOptions} suggestionListHead - Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {string} url - Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs)).
  * @example <caption>[Ver en vivo](../examples/Cfg.SearchPostalAddressSource.html)</caption> {@lang html}
    <div id="mapa"></div>
    <script>
        var map = new SITNA.Map("mapa", {
            controls: {
                search: {
                    placeHolder: 'Dirección postal', // Texto que se mostrará en el cajetín de búsqueda.
                    instructions: 'Buscar dirección postal', // Texto que se mostrará como tooltip del botón buscar.
                    postalAddress: { // Objeto de configuración del origen de datos en el cual buscar dirección postal.
                        url: '//idena.navarra.es/ogc/wfs', // Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`.En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['CATAST_Txt_Portal'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CMUNICIPIO', 'CENTIDADC', 'CVIA', 'PORTAL'],  // Colección con los nombres de los campos que nos servirán para identificar unívocamente a una dirección postal. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de dirección postal.
                            firstQueryWord: ['ENTIDADC', 'ENTINOAC'], // Campos en los que buscar el nombre de la entidad de población.
                            secondQueryWord: ['VIA', 'VIANOAC'], // Campos en los que buscar la vía.
                            thirdQueryWord: ['PORTAL'] // Campo en el que buscar la dirección postal.
                        },
                        suggestionListHead: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            label: "search.list.number", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Portal
                            color: "fontColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#CB0000'.
                        outputProperties: ['ENTIDADC', 'VIA', 'PORTAL', 'CVIA', 'CENTIDADC', 'CMUNICIPIO'], // Colección con los nombres de los campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias.
                        outputFormatLabel: '{1} {2}, {0}', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                point: { // Opciones de estilo de punto para los resultados obtenidos.
                                    radius: 0, // Radio en píxeles del símbolo que representa el punto.
                                    label: "PORTAL", // Nombre de campo del cual extraer el valor de la etiqueta.
                                    labelRotationKey: "CADANGLE", // Nombre de campo del cual extraer la rotación a aplicar a la etiqueta.
                                    fontColor: "#CB0000", // Color del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
                                    fontSize: 14, // Tamaño de fuente del texto de la etiqueta descriptiva del punto en píxeles.
                                    labelOutlineColor: "#FFFFFF", // Color del contorno del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
                                    labelOutlineWidth: 4 // Anchura en píxeles del trazo del contorno del texto de la etiqueta.
                                }
                            }
                        ]
                    },
                    cadastralParcel: false, // Desactivamos la búsqueda de parcelas catastrales.
                    municipality: false, // Desactivamos la búsqueda de municipios.
                    town: false, // Desactivamos la búsqueda de cascos urbanos.
                    street: false // Desactivamos la búsqueda de vías.
                }
            }
        });
    </script>
  */

/**
  * Opciones de configuración del origen de datos de la búsqueda de topónimo.
  * @typedef PlaceNameSearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string[]} dataIdProperty - Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a un topónimo. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría del topónimo.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts}, 
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}.
  * @property {string} outputFormatLabel - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `['MUNICIPIO', 'TOPONIMO']` y `outputFormatLabel` como `“{1} ({0})”` para un resultado con valor del campo `MUNICIPIO` a `Aranguren` y valor del campo `TOPONIMO` a `Camino de Pamplona` mostrará en la lista resultados del tipo: *Camino de Pamplona (Aranguren)*.
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias. 
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de topónimo.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a la siguiente propiedad:
  * - `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre del topónimo.
  * @property {string[]} renderFeatureType - Colección con los nombres de las capas auxiliares a añadir al resultado de la búsqueda en el mapa. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `dataIdProperty`.
  *
  * No se muestran sugerencias en base a las capas auxiliares, únicamente se añade información en el momento de pintar en el mapa, es por ello que debe existir relación en los datos entre las capas definidas en `featureType` y `renderFeatureType` y que ambas cuenten con los campos definidos en `dataIdProperty`.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en las colecciones 1 y 2 siendo 1 la concatenación de `featureType`
  * y `renderFeatureType` y 2 `styles`, por tanto, deberá haber tantas instancias como la suma de las capas definidas en `featureType` y en `renderFeatureType`.
  * 
  * No está disponible cluster.
  * @property {SearchSuggestionHeaderOptions} suggestionListHead - Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {string} url - Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs)).
  * @example <caption>[Ver en vivo](../examples/Cfg.SearchPlacenameSource.html)</caption> {@lang html}
    <div id="mapa"></div>
    <script>
        var map = new SITNA.Map("mapa", {
            controls: {
                search: {
                    placeHolder: 'Topónimo', // Texto que se mostrará en el cajetín de búsqueda.
                    instructions: 'Buscar topónimo', // Texto que se mostrará como tooltip del botón buscar.
                    placeName: { // Objeto de configuración del origen de datos en el cual buscar topónimo.
                        url: '//idena.navarra.es/ogc/wfs', // Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`.En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['TOPONI_Txt_Toponimos'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CMUNICIPIO', 'CTOPONIMO'], // Colección con los nombres de los campos que nos servirán para identificar unívocamente a un topónimo. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de topónimo.
                            firstQueryWord: ['TOPONIMO', 'TOPONINOAC'] // Campos en los que buscar el nombre del topónimo.
                        },
                        suggestionListHead: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            label: "search.list.placeName", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Topónimo
                            color: "fontColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#FF5722'.
                        outputProperties: ['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO'], // Colección con los nombres de los campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias.
                        outputFormatLabel: '{1} ({0})', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                point: { // Opciones de estilo de punto para los resultados obtenidos.
                                    radius: 0, // Radio en píxeles del símbolo que representa el punto.
                                    label: "TOPONIMO", // Nombre de campo del cual extraer el valor de la etiqueta.
                                    labelRotationKey: "CADANGLE", // Nombre de campo del cual extraer la rotación a aplicar a la etiqueta.
                                    fontColor: "#ff5722", // Color del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
                                    fontSize: 14, // Tamaño de fuente del texto de la etiqueta descriptiva del punto en píxeles.
                                    labelOutlineColor: "#FFFFFF", // Color del contorno del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
                                    labelOutlineWidth: 4 // Anchura en píxeles del trazo del contorno del texto de la etiqueta.
                                }
                            }
                        ]
                    },
                    cadastralParcel: false, // Desactivamos la búsqueda de parcelas catastrales.
                    municipality: false, // Desactivamos la búsqueda de municipios.
                    town: false, // Desactivamos la búsqueda de cascos urbanos.
                    street: false, // Desactivamos la búsqueda de vías.
                    postalAddress: false // Desactivamos la búsqueda de direcciones postales.
                }
            }
        });
    </script>
  */

/**
  * Opciones de configuración del origen de datos de la búsqueda de topónimo en un municipio.
  * @typedef PlaceNameMunicipalitySearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string[]} dataIdProperty - Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a un topónimo en un municipio. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría del topónimo.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts}, 
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}.
  * @property {string} outputFormatLabel - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO']` y `outputFormatLabel` como `“{1} ({0})”` para un resultado con valor del campo `MUNICIPIO` a `Aranguren` y valor del campo `TOPONIMO` a `Camino de Pamplona` mostrará en la lista resultados del tipo: *Camino de Pamplona (Aranguren)*.
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias. 
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de topónimo en un municipio.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a las siguientes propiedades:
  * - `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre del municipio.
  * - `secondQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre del topónimo.
  * @property {string[]} renderFeatureType - Colección con los nombres de las capas auxiliares a añadir al resultado de la búsqueda en el mapa. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `dataIdProperty`.
  *
  * No se muestran sugerencias en base a las capas auxiliares, únicamente se añade información en el momento de pintar en el mapa, es por ello que debe existir relación en los datos entre las capas definidas en `featureType` y `renderFeatureType` y que ambas cuenten con los campos definidos en `dataIdProperty`.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en las colecciones 1 y 2 siendo 1 la concatenación de `featureType`
  * y `renderFeatureType` y 2 `styles`, por tanto, deberá haber tantas instancias como la suma de las capas definidas en `featureType` y en `renderFeatureType`.
  * 
  * No está disponible cluster.
  * @property {SearchSuggestionHeaderOptions} suggestionListHead - Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {string} url - Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs)).
  * @example <caption>[Ver en vivo](../examples/Cfg.SearchPlacenameMunicipalitySource.html)</caption> {@lang html}
    <div id="mapa"></div>
    <script>
        var map = new SITNA.Map("mapa", {
            controls: {
                search: {
                    placeHolder: 'Topónimo en municipio', // Texto que se mostrará en el cajetín de búsqueda.
                    instructions: 'Buscar topónimo en un municipio', // Texto que se mostrará como tooltip del botón buscar.
                    placeNameMunicipality: { // Objeto de configuración del origen de datos en el cual buscar topónimo en un municipio.
                        url: '//idena.navarra.es/ogc/wfs', // Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`.En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['TOPONI_Txt_Toponimos'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CMUNICIPIO', 'CTOPONIMO'], // Colección con los nombres de los campos que nos servirán para identificar unívocamente a un topónimo en un municipio. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de topónimo en un municipio.
                            firstQueryWord: ['MUNICIPIO', 'MUNINOAC'], // Campos en los que buscar el nombre de municipio.
                            secondQueryWord: ['TOPONIMO', 'TOPONINOAC'] // Campos en los que buscar el nombre del topónimo.
                        },
                        suggestionListHead: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            label: "search.list.placeName", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Topónimo
                            color: "fontColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#FF5722'.
                        outputProperties: ['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO'], // Colección con los nombres de los campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias.
                        outputFormatLabel: '{1} ({0})', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                point: { // Opciones de estilo de punto para los resultados obtenidos.
                                    radius: 0, // Radio en píxeles del símbolo que representa el punto.
                                    label: "TOPONIMO", // Nombre de campo del cual extraer el valor de la etiqueta.
                                    labelRotationKey: "CADANGLE", // Nombre de campo del cual extraer la rotación a aplicar a la etiqueta.
                                    fontColor: "#ff5722", // Color del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
                                    fontSize: 14, // Tamaño de fuente del texto de la etiqueta descriptiva del punto en píxeles.
                                    labelOutlineColor: "#FFFFFF",  // Color del contorno del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
                                    labelOutlineWidth: 4 // Anchura en píxeles del trazo del contorno del texto de la etiqueta.
                                }
                            }
                        ]
                    },
                    cadastralParcel: false, // Desactivamos la búsqueda de parcelas catastrales.
                    municipality: false, // Desactivamos la búsqueda de municipios.
                    town: false, // Desactivamos la búsqueda de cascos urbanos.
                    street: false, // Desactivamos la búsqueda de vías.
                    postalAddress: false // Desactivamos la búsqueda de direcciones postales.
                }
            }
        });
    </script>
  */

/**
  * Opciones de configuración del origen de datos de la búsqueda de carreteras.
  * @typedef RoadSearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string[]} dataIdProperty - Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a una carretera. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría de la carretera.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts}, 
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}.
  * @property {string} outputFormatLabel - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `['Carretera']` y `outputFormatLabel` como `“{0}”` para un resultado con valor del campo `Carretera` a `N-121` mostrará en la lista resultados del tipo: *N-121*.
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias. 
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de carreteras.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a la siguiente propiedad:
  * - `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre de la carretera.  
  * @property {string[]} renderFeatureType - Colección con los nombres de las capas auxiliares a añadir al resultado de la búsqueda en el mapa. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `dataIdProperty`.
  *
  * No se muestran sugerencias en base a las capas auxiliares, únicamente se añade información en el momento de pintar en el mapa, es por ello que debe existir relación en los datos entre las capas definidas en `featureType` y `renderFeatureType` y que ambas cuenten con los campos definidos en `dataIdProperty`.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en las colecciones 1 y 2 siendo 1 la concatenación de `featureType`
  * y `renderFeatureType` y 2 `styles`, por tanto, deberá haber tantas instancias como la suma de las capas definidas en `featureType` y en `renderFeatureType`.
  * 
  * No está disponible cluster.
  * @property {SearchSuggestionHeaderOptions} suggestionListHead - Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {string} url - Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs)).
  * @example <caption>[Ver en vivo](../examples/Cfg.SearchRoadSource.html)</caption> {@lang html}
    <div id="mapa"></div>
    <script>
        var map = new SITNA.Map("mapa", {
            controls: {
                search: {
                    placeHolder: 'Carretera', // Texto que se mostrará en el cajetín de búsqueda.
                    instructions: 'Buscar carretera', // Texto que se mostrará como tooltip del botón buscar.
                    road: { // Objeto de configuración del origen de datos en el cual buscar carretera.
                        url: '//idena.navarra.es/ogc/wfs', // Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`.En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['INFRAE_Lin_CtraEje'],  // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['DCARRETERA'], // Colección con el nombre del campo que nos servirá para identificar unívocamente a una carretera. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de carretera.
                            firstQueryWord: ['DCARRETERA'] // Campo en el que buscar el nombre de la carretera.
                        },
                        suggestionListHead: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            label: "search.list.road", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Carretera.
                            color: "strokeColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#00B2FC'.
                        outputProperties: ['DCARRETERA'], // Colección con los nombres de los campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias.
                        outputFormatLabel: 'Carretera: {0}', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                line: { // Opciones de estilo de línea para los resultados obtenidos.
                                    strokeColor: "#00B2FC", // Color de trazo de la línea, representado en formato hex triplet (`#RRGGBB`).
                                    strokeOpacity: 1, // Opacidad de trazo de la línea, valor de 0 a 1.
                                    strokeWidth: 5, // Anchura de trazo en píxeles de la línea.
                                    strokeLinecap: "round",
                                    strokeDashstyle: "solid"
                                }
                            }
                        ]
                    },
                    cadastralParcel: false, // Desactivamos la búsqueda de parcelas catastrales.
                    municipality: false, // Desactivamos la búsqueda de municipios.
                    town: false, // Desactivamos la búsqueda de cascos urbanos.
                    street: false, // Desactivamos la búsqueda de vías.
                    postalAddress: false // Desactivamos la búsqueda de direcciones postales.
                }
            }
        });
    </script>
  */

/**
  * Opciones de configuración del origen de datos de la búsqueda de punto kilométrico de carretera.
  * @typedef RoadMilestoneSearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string[]} dataIdProperty - Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a un punto kilométrico de una carretera. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría del punto kilométrico.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts}, 
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}.
  * @property {string} outputFormatLabel - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `['Carretera', 'PK']` y `outputFormatLabel` como `“{0}: PK {1}”` para un resultado con valor del campo `Carretera` a `AP-15` y valor del campo `PK` a `10` mostrará en la lista resultados del tipo: *AP-15: PK 10*.
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias. 
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de punto kilométrico.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a las siguientes propiedades:
  * - `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre de la carretera.
  * - `secondQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el número del punto kilométrico.
  * @property {string[]} renderFeatureType - Colección con los nombres de las capas auxiliares a añadir al resultado de la búsqueda en el mapa. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `dataIdProperty`.
  *
  * No se muestran sugerencias en base a las capas auxiliares, únicamente se añade información en el momento de pintar en el mapa, es por ello que debe existir relación en los datos entre las capas definidas en `featureType` y `renderFeatureType` y que ambas cuenten con los campos definidos en `dataIdProperty`.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en las colecciones 1 y 2 siendo 1 la concatenación de `featureType`
  * y `renderFeatureType` y 2 `styles`, por tanto, deberá haber tantas instancias como la suma de las capas definidas en `featureType` y en `renderFeatureType`.
  * 
  * No está disponible cluster.
  * @property {SearchSuggestionHeaderOptions} suggestionListHead - Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {string} url - Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs)).
  * @example <caption>[Ver en vivo](../examples/Cfg.SearchRoadMilestoneSource.html)</caption> {@lang html}
    <div id="mapa"></div>
    <script>
        var map = new SITNA.Map("mapa", {
            controls: {
                search: {
                    placeHolder: 'Carretera, PK', // Texto que se mostrará en el cajetín de búsqueda.
                    instructions: 'Buscar punto kilométrico de carretera',  // Texto que se mostrará como tooltip del botón buscar.
                    roadmilestone: { // Objeto de configuración del origen de datos en el cual buscar punto kilométrico.
                        url: '//idena.navarra.es/ogc/wfs', // Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`.En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['INFRAE_Sym_CtraPK'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['DCARRETERA', 'CPK'], // Colección con los nombres de campos que nos servirán para identificar unívocamente a un punto kilométrico. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de punto kilométrico.
                            firstQueryWord: ['DCARRETERA'], // Campo en el que buscar el nombre de la carretera.
                            secondQueryWord: ['PK'] // Campo en el que buscar el número del punto kilométrico.
                        },
                        suggestionListHead: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            label: "search.list.milestone.larger", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Punto kilométrico
                            color: "fontColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#00B2FC'.
                        outputProperties: ['DCARRETERA', 'PK'], // Colección con los nombres de los campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias.
                        outputFormatLabel: 'Carretera: {0} ' + 'PK: {1}', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                point: { // Opciones de estilo de punto para los resultados obtenidos.
                                    label: ["DCARRETERA", "PK"], // Colección de los nombres de los campos de los cuales extraer el valor de la etiqueta.
                                    fontColor: "#00B2FC", // Color del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
                                    fontSize: 14, // Tamaño de fuente del texto de la etiqueta descriptiva del punto en píxeles.
                                    labelOutlineColor: "#ffffff", // Color del contorno del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
                                    labelOutlineWidth: 2 // Anchura en píxeles del trazo del contorno del texto de la etiqueta.
                                }
                            }
                        ]
                    },
                    cadastralParcel: false, // Desactivamos la búsqueda de parcelas catastrales.
                    municipality: false, // Desactivamos la búsqueda de municipios.
                    town: false, // Desactivamos la búsqueda de cascos urbanos.
                    street: false, // Desactivamos la búsqueda de vías.
                    postalAddress: false // Desactivamos la búsqueda de direcciones postales.
                }
            }
        });
    </script>
  */

/**
  * Opciones de configuración del origen de datos de la búsqueda de vías.
  * @typedef StreetSearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string[]} dataIdProperty - Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a una vía. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría de la vía.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts}, 
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}.
  * @property {string} outputFormatLabel - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `[EntidadPoblacion, Via]` y `outputFormatLabel` como `“{1}, {0}”` para un resultado con valor del campo `EntidadPoblacion` a `Pamplona` y valor del campo `Via` a `Calle Estafeta` mostrará en la lista resultados del tipo: *Calle Estafeta, Pamplona*.
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias. 
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de vías.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a las siguientes propiedades:
  * - `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre de la entidad de población.
  * - `secondQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre de la vía.
  * @property {string[]} renderFeatureType - Colección con los nombres de las capas auxiliares a añadir al resultado de la búsqueda en el mapa. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `dataIdProperty`.
  *
  * No se muestran sugerencias en base a las capas auxiliares, únicamente se añade información en el momento de pintar en el mapa, es por ello que debe existir relación en los datos entre las capas definidas en `featureType` y `renderFeatureType` y que ambas cuenten con los campos definidos en `dataIdProperty`.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en las colecciones 1 y 2 siendo 1 la concatenación de `featureType`
  * y `renderFeatureType` y 2 `styles`, por tanto, deberá haber tantas instancias como la suma de las capas definidas en `featureType` y en `renderFeatureType`.
  * 
  * No está disponible cluster.
  * @property {SearchSuggestionHeaderOptions} suggestionListHead - Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {string} url - Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs)).
  * @example <caption>[Ver en vivo](../examples/Cfg.SearchStreetSource.html)</caption> {@lang html}
    <div id="mapa"></div>
    <script>
        var map = new SITNA.Map("mapa", {
            controls: {
                search: {
                    placeHolder: 'Vía', // Texto que se mostrará en el cajetín de búsqueda.
                    instructions: 'Buscar vía', // Texto que se mostrará como tooltip del botón buscar.
                    street: { // Objeto de configuración del origen de datos en el cual buscar vía.
                        url: '//idena.navarra.es/ogc/wfs', // Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`.En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        renderFeatureType: ['CATAST_Txt_Calle'], // Colección con los nombres de las capas auxiliares a añadir al resultado de la búsqueda en el mapa. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `dataIdProperty`. No se muestran sugerencias en base a las capas auxiliares, únicamente se añade información en el momento de pintar en el mapa, es por ello que debe existir relación en los datos entre las capas definidas en `featureType` y `renderFeatureType` y que ambas cuenten con los campos definidos en `dataIdProperty`.
                        featureType: ['CATAST_Lin_CalleEje'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CVIA'], // Colección con el nombre del campo que nos servirá para identificar unívocamente a una vía. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de vía.
                            firstQueryWord: ['ENTINOAC', 'ENTIDADC'], // Campo en el que buscar el nombre de la entidad de población.
                            secondQueryWord: ['VIA', 'VIANOAC'] // Campo en el que buscar el nombre de la vía.
                        },
                        suggestionListHead: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            label: "search.list.street", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Vía
                            color: "strokeColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#CB0000'.
                        outputProperties: ['ENTIDADC', 'VIA', 'CVIA', 'CENTIDADC', 'CMUNICIPIO'], // Colección con los nombres de los campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias.
                        outputFormatLabel: '{1}, {0}', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                line: { // Opciones de estilo de línea para los resultados obtenidos.
                                    strokeColor: "#CB0000", // Color de trazo de la línea, representado en formato hex triplet (`#RRGGBB`).
                                    strokeOpacity: 1, // Opacidad de trazo de la línea, valor de 0 a 1.
                                    strokeWidth: 2, // Anchura de trazo en píxeles de la línea.
                                    strokeLinecap: "round",
                                    strokeDashstyle: "solid"
                                }
                            },
                            {
                                point: { // Opciones de estilo de punto para los resultados obtenidos.
                                    label: "VIA", // Nombre de campo del cual extraer el valor de la etiqueta.
                                    labelRotationKey: "CADANGLE", // Nombre de campo del cual extraer la rotación a aplicar a la etiqueta.
                                    fontColor: "#000000", // Color del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
                                    fontSize: 7, // Tamaño de fuente del texto de la etiqueta descriptiva del punto en píxeles.
                                    labelOutlineColor: "#ffffff", // Color del contorno del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
                                    labelOutlineWidth: 2 // Anchura en píxeles del trazo del contorno del texto de la etiqueta.
                                }
                            }
                        ]
                    },
                    cadastralParcel: false, // Desactivamos la búsqueda de parcelas catastrales.
                    municipality: false, // Desactivamos la búsqueda de municipios.
                    town: false, // Desactivamos la búsqueda de cascos urbanos.
                    postalAddress: false // Desactivamos la búsqueda de direcciones postales.
                }
            }
        });
    </script>
  */

/**
  * Opciones de configuración del origen de datos de la búsqueda de cascos urbanos.
  * @typedef UrbanAreaSearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string[]} dataIdProperty - Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a un casco urbano. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría del casco urbano.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts},
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}
  * @property {string} outputFormatLabel - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `[NombreMunicipio, NombreCascoUrbano]` y `outputFormatLabel` como `“{1} ({0})”` para un resultado con valor del campo `NombreMunicipio` a `Galar` y valor del campo `NombreCascoUrbano` a `Salinas de Pamplona` mostrará en la lista resultados del tipo: *Salinas de Pamplona (Galar)*.
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias. 
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de vías.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a la propiedad `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre del casco urbano.
  * @property {SITNA.layer.StyleOptions[]} styles - La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
  * 
  * No está disponible cluster.
  * @property {SearchSuggestionHeaderOptions} suggestionListHead - Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {string} url - Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs)).
  * @example <caption>[Ver en vivo](../examples/Cfg.SearchTownSource.html)</caption> {@lang html}
  <div id="mapa"></div>
    <script>
        var map = new SITNA.Map("mapa", {
            controls: {
                search: {
                    placeHolder: 'Casco urbano', // Texto que se mostrará en el cajetín de búsqueda.
                    instructions: 'Buscar casco urbano', // Texto que se mostrará como tooltip del botón buscar.
                    town: { // Objeto de configuración del origen de datos en el cual buscar casco urbano.
                        url: '//idena.navarra.es/ogc/wfs', // Dirección del servicio WFS (las búsquedas en API SITNA están implementadas sobre el estándar [OGC Web Feature Service](http://www.opengeospatial.org/standards/wfs).
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa a definir en la propiedad `featureType`.En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['ESTADI_Pol_EntidadPob'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CMUNICIPIO', 'CENTIDAD'], // Colección con los nombres de los campos que nos servirán para identificar unívocamente un casco urbano. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de casco urbano.
                            firstQueryWord: ['ENTINOAC', 'ENTIDAD'] // Campos en los que buscar el nombre de casco urbano.
                        },
                        suggestionListHead: { //  Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            label: "search.list.urban", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Casco urbano.
                            color: "strokeColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        },  // El resultado de la configuración anterior será: '#FEBA1E'.
                        outputProperties: ['MUNICIPIO', 'ENTIDAD'], // Colección con el nombre del campo a mostrar (según el patrón indicando en `outputFormatLabel`) en la lista de sugerencias.
                        outputFormatLabel: '{1} ({0})', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                polygon: { // Opciones de estilo de polígono para los resultados obtenidos.
                                    fillColor: '#000000', // Color de relleno, representado en formato hex triplet (`#RRGGBB`).
                                    fillOpacity: 0.1, // Opacidad de relleno, valor de 0 a 1.
                                    strokeColor: '#feba1e', // Color de trazo de los lados del polígono, representado en formato hex triplet (`#RRGGBB`).
                                    strokeWidth: 2, // Anchura de trazo en de los lados del polígono.
                                    strokeOpacity: 1 // Opacidad de trazo de los lados del polígono, valor de 0 a 1.
                                }
                            }
                        ]
                    },
                    cadastralParcel: false, // Desactivamos la búsqueda de parcelas catastrales.
                    street: false, // Desactivamos la búsqueda de vías.
                    postalAddress: false // Desactivamos la búsqueda de direcciones postales.
                }
            }
        });
    </script>
  */

import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import { Defaults } from '../Cfg';
import Control from '../Control';
import Feature from '../../SITNA/feature/Feature';
import infoShare from './infoShare';
import filter from '../filter';
import autocomplete from '../ui/autocomplete';

TC.control = TC.control || {};
TC.filter = filter;
TC.UI = TC.UI || {};
TC.UI.autocomplete = autocomplete;
TC.Defaults = Defaults;
TC.control.infoShare = infoShare;
TC.Control = Control;

(function () {
    // Polyfill window.performance.now
    if (!window.performance) {
        window.performance = {
            offset: Date.now(),
            now: function () {
                return Date.now() - this.offset;
            }
        };
    } else if (window.performance && !window.performance.now) {
        window.performance.offset = Date.now();
        window.performance.now = function () {
            return Date.now() - window.performance.offset;
        };
    }
}());

const SearchType = function (type, options, parent) {
    var self = this;

    self.parent = parent;

    self._featureTypes = [];

    TC.Util.extend(self, options);

    self.typeName = type;

    self._throwConfigError = function () {
        var self = this;

        throw new Error('Error en la configuración de la búsqueda: ' + self.typeName);
    };

    self.getFeatureTypes = function (toFilter) {
        var self = this;

        if (toFilter) {
            return self.featureType instanceof Array ? self.featureType : [self.featureType];
        }

        if (self._featureTypes.length === 0) {
            var type_featureType = self.featureType instanceof Array ? self.featureType : [self.featureType];
            var type_renderFeatureType = self.renderFeatureType ? self.renderFeatureType instanceof Array ? self.renderFeatureType : [self.renderFeatureType] : [];
            self._featureTypes = type_featureType.concat(type_renderFeatureType);
        }

        return self._featureTypes;
    };

    self.isFeatureOfThisType = function (id) {
        var self = this;

        return self.getFeatureTypes().indexOf(id) > -1;
    };

    self.getStyleByFeatureType = function (featureType) {
        var self = this;

        if (self.getFeatureTypes().indexOf(featureType) > -1) {
            return self.styles[self.getFeatureTypes().indexOf(featureType)];
        }

        return null;
    };

    var getColor = function (css, geomType, featureType) {
        var self = this;

        var getValue = function (style, geomType, css) {
            if (geomType) {
                if (Object.prototype.hasOwnProperty.call(style, geomType) && Object.prototype.hasOwnProperty.call(style[geomType], css)) {
                    return style[geomType][css];
                }
            } else {
                for (var gType in style) {
                    if (Object.prototype.hasOwnProperty.call(style[gType], css)) {
                        return style[gType][css];
                    }
                }
            }
        };

        if (featureType) {
            const style = self.getStyleByFeatureType(featureType);
            return getValue(style, geomType, css);
        } else {
            for (var i = 0; i < self.styles.length; i++) {
                const style = self.styles[i];
                const color = getValue(style, geomType, css);
                if (color) {
                    return color;
                }
            }
        }
    };

    self.getSuggestionListHead = function () {
        var self = this;

        var headerData, label, color;

        if (typeof self.suggestionListHead === "function") {
            headerData = self.suggestionListHead();
            label = headerData.label;
            color = [{
                color: headerData.color,
                title: headerData.label
            }];
        } else {
            headerData = self.suggestionListHead;
            label = self.parent.getLocaleString(headerData.label);

            // color es string que es el atributo CSS. El valor se obtiene de la 1º coincidencia encontrada en styles
            if (typeof headerData.color === "string") {
                color = [{
                    color: getColor.call(self, headerData.color),
                    title: label
                }];
            } else if (headerData.color instanceof Array) { // color es un array de objetos, con nombre de featureType como clave
                var featureTypes = self.getFeatureTypes();
                if (headerData.color.length === featureTypes.length) {
                    color = headerData.color.map(function (elm, i) {
                        return {
                            color: getColor.call(self, elm[featureTypes[i]].color.css, elm[featureTypes[i]].color.geomType, featureTypes[i]),
                            title: self.parent.getLocaleString(elm[featureTypes[i]].title) || label
                        };
                    });
                } else {
                    self._throwConfigError();
                }
            } else if (typeof headerData.color === "object") { // color es un objeto con atributo css y tipo de geometría
                color = [{
                    color: getColor.call(self, headerData.color.css, headerData.color.geomType),
                    title: label
                }];
            }
        }

        if (label && color) {
            var liHTML = '<li header><span class="tc-header">' + label + '</span>';

            liHTML += color.map(function (elm) {
                if (elm.color) {
                    return '<span class="tc-header-color" title="' + elm.title + '" style="color: ' + elm.color + ';"></span>';
                }
            }).join('') + '</li>';

            return liHTML;

        } else {
            self._throwConfigError();
        }
    };

    self.getSuggestionListElements = function (data) {
        var self = this;
        var results = [];

        var areSame = function (a, b) {
            switch (true) {
                case typeof a === "number":
                    if (a === b) {
                        return true;
                    }
                    break;
                case typeof a === "string":
                    if (!isNaN(a) || !isNaN(b)) {
                        if (a === b) {
                            return true;
                        }
                    } else {
                        if (a.trim() === b.trim()) {
                            return true;
                        }
                    }
                    break;
            }

            return false;
        };
        var getUnique = function (inputArray) {
            var outputArray = [];
            for (var i = 0; i < inputArray.length; i++) {
                if (outputArray.indexOf(inputArray[i]) === -1) {
                    outputArray.push(inputArray[i]);
                }
            }

            return outputArray;
        };
        var intoResults = function (compareData) {
            for (var r = 0; r < results.length; r++) {
                var length = 0;
                var isThere = [];
                for (var property in compareData) {
                    isThere.push(areSame(compareData[property], results[r].properties[property]));
                    length++;
                }
                if (isThere.filter(function (i) { return i; }).length === length) {
                    return true;
                }

            }

            return false;
        };

        var features = self.parseFeatures(data);

        features.forEach(function (feature) {
            var attributes = [], ids = [];
            var valueToAdd = '';

            var properties = self.outputProperties;
            var dataIdProperties = self.dataIdProperty;

            var strFormat = self.outputFormatLabel;
            var dataLayer = feature.id.split('.').slice(0, 1).shift();

            if (!(self.outputProperties instanceof Array)) {
                properties = self.outputProperties[dataLayer];
                dataIdProperties = self.dataIdProperty[dataLayer];
                strFormat = strFormat[dataLayer];
            }

            for (var j = 0; j < properties.length; j++) {
                attributes.push(feature.data[properties[j]]);
            }

            for (j = 0; j < dataIdProperties.length; j++) {
                ids.push(feature.data[dataIdProperties[j]]);
            }

            var compareData = {};
            for (var p = 0; p < self.outputProperties.length; p++) {
                compareData[self.outputProperties[p]] = attributes[p];
            }

            if (attributes instanceof Array && strFormat && getUnique(attributes).length > 1) {
                valueToAdd = strFormat.tcFormat(attributes);
            }
            else if (attributes instanceof Array && getUnique(attributes).length === 1) {
                valueToAdd = attributes[0];
            }

            var text = valueToAdd.toCamelCase();

            if (!intoResults(compareData)) {

                results.push({
                    text: text,
                    label: text,
                    id: ids.join('#'),
                    dataRole: self.typeName,
                    dataLayer: dataLayer,
                    properties: compareData
                });
            }
        });

        return results;
    };

    self.parseFeatures = function (data) {
        var parser;
        if (self.outputFormat === Consts.format.JSON) {
            parser = new TC.wrap.parser.JSON();
        }
        else {
            parser = new TC.wrap.parser.WFS({
                featureNS: self.featurePrefix,
                featureType: self.featureType
            });
        }
        return parser.read(data);
    };

    self.getPattern = function () {
        var self = this;

        if (typeof self.pattern === "function") {
            return self.pattern();
        } else {
            return self.pattern;
        }
    };

    self.filter = (function (self) {

        const bindRootFilterNode = function (filtersArr, dataT) {
            var rootFilters = [];

            if (dataT != self.parent.rootCfg.active.root) {
                // GLS: Si llego aquí, significa que el usuario está indicando la población
                if (dataT.indexOf('#') === -1 && !self.parent.rootCfg.active.limit) { // si no está limitada la búsqueda, indico la población

                    var filterNode = self.parent.rootCfg.active.queryProperties.firstQueryWord.map(function (queryWord) {
                        return self.filter.getFilterNode(queryWord, self.parent._LIKE_PATTERN + dataT + self.parent._LIKE_PATTERN);
                    });

                    if (filterNode.length > 1) {
                        rootFilters.push('<ogc:And>');
                        rootFilters = rootFilters.concat(filterNode);
                        rootFilters.push('</ogc:And>');
                    } else {
                        rootFilters = rootFilters.concat(filterNode);
                    }

                } else { // por tanto no añado todas las raíces posibles, añado la población que ha indicado (validando antes contra rootLabel)                     
                    const item = dataT.split('#');

                    self.parent.rootCfg.active.dataIdProperty.forEach(function addAnd(dataIdProperty, idx, arr) {
                        if (idx === 0 && arr.length > 1) {
                            rootFilters.push('<ogc:And>');
                        }

                        rootFilters.push(self.filter.getFilterNode(dataIdProperty, item.length > idx ? item[idx] : item[0]));

                        if (idx === arr.length - 1 && arr.length > 1) {
                            rootFilters.push('</ogc:And>');
                        }
                    });
                }
            } else {
                self.parent.rootCfg.active.root.forEach(function addOr(item, idx, arr) {
                    if (idx === 0 && arr.length > 1) {
                        rootFilters.push('<ogc:Or>');
                    }

                    self.parent.rootCfg.active.dataIdProperty.forEach(function addAnd(dataIdProperty, i, a) {
                        if (i === 0 && a.length > 1) {
                            rootFilters.push('<ogc:And>');
                        }

                        rootFilters.push(self.filter.getFilterNode(dataIdProperty, item.length > i ? item[i] : item[0]));

                        if (i === a.length - 1 && a.length > 1) {
                            rootFilters.push('</ogc:And>');
                        }
                    });
                });

                if (self.parent.rootCfg.active.root.length > 1) {
                    rootFilters.push('</ogc:Or>');
                }
            }

            return filtersArr.concat(rootFilters);
        };

        return {
            getPropertyValue: function (role, propertyName) {
                return self.getSearchTypeByRole(role)[propertyName];
            },
            getIsLikeNode: function (name, value) {
                var toEscape = /([\-\"\.\xba\(\)\/])/g;
                if (toEscape.test(value)) {
                    value = value.replace(toEscape, "\\$1");
                }

                if (value.toString().indexOf(self.parent._LIKE_PATTERN) > -1)
                    return '<Or><PropertyIsLike escape="\\" singleChar="_" wildCard="*" matchCase="false">' +
                        '<PropertyName>' + name + '</PropertyName>' +
                        '<Literal>' + value.toLowerCase().replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;") + '</Literal>' +
                        '</PropertyIsLike>' +
                        '<PropertyIsLike escape="\\" singleChar="_" wildCard="*" matchCase="false">' +
                        '<PropertyName>' + name + '</PropertyName>' +
                        '<Literal>' + value.toUpperCase().replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;") + '</Literal>' +
                        '</PropertyIsLike></Or>';
                else
                    return '<PropertyIsEqualTo>' +
                        '<PropertyName>' + name + '</PropertyName>' +
                        '<Literal>' + value.replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;") + '</Literal>' +
                        '</PropertyIsEqualTo>';
            },
            getFunctionStrMatches: function (name, value) {
                var toEscape = /([\-\"\xba\(\)\/])/g;
                if (toEscape.test(value)) {
                    value = value.replace(toEscape, "\\$1");
                }

                if (value.toString().indexOf(self.parent._LIKE_PATTERN) > -1) {

                    var pattern = value;
                    pattern = pattern.replace(/a/gi, "[aáà]");
                    pattern = pattern.replace(/e/gi, "[eéè]");
                    pattern = pattern.replace(/i/gi, "[iíì]");
                    pattern = pattern.replace(/o/gi, "[oóò]");
                    pattern = pattern.replace(/u/gi, "[uúüù]");

                    return '<ogc:PropertyIsEqualTo> ' +
                        '<ogc:Function name="strMatches"> ' +
                        '<ogc:PropertyName>' + name + '</ogc:PropertyName> ' +
                        '<ogc:Literal>' + '(?i)' + pattern.replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;") + '</ogc:Literal> ' +
                        '</ogc:Function> ' +
                        '<ogc:Literal>true</ogc:Literal> ' +
                        '</ogc:PropertyIsEqualTo>';
                }
                else {
                    return '<PropertyIsEqualTo>' +
                        '<PropertyName>' + name + '</PropertyName>' +
                        '<Literal>' + value.replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;") + '</Literal>' +
                        '</PropertyIsEqualTo>';
                }
            },
            getFilterNode: function (propertyName, propertyValue) {
                var r;

                var fn = self.filter.getIsLikeNode;

                if (self.filterByMatch) {

                    fn = self.filter.getFunctionStrMatches;

                    var regex = new RegExp('\\' + self.parent._LIKE_PATTERN, 'gi');
                    propertyValue = propertyValue.replace(regex, self.parent._MATCH_PATTERN);
                }

                if (!(propertyName instanceof Array) && typeof propertyName !== 'string') {
                    var f = [];
                    for (var key in propertyName) {
                        if (propertyName[key] instanceof Array && propertyName[key].length > 1) {
                            r = '<Or>';
                            propertyName[key].forEach(pName => {
                                r += fn(pName.trim(), propertyValue);
                            });

                            r += '</Or>';
                            f.push('(<Filter xmlns="http://www.opengis.net/ogc">' + r + '</Filter>)');
                        } else {
                            var propName = propertyName[key];
                            if (propertyName[key] instanceof Array && propertyName[key].length === 1) {
                                propName = propertyName[key][0];
                            }

                            f.push('(<Filter xmlns="http://www.opengis.net/ogc">' +
                                '<Or>' + fn(propName.trim(), propertyValue) + '</Or>' +
                                '</Filter>)');
                        }
                    }

                    return f.join('');

                } else if (propertyName instanceof Array && propertyName.length > 1) {
                    r = '<ogc:Or>';
                    propertyName.forEach(pName => {
                        r += fn(pName.trim(), propertyValue);
                    });
                    return r += '</ogc:Or>';
                } else {
                    return fn(propertyName instanceof Array && propertyName.length === 1 ? propertyName[0].trim() : propertyName.trim(), propertyValue);
                }
            },
            getFilter: function (data) {
                var r = {};
                r.multiL = false;
                r.f = '';

                var _f;

                switch (true) {
                    case self.typeName === Consts.searchType.NUMBER:
                        _f = [];
                        if (!self.parent.rootCfg.active && (/(\<|\>|\<\>)/gi.exec(data.t) || /(\<|\>|\<\>)/gi.exec(data.s))) {
                            let match = /(\<|\>|\<\>)/gi.exec(data.t);
                            if (match)

                                _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t.substring(0, data.t.indexOf(match[0])).trim() + self.parent._LIKE_PATTERN));
                            else {
                                if (self.parent.rootCfg.active) {
                                    _f = bindRootFilterNode(_f, data.t);
                                }
                                else {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN));
                                }
                            }

                            match = /(\<|\>|\<\>)/gi.exec(data.s);
                            if (match)
                                _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s.substring(0, data.s.indexOf(match[0])).trim() + self.parent._LIKE_PATTERN));
                            else _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s + self.parent._LIKE_PATTERN));
                        }
                        else {
                            if (self.parent.rootCfg.active) {
                                _f = bindRootFilterNode(_f, data.t);
                            } else {
                                _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN));
                            }
                            _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s + self.parent._LIKE_PATTERN));
                        }

                        _f.push(self.filter.getFilterNode(self.queryProperties.thirdQueryWord, data.p + self.parent._LIKE_PATTERN));

                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + '<ogc:And>' + _f.join('') + '</ogc:And>' + '</ogc:Filter>';

                        break;
                    case self.typeName === Consts.searchType.STREET:
                        _f = [];

                        if (!self.parent.rootCfg.active && (/(\<|\>|\<\>)/gi.exec(data.t) || /(\<|\>|\<\>)/gi.exec(data.s))) {
                            let match = /(\<|\>|\<\>)/gi.exec(data.t);
                            if (match)
                                _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t.substring(0, data.t.indexOf(match[0])).trim() + self.parent._LIKE_PATTERN));
                            else {
                                if (self.parent.rootCfg.active) {
                                    _f = bindRootFilterNode(_f, data.t);
                                }
                                else {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN));
                                }
                            }

                            match = /(\<|\>|\<\>)/gi.exec(data.s);
                            if (match)
                                _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s.substring(0, data.s.indexOf(match[0])).trim() + self.parent._LIKE_PATTERN));
                            else _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s + self.parent._LIKE_PATTERN));
                        } else {

                            if (self.parent.rootCfg.active) {
                                _f = bindRootFilterNode(_f, data.t);
                            }
                            else {
                                _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN));
                            }
                            _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s + self.parent._LIKE_PATTERN));
                        }
                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + '<ogc:And>' + _f.join('') + '</ogc:And>' + '</ogc:Filter>';
                        break;
                    case self.typeName === Consts.searchType.LOCALITY:
                        r.f = self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN);
                        r.multiL = true;
                        break;                                            // GLS: consulta de 2 niveles (carretera con pk / topónimo con municipio)
                    case Object.prototype.hasOwnProperty.call(self.queryProperties, 'secondQueryWord'):
                        _f = [];
                        _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN));
                        _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s + self.parent._LIKE_PATTERN));
                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + '<ogc:And>' + _f.join('') + '</ogc:And>' + '</ogc:Filter>';
                        break;
                    default: // GLS: consulta de 1 único nivel (municipio, casco urbano, carretera)
                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN) + '</ogc:Filter>';
                        break;
                }

                return r;
            },
            getParams: function (data) {
                var filters = self.filter.getFilter(data);

                var params = {
                    REQUEST: 'GetFeature',
                    SERVICE: 'WFS',
                    MAXFEATURES: 500,
                    VERSION: self.version,
                    OUTPUTFORMAT: self.outputFormat
                };

                var featureTypes = self.getFeatureTypes(true);
                if (!(featureTypes instanceof Array))
                    params.TYPENAME = self.featurePrefix ? self.featurePrefix + ':' + featureTypes.trim() : featureTypes.trim();
                else {
                    var ft = featureTypes.map(featureType => self.featurePrefix ?
                        self.featurePrefix + ':' + featureType.trim() :
                        featureType.trim());

                    params.TYPENAME = ft.join(',');
                }

                var _getProperties = function (properties) {
                    if ((properties || '') !== '') {
                        if (!(properties instanceof Array)) {
                            var p = [];
                            if (properties instanceof Object) {
                                for (var key in properties) {
                                    var prop = properties[key][0];
                                    if (properties[key].length > 1)
                                        prop = properties[key].join(',');

                                    p.push(prop);
                                }
                            }
                            return p;
                        }
                        else {
                            return properties.join(',');
                        }
                    }
                };
                var _properties = _getProperties(self.outputProperties);
                var _ids = _getProperties(self.dataIdProperty);

                const removeDuplicates = (toCheck) => {
                    const arr = toCheck.split(',');
                    return arr.filter((item, i) => {
                        return arr.indexOf(item) === i;
                    }).join(',');
                };

                if (_properties instanceof Array && _ids instanceof Array) {
                    params.PROPERTYNAME = '';
                    for (var i = 0; i < _properties.length; i++) {
                        params.PROPERTYNAME += '(' + removeDuplicates(_properties[i] + ',' + _ids[i]) + ')';
                    }
                } else {
                    params.PROPERTYNAME = removeDuplicates(_properties + ',' + _ids);
                }

                params.FILTER = filters.f;

                return TC.Util.getParamString(params);
            },
            getGoToFilter: function (id) {
                var props = [];
                var _id = id.split('#');

                var source = self.dataIdProperty;
                var dataLayer = self.getFeatureTypes();

                if (source && dataLayer) {

                    if (id.indexOf('#') > -1 && dataLayer instanceof Array && dataLayer.length > 1) {
                        dataLayer.forEach(dLayer => {
                            source[dLayer].forEach((src, idx) => {
                                props.push({ name: src, value: _id[idx] });
                            });
                        });
                    } else if (id.indexOf('#') === -1 && dataLayer instanceof Array) {
                        let src = source;

                        dataLayer.forEach(dLayer => {
                            if (!Object.prototype.hasOwnProperty.call(props, dLayer)) {

                                if (src instanceof Object && Object.prototype.hasOwnProperty.call(source, dLayer)) {
                                    src = source[dLayer];
                                }

                                src.forEach((s, idx) => {
                                    if (idx < _id.length) {
                                        props.push({ name: s, value: _id[idx] });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        if (source instanceof Object && Object.prototype.hasOwnProperty.call(source, dataLayer)) {
                            source = source[dataLayer];
                        }

                        source.forEach((src, idx) => {
                            props.push({ name: src, value: _id[idx] });
                        });
                    }
                }

                return self.filter.transformFilter(props);
            },
            transformFilter: function (properties) {

                if (properties && properties instanceof Array) {
                    var filters = properties.map(function (elm) {
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
                    } else {
                        return filters[0];
                    }
                }
            }
        };
    })(self);
};

TC.control.Search = function () {
    var self = this;
    TC.Control.apply(self, arguments);

    self._dialogDiv = TC.Util.getDiv(self.options.dialogDiv);
    if (!self.options.dialogDiv) {
        document.body.appendChild(self._dialogDiv);
    }

    self.exportsState = true;

    Consts.event.TOOLSCLOSE = Consts.event.TOOLSCLOSE || 'toolsclose.tc';

    self.url = '//idena.navarra.es/ogc/wfs';
    self.version = '1.1.0';
    self.featurePrefix = 'IDENA';

    if (self.options && self.options.url) {
        self.url = self.options.url;
    }

    self._LIKE_PATTERN = '*';
    self._MATCH_PATTERN = '.*';

    self.UTMX = 'X';
    self.UTMY = 'Y';
    self.LON = 'Lon';
    self.LAT = 'Lat';

    self.UTMX_LABEL = 'X: ';
    self.UTMY_LABEL = 'Y: ';
    self.LON_LABEL = 'Lon: ';
    self.LAT_LABEL = 'Lat: ';

    self.MUN = 'Mun';
    self.POL = 'Pol';
    self.PAR = 'Par';

    self.MUN_LABEL = 'Mun: ';
    self.POL_LABEL = 'Pol: ';
    self.PAR_LABEL = 'Par: ';

    self._search = { data: [] };

    self.EMPTY_RESULTS_LABEL = self.getLocaleString('noResults');
    self.EMPTY_RESULTS_TITLE = self.getLocaleString('checkCriterion');
    self.OUTBBX_LABEL = self.getLocaleString('outsideOfLimits');
    self.WFS_TYPE_ATTRS = ["url", "version", "geometryName", "featurePrefix", "featureType", "properties", "outputFormat"];

    self.availableSearchTypes = {};

    self.availableSearchTypes[Consts.searchType.CADASTRAL] = {
        suggestionRoot: null,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        searchWeight: 3,
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
                }
            }
        ],
        parser: self.getCadastralRef,
        goTo: self.goToCadastralRef,
        goToIdFormat: self.MUN + '{0}' + self.POL + '{1}' + self.PAR + '{2}',
        idPropertiesIdentifier: '#'
    };

    self.availableSearchTypes[Consts.searchType.COORDINATES] = {
        parser: self.getCoordinates,
        goTo: self.goToCoordinates,
        searchWeight: 4,
        label: null,
        suggestionListHead: function (_text) {
            return {
                label: self.availableSearchTypes[Consts.searchType.COORDINATES].label || self.getLocaleString('search.list.coordinates')
            };
        }
    };

    self.queryProperties = {
        QUERYWORD: 'QueryWord',
        FIRST: 'first',
        SECOND: 'second',
        THIRD: 'third'
    };

    self.availableSearchTypes[Consts.searchType.MUNICIPALITY] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
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
        searchWeight: 1,
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
        ],
        parser: self.getStringPattern.bind(this, [Consts.searchType.MUNICIPALITY]),
        stringPatternToCheck: self.stringPatternsValidators.s_or_t,
        goTo: self.goToStringPattern
    };

    //self.availableSearchTypes[Consts.searchType.LOCALITY] = {
    //    root: null,
    //    limit: false,
    //    url: self.url || '//idena.navarra.es/ogc/wfs',
    //    version: self.version || '1.1.0',
    //    outputFormat: Consts.format.JSON,
    //    featurePrefix: self.featurePrefix || 'IDENA',
    //    geometryName: 'the_geom',
    //    featureType: ['CATAST_Pol_Municipio', 'ESTADI_Pol_EntidadPob'],
    //    renderFeatureType: ['CATAST_Pol_Municipio'],
    //    dataIdProperty: {
    //        CATAST_Pol_Municipio: ['CMUNICIPIO'],
    //        ESTADI_Pol_EntidadPob: ['CMUNICIPIO', 'CENTIDAD']
    //    },
    //    queryProperties: {
    //        firstQueryWord: {
    //            CATAST_Pol_Municipio: ['MUNINOAC', 'MUNICIPIO'],
    //            ESTADI_Pol_EntidadPob: ['ENTINOAC', 'ENTIDAD']
    //        }
    //    },
    //    suggestionListHead: {
    //        label: "search.list.locality",
    //        color: "strokeColor"
    //    },
    //    outputProperties: {
    //        CATAST_Pol_Municipio: ['MUNICIPIO'],
    //        ESTADI_Pol_EntidadPob: ['MUNICIPIO', 'ENTIDAD']
    //    },
    //    outputFormatLabel: {
    //        CATAST_Pol_Municipio: '{0}',
    //        ESTADI_Pol_EntidadPob: '{1} ({0})'
    //    },
    //    searchWeight: 1,
    //    styles: [
    //        {
    //            polygon: {
    //                fillColor: '#000000',
    //                fillOpacity: 0,
    //                strokeColor: '#ffffff',
    //                strokeWidth: 5,
    //                strokeOpacity: 1
    //            }
    //        },
    //        {
    //            polygon: {
    //                fillColor: '#000000',
    //                fillOpacity: 0.1,
    //                strokeColor: '#feba1e',
    //                strokeWidth: 2,
    //                strokeOpacity: 1
    //            }
    //        }
    //    ],
    //    parser: self.getStringPattern.bind(this, [Consts.searchType.LOCALITY]),
    //    goTo: self.goToStringPattern
    //};

    self.availableSearchTypes[Consts.searchType.COUNCIL] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Pol_Concejo',
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO', 'CCONCEJO'],
        queryProperties: {
            firstQueryWord: ['CONCEJO']
        },
        outputProperties: ['MUNICIPIO', 'CONCEJO'],
        outputFormatLabel: '{1} ({0})',
        searchWeight: 4,
        parser: self.getStringPattern.bind(this, [Consts.searchType.COUNCIL]),
        stringPatternToCheck: self.stringPatternsValidators.s_or_t,
        goTo: self.goToStringPattern,
        idPropertiesIdentifier: '#',
        suggestionListHead: {
            label: "search.list.council",
            color: "strokeColor"
        },
        styles: [
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#49006a',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            }
        ]
    };

    self.availableSearchTypes[Consts.searchType.STREET] = {
        root: null,
        limit: null,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        renderFeatureType: 'CATAST_Txt_Calle',
        featureType: 'CATAST_Lin_CalleEje',
        dataIdProperty: ['CVIA'],
        searchWeight: 5,
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
                    labelRotationKey: "CADANGLE",
                    fontColor: "#000000",
                    fontSize: 10,
                    fontWeight: "bold",
                    labelOutlineColor: "#FFFFFF",
                    labelOutlineWidth: 4
                }
            }
        ],
        parser: self.getStringPattern.bind(this, [Consts.searchType.STREET]),
        goTo: self.goToStringPattern
    };

    self.availableSearchTypes[Consts.searchType.NUMBER] = {
        root: null,
        limit: null,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Txt_Portal',
        renderFeatureType: '',
        searchWeight: 6,
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
                    labelRotationKey: "CADANGLE",
                    fontColor: "#CB0000",
                    fontSize: 14,
                    labelOutlineColor: "#FFFFFF",
                    labelOutlineWidth: 4
                }
            }
        ],
        parser: self.getStringPattern.bind(this, [Consts.searchType.NUMBER]),
        goTo: self.goToStringPattern
    };

    self.availableSearchTypes[Consts.searchType.URBAN] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'ESTADI_Pol_EntidadPob',
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO', 'CENTIDAD'],
        idPropertiesIdentifier: '#',
        queryProperties: {
            firstQueryWord: ['ENTINOAC', 'ENTIDAD']
        },
        suggestionListHead: {
            label: "search.list.urban",
            color: "strokeColor"
        },
        outputProperties: ['MUNICIPIO', 'ENTIDAD'],
        outputFormatLabel: '{1} ({0})',
        searchWeight: 2,
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
        ],
        parser: self.getStringPattern.bind(this, [Consts.searchType.URBAN]),
        stringPatternToCheck: self.stringPatternsValidators.s_or_t,
        goTo: self.goToStringPattern
    };

    self.availableSearchTypes[Consts.searchType.PLACENAME] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'TOPONI_Txt_Toponimos',
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO', 'CTOPONIMO'],
        idPropertiesIdentifier: '#',
        queryProperties: {
            firstQueryWord: ['TOPONIMO', 'TOPONINOAC']
        },
        suggestionListHead: {
            label: "search.list.placeName",
            color: "fontColor"
        },
        outputProperties: ['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO'],
        outputFormatLabel: '{1} ({0})',
        searchWeight: 7,
        /*filterByMatch: true, // si queremos que filtre por expresión regular */
        styles: [
            {
                point: {
                    radius: 0,
                    label: "TOPONIMO",
                    labelRotationKey: "CADANGLE",
                    fontColor: "#ff5722",
                    fontSize: 14,
                    labelOutlineColor: "#FFFFFF",
                    labelOutlineWidth: 4
                }
            }
        ],
        parser: self.getStringPattern.bind(this, [Consts.searchType.PLACENAME]),
        stringPatternToCheck: self.stringPatternsValidators.s_or_t,
        goTo: self.goToStringPattern
    };

    self.availableSearchTypes[Consts.searchType.PLACENAMEMUNICIPALITY] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'TOPONI_Txt_Toponimos',
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO', 'CTOPONIMO'],
        idPropertiesIdentifier: '#',
        queryProperties: {
            firstQueryWord: ['MUNICIPIO', 'MUNINOAC'],
            secondQueryWord: ['TOPONIMO', 'TOPONINOAC']
        },
        suggestionListHead: {
            label: "search.list.placeName",
            color: "fontColor"
        },
        outputProperties: ['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO'],
        outputFormatLabel: '{1} ({0})',
        searchWeight: 8,
        /*filterByMatch: true, si queremos que filtre por expresión regular */
        styles: [
            {
                point: {
                    radius: 0,
                    label: "TOPONIMO",
                    labelRotationKey: "CADANGLE",
                    fontColor: "#ff5722",
                    fontSize: 14,
                    labelOutlineColor: "#FFFFFF",
                    labelOutlineWidth: 4
                }
            }
        ],
        parser: self.getStringPattern.bind(this, [Consts.searchType.PLACENAMEMUNICIPALITY]),
        stringPatternToCheck: [self.stringPatternsValidators.ts, self.stringPatternsValidators.st],
        goTo: self.goToStringPattern
    };

    self.availableSearchTypes[Consts.searchType.COMMONWEALTH] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: ['POLUCI_Pol_MancoRSUg'],
        renderFeatureType: '',
        dataIdProperty: ['CMANCOMUNI'],
        queryProperties: {
            firstQueryWord: ['MANCOMUNID']
        },
        outputProperties: ['MANCOMUNID'],
        outputFormatLabel: '{0}',
        searchWeight: 9,
        styles: [
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#fc4e2a',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            }
        ]
    };

    self.availableSearchTypes[Consts.searchType.ROAD] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'INFRAE_Lin_CtraEje',
        dataIdProperty: ['DCARRETERA'],
        queryProperties: {
            firstQueryWord: ['DCARRETERA']
        },
        suggestionListHead: {
            label: "search.list.road",
            color: "strokeColor"
        },
        outputProperties: ['DCARRETERA'],
        outputFormatLabel: self.getLocaleString('search.list.road.shorter') + ': ' + '{0}',
        searchWeight: 10,
        styles: [
            {
                polygon: {
                    strokeColor: "#00b2fc",
                    strokeOpacity: 1,
                    strokeWidth: 5
                },
                line: {
                    strokeColor: "#00b2fc",
                    strokeOpacity: 1,
                    strokeWidth: 5,
                    strokeLinecap: "round",
                    strokeDashstyle: "solid"
                }
            }
        ],
        parser: self.getRoad,
        goTo: self.goToRoad,
        pattern: function () {
            return new RegExp("^(?:(?:" + self.getLocaleString("search.list.road") + "|" + self.getLocaleString("search.list.road.shorter") + ")\\:?)?\\s*((A?|AP?|N?|R?|E?|[A-Z]{2}?|[A-Z]{1}?)\\s*\\-?\\s*(\\d{1,4})\\s*\\-?\\s*(A?|B?|C?|R?))$", "i");
        }
    };

    self.availableSearchTypes[Consts.searchType.ROADMILESTONE] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'INFRAE_Sym_CtraPK',
        dataIdProperty: ['DCARRETERA', 'CPK'],
        queryProperties: {
            firstQueryWord: ['DCARRETERA'],
            secondQueryWord: ['PK']
        },
        suggestionListHead: {
            label: "search.list.milestone.larger",
            color: "fontColor"
        },
        outputProperties: ['DCARRETERA', 'PK'],
        outputFormatLabel: self.getLocaleString('search.list.road.shorter') + ': {0} ' + self.getLocaleString('search.list.milestone') + ': {1}',
        searchWeight: 11,
        styles: [
            {
                point: {
                    label: ["DCARRETERA", "PK"],
                    fontColor: "#00b2fc",
                    fontSize: 14,
                    labelOutlineColor: "#ffffff",
                    labelOutlineWidth: 2
                }
            }
        ],
        parser: self.getMilestone,
        goTo: self.goToMilestone,
        pattern: function () {
            return new RegExp("^(?:(?:" + self.getLocaleString("search.list.road") + "|" + self.getLocaleString("search.list.road.shorter") + ")\\:?)?\\s*((A?|AP?|N?|R?|E?|[A-Z]{2}?|[A-Z]{1}?)\\s*\\-?\\s*(\\d{1,4})\\s*\\-?\\s*(A?|B?|C?|R?))\\s*\\,*\\s*(?:(?:" + self.getLocaleString("search.list.milestone") + "\\:?)|(?:P\\:?)|(?:K\\:?)|(?:KM\\:?)|(?:\\s+|\\,+))\\s*(\\d{1,4})$", "i");
        }
    };

    self.rootCfg = {};
    self.rootCfg[Consts.searchType.MUNICIPALITY] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Pol_Municipio',
        dataIdProperty: ['CMUNICIPIO'],
        queryProperties: {
            firstQueryWord: ['MUNICIPIO']
        },
        outputProperties: ['MUNICIPIO'],
        outputFormatLabel: '{0}',
        getRootLabel: function () {
            return new Promise(function (resolve, _reject) {

                if (self.rootCfg.active && !self.rootCfg[Consts.searchType.MUNICIPALITY].rootLabel) {

                    var params = {};
                    params.SERVICE = 'WFS';
                    params.VERSION = self.rootCfg[Consts.searchType.MUNICIPALITY].version;
                    params.REQUEST = 'GetFeature';
                    params.TYPENAME = self.rootCfg[Consts.searchType.MUNICIPALITY].featurePrefix + ':' + self.rootCfg[Consts.searchType.MUNICIPALITY].featureType;
                    params.OUTPUTFORMAT = self.rootCfg[Consts.searchType.MUNICIPALITY].outputFormat;
                    params.PROPERTYNAME = ['CMUNICIPIO'].concat(self.rootCfg[Consts.searchType.MUNICIPALITY].outputProperties).join(',');

                    params.CQL_FILTER = self.rootCfg[Consts.searchType.MUNICIPALITY].root.map(function (elem) {
                        return ['CMUNICIPIO'].map(function (id, index) {
                            return id + '=' + elem[index];
                        }).join(' AND ');
                    });

                    params.CQL_FILTER = params.CQL_FILTER.join(' OR ');

                    TC.ajax({
                        url: self.rootCfg[Consts.searchType.MUNICIPALITY].url + '?' + TC.Util.getParamString(params),
                        method: 'GET',
                        responseType: Consts.mimeType.JSON
                    }).then(function (response) {
                        const data = response.data;
                        if (data.totalFeatures > 0) {

                            self.rootCfg[Consts.searchType.MUNICIPALITY].rootLabel = data.features.map(function (feature) {
                                return {
                                    id: ['CMUNICIPIO'].map(function (elem) {
                                        return feature.properties[elem];
                                    }).join('#'),
                                    label: feature.properties[self.rootCfg[Consts.searchType.MUNICIPALITY].outputProperties[0]].toLowerCase()
                                };
                            });

                            resolve(self.rootCfg[Consts.searchType.MUNICIPALITY].rootLabel);

                        } else {
                            self.rootCfg[Consts.searchType.MUNICIPALITY].rootLabel = [];
                            resolve(self.rootCfg[Consts.searchType.MUNICIPALITY].rootLabel);
                        }
                    }).catch(function () {
                        resolve([]);
                    });
                }
                else {
                    resolve(self.rootCfg[Consts.searchType.MUNICIPALITY].rootLabel);
                }
            });
        }
    };
    self.rootCfg[Consts.searchType.LOCALITY] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: ['ESTADI_Pol_EntidadPob'],
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO', 'CENTIDADC'],
        queryProperties: {
            firstQueryWord: ['ENTINOAC']
        },
        outputProperties: ['ENTINOAC'],
        getRootLabel: function () {
            return new Promise(function (resolve, _reject) {
                if (self.rootCfg.active && !self.rootCfg[Consts.searchType.LOCALITY].rootLabel) {

                    var params = {};
                    params.SERVICE = 'WFS';
                    params.VERSION = self.rootCfg[Consts.searchType.LOCALITY].version;
                    params.REQUEST = 'GetFeature';
                    params.TYPENAME = self.rootCfg[Consts.searchType.LOCALITY].featurePrefix + ':' + self.rootCfg[Consts.searchType.LOCALITY].featureType;
                    params.OUTPUTFORMAT = self.rootCfg[Consts.searchType.LOCALITY].outputFormat;
                    params.PROPERTYNAME = ['CMUNICIPIO', 'CENTIDAD'].concat(self.rootCfg[Consts.searchType.LOCALITY].outputProperties).join(',');

                    params.CQL_FILTER = self.rootCfg[Consts.searchType.LOCALITY].root.map(function (elem) {
                        return ['CMUNICIPIO', 'CENTIDAD'].map(function (id, index) {
                            return id + '=' + elem[index];
                        }).join(' AND ');
                    });

                    params.CQL_FILTER = params.CQL_FILTER.join(' OR ');

                    TC.ajax({
                        url: self.rootCfg[Consts.searchType.LOCALITY].url + '?' + TC.Util.getParamString(params),
                        method: 'GET',
                        responseType: Consts.mimeType.JSON
                    }).then(function (response) {
                        const data = response.data;
                        if (data.totalFeatures > 0) {

                            self.rootCfg[Consts.searchType.LOCALITY].rootLabel = data.features.map(function (feature) {
                                return {
                                    id: ['CMUNICIPIO', 'CENTIDAD'].map(function (elem) {
                                        return feature.properties[elem];
                                    }).join('#'),
                                    label: feature.properties[self.rootCfg[Consts.searchType.LOCALITY].outputProperties[0]].toLowerCase()
                                };
                            });

                            resolve(self.rootCfg[Consts.searchType.LOCALITY].rootLabel);

                        } else {
                            self.rootCfg[Consts.searchType.LOCALITY].rootLabel = [];
                            resolve(self.rootCfg[Consts.searchType.LOCALITY].rootLabel);
                        }
                    }).catch(function () {
                        resolve([]);
                    });
                }
                else {
                    resolve(self.rootCfg[Consts.searchType.LOCALITY].rootLabel);
                }
            });
        }
    };

    self.allowedSearchTypes = [];

    if (self.options.allowedSearchTypes) {
        for (var allowed in self.options.allowedSearchTypes) {

            if (self.availableSearchTypes[allowed] && !TC.Util.isEmptyObject(self.options.allowedSearchTypes[allowed])) {

                // GLS: gestionamos el override de featureType y renderFeatureType.
                // Si por defecto cuenta con renderFeatureType y sobrescribe featureType y no renderFeatureType, 
                // elimino la propiedad renderFeatureType y elimino el último estilo definido, que se corresponde con el de renderFeatureType.
                if (self.availableSearchTypes[allowed].renderFeatureType && self.availableSearchTypes[allowed].renderFeatureType.length > 0 &&
                    self.options.allowedSearchTypes[allowed].featureType && !self.options.allowedSearchTypes[allowed].renderFeatureType) {

                    delete self.availableSearchTypes[allowed].renderFeatureType;
                    self.availableSearchTypes[allowed].styles = self.availableSearchTypes[allowed].styles.slice(0, self.availableSearchTypes[allowed].styles.length - 1);
                }

                // GLS: override de la configuración por defecto con la del config.JSON
                TC.Util.extend(self.availableSearchTypes[allowed], self.options.allowedSearchTypes[allowed]);


                // GLS: Limitamos la búsqueda en portales y calles cuando así se establezca en la configuración de las búsquedas
                if (self.options.allowedSearchTypes[allowed].root &&
                    (allowed !== Consts.searchType.MUNICIPALITY && self.options.allowedSearchTypes[allowed].rootType === Consts.searchType.MUNICIPALITY) ||
                    allowed !== Consts.searchType.LOCALITY && self.options.allowedSearchTypes[allowed].rootType === Consts.searchType.LOCALITY) {

                    self.rootCfg.active = self.rootCfg[self.options.allowedSearchTypes[allowed].rootType];
                    self.rootCfg.active.root = self.options.allowedSearchTypes[allowed].root;
                    self.rootCfg.active.limit = self.options.allowedSearchTypes[allowed].limit;

                    self.availableSearchTypes[Consts.searchType.STREET].queryProperties.firstQueryWord =
                        self.availableSearchTypes[Consts.searchType.NUMBER].queryProperties.firstQueryWord =
                        self.rootCfg.active.dataIdProperty;
                }
            }

            // Si esta a false lo borramos de las disponibles
            if (!self.options.allowedSearchTypes[allowed]) {
                delete self.options.allowedSearchTypes[allowed];
            } else {
                self.addAllowedSearchType(allowed, self.availableSearchTypes[allowed] ? self.availableSearchTypes[allowed] : self.options.allowedSearchTypes[allowed], self);
            }
        }
    }

    if (self.rootCfg.active) {
        self.rootCfg.active.getRootLabel();
    }

    self.queryableFeatures = self.options.queryableFeatures || false;

    self.UTMX_LEN = 6;
    self.UTMY_LEN = 7;

    self.wrap = new TC.wrap.control.Search(self);

    self.interval = 500;

    self.NORMAL_PATTERNS = {
        ROMAN_NUMBER: /M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}){1,}?\S?\./i,
        ABSOLUTE_NOT_DOT: /[`~!@#$%^&*_|+\=?;:'"\{\}\[\]\\]/gi,
        ABSOLUTE: /[`~!@#$%^&*_|+\=?;:'.\{\}\[\]\\]/gi
    };
};

TC.inherit(TC.control.Search, TC.Control);
TC.mix(TC.control.Search, TC.control.infoShare);

(function () {
    var ctlProto = TC.control.Search.prototype;

    ctlProto.CLASS = 'tc-ctl-search';

    Consts.event.SEARCHQUERYEMPTY = Consts.event.SEARCHQUERYEMPTY || 'searchqueryempty.tc';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-search.hbs";
    ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-search-dialog.hbs";

    ctlProto.register = function (map) {
        const self = this;
        return new Promise(function (resolve, reject) {
            Promise.all([TC.Control.prototype.register.call(self, map), self.renderPromise()]).then(function () {
                if (self.options && self.options.share) {
                    self.getShareDialog().then(function () {
                        resolve(self);
                    }).catch(function (err) {
                        reject(err instanceof Error ? err : Error(err));
                    });
                } else {
                    resolve(self);
                }
            });
        });
    };

    const highlighting = function (elm) {
        const self = this;

        var highlighted = elm.label;
        var strReg = [];

        // eliminamos caracteres extraños del patrón ya analizado

        if (self.lastPattern.trim().length === 0 && self.textInput.value.trim().length > 0) {
            self.lastPattern = self.textInput.value.trim();
        }

        var normalizedLastPattern = self.lastPattern;
        if (self.NORMAL_PATTERNS.ROMAN_NUMBER.test(normalizedLastPattern))
            normalizedLastPattern = normalizedLastPattern.replace(self.NORMAL_PATTERNS.ABSOLUTE_NOT_DOT, '');
        else
            normalizedLastPattern = normalizedLastPattern.replace(self.NORMAL_PATTERNS.ABSOLUTE, '');


        var querys = [];
        var separatorChar = ',';
        if (normalizedLastPattern.indexOf(separatorChar) === -1) {
            separatorChar = ' ';
        }

        querys = normalizedLastPattern.trim().split(separatorChar);

        // si estamos tratando con coordenadas el separador es el espacio, no la coma
        if (elm.label.indexOf(self.LAT_LABEL) > -1 && elm.label.indexOf(self.LON_LABEL) > -1 ||
            elm.label.indexOf(self.UTMX_LABEL) > -1 && elm.label.indexOf(self.UTMY_LABEL) > -1) {
            querys = self.lastPattern.split(' ');

            for (var t = 0; t < querys.length; t++) {
                if (querys[t].trim().slice(-1) === ',') {
                    querys[t] = querys[t].slice(0, -1);
                }
            }
        }

        for (var q = 0; q < querys.length; q++) {
            if (querys[q].trim().length > 0) {
                strReg.push('(' + querys[q].trim().replace(/\(/gi, "").replace(/\)/gi, "") + ')');
                const match = /((\<)|(\>)|(\<\>))/gi.exec(querys[q].trim());
                if (match) {
                    var _strReg = querys[q].trim().replace(/((\<)|(\>)|(\<\>))/gi, '').split(' ');
                    for (var st = 0; st < _strReg.length; st++) {
                        if (_strReg[st].trim().length > 0)
                            strReg.push('(' + _strReg[st].trim().replace(/\(/gi, "\\(").replace(/\)/gi, "\\)") + ')');
                    }
                }
            }
        }

        if (elm.dataRole === Consts.searchType.ROAD || elm.dataRole === Consts.searchType.ROADMILESTONE) {
            var rPattern = self.getSearchTypeByRole(elm.dataRole).getPattern();
            const match = rPattern.exec(self.lastPattern);

            if (match) {
                strReg = [];

                if (match[2] && match[3] && match[4]) {
                    strReg.push('(' + match[2] + "-" + match[3] + "-" + match[4] + ')');
                } else if (match[2] && match[3]) {
                    strReg.push('(' + match[2] + "-" + match[3] + ')');
                } else if (match[3] && match[4]) {
                    strReg.push('(' + match[3] + "-" + match[4] + ')');
                } else if (match[2] || match[3]) {
                    strReg.push('(' + (match[2] || match[3]) + ')');
                }

                if (match[5]) {
                    strReg.push("(?:" + self.getLocaleString("search.list.milestone") + "\\:\\s\\d*)" + "(" + match[5] + ")" + "\\d*");
                }
            }
        }

        var pattern = '(' + strReg.join('|') + ')';

        pattern = pattern.replace(/á|à/gi, "a");
        pattern = pattern.replace(/é|è/gi, "e");
        pattern = pattern.replace(/í|ì/gi, "i");
        pattern = pattern.replace(/ó|ò/gi, "o");
        pattern = pattern.replace(/ú|ù/gi, "u");
        pattern = pattern.replace(/ü/gi, "u");

        pattern = pattern.replace(/a/gi, "[a|á|à]");
        pattern = pattern.replace(/e/gi, "[e|é|è]");
        pattern = pattern.replace(/i/gi, "[i|í|ì]");
        pattern = pattern.replace(/o/gi, "[o|ó|ò]");
        pattern = pattern.replace(/u/gi, "[u|ú|ü|ù]");
        var rex = new RegExp(pattern, "gi");

        var label = elm.label;

        if (elm.dataRole !== Consts.searchType.ROAD || elm.dataRole !== Consts.searchType.ROADMILESTONE) {
            highlighted = label.replace(rex,
                function () {
                    var params = Array.prototype.slice.call(arguments, 0);

                    if (params[params.length - 3]) {
                        return params[0].replace(params[params.length - 3], "<b>" + params[params.length - 3] + "</b>");
                    } else {
                        return "<b>" + params[0] + "</b>";
                    }
                });
        } else {
            highlighted = label.replace(rex, "<b>$1</b>");
        }

        return highlighted;
    };

    const selectionCallback = function (e) {
        const self = this;
        var _target = e.target;

        if (_target.tagName.toLowerCase() !== 'a') {
            let el = e.target;
            const matchesSelector = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;

            while (el) {
                if (matchesSelector.call(el, 'a')) {
                    _target = el;
                    break;
                } else {
                    el = el.parentElement;
                }
            }
        }

        if (_target.querySelector('span[hidden]')) {
            self.textInput.value = _target.querySelector('span[hidden]').textContent;
            self.lastPattern = self.textInput.value;
            self._goToResult(unescape(_target.getAttribute('href')).substring(1), _target.parentNode.getAttribute('dataRole'));
            TC.UI.autocomplete.call(self.textInput, 'clear');

            self.shareButton && self.shareButton.classList.remove(Consts.classes.HIDDEN);
        }
    };

    const sortAlphaNum = function (a, b) {
        const reA = /[^a-zA-Z]/g;
        const reN = /[^0-9]/g;

        var AInt = parseInt(a, 10);
        var BInt = parseInt(b, 10);

        if (isNaN(AInt) && isNaN(BInt)) {
            var aA = a.replace(reA, "");
            var bA = b.replace(reA, "");
            if (aA === bA) {
                var aN = parseInt(a.replace(reN, ""), 10);
                var bN = parseInt(b.replace(reN, ""), 10);
                return aN === bN ? 0 : aN > bN ? 1 : -1;
            } else {
                return aA > bA ? 1 : -1;
            }
        } else if (isNaN(AInt)) {//A is not an Int
            return 1;//to make alphanumeric sort first return -1 here
        } else if (isNaN(BInt)) {//B is not an Int
            return -1;//to make alphanumeric sort first return 1 here
        } else {
            return AInt > BInt ? 1 : -1;
        }
    };

    const sortByRoleAndAlphabet = function (a, b) {
        const self = this;

        if (self.getSearchTypeByRole(a.dataRole).searchWeight && self.getSearchTypeByRole(b.dataRole).searchWeight) {
            if ((self.getSearchTypeByRole(a.dataRole).searchWeight || 0) > (self.getSearchTypeByRole(b.dataRole).searchWeight || 0)) {
                return 1;
            } else if ((self.getSearchTypeByRole(a.dataRole).searchWeight || 0) < (self.getSearchTypeByRole(b.dataRole).searchWeight || 0)) {
                return -1;
            }
            else {
                return sortAlphaNum(a.label, b.label);
            }
        } else {
            if (a.dataRole > b.dataRole) {
                return 1;
            }
            else if (a.dataRole < b.dataRole)
                return -1;
            else {
                return sortAlphaNum(a.label, b.label);
            }
        }
    };

    const sortByRoot = function (a, b) {
        const self = this;

        const sort_ = function () {
            var first = self.rootCfg.active.root[0] instanceof Array ? self.rootCfg.active.root[0].join('-') : self.rootCfg.active.root[0];

            var aRoot, bRoot;
            if (a.properties && a.properties.length > 0 && b.properties && b.properties.length > 0) {
                aRoot = self.rootCfg.active.dataIdProperty.map(function (elem) { return a.properties[elem].toString(); }).join('-');
                bRoot = self.rootCfg.active.dataIdProperty.map(function (elem) { return b.properties[elem].toString(); }).join('-');
            } else {
                aRoot = a.id;
                bRoot = b.id;
            }

            if (aRoot !== first && bRoot === first) {
                return 1;
            } else if (aRoot === first && bRoot !== first) {
                return -1;
            } else {
                return sortAlphaNum(a.label, b.label);
            }
        }.bind(this);

        if (self.getSearchTypeByRole(a.dataRole).searchWeight && self.getSearchTypeByRole(b.dataRole).searchWeight) {
            if ((self.getSearchTypeByRole(a.dataRole).searchWeight || 0) > (self.getSearchTypeByRole(b.dataRole).searchWeight || 0)) {
                return 1;
            } else if ((self.getSearchTypeByRole(a.dataRole).searchWeight || 0) < (self.getSearchTypeByRole(b.dataRole).searchWeight || 0)) {
                return -1;
            }
            else {
                return sort_();
            }
        }
        else {
            return sort_();
        }
    };

    const buildHTML = function (results) {
        const self = this;

        var html = [];
        var dataRoles = [];

        // ordenamos por roles y alfabéticamente
        var data = results.results.sort(sortByRoleAndAlphabet.bind(self));

        if (self.rootCfg.active) {// si hay root, aplicamos el orden por entidades 
            data = data.sort(sortByRoot.bind(self));
        }

        for (var i = 0; i < data.length; i++) {
            var elm = data[i];

            if (dataRoles.indexOf(elm.dataRole) === -1) {
                html.push(self.getSearchTypeByRole(elm.dataRole).getSuggestionListHead());
                dataRoles.push(elm.dataRole);
            }

            html.push(`<li dataRole="${elm.dataRole}"><a href="#${encodeURIComponent(elm.id)}"><span hidden>${elm.label}</span>${highlighting.call(self, elm)}</a></li>`);
        }

        Array.prototype.map.call(self.resultsList.querySelectorAll('li[dataRole]'), (elm) => {
            return elm.getAttribute('dataRole');
        }).filter((dataRole, i, liDataRoles) => {
            return liDataRoles.indexOf(dataRole) === i && !dataRoles.includes(dataRole);
        }).forEach(dataRole => {
            html.push(self.getSearchTypeByRole(dataRole).getSuggestionListHead());
            html.push(`<li dataRole="${dataRole}"><a class="tc-ctl-search-li-loading" href="#">${self.getLocaleString('searching')}<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>`);
        });

        return html.join('');
    };

    ctlProto.render = function () {
        const self = this;

        return self._set1stRenderPromise(Promise.all([
            self.renderData(),
            self.getRenderedHtml(self.CLASS + '-dialog', {}, function (html) {
                self._dialogDiv.innerHTML = html;
            })
        ]));
    };

    ctlProto.renderData = function (data, callback) {
        var self = this;
        self._search = self._search || {};
        var _search = function () {
            self.search(self.textInput.value, function (list) {
                if (list.length === 1) {
                    self.textInput.value = list[0].label;
                    self._goToResult(list[0].id, self.resultsList.querySelector('li:not([header])').getAttribute('dataRole'));
                    self.resultsList.classList.add(Consts.classes.HIDDEN);
                }
                else if (list.length === 0) {
                    self.resultsList.classList.add(Consts.classes.HIDDEN);
                }
            });
        };
        self.layerStyleFN = (function () {
            function getFeatureType(idFeature) {
                return idFeature.indexOf('.') > -1 ? idFeature.split('.')[0] : idFeature;
            }
            function getStyle(property, geomType, id) {
                var type = self.getSearchTypeByFeature(id);
                if (type) {
                    var style = type.getStyleByFeatureType(getFeatureType(id));
                    if (style && Object.prototype.hasOwnProperty.call(style, geomType)) {
                        return style[geomType][property];
                    }
                }
                return Cfg.styles[geomType][property];
            }
            return function (geomType, property, extractValue, f) {
                var self = this;
                if (!(f instanceof Feature)) {
                    self.map.trigger(Consts.event.FEATURESADD, { layer: self.layer, geom: f.geom });
                }
                var prop = getStyle(property, geomType, getFeatureType(f.id));
                if (extractValue) {
                    if (prop instanceof Array) {
                        var values = prop.map(function (p) {
                            const data = f.getData();
                            return Object.prototype.hasOwnProperty.call(data, p) ? data[p] : '';
                        });
                        var searchType = this.getSearchTypeByFeature(getFeatureType(f.id));
                        if (searchType) {
                            return searchType.outputFormatLabel.tcFormat(values);
                        } else {
                            return values.join(' ');
                        }
                    } else {
                        const data = f.getData();
                        return Object.prototype.hasOwnProperty.call(data, prop) ? data[prop] : '';
                    }
                }
                else {
                    return prop;
                }
            };
        }());
        return new Promise(function (resolve, reject) {
            TC.Control.prototype.renderData.call(self, Object.assign(data || {}, { share: self.options.share }), function () {
                if (self.map) {
                    self.layerPromise = self.map.addLayer({
                        id: self.getUID(),
                        title: 'Búsquedas',
                        owner: self,
                        stealth: true,
                        declutter: true,
                        type: Consts.layerType.VECTOR,
                        styles: {
                            polygon: {
                                fillColor: self.layerStyleFN.bind(self, 'polygon', 'fillColor', false),
                                fillOpacity: self.layerStyleFN.bind(self, 'polygon', 'fillOpacity', false),
                                strokeColor: self.layerStyleFN.bind(self, 'polygon', 'strokeColor', false),
                                strokeOpacity: self.layerStyleFN.bind(self, 'polygon', 'strokeOpacity', false),
                                strokeWidth: self.layerStyleFN.bind(self, 'polygon', 'strokeWidth', false)
                            },
                            line: {
                                strokeColor: self.layerStyleFN.bind(self, 'line', 'strokeColor', false),
                                strokeOpacity: self.layerStyleFN.bind(self, 'line', 'strokeOpacity', false),
                                strokeWidth: self.layerStyleFN.bind(self, 'line', 'strokeWidth', false)
                            },
                            marker: {
                                anchor: TC.Defaults.styles.marker.anchor,
                                height: TC.Defaults.styles.marker.height,
                                width: TC.Defaults.styles.marker.width
                            },
                            point: {
                                radius: self.layerStyleFN.bind(self, 'point', 'radius', false),
                                height: self.layerStyleFN.bind(self, 'point', 'height', false),
                                width: self.layerStyleFN.bind(self, 'point', 'width', false),
                                fillColor: self.layerStyleFN.bind(self, 'point', 'fillColor', false),
                                fillOpacity: self.layerStyleFN.bind(self, 'point', 'fillOpacity', false),
                                strokeColor: self.layerStyleFN.bind(self, 'point', 'strokeColor', false),
                                strokeWidth: self.layerStyleFN.bind(self, 'point', 'strokeWidth', false),
                                fontSize: self.layerStyleFN.bind(self, 'point', 'fontSize', false),
                                fontColor: self.layerStyleFN.bind(self, 'point', 'fontColor', false),
                                labelOutlineColor: self.layerStyleFN.bind(self, 'point', 'labelOutlineColor', false),
                                labelOutlineWidth: self.layerStyleFN.bind(self, 'point', 'labelOutlineWidth', false),
                                label: self.layerStyleFN.bind(self, 'point', 'label', true),
                                labelRotationKey: self.layerStyleFN.bind(self, 'point', 'labelRotationKey', true)
                            }
                        }
                    }).then(function (layer) {
                        self.layer = layer;
                        return self.layer;
                    });
                }
                else {
                    self.layerPromise = Promise.reject(new Error('Control not registered to map'));
                }

                // desde keypress y desde la lupa
                var _research = function () {
                    self.textInput.value = self.resultsList.label || self.resultsList.querySelector('li:not([header]) > a > span').textContent;
                    self.lastPattern = self.textInput.value;
                    self._goToResult(self.resultsList.id || unescape(self.resultsList.querySelector('li:not([header]) > a').getAttribute('href')).substring(1), self.resultsList.querySelector('li:not([header])').getAttribute('dataRole'));
                    self.resultsList.classList.add(Consts.classes.HIDDEN);
                };

                self.textInput = self.div.querySelector('input.' + self.CLASS + '-txt');
                if (self.options && self.options.placeHolder) {
                    self.textInput.setAttribute('placeHolder', self.options.placeHolder.trim());
                }

                self.resultsList = self.div.querySelector('.' + self.CLASS + '-list');
                self.button = self.div.querySelector('.' + self.CLASS + '-btn');
                self.button.addEventListener(Consts.event.CLICK, function () {
                    self.getLayer().then(function (l) {
                        if (self.resultsList.querySelectorAll('li > a:not(.tc-ctl-search-li-loading):not(.tc-ctl-search-li-empty)').length > 1) { }
                        else if (l.features.length > 0) {
                            l.map.zoomToFeatures(l.features);
                        }
                        else if (self.resultsList.querySelectorAll('li > a:not(.tc-ctl-search-li-loading):not(.tc-ctl-search-li-empty)').length === 1) {
                            _research();
                        }
                        else {
                            self.textInput.dispatchEvent(new Event("keyup"));
                        }
                    });
                }, { passive: true });
                if (self.options.instructions) {
                    self.textInput.setAttribute('title', self.options.instructions.trim());
                    self.button.setAttribute('title', self.options.instructions.trim());
                }

                // GLS: añadimos la funcionalidad al mensaje de "No hay resultados", al hacer click repliega el mensaje.
                self.resultsList.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('a.' + self.CLASS + '-li-empty', function () {
                    self.resultsList.classList.add(Consts.classes.HIDDEN);
                    self.textInput.focus();
                }), { passive: true });

                self.textInput.addEventListener('keypress', function (e) {
                    if (e.which == 13) {
                        e.preventDefault();
                        e.stopPropagation();

                        self.lastPattern = "";

                        if (self.resultsList.querySelectorAll('li > a:not(.tc-ctl-search-li-loading):not(.tc-ctl-search-li-empty)').length === 1) {
                            _research();
                        } else {
                            _search();
                        }
                        return false;
                    }
                });
                self.textInput.addEventListener("search", function () {
                    if (self.textInput.value.length === 0) {
                        delete self.toShare;
                        self.shareButton && self.shareButton.classList.add(Consts.classes.HIDDEN);
                        self.resultsList.classList.add(Consts.classes.HIDDEN);
                        _search();
                    }
                });
                self.textInput.addEventListener("input", function () {
                    if (self.textInput.value.length === 0) {
                        self.shareButton && self.shareButton.classList.add(Consts.classes.HIDDEN);
                        self.resultsList.classList.add(Consts.classes.HIDDEN);
                        _search();
                    }
                });
                self.textInput.addEventListener("targetCleared.autocomplete", function () {
                    self.shareButton && self.shareButton.classList.add(Consts.classes.HIDDEN);
                    self.resultsList.classList.add(Consts.classes.HIDDEN);
                });
                self.textInput.addEventListener("targetUpdated.autocomplete", function () {
                    if (self.resultsList.querySelectorAll('li').length > 0) {
                        self.resultsList.classList.remove(Consts.classes.HIDDEN);
                    }
                });


                if (self.options.share) {
                    self.shareButton = self.div.querySelector('.' + self.CLASS + '-share-btn');
                    self.shareButton.addEventListener(Consts.event.CLICK, function () {
                        self.showShareDialog();
                    }, { passive: true });
                }

                self.lastPattern = '';
                self.retryTimeout = null;
                var searchDelay;

                const source = function (_text, callback) {
                    self.lastpress = performance.now();

                    if (!searchDelay) {
                        const step = function () {
                            var criteria = self.textInput.value.trim();

                            if (criteria.length > 0 &&
                                (!self.lastPattern || criteria !== self.lastPattern) &&
                                performance.now() - self.lastpress > self.interval) {

                                window.cancelAnimationFrame(searchDelay);
                                searchDelay = undefined;

                                self.resultsList.classList.add(Consts.classes.HIDDEN);

                                // Pendiente de afinar
                                //if (self.lastPattern && criteria.substring(0, criteria.lastIndexOf(' ')) == self.lastPattern) {                                            

                                //    // Si el patrón de búsqueda anterior y actual es el mismo más algo nuevo (típico en la búsqueda de un portal), lo nuevo lo separo por coma
                                //    // self.lastPattern: "Calle Cataluña/Katalunia Kalea, Pamplona"
                                //    // text: "Calle Cataluña/Katalunia Kalea, Pamplona 18"

                                //    criteria = criteria.substring(0, criteria.lastIndexOf(' ')) + (self.lastPattern.trim().endsWith(',') ? "" : ",") + criteria.substring(criteria.lastIndexOf(' '));
                                //}

                                self.lastPattern = criteria;

                                self.search(criteria, callback);
                            } else {
                                searchDelay = requestAnimationFrame(step);
                            }
                        };

                        searchDelay = requestAnimationFrame(step);
                    }
                };

                TC.UI.autocomplete.call(self.textInput, {
                    link: '#',
                    target: self.resultsList,
                    minLength: 2,
                    ctx: self,
                    source: source,
                    callback: selectionCallback.bind(self),
                    buildHTML: buildHTML.bind(self)
                });

                const getNextSibling = function (elem, selector) {
                    // Get the next sibling element
                    var sibling = elem.nextElementSibling;
                    // If there's no selector, return the first sibling
                    if (!selector) return sibling;
                    // If the sibling matches our selector, use it
                    // If not, jump to the next sibling and continue the loop
                    while (sibling) {
                        if (sibling.matches(selector)) return sibling;
                        sibling = sibling.nextElementSibling;
                    }
                };

                const getPreviousSibling = function (elem, selector) {
                    // Get the next sibling element
                    var sibling = elem.previousElementSibling;
                    // If there's no selector, return the first sibling
                    if (!selector) return sibling;
                    // If the sibling matches our selector, use it
                    // If not, jump to the next sibling and continue the loop
                    while (sibling) {
                        if (sibling.matches(selector)) return sibling;
                        sibling = sibling.previousElementSibling;
                    }
                };

                // Detect up/down arrow
                const onKeydown = function (e) {
                    if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                        if (e.keyCode === 40) { // down arrow
                            if (self.textInput == document.activeElement && self.resultsList.querySelector('li:not([header]) a')) {
                                // Scenario 1: We're focused on the search input; move down to the first li
                                self.resultsList.querySelector('li:not([header]) a').focus();
                            } else if (self.resultsList.querySelector('li:not([header]):last-child a') === document.activeElement) { //} else if (self.resultsList.querySelector('li:not([header]):last a').is(':focus')) {
                                // Scenario 2: We're focused on the last li; move up to search input
                                self.textInput.focus();
                            } else {
                                // Scenario 3: We're in the list but not on the last element, simply move down
                                getNextSibling(document.activeElement.parentElement, 'li:not([header])')
                                    .querySelector('a').focus();
                            }
                            e.preventDefault(); // Stop page from scrolling
                            e.stopPropagation();
                        } else if (e.keyCode === 38) { // up arrow
                            if (self.textInput == document.activeElement) {
                                // Scenario 1: We're focused on the search input; move down to the last li
                                self.resultsList.querySelector('li:not([header]):last-child a').focus();
                            } else if (document.activeElement == self.resultsList.querySelector('li:not([header]) a')) {
                                self.resultsList.querySelector('li:not([header]):last-child a').focus();
                            } else {
                                // Scenario 3: We're in the list but not on the first element, simply move up
                                getPreviousSibling(document.activeElement.parentElement, 'li:not([header])')
                                    .querySelector('a').focus();
                            }
                            e.preventDefault(); // Stop page from scrolling
                            e.stopPropagation();
                        }
                    }
                    e.stopPropagation();
                };

                self.textInput.addEventListener('keydown', onKeydown);
                self.resultsList.addEventListener('keydown', onKeydown);

                if (TC.Util.isFunction(callback)) {
                    callback();
                }

                self.layerPromise.then(resolve).catch(reject);
            });
        });
    };

    ctlProto.addAllowedSearchType = function (name, options) {
        var self = this;

        self.allowedSearchTypes.push(new SearchType(name, options, self));
    };

    ctlProto.getSearchTypeByRole = function (type) {
        var self = this;

        return self.allowedSearchTypes.filter(function (allowed) {
            return allowed.typeName == type;
        })[0];
    };

    ctlProto.getSearchTypeByFeature = function (id) {
        var self = this;

        var type = self.allowedSearchTypes.filter(function (allowed) {
            return allowed.isFeatureOfThisType(id);
        });

        if (type.length > 0) {
            return type[0];
        }

        return null;
    };

    ctlProto.getElementOnSuggestionList = function (id, dataRole) {
        const self = this;

        for (var i = 0; i < self.searchRequestsResults.length; i++) {
            if (self.searchRequestsResults[i].id == id && (!dataRole || (dataRole && self.searchRequestsResults[i].dataRole === dataRole)))
                return self.searchRequestsResults[i];
        }
    };

    ctlProto.getLayer = function () {
        const self = this;
        return self.layerPromise;
    };

    ctlProto.getFeatures = function () {
        const self = this;
        return self.layer.features;
    };

    ctlProto.cleanMap = function () {
        const self = this;

        if (self.layer) {
            const l = self.layer;
            var features = l.features.slice();
            l.clearFeatures();

            if (features && features.length > 0) {
                self.map.trigger(Consts.event.FEATUREREMOVE, { layer: l, feature: features[0] });
            }

            for (var i = 0; i < self.WFS_TYPE_ATTRS.length; i++) {
                if (Object.prototype.hasOwnProperty.call(l, self.WFS_TYPE_ATTRS[i])) {
                    delete l[self.WFS_TYPE_ATTRS[i]];
                }
            }
        }
    };

    ctlProto.getMunicipalities = function () {
        var self = this;

        TC.cache.search = TC.cache.search || {};
        self._municipalitiesPromise = new Promise(function (resolve, _reject) {
            if (TC.cache.search.municipalities) {
                resolve(TC.cache.search.municipalities);
            }
            else {
                var type = self.getSearchTypeByRole(Consts.searchType.CADASTRAL);

                if (type.municipality && type.municipality.featureType && type.municipality.labelProperty && type.municipality.idProperty) {
                    var params = {
                        REQUEST: 'GetFeature',
                        SERVICE: 'WFS',
                        TYPENAME: type.municipality.featureType,
                        VERSION: type.version,
                        PROPERTYNAME: type.municipality.labelProperty + "," + type.municipality.idProperty,
                        OUTPUTFORMAT: type.outputFormat
                    };
                    if (type.featurePrefix) {
                        params.TYPENAME = type.featurePrefix + ':' + params.TYPENAME;
                    }
                    var url = type.url + '?' + TC.Util.getParamString(params);
                    TC.ajax({
                        url: url,
                        method: 'GET',
                        responseType: 'text'
                    }).then(function (response) {
                        const data = response.data;
                        var parser;
                        if (type.outputFormat === Consts.format.JSON) {
                            parser = new TC.wrap.parser.JSON();
                        }
                        else {
                            parser = new TC.wrap.parser.WFS({
                                featureNS: type.municipality.featurePrefix,
                                featureType: type.municipality.featureType
                            });
                        }
                        var features = parser.read(data);
                        TC.cache.search.municipalities = [];
                        for (var i = 0; i < features.length; i++) {
                            var feature = features[i];
                            TC.cache.search.municipalities.push({ label: feature.data[type.municipality.labelProperty], id: feature.data[type.municipality.idProperty] });
                        }

                        TC.cache.search.municipalities.sort(function (a, b) {
                            var result;
                            if (a.label < b.label) {
                                result = -1;
                            }
                            else if (a.label > b.label) {
                                result = 1;
                            }
                            else {
                                result = 0;
                            }
                            return result;
                        });

                        resolve(TC.cache.search.municipalities);
                    }).catch(function () {
                        resolve();
                    });
                } else {
                    throw new Error("Error en la configuración de la búsqueda: " + type.typeName + ". Error en el objeto municipality");
                }
            }
        });
        return self._municipalitiesPromise;
    };

    ctlProto.getCoordinates = function (pattern) {
        const self = this;
        return new Promise(function (resolve, reject) {
            var match = pattern.match(new RegExp('^' + self.UTMX_LABEL.trim().toLowerCase() + '*\\s*([-+]?[0-9]{' + self.UTMX_LEN + '}(?:[.,]\\d+)?)\\s*\\,?\\s*' + self.UTMY_LABEL.trim().toLowerCase() + '*\\s*([-+]?[0-9]{' + self.UTMY_LEN + '}(?:[.,]\\d+)?)$'));
            if (match) {
                pattern = match[1] + ' ' + match[2];
            }

            match = pattern.match(new RegExp('^' + self.LAT_LABEL.trim().toLowerCase() + '*\\s*([-+]?\\d{1,3}([.,]\\d+)?)\\,?\\s*' + self.LON_LABEL.trim().toLowerCase() + '*\\s*([-+]?\\d{1,2}([.,]\\d+)?)$'));
            if (match) {
                pattern = match[1] + ' ' + match[3];
            }

            if (/\d/.test(pattern) && (new RegExp('^([-+]?[0-9]{' + self.UTMX_LEN + '}(?:[.,]\\d+)?)\\s*\\,?\\s*([-+]?[0-9]{' + self.UTMY_LEN + '}(?:[.,]\\d+)?)$').test(pattern) || /^([-+]?\d{1,3}([.,]\d+)?)\,?\s*([-+]?\d{1,2}([.,]\d+)?)$/.test(pattern))) {
                match = /^([-+]?\d{1,3}([.,]\d+)?)\,?\s*([-+]?\d{1,2}([.,]\d+)?)$/.exec(pattern);
                if (match && (match[1].indexOf(',') > -1 || match[3].indexOf(',') > -1)) {
                    match[1] = match[1].replace(',', '.');
                    match[3] = match[3].replace(',', '.');

                    pattern = match[1] + ' ' + match[3];
                }

                if (!match || match && (match[1].indexOf(',') > -1 ? match[1].replace(',', '.') : match[1]) <= 180 && (match[3].indexOf(',') > -1 ? match[3].replace(',', '.') : match[3]) <= 90) {

                    match = new RegExp('^([-+]?[0-9]{' + self.UTMX_LEN + '}(?:[.,]\\d+)?)\\s*\\,?\\s*([-+]?[0-9]{' + self.UTMY_LEN + '}(?:[.,]\\d+)?)$').exec(pattern);
                    if (match && (match[1].indexOf(',') > -1 || match[2].indexOf(',') > -1)) {
                        match[1] = match[1].replace(',', '.');
                        match[2] = match[2].replace(',', '.');

                        pattern = match[1] + ' ' + match[2];
                    }

                    // parse coordinates
                    pattern = pattern.replace(self.UTMX_LABEL, '').replace(self.UTMY_LABEL, '').replace(self.LON_LABEL, '').replace(self.LAT_LABEL, '');
                    var coords = TC.Util.parseCoords(pattern);
                    if (coords) {
                        var xValue = coords[0].value;
                        var yValue = coords[1].value;
                        var xLabel = coords[0].type === Consts.UTM ? self.UTMX : self.LAT;
                        var yLabel = coords[1].type === Consts.UTM ? self.UTMY : self.LON;
                        var id = xLabel + xValue + yLabel + yValue;

                        var point = self.getPoint(id);
                        if (point && !self.insideLimit(point)) {
                            xValue = coords[1].value;
                            yValue = coords[0].value;
                            xLabel = coords[1].type === Consts.UTM ? self.UTMX : self.LAT;
                            yLabel = coords[0].type === Consts.UTM ? self.UTMY : self.LON;
                            id = xLabel + xValue + yLabel + yValue;
                            point = self.getPoint(id);
                        }

                        if (point) {
                            self.availableSearchTypes[Consts.searchType.COORDINATES].label = /^X([-+]?\d+(?:\.\d+)?)Y([-+]?\d+(?:\.\d+)?)$/.test(id) ? self.getLocaleString('search.list.coordinates.utm') + self.map.crs : self.getLocaleString('search.list.coordinates.geo');

                            //console.log('getCoordinates promise resuelta');
                            resolve([{
                                id: id, label: self.getLabel(id), dataRole: Consts.searchType.COORDINATES
                            }]);
                        }
                        else {
                            //console.log('getCoordinates promise resuelta');
                            reject();
                        }
                    } else {
                        //console.log('getCoordinates promise resuelta');
                        reject();
                    }
                } else {
                    //console.log('getCoordinates promise resuelta');
                    reject();
                }
            } else {
                //console.log('getCoordinates promise resuelta');
                reject();
            }
        });
    };

    ctlProto.getCadastralRef = function (pattern) {
        const self = this;
        return new Promise(function (resolve, reject) {
            var match = pattern.match(new RegExp(self.MUN_LABEL.trim().toLowerCase() + '?\\s(.*)\\,\\s?' + self.POL_LABEL.trim().toLowerCase() + '?\\s(\\d{1,2})\\,\\s?' + self.PAR_LABEL.trim().toLowerCase() + '?\\s(\\d{1,4})'));
            if (match) {
                pattern = match[1] + ', ' + match[2] + ', ' + match[3];
            }

            var _pattern = pattern;
            if (!/^(.*)\,(\s*\d{1,2}\s*)\,(\s*\d{1,4}\s*)$/.test(pattern) && self.getSearchTypeByRole(Consts.searchType.CADASTRAL).suggestionRoot)
                _pattern = self.getSearchTypeByRole(Consts.searchType.CADASTRAL).suggestionRoot + ', ' + pattern;

            if (/^(.*)\,(\s*\d{1,2}\s*)\,(\s*\d{1,4}\s*)$/.test(_pattern) && !new RegExp('^([-+]?[0-9]{' + self.UTMX_LEN + '})\\s*\\,\\s*([-+]?[0-9]{' + self.UTMY_LEN + '})$').test(pattern)) {
                self.getMunicipalities().then(function (list) {
                    var match = /^(.*)\,(\s*\d{1,2}\s*)\,(\s*\d{1,4}\s*)$/.exec(_pattern);
                    if (match) {
                        var matcher = new RegExp(match[1].trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
                        var results = [];

                        const getItem = function (mun, munLabel, pol, par) {
                            var properties = [];

                            properties.push[self.MUN] = mun;
                            properties.push[self.POL] = pol;
                            properties.push[self.PAR] = par;

                            return {
                                id: self.MUN + mun + self.POL + pol + self.PAR + par,
                                label: self.getLabel(self.MUN + munLabel + self.POL + pol + self.PAR + par),
                                dataRole: Consts.searchType.CADASTRAL,
                                properties: properties
                            };
                        };

                        results = list.filter(function (value) {
                            value = value.label || value.id || value;
                            return matcher.test(value) || matcher.test(self.removePunctuation(value));
                        });

                        if (results.length > 0) {
                            for (var i = 0; i < results.length; i++) {
                                results[i] = getItem(results[i].id, results[i].label, match[2].trim(), match[3].trim());
                            }
                        }

                        if (/^[0-9]*$/g.test(match[1])) {

                            if (match[1].trim() === self.getSearchTypeByRole(Consts.searchType.CADASTRAL).suggestionRoot) {

                                var suggestionRoot = list.filter(function (elm) {
                                    return parseInt(elm.id) === parseInt(self.getSearchTypeByRole(Consts.searchType.CADASTRAL).suggestionRoot);
                                })[0];

                                if (suggestionRoot) {
                                    resolve([getItem(suggestionRoot.id, suggestionRoot.label, match[2].trim(), match[3].trim())]);
                                }
                            }

                            results.push(getItem(match[1].trim(), match[1].trim(), match[2].trim(), match[3].trim()));
                        }

                        //console.log('getCadastralRef promise resuelta');
                        resolve(results);
                    }
                });
            } else {
                //console.log('getCadastralRef promise resuelta - no es ref catastral');
                reject();
            }
        });
    };

    ctlProto.stringPatternsValidators = {
        tsp: function (text, result, root, limit) {
            const self = this;
            // town, street, portal - street, town, portal
            var match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);
            if (match && match[1] && match[2]) {

                var getPortal = function () {
                    return formatStreetNumber.call(self, (match[3] || match[4] || match[5] || match[6]).trim());
                };
                // ninguno contiene número duplicamos búsqueda
                if (/^([^0-9]+)$/i.test(match[1].trim()) && /^([^0-9]+)$/i.test(match[2].trim())) {
                    result.push({
                        t: match[1].trim(), s: match[2].trim(), p: getPortal()
                    });
                    result.push({
                        t: match[2].trim(), s: match[1].trim(), p: getPortal()
                    });
                }
                else {  // indicamos como calle el criterio que contiene números, ya que no existen municipios con números pero sí calles
                    if (/^([^0-9]+)$/i.test(match[1].trim())) result.push({
                        t: match[1].trim(), s: match[2].trim(), p: getPortal()
                    });
                    else result.push({
                        s: match[1].trim(), t: match[2].trim(), p: getPortal()
                    });
                }
                bindRoot.call(this, result, root, limit);
                return true;
            }

            return false;
        },
        spt: function (text, result, root, limit) {
            const self = this;
            // street, portal, town
            var match = /^(?:([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))(?:\s*\,\s*)([^0-9\,]+)$/i.exec(text);
            if (match && match[6] && match[1]) {

                var getPortal = function () {
                    return formatStreetNumber.call(self, (match[2] || match[3] || match[4] || match[5]).trim());
                };
                // ninguno contiene número duplicamos búsqueda
                if (/^([^0-9]+)$/i.test(match[6].trim()) && /^([^0-9]+)$/i.test(match[1].trim())) {
                    result.push({
                        t: match[6].trim(), s: match[1].trim(), p: getPortal()
                    });
                    result.push({
                        t: match[1].trim(), s: match[6].trim(), p: getPortal()
                    });
                }
                else {  // indicamos como calle el criterio que contiene números, ya que no existen municipios con números pero sí calles
                    if (/^([^0-9]+)$/i.test(match[6].trim())) result.push({
                        t: match[6].trim(), s: match[1].trim(), p: getPortal()
                    });
                    else result.push({
                        s: match[6].trim(), t: match[1].trim(), p: getPortal()
                    });
                }
                bindRoot.call(this, result, root, limit);
                return true;
            }

            return false;
        },
        tnsp: function (text, result, root, limit) {
            const self = this;
            // town, numbers street, portal
            var match = /^(?:([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)([^0-9\,]+)(?:\s*\,\s*)(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);

            if (match && match[1] && match[2]) {
                result.push({
                    t: match[2].trim(), s: match[1].trim(), p: formatStreetNumber.call(self, (match[3] || match[4] || match[5] || match[6]).trim())
                });
                bindRoot.call(this, result, root, limit);
                return true;
            }

            return false;
        },
        ts: function (text, result, root, limit) {
            const self = this;
            // town, street
            var match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúüàèìòù"\s*\-\.\(\)\/0-9]+))$/i.exec(text);

            // topónimo, municipio
            if (!match && /^[^0-9]*$/i.test(text.trim())) { // si no hay números reviso dándole la vuelta, si hay números que lo trate la función st
                var criteria = text.split(',').reverse();
                match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúüàèìòù"\s*\-\.\(\)\/0-9]+))$/i.exec(criteria.join(','));
            }

            if (match && match[1] && match[2]) {
                // ninguno contiene número duplicamos búsqueda
                if (/^([^0-9]+)$/i.test(match[1].trim()) && /^([^0-9]+)$/i.test(match[2].trim())) {
                    result.push({
                        t: match[1].trim(), s: match[2].trim()
                    });
                    result.push({
                        s: match[1].trim(), t: match[2].trim()
                    });

                    bindRoot.call(this, result, root, limit);
                }
                else {  // indicamos como calle el criterio que contiene números, ya que no existen municipios con números pero sí calles

                    var getStreet = function (s) {
                        var revS = s.split(' ').reverse();
                        // validamos si el criterio es compuesto 
                        var fs = [];
                        for (var si = 0; si < revS.length; si++) {
                            if (revS[si].length === 1) {
                                fs.push(revS[si]);
                                revS[si] = '';
                            }
                        }

                        return fs.length > 0 ? revS.reverse().join(' ').trim() + self._LIKE_PATTERN + fs.reverse().join(self._LIKE_PATTERN) : revS.reverse().join(' ').trim();
                    };

                    if (/^([^0-9]+)$/i.test(match[1].trim()))
                        result.push({
                            t: match[1].trim(), s: getStreet(match[2].trim())
                        });
                    else result.push({
                        s: getStreet(match[1].trim()), t: match[2].trim()
                    });

                    bindRoot.call(this, result, root, limit, true);
                }

                return true;
            }

            return false;
        },
        st: function (text, result, root, limit) {
            const self = this;
            // street, town
            var match = /^(?:([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)([^0-9\,]+)$/i.exec(text);

            if (!match) {
                const criteria = text.split(',').reverse();
                match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúüàèìòù"\s*\-\.\(\)\/0-9]+))$/i.exec(criteria.join(','));
            }

            if (match) { // puede generar falsos positivos cuando el portal llega seguido de la calle -> calle mayor 14, pamplona
                var data = {
                };
                const criteria = text.split(',').reverse();
                for (var i = 0; i < criteria.length; i++) {
                    if (/^([^0-9\,]+)$/i.test(criteria[i].trim())) { // si no hay números se trata de municipio
                        data.t = criteria[i].trim();
                    }
                    else if (/(\s*\d+)/i.test(criteria[i].trim())) { // si contiene número, puede ser calle o calle + portal
                        if (criteria[i].trim().indexOf(' ') === -1) { // si no contiene espacios se trata de calle compuesta por números
                            data.s = criteria[i].trim();
                        } else { // si contiene espacio puede contener calle + portal
                            var _criteria = criteria[i].trim().split(' ').reverse();

                            var isPortal = function (c) {
                                var m = /^(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(c.trim());
                                if (m) {
                                    data.p = formatStreetNumber.call(self, c.trim());
                                    return true;
                                }
                                return false;
                            };

                            var x = 0;
                            var p = _criteria[x].trim();
                            while (x < _criteria.length && !isPortal(p)) {
                                x++;
                                if (x < _criteria.length)
                                    p = p + _criteria[x];

                            }

                            if (data.p) {
                                var _cr = _criteria;
                                for (var h = 0; h < _cr.length; h++) {
                                    // validamos que lo que hemos deducido como portal, está en portal para no añadirlo a calle
                                    var inPortal = false;
                                    for (var c = 0; c < _cr[h].split('').length; c++) {
                                        if (data.p.indexOf(_cr[h][c]) > -1)
                                            inPortal = true;
                                    }

                                    if (inPortal) {
                                        _cr[h] = '';
                                        if (data.p == formatStreetNumber.call(self, p)) {
                                            break;
                                        }
                                    }
                                }

                                if (/^([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+)$/i.test(_criteria.reverse().join(' ').trim())) {
                                    var fs = [];
                                    var criteriaRev = _criteria.reverse();
                                    for (var chs = 0; chs < criteriaRev.length; chs++) {
                                        if (criteriaRev[chs].trim().length === 1) {
                                            fs.push(criteriaRev[chs].trim());
                                            criteriaRev[chs] = '';
                                        }
                                    }

                                    data.s = fs.length > 0 ? criteriaRev.reverse().join(' ').trim() + self._LIKE_PATTERN + fs.reverse().join(self._LIKE_PATTERN) : criteriaRev.reverse().join(' ').trim();
                                }


                                // nombre_de_calle = 137, 1, 20...
                                // duplico la búsqueda para el caso de [Calle nombre_de_calle], municipio
                                result.push({
                                    t: data.t,
                                    s: data.s + ' ' + data.p
                                });
                            } else {
                                data.s = criteria[i].trim();
                            }
                        }
                    }
                }

                result.push(data);
                bindRoot.call(this, result, root, limit);
                return true;
            }

            return false;
        },
        s_or_t: function (text, result, root, _limit) {
            var match = /^([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9\<\>]+)$/i.exec(text);
            if (match && match[1]) {
                if (root) {
                    result.push({
                        t: match[1].trim()
                    });

                    result.push({
                        t: root,
                        s: match[1].trim()
                    });
                }
                else result.push({
                    t: match[1].trim()
                });
                return true;
            }

            return false;
        },
        sp: function (text, result, root, _limit) {
            const self = this;
            var match = /^([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/]+)\s*\,?\s*((\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);
            if (match && match[1] && match[2]) { // && text.indexOf(',') > -1 && text.split(',').length < 3) {
                if (root)
                    result.push({
                        t: root,
                        s: match[1].trim(),
                        p: formatStreetNumber.call(self, match[2].trim())
                    });
                else
                    result.push({
                        t: match[1].trim(),
                        s: match[2].trim()
                    });

                return true;
            }

            return false;
        },
        snp: function (text, result, root, _limit) { // calle puede contener números con portal (cuando exista un municipio root establecido)
            const self = this;
            var match = /^([^\,][0-9\s*\-\.\(\)\/]+)\s*\,?\s*(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4})$/i.exec(text);
            if (match && match[1] && match[2] && root) {
                result.push({
                    t: root,
                    s: match[1].trim(),
                    p: formatStreetNumber.call(self, match[2].trim())
                });
                return true;
            }

            return false;
        }
    };

    /* métodos auxiliares de getStringPattern */

    const normalizedCriteria = function (value) {
        const self = this;

        value = self.removePunctuation(value);

        // elimino los caracteres especiales
        if (self.NORMAL_PATTERNS.ROMAN_NUMBER.test(value)) {
            value = value.replace(self.NORMAL_PATTERNS.ABSOLUTE_NOT_DOT, '');
        }
        else {
            value = value.replace(self.NORMAL_PATTERNS.ABSOLUTE, '');
        }
        return value.toLowerCase();
    };

    const formatStreetNumber = function (value) {
        const self = this;

        var is_nc_c = function (value) {
            return /^(\d{1,3})\s?\-?\s?([a-z]{0,4})\s?\-?\s?([a-z]{0,4})$/i.test(value);
        };
        var nc_c = function (value) {
            var f = [];
            var m = /^(\d{1,3})\s?\-?\s?([a-z]{0,4})\s?\-?\s?([a-z]{0,4})$/i.exec(value);
            if (m) {
                for (var i = 1; i < m.length; i++) {
                    if (m[i].trim().length > 0)
                        f.push(m[i].trim());
                }

                return f.join(self._LIKE_PATTERN);
            }
            return value;
        };

        var is_cn = function (value) {
            return /^([a-z]{1,4})\s?\-?\s?(\d{1,3})$/i.test(value);
        };
        var cn = function (value) {
            var f = [];
            var m = /^([a-z]{1,4})\s?\-?\s?(\d{1,3})$/i.exec(value);
            if (m) {
                for (var i = 1; i < m.length; i++) {
                    if (m[i].trim().length > 0)
                        f.push(m[i].trim());
                }

                return f.join(self._LIKE_PATTERN);
            }
            return value;
        };

        var is_sn = function (value) {
            return /^(sn|S\/N|s\/n|s\-n)$/i.test(value);
        };
        var sn = function (value) {
            var m = /^(sn|S\/N|s\/n|s\-n)$/i.exec(value);
            if (m) {
                return 's*n';
            }
            return value;
        };


        var is_cmc = function (value) {
            return /^([a-z]{1,4}\s?\+\s?[a-z]{1,4})$/i.test(value);
        };
        var cmc = function (value) {
            var m = /^([a-z]{1,4}\s?\+\s?[a-z]{1,4})$/i.exec(value);
            if (m) {
                return value;
            }
            return value;
        };

        var isCheck = [is_nc_c, is_cn, is_sn, is_cmc];
        var check = [nc_c, cn, sn, cmc];
        var ch = 0;
        while (ch < check.length && !isCheck[ch].call(self, value)) {
            ch++;
        }

        if (ch < check.length)
            return check[ch].call(self, value);
        else return value;
    };

    const bindRoot = function (result, root, limit, addRoot) {
        const self = this;

        if (root) {
            var i = result.length;
            while (i--) {
                if (!addRoot) {
                    if (result[i].t) {
                        var indicatedRoot = self.rootCfg.active.rootLabel.filter(function (elem) {
                            return elem.label.indexOf(self.removePunctuation(result[i].t).toLowerCase()) > -1;
                        }.bind(self));

                        if (indicatedRoot.length === 1) {
                            result[i].t = indicatedRoot[0].id;
                        } else if (indicatedRoot.length > 1) {

                            indicatedRoot.map(function (elem) {
                                var newResult = TC.Util.extend({
                                }, result[i]);
                                newResult.t = elem.id;

                                result.push(newResult);
                            });

                        } else if (indicatedRoot.length === 0 && limit) {
                            result.splice(i, 1);
                        }
                    }
                }
                else {
                    result.push(TC.Util.extend({}, result[i], { t: root }));
                }
            }
        }
    };

    const getObjectsFromStringToQuery = function (allowedRoles, text) {
        const self = this;
        const root = self.rootCfg.active && self.rootCfg.active.root || '';
        const limit = self.rootCfg.active && self.rootCfg.active.limit || false;

        var result = [];

        const test = function () {
            var tests = [function (text) {
                return text.length >= 3;
            },
            function (text) {
                return /^\d+$/.test(text) ?
                    false :
                    /^\d+\,\s*\d+$/.test(text) ? false : true;
            }];

            for (var i = 0; i < tests.length; i++) {
                if (!tests[i].call(self, text))
                    return false;
            }

            return true;
        };

        // eliminamos espacios en blanco
        text = text.trim();

        // comprobamos si acaba con coma, si es así, la eliminamos
        if (text.charAt(text.length - 1) === ',') {
            text = text.substring(0, text.length - 1);
        }

        if (test(text)) {
            var check = [];

            check = allowedRoles.map(function (dataRole) {
                return self.getSearchTypeByRole(dataRole);
            }).filter(function (searchType) {
                return searchType.stringPatternToCheck;
            }).map(function (searchType) {
                return searchType.stringPatternToCheck;
            }).flat();

            if (check.length === 0) {
                check = [self.stringPatternsValidators.tsp, self.stringPatternsValidators.spt, self.stringPatternsValidators.tnsp, self.stringPatternsValidators.ts, self.stringPatternsValidators.st];
                if (root && text.split(',').length < 3) {
                    check = [self.stringPatternsValidators.sp, self.stringPatternsValidators.snp, self.stringPatternsValidators.s_or_t].concat(check);
                }
                else {
                    check = check.concat([self.stringPatternsValidators.sp, self.stringPatternsValidators.snp, self.stringPatternsValidators.s_or_t]);
                }
            }

            var ch = 0;
            try {
                while (ch < check.length && !check[ch].call(self, text, result, root, limit)) {
                    ch++;
                }
            }
            catch (ex) {
                TC.error("Error según el patrón: " + text, Consts.msgErrorMode.EMAIL, "Error en la búsqueda del callejero");
            }

            return result;
        }

        return null;
    };

    const requestToWFS = function (type, signal, doneCallback, data) {

        return fetch(type.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: type.filter.getParams(data),
            signal: signal
        })
            .then(function (response) {
                if (response.ok) {
                    return response.text();
                } else {
                    throw "Search: error requestToWFS";
                }
            })
            .then(doneCallback)
            .catch(function (err) {
                if (err.name === 'AbortError') {
                    console.log('Search: petición abortada');
                } else {
                    TC.error(err);
                    throw err;
                }

                //console.log('getStringPattern promise resuelta - data.statusText: ' + data.statusText);
            });
    };

    ctlProto.getStringPattern = function (allowedRoles, pattern) {
        const self = this;

        return new Promise((resolve, reject) => {
            let toQuery = [];
            let requestsQuery = [];

            pattern = normalizedCriteria.call(self, pattern);

            /* gestionamos:
                Entidad de población: Irisarri Auzoa (Igantzi)
                Topónimo: Aldabeko Bidea (Arbizu)
             */
            let combinedCriteria = /(.*)\((.*)\)?/.exec(pattern);
            if (combinedCriteria && combinedCriteria.length > 2) {
                // búsqueda de entidad de población
                toQuery = getObjectsFromStringToQuery.call(self, allowedRoles, combinedCriteria[1]) || [];
                // búsqueda de topónimo
                let toQueryCombined = getObjectsFromStringToQuery.call(self, allowedRoles, combinedCriteria[1] + ',' + combinedCriteria[2]) || [];

                toQuery = toQuery.concat(toQueryCombined);
            } else {
                toQuery = getObjectsFromStringToQuery.call(self, allowedRoles, pattern) || [];
            }

            if (toQuery.length > 0) {
                let pendingSuggestionLstHead = [];
                let filterRoles = (dataToQuery) => {
                    return allowedRoles.filter(function (elm) {
                        return Object.keys(self.getSearchTypeByRole(elm).queryProperties).length === Object.keys(dataToQuery).length;
                    });
                };
                let pendingHeaderRoles = [];

                for (var i = 0; i < toQuery.length; i++) {
                    let dataToQuery = toQuery[i];
                    let roles = filterRoles(dataToQuery);

                    for (var r = 0; r < roles.length; r++) {
                        let type = self.getSearchTypeByRole(roles[r]);

                        if (pendingHeaderRoles.indexOf(type.typeName) < 0) {
                            pendingSuggestionLstHead.push(type.getSuggestionListHead());
                            pendingSuggestionLstHead.push('<li dataRole="' + type.typeName + '"><a class="tc-ctl-search-li-loading" href="#">' + self.getLocaleString('searching') + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>');

                            pendingHeaderRoles.push(type.typeName);
                        }

                        let responseToSuggestionLstElmt = (response) => {
                            return type.getSuggestionListElements(response);
                        };

                        requestsQuery.push(requestToWFS.call(self, type, self.searchRequestsAbortController.signal, responseToSuggestionLstElmt, dataToQuery));
                    }
                }

                if (requestsQuery.length > 0) {
                    self.resultsList.innerHTML += pendingSuggestionLstHead.join('');
                    self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));

                    Promise.all(requestsQuery)
                        .then((results) => {
                            //console.log('getStringPattern promise resuelta');                                  
                            resolve([].concat.apply([], results));
                        }).catch((_error) => {
                            reject();
                        });
                } else {
                    reject();
                }
            } else {
                reject();
            }
        });
    };

    ctlProto.getRoad = function (pattern) {
        const self = this;
        return new Promise(function (resolve, reject) {
            pattern = pattern.trim();
            if (pattern.length < 2) {
                resolve([]);
            } else {
                var type = self.getSearchTypeByRole(Consts.searchType.ROAD);

                var roadPattern = type.getPattern();
                var match = roadPattern.exec(pattern);
                if (match && match[3]) {

                    var _pattern = match[2] ? match[2].trim() + "-" + match[3].trim() : match[3].trim();
                    if (match[4] && match[4].length > 0) {
                        _pattern = _pattern + "-" + match[4].trim();
                    }

                    self.resultsList.innerHTML = type.getSuggestionListHead() +
                        '<li dataRole="' + type.typeName + '"><a class="tc-ctl-search-li-loading" href="#">' + self.getLocaleString('searching') + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>';
                    self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));

                    //console.log('getRoad new');
                    fetch(type.url + '?' + type.filter.getParams({ t: _pattern }), {
                        signal: self.searchRequestsAbortController.signal
                    }).then((response) => {
                        if (response.ok) {
                            return response.text();
                        } else {
                            throw "Search: error getRoad";
                        }
                    }).then((response) => {
                        let result = [];
                        let data = type.parseFeatures(response);
                        if (data.length > 0) {
                            data.map(function (feature) {
                                var properties = type.outputProperties;
                                if (!result.some(function (elem) {
                                    return (elem.text == feature.data[properties[0]]);
                                })) {
                                    var label = type.outputFormatLabel.tcFormat(type.outputProperties.map(function (outputProperty) {
                                        return feature.data[outputProperty];
                                    }));

                                    var text = type.outputProperties.map(function (outputProperty) {
                                        return feature.data[outputProperty];
                                    }).join('-');

                                    result.push({
                                        id: type.dataIdProperty.map(function (elem) {
                                            return feature.data[elem];
                                        }).join('#'),
                                        label: label,
                                        text: text,
                                        dataLayer: feature.id.split('.')[0],
                                        dataRole: type.typeName
                                    });
                                }
                            });

                            //console.log('getRoad promise resuelta');
                            resolve(result);
                        } else {
                            //console.log('getRoad promise resuelta');
                            reject();
                        }
                    }).catch(function (_data) {
                        //console.log('getRoad promise resuelta - xhr fail');
                        reject();
                    });
                } else {
                    //console.log('getRoad promise resuelta - no encaja en road');
                    reject();
                }
            }
        });
    };

    ctlProto.getMilestone = function (pattern) {
        var self = this;
        return new Promise(function (resolve, reject) {
            pattern = pattern.trim();
            if (pattern.length < 3) {
                resolve([]);
            } else {

                var type = self.getSearchTypeByRole(Consts.searchType.ROADMILESTONE);

                var roadMilestonePattern = type.getPattern();
                var match = roadMilestonePattern.exec(pattern);
                if (match && match[3] && match[5]) {

                    var _pattern = match[2] ? match[2].trim() + "-" + match[3].trim() : match[3].trim();
                    if (match[4] && match[4].length > 0) {
                        _pattern = _pattern + "-" + match[4].trim();
                    }

                    self.resultsList.innerHTML = type.getSuggestionListHead() +
                        '<li dataRole="' + type.typeName + '"><a class="tc-ctl-search-li-loading" href="#">' + self.getLocaleString('searching') + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>';
                    self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));

                    //console.log('getMilestone new');

                    fetch(type.url + '?' + type.filter.getParams({ t: _pattern, s: match[5].trim() }), {
                        signal: self.searchRequestsAbortController.signal
                    }).then((response) => {
                        if (response.ok) {
                            return response.text();
                        } else {
                            throw "Search: error getMilestone";
                        }
                    }).then(function (response) {
                        let result = [];
                        let data = type.parseFeatures(response);
                        if (data.length > 0) {
                            data.map(function (feature) {
                                var properties = type.outputProperties;
                                if (!result.some(function (elem) {
                                    return (elem.label == feature.data[properties[0]]);
                                })) {
                                    var text = type.outputFormatLabel.tcFormat(type.outputProperties.map(function (outputProperty) {
                                        return feature.data[outputProperty];
                                    }));
                                    result.push({
                                        id: type.dataIdProperty.map(function (elem) {
                                            return feature.data[elem];
                                        }).join('#'),
                                        label: text,
                                        text: text,
                                        dataLayer: feature.id.split('.')[0],
                                        dataRole: type.typeName
                                    });
                                }
                            });
                            //console.log('getMilestone promise resuelta');
                            resolve(result);
                        } else {
                            //console.log('getMilestone promise resuelta');
                            reject();
                        }
                    }).catch(function (_data) {
                        //console.log('getMilestone promise resuelta - xhr fail');
                        reject();
                    });
                } else {
                    //console.log('getMilestone promise resuelta - no encaja en pk');
                    reject();
                }
            }
        });
    };

    ctlProto.search = function (pattern, callback) {
        var self = this;

        pattern = pattern.trim();
        if (pattern.length > 0) {
            pattern = pattern.toLowerCase();

            if (self.searchRequestsAbortController) {
                self.searchRequestsAbortController.abort();
            }

            self.resultsList.innerHTML = '';
            self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));

            self.searchRequestsResults = [];

            let onAbort = () => {
                self.searchRequestsAbortController.signal.removeEventListener('abort', onAbort);
            };

            self.searchRequestsAbortController = new AbortController();
            self.searchRequestsAbortController.signal.addEventListener('abort', onAbort);

            let toRender = 0;
            let renderingEnd = () => {
                toRender--;
                if (toRender === 0) {
                    // si al término de las peticiones ya estamos con otro patrón no hacemos nada
                    if (pattern !== self.textInput.value.trim().toLowerCase()) {
                        return;
                    }
                    else {
                        if (self.searchRequestsResults.length === 0) {
                            self.cleanMap();

                            if (!self.layer || self.layer.features.length === 0) {

                                self.resultsList.innerHTML = '<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>';
                                self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));
                            }
                        }

                        self.lastPattern = "";
                    }
                }
            };

            let renderResultsOnSuggestionList = () => {
                if (self.searchRequestsResults) {
                    self.searchRequestsResults = self.searchRequestsResults.sort(function (a, b) {
                        var pattern = /(\d+)/;
                        var _a, _b = '';
                        if (pattern.test(a.label) && pattern.test(b.label)) {
                            _a = a.label.match(pattern)[1];
                            _b = b.label.match(pattern)[1];
                        } else {
                            _a = a.label;
                            _b = b.label;
                        }

                        if (_a > _b)
                            return 1;
                        else
                            if (_a < _b)
                                return -1;
                            else
                                return 0;
                    });

                    // compatibilidad hacia atrás
                    self._search.data = self.searchRequestsResults;

                    if (callback) {
                        callback(self.searchRequestsResults);
                    }
                }
            };

            self.allowedSearchTypes.forEach(function (allowed) {
                if (allowed.parser) {
                    toRender++;

                    //console.log('registramos promesa: ' + allowed.typeName);

                    allowed.parser.call(self, pattern)
                        .then(function (dataRole, result) {

                            let manageLoadingByDataRole = () => {
                                let loadingElemOfDataRole = self.resultsList.querySelector('li[dataRole="' + dataRole + '"]');
                                if (loadingElemOfDataRole) {
                                    let indexLoadingElemOfDataRole = Array.prototype.indexOf.call(loadingElemOfDataRole.parentElement.childNodes, loadingElemOfDataRole);
                                    let headerElemOfDataRole = self.resultsList.childNodes[indexLoadingElemOfDataRole - 1];

                                    self.resultsList.removeChild(headerElemOfDataRole);
                                    self.resultsList.removeChild(loadingElemOfDataRole);
                                }
                            };

                            //console.log('resulta promesa: ' + dataRole);

                            if (result && result.length > 0) {

                                // caso topónimo con y sin municipio Irisarri Auzoa (Igantzi)
                                let toConcat = result.filter(elm => self.searchRequestsResults.findIndex((srrElm) => srrElm.id === elm.id) === -1);
                                if (toConcat.length === result.length) {
                                    self.searchRequestsResults = self.searchRequestsResults.concat(toConcat);

                                    renderResultsOnSuggestionList();
                                } else if (result.length === 1) {
                                    manageLoadingByDataRole();
                                }
                            } else {
                                manageLoadingByDataRole();
                            }

                            renderingEnd();

                            //resolve(result);
                        }.bind(self, allowed.typeName)).catch(function (_dataRole) {
                            //reject();
                            //console.log('reject promesa: ' + dataRole);
                            renderingEnd();
                        }.bind(self, allowed.typeName));
                } else {
                    console.log('Falta implementación del método parser');
                }
            });
        }
        else {
            self.lastPattern = "";

            self.cleanMap();
        }
    };

    var setQueryableFeatures = function (features) {
        const self = this;

        if (features && features.length > 0) {
            const setShowPopup = function (features) {
                for (var i = 0; i < features.length; i++) {
                    if (features[i].showsPopup != self.queryableFeatures)
                        features[i].showsPopup = self.queryableFeatures;
                }
            };
            setShowPopup(features);
            // salta el evento con la primera feature y es la que llega aquí pero se pintan más y no asignamos el showPopup a todas 
            setShowPopup(self.layer.features);
        }
    };
    ctlProto._goToResult = function (id, dataRole) {
        const self = this;

        self.toShare = { id: id, dataRole: dataRole };

        var goTo = null;

        //02/03/2020 cuando selecciona un elemento abortamos peticiones pendientes
        if (self.searchRequestsAbortController) {
            self.searchRequestsAbortController.abort();
        }

        return new Promise(function (resolve, reject) {
            if (!self.loading)
                self.loading = self.map.getControlsByClass("TC.control.LoadingIndicator")[0];

            var wait;
            wait = self.loading.addWait();

            // en pantallas pequeñas, colapsamos el panel de herramientas
            if (matchMedia('(max-width: 30em)').matches) {
                self.textInput.blur();
                self.map.trigger(Consts.event.TOOLSCLOSE);
            }

            self.cleanMap();

            var customSearchType = false;

            for (var i = 0, ii = self.allowedSearchTypes.length; i < ii; i++) {
                const allowed = self.allowedSearchTypes[i];
                if (!self.availableSearchTypes[allowed.typeName]) {

                    if (allowed.goTo) {
                        customSearchType = true;

                        goTo = allowed.goTo.call(self, id);
                        if (goTo !== null) {
                            break;
                        }
                    } else {
                        console.log('Falta implementación del método goTo');
                    }

                } else {

                    const dr = dataRole || self.getElementOnSuggestionList.call(self, id).dataRole;
                    if (dr) {
                        const searchType = self.getSearchTypeByRole(dr);

                        if (self.availableSearchTypes[dr] && searchType && searchType.goTo) {
                            goTo = searchType.goTo.call(self, id, dr);
                            if (goTo !== null) {
                                break;
                            }
                        } else if (!self.availableSearchTypes[dr] && searchType && searchType.goTo) {
                            customSearchType = true;

                            goTo = searchType.goTo.call(self, id, dr);
                            if (goTo !== null) {
                                break;
                            }
                        } else {
                            console.log('Falta implementación del método goTo');
                        }
                    }
                }
            }

            self.loading.removeWait(wait);

            if (goTo) {
                self.getLayer().then(function (layer) {
                    var i;
                    switch (true) {
                        case goTo.params.type === Consts.layerType.VECTOR:
                            for (i = 0; i < self.WFS_TYPE_ATTRS.length; i++) {
                                if (Object.prototype.hasOwnProperty.call(layer, self.WFS_TYPE_ATTRS[i])) {
                                    delete layer[self.WFS_TYPE_ATTRS[i]];
                                }
                            }
                            break;
                        case goTo.params.type === Consts.layerType.WFS:
                            for (i = 0; i < self.WFS_TYPE_ATTRS.length; i++) {
                                layer[self.WFS_TYPE_ATTRS[i]] = goTo.params[self.WFS_TYPE_ATTRS[i]];
                            }
                            break;
                        default:
                    }

                    layer.type = goTo.params.type;

                    const onFeaturesAdd = function (e) {
                        if (e.layer === self.layer) {
                            self.map.off(Consts.event.FEATURESADD, onFeaturesAdd);
                            setQueryableFeatures.call(self, e.features);
                        }
                    };
                    self.map.on(Consts.event.FEATURESADD, onFeaturesAdd);

                    const layerEventHandler = function (e) {
                        if (e.layer === layer) {
                            self.map.off(Consts.event.LAYERUPDATE, layerEventHandler);
                            // Salta cuando se pinta una feature que no es de tipo API porque la gestión de estilos salta antes (no es controlable)
                            self.map.one(Consts.event.FEATURESADD, function (e) {
                                if (e.layer === layer) {
                                    if (!e.layer.features || e.layer.features.length === 0 && e.layer.wrap.layer.getSource().getFeatures()) {
                                        self.resultsList.classList.add(Consts.classes.HIDDEN);
                                        var bounds = e.layer.wrap.layer.getSource().getExtent();
                                        var radius = e.layer.map.options.pointBoundsRadius;

                                        if (bounds[2] - bounds[0] === 0) {
                                            bounds[0] = bounds[0] - radius;
                                            bounds[2] = bounds[2] + radius;
                                        }
                                        if (bounds[3] - bounds[1] === 0) {
                                            bounds[1] = bounds[1] - radius;
                                            bounds[3] = bounds[3] + radius;
                                        }
                                        e.layer.map.setExtent(bounds);

                                        // gestionamos el zoom en imporState cuando estemos cargando estado
                                        if (self.map.on3DView && !self.loadingState) { // GLS: Necesito diferenciar un zoom programático de un zoom del usuario para la gestión del zoom en 3D
                                            self.map._on3DZoomTo({ extent: bounds, layer: e.layer });
                                        }
                                    }
                                    else if (e.layer.features && e.layer.features.length > 0) {
                                        self.resultsList.classList.add(Consts.classes.HIDDEN);
                                        // gestionamos el zoom en imporState cuando estemos cargando estado
                                        if (!self.loadingState) {
                                            self.layer.map.zoomToFeatures(e.layer.features);
                                        }

                                        self.map.trigger(Consts.event.FEATURESADD, { layer: self.layer, features: self.layer.features });

                                    } else if (e.layer.features && e.layer.features.length === 0 && goTo.params.type === Consts.layerType.WFS) {
                                        self.resultsList.inner = goTo.emptyResultHTML;
                                        self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));

                                        self.map.trigger(Consts.event.SEARCHQUERYEMPTY);
                                    }
                                }

                                self.loading.removeWait(wait);
                            });

                            if (e.layer.features && e.layer.features.length > 0) {
                                self.resultsList.classList.add(Consts.classes.HIDDEN);
                                // gestionamos el zoom en imporState cuando estemos cargando estado
                                if (!self.loadingState) {
                                    self.layer.map.zoomToFeatures(self.layer.features);
                                }

                                self.map.trigger(Consts.event.FEATURESADD, { layer: self.layer, features: self.layer.features });

                                self.loading.removeWait(wait);
                            } else if (e.layer.features && e.layer.features.length === 0 && goTo.params.type === Consts.layerType.WFS) {
                                self.resultsList.innerHTML = goTo.emptyResultHTML;
                                self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));

                                if (!(e.newData && e.newData.features && e.newData.features.length > 0)) {
                                    self.map.trigger(Consts.event.SEARCHQUERYEMPTY);
                                }

                                self.loading.removeWait(wait);
                            }

                            resolve(goTo);
                        }
                    };
                    self.map.on(Consts.event.LAYERUPDATE, layerEventHandler);
                    layer.wrap.reloadSource();
                });
            } else {
                reject(Error('Method goTo has no implementation'));
                if (!customSearchType) {
                    self.map.trigger(Consts.event.SEARCHQUERYEMPTY);
                }
            }
        });
    };

    ctlProto.goToResult = function (id, dataRole) {
        var self = this;
        // si está habilitada
        if (self.getSearchTypeByRole(dataRole)) {
            return self._goToResult(id, dataRole);
            // si no está habilitada pero está disponible
        } else if (self.availableSearchTypes[dataRole]) {
            self.addAllowedSearchType(dataRole, self.availableSearchTypes[dataRole], self);
            return self._goToResult(id, dataRole);
        } else {
            alert('No se reconoce el tipo de búsqueda: ' + dataRole);
        }
    };

    var drawPoint = function (id) {
        var self = this;

        let wait = self.loading.addWait();

        var point = self.getPoint(id);
        var title;
        var promise;

        if (point) {
            title = self.getLabel(id);
            promise = self.layer.addMarker(point, TC.Util.extend({}, self.map.options.styles.point, { title: title, group: title }));
        } else {
            var match = /^Lat((?:[+-]?)\d+(?:\.\d+)?)Lon((?:[+-]?)\d+(?:\.\d+)?)$/.exec(id);
            id = self.LAT + match[2] + self.LON + match[1];
            point = self.getPoint(id);

            if (point) {
                title = self.getLabel(id);
                promise = self.layer.addMarker(point, TC.Util.extend({}, self.map.options.styles.point, { title: title, group: title }));

                self.textInput.value = title;
            }
        }
        const promiseTemp = new Promise((resolve) => {
            setTimeout(() => { resolve(); },100)
        })
        Promise.all([promise, promiseTemp]).then(function (param) {
            self.map.trigger(Consts.event.LAYERUPDATE, {
                layer: self.layer, newData: param[0]
            });

            self.map.trigger(Consts.event.FEATURESADD, {
                layer: self.layer, features: [param[0]]
            });
            

            self.map.zoomToFeatures([param[0]]);

            self.loading.removeWait(wait);
        });

    };
    ctlProto.goToCoordinates = function (id) {
        var self = this;
        var goTo = {};
        if (/^X([-+]?\d+(?:[\.\,]\d+)?)Y([-+]?\d+(?:[\.\,]\d+)?)$/.test(id) || /^Lat((?:[+-]?)\d+(?:[.,]\d+)?)Lon((?:[+-]?)\d+(?:[.,]\d+)?)$/.test(id)) {

            goTo.params = {
                type: Consts.layerType.VECTOR,
                styles: {
                    marker: {
                        url: self.layerStyleFN.bind(self, 'marker', 'url', true)
                    }
                }
            };

            goTo.emptyResultHTML = '<li><a class="tc-ctl-search-li-empty">' + self.OUTBBX_LABEL + '</a></li>';

            drawPoint.call(self, id);

            return goTo;
        }

        return null;
    };

    ctlProto.goToCadastralRef = function (id) {
        var self = this;
        var goTo = {};

        var regex = new RegExp("^" + self.MUN + "(\\d+)" + self.POL + "(\\d{1,2})" + self.PAR + "{1}(\\d{1,4})");
        if (regex.test(id)) {
            var match = regex.exec(id);

            var type = self.getSearchTypeByRole(Consts.searchType.CADASTRAL);

            goTo.params = {
                type: Consts.layerType.WFS,
                url: type.url,
                version: type.version,
                geometryName: type.geometryName,
                featurePrefix: type.featurePrefix,
                featureType: type.featureType,
                properties: new TC.filter.and(
                    new TC.filter.equalTo(type.queryProperties.firstQueryWord, match[1].trim()),
                    new TC.filter.equalTo(type.queryProperties.secondQueryWord, match[2].trim()),
                    new TC.filter.equalTo(type.queryProperties.thirdQueryWord, match[3].trim())),
                outputFormat: type.outputFormat,
                styles: type.styles
            };

            goTo.emptyResultHTML = '<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>';

            return goTo;
        }

        return null;
    };

    ctlProto.goToRoad = function (id) {
        var self = this;
        var goTo = {};

        var type = self.getSearchTypeByRole(Consts.searchType.ROAD);

        goTo.params = {
            type: Consts.layerType.WFS,
            url: type.url,
            version: type.version,
            geometryName: type.geometryName,
            featurePrefix: type.featurePrefix,
            featureType: type.getFeatureTypes(),
            maxFeatures: 3000,
            properties: type.filter.getGoToFilter(id),
            outputFormat: type.outputFormat,
            styles: type.styles
        };

        goTo.emptyResultHTML = '<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>';

        return goTo;
    };

    ctlProto.goToMilestone = function (id) {
        var self = this;
        var goTo = {};

        var type = self.getSearchTypeByRole(Consts.searchType.ROADMILESTONE);

        goTo.params = {
            type: Consts.layerType.WFS,
            url: type.url,
            version: type.version,
            geometryName: type.geometryName,
            featurePrefix: type.featurePrefix,
            featureType: type.getFeatureTypes(),
            maxFeatures: 3000,
            properties: type.filter.getGoToFilter(id),
            outputFormat: type.outputFormat,
            styles: type.styles
        };

        goTo.emptyResultHTML = '<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>';

        return goTo;
    };

    ctlProto.goToStringPattern = function (id, dataRole) {
        var self = this;
        var goTo = {};

        var type = self.getSearchTypeByRole(dataRole);

        goTo.params = {
            type: Consts.layerType.WFS,
            url: type.url,
            version: type.version,
            geometryName: type.geometryName,
            featurePrefix: type.featurePrefix,
            featureType: type.getFeatureTypes(),
            maxFeatures: 3000,
            properties: type.filter.getGoToFilter(id),
            outputFormat: type.outputFormat,
            styles: type.styles
        };

        return goTo;
    };

    ctlProto.getPoint = function (pattern) {
        var self = this;
        var isMapGeo = self.map.wrap.isGeo();
        var point;
        var match = /^X([-+]?\d+(?:\.\d+)?)Y([-+]?\d+(?:\.\d+)?)$/.exec(pattern);
        if (match && match.length === 3) {
            point = [parseFloat(match[1]), parseFloat(match[2])];
            if (isMapGeo) {
                point = TC.Util.reproject(point, self.map.options.utmCrs, self.map.crs);
            }
        }
        else {
            match = /^Lat((?:[+-]?)\d+(?:[.,]\d+)?)Lon((?:[+-]?)\d+(?:[.,]\d+)?)$/.exec(pattern);
            if (match && match.length === 3) {
                point = [parseFloat(match[2]), parseFloat(match[1])];
                if (!isMapGeo) {
                    return TC.Util.reproject(point, self.map.options.geoCrs, self.map.crs);
                }
            }

            match = /^Lon((?:[+-]?)\d+(?:[.,]\d+)?)Lat((?:[+-]?)\d+(?:[.,]\d+)?)$/.exec(pattern);
            if (match && match.length === 3) {
                point = [parseFloat(match[2]), parseFloat(match[1])];
                if (!isMapGeo) {
                    return TC.Util.reproject(point, self.map.options.geoCrs, self.map.crs);
                }
            }
        }

        return point;
    };

    ctlProto.insideLimit = function (point) {
        var self = this;
        var getIntersectsBounds = function (extent, point) {
            if (extent instanceof Array)
                return point[0] >= extent[0] && point[0] <= extent[2] && point[1] >= extent[1] && point[1] <= extent[3];
            else return true;
        };

        if (getIntersectsBounds(self.map.options.maxExtent, point)) {
            return true;
        }

        return false;
    };

    ctlProto.getPattern = function () {
        var self = this;
        return self.textInput.value;
    };

    ctlProto.getLabel = function (id) {
        var self = this;
        var result = id;
        var locale = TC.Util.getMapLocale(self.map);

        const geoCoordsLabel = function (result, match) {
            let parsedCoords = TC.Util.parseCoords(match[1] + ',' + match[3]);
            result = result.replace(match[1], parsedCoords[0].value.toLocaleString(locale, { minimumFractionDigits: Consts.DEGREE_PRECISION, maximumFractionDigits: Consts.DEGREE_PRECISION }));
            result = result.replace(match[3], parsedCoords[1].value.toLocaleString(locale, { minimumFractionDigits: Consts.DEGREE_PRECISION, maximumFractionDigits: Consts.DEGREE_PRECISION }));

            return result;
        };

        if (id.match(new RegExp('^(?:' + self.LAT + '[-\\d])|(?:' + self.UTMX + '[-+]?[\\d])'))) {
            result = result.replace(self.LAT, self.LAT_LABEL).replace(self.LON, ' ' + self.LON_LABEL).replace(self.UTMX, self.UTMX_LABEL).replace(self.UTMY, ' ' + self.UTMY_LABEL);
            let match = result.match(new RegExp('^' + self.LAT_LABEL.trim() + '*\\s*([-+]?\\d{1,3}([.,]\\d+)?)\\,?\\s*' + self.LON_LABEL.trim() + '*\\s*([-+]?\\d{1,2}([.,]\\d+)?)$'));
            if (match) {
                result = geoCoordsLabel(result, match);
            }

            var localeDecimalSeparator = 1.1.toLocaleString(locale).substring(1, 2);
            match = result.match(new RegExp('^' + self.UTMX_LABEL.trim() + '*\\s*([-+]?[0-9]{' + self.UTMX_LEN + '}(?:[.,]\\d+)?)\\s*\\,?\\s*' + self.UTMY_LABEL.trim() + '*\\s*([-+]?[0-9]{' + self.UTMY_LEN + '}(?:[.,]\\d+)?)$'));
            if (match) {
                if (!Number.isInteger(parseFloat(match[1])))
                    result = result.replace(match[1], match[1].replace('.', localeDecimalSeparator));
                if (!Number.isInteger(parseFloat(match[2])))
                    result = result.replace(match[2], match[2].replace('.', localeDecimalSeparator));
            }

        } else if (id.match(new RegExp('^(?:' + self.LON + '[-\\d])'))) {
            result = result.replace(self.LON, self.LON_LABEL).replace(self.LAT, ' ' + self.LAT_LABEL);

            const match = result.match(new RegExp('^' + self.LON_LABEL.trim() + '*\\s*([-+]?\\d{1,3}([.,]\\d+)?)\\,?\\s*' + self.LAT_LABEL.trim() + '*\\s*([-+]?\\d{1,2}([.,]\\d+)?)$'));
            if (match) {
                result = geoCoordsLabel(result, match);
            }

        } else if (id.match(new RegExp('^(?:(\\' + self.MUN + '{1})(.*)' + '(\\' + self.POL + '{1})' + '(\\d{1,2})' + '(\\' + self.PAR + '{1})' + '(\\d{1,4}))'))) {
            const match = id.match(new RegExp('^(?:(\\' + self.MUN + '{1})(.*)' + '(\\' + self.POL + '{1})' + '(\\d{1,2})' + '(\\' + self.PAR + '{1})' + '(\\d{1,4}))'));
            result = self.MUN_LABEL + match[2] + ', ' + self.POL_LABEL + match[4] + ', ' + self.PAR_LABEL + match[6];
        }
        return result;
    };

    ctlProto.removePunctuation = function (text) {
        text = text || '';
        var result = new Array(text.length);
        var map = new Map([
            ['á', 'a'],
            ['à', 'a'],
            ['Á', 'A'],
            ['À', 'A'],
            ['é', 'e'],
            ['è', 'e'],
            ['É', 'E'],
            ['È', 'E'],
            ['í', 'i'],
            ['ì', 'i'],
            ['Í', 'I'],
            ['Ì', 'I'],
            ['ó', 'o'],
            ['ò', 'o'],
            ['Ó', 'O'],
            ['Ò', 'O'],
            ['ú', 'u'],
            ['ù', 'u'],
            ['ü', 'u'],
            ['Ú', 'U'],
            ['Ù', 'U'],
            ['Ü', 'U']
        ]);
        for (var i = 0, len = text.length; i < len; i++) {
            result[i] = map.get(text.charAt(i)) || text.charAt(i);
        }
        return result.join('');
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.toShare) {
            return {
                id: self.id,
                searchText: self.textInput && self.textInput.value,
                searchResult: JSON.stringify(self.toShare)
            };
        }
        //else if (self.exportsState && self.layer) {
        //    return {
        //        id: self.id,
        //        searchText: self.textInput && self.textInput.value,
        //        layer: self.layer.exportState({
        //            exportStyles: false
        //        })
        //    };
        //}
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;
        if (state.searchResult) {
            let sharedSearchResult = JSON.parse(state.searchResult);
            if (sharedSearchResult.id && sharedSearchResult.dataRole) {
                if (sharedSearchResult.doZoom) {
                    self.map.one(Consts.event.FEATURESADD, function (e) {
                        if (e.layer === self.layer) {
                            self.layer.map.zoomToFeatures(e.layer.features);
                        }
                    });
                }
                self.loadingState = true;
                self.goToResult(sharedSearchResult.id, sharedSearchResult.dataRole).then(function () {
                    delete self.loadingState;
                    self.textInput.value = state.searchText;
                    self.shareButton && self.shareButton.classList.remove(Consts.classes.HIDDEN);
                    self.loading.reset();
                });
            } else {
                alert('shared results error');
            }
        }
        //else {
        //    self.textInput.value = state.searchText;
        //    self.layer.importState(state.layer).then(function () {
        //        self.layer.features.forEach(function (f) {
        //            f.setStyle(null); // Los estilos vienen dados exclusivamente por la capa, borramos estilos propios de la feature
        //        });
        //    });
        //}
    };

})();


if (!String.prototype.tcFormat) {
    String.prototype.tcFormat = function () {
        var args = (arguments || [""])[0];
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== 'undefined' ?
                args[number]
                : match
                ;
        });
    };
}


if (!String.prototype.splitRemoveWhiteSpaces) {
    String.prototype.splitRemoveWhiteSpaces = function (separator) {
        var _arr = [];
        var arr = this.split(separator);
        for (var i = 0; i < arr.length; i++)
            if (arr[i].trim().length > 0)
                _arr.push(arr[i].trim());

        return _arr;
    };
}


if (!String.prototype.toCamelCase) {
    String.prototype.toCamelCase = function () {
        var _value = this.toLowerCase();
        var match = this.toLowerCase().match(/[^A-ZÁÉÍÓÚÜÀÈÌÒÙáéíóúüàèìòùa-z0-9_]+(.)/g);
        if (match) {
            for (var i = 0; i < match.length; i++) {
                if (/[-;:.<>\{\}\[\]\/\s()]/g.test(match[i]))
                    _value = _value.replace(match[i], match[i].toUpperCase());
            }
        }

        return _value.charAt(0).toUpperCase() + _value.substring(1);
    };
}


if (!Object.prototype.hasOwnProperty.call(Array.prototype, 'findByProperty')) {
    Object.defineProperty(Array.prototype, "findByProperty", {
        enumerable: false,
        writable: true,
        value: function (propertyName, value) {
            for (var i = 0; i < this.length; i++) {
                if (this[i][propertyName] == value)
                    return this[i];
            }
        }
    });
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

const Search = TC.control.Search;
export default Search;
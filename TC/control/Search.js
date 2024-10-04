
/**
  * Opciones de control de búsquedas. La configuración por defecto tiene como origen de datos el WFS de IDENA. 
  * Es posible establecer un origen de datos distinto en el que consultar, para ello en lugar de asignar un booleano a la propiedad, que activa o desactiva la búsqueda, 
  * se asignará un objeto con las propiedades a sobrescribir. Las propiedades a sobrescribir no siempre serán las mismas, variarán en función de la configuración que tenga la búsqueda que se quiera modificar.
  * @typedef SearchOptions
  * @extends SITNA.control.ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {boolean|SITNA.control.CadastralParcelSearchOptions} [cadastralParcel=true] - Esta propiedad activa/desactiva la búsqueda de parcelas catastrales en el buscador del mapa. Formato: municipio, polígono, parcela.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link SITNA.control.CadastralParcelSearchOptions}.
  *
  * @property {boolean} [coordinates=true] - Esta propiedad activa/desactiva la localización de coordenadas en Sistema de Referencia ETRS89, bien UTM Huso 30 Norte (EPSG:25830) o latitud-longitud (EPSG:4258, EPSG:4326 o CRS:84) en el buscador del mapa.
  * @property {SITNA.control.SearchTypeOptions[]} [customSearchTypes] - Colección de tipos de búsqueda personalizados.
  * @property {string} [instructions="Buscar municipio, casco urbano, calle, dirección, referencia catastral, coordenadas UTM o latitud-longitud"] - Esta propiedad establece el atributo `title` del cajetín y del botón del buscador del mapa.
  * @property {boolean|SITNA.control.MunicipalitySearchOptions} [municipality=true] - Esta propiedad activa/desactiva la búsqueda de municipios en el buscador del mapa.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link SITNA.control.MunicipalitySearchOptions}.
  * @property {boolean|SITNA.control.PlaceNameSearchOptions} [placeName=false] - Esta propiedad activa/desactiva la búsqueda de topónimos en el buscador del mapa.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link SITNA.control.PlaceNameSearchOptions}.
  * @property {boolean|SITNA.control.PlaceNameMunicipalitySearchOptions} [placeNameMunicipality=false] - Esta propiedad activa/desactiva la búsqueda de topónimo en un municipio en el buscador del mapa. Formato: municipio, topónimo.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link SITNA.control.PlaceNameMunicipalitySearchOptions}.
  * @property {boolean|SITNA.control.PostalAddressSearchOptions} [postalAddress=true] - Esta propiedad activa/desactiva la búsqueda de direcciones postales en el buscador del mapa. Formato: entidad de población, vía, portal.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link SITNA.control.PostalAddressSearchOptions}.
  * @property {boolean|SITNA.control.RoadSearchOptions} [road=false] - Esta propiedad activa/desactiva la búsqueda de carreteras en el buscador del mapa.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link SITNA.control.RoadSearchOptions}.
  * @property {boolean|SITNA.control.RoadMilestoneSearchOptions} [roadMilestone=false] - Esta propiedad activa/desactiva la búsqueda de punto kilométrico en una carretera en el buscador del mapa. Formato: carretera, pk.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link SITNA.control.RoadMilestoneSearchOptions}.
  * @property {boolean|SITNA.control.StreetSearchOptions} [street=true] - Esta propiedad activa/desactiva la búsqueda de vías en el buscador del mapa.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link SITNA.control.StreetSearchOptions}.
  * @property {boolean|SITNA.control.TownSearchOptions} [town=true] - Esta propiedad activa/desactiva de cascos urbanos en el buscador del mapa.
  *
  * Para configurar un origen de datos distinto a IDENA, establecer como valor un objeto con el formato {@link SITNA.control.TownSearchOptions}.
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
  * @typedef CadastralParcelSearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría de la parcela catastral.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts}, 
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}.
  * @property {SITNA.control.CadastralParcelSearchOptionsExt} municipality - Definición de la fuente de datos para la búsqueda de parcela por nombre de municipio en lugar de por código del mismo.
  * @property {SITNA.control.SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de parcelas.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a las siguientes propiedades:
  * - `firstQueryWord`: se indicará el campo o campos en los que buscar el código de municipio.
  * - `secondQueryWord`: se indicará el campo o campos en los que buscar el polígono.
  * - `thirdQueryWord`: se indicará el campo o campos en los que buscar la parcela.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto,
  * deberá haber tantas instancias como capas definidas en `featureType`.
  * 
  * No está disponible `cluster`.
  * @property {SITNA.control.SearchSuggestionHeadOptions} suggestionListHead - *__Obsoleta__: En lugar de esta propiedad utilice la propiedad equivalente `suggestionListHeader`.*
  * 
  * Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {SITNA.control.CadastralParcelSearchSuggestionHeaderOptions} suggestionListHeader - Configuración de la cabecera 
  * a mostrar en la lista de sugerencias. La cabecera consta de un literal y de varios colores, uno para cada tipo de parcela (urbana, rústica, mixta). 
  * El literal indica el tipo de búsqueda y los colores se obtendrán de las propiedades de la simbología de las entidades que se muestran en el mapa.
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
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
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
                        suggestionListHeader: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            labelKey: "search.list.cadastral", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Parcela catastral
                            colorSource: [ // En este caso la consulta se hace sobre varias capas. Con el siguiente objeto se define el color de los resultados de la búsqueda de cada capa. Estos colores también se mostrarán en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
                                {
                                    featureType: "CATAST_Pol_ParcelaUrba", // Nombre de capa presente en la propiedad `featureType`.
                                    tooltipKey: "search.list.cadastral.urban", // Clave del diccionario de traducciones a mostrar como literal en la lista de sugerencias que indentificará a los resultados obtenidos de la capa CATAST_Pol_ParcelaUrba.
                                    colorSource: { // Definición del color con el que se dibujará los resultados de la búsqueda en el mapa. Este color también se mostrará en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
                                        geometryType: "polygon", // Nombre del tipo de geometría presente en `styles` en la cual buscar la propiedad `css`.
                                        colorSource: "strokeColor" // Nombre de la propiedad de los estilos de la cual extraer el color.
                                    }
                                    // El resultado de la configuración anterior será: '#136278'
                                },
                                {
                                    featureType: "CATAST_Pol_ParcelaRusti", // Nombre de capa presente en la propiedad `featureType`.
                                    tooltipKey: "search.list.cadastral.rustic", // Clave del diccionario de traducciones a mostrar como literal en la lista de sugerencias que indentificará a los resultados obtenidos de la capa CATAST_Pol_ParcelaRusti.
                                    colorSource: { // Definición del color con el que se dibujará los resultados de la búsqueda en el mapa. Este color también se mostrará en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
                                        geometryType: "polygon", // Nombre del tipo de geometría presente en `styles` en la cual buscar la propiedad `css`.
                                        colorSource: "strokeColor" // Nombre de la propiedad de los estilos de la cual extraer el color.
                                    }
                                    // El resultado de la configuración anterior será: '#0C8B3D'
                                },
                                {
                                    featureType: "CATAST_Pol_ParcelaMixta", // Nombre de capa presente en la propiedad `featureType`.
                                    tooltipKey: "search.list.cadastral.mixed", // Clave del diccionario de traducciones a mostrar como literal en la lista de sugerencias que indentificará a los resultados obtenidos de la capa CATAST_Pol_ParcelaMixta.
                                    colorSource: { // Definición del color con el que se dibujará los resultados de la búsqueda en el mapa. Este color también se mostrará en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
                                        geometryType: "polygon", // Nombre del tipo de geometría presente en `styles` en la cual buscar la propiedad `css`.
                                        colorSource: "strokeColor" // Nombre de la propiedad de los estilos de la cual extraer el color.
                                    }
                                    // El resultado de la configuración anterior será: '#E5475F'
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
  * @typedef CadastralParcelSearchOptionsExt
  * @memberof SITNA.control
  * @see SITNA.control.CadastralParcelSearchOptions
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
  * @see SITNA.control.CadastralParcelSearchOptions
  * @see SITNA.control.MunicipalitySearchOptions
  * @see SITNA.control.PostalAddressSearchOptions
  * @see SITNA.control.RoadSearchOptions
  * @see SITNA.control.RoadMilestoneSearchOptions
  * @see SITNA.control.StreetSearchOptions
  * @see SITNA.control.TownSearchOptions
  * @property {string[]} firstQueryWord - Colección de nombre de campo o campos a consultar para el 1º término del criterio de búsqueda, deben existir en la capa o capas definidas en la propiedad `FeatureType`.
  * @property {string[]} secondQueryWord - Colección de nombre de campo o campos a consultar para el 2º término del criterio de búsqueda, deben existir en la capa o capas definidas en la propiedad `FeatureType`.
  * @property {string[]} thirdQueryWord - Colección de nombre de campo o campos a consultar para el 3º término del criterio de búsqueda, deben existir en la capa o capas definidas en la propiedad `FeatureType`.
  */

/**
  * Opciones de configuración para la composición de la cabecera de una lista de sugerencias de búsqueda.
  * @typedef SearchSuggestionHeadOptions
  * @deprecated Usar {@link SITNA.control.SearchSuggestionHeaderOptions} en vez de este objeto.
  * @memberof SITNA.control
  * @see SITNA.control.CadastralParcelSearchOptions
  * @see SITNA.control.MunicipalitySearchOptions
  * @see SITNA.control.PostalAddressSearchOptions
  * @see SITNA.control.RoadSearchOptions
  * @see SITNA.control.RoadMilestoneSearchOptions
  * @see SITNA.control.StreetSearchOptions
  * @see SITNA.control.TownSearchOptions
  * @property {string} label - Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… Revisar la sección **Soporte multiidioma** en {@tutorial layout_cfg}.
  * @property {SITNA.control.SearchResultColorDictionary|SITNA.control.SearchResultColor|string} color - Configuración para obtener el color que representa al tipo de búsqueda.
  * Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
  * 
  * La definición como string ha de ser para indicar el nombre de una propiedad presente en {@link SITNA.feature.PointStyleOptions}, {@link SITNA.feature.LineStyleOptions} o {@link SITNA.feature.PolygonStyleOptions}.
  */

/**
  * Opciones de configuración para la composición de la cabecera de una lista de sugerencias de búsqueda.
  * @typedef SearchSuggestionHeaderOptions
  * @memberof SITNA.control
  * @see SITNA.control.MunicipalitySearchOptions
  * @see SITNA.control.PostalAddressSearchOptions
  * @see SITNA.control.RoadSearchOptions
  * @see SITNA.control.RoadMilestoneSearchOptions
  * @see SITNA.control.StreetSearchOptions
  * @see SITNA.control.TownSearchOptions
  * @property {string} labelKey - Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… Revisar la sección **Soporte multiidioma** en {@tutorial layout_cfg}.
  * @property {SITNA.control.SearchResultColorSourceOptions|string} colorSource - Configuración para obtener el color que representa al tipo de búsqueda.
  * Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
  *
  * La definición como string ha de ser para indicar el nombre de una propiedad presente en {@link SITNA.feature.PointStyleOptions}, {@link SITNA.feature.LineStyleOptions} o {@link SITNA.feature.PolygonStyleOptions}.
  * @example
  * {
  *     labelKey: "search.list.town",
  *     colorSource: "strokeColor"
  * }
  */

/**
  * Opciones de configuración para la composición de la cabecera de una lista de sugerencias de búsqueda.
  * @typedef CadastralParcelSearchSuggestionHeaderOptions
  * @memberof SITNA.control
  * @see SITNA.control.CadastralParcelSearchOptions
  * @property {string} labelKey - Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… Revisar la sección **Soporte multiidioma** en {@tutorial layout_cfg}.
  * @property {SITNA.control.SearchSuggestionMutipleColorSourceOptions[]} colorSource - Configuración para obtener los colores que representan las parcelas catastrales.
  * Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
  */

/**
  * Algunas búsquedas hacen la consulta sobre varias capas. Este objeto define el color de los resultados de la búsqueda de cada capa. Estos colores también se mostrarán en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
  * @typedef SearchResultColorDictionary
  * @deprecated Usar una colección de {@link SITNA.control.SearchSuggestionMutipleColorSourceOptions} en vez de este objeto.
  * @memberof SITNA.control
  * @see SITNA.control.SearchSuggestionHeaderOptions
  * @property {SITNA.control.SearchResultColor} color - Configuración para obtener el color.
  * @property {string} title - Title para identificar al color. Se define con la clave del diccionario de traducciones. Revisar la sección **Soporte multiidioma** en {@tutorial layout_cfg}.
  */

/**
  * Definición del color con el que se dibujará los resultados de la búsqueda en el mapa. Este color también se mostrará en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
  * @typedef SearchResultColor
  * @deprecated Usar {@link SITNA.control.SearchResultColorSourceOptions} en vez de este objeto.
  * @memberof SITNA.control
  * @see SITNA.control.SearchSuggestionHeaderOptions
  * @property {string} css - Nombre de la propiedad de los estilos de la cual extraer el color. Ha de ser alguna de las distintas propiedades de colores presentes en {@link SITNA.feature.PointStyleOptions},
  * {@link SITNA.feature.PolylineStyleOptions} o {@link SITNA.feature.PolygonStyleOptions}.
  * @property {string} geomType - Nombre del tipo de geometría (el valor es un miembro de [SITNA.Consts.geom]{@link SITNA.Consts}).
  */

/**
  * Ciertas búsquedas se realizan simultáneamente sobre varias capas, por lo que es de esperar que los resultados 
  * tengan entidades con distinta simbología. Este objeto es un elemento del diccionario que define los colores y 
  * textos descriptivos asociados a cada capa.
  * @typedef SearchSuggestionMutipleColorSourceOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchSuggestionHeaderOptions
  * @property {SITNA.control.SearchResultColorSourceOptions} colorSource - Configuración para obtener el color desde la capa.
  * @property {string} featureType - El nombre de la capa asociada a este color.
  * @property {string} tooltipKey - Clave del diccionario de textos que obtiene el texto descriptivo que se asociará al color. Para más información sobre los diccionarios de textos, revisar la sección **Soporte multiidioma** en {@tutorial layout_cfg}.
  * @example
  * {
  *     featureType: "CATAST_Pol_ParcelaUrba",
  *     tooltipKey: "search.list.cadastral.urban",
  *     colorSource: {
  *         geometryType: "polygon",
  *         propertyName: "strokeColor"
  *     }
  * }
  */

/**
  * Información de las propiedades de estilo de la capa donde se está realizando la búsqueda y de la que se extraerá 
  * el color con el que se dibujarán los resultados de la búsqueda en el mapa. Este color también se mostrará 
  * en la leyenda de la lista de sugerencias de resultados posibles de la búsqueda.
  * @typedef SearchResultColorSourceOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchSuggestionHeaderOptions
  * @property {string} geometryType - Nombre del tipo de geometría (el valor es un miembro de [SITNA.Consts.geom]{@link SITNA.Consts}).
  * @property {string} propertyName - Nombre de la propiedad de los estilos de la cual extraer el color. Ha de ser alguna de las distintas propiedades de colores presentes en {@link SITNA.feature.PointStyleOptions},
  * {@link SITNA.feature.PolylineStyleOptions} o {@link SITNA.feature.PolygonStyleOptions}.
  * @example
  * {
  *     geometryType: "point",
  *     propertyName: "fontColor"
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
  * @property {string} [outputFormatLabel] - *__Obsoleta__: Alias de la propiedad `suggestionTemplate`.*
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias. 
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SITNA.control.SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de municipios.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a la propiedad `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre del municipio.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto,
  * deberá haber tantas instancias como capas definidas en `featureType`.
  * 
  * No está disponible `cluster`.
  * @property {SITNA.control.SearchSuggestionHeadOptions} suggestionListHead - *__Obsoleta__: En lugar de esta propiedad utilice la propiedad equivalente `suggestionListHeader`.*
  *
  * Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {SITNA.control.SearchSuggestionHeaderOptions} suggestionListHeader - Configuración de la cabecera
  * a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color.
  * El literal indica el tipo de búsqueda y el color se obtendrá de una de las propiedades de la simbología de las entidades que se muestran en el mapa.
  * @property {string} [suggestionTemplate="{0}"] - Cadena con la plantilla que se utilizará en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `["NombreMunicipio"]` y `suggestionTemplate` como `"{0}"` para un
  * resultado con valor del campo **NombreMunicipio** a `"Pamplona"` mostrará en la lista de sugerencias el texto
  * *Pamplona*.
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
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['CATAST_Pol_Municipio'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CMUNICIPIO'], // Colección con el nombre del campo que nos servirá para identificar unívocamente a un municipio. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de municipios.
                            firstQueryWord: ['MUNINOAC', 'MUNICIPIO'] // Campos en los que buscar el nombre de municipio.
                        },
                        suggestionListHeader: { //  Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            labelKey: "search.list.municipality", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Municipio.
                            colorSource: "strokeColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#FE06A5'.
                        outputProperties: ['MUNICIPIO'], // Colección con el nombre del campo a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
                        suggestionTemplate: '{0}', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
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
  * @property {string} [outputFormatLabel] - *__Obsoleta__: Alias de la propiedad `suggestionTemplate`.*
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SITNA.control.SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de direcciones postales.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a las siguientes propiedades:
  * - `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre de la entidad de población.
  * - `secondQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre de la vía.
  * - `thirdQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el número de portal.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto,
  * deberá haber tantas instancias como capas definidas en `featureType`.
  * 
  * No está disponible cluster.
  * @property {SITNA.control.SearchSuggestionHeadOptions} suggestionListHead - *__Obsoleta__: En lugar de esta propiedad utilice la propiedad equivalente `suggestionListHeader`.*
  *
  * Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {SITNA.control.SearchSuggestionHeaderOptions} suggestionListHeader - Configuración de la cabecera
  * a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color.
  * El literal indica el tipo de búsqueda y el color se obtendrá de una de las propiedades de la simbología de las entidades que se muestran en el mapa.
  * @property {string} [suggestionTemplate="{1} {2}, {0}"] - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `["EntidadPoblacion", "Via", "Numero"]` y `suggestionTemplate` como
  * `"{1} {2}, {0}"` para un resultado con valor del campo **EntidadPoblacion** a `"Pamplona"`, valor del campo
  * **Via** a `"Calle Estafeta"` y valor del campo **Numero** a `13` mostrará en la lista de sugerencias el texto
  * *Calle Estafeta 13, Pamplona*.
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
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['CATAST_Txt_Portal'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CMUNICIPIO', 'CENTIDADC', 'CVIA', 'PORTAL'],  // Colección con los nombres de los campos que nos servirán para identificar unívocamente a una dirección postal. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de dirección postal.
                            firstQueryWord: ['ENTIDADC', 'ENTINOAC'], // Campos en los que buscar el nombre de la entidad de población.
                            secondQueryWord: ['VIA', 'VIANOAC'], // Campos en los que buscar la vía.
                            thirdQueryWord: ['PORTAL'] // Campo en el que buscar la dirección postal.
                        },
                        suggestionListHeader: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            labelKey: "search.list.number", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Portal
                            colorSource: "fontColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#CB0000'.
                        outputProperties: ['ENTIDADC', 'VIA', 'PORTAL', 'CVIA', 'CENTIDADC', 'CMUNICIPIO'], // Colección con los nombres de los campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
                        suggestionTemplate: '{1} {2}, {0}', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                point: { // Opciones de estilo de punto para los resultados obtenidos.
                                    radius: 0, // Radio en píxeles del símbolo que representa el punto.
                                    labelKey: "PORTAL", // Nombre de campo del cual extraer el valor de la etiqueta.
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
  * @property {string} [outputFormatLabel] - *__Obsoleta__: Alias de la propiedad `suggestionTemplate`.*
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SITNA.control.SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de topónimo.
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
  * @property {SITNA.control.SearchSuggestionHeadOptions} suggestionListHead - *__Obsoleta__: En lugar de esta propiedad utilice la propiedad equivalente `suggestionListHeader`.*
  *
  * Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {SITNA.control.SearchSuggestionHeaderOptions} suggestionListHeader - Configuración de la cabecera
  * a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color.
  * El literal indica el tipo de búsqueda y el color se obtendrá de una de las propiedades de la simbología de las entidades que se muestran en el mapa.
  * @property {string} [suggestionTemplate="{1} ({0})"] - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `["MUNICIPIO", "TOPONIMO"]` y `suggestionTemplate` como `"{1} ({0})"`
  * para un resultado con valor del campo **MUNICIPIO** a `"Aranguren"` y valor del campo **TOPONIMO** a
  * `"Camino de Pamplona"` mostrará en la lista de sugerencias el texto *Camino de Pamplona (Aranguren)*.
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
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['TOPONI_Txt_Toponimos'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CMUNICIPIO', 'CTOPONIMO'], // Colección con los nombres de los campos que nos servirán para identificar unívocamente a un topónimo. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de topónimo.
                            firstQueryWord: ['TOPONIMO', 'TOPONINOAC'] // Campos en los que buscar el nombre del topónimo.
                        },
                        suggestionListHeader: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            labelKey: "search.list.placeName", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Topónimo
                            colorSource: "fontColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#FF5722'.
                        outputProperties: ['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO'], // Colección con los nombres de los campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
                        suggestionTemplate: '{1} ({0})', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                point: { // Opciones de estilo de punto para los resultados obtenidos.
                                    radius: 0, // Radio en píxeles del símbolo que representa el punto.
                                    labelKey: "TOPONIMO", // Nombre de campo del cual extraer el valor de la etiqueta.
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
  * @property {string} [outputFormatLabel] - *__Obsoleta__: Alias de la propiedad `suggestionTemplate`.*
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SITNA.control.SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de topónimo en un municipio.
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
  * @property {SITNA.control.SearchSuggestionHeadOptions} suggestionListHead - *__Obsoleta__: En lugar de esta propiedad utilice la propiedad equivalente `suggestionListHeader`.*
  *
  * Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {SITNA.control.SearchSuggestionHeaderOptions} suggestionListHeader - Configuración de la cabecera
  * a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color.
  * El literal indica el tipo de búsqueda y el color se obtendrá de una de las propiedades de la simbología de las entidades que se muestran en el mapa.
  * @property {string} [suggestionTemplate="{1} ({0})"] - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `["MUNICIPIO", "TOPONIMO", "CMUNICIPIO", "CTOPONIMO"]` y
  * `suggestionTemplate` como `"{1} ({0})"` para un resultado con valor del campo **MUNICIPIO** a `"Aranguren"`
  * y valor del campo **TOPONIMO** a `"Camino de Pamplona"` mostrará en la lista de sugerencias el texto
  * *Camino de Pamplona (Aranguren)*.
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
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['TOPONI_Txt_Toponimos'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CMUNICIPIO', 'CTOPONIMO'], // Colección con los nombres de los campos que nos servirán para identificar unívocamente a un topónimo en un municipio. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de topónimo en un municipio.
                            firstQueryWord: ['MUNICIPIO', 'MUNINOAC'], // Campos en los que buscar el nombre de municipio.
                            secondQueryWord: ['TOPONIMO', 'TOPONINOAC'] // Campos en los que buscar el nombre del topónimo.
                        },
                        suggestionListHeader: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            labelKey: "search.list.placeName", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Topónimo
                            colorSource: "fontColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#FF5722'.
                        outputProperties: ['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO'], // Colección con los nombres de los campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
                        suggestionTemplate: '{1} ({0})', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                point: { // Opciones de estilo de punto para los resultados obtenidos.
                                    radius: 0, // Radio en píxeles del símbolo que representa el punto.
                                    labelKey: "TOPONIMO", // Nombre de campo del cual extraer el valor de la etiqueta.
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
  * @property {string} [outputFormatLabel] - *__Obsoleta__: Alias de la propiedad `suggestionTemplate`.*
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SITNA.control.SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de carreteras.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a la siguiente propiedad:
  * - `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre de la carretera.  
  * @property {string[]} renderFeatureType - Colección con los nombres de las capas auxiliares a añadir al resultado de la búsqueda en el mapa. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `dataIdProperty`.
  *
  * No se muestran sugerencias en base a las capas auxiliares, únicamente se añade información en el momento de pintar en el mapa, es por ello que debe existir relación en los datos entre las capas definidas en `featureType` y `renderFeatureType` y que ambas cuenten con los campos definidos en `dataIdProperty`.
  * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en las colecciones 1 y 2 siendo 1 la concatenación de `featureType`
  * y `renderFeatureType` y 2 `styles`, por tanto, deberá haber tantas instancias como la suma de las capas definidas en `featureType` y en `renderFeatureType`.
  * 
  * La propiedad `cluster` será ignorada en este caso.
  * @property {SITNA.control.SearchSuggestionHeadOptions} suggestionListHead - *__Obsoleta__: En lugar de esta propiedad utilice la propiedad equivalente `suggestionListHeader`.*
  *
  * Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {SITNA.control.SearchSuggestionHeaderOptions} suggestionListHeader - Configuración de la cabecera
  * a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color.
  * El literal indica el tipo de búsqueda y el color se obtendrá de una de las propiedades de la simbología de las entidades que se muestran en el mapa.
  * @property {string} [suggestionTemplate="{0}"] - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `["Carretera"]` y `suggestionTemplate` como `"{0}"` para un resultado
  * con valor del campo **Carretera** a `"N-121"` mostrará en la lista de sugerencias el texto *N-121*.
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
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['INFRAE_Lin_CtraEje'],  // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['DCARRETERA'], // Colección con el nombre del campo que nos servirá para identificar unívocamente a una carretera. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de carretera.
                            firstQueryWord: ['DCARRETERA'] // Campo en el que buscar el nombre de la carretera.
                        },
                        suggestionListHeader: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            labelKey: "search.list.road", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Carretera.
                            colorSource: "strokeColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#00B2FC'.
                        outputProperties: ['DCARRETERA'], // Colección con los nombres de los campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
                        suggestionTemplate: 'Carretera: {0}', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
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
  * @property {string} [outputFormatLabel] - *__Obsoleta__: Alias de la propiedad `suggestionTemplate`.*
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SITNA.control.SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de punto kilométrico.
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
  * @property {SITNA.control.SearchSuggestionHeadOptions} suggestionListHead - *__Obsoleta__: En lugar de esta propiedad utilice la propiedad equivalente `suggestionListHeader`.*
  *
  * Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {SITNA.control.SearchSuggestionHeaderOptions} suggestionListHeader - Configuración de la cabecera
  * a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color.
  * El literal indica el tipo de búsqueda y el color se obtendrá de una de las propiedades de la simbología de las entidades que se muestran en el mapa.
  * @property {string} [suggestionTemplate="{0}: PK {1}"] - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `["Carretera", "PK"]` y `suggestionTemplate` como `"{0}: PK {1}"`
  * para un resultado con valor del campo **Carretera** a `"AP-15"` y valor del campo **PK** a `10` mostrará en
  * la lista de sugerencias el texto *AP-15: PK 10*.
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
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['INFRAE_Sym_CtraPK'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['DCARRETERA', 'CPK'], // Colección con los nombres de campos que nos servirán para identificar unívocamente a un punto kilométrico. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de punto kilométrico.
                            firstQueryWord: ['DCARRETERA'], // Campo en el que buscar el nombre de la carretera.
                            secondQueryWord: ['PK'] // Campo en el que buscar el número del punto kilométrico.
                        },
                        suggestionListHeader: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            labelKey: "search.list.milestone.larger", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Punto kilométrico
                            colorSource: "fontColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#00B2FC'.
                        outputProperties: ['DCARRETERA', 'PK'], // Colección con los nombres de los campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
                        suggestionTemplate: 'Carretera: {0} ' + 'PK: {1}', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
                        styles: [ // Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
                            {
                                point: { // Opciones de estilo de punto para los resultados obtenidos.
                                    labelKey: ["DCARRETERA", "PK"], // Colección de los nombres de los campos de los cuales extraer el valor de la etiqueta.
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
  * @property {string} [outputFormatLabel] - *__Obsoleta__: Alias de la propiedad `suggestionTemplate`.*
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SITNA.control.SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de vías.
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
  * @property {SITNA.control.SearchSuggestionHeadOptions} suggestionListHead - *__Obsoleta__: En lugar de esta propiedad utilice la propiedad equivalente `suggestionListHeader`.*
  *
  * Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {SITNA.control.SearchSuggestionHeaderOptions} suggestionListHeader - Configuración de la cabecera
  * a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color.
  * El literal indica el tipo de búsqueda y el color se obtendrá de una de las propiedades de la simbología de las entidades que se muestran en el mapa.
  * @property {string} [suggestionTemplate="{1}, {0}"] - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `["EntidadPoblacion", "Via"]` y `suggestionTemplate` como `"{1}, {0}"`
  * para un resultado con valor del campo **EntidadPoblacion** a `"Pamplona"` y valor del campo **Via** a
  * `"Calle Estafeta"` mostrará en la lista de sugerencias el texto *Calle Estafeta, Pamplona*.
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
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        renderFeatureType: ['CATAST_Txt_Calle'], // Colección con los nombres de las capas auxiliares a añadir al resultado de la búsqueda en el mapa. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `dataIdProperty`. No se muestran sugerencias en base a las capas auxiliares, únicamente se añade información en el momento de pintar en el mapa, es por ello que debe existir relación en los datos entre las capas definidas en `featureType` y `renderFeatureType` y que ambas cuenten con los campos definidos en `dataIdProperty`.
                        featureType: ['CATAST_Lin_CalleEje'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CVIA'], // Colección con el nombre del campo que nos servirá para identificar unívocamente a una vía. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de vía.
                            firstQueryWord: ['ENTINOAC', 'ENTIDADC'], // Campo en el que buscar el nombre de la entidad de población.
                            secondQueryWord: ['VIA', 'VIANOAC'] // Campo en el que buscar el nombre de la vía.
                        },
                        suggestionListHeader: { // Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            labelKey: "search.list.street", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Vía
                            colorSource: "strokeColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        }, // El resultado de la configuración anterior será: '#CB0000'.
                        outputProperties: ['ENTIDADC', 'VIA', 'CVIA', 'CENTIDADC', 'CMUNICIPIO'], // Colección con los nombres de los campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
                        suggestionTemplate: '{1}, {0}', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
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
                                    labelKey: "VIA", // Nombre de campo del cual extraer el valor de la etiqueta.
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
  * @typedef TownSearchOptions
  * @memberof SITNA.control
  * @see SITNA.control.SearchOptions
  * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
  * @property {string[]} dataIdProperty - Colección con el nombre del campo o campos que nos servirán para identificar unívocamente a un casco urbano. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
  * @property {string[]} featureType - Colección con el nombre de la capa o capas a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
  * @property {string} geometryName - Nombre del campo de la geometría del casco urbano.
  * @property {string} [outputFormat=[SITNA.Consts.format.JSON]{@link SITNA.Consts}] - Tipo de formato en el cual obtener los datos del servicio WFS. Valores admitidos: [SITNA.Consts.format.JSON]{@link SITNA.Consts},
  * [SITNA.Consts.format.GML3]{@link SITNA.Consts}, [SITNA.Consts.format.GML32]{@link SITNA.Consts} o [SITNA.Consts.format.GML]{@link SITNA.Consts}
  * @property {string} [outputFormatLabel] - *__Obsoleta__: Alias de la propiedad `suggestionTemplate`.*
  * @property {string[]} outputProperties - Colección con los nombres de campos a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
  * Los campos indicados también se usan para controlar los posibles registros duplicados en la lista de sugerencias. Es decir, indicando código y nombre los resultados se agruparán por los 2 campos. 
  * Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
  * @property {SITNA.control.SearchQueryPropertyOptions} queryProperties - Definición de los campos por los que filtrar la búsqueda de vías.
  *
  * En este tipo de búsqueda es obligatorio dar un valor a la propiedad `firstQueryWord`: se indicará el campo o campos (tipo `string`) en los que buscar el nombre del casco urbano.
  * @property {SITNA.layer.StyleOptions[]} styles - La relación entre capa y estilo se hace mediante el índice en la colección en `featureType` y en `styles`, por tanto, deberá haber tantas instancias como capas definidas en `featureType`.
  * 
  * No está disponible cluster.
  * @property {SITNA.control.SearchSuggestionHeadOptions} suggestionListHead - *__Obsoleta__: En lugar de esta propiedad utilice la propiedad equivalente `suggestionListHeader`.*
  *
  * Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
  * @property {SITNA.control.SearchSuggestionHeaderOptions} suggestionListHeader - Configuración de la cabecera
  * a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color.
  * El literal indica el tipo de búsqueda y el color se obtendrá de una de las propiedades de la simbología de las entidades que se muestran en el mapa.
  * @property {string} [suggestionTemplate="{1} ({0})"] - Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo. Las llaves de cierre y apertura son necesarias.
  *
  * Por ejemplo: `outputProperties` como `["NombreMunicipio", "NombreCascoUrbano"]` y `suggestionTemplate` como
  * `"{1} ({0})"` para un resultado con valor del campo **NombreMunicipio** a `"Galar"` y valor del campo
  * **NombreCascoUrbano** a `"Salinas de Pamplona"` mostrará en la lista de sugerencias el texto
  * *Salinas de Pamplona (Galar)*.
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
                        featurePrefix: 'IDENA', // Prefijo del nombre de la capa a definir en la propiedad `featureType`. En caso de ser un WFS de GeoServer, se trata del nombre del espacio de trabajo (workspace).
                        geometryName: 'the_geom', // Nombre del campo de la geometría.
                        featureType: ['ESTADI_Pol_EntidadPob'], // Colección con el nombre de la capa a consultar. Es posible indicar más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
                        dataIdProperty: ['CMUNICIPIO', 'CENTIDAD'], // Colección con los nombres de los campos que nos servirán para identificar unívocamente un casco urbano. Los campos definidos deben existir en la capa o capas definidas en la propiedad `featureType`.
                        queryProperties: { // Definición de los campos por los que filtrar la búsqueda de casco urbano.
                            firstQueryWord: ['ENTINOAC', 'ENTIDAD'] // Campos en los que buscar el nombre de casco urbano.
                        },
                        suggestionListHeader: { //  Configuración de la cabecera a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color. El literal indica el tipo de búsqueda y el color será el que mejor representa a las entidades correspondientes en el mapa.
                            labelKey: "search.list.urban", // Clave del diccionario de traducciones que indica qué tipo de búsqueda es: Parcela Catastral, Municipio, Calle… en este caso Casco urbano.
                            colorSource: "strokeColor" // Configuración para obtener el color que representa al tipo de búsqueda. Se establece como color la primera coincidencia en `styles` que cumpla con la configuración.
                        },  // El resultado de la configuración anterior será: '#FEBA1E'.
                        outputProperties: ['MUNICIPIO', 'ENTIDAD'], // Colección con el nombre del campo a mostrar (según la plantilla indicada en `suggestionTemplate`) en la lista de sugerencias.
                        suggestionTemplate: '{1} ({0})', // Cadena con el patrón a mostrar en la lista de sugerencias. Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` con el valor del campo.
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

/**
 * Objeto de configuración de tipo de búsqueda, define el origen de datos y cómo procesar los patrones de 
 * búsqueda y la lista de resultados.
 * @typedef SearchTypeOptions
 * @memberof SITNA.control
 * @see SITNA.control.SearchOptions
 * @see {@link http://www.opengeospatial.org/standards/wfs|OGC Web Feature Service Standard}
 * @property {string} featurePrefix - Prefijo del nombre de la capa o capas a definir en la propiedad `featureType`.
 * Si el WFS se sirve desde GeoServer, se trata del nombre del espacio de trabajo (workspace).
 * @property {string[]} featureType - Colección con el nombre de las capas a consultar. Es posible indicar
 * más de una capa si todas ellas cuentan con los campos definidos en `queryProperties`.
 * @property {string} geometryName - Nombre del campo que contiene la geometría de la entidad geográfica.
 * @property {string} outputFormat - Formato de salida de la respuesta del servicio. En la propiedad format de
 * {@link SITNA.Consts} hay un enumerado de valores que puede adoptar esta propiedad.
 * @property {SITNA.control.SearchPatternParser} parser - Función que interpreta el texto introducido y extrae una lista de 
 * valores de los parámetros a consultar. El orden de los parámetros es el que indica la propiedad `queryProperties`.
 * @property {SITNA.control.SearchQueryPropertyOptions} queryProperties - Nombres de los campos de las
 * capas que hay que consultar para aplicar los criterios de búsqueda.
 * @property {SITNA.layer.StyleOptions[]} styles - Colección de objetos de configuración de estilo. La relación entre capa y estilo se hace mediante el índice en las colecciones 1 y 2 siendo 1 la concatenación de `featureType`
 * y `renderFeatureType` y 2 `styles`, por tanto, deberá haber tantas instancias como la suma de las capas definidas en `featureType` y en `renderFeatureType`.
 *
 * La propiedad `cluster` será ignorada en este caso.
 * @property {SITNA.control.SearchSuggestionHeaderOptions} suggestionListHeader - Configuración de la cabecera
 * a mostrar en la lista de sugerencias. La cabecera consta de un literal y de un color.
 * El literal indica el tipo de búsqueda y el color se obtendrá de una de las propiedades de la simbología de las entidades que se muestran en el mapa.
 * @property {string} suggestionTemplate - Cadena con el patrón a mostrar en la lista de sugerencias. 
 * Reemplaza el valor numérico (entre llaves) que corresponde con el índice de la colección `outputProperties` 
 * con el valor del campo. Las llaves de cierre y apertura son necesarias.
 *
 * Por ejemplo: `outputProperties` como `["NombreMunicipio", "NombreCascoUrbano"]` y `suggestionTemplate` como
 * `"{1} ({0})"` para un resultado con valor del campo **NombreMunicipio** a `"Galar"` y valor del campo
 * **NombreCascoUrbano** a `"Salinas de Pamplona"` mostrará en la lista de sugerencias el texto
 * *Salinas de Pamplona (Galar)*.
 * @property {string} url - Dirección del servicio WFS que aporta los datos para las búsquedas.
 * @property {string} [version="1.1.0"] - Versión del servicio WFS que aporta los datos para las búsquedas.
 * @example <caption>[Ver en vivo](../examples/cfg.SearchTypeOptions.html)</caption> {@lang html}
    <div id="mapa"></div>    
    <script>
        // Creamos un mapa con el control de búsquedas. 
        // Configuramos el buscador añadiendo un tipo personalizado de búsqueda.
        // Indicamos un placeHolder y tooltip (propiedad "instructions") acorde con las búsquedas configuradas.
        var map = new SITNA.Map("mapa", {
            controls: {
                search: {
                    coordinates: false,
                    cadastralParcel: false,
                    municipality: false,
                    town: false,
                    street: false,
                    postalAddress: false,
                    placeHolder: "Código postal",
                    instructions: "Buscar código postal",
                    customSearchTypes: [{
                        dataIdProperty: ["CODPOSTAL"],
                        featurePrefix: "IDENA",
                        featureType: ["DIRECC_Pol_CodPostal"],
                        geometryName: "the_geom",
                        outputFormat: SITNA.Consts.format.JSON,
                        outputProperties: ["CODPOSTAL"],
                        parser: function (pattern) {
                            // Una cadena válida es aquella que consta de cinco dígitos
                            const match = /^\d{5}$/.exec(pattern.trim());
                            if (match) {
                                return [match[0]];
                            }
                            return null;
                        },
                        queryProperties: {
                            firstQueryWord: ["CODPOSTAL"]
                        },
                        styles: [{
                            polygon: {
                                strokeColor: "#000033",
                                strokeWidth: 2,
                                fillColor: "#000033",
                                fillOpacity: 0.1
                            }
                        }],
                        suggestionListHeader: {
                            labelKey: "postcode",
                            colorSource: "strokeColor"
                        },
                        suggestionTemplate: "{0}",
                        url: "https://idena.navarra.es/ogc/wfs/"
                    }]
                }
            }
        });
    </script>
 */

/**
 * Función que interpreta el texto introducido y extrae una lista de valores de los parámetros a consultar.
 * 
 * @callback SearchPatternParser
 * @memberof SITNA.control
 * @param {string} pattern - Texto introducido por el usuario para realizar la búsqueda.
 * @returns {Array|null} Lista ordenada de valores de los parámetros a consultar en la búsqueda. 
 * Si el patrón no concuerda con el tipo de búsqueda se devuelve un valor `null`.
 * @see SITNA.control.SearchTypeOptions
 * @see SITNA.control.SearchQueryPropertyOptions
 * @example {@lang javascript}
 // Ejemplo de función que interpreta coordenadas geográficas
 function parseCoordinates(pattern) {
    const values = pattern.split(",").map(str => parseFloat(str));
    if (values.length === 2 && Math.abs(values[0]) <= 90 && Math.abs(values[1]) <= 180) {
        // Devolvemos la latitud como primer valor y la longitud como segundo
        return values;
    }
    // El patrón no concuerda
    return null;
 }
 */

/**
 * Objeto de descripción de resultado de búsqueda.
 * @typedef SearchResult
 * @memberof SITNA.control
 * @property {string} dataRole - Identificador del tipo de búsqueda.
 * @property {string} id - Identificador único del resultado.
 * @property {string} label - Texto descriptivo del resultado.
 */

import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Util from '../Util';
import { Defaults } from '../Cfg';
import Control from '../Control';
import Feature from '../../SITNA/feature/Feature';
import Vector from '../../SITNA/layer/Vector';
import infoShare from './infoShare';
import filter from '../filter';
import autocomplete from '../ui/autocomplete';

TC.control = TC.control || {};
TC.filter = filter;
TC.UI = TC.UI || {};
TC.UI.autocomplete = autocomplete;
TC.Defaults = Defaults;

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

class SearchType {
    #featureTypes = [];
    #featureTypeDescriptions = new Map();

    constructor(typeName, options, parent) {
        const self = this;

        self.parent = parent;

        Util.extend(self, options);

        self.version = self.version || '1.1.0';

        if (!self.searchFunction && self.parser) {
            // Creamos searchFunction por defecto.
            // En esta función this es el control Search.
            const type = self;
            const fetchSearch = self.#fetchSearch;
            self.searchFunction = async function (pattern) {
                const self = this;
                const params = type.parser(pattern);

                if (!params) {
                    throw "Search: no pattern match with " + type.typeName;
                }

                self.resultsList.innerHTML = type.getSuggestionListHeader() +
                    '<li data-role="' + type.typeName + '"><a class="tc-ctl-search-li-loading" href="#">' +
                    self.getLocaleString('searching') + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>';
                self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));

                const featureTypes = type.getFeatureTypes();
                for (var i = 0, ii = featureTypes.length; i < ii; i++) {
                    await type.describeFeatureType(featureTypes[i]);
                }
                return await fetchSearch.call(type, type.filter.getParams(params), self.searchRequestsAbortController.signal);
            };
        }
        if (!self.queryFactory) {
            // Creamos queryFactory por defecto.
            // En esta función this es el control Search.
            const type = self;
            self.queryFactory = function (id) {
                const queryObject = {};

                queryObject.params = {
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

                return queryObject;
            }
        }

        self.typeName = typeName;

        self.filter = (function (self) {

            const bindRootFilterNode = function (filtersArr, dataT) {
                var rootFilters = [];

                if (dataT != self.parent.rootCfg.active.root) {
                    // GLS: Si llego aquí, significa que el usuario está indicando la población
                    if (dataT.indexOf('#') === -1 && !self.parent.rootCfg.active.limit) { // si no está limitada la búsqueda, indico la población

                        const filterNodes = self.parent.rootCfg.active.queryProperties.firstQueryWord.map(function (queryWord) {
                            return self.filter.getFilterNode(queryWord, dataT);
                        });

                        if (filterNodes.length > 1) {
                            rootFilters.push(new filter.And(...filterNodes));
                        } else {
                            rootFilters.push(filterNodes[0]);
                        }

                    } else { // por tanto no añado todas las raíces posibles, añado la población que ha indicado (validando antes contra rootLabel)                     
                        const item = dataT.split('#');

                        if (self.parent.rootCfg.active.dataIdProperty.length > 1) {
                            rootFilters.push(new filter.And(...self.parent.rootCfg.active.dataIdProperty
                                .map((dataIdProperty, idx) => self.filter.getFilterNode(dataIdProperty, item.length > idx ? item[idx] : item[0]))));
                        }
                        else {
                            rootFilters.push(self.filter.getFilterNode(self.parent.rootCfg.active.dataIdProperty[0], item[0]));
                        }
                    }
                } else {
                    const orFilters = self.parent.rootCfg.active.root.map(function addOr(item) {
                            if (self.parent.rootCfg.active.dataIdProperty.length > 1) {
                                return new filter.And(...self.parent.rootCfg.active.dataIdProperty
                                    .map((dataIdProperty, i) =>
                                        self.filter.getFilterNode(dataIdProperty, item.length > i ? item[i] : item[0])));
                            }
                            else {
                                return self.filter.getFilterNode(self.parent.rootCfg.active.dataIdProperty[0], item[0]);
                            }
                    });
                    if (orFilters.length > 1) {
                        rootFilters.push(new filter.Or(...orFilters));
                    }
                    else {
                        rootFilters.push(orFilters[0]);
                    }
                }

                return filtersArr.concat(rootFilters);
            };

            const getValueOrLikePattern = function (propertyName, value) {
                const featureTypes = self.getFeatureTypes();
                const description = self.#featureTypeDescriptions.get(featureTypes[0])?.[propertyName];
                if (description?.['@type'] === 'xsd:string' && value.indexOf(self.parent._LIKE_PATTERN) < 0) {
                    return self.parent._LIKE_PATTERN + value + self.parent._LIKE_PATTERN;
                }
                return value;
            };

            return {
                getPropertyValue: function (role, propertyName) {
                    return self.getSearchTypeByRole(role)[propertyName];
                },
                getIsLikeNode: function (name, value) {
                    value = getValueOrLikePattern(name, value);

                    var toEscape = /([\-\"\.\xba\(\)\/])/g;
                    if (toEscape.test(value)) {
                        value = value.replace(toEscape, "\\$1");
                    }

                    if (value.toString().indexOf(self.parent._LIKE_PATTERN) > -1) {
                        const isLikeFilters = [];
                        isLikeFilters.push(new filter.IsLike(name,
                            value.toLowerCase().replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;"),
                            '*', '_', '\\', false));
                        isLikeFilters.push(new filter.IsLike(name,
                            value.toUpperCase().replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;"),
                            '*', '_', '\\', false));
                        return new filter.Or(...isLikeFilters);
                    }
                    else {
                        return new filter.EqualTo(name, value.replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;"));
                    }
                },
                getFunctionStrMatches: function (name, value) {
                    value = getValueOrLikePattern(name, value);

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

                        return new filter.EqualTo(new filter.Function('strMatches', {
                            PropertyName: name,
                            Literal: '(?i)' + pattern.replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;")
                        }), true);
                    }
                    else {
                        return new filter.EqualTo(name, value.replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;"));
                    }
                },
                getFilterNode: function (propertyName, propertyValue) {
                    var fn = self.filter.getIsLikeNode;

                    if (self.filterByMatch) {

                        fn = self.filter.getFunctionStrMatches;

                        var regex = new RegExp('\\' + self.parent._LIKE_PATTERN, 'gi');
                        propertyValue = propertyValue.replace(regex, self.parent._MATCH_PATTERN);
                    }

                    if (!(propertyName instanceof Array) && typeof propertyName !== 'string') {
                        const f = [];
                        for (var key in propertyName) {
                            if (propertyName[key] instanceof Array && propertyName[key].length > 1) {
                                f.push(new filter.Or(...propertyName[key].map(pName => fn(pName.trim(), propertyValue, options))));
                            } else {
                                var propName = propertyName[key];
                                if (propertyName[key] instanceof Array && propertyName[key].length === 1) {
                                    propName = propertyName[key][0];
                                }

                                f.push(fn(propName.trim(), propertyValue));
                            }
                        }

                        return new filter.Or(...f);

                    } else if (propertyName instanceof Array && propertyName.length > 1) {
                        return new filter.Or(...propertyName.map(pName => fn(pName.trim(), getValueOrLikePattern(pName.trim(), propertyValue), options)));
                    } else {
                        return fn(propertyName instanceof Array && propertyName.length === 1 ? propertyName[0].trim() : propertyName.trim(), propertyValue);
                    }
                },
                getFilter: function (data) {
                    var r = {};
                    r.f = '';

                    var _f;

                    switch (true) {
                        case self.typeName === Consts.searchType.POSTALADDRESS:
                            _f = [];
                            if (!self.parent.rootCfg.active && (/(\<|\>|\<\>)/gi.exec(data[0]) || /(\<|\>|\<\>)/gi.exec(data[1]))) {
                                let match = /(\<|\>|\<\>)/gi.exec(data[0]);
                                if (match)

                                    _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, data[0].substring(0, data[0].indexOf(match[0])).trim()));
                                else {
                                    if (self.parent.rootCfg.active) {
                                        _f = bindRootFilterNode(_f, data[0]);
                                    }
                                    else {
                                        _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, data[0]));
                                    }
                                }

                                match = /(\<|\>|\<\>)/gi.exec(data[1]);
                                if (match) {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, data[1].substring(0, data[1].indexOf(match[0])).trim()));
                                }
                                else {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, data[1]));
                                }
                            }
                            else {
                                if (self.parent.rootCfg.active) {
                                    _f = bindRootFilterNode(_f, data[0]);
                                } else {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, data[0]));
                                }
                                _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, data[1]));
                            }

                            _f.push(self.filter.getFilterNode(self.queryProperties.thirdQueryWord, data[2] + self.parent._LIKE_PATTERN));

                            _f = new filter.And(..._f);
                            r.f = _f.getText();

                            break;
                        case self.typeName === Consts.searchType.STREET:
                            _f = [];

                            if (!self.parent.rootCfg.active && (/(\<|\>|\<\>)/gi.exec(data[0]) || /(\<|\>|\<\>)/gi.exec(data[1]))) {
                                let match = /(\<|\>|\<\>)/gi.exec(data[0]);
                                if (match) {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, data[0].substring(0, data[0].indexOf(match[0])).trim()));
                                }
                                else {
                                    if (self.parent.rootCfg.active) {
                                        _f = bindRootFilterNode(_f, data[0]);
                                    }
                                    else {
                                        _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, data[0]));
                                    }
                                }

                                match = /(\<|\>|\<\>)/gi.exec(data[1]);
                                if (match) {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, data[1].substring(0, data[1].indexOf(match[0])).trim()));
                                }
                                else {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, data[1]));
                                }
                            } else {

                                if (self.parent.rootCfg.active) {
                                    _f = bindRootFilterNode(_f, data[0]);
                                }
                                else {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, data[0]));
                                }
                                _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, data[1]));
                            }
                            _f = new filter.And(..._f);
                            r.f = _f.getText();
                            break;
                        // GLS: consulta de 2 niveles (carretera con pk / topónimo con municipio)
                        case Object.prototype.hasOwnProperty.call(self.queryProperties, 'secondQueryWord'):
                            _f = new filter.And(
                                self.filter.getFilterNode(self.queryProperties.firstQueryWord, data[0]),
                                self.filter.getFilterNode(self.queryProperties.secondQueryWord, data[1])
                            );
                            r.f = _f.getText();
                            break;
                        default: // GLS: consulta de 1 único nivel (municipio, casco urbano, carretera)
                            _f = self.filter.getFilterNode(self.queryProperties.firstQueryWord, data[0]);
                            r.f = _f.getText();
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

                    return Util.getParamString(params);
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
    }

    #throwConfigError() {
        const self = this;

        throw new Error('Error en la configuración de la búsqueda: ' + self.typeName);
    }

    getFeatureTypes(toFilter) {
        const self = this;

        if (toFilter) {
            return self.featureType instanceof Array ? self.featureType : [self.featureType];
        }

        if (self.#featureTypes.length === 0) {
            var type_featureType = self.featureType instanceof Array ? self.featureType : [self.featureType];
            var type_renderFeatureType = self.renderFeatureType ? self.renderFeatureType instanceof Array ? self.renderFeatureType : [self.renderFeatureType] : [];
            self.#featureTypes = type_featureType.concat(type_renderFeatureType);
        }

        return self.#featureTypes;
    }

    async describeFeatureType(featureType) {
        const self = this;
        if (self.#featureTypes.includes(featureType)) {
            let result = self.#featureTypeDescriptions.get(featureType);
            if (!result) {
                const layer = new Vector({
                    url: self.url,
                    type: Consts.layerType.WFS,
                    featureType: featureType
                });
                result = await layer.describeFeatureType();
                self.#featureTypeDescriptions.set(featureType, result);
            }
            return result;
        }
        return null;
    }

    isFeatureOfThisType(id) {
        const self = this;
        return self.getFeatureTypes().indexOf(id) > -1;
    }

    getStyleByFeatureType(featureType) {
        const self = this;

        if (self.getFeatureTypes().indexOf(featureType) > -1) {
            return self.styles[self.getFeatureTypes().indexOf(featureType)];
        }

        return null;
    }

    getColor(css, geomType, featureType) {
        const self = this;

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
    }

    getSuggestionListHeader() {
        const self = this;

        var headerData, label, color;

        const isLegacy = Object.prototype.hasOwnProperty.call(self, 'suggestionListHead');

        if (isLegacy) {
            // Configuración antigua
            if (typeof self.suggestionListHead === "function") {
                headerData = self.suggestionListHead();
                label = headerData.label;
                color = [{
                    color: headerData.color,
                    title: label
                }];
            } else {
                headerData = self.suggestionListHead;
                label = self.parent.getLocaleString(headerData.label);

                // color es string que es el atributo CSS. El valor se obtiene de la 1º coincidencia encontrada en styles
                if (typeof headerData.color === "string") {
                    color = [{
                        color: self.getColor(headerData.color),
                        title: label
                    }];
                } else if (headerData.color instanceof Array) { // color es un array de objetos, con nombre de featureType como clave
                    const featureTypes = self.getFeatureTypes();
                    if (headerData.color.length === featureTypes.length) {
                        color = headerData.color.map(function (elm, i) {
                            return {
                                color: self.getColor(elm[featureTypes[i]].color.css, elm[featureTypes[i]].color.geomType, featureTypes[i]),
                                title: self.parent.getLocaleString(elm[featureTypes[i]].title) || label
                            };
                        });
                    } else {
                        self.#throwConfigError();
                    }
                } else if (typeof headerData.color === "object") { // color es un objeto con atributo css y tipo de geometría
                    color = [{
                        color: self.getColor(headerData.color.css, headerData.color.geomType),
                        title: label
                    }];
                }
            }
        }
        else {
            // Configuración moderna
            if (typeof self.suggestionListHeader === "function") {
                headerData = self.suggestionListHeader();
                label = headerData.labelKey;
                color = [{
                    color: headerData.colorSource,
                    title: label
                }];
            } else {
                headerData = self.suggestionListHeader;
                const colorSource = headerData.colorSource;
                label = self.parent.getLocaleString(headerData.labelKey);

                // color es string que es el nombre de propiedad de color. El valor se obtiene de la 1º coincidencia encontrada en styles
                if (typeof colorSource === "string") {
                    color = [{
                        color: self.getColor(colorSource),
                        title: label
                    }];
                } else if (colorSource instanceof Array) { // color es un array de objetos, con nombre de featureType como clave
                    const featureTypes = self.getFeatureTypes();
                    if (colorSource.length === featureTypes.length) {
                        color = colorSource.map(function (elm) {
                            return {
                                color: self.getColor(elm.colorSource.propertyName, elm.colorSource.geometryType, elm.featureType),
                                title: self.parent.getLocaleString(elm.tooltipKey) || label
                            };
                        });
                    } else {
                        self.#throwConfigError();
                    }
                } else if (typeof colorSource === "object") { // color es un objeto con atributo css y tipo de geometría
                    color = [{
                        color: self.getColor(colorSource.propertyName, colorSource.geometryType),
                        title: label
                    }];
                }
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
            self.#throwConfigError();
        }
    }

    getSuggestionListElements(data) {
        const self = this;
        var results = [];

        var areSame = function (a, b) {
            switch (true) {
                case typeof a === "number":
                    if (a === b) {
                        return true;
                    }
                    break;
                case typeof a === "string":
                    if (!Number.isNaN(a) || !Number.isNaN(b)) {
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

            var strFormat = self.suggestionTemplate;
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

            if (Array.isArray(attributes) && strFormat && getUnique(attributes).length > 1) {
                valueToAdd = Util.formatIndexedTemplate(strFormat, ...attributes);
            }
            else if (attributes instanceof Array && getUnique(attributes).length === 1) {
                valueToAdd = attributes[0];
            }

            var text = toCamelCase(valueToAdd);

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
    }

    parseFeatures(data) {
        const self = this;
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
    }

    getParser() {
        const self = this;

        if (typeof self.parser === "function") {
            return self.parser();
        } else {
            return self.parser;
        }
    }


    async #fetchSearch(params, abortSignal) {
        const self = this;
        let response;
        try {
            response = await fetch(self.url + '?' + params, {
                signal: abortSignal
            });
        }
        catch (e) {
            if (e.name === 'AbortError') {
                console.log(`Search: petición abortada [${self.typeName}] ${params}`);
            } else {
                TC.error(e);
                throw e;
            }
        }

        if (!response.ok) {
            throw "Search: error fetch " + self.typeName;
        }
        const responseText = await response.text();


        let result = [];
        let data = self.parseFeatures(responseText);
        if (!data.length) {
            throw "Search: no results with " + self.typeName;
        }
        data.map(function (feature) {
            var properties = self.outputProperties;
            if (!result.some(function (elem) {
                let isMatch = true;
                for (var prop in elem.properties) {
                    if (feature.data[prop] != elem.properties[prop]) {
                        isMatch = false;
                        break;
                    }
                }
                return isMatch;
            })) {
                var label = Util.formatIndexedTemplate(self.suggestionTemplate, ...properties.map(function (outputProperty) {
                    return feature.data[outputProperty];
                }));

                const propertiesObj = {};
                properties.forEach(prop => {
                    propertiesObj[prop] = feature.data[prop];
                });

                result.push({
                    id: self.dataIdProperty.map(function (elem) {
                        return feature.data[elem];
                    }).join('#'),
                    label: label,
                    properties: propertiesObj,
                    dataLayer: feature.id.split('.')[0],
                    dataRole: self.typeName
                });
            }
        });

        return result;
    }
}

Consts.event.TOOLSCLOSE = Consts.event.TOOLSCLOSE || 'toolsclose.tc';
Consts.event.SEARCHQUERYEMPTY = Consts.event.SEARCHQUERYEMPTY || 'searchqueryempty.tc';

class Search extends Control {
    _LIKE_PATTERN = '*';
    _MATCH_PATTERN = '.*';

    UTMX = 'X';
    UTMY = 'Y';
    LON = 'Lon';
    LAT = 'Lat';

    UTMX_LABEL = 'X: ';
    UTMY_LABEL = 'Y: ';
    LON_LABEL = 'Lon: ';
    LAT_LABEL = 'Lat: ';

    MUN = 'Mun';
    POL = 'Pol';
    PAR = 'Par';

    MUN_LABEL = 'Mun: ';
    POL_LABEL = 'Pol: ';
    PAR_LABEL = 'Par: ';

    UTMX_LEN = 7;
    UTMY_LEN = 7;

    availableSearchTypes = {};
    allowedSearchTypes = [];
    queryProperties = {
        QUERYWORD: 'QueryWord',
        FIRST: 'first',
        SECOND: 'second',
        THIRD: 'third'
    };

    #search = { data: [] };

    stringPatternValidators = {
        tsp: function (text, result, root, limit) {
            const self = this;
            // town, street, portal - street, town, portal
            var match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);
            if (match && match[1] && match[2]) {

                var getPortal = function () {
                    return self.formatStreetNumber((match[3] || match[4] || match[5] || match[6]).trim());
                };
                // ninguno contiene número duplicamos búsqueda
                if (/^([^0-9]+)$/i.test(match[1].trim()) && /^([^0-9]+)$/i.test(match[2].trim())) {
                    result.push([
                        match[1].trim(),
                        match[2].trim(),
                        getPortal()
                    ]);
                    result.push([
                        match[2].trim(),
                        match[1].trim(),
                        getPortal()
                    ]);
                }
                else {  // indicamos como calle el criterio que contiene números, ya que no existen municipios con números pero sí calles
                    if (/^([^0-9]+)$/i.test(match[1].trim())) {
                        result.push([
                            match[1].trim(),
                            match[2].trim(),
                            getPortal()
                        ]);
                    }
                    else {
                        result.push([
                            match[2].trim(),
                            match[1].trim(),
                            getPortal()
                        ]);
                    }
                }
                self.bindRoot(result, root, limit);
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
                    return self.formatStreetNumber((match[2] || match[3] || match[4] || match[5]).trim());
                };
                // ninguno contiene número duplicamos búsqueda
                if (/^([^0-9]+)$/i.test(match[6].trim()) && /^([^0-9]+)$/i.test(match[1].trim())) {
                    result.push([
                        match[6].trim(),
                        match[1].trim(),
                        getPortal()
                    ]);
                    result.push([
                        match[1].trim(),
                        match[6].trim(),
                        getPortal()
                    ]);
                }
                else {  // indicamos como calle el criterio que contiene números, ya que no existen municipios con números pero sí calles
                    if (/^([^0-9]+)$/i.test(match[6].trim())) {
                        result.push([
                            match[6].trim(),
                            match[1].trim(),
                            getPortal()
                        ]);
                    }
                    else {
                        result.push([
                            match[1].trim(),
                            match[6].trim(),
                            getPortal()
                        ]);
                    }
                }
                self.bindRoot(result, root, limit);
                return true;
            }

            return false;
        },
        tnsp: function (text, result, root, limit) {
            const self = this;
            // town, numbers street, portal
            var match = /^(?:([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)([^0-9\,]+)(?:\s*\,\s*)(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);

            if (match && match[1] && match[2]) {
                result.push([
                    match[2].trim(),
                    match[1].trim(),
                    self.formatStreetNumber((match[3] || match[4] || match[5] || match[6]).trim())
                ]);
                self.bindRoot(result, root, limit);
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
                    result.push([
                        match[1].trim(),
                        match[2].trim()
                    ]);
                    result.push([
                        match[2].trim(),
                        match[1].trim()
                    ]);

                    self.bindRoot(result, root, limit);
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

                    if (/^([^0-9]+)$/i.test(match[1].trim())) {
                        result.push([
                            match[1].trim(),
                            getStreet(match[2].trim())
                        ]);
                    }
                    else {
                        result.push([
                            match[2].trim(),
                            getStreet(match[1].trim())
                        ]);
                    }

                    self.bindRoot(result, root, limit, true);
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
                var data = [
                ];
                const criteria = text.split(',').reverse();
                for (var i = 0; i < criteria.length; i++) {
                    if (/^([^0-9\,]+)$/i.test(criteria[i].trim())) { // si no hay números se trata de municipio
                        data[0] = criteria[i].trim();
                    }
                    else if (/(\s*\d+)/i.test(criteria[i].trim())) { // si contiene número, puede ser calle o calle + portal
                        if (criteria[i].trim().indexOf(' ') === -1) { // si no contiene espacios se trata de calle compuesta por números
                            data[1] = criteria[i].trim();
                        } else { // si contiene espacio puede contener calle + portal
                            var _criteria = criteria[i].trim().split(' ').reverse();

                            var isPortal = function (c) {
                                var m = /^(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(c.trim());
                                if (m) {
                                    data[2] = self.formatStreetNumber(c.trim());
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

                            if (data[2]) {
                                var _cr = _criteria;
                                for (var h = 0; h < _cr.length; h++) {
                                    // validamos que lo que hemos deducido como portal, está en portal para no añadirlo a calle
                                    var inPortal = false;
                                    for (var c = 0; c < _cr[h].split('').length; c++) {
                                        if (data[2].indexOf(_cr[h][c]) > -1)
                                            inPortal = true;
                                    }

                                    if (inPortal) {
                                        _cr[h] = '';
                                        if (data[2] == self.formatStreetNumber(p)) {
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

                                    data[1] = fs.length > 0 ? criteriaRev.reverse().join(' ').trim() + self._LIKE_PATTERN + fs.reverse().join(self._LIKE_PATTERN) : criteriaRev.reverse().join(' ').trim();
                                }


                                // nombre_de_calle = 137, 1, 20...
                                // duplico la búsqueda para el caso de [Calle nombre_de_calle], municipio
                                result.push([
                                    data[0],
                                    data[1] + ' ' + data[2]
                                ]);
                            } else {
                                data[1] = criteria[i].trim();
                            }
                        }
                    }
                }

                result.push(data);
                self.bindRoot(result, root, limit);
                return true;
            }

            return false;
        },
        s_or_t: function (text, result, root, _limit) {
            var match = /^([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9\<\>]+)$/i.exec(text);
            if (match && match[1]) {
                if (root) {
                    result.push([
                        match[1].trim()
                    ]);

                    result.push([
                        root,
                        match[1].trim()
                    ]);
                }
                else result.push([
                    match[1].trim()
                ]);
                return true;
            }

            return false;
        },
        sp: function (text, result, root, _limit) {
            const self = this;
            var match = /^([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/]+)\s*\,?\s*((\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);
            if (match && match[1] && match[2]) { // && text.indexOf(',') > -1 && text.split(',').length < 3) {
                if (root) {
                    result.push([
                        root,
                        match[1].trim(),
                        self.formatStreetNumber(match[2].trim())
                    ]);
                }
                else {
                    result.push([
                        match[1].trim(),
                        match[2].trim()
                    ]);
                }
                return true;
            }

            return false;
        },
        snp: function (text, result, root, _limit) { // calle puede contener números con portal (cuando exista un municipio root establecido)
            const self = this;
            var match = /^([^\,][0-9\s*\-\.\(\)\/]+)\s*\,?\s*(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4})$/i.exec(text);
            if (match && match[1] && match[2] && root) {
                result.push([
                    root,
                    match[1].trim(),
                    self.formatStreetNumber(match[2].trim())
                ]);
                return true;
            }

            return false;
        }
    };

    constructor() {
        super(...arguments);

        this._dialogDiv = Util.getDiv(this.options.dialogDiv);
        if (!this.options.dialogDiv) {
            document.body.appendChild(this._dialogDiv);
        }

        this.exportsState = true;

        this.url = this.options.url || '//idena.navarra.es/ogc/wfs';
        this.version = this.options.version || '1.1.0';
        this.featurePrefix = this.options.featurePrefix || 'IDENA';

        this.mimimumPatternLength = this.options.minimumPatternLength ?? 3;

        this.WFS_TYPE_ATTRS = ["url", "version", "geometryName", "featurePrefix", "featureType", "properties", "outputFormat"];

        this.queryableFeatures = this.options.queryableFeatures || false;

        this.wrap = new TC.wrap.control.Search(this);

        this.interval = 500;

        this.NORMAL_PATTERNS = {
            ROMAN_NUMBER: /M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}){1,}?\S?\./i,
            ABSOLUTE_NOT_DOT: /[`~!@#$%^&*_|+\=?;:'"\{\}\[\]\\]/gi,
            ABSOLUTE: /[`~!@#$%^&*_|+\=?;:'.\{\}\[\]\\]/gi
        };

    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);
        if (self.options && self.options.share) {
            await self.getShareDialog();
        }

        self.EMPTY_RESULTS_LABEL = self.getLocaleString('noResults');
        self.EMPTY_RESULTS_TITLE = self.getLocaleString('checkCriterion');
        self.OUTBBX_LABEL = self.getLocaleString('outsideOfLimits');

        self.#loadAvailableSearchTypes();

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
            suggestionTemplate: '{0}',
            getRootLabel: async function () {
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

                    let response;
                    try {
                        response = await TC.ajax({
                            url: self.rootCfg[Consts.searchType.MUNICIPALITY].url + '?' + Util.getParamString(params),
                            method: 'GET',
                            responseType: Consts.mimeType.JSON
                        });
                    }
                    catch(_e) {
                        return [];
                    }

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

                    } else {
                        self.rootCfg[Consts.searchType.MUNICIPALITY].rootLabel = [];
                    }
                }
                return self.rootCfg[Consts.searchType.MUNICIPALITY].rootLabel;
            }
        };
        self.rootCfg[Consts.searchType.TOWN] = {
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
            getRootLabel: async function () {
                if (self.rootCfg.active && !self.rootCfg[Consts.searchType.TOWN].rootLabel) {

                    var params = {};
                    params.SERVICE = 'WFS';
                    params.VERSION = self.rootCfg[Consts.searchType.TOWN].version;
                    params.REQUEST = 'GetFeature';
                    params.TYPENAME = self.rootCfg[Consts.searchType.TOWN].featurePrefix + ':' + self.rootCfg[Consts.searchType.TOWN].featureType;
                    params.OUTPUTFORMAT = self.rootCfg[Consts.searchType.TOWN].outputFormat;
                    params.PROPERTYNAME = ['CMUNICIPIO', 'CENTIDAD'].concat(self.rootCfg[Consts.searchType.TOWN].outputProperties).join(',');

                    params.CQL_FILTER = self.rootCfg[Consts.searchType.TOWN].root.map(function (elem) {
                        return ['CMUNICIPIO', 'CENTIDAD'].map(function (id, index) {
                            return id + '=' + elem[index];
                        }).join(' AND ');
                    });

                    params.CQL_FILTER = params.CQL_FILTER.join(' OR ');

                    let response;
                    try {
                        response = await TC.ajax({
                            url: self.rootCfg[Consts.searchType.TOWN].url + '?' + Util.getParamString(params),
                            method: 'GET',
                            responseType: Consts.mimeType.JSON
                        });
                    }
                    catch (_e) {
                        return [];
                    }
                    const data = response.data;
                    if (data.totalFeatures > 0) {

                        self.rootCfg[Consts.searchType.TOWN].rootLabel = data.features.map(function (feature) {
                            return {
                                id: ['CMUNICIPIO', 'CENTIDAD'].map(function (elem) {
                                    return feature.properties[elem];
                                }).join('#'),
                                label: feature.properties[self.rootCfg[Consts.searchType.TOWN].outputProperties[0]].toLowerCase()
                            };
                        });

                    } else {
                        self.rootCfg[Consts.searchType.TOWN].rootLabel = [];
                    }
                }
                return self.rootCfg[Consts.searchType.TOWN].rootLabel;
            }
        };

        if (self.rootCfg.active) {
            self.rootCfg.active.getRootLabel();
        }

        self.#loadAllowedSearchTypes();

        return self;
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-search.mjs');
        const dialogTemplatePromise = import('../templates/tc-ctl-search-dialog.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-dialog'] = (await dialogTemplatePromise).default;
        self.template = template;
    }

    async render() {
        const self = this;

        self._dialogDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-dialog', {});
        await self.renderData();
    }

    async renderData(data, callback) {
        const self = this;
        self.#search = self.#search || {};
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
                            return Util.formatIndexedTemplate(searchType.suggestionTemplate, ...values);
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
        await super.renderData.call(self, Object.assign(data || {}, { share: self.options.share }));

        self.textInput = self.div.querySelector('input.' + self.CLASS + '-txt');
        if (self.options && self.options.placeHolder) {
            self.textInput.setAttribute('placeHolder', self.options.placeHolder.trim());
        }

        self.resultsList = self.div.querySelector('.' + self.CLASS + '-list');
        self.button = self.div.querySelector('.' + self.CLASS + '-btn');
        if (self.options.instructions) {
            self.textInput.setAttribute('title', self.options.instructions.trim());
            self.button.setAttribute('title', self.options.instructions.trim());
        }

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
                    if (self.doSearch(callback)) {
                        window.cancelAnimationFrame(searchDelay);
                        searchDelay = undefined;
                    }
                    else {
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
            callback: function (e) {
                self.#selectionCallback(e);
            },
            buildHTML: buildHTML.bind(self)
        });

        if (!self.map) {
            throw new Error('Control not registered to map');
        }

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
                    labelKey: self.layerStyleFN.bind(self, 'point', 'labelKey', true),
                    labelRotationKey: self.layerStyleFN.bind(self, 'point', 'labelRotationKey', true)
                }
            }
        });
        self.layer = await self.layerPromise;

        self.addUIEventListeners();

        if (Util.isFunction(callback)) {
            callback();
        }
    }

    addUIEventListeners() {
        const self = this;

        const search = function () {
            self.search(self.textInput.value, function (list) {
                if (list.length === 1) {
                    self.textInput.value = list[0].label;
                    self.#goToResult(list[0].id, self.resultsList.querySelector('li:not([header])').dataset.role);
                    self.resultsList.classList.add(Consts.classes.HIDDEN);
                }
                else if (list.length === 0) {
                    self.resultsList.classList.add(Consts.classes.HIDDEN);
                }
            });
        };

        // desde keypress y desde la lupa
        const searchAgain = function () {
            self.textInput.value = self.resultsList.label || self.resultsList.querySelector('li:not([header]) > a > span').textContent;
            self.lastPattern = self.textInput.value;
            self.#goToResult(self.resultsList.id || unescape(self.resultsList.querySelector('li:not([header]) > a').getAttribute('href')).substring(1), self.resultsList.querySelector('li:not([header])').dataset.role);
            self.resultsList.classList.add(Consts.classes.HIDDEN);
        };
        self.button.addEventListener(Consts.event.CLICK, function () {
            self.getLayer().then(function (l) {
                if (self.resultsList.querySelectorAll('li > a:not(.tc-ctl-search-li-loading):not(.tc-ctl-search-li-empty)').length > 1) { }
                else if (l.features.length > 0) {
                    l.map.zoomToFeatures(l.features);
                }
                else if (self.resultsList.querySelectorAll('li > a:not(.tc-ctl-search-li-loading):not(.tc-ctl-search-li-empty)').length === 1) {
                    searchAgain();
                }
                else {
                    self.textInput.dispatchEvent(new Event("keyup"));
                }
            });
        }, { passive: true });


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
                    searchAgain();
                } else {
                    search();
                }
                return false;
            }
        });
        self.textInput.addEventListener("search", function () {
            if (self.textInput.value.length === 0) {
                delete self.toShare;
                self.shareButton && self.shareButton.classList.add(Consts.classes.HIDDEN);
                self.resultsList.classList.add(Consts.classes.HIDDEN);
                search();
            }
        });
        self.textInput.addEventListener("input", function () {
            if (self.textInput.value.length === 0) {
                self.shareButton && self.shareButton.classList.add(Consts.classes.HIDDEN);
                self.resultsList.classList.add(Consts.classes.HIDDEN);
                search();
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
    }

    #loadAvailableSearchTypes() {
        const self = this;

        self.availableSearchTypes[Consts.searchType.CADASTRALPARCEL] = {
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
            suggestionListHeader: {
                labelKey: "search.list.cadastral",
                colorSource: [
                    {
                        featureType: 'CATAST_Pol_ParcelaUrba',
                        tooltipKey: "search.list.cadastral.urban",
                        colorSource: {
                            geometryType: "polygon",
                            propertyName: "strokeColor"
                        }
                    },
                    {
                        featureType: 'CATAST_Pol_ParcelaRusti',
                        tooltipKey: "search.list.cadastral.rustic",
                        colorSource: {
                            geometryType: "polygon",
                            propertyName: "strokeColor"
                        }
                    },
                    {
                        featureType: 'CATAST_Pol_ParcelaMixta',
                        tooltipKey: "search.list.cadastral.mixed",
                        colorSource: {
                            geometryType: "polygon",
                            propertyName: "strokeColor"
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
            searchFunction: self.getCadastralRef,
            queryFactory: self.getCadastralRefQuery,
            goToIdFormat: self.MUN + '{0}' + self.POL + '{1}' + self.PAR + '{2}',
            idPropertiesIdentifier: '#'
        };

        self.availableSearchTypes[Consts.searchType.COORDINATES] = {
            searchFunction: self.getCoordinates,
            queryFactory: self.getCoordinatesQuery,
            searchWeight: 4,
            label: null,
            suggestionListHeader: function (_text) {
                return {
                    labelKey: self.availableSearchTypes[Consts.searchType.COORDINATES].labelKey || self.getLocaleString('search.list.coordinates')
                };
            }
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
            suggestionListHeader: {
                labelKey: "search.list.municipality",
                colorSource: "strokeColor"
            },
            outputProperties: ['MUNICIPIO'],
            suggestionTemplate: '{0}',
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
            searchFunction: self.getStringPattern.bind(this, [Consts.searchType.MUNICIPALITY]),
            stringPatternToCheck: self.stringPatternValidators.s_or_t
        };

        //self.availableSearchTypes[Consts.searchType.TOWN] = {
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
        //    suggestionListHeader: {
        //        labelKey: "search.list.locality",
        //        colorSource: "strokeColor"
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
        //    searchFunction: self.getStringPattern.bind(this, [Consts.searchType.TOWN])
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
            suggestionTemplate: '{1} ({0})',
            searchWeight: 4,
            searchFunction: self.getStringPattern.bind(this, [Consts.searchType.COUNCIL]),
            stringPatternToCheck: self.stringPatternValidators.s_or_t,
            idPropertiesIdentifier: '#',
            suggestionListHeader: {
                labelKey: "search.list.council",
                colorSource: "strokeColor"
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
            suggestionListHeader: {
                labelKey: "search.list.street",
                colorSource: "strokeColor"
            },
            outputProperties: ['ENTIDADC', 'VIA', 'CVIA', 'CENTIDADC', 'CMUNICIPIO'],
            suggestionTemplate: '{1}, {0}',
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
                        labelKey: "VIA",
                        labelRotationKey: "CADANGLE",
                        fontColor: "#000000",
                        fontSize: 10,
                        fontWeight: "bold",
                        labelOutlineColor: "#FFFFFF",
                        labelOutlineWidth: 4
                    }
                }
            ],
            searchFunction: self.getStringPattern.bind(this, [Consts.searchType.STREET])
        };

        self.availableSearchTypes[Consts.searchType.POSTALADDRESS] = {
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
            suggestionListHeader: {
                labelKey: "search.list.number",
                colorSource: "fontColor"
            },
            outputProperties: ['ENTIDADC', 'VIA', 'PORTAL', 'CVIA', 'CENTIDADC', 'CMUNICIPIO'],
            suggestionTemplate: '{1} {2}, {0}',
            styles: [
                {
                    point: {
                        radius: 0,
                        labelKey: "PORTAL",
                        labelRotationKey: "CADANGLE",
                        fontColor: "#CB0000",
                        fontSize: 14,
                        labelOutlineColor: "#FFFFFF",
                        labelOutlineWidth: 4
                    }
                }
            ],
            searchFunction: self.getStringPattern.bind(this, [Consts.searchType.POSTALADDRESS])
        };

        self.availableSearchTypes[Consts.searchType.TOWN] = {
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
            suggestionListHeader: {
                labelKey: "search.list.urban",
                colorSource: "strokeColor"
            },
            outputProperties: ['MUNICIPIO', 'ENTIDAD'],
            suggestionTemplate: '{1} ({0})',
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
            searchFunction: self.getStringPattern.bind(this, [Consts.searchType.TOWN]),
            stringPatternToCheck: self.stringPatternValidators.s_or_t
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
            suggestionListHeader: {
                labelKey: "search.list.placeName",
                colorSource: "fontColor"
            },
            outputProperties: ['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO'],
            suggestionTemplate: '{1} ({0})',
            searchWeight: 7,
            /*filterByMatch: true, // si queremos que filtre por expresión regular */
            styles: [
                {
                    point: {
                        radius: 0,
                        labelKey: "TOPONIMO",
                        labelRotationKey: "CADANGLE",
                        fontColor: "#ff5722",
                        fontSize: 14,
                        labelOutlineColor: "#FFFFFF",
                        labelOutlineWidth: 4
                    }
                }
            ],
            searchFunction: self.getStringPattern.bind(this, [Consts.searchType.PLACENAME]),
            stringPatternToCheck: self.stringPatternValidators.s_or_t
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
            suggestionListHeader: {
                labelKey: "search.list.placeName",
                colorSource: "fontColor"
            },
            outputProperties: ['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO'],
            suggestionTemplate: '{1} ({0})',
            searchWeight: 8,
            /*filterByMatch: true, si queremos que filtre por expresión regular */
            styles: [
                {
                    point: {
                        radius: 0,
                        labelKey: "TOPONIMO",
                        labelRotationKey: "CADANGLE",
                        fontColor: "#ff5722",
                        fontSize: 14,
                        labelOutlineColor: "#FFFFFF",
                        labelOutlineWidth: 4
                    }
                }
            ],
            searchFunction: self.getStringPattern.bind(this, [Consts.searchType.PLACENAMEMUNICIPALITY]),
            stringPatternToCheck: [self.stringPatternValidators.ts, self.stringPatternValidators.st]
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
            suggestionTemplate: '{0}',
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
            suggestionListHeader: {
                labelKey: "search.list.road",
                colorSource: "strokeColor"
            },
            outputProperties: ['DCARRETERA'],
            suggestionTemplate: self.getLocaleString('search.list.road.shorter') + ': ' + '{0}',
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
            queryFactory: self.getRoadQuery,
            regEx: new RegExp("^(?:(?:" + self.getLocaleString("search.list.road") + "|" + self.getLocaleString("search.list.road.shorter") + ")\\:?)?\\s*((A?|AP?|N?|R?|E?|[A-Z]{2}?|[A-Z]{1}?)\\s*\\-?\\s*(\\d{1,4})\\s*\\-?\\s*(A?|B?|C?|R?))$", "i"),
            parser: function (pattern) {
                const self = this;
                pattern = pattern.trim();
                if (pattern.length < 2) {
                    return null;
                } else {
                    var match = self.regEx.exec(pattern);
                    if (!match || !match[3]) {
                        return null;
                    }

                    let _pattern = match[2] ? match[2].trim() + "-" + match[3].trim() : match[3].trim();
                    if (match[4] && match[4].length > 0) {
                        _pattern = _pattern + "-" + match[4].trim();
                    }

                    return [_pattern];
                }
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
            suggestionListHeader: {
                labelKey: "search.list.milestone.larger",
                colorSource: "fontColor"
            },
            outputProperties: ['DCARRETERA', 'PK'],
            suggestionTemplate: self.getLocaleString('search.list.road.shorter') + ': {0} ' + self.getLocaleString('search.list.milestone') + ': {1}',
            searchWeight: 11,
            styles: [
                {
                    point: {
                        labelKey: ["DCARRETERA", "PK"],
                        fontColor: "#00b2fc",
                        fontSize: 14,
                        labelOutlineColor: "#ffffff",
                        labelOutlineWidth: 2
                    }
                }
            ],
            queryFactory: self.getMilestoneQuery,
            regEx: new RegExp("^(?:(?:" + self.getLocaleString("search.list.road") + "|" + self.getLocaleString("search.list.road.shorter") + ")\\:?)?\\s*((A?|AP?|N?|R?|E?|[A-Z]{2}?|[A-Z]{1}?)\\s*\\-?\\s*(\\d{1,4})\\s*\\-?\\s*(A?|B?|C?|R?))\\s*\\,*\\s*(?:(?:" + self.getLocaleString("search.list.milestone") + "\\:?)|(?:P\\:?)|(?:K\\:?)|(?:KM\\:?)|(?:\\s+|\\,+))\\s*(\\d{1,4})$", "i"),
            parser: function (pattern) {
                const self = this;
                pattern = pattern.trim();
                if (pattern.length < 3) {
                    return null;
                } else {
                    var match = self.regEx.exec(pattern);
                    if (!match || !match[3] || !match[5]) {
                        return null;
                    }

                    var _pattern = match[2] ? match[2].trim() + "-" + match[3].trim() : match[3].trim();
                    if (match[4] && match[4].length > 0) {
                        _pattern = _pattern + "-" + match[4].trim();
                    }

                    return [_pattern, match[5].trim()];
                }
            }
        };

        return self;
    }

    getAvailableSearchTypes() {
        const self = this;
        if (!Object.keys(self.availableSearchTypes).length) {
            self.#loadAvailableSearchTypes();
        }
        return self.availableSearchTypes;
    }

    #loadAllowedSearchTypes() {
        const self = this;
        // Consolidamos los tipos de búsqueda que están directamente en el objeto de opciones con los de allowedSearchTypes.
        let allowedSearchTypesOptions = { ...self.options };
        delete allowedSearchTypesOptions.allowedSearchTypes;
        Object.assign(allowedSearchTypesOptions, self.options.allowedSearchTypes);

        // Cambiamos alias por el nombre correcto (p.e. cadastral por cadastralAddress)
        const changeProperty = function (oldName, newName) {
            if (Object.prototype.hasOwnProperty.call(allowedSearchTypesOptions, oldName)) {
                if (!Object.prototype.hasOwnProperty.call(allowedSearchTypesOptions, newName)) {
                    allowedSearchTypesOptions[newName] = allowedSearchTypesOptions[oldName];
                }
                delete allowedSearchTypesOptions[oldName];
            }
        }
        changeProperty('cadastral', Consts.searchType.CADASTRALPARCEL);
        changeProperty('number', Consts.searchType.POSTALADDRESS);
        changeProperty('urban', Consts.searchType.TOWN);
        changeProperty('locality', Consts.searchType.TOWN);
        changeProperty('roadmilestone', Consts.searchType.ROADMILESTONE);
        changeProperty('placename', Consts.searchType.PLACENAME);
        changeProperty('placenamemunicipality', Consts.searchType.PLACENAMEMUNICIPALITY);

        // Nos quedamos solamente con las opciones de tipo de búsqueda
        allowedSearchTypesOptions = Object.fromEntries(Object.entries(allowedSearchTypesOptions)
            .filter(([key]) => Object.values(Consts.searchType).find(v => v === key)));

        // Verificamos si hay definidos tipos de busca permitidos en la configuración.
        // Si no hay, tomamos la configuración por defecto
        if (!Object.keys(allowedSearchTypesOptions).length) {
            allowedSearchTypesOptions = Defaults.controls.search?.allowedSearchTypes || {};
        }

        if (self.options.customSearchTypes) {
            self.options.customSearchTypes.forEach(searchType => {
                self.addAllowedSearchType(self.getUID(), searchType);
            });
        }

        const keys = Object.keys(allowedSearchTypesOptions);

        keys.forEach(function (key) {
            if (typeof allowedSearchTypesOptions[key] === "boolean" || Util.isPlainObject(allowedSearchTypesOptions[key])) {
                if (allowedSearchTypesOptions[key]) {

                    switch (true) {
                        case key === Consts.searchType.PLACENAME:
                        case key === Consts.searchType.PLACENAMEMUNICIPALITY:
                        case key === Consts.searchType.POSTALADDRESS:
                        case key === Consts.searchType.CADASTRALPARCEL:
                        case key === Consts.searchType.TOWN:
                            allowedSearchTypesOptions[key] = Util.isPlainObject(allowedSearchTypesOptions[key]) ? allowedSearchTypesOptions[key] : {};
                            break;
                        default:
                        //allowedSearchTypesOptions[key] = Util.isPlainObject(allowedSearchTypesOptions[key]) ? allowedSearchTypesOptions[key] : {};
                    }
                }
            }
        });


        if (allowedSearchTypesOptions) {
            for (var allowedKey in allowedSearchTypesOptions) {

                const availableSearchType = self.availableSearchTypes[allowedKey];
                const allowedSearchType = allowedSearchTypesOptions[allowedKey];

                if (availableSearchType && !Util.isEmptyObject(allowedSearchType)) {

                    // GLS: gestionamos el override de featureType y renderFeatureType.
                    // Si por defecto cuenta con renderFeatureType y sobrescribe featureType y no renderFeatureType, 
                    // elimino la propiedad renderFeatureType y elimino el último estilo definido, que se corresponde con el de renderFeatureType.
                    if (availableSearchType.renderFeatureType?.length > 0 &&
                        allowedSearchType.featureType && !allowedSearchType.renderFeatureType) {

                        delete availableSearchType.renderFeatureType;
                        availableSearchType.styles = availableSearchType.styles.slice(0, availableSearchType.styles.length - 1);
                    }

                    // GLS: override de la configuración por defecto con la del config.JSON
                    Util.extend(availableSearchType, allowedSearchType);
                    if (!availableSearchType.suggestionTemplate) {
                        availableSearchType.suggestionTemplate = availableSearchType.outputFormatLabel
                    }


                    // GLS: Limitamos la búsqueda en portales y calles cuando así se establezca en la configuración de las búsquedas
                    let rootType = allowedSearchType.rootType;
                    if (rootType === 'locality') { // Valor obsoleto
                        rootType = Consts.searchType.TOWN;
                    }
                    if (allowedSearchType.root &&
                        (allowedKey !== Consts.searchType.MUNICIPALITY && rootType === Consts.searchType.MUNICIPALITY) ||
                        allowedKey !== Consts.searchType.TOWN && rootType === Consts.searchType.TOWN) {

                        self.rootCfg.active = self.rootCfg[rootType];
                        self.rootCfg.active.root = allowedSearchType.root;
                        self.rootCfg.active.limit = allowedSearchType.limit;

                        self.availableSearchTypes[Consts.searchType.STREET].queryProperties.firstQueryWord =
                            self.availableSearchTypes[Consts.searchType.POSTALADDRESS].queryProperties.firstQueryWord =
                            self.rootCfg.active.dataIdProperty;
                    }
                }

                if (allowedSearchType) {
                    self.addAllowedSearchType(allowedKey, availableSearchType ? availableSearchType : allowedSearchType, self);
                }
            }
        }
    }

    addAllowedSearchType(name, options) {
        const self = this;
        self.allowedSearchTypes.push(new SearchType(name, options, self));
        return self;
    }

    getSearchTypeByRole(type) {
        const self = this;
        return self.allowedSearchTypes.find(allowed => allowed.typeName.toLowerCase() == type.toLowerCase());
    }

    getSearchTypeByFeature(id) {
        const self = this;

        const type = self.allowedSearchTypes.find(allowed => allowed.isFeatureOfThisType(id));
        return type ?? null;
    }

    getElementOnSuggestionList(id, dataRole) {
        const self = this;

        for (var i = 0; i < self.searchRequestsResults.length; i++) {
            if (self.searchRequestsResults[i].id == id &&
                (!dataRole || self.searchRequestsResults[i].dataRole === dataRole)) {
                return self.searchRequestsResults[i];
            }
        }
    }

    getLayer() {
        const self = this;
        return self.layerPromise;
    }

    getFeatures() {
        const self = this;
        return self.layer.features;
    }

    cleanMap() {
        const self = this;

        if (self.layer) {
            const l = self.layer;
            const features = l.features.slice();
            l.clearFeatures();

            if (features?.length > 0) {
                self.map.trigger(Consts.event.FEATUREREMOVE, { layer: l, feature: features[0] });
            }

            for (var i = 0; i < self.WFS_TYPE_ATTRS.length; i++) {
                if (Object.prototype.hasOwnProperty.call(l, self.WFS_TYPE_ATTRS[i])) {
                    delete l[self.WFS_TYPE_ATTRS[i]];
                }
            }
        }
    }

    async getMunicipalities() {
        const self = this;

        TC.cache.search = TC.cache.search || {};
        if (!TC.cache.search.municipalities) {
            var type = self.getSearchTypeByRole(Consts.searchType.CADASTRALPARCEL);

            if (!(type.municipality?.featureType && type.municipality.labelProperty && type.municipality.idProperty)) {
                throw new Error("Error en la configuración de la búsqueda: " + type.typeName + ". Error en el objeto municipality");
            }
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
            var url = type.url + '?' + Util.getParamString(params);
            let response;
            try {
                response = await TC.ajax({
                    url: url,
                    method: 'GET',
                    responseType: 'text'
                });
            }
            catch (_e) {
                return null;
            }
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

            return TC.cache.search.municipalities;
        }
        return TC.cache.search.municipalities;
    }

    getCoordinates(pattern) {
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
                    var coords = Util.parseCoords(pattern);
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
    }

    async getCadastralRef(pattern) {
        const self = this;
        let match = pattern.match(new RegExp(self.MUN_LABEL.trim().toLowerCase() + '?\\s(.*)\\,\\s?' + self.POL_LABEL.trim().toLowerCase() + '?\\s(\\d{1,2})\\,\\s?' + self.PAR_LABEL.trim().toLowerCase() + '?\\s(\\d{1,4})'));
        if (match) {
            pattern = match[1] + ', ' + match[2] + ', ' + match[3];
        }

        var _pattern = pattern;
        if (!/^(.*)\,(\s*\d{1,2}\s*)\,(\s*\d{1,4}\s*)$/.test(pattern) && self.getSearchTypeByRole(Consts.searchType.CADASTRALPARCEL).suggestionRoot)
            _pattern = self.getSearchTypeByRole(Consts.searchType.CADASTRALPARCEL).suggestionRoot + ', ' + pattern;

        if (/^(.*)\,(\s*\d{1,2}\s*)\,(\s*\d{1,4}\s*)$/.test(_pattern) && !new RegExp('^([-+]?[0-9]{' + self.UTMX_LEN + '})\\s*\\,\\s*([-+]?[0-9]{' + self.UTMY_LEN + '})$').test(pattern)) {
            const list = await self.getMunicipalities();
            match = /^(.*)\,(\s*\d{1,2}\s*)\,(\s*\d{1,4}\s*)$/.exec(_pattern);
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
                        dataRole: Consts.searchType.CADASTRALPARCEL,
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

                    if (match[1].trim() === self.getSearchTypeByRole(Consts.searchType.CADASTRALPARCEL).suggestionRoot) {

                        const suggestionRoot = list.find(function (elm) {
                            return parseInt(elm.id) === parseInt(self.getSearchTypeByRole(Consts.searchType.CADASTRALPARCEL).suggestionRoot);
                        });

                        if (suggestionRoot) {
                            return [getItem(suggestionRoot.id, suggestionRoot.label, match[2].trim(), match[3].trim())];
                        }
                    }

                    results.push(getItem(match[1].trim(), match[1].trim(), match[2].trim(), match[3].trim()));
                }

                //console.log('getCadastralRef promise resuelta');
                return results;
            }
        }

        throw "Search: Not a cadastral reference";
    }

    #getObjectsFromStringToQuery(allowedRoles, text) {
        const self = this;
        const root = self.rootCfg.active && self.rootCfg.active.root || '';
        const limit = self.rootCfg.active && self.rootCfg.active.limit || false;

        var result = [];

        const isValid = function () {
            var tests = [
                (text) => text.length >= self.mimimumPatternLength,
                (text) => /^\d+$/.test(text) ? false : !(/^\d+\,\s*\d+$/.test(text))
            ];

            for (const test of tests) {
                if (!test(text)) return false;
            }

            return true;
        };

        // eliminamos espacios en blanco
        text = text.trim();

        // comprobamos si acaba con coma, si es así, la eliminamos
        if (text.charAt(text.length - 1) === ',') {
            text = text.substring(0, text.length - 1);
        }

        if (isValid(text)) {
            var check = [];

            check = allowedRoles.map(function (dataRole) {
                return self.getSearchTypeByRole(dataRole);
            }).filter(function (searchType) {
                return searchType.stringPatternToCheck;
            }).map(function (searchType) {
                return searchType.stringPatternToCheck;
            }).flat();

            if (check.length === 0) {
                check = [self.stringPatternValidators.tsp, self.stringPatternValidators.spt, self.stringPatternValidators.tnsp, self.stringPatternValidators.ts, self.stringPatternValidators.st];
                if (root && text.split(',').length < 3) {
                    check = [self.stringPatternValidators.sp, self.stringPatternValidators.snp, self.stringPatternValidators.s_or_t].concat(check);
                }
                else {
                    check = check.concat([self.stringPatternValidators.sp, self.stringPatternValidators.snp, self.stringPatternValidators.s_or_t]);
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
    }

    async getStringPattern(allowedRoles, pattern) {
        const self = this;

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
            toQuery = self.#getObjectsFromStringToQuery(allowedRoles, combinedCriteria[1]) || [];
            // búsqueda de topónimo
            let toQueryCombined = self.#getObjectsFromStringToQuery(allowedRoles, combinedCriteria[1] + ',' + combinedCriteria[2]) || [];

            toQuery = toQuery.concat(toQueryCombined);
        } else {
            toQuery = self.#getObjectsFromStringToQuery(allowedRoles, pattern) || [];
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
                        pendingSuggestionLstHead.push(type.getSuggestionListHeader());
                        pendingSuggestionLstHead.push('<li data-role="' + type.typeName + '"><a class="tc-ctl-search-li-loading" href="#">' + self.getLocaleString('searching') + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>');

                        pendingHeaderRoles.push(type.typeName);
                    }

                    let responseToSuggestionLstElmt = (response) => {
                        return type.getSuggestionListElements(response);
                    };
                    requestsQuery.push(requestToWFS(type, self.searchRequestsAbortController.signal, responseToSuggestionLstElmt, dataToQuery));
                }
            }

            if (requestsQuery.length > 0) {
                self.resultsList.innerHTML += pendingSuggestionLstHead.join('');
                self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));

                const results = (await Promise.allSettled(requestsQuery))
                    .filter(obj => obj.status === "fulfilled")
                    .map(obj => obj.value);
                //console.log('getStringPattern promise resuelta');                                  
                return results.flat();
            }
        }

        throw "Search: Pattern not matched";
    }

    doSearch(callback) {
        const self = this;
        let criteria = self.textInput.value.trim();

        if (criteria.length > 0 &&
            criteria !== self.lastPattern &&
            performance.now() - self.lastpress > self.interval) {

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
            return true;
        }
        return false;
    }

    search(pattern, callback) {
        const self = this;

        pattern = pattern.trim();
        if (pattern.length > 0) {
            pattern = pattern.toLowerCase();
            if (self.searchRequestsAbortController) {
                self.searchRequestsAbortController.abort();
            }

            self.searchRequestsAbortController = new AbortController();

            self.resultsList.innerHTML = '';
            self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));

            self.searchRequestsResults = [];

            let toRender = 0;
            let someSuccess = false;
            let renderingEnd = (success) => {
                toRender--;
                if (success) {
                    someSuccess = true;
                }
                if (toRender === 0) {
                    // si al término de las peticiones ya estamos con otro patrón no hacemos nada
                    if (pattern !== self.textInput.value.trim().toLowerCase()) {
                        return;
                    }
                    else {
                        if (self.searchRequestsResults.length === 0) {
                            self.cleanMap();

                            if (someSuccess && (!self.layer || self.layer.features.length === 0)) {

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
                    self.#search.data = self.searchRequestsResults;

                    if (callback) {
                        callback(self.searchRequestsResults);
                    }
                }
            };

            let rootLabelPromise;
            if (self.rootCfg.active) {
                rootLabelPromise = self.rootCfg.active.getRootLabel();
            }
            else {
                rootLabelPromise = Promise.resolve();
            }

            rootLabelPromise.then(() => {
                for (const allowedSearchType of self.allowedSearchTypes) {
                    if (allowedSearchType.searchFunction) {
                        toRender++;

                        //console.log('registramos promesa: ' + allowed.typeName);

                        allowedSearchType.searchFunction.call(self, pattern)
                            .then(function (dataRole, result) {

                                let manageLoadingByDataRole = () => {
                                    let loadingElemOfDataRole = self.resultsList.querySelector('li[data-role="' + dataRole + '"]');
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

                                renderingEnd(true);

                                //resolve(result);
                            }.bind(self, allowedSearchType.typeName))
                            .catch(function (_dataRole) {
                                //reject();
                                //console.log('reject promesa: ' + _dataRole);
                                renderingEnd(false);
                                const li = self.resultsList.querySelector("[data-role='" + _dataRole + "']")
                                if (li) {
                                    li.parentElement.removeChild(li.previousElementSibling);
                                    li.parentElement.removeChild(li);
                                }
                            }.bind(self, allowedSearchType.typeName));
                    } else {
                        console.log('Falta implementación del método searchFunction en el tipo ' + allowedSearchType.typeName);
                    }
                }
            });
        }
        else {
            self.lastPattern = "";

            self.cleanMap();
        }
    }

    #setQueryableFeatures(features) {
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
    }

    #goToResult(id, dataRole) {
        const self = this;

        self.toShare = { id: id, dataRole: dataRole };

        //02/03/2020 cuando selecciona un elemento abortamos peticiones pendientes
        if (self.searchRequestsAbortController) {
            self.searchRequestsAbortController.abort();
        }

        return new Promise(function (resolve, reject) {
            if (!self.loading)
                self.loading = self.map.getLoadingIndicator();

            var wait;
            wait = self.loading.addWait();

            // en pantallas pequeñas, colapsamos el panel de herramientas
            if (matchMedia('(max-width: 30em)').matches) {
                self.textInput.blur();
                self.map.trigger(Consts.event.TOOLSCLOSE);
            }

            self.cleanMap();

            var goToObject = null;
                        
            const dr = dataRole || self.getElementOnSuggestionList.call(self, id).dataRole;

            //const allowed = self.allowedSearchTypes.findByProperty("typeName", dr);
            const allowed = self.getSearchTypeByRole(dr);

            const customSearchType = !Object.prototype.hasOwnProperty.call(self.availableSearchTypes, dr)

            if (!allowed.queryFactory) {
                console.log('Falta implementación del método queryFactory');
            } else {
                goToObject = allowed.queryFactory.call(self, id, dr);
            }

            self.loading.removeWait(wait);

            if (goToObject) {
                self.getLayer().then(function (layer) {
                    var i;
                    switch (true) {
                        case goToObject.params.type === Consts.layerType.VECTOR:
                            for (i = 0; i < self.WFS_TYPE_ATTRS.length; i++) {
                                if (Object.prototype.hasOwnProperty.call(layer, self.WFS_TYPE_ATTRS[i])) {
                                    delete layer[self.WFS_TYPE_ATTRS[i]];
                                }
                            }
                            break;
                        case goToObject.params.type === Consts.layerType.WFS:
                            for (i = 0; i < self.WFS_TYPE_ATTRS.length; i++) {
                                layer[self.WFS_TYPE_ATTRS[i]] = goToObject.params[self.WFS_TYPE_ATTRS[i]];
                            }
                            break;
                        default:
                    }

                    layer.type = goToObject.params.type;

                    const onFeaturesAdd = function (e) {
                        if (e.layer === self.layer) {
                            self.map.off(Consts.event.FEATURESADD, onFeaturesAdd);
                            self.#setQueryableFeatures(e.features);
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

                                    } else if (e.layer.features && e.layer.features.length === 0 && goToObject.params.type === Consts.layerType.WFS) {
                                        self.resultsList.inner = goToObject.emptyResultHTML;
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
                            } else if (e.layer.features && e.layer.features.length === 0 && goToObject.params.type === Consts.layerType.WFS) {
                                self.resultsList.innerHTML = goToObject.emptyResultHTML;
                                self.textInput.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));

                                if (!(e.newData && e.newData.features && e.newData.features.length > 0)) {
                                    self.map.trigger(Consts.event.SEARCHQUERYEMPTY);
                                }

                                self.loading.removeWait(wait);
                            }

                            resolve(goToObject);
                        }
                    };
                    self.map.on(Consts.event.LAYERUPDATE, layerEventHandler);
                    layer.wrap.reloadSource();
                });
            } else {
                reject(Error('Method queryFactory has no implementation'));
                if (!customSearchType) {
                    self.map.trigger(Consts.event.SEARCHQUERYEMPTY);
                }
            }
        });
    }

    goToResult(id, dataRole) {
        var self = this;
        // si está habilitada
        if (self.getSearchTypeByRole(dataRole)) {
            return self.#goToResult(id, dataRole);
            // si no está habilitada pero está disponible
        } else if (self.availableSearchTypes[dataRole]) {
            self.addAllowedSearchType(dataRole, self.availableSearchTypes[dataRole], self);
            return self.#goToResult(id, dataRole);
        } else {
            alert('No se reconoce el tipo de búsqueda: ' + dataRole);
        }
    }

    #drawPoint(id) {
        this.map?.wait(async () => {
            let point = this.getPoint(id);
            let title;
            let markerPromise;

            if (point) {
                title = this.getLabel(id);
                markerPromise = this.layer.addMarker(point, Util.extend({}, this.map.options.styles.point, { title: title, group: title }));
            } else {
                var match = /^Lat((?:[+-]?)\d+(?:\.\d+)?)Lon((?:[+-]?)\d+(?:\.\d+)?)$/.exec(id);
                id = this.LAT + match[2] + this.LON + match[1];
                point = this.getPoint(id);

                if (point) {
                    title = this.getLabel(id);
                    markerPromise = this.layer.addMarker(point, Util.extend({}, this.map.options.styles.point, { title: title, group: title }));

                    this.textInput.value = title;
                }
            }
            const [marker] = await Promise.all([markerPromise, Util.getTimedPromise(null, 100)]);
            this.map.trigger(Consts.event.LAYERUPDATE, {
                layer: this.layer, newData: marker
            });

            this.map.trigger(Consts.event.FEATURESADD, {
                layer: this.layer, features: [marker]
            });


            this.map.zoomToFeatures([marker]);
        });
    }

    getCoordinatesQuery(id) {
        const self = this;
        const queryObject = {};
        if (/^X([-+]?\d+(?:[\.\,]\d+)?)Y([-+]?\d+(?:[\.\,]\d+)?)$/.test(id) || /^Lat((?:[+-]?)\d+(?:[.,]\d+)?)Lon((?:[+-]?)\d+(?:[.,]\d+)?)$/.test(id)) {

            queryObject.params = {
                type: Consts.layerType.VECTOR,
                styles: {
                    marker: {
                        url: self.layerStyleFN.bind(self, 'marker', 'url', true)
                    }
                }
            };

            queryObject.emptyResultHTML = '<li><a class="tc-ctl-search-li-empty">' + self.OUTBBX_LABEL + '</a></li>';

            self.#drawPoint(id);

            return queryObject;
        }

        return null;
    }

    getCadastralRefQuery(id) {
        const self = this;
        const queryObject = {};

        const regex = new RegExp("^" + self.MUN + "(\\d+)" + self.POL + "(\\d{1,2})" + self.PAR + "{1}(\\d{1,4})");
        if (regex.test(id)) {
            var match = regex.exec(id);

            var type = self.getSearchTypeByRole(Consts.searchType.CADASTRALPARCEL);

            queryObject.params = {
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

            queryObject.emptyResultHTML = '<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>';

            return queryObject;
        }

        return null;
    }

    getRoadQuery(id) {
        const self = this;
        const queryObject = {};

        const type = self.getSearchTypeByRole(Consts.searchType.ROAD);

        queryObject.params = {
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

        queryObject.emptyResultHTML = '<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>';

        return queryObject;
    }

    getMilestoneQuery(id) {
        const self = this;
        const queryObject = {};

        const type = self.getSearchTypeByRole(Consts.searchType.ROADMILESTONE);

        queryObject.params = {
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

        queryObject.emptyResultHTML = '<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>';

        return queryObject;
    }

    getPoint(pattern) {
        const self = this;
        var isMapGeo = self.map.wrap.isGeo();
        var point;
        var match = /^X([-+]?\d+(?:\.\d+)?)Y([-+]?\d+(?:\.\d+)?)$/.exec(pattern);
        if (match && match.length === 3) {
            point = [parseFloat(match[1]), parseFloat(match[2])];
            if (isMapGeo) {
                point = Util.reproject(point, self.map.options.utmCrs, self.map.crs);
            }
        }
        else {
            match = /^Lat((?:[+-]?)\d+(?:[.,]\d+)?)Lon((?:[+-]?)\d+(?:[.,]\d+)?)$/.exec(pattern);
            if (match && match.length === 3) {
                point = [parseFloat(match[2]), parseFloat(match[1])];
                if (!isMapGeo) {
                    return Util.reproject(point, self.map.options.geoCrs, self.map.crs);
                }
            }

            match = /^Lon((?:[+-]?)\d+(?:[.,]\d+)?)Lat((?:[+-]?)\d+(?:[.,]\d+)?)$/.exec(pattern);
            if (match && match.length === 3) {
                point = [parseFloat(match[2]), parseFloat(match[1])];
                if (!isMapGeo) {
                    return Util.reproject(point, self.map.options.geoCrs, self.map.crs);
                }
            }
        }

        return point;
    }

    insideLimit(point) {
        const self = this;
        var getIntersectsBounds = function (extent, point) {
            if (extent instanceof Array)
                return point[0] >= extent[0] && point[0] <= extent[2] && point[1] >= extent[1] && point[1] <= extent[3];
            else return true;
        };

        if (getIntersectsBounds(self.map.options.maxExtent, point)) {
            return true;
        }

        return false;
    }

    getPattern() {
        const self = this;
        return self.textInput.value;
    }

    getLabel(id) {
        const self = this;
        var result = id;
        var locale = Util.getMapLocale(self.map);

        const geoCoordsLabel = function (result, match) {
            let parsedCoords = Util.parseCoords(match[1] + ',' + match[3]);
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
    }

    removePunctuation(text) {
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
    }

    highlightResult(elm) {
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
            const regex = self.getSearchTypeByRole(elm.dataRole).regEx;
            const match = regex.exec(self.lastPattern);

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
    }

    formatStreetNumber(value) {
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
    }

    #selectionCallback(e) {
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
            self.#goToResult(unescape(_target.getAttribute('href')).substring(1), _target.parentNode.dataset.role);
            TC.UI.autocomplete.call(self.textInput, 'clear');

            self.shareButton && self.shareButton.classList.remove(Consts.classes.HIDDEN);
        }
    }

    bindRoot(result, root, limit, addRoot) {
        const self = this;

        if (root) {
            var i = result.length;
            while (i--) {
                if (!addRoot) {
                    if (result[i][0]) {
                        var indicatedRoot = self.rootCfg.active.rootLabel?.filter(function (elem) {
                            return elem.label.indexOf(self.removePunctuation(result[i][0]).toLowerCase()) > -1;
                        }.bind(self)) || [];

                        if (indicatedRoot.length === 1) {
                            result[i][0] = indicatedRoot[0].id;
                        } else if (indicatedRoot.length > 1) {

                            indicatedRoot.map(function (elem) {
                                var newResult = Util.extend({
                                }, result[i]);
                                newResult[0] = elem.id;

                                result.push(newResult);
                            });

                        } else if (indicatedRoot.length === 0 && limit) {
                            result.splice(i, 1);
                        }
                    }
                }
                else {
                    result.push(Util.extend({}, result[i], { t: root }));
                }
            }
        }
    }

    exportState() {
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
    }

    importState(state) {
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
    }
}

TC.mix(Search, infoShare);

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
            html.push(self.getSearchTypeByRole(elm.dataRole).getSuggestionListHeader());
            dataRoles.push(elm.dataRole);
        }

        html.push(`<li data-role="${elm.dataRole}"><a href="#${encodeURIComponent(elm.id)}"><span hidden>${elm.label}</span>${self.highlightResult(elm)}</a></li>`);
    }

    Array.prototype.map.call(self.resultsList.querySelectorAll('li[data-role]'), (elm) => {
        return elm.dataset.role;
    }).filter((dataRole, i, liDataRoles) => {
        return liDataRoles.indexOf(dataRole) === i && !dataRoles.includes(dataRole);
    }).forEach(dataRole => {
        html.push(self.getSearchTypeByRole(dataRole).getSuggestionListHeader());
        html.push(`<li data-role="${dataRole}"><a class="tc-ctl-search-li-loading" href="#">${self.getLocaleString('searching')}<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>`);
    });

    return html.join('');
};

const sortByRoleAndAlphabet = function (a, b) {
    const self = this;

    const aSearchType = self.getSearchTypeByRole(a.dataRole);
    const bSearchType = self.getSearchTypeByRole(b.dataRole);
    if (aSearchType.searchWeight && bSearchType.searchWeight) {
        if (aSearchType.searchWeight > bSearchType.searchWeight) {
            return 1;
        } else if (aSearchType.searchWeight < bSearchType.searchWeight) {
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

    const aSearchType = self.getSearchTypeByRole(a.dataRole);
    const bSearchType = self.getSearchTypeByRole(b.dataRole);
    if (aSearchType.searchWeight && bSearchType.searchWeight) {
        if (aSearchType.searchWeight > bSearchType.searchWeight) {
            return 1;
        } else if (aSearchType.searchWeight < bSearchType.searchWeight) {
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

const sortAlphaNum = function (a, b) {
    const reA = /[^a-zA-Z]/g;
    const reN = /[^0-9]/g;

    var AInt = parseInt(a, 10);
    var BInt = parseInt(b, 10);

    if (Number.isNaN(AInt) && Number.isNaN(BInt)) {
        var aA = a.replace(reA, "");
        var bA = b.replace(reA, "");
        if (aA === bA) {
            var aN = parseInt(a.replace(reN, ""), 10);
            var bN = parseInt(b.replace(reN, ""), 10);
            return aN === bN ? 0 : aN > bN ? 1 : -1;
        } else {
            return aA > bA ? 1 : -1;
        }
    } else if (Number.isNaN(AInt)) {//A is not an Int
        return 1;//to make alphanumeric sort first return -1 here
    } else if (Number.isNaN(BInt)) {//B is not an Int
        return -1;//to make alphanumeric sort first return 1 here
    } else {
        return AInt > BInt ? 1 : -1;
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

const requestToWFS = async function (type, signal, doneCallback, data) {
    const featureTypes = type.getFeatureTypes();
    for (var i = 0, ii = featureTypes.length; i < ii; i++) {
        await type.describeFeatureType(featureTypes[i]);
    }

    return await fetch(type.url, {
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
                console.log(`Search: petición abortada [${type.typeName}] ${data}`);
                return [];
            } else {
                TC.error(err);
                throw err;
            }

            //console.log('getStringPattern promise resuelta - data.statusText: ' + data.statusText);
        });
};

const toCamelCase = function (str) {
    let value = str.toLowerCase();
    const match = value.match(/[^A-ZÁÉÍÓÚÜÀÈÌÒÙáéíóúüàèìòùa-z0-9_]+(.)/g);
    if (match) {
        for (var i = 0; i < match.length; i++) {
            if (/[-;:.<>\{\}\[\]\/\s()]/g.test(match[i])) {
                value = value.replace(match[i], match[i].toUpperCase());
            }
        }
    }

    return value.charAt(0).toUpperCase() + value.substring(1);
};

Search.prototype.CLASS = 'tc-ctl-search';
TC.control.Search = Search;
export default Search;
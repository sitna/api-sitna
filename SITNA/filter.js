import { and, bbox, between, contains, disjoint, during, dwithin, equalTo, greaterThan, greaterThanOrEqualTo, intersects, isNull, lessThan, lessThanOrEqualTo, like, not, notEqualTo, or, within } from '../node_modules/ol/format/filter.js';
import ol_filter from '../node_modules/ol/format/filter/Filter.js';
import WFS from '../node_modules/ol/format/WFS.js';
import Layer from './layer/Layer.js';

//const filter = { and, bbox, between, contains, disjoint, during, dwithin, equalTo, greaterThan, greaterThanOrEqualTo, intersects, isNull, lessThan, lessThanOrEqualTo, like, not, notEqualTo, or, within }

/**
* Espacio de nombres de funciones para la contrucción de filtros en capas [Raster]{@link SITNA.layer.Raster} y [Vector]{@link SITNA.layer.Vector}.
* @namespace SITNA.filter
*/

ol_filter.prototype.getFilterText = function (dataOrLayer) {
    const self = this;
    if (dataOrLayer instanceof Layer) {
        return (new WFS().writeGetFeature({
            srsName: dataOrLayer.map.getCrs(),
            featureTypes: dataOrLayer.availableNames,
            filter: self
        })).querySelector("Filter").outerHTML;
    }
    else {
        return (new WFS({ version: dataOrLayer.version || null }).writeGetFeature(Object.assign({}, dataOrLayer, { filter: self }))).querySelector("Filter").outerHTML;
    }
};
ol_filter.prototype.getGeatureText = function (dataOrLayer) {
    const self = this;
    if (dataOrLayer instanceof Layer) {
        return (new WFS().writeGetFeature({
            srsName: dataOrLayer.map.getCrs(),
            featureTypes: dataOrLayer.availableNames,
            filter: self
        })).outerHTML;
    }
    else {
        return (new WFS({ version: dataOrLayer.version || null }).writeGetFeature(Object.assign({}, dataOrLayer, { filter: self }))).outerHTML;
    }
};
/** 
 * @class Filter
 * @classdesc Clase abstracta. No se debe instanciar. Se deben usar las funciones factoria del espacio de nombres [SITNA.filter]{@linkplain SITNA.filter}.
 * @memberof SITNA.filter
 * @abstract 
 */
const Filter = ol_filter;


/** @function
 * @description Crea un operador <And> entre 2 o más condiciones de filtrado.
 * @name and 
 * @memberof SITNA.filter
 * @param {...SITNA.filter.Filter} condiciones Lista de condiciones de filtrado.
 * @returns {SITNA.filter.Filter} Filtro `<And>`
* @example <caption>Ejemplo de contatenación de filtros mediante el operador lógico `<And>` [Ver en vivo](../examples/filter.and.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *    // Establecemos un layout simplificado apto para hacer demostraciones de controles.
 *    SITNA.Cfg.layout = "layout/ctl-container";
 *    // Añadimos el control de tabla de contenidos en la primera posición.
 *    SITNA.Cfg.controls.TOC = {
 *        div: "slot1"
 *    };
 *    var map = new SITNA.Map("mapa", {
 *        // Mapa centrado de Pamplona
 *        initialExtent: [606239, 4738249, 614387, 4744409],
 *        workLayers: [ 
 *            {
 *                id: "layer",
 *                title: "Tuberias de abastecimento",
 *                type: SITNA.Consts.layerType.WMS,
 *                url: "//idena.navarra.es/ogc/wms",
 *                layerNames: "REDABA_Lin_Tuberia",
 *                filter: SITNA.filter.and(SITNA.filter.between("DIAMETRO",150,200),SITNA.filter.like("FABRICANTE","*tubo*")) 
 *             }
 *        ]
 *    });
 * </script>
 */
function And(...conditions) {
    return and.apply(this, conditions);
}

/**
 * @function 
 * @name or 
 * @description Crea un operador <Or> entre 2 o más condiciones de filtrado.
 * @memberof SITNA.filter
 * @param {...SITNA.filter.Filter} condiciones Lista de condiciones de filtrado.
 * @returns {SITNA.filter.Filter} Filtro `<Or>`
 * @example <caption>Ejemplo de contatenación de filtros mediante el operador lógico `<Or>` [Ver en vivo](../examples/filter.or.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *    // Establecemos un layout simplificado apto para hacer demostraciones de controles.
 *    SITNA.Cfg.layout = "layout/ctl-container";
 *    // Añadimos el control de tabla de contenidos en la primera posición.
 *    SITNA.Cfg.controls.TOC = {
 *        div: "slot1"
 *    };
 *    var map = new SITNA.Map("mapa", {
 *        // Mapa centrado de Pamplona
 *        initialExtent: [606239, 4738249, 614387, 4744409],
 *        workLayers: [ 
 *            {
 *                id: "layer1",
 *                title: "Edificios religiosos",
 *                type: SITNA.Consts.layerType.WFS,
 *                url: "//idena.navarra.es/ogc/wfs",
 *                featureType: "DOTACI_Sym_EdifReligi",
 *                outputFormat: SITNA.Consts.format.JSON,
 *                filter: SITNA.filter.or(
 *                  SITNA.filter.bbox("the_geom", [610327, 4741864, 611287, 4741088]),
 *                  SITNA.filter.equalTo("MUNICIPIO", "Barañáin / Barañain")
 *                )
 *             }
 *        ]
 *    });
 * </script>
 */

function Or(...conditions) {
    return or.apply(this, conditions);
}

/**
 * @function
 * @description Representa un operador lógico <Not> para una condición de filtro.
 * @name not 
 * @memberof SITNA.filter
 * @param {SITNA.filter.Filter} condicion Condición a negar.
 * @returns {SITNA.filter.Filter} Filtro `<Not>` 
 */
function Not(condition) {
    return not(condition);
}

/** @function
 * @description Crea un operador <BBOX> para probar si una propiedad con valor geométrico interseca un cuadro delimitador fijo.
 * @name bbox 
 * @memberof SITNA.filter
 * @param {string} geometryName Nombre de la propiedad con valor geométrico a filtrar.
 * @param {number[]} extent Extensión por la cual filtrar.
 * @param {string=} srsName Nombre del sistema de referencia de las coordenadas de la extensión.
 * @returns {SITNA.filter.Filter} Filtro `<BBOX>`
 */
function Bbox(geometryName, extent, srsName) {    
    return bbox(geometryName, extent, srsName);
}

/** @function
 * @description Crea un operador de comparación <PropertyIsBetween> para probar si un valor de expresión se encuentra dentro de un rango dado por un límite inferior y superior (inclusive).
 * @name between 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de la propiedad a comparar.
 * @param {number} lowerBoundary Valor inferior.
 * @param {number} upperBoundary Valor superior.
 * @returns {SITNA.filter.Filter} Filtro `<PropertyIsBetween>`
 */
function Between(propertyName, lowerBoundary, upperBoundary) {
    return between(propertyName, lowerBoundary, upperBoundary);
}

/** @function
 * @description Crea un operador <Contains> para probar si una propiedad con valor geométrico contiene una geometría determinada.
 * @name contains 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de geometría a utilizar.
 * @param {SITNA.feature} geometry Geometría usada como filtro.
 * @param {string=} srsName Nombre del sistema de referencia de las coordenadas de la geometría.
 * @returns {SITNA.filter.Filter} Filtro `<Contains>`
 * @example <caption>Ejemplo del uso de los filtros de comparación espacial `<Contains>`, `<Disjoint>`, `<Dwithin>`, `<Insersects>`[Ver en vivo](../examples/filter.Spatial.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *        // Establecemos un layout simplificado apto para hacer demostraciones de controles.
 *        SITNA.Cfg.layout = "layout/ctl-container";
 *        // Añadimos el control de tabla de contenidos en la primera posición.
 *        SITNA.Cfg.controls.TOC = {
 *            div: "slot1"
 *        };
 *        var map = new SITNA.Map("mapa", {
 *            // Mapa centrado de Pamplona
 *            initialExtent: [606239, 4738249, 614387, 4744409],            
 *            workLayers: [
 *                {
 *                    //Capa vectorial con los códigos postales que no contengan una coordenada en particular
 *                    id: "layer1",
 *                    title: "Códigos postales",
 *                    type: SITNA.Consts.layerType.WFS,
 *                    url: "//idena.navarra.es/ogc/wfs",
 *                    featureType: "DIRECC_Pol_CodPostal",
 *                    filter: SITNA.filter.disjoint("the_geom", new SITNA.feature.Point([609934, 4740855]))
 *                },
 *                {
 *                    //Capa raster con los códigos postales que contengan una coordenada en particular
 *                    id: "layer2",
 *                    title: "Códigos postales 2",
 *                    type: SITNA.Consts.layerType.WMS,
 *                    url: "//idena.navarra.es/ogc/wms",
 *                    layerNames: "DIRECC_Pol_CodPostal",
 *                    filter: SITNA.filter.contains("the_geom", new SITNA.feature.Point([609934, 4740855]))
 *                },
 *               {
 *                    //Capa vectorial con los edificios religiosos dentro de un polígono dado y incluyendo un buffer de 100 metros
 *                    id: "layer3",
 *                    title: "Edificios religiosos",
 *                    type: SITNA.Consts.layerType.WFS,
 *                    url: "//idena.navarra.es/ogc/wfs",
 *                    featureType: "DOTACI_Sym_EdifReligi",
 *                    filter: SITNA.filter.dwithin("the_geom", new SITNA.feature.Polygon([
 *                        [610290, 4741582],
 *                        [611092, 4741841],
 *                        [611359, 4741451],
 *                        [610623, 4741152],
 *                        [610290, 4741582]
 *                    ]), 100)
 *                },
 *                {
 *                    //Capa raster con los tramos de carril bici que intersecan una línea dada.
 *                    id: "layer4",
 *                    title: "Red movilidad ciclista",
 *                    type: SITNA.Consts.layerType.WMS,
 *                    url: "//idena.navarra.es/ogc/wms",
 *                    layerNames: "INFRAE_Lin_TrazadoSIGMC",
 *                    filter: SITNA.filter.intersects("the_geom", new SITNA.feature.Polyline([[608947, 4740938], [610807, 4740202]]))
 *                }
 *            ]
 *        });
 *    </script>
 */

function Contains(geometryName, geometry, srsName) {
    const olGeom = geometry.wrap.feature.getGeometry();
    return contains(geometryName, olGeom, srsName);
}

/** @function
 * @description Crea un operador <Disjoint> para probar si una propiedad con valor geométrico es disjunta con una geometría dada.
 * @name disjoint 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de geometría a utilizar.
 * @param {SITNA.feature} geometry Geometría usada como filtro.
 * @param {string=} srsName Nombre del sistema de referencia de las coordenadas de la geometría.
 * @returns {SITNA.filter.Filter} Filtro `<Disjoint>`
 */

function Disjoint(geometryName, geometry, srsName) {
    const olGeom = geometry.wrap.feature.getGeometry();
    return disjoint(geometryName, olGeom, srsName);
}

/////** @function
//// * Crea un operador temporal <During>.
//// * @name During
//// * @memberof SITNA.filter
//// * @param {string} propertyName Nombre de geometría a utilizar.
//// * @param {string} begin La fecha de inicio en formato ISO-8601.
//// * @param {string} end La fecha de fin en formato ISO-8601.
//// * @returns {number} TODO
//// */

////function During(propertyName, begin, end) {
////    return during(propertyName, begin, end);
////}

/** @function
 * @description Crea un operador <Dwithin> para probar si una propiedad con valor geométrico está dentro de una distancia con respecto a una geometría determinada.
 * @name dwithin 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de geometría a utilizar.
 * @param {SITNA.feature} geometry Geometría usada como filtro.
 * @param {number} distance Distancia.
 * @param {string=} srsName Nombre del sistema de referencia de las coordenadas de la geometría.
 * @returns {SITNA.filter.Filter} Filtro `<Dwithin>`
 */

function Dwithin(geometryName, geometry, distance, srsName) {
    const olGeom = geometry.wrap.feature.getGeometry();
    return dwithin(geometryName, olGeom, distance, "m", srsName);
}

/** @function
 * @description Crea un operador de comparación <PropertyIsEqualTo>.
 * @name equalTo 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de la propiedad a comparar.
 * @param {string|number} expression El valor a comparar.
 * @param {boolean=} matchCase Coincidencia de mayúsculas/minúsculas.
 * @returns {SITNA.filter.Filter} Filtro `<PropertyIsEqualTo>`
 */
function EqualTo(propertyName, expression, matchCase) {
    return equalTo(propertyName, expression, matchCase);
}

/** @function
 * @description Crea un operador de comparación <PropertyIsGreaterThan>.
 * @name greaterThan 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de la propiedad a comparar.
 * @param {number} expression El valor a comparar.
 * @returns {SITNA.filter.Filter} Filtro `<PropertyIsGreaterThan>`
 * @example <caption>Ejemplo del uso de los filtros de comparacion binaria `<greaterThan>` y `<LessThan>` [Ver en vivo](../examples/filter.GreaterLess.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *    // Establecemos un layout simplificado apto para hacer demostraciones de controles.
 *    SITNA.Cfg.layout = "layout/ctl-container";
 *    // Añadimos el control de tabla de contenidos en la primera posición.
 *    SITNA.Cfg.controls.TOC = {
 *        div: "slot1"
 *    };
 *    var map = new SITNA.Map("mapa", {
 *           workLayers: [
 *               {
 *                   //Estaciones meteorológicas automáticas cuya altitud sea mayor de 1000 metros
 *                   id: "layer1",
 *                   title: "Estaciones Meteorológicas Automáticas",
 *                   type: SITNA.Consts.layerType.WMS,
 *                   url: "//idena.navarra.es/ogc/wms",
 *                   layerNames: "METEOR_Sym_EstMetAuto",
 *                   filter: SITNA.filter.greaterThan("ALTITUD", 1000)
 *               },
 *               {
 *                   //Estaciones meteorológicas manuales cuya altitud sea sea menor de 700 metros
 *                   id: "layer2",
 *                   title: "Estaciones Meteorológicas Manuales",
 *                   type: SITNA.Consts.layerType.WMS,
 *                   url: "//idena.navarra.es/ogc/wms",
 *                   layerNames: "METEOR_Sym_EstMetManu",
 *                   filter: SITNA.filter.lessThan("ALTITUD", 700)
 *               }
 *           ]
 *       });
 * </script>
 */
function GreaterThan(propertyName, expression) {
    return greaterThan(propertyName, expression);
}

/** @function
 * @description Crea un operador de comparación <PropertyIsGreaterThanOrEqualTo>.
 * @name greaterThanOrEqualTo 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de la propiedad a comparar.
 * @param {number} expression El valor a comparar.
 * @returns {SITNA.filter.Filter} Filtro `<PropertyIsGreaterThanOrEqualTo>`
 */
function GreaterThanOrEqualTo(propertyName, expression) {
    return greaterThanOrEqualTo(propertyName, expression);
}

/** @function
 * @description Crea un operador <Intersects> para probar si una propiedad con valor geométrico intersecta una geometría determinada.
 * @name intersects 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de geometría a utilizar.
 * @param {SITNA.feature} geometry Geometría usada como filtro.
 * @param {string=} srsName Nombre del sistema de referencia de las coordenadas de la geometría.
 * @returns {SITNA.filter.Filter} Filtro `<Intersects>`
 */

function Intersects(geometryName, geometry, srsName) {
    const olGeom = geometry.wrap.feature.getGeometry();
    return intersects(geometryName, olGeom, srsName);
}

/** @function
 * @description Crea un operador de comparación <PropertyIsNull> para probar si un valor de propiedad es nulo.
 * @name isNull 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de la propiedad a comparar.
 * @returns {SITNA.filter.Filter} Filtro `<PropertyIsNull>`
 * @example <caption>Ejemplo de uso de los filtros `<IsNull>` y `<Not>` [Ver en vivo](../examples/filter.IsNullNot.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *       // Establecemos un layout simplificado apto para hacer demostraciones de controles.
 *       SITNA.Cfg.layout = "layout/ctl-container";
 *       // Añadimos el control de tabla de contenidos en la primera posición.
 *       SITNA.Cfg.controls.TOC = {
 *           div: "slot1"
 *       };
 *       var map = new SITNA.Map("mapa", {
 *           // Mapa centrado de Pamplona
 *           initialExtent: [606239, 4738249, 614387, 4744409],
 *           workLayers: [
 *               {
 *                   id: "layer1",
 *                   title: "Entidades de voluntariado",
 *                   type: SITNA.Consts.layerType.WMS,
 *                   url: "//idena.navarra.es/ogc/wms",
 *                   layerNames: "SOCIAL_Sym_EntVoluntariado",
 *                   filter: SITNA.filter.not(SITNA.filter.isNull("URLPDF"))
 *               }
 *           ]
 *       });
 *   </script>
 */
function IsNull(propertyName) {
    return isNull(propertyName);
}

/** @function
 * @description Crea un operador de comparación <PropertyIsLessThan>.
 * @name lessThan 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de la propiedad a comparar.
 * @param {number} expression El valor a comparar.
 * @returns {SITNA.filter.Filter} Filtro `<PropertyIsLessThan>`
 */
function LessThan(propertyName, expression) {
    return lessThan(propertyName, expression);
}

/** @function
 * @description Crea un operador de comparación <PropertyIsLessThanOrEqualTo>.
 * @name lessThanOrEqualTo 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de la propiedad a comparar.
 * @param {number} expression El valor a comparar.
 * @returns {SITNA.filter.Filter} Filtro `<PropertyIsLessThanOrEqualTo>`
 */
function LessThanOrEqualTo(propertyName, expression) {
    return lessThanOrEqualTo(propertyName, expression);
}

/** @function
 * @description Representa un operador de comparación <PropertyIsLike> que hace coincidir un valor de propiedad de cadena con un patrón de texto.
 * @name like 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de la propiedad a comparar.
 * @param {string} pattern Patrón de texto.
 * @param {string=} wildCard Carácter de patrón que coincide con cualquier secuencia de cero o más caracteres de cadena. El valor predeterminado es '*'.
 * @param {string=} singleChar Carácter de patrón que coincide con cualquier carácter de cadena simple. El valor predeterminado es '.'.
 * @param {string=} escapeChar Carácter de escape que se puede utilizar para escapar los caracteres del patrón. El valor predeterminado es '!'.
 * @param {boolean=} matchCase Coincidencia de mayúsculas/minúsculas.
 * @returns {SITNA.filter.Filter} Filtro `<PropertyIsLike>`
 */
function Like(propertyName, pattern ,wildCard ,singleChar ,escapeChar , matchCase) {
    return like(propertyName, pattern, wildCard, singleChar, escapeChar, matchCase);
}

/** @function
 * @description Crea un operador de comparación <PropertyIsNotEqualTo>.
 * @name notEqualTo 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de la propiedad a comparar.
 * @param {string|number} expression El valor a comparar.
 * @param {boolean=} matchCase Coincidencia de mayúsculas/minúsculas.
 * @returns {SITNA.filter.Filter} Filtro `<PropertyIsNotEqualTo>`
 */
function NotEqualTo(propertyName, expression, matchCase) {
    return notEqualTo(propertyName, expression, matchCase);
}

/** @function
 * @description Crea un operador <Within> para probar si una propiedad con valor geométrico está dentro de una geometría determinada.
 * @name within 
 * @memberof SITNA.filter
 * @param {string} propertyName Nombre de geometría a utilizar.
 * @param {SITNA.feature} geometry Geometría usada como filtro.
 * @param {string=} srsName Nombre del sistema de referencia de las coordenadas de la geometría.
 * @returns {SITNA.filter.Filter} Filtro `<Within>`
 */

function Within(geometryName, geometry, srsName) {
    const olGeom = geometry.wrap.feature.getGeometry();
    return within(geometryName, olGeom, srsName);
}

const filter = {
    and: And,
    or: Or,
    not: Not,
    bbox: Bbox,
    between: Between,
    contains: Contains,
    disjoint: Disjoint,
    dwithin : Dwithin,
    equalTo: EqualTo,
    greaterThan: GreaterThan,
    greaterThanOrEqualTo: GreaterThanOrEqualTo,
    intersects: Intersects,
    isNull: IsNull,
    lessThan: LessThan,
    lessThanOrEqualTo: LessThanOrEqualTo,
    like: Like,
    notEqualTo: NotEqualTo,
    within: Within
};

export default filter;
export { Filter as GMLFilter };


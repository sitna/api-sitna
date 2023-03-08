import TC from '../../TC';
import TcMarker from '../../TC/feature/Marker';
const SITNA = {};
SITNA.feature = SITNA.feature || {};
TC.feature = TC.feature || {};
TC.feature.Marker = TcMarker;

/**
 * Entidad geográfica que representa un marcador (punto con un icono asociado) del mapa.
 * @class Marker
 * @memberof SITNA.feature
 * @param {number[]} coordinates - Coordenadas del punto expresadas en las unidades del CRS del mapa.
 * @param {MarkerOptions} [options] Objeto de opciones de marcador.
 * @see SITNA.Map#addMarker
 */

/**
 * Espacio de nombres de las entidades geográficas del mapa.
 * @namespace SITNA.feature
 */

SITNA.feature.Marker = function (coords, options) {
    const self = this;

    TC.feature.Marker.apply(self, coords, options);
};

TC.inherit(SITNA.feature.Marker, TC.feature.Marker);

/**
 * Obtiene el identificador del marcador dentro de su capa.
 * @method getId
 * @ignore
 * @memberof SITNA.feature.Marker
 * @instance
 * @returns {string} Identificador del marcador.     
 */

/**
 * Obtiene las coordenadas del marcador en el CRS actual del mapa.
 * @method getCoordinates
 * @memberof SITNA.feature.Marker
 * @instance
 * @returns {number[]} Coordenadas en el CRS actual del mapa del punto en que está situado el marcador.     
 */

const Marker = SITNA.feature.Marker;
export default Marker;
import Feature from './Feature';
import Consts from '../../TC/Consts';

/**
 * Entidad geográfica que representa un conjunto de puntos.
 * @class MultiPoint
 * @memberof SITNA.feature
 * @extends SITNA.feature.Feature
 * @param {Array.<number[]>} coordinates - Array de las coordenadas de cada punto expresadas en el CRS del mapa.
 * @param {SITNA.feature.PointOptions} [options] Objeto de opciones de la entidad geográfica.
 * @see SITNA.feature.Point
 * @see SITNA.layer.Vector#addMultiPoint
 * @see SITNA.layer.Vector#addMultiPoints
 * @see SITNA.layer.Vector#addFeature
 * @see SITNA.layer.Vector#addFeatures
 * @see [Ejemplo de uso de métodos de entidad geográfica](../examples/feature.methods.html)
 * @example <caption>[Ver en vivo](../examples/feature.MultiPoint.html)</caption> {@lang html}
<div id="mapa"></div>
<script>
    SITNA.Cfg.workLayers = [
        {
            id: "entidades",
            title: "Demostración de puntos",
            type: SITNA.Consts.layerType.VECTOR
        }
    ];
    var map = new SITNA.Map("mapa");
    map.loaded(() => {
        // Obtenemos la instancia de la capa vectorial
        const vectorLayer = map.getLayer("entidades");

        // Añadimos una instancia de la clase SITNA.feature.MultiPoint
        const trees = new SITNA.feature.MultiPoint([
            // Colección de tres puntos
            [603451, 4665948],
            [603443, 4665939],
            [603503, 4665902]
        ], {
            strokeColor: '#285228', // verde
            strokeWidth: 4,
            fillColor: '#ffffff', // blanco
            fillOpacity: 0.7,
            radius: 10,
            data: {
                'Denominación': 'Encinas de Corella'
            }
        });
        vectorLayer.addMultiPoint(trees).then(holmOaks => map.zoomToFeatures([holmOaks]));
    });
</script>
 */

/**
 * Asigna estilos a los puntos.
 * @method setStyle
 * @memberof SITNA.feature.MultiPoint
 * @instance
 * @param {SITNA.feature.PointStyleOptions} style - Objeto de opciones de estilo de punto.
 * @returns {SITNA.feature.MultiPoint} La propia entidad geográfica.
 */

class MultiPoint extends Feature {
    STYLETYPE = Consts.geom.POINT;

    constructor(coords, options) {
        super(coords, options);

        if (!this.wrap.isNative(coords)) {
            this.wrap.feature = coords;
            this.wrap.createMultiPoint(coords, options);
        }
    }

    /**
     * Obtiene las coordenadas de los puntos en el CRS actual del mapa.
     * @method getCoordinates
     * @memberof SITNA.feature.MultiPoint
     * @instance
     * @returns {Array.<number[]>} Coordenadas de los puntos en el CRS actual del mapa.
     */
    getCoordinates(options) {
        return super.getCoordinates.call(this, options);
    }

    /**
     * Establece las coordenadas de los puntos en el CRS actual del mapa.
     * @method setCoordinates
     * @memberof SITNA.feature.MultiPoint
     * @instance
     * @param {Array.<number[]>} coordinates - Coordenadas de los puntos en el CRS actual del mapa.
     * @returns {SITNA.feature.MultiPoint} La propia entidad geográfica.
     */
    setCoordinates(coords) {
        if (coords) {
            if (Array.isArray(coords)) {
                if (!Array.isArray(coords[0])) {
                    coords = [coords];
                }
            }
            else {
                throw new TypeError('Coordinates not valid for multipoint');
            }
        }
        return super.setCoordinates.call(this, coords);
    }

    getCoords(options) {
        return this.getCoordinates(options);
    }

    setCoords(coords) {
        return this.setCoordinates(coords);
    }

    getCoordsArray() {
        return this.getCoordinates();
    }

    getGeometryType() {
        return Consts.geom.MULTIPOINT;
    }
}

export default MultiPoint;
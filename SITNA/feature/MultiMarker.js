import MultiPoint from './MultiPoint';

/**
 * Entidad geográfica que representa un conjunto de marcadores (puntos con icono asociado).
 * @class MultiMarker
 * @memberof SITNA.feature
 * @extends SITNA.feature.Feature
 * @param {Array.<number[]>} coordinates - Array de las coordenadas de cada punto expresadas en el CRS del mapa.
 * @param {SITNA.feature.MarkerOptions} [options] Objeto de opciones de la entidad geográfica.
 * @see SITNA.feature.Marker
 * @see SITNA.layer.Vector#addMultiMarker
 * @see SITNA.layer.Vector#addMultiMarkers
 * @see SITNA.layer.Vector#addFeature
 * @see SITNA.layer.Vector#addFeatures
 * @see [Ejemplo de uso de métodos de entidad geográfica](../examples/feature.methods.html)
 * @example <caption>[Ver en vivo](../examples/feature.MultiMarker.html)</caption> {@lang html}
<div id="mapa"></div>
<script>
    SITNA.Cfg.workLayers = [
        {
            id: "entidades",
            title: "Demostración de marcadores",
            type: SITNA.Consts.layerType.VECTOR
        }
    ];
    var map = new SITNA.Map("mapa");
    map.loaded(() => {
        // Obtenemos la instancia de la capa vectorial
        const vectorLayer = map.getLayer("entidades");

        // Añadimos una instancia de la clase SITNA.feature.MultiMarker
        const schools1 = new SITNA.feature.MultiMarker([[611059.0, 4741572.7], [610537.3, 4741428.7]], {
            anchor: [0, 1], // Punto de anclaje en la esquina inferior izquierda
            url: 'data/speech-icon.png',
            width: 32,
            height: 32, // 32x32 pixels
            data: {
                'Población': 'Pamplona'
            }
        });
        vectorLayer.addMultiMarker(schools1);

        // Añadimos una entidad geográfica introduciendo directamente las coordenadas de su geometría
        vectorLayer.addMultiMarker([[615502.2, 4657758.4]], {
            anchor: [0, 1], // Punto de anclaje en la esquina inferior izquierda
            url: 'data/speech-icon.png',
            width: 32,
            height: 32, // 32x32 pixels
            data: {
                'Población': 'Tudela'
            }
        });
    });
</script>
 */

/**
 * Obtiene el estilo de la entidad.
 * @method getStyle
 * @memberof SITNA.feature.MultiMarker
 * @instance
 * @returns {SITNA.feature.MarkerStyleOptions}
 */

/**
 * Asigna estilos a los marcadores.
 * @method setStyle
 * @memberof SITNA.feature.MultiMarker
 * @instance
 * @param {SITNA.feature.MarkerStyleOptions} style - Objeto de opciones de estilo de marcador.
 * @returns {SITNA.feature.MultiMarker} La propia entidad geográfica.
 */

class MultiMarker extends MultiPoint {
    STYLETYPE = 'marker';

    constructor(coords, options) {
        super(coords, options);
        const self = this;

        if (!self.wrap.isNative(coords)) {
            self.wrap.feature = coords;
            self.wrap.createMultiMarker(coords, options);
        }
    }

    getCoordinates(options) {
        return super.getCoordinates.call(this, options);
    }

    /**
     * Establece las coordenadas de los puntos en el CRS actual del mapa.
     * @method setCoordinates
     * @memberof SITNA.feature.MultiMarker
     * @instance
     * @param {Array.<number[]>} coordinates - Coordenadas de los puntos en el CRS actual del mapa.
     * @returns {SITNA.feature.MultiMarker} La propia entidad geográfica.
     */
    setCoordinates(coords) {
        const self = this;
        if (coords) {
            if (Array.isArray(coords)) {
                if (!Array.isArray(coords[0])) {
                    coords = [coords];
                }
            }
            else {
                throw new TypeError('Coordinates not valid for multimarker');
            }
        }
        return super.setCoordinates.call(self, coords);
    }

    getCoords(options) {
        return this.getCoordinates(options);
    }

    setCoords(coords) {
        return this.setCoordinates(coords);
    }
}

export default MultiMarker;
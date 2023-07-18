import Feature from './Feature';
import Polyline from './Polyline';

/**
 * Entidad geográfica que representa un conjunto de líneas de varios segmentos en el mapa.
 * @class MultiPolyline
 * @memberof SITNA.feature
 * @extends SITNA.feature.Feature
 * @param {Array.<Array.<number[]>>} coordinates - Coordenadas de las líneas expresadas como un array de 
 * coordenadas de objetos {@link SITNA.feature.Polyline}.
 * @param {SITNA.feature.PolylineOptions} [options] Objeto de opciones de la entidad geográfica.
 * @see SITNA.feature.Polyline
 * @see SITNA.layer.Vector#addMultiPolyline
 * @see SITNA.layer.Vector#addMultiPolylines
 * @see SITNA.layer.Vector#addFeature
 * @see SITNA.layer.Vector#addFeatures
 * @see [Ejemplo de uso de métodos de entidad geográfica](../examples/feature.methods.html)
 * @example <caption>[Ver en vivo](../examples/feature.MultiPolyline.html)</caption> {@lang html}
<div id="mapa"></div>
<script>
    SITNA.Cfg.workLayers = [
        {
            id: "entidades",
            title: "Demostración de líneas",
            type: SITNA.Consts.layerType.VECTOR
        }
    ];
    var map = new SITNA.Map("mapa");
    map.loaded(() => {
        // Obtenemos la instancia de la capa vectorial
        const vectorLayer = map.getLayer("entidades");

        // Añadimos una instancia de la clase SITNA.feature.MultiPolyline
        const mainTracks = new SITNA.feature.MultiPolyline([
            // Primera línea
            [
                [609602, 4742351],
                [609027, 4742090]
            ],
            // Segunda línea
            [
                [609599, 4742355],
                [609025, 4742094]
            ]
        ], {
            strokeColor: '#522852', // violeta
            strokeWidth: 6,
            data: {
                'Vías': 'Principales'
            }
        });
        vectorLayer.addMultiPolyline(mainTracks).then(mt => {
            map.zoomToFeatures([mt]);
        });

        // Añadimos varias entidades geográficas introduciendo directamente las coordenadas de sus geometrías
        vectorLayer.addMultiPolylines([
            // Primera línea compuesta
            [
                // Primera línea simple
                [
                    [609037, 4742095],
                    [609148, 4742131],
                    [609170, 4742134],
                    [609238, 4742142]
                ],
                // Segunda línea simple
                [
                    [609238, 4742142],
                    [609261, 4742147],
                    [609292, 4742158],
                    [609361, 4742190]
                ],
                // Tercera línea simple
                [
                    [609238, 4742142],
                    [609275, 4742155],
                    [609317, 4742173],
                    [609360, 4742193]
                ]
            ],
            // Segunda línea compuesta (con un solo elemento)
            [
                // Única línea simple
                [
                    [609330, 4742270],
                    [609278, 4742257],
                    [609230, 4742235],
                    [609176, 4742207]
                ]
            ]
        ], {
            strokeColor: '#285228', // verde
            strokeWidth: 4
        })
            .then(trackArray => {
                // Añadimos atributos a las nuevas entidades.
                // Estos datos se pueden consultar al pulsar sobre ellas.
                trackArray.forEach(track => {
                    track.setData({
                        'Vías': 'Muertas',
                        'Longitud total': Math.round(track.getLength()) + ' m'
                    });
                })
            });
    });
</script>
 */

/**
 * Obtiene el estilo de la entidad.
 * @method getStyle
 * @memberof SITNA.feature.MultiPolyline
 * @instance
 * @returns {SITNA.feature.PolylineStyleOptions}
 */

/**
 * Asigna estilos a las líneas.
 * @method setStyle
 * @memberof SITNA.feature.MultiPolyline
 * @instance
 * @param {SITNA.feature.PolylineStyleOptions} style - Objeto de opciones de estilo de línea.
 * @returns {SITNA.feature.MultiPolyline} La propia entidad geográfica.
 */

class MultiPolyline extends Feature {
    STYLETYPE = "line";

    constructor(coords, options) {
        super(coords, options);
        const self = this;

        if (!self.wrap.isNative(coords)) {
            self.wrap.createMultiPolyline(coords, options);
        }
    }

    /**
     * Obtiene las coordenadas de los vértices de las líneas en el CRS actual del mapa.
     * @method getCoordinates
     * @memberof SITNA.feature.MultiPolyline
     * @instance
     * @returns {Array.<Array.<number[]>>} Coordenadas de los vértices de las líneas en el CRS actual del mapa.
     */
    getCoordinates(options) {
        if (options?.pointArray) {
            return this.getCoordsArray();
        }
        return super.getCoordinates.call(this, options);
    }

    /**
     * Establece las coordenadas de los vértices de las líneas en el CRS actual del mapa.
     * @method setCoordinates
     * @memberof SITNA.feature.MultiPolyline
     * @instance
     * @param {Array.<Array.<number[]>>} coordinates - Coordenadas de los vértices de las líneas en el CRS actual del mapa.
     * @returns {SITNA.feature.MultiPolyline} La propia entidad geográfica.
     */
    setCoordinates(coords) {
        const self = this;
        if (Array.isArray(coords) && Array.isArray(coords[0]) && !Array.isArray(coords[0][0])) {
            coords = [coords];
        }
        return super.setCoordinates.call(self, coords);
    }

    getCoords(options) {
        return this.getCoordinates(options);
    }

    setCoords(coords) {
        return this.setCoordinates(coords);
    }

    getCoordsArray() {
        return this.getCoordinates().flat();
    }

    appendPolyline(polyline) {
        const self = this;
        if (polyline instanceof Polyline) {
            const coords = self.getCoordinates();
            coords.push(polyline.getCoordinates());
            self.setCoordinates(coords);
        }
        return self;
    }

    /**
     * Obtiene la longitud total de todas las líneas, en metros.
     * @method getLength
     * @memberof SITNA.feature.MultiPolyline
     * @instance
     * @param {SITNA.feature.MeasurementOptions} [options] - Parámetros referentes al CRS que hay que considerar para la medida.
     * @returns {number} Suma de las longitudes de todas las líneas, en metros.
     */
    getLength = function (options) {
        const self = this;
        return self.wrap.getLength({ coordinates: self.getCoordinates(options) });
    }
}

export default MultiPolyline;
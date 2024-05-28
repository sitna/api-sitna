import Feature from './Feature';
import Consts from '../../TC/Consts';

/**
 * Entidad geográfica compuesta de varios elementos con geometría poligonal.
 * @class MultiPolygon
 * @memberof SITNA.feature
 * @extends SITNA.feature.Feature
 * @param {Array.<Array.<Array.<number[]>>>} coordinates - Coordenadas de la geometría expresadas como un array de
 * coordenadas de objetos {@link SITNA.feature.Polygon}.
 * @param {SITNA.feature.PolygonOptions} [options] Objeto de opciones de la entidad geográfica.
 * @see SITNA.feature.Polygon
 * @see SITNA.layer.Vector#addMultiPolygon
 * @see SITNA.layer.Vector#addMultiPolygons
 * @see SITNA.layer.Vector#addFeature
 * @see SITNA.layer.Vector#addFeatures
 * @see [Ejemplo de uso de métodos de entidad geográfica](../examples/feature.methods.html)
 * @example <caption>[Ver en vivo](../examples/feature.MultiPolygon.html)</caption> {@lang html}
<div id="mapa"></div>
<script>
    SITNA.Cfg.workLayers = [
        {
            id: "entidades",
            title: "Demostración de polígonos",
            type: SITNA.Consts.layerType.VECTOR
        }
    ];
    var map = new SITNA.Map("mapa");
    map.loaded(() => {
        // Obtenemos la instancia de la capa vectorial
        const vectorLayer = map.getLayer("entidades");

        // Añadimos una instancia de la clase SITNA.feature.MultiPolygon
        const feature1 = new SITNA.feature.MultiPolygon([
            //Primer polígono
            [
                // Contorno del polígono
                [
                    [615041.1, 4657829.3],
                    [615028.4, 4657821.6],
                    [615009.1, 4657809.9],
                    [615003.5, 4657806.5],
                    [614990.1, 4657798.3],
                    [614955.8, 4657854.6],
                    [614953.4, 4657858.4],
                    [614948.9, 4657865.5],
                    [614949.3, 4657865.7],
                    [614951.4, 4657867.0],
                    [614977.0, 4657882.8],
                    [614980.3, 4657884.9],
                    [614986.0, 4657888.4],
                    [614988.5, 4657889.9],
                    [614986.0, 4657893.9],
                    [614989.1, 4657895.8],
                    [614997.0, 4657900.7],
                    [614997.6, 4657901.0],
                    [615041.2, 4657829.3]
                ],
                // Agujero 1
                [
                    [614994.8, 4657877.9],
                    [614967.4, 4657860.9],
                    [614979.3, 4657841.7],
                    [615006.8, 4657858.5],
                    [614994.8, 4657877.9]
                ],
                // Agujero 2
                [
                    [615013.5, 4657847.5],
                    [614985.8, 4657830.8],
                    [614998.1, 4657810.8],
                    [615025.6, 4657827.3],
                    [615013.5, 4657847.5]
                ]
            ],
            // Segundo polígono
            [
                // Contorno del polígono
                [
                    [615060.1, 4657862.8],
                    [615071.1, 4657855.0],
                    [615075.3, 4657851.8],
                    [615075.7, 4657851.3],
                    [615069.7, 4657843.2],
                    [615058.6, 4657851.3],
                    [615058.9, 4657853.4],
                    [615059.1, 4657855.2],
                    [615060.1, 4657862.8]
                ]
            ]
        ], {
            strokeColor: '#522852', // violeta
            strokeWidth: 4,
            fillColor: '#ffffff', // blanco
            fillOpacity: 0.7,
            data: {
                'Número de polígonos': 2
            }
        });
        vectorLayer.addMultiPolygon(feature1);

        // Añadimos una entidad geográfica introduciendo directamente las coordenadas de su geometría
        vectorLayer.addMultiPolygon([
            // Primer polígono
            [
                // Contorno del polígono
                [
                    [614929.9, 4657780.2],
                    [614926.3, 4657793.7],
                    [614962.6, 4657803.0],
                    [614966.2, 4657789.6],
                    [614929.9, 4657780.2]
                ]
            ],
            // Segundo polígono
            [
                // Contorno del polígono
                [
                    [614972.9, 4657788.7],
                    [614981.2, 4657793.6],
                    [614995.0, 4657769.7],
                    [614986.3, 4657764.8],
                    [614979.8, 4657776.4],
                    [614973.0, 4657788.6],
                    [614972.9, 4657788.7]
                ]
            ]
        ], {
            strokeColor: '#b97f24', // dorado
            strokeWidth: 4,
            fillColor: '#000000', // negro
            fillOpacity: 0.3,
        })
            .then(feature2 => {
                // Añadimos atributos a la nueva entidad.
                // Estos datos se pueden consultar al pulsar sobre ella.
                feature2.setData({
                    'Número de polígonos': 2
                });
                // Nos centramos en las entidades geográficas que hemos añadido
                map.zoomToFeatures([
                    feature1,
                    feature2
                ]);
            });
    });
</script>
 */

/**
 * Obtiene el estilo de la entidad.
 * @method getStyle
 * @memberof SITNA.feature.MultiPolygon
 * @instance
 * @returns {SITNA.feature.PolygonStyleOptions}
 */

/**
 * Asigna estilos a los polígonos.
 * @method setStyle
 * @memberof SITNA.feature.MultiPolygon
 * @instance
 * @param {SITNA.feature.PolygonStyleOptions} style - Objeto de opciones de estilo de polígono.
 * @returns {SITNA.feature.MultiPolygon} La propia entidad geográfica.
 */

class MultiPolygon extends Feature {
    STYLETYPE = Consts.geom.POLYGON;

    constructor(coords, options) {
        super(coords, options);

        if (!this.wrap.isNative(coords)) {
            this.wrap.createMultiPolygon(coords, options);
        }
    }

    /**
     * Obtiene las coordenadas de los vértices de los polígonos en el CRS actual del mapa.
     * @method getCoordinates
     * @memberof SITNA.feature.MultiPolygon
     * @instance
     * @returns {Array.<Array.<Array.<number[]>>>} Coordenadas de los vértices de los polígonos en el CRS actual del mapa.
     */
    getCoordinates(options) {
        const coords = super.getCoordinates.call(this, options);
        if (options?.pointArray) {
            return [].concat.apply([], [].concat.apply([], coords));
        }
        return coords;
    }

    /**
     * Establece las coordenadas de los vértices de los polígonos en el CRS actual del mapa.
     * @method setCoordinates
     * @memberof SITNA.feature.MultiPolygon
     * @instance
     * @param {Array.<Array.<Array.<number[]>>>} coordinates - Coordenadas de los vértices de los polígonos en el CRS actual del mapa.
     * @returns {SITNA.feature.MultiPolygon} La propia entidad geográfica.
     */
    setCoordinates(coords) {
        if (coords) {
            if (Array.isArray(coords) && Array.isArray(coords[0])) {
                if (!Array.isArray(coords[0][0])) {
                    coords = [[coords]];
                }
                else if (!Array.isArray(coords[0][0][0])) {
                    coords = [coords];
                }
            }
            else {
                throw new TypeError('Coordinates not valid for multipolygon');
            }
            coords.forEach(function (polygon) {
                polygon.forEach(function (ring) {
                    const startPoint = ring[0];
                    const endPoint = ring[ring.length - 1];
                    if (startPoint[0] !== endPoint[0] || startPoint[1] !== endPoint[1]) {
                        ring[ring.length] = startPoint;
                    }
                });
            });
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
        return this.getCoordinates().flat(2);
    }

    /**
     * Obtiene la longitud total en metros de todos los bordes (perímetro y agujeros) de los polígonos.
     * @method getLength
     * @memberof SITNA.feature.MultiPolygon
     * @instance
     * @param {SITNA.feature.MeasurementOptions} [options] - Parámetros referentes al CRS que hay que considerar para la medida.
     * @returns {number} Suma de las longitudes de todos los polígonos, en metros.
     */
    getLength(options) {
        return this.wrap.getLength({ coordinates: this.getCoordinates(options) });
    }


    /**
     * Obtiene la suma del área de los polígonos en metros cuadrados.
     * @method getArea
     * @memberof SITNA.feature.MultiPolygon
     * @instance
     * @param {SITNA.feature.MeasurementOptions} [options] - Parámetros referentes al CRS que hay que considerar para la medida.
     * @returns {number} Total de áreas de los polígonos en metros cuadrados.
     */
    getArea(options) {
        return this.wrap.getArea({ coordinates: this.getCoordinates(options) });
    }

    getGeometryType() {
        return Consts.geom.MULTIPOLYGON;
    }
}

export default MultiPolygon;
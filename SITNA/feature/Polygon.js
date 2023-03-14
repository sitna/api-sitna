import Consts from '../../TC/Consts';
import Feature from './Feature';

/**
 * Entidad geográfica con geometría poligonal.
 * @class Polygon
 * @memberof SITNA.feature
 * @extends SITNA.feature.Feature
 * @param {Array.<Array.<number[]>>} coordinates - Coordenadas del polígono en las unidades del CRS del mapa. 
 * Estas son un array de anillos, siendo el primer anillo las coordenadas del contorno del polígono 
 * y los anillos subsiguientes las coordenadas del los agujeros en el polígono si estos existen.
 * Cada anillo es un array de las coordenadas de cada uno de los vértices del contorno que definen.
 * @param {SITNA.feature.PolygonOptions} [options] Objeto de opciones de la entidad geográfica.
 * @see SITNA.layer.Vector#addPolygon
 * @see SITNA.layer.Vector#addPolygons
 * @see SITNA.layer.Vector#addFeature
 * @see SITNA.layer.Vector#addFeatures
 * @see [Ejemplo de uso de métodos de entidad geográfica](../examples/feature.methods.html)
 * @example <caption>[Ver en vivo](../examples/feature.Polygon.html)</caption> {@lang html}
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

        // Añadimos una instancia de la clase SITNA.feature.Polygon
        const building1 = new SITNA.feature.Polygon([
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
        ], {
            strokeColor: '#522852', // violeta
            strokeWidth: 4,
            fillColor: '#ffffff', // blanco
            fillOpacity: 0.7,
            data: {
                'Número de agujeros': 2
            }
        });
        vectorLayer.addPolygon(building1);

        // Añadimos una entidad geográfica introduciendo directamente las coordenadas de su geometría
        vectorLayer.addPolygon([
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
        ], {
            strokeColor: '#b97f24', // dorado
            strokeWidth: 4,
            fillColor: '#000000', // negro
            fillOpacity: 0.3,
        })
            .then(building2 => {
                // Añadimos atributos a la nueva entidad.
                // Estos datos se pueden consultar al pulsar sobre ella.
                building2.setData({
                    'Número de agujeros': 0
                });
            });

        // Añadimos dos entidades geográficas de una vez
        const building3 = new SITNA.feature.Polygon([
            [
                [614929.9, 4657780.2],
                [614926.3, 4657793.7],
                [614962.6, 4657803.0],
                [614966.2, 4657789.6],
                [614929.9, 4657780.2]
            ]
        ], {
            strokeColor: '#285228', // verde
            strokeWidth: 2
        });
        const building4 = new SITNA.feature.Polygon([
            [
                [614972.9, 4657788.7],
                [614981.2, 4657793.6],
                [614995.0, 4657769.7],
                [614986.3, 4657764.8],
                [614979.8, 4657776.4],
                [614973.0, 4657788.6],
                [614972.9, 4657788.7]
            ]
        ], {
            strokeColor: '#285228', // verde
            strokeWidth: 2
        });
        vectorLayer.addPolygons([
            building3,
            building4
        ])
            .then(buildingArray => {
                // Añadimos atributos a las nuevas entidades.
                // Estos datos se pueden consultar al pulsar sobre ellas.
                buildingArray.forEach(building => {
                    building.setData({
                        'Número de agujeros': 0,
                        'Perímetro': Math.round(building.getLength()) + ' m',
                        'Área': Math.round(building.getArea()) + ' m²',
                    });
                });
                // Nos centramos en las entidades geográficas que hemos añadido
                map.zoomToFeatures(vectorLayer.features);
            });
    });
</script>
 */

/**
 * Obtiene el estilo de la entidad.
 * @method getStyle
 * @memberof SITNA.feature.Polygon
 * @instance
 * @returns {SITNA.feature.PolygonStyleOptions}
 */

/**
 * Asigna estilos al polígono.
 * @method setStyle
 * @memberof SITNA.feature.Polygon
 * @instance
 * @param {SITNA.feature.PolygonStyleOptions} style - Objeto de opciones de estilo de polígono.
 * @returns {SITNA.feature.Polygon} La propia entidad geográfica.
 */

class Polygon extends Feature {
    STYLETYPE = Consts.geom.POLYGON;

    constructor(coords, options) {
        super(coords, options);
        const self = this;

        if (!self.wrap.isNative(coords)) {
            self.wrap.createPolygon(coords, options);
        }
    }

    /**
     * Obtiene las coordenadas de los vértices de los contornos del polígono en el CRS actual del mapa.
     * @method getCoordinates
     * @memberof SITNA.feature.Polygon
     * @instance
     * @returns {Array.<Array.<number[]>>} Coordenadas de los vértices de los contornos del polígono en el CRS actual del mapa.
     */
    getCoordinates(options) {
        const coords = super.getCoordinates.call(this, options);
        if (options?.pointArray) {
            return [].concat.apply([], coords);
        }
        return coords;
    }

    /**
     * Establece las coordenadas de los vértices de los contornos del polígono en el CRS actual del mapa.
     * @method setCoordinates
     * @memberof SITNA.feature.Polygon
     * @instance
     * @param {Array.<Array.<number[]>>} coordinates - Coordenadas de los vértices de los contornos del polígono en el CRS actual del mapa.
     * @returns {SITNA.feature.Polygon} La propia entidad geográfica.
     */
    setCoordinates(coords) {
        const self = this;
        if (coords) {
            if (Array.isArray(coords) && Array.isArray(coords[0])) {
                if (!Array.isArray(coords[0][0])) {
                    coords = [coords];
                }
            }
            else {
                throw new TypeError('Coordinates not valid for polygon');
            }
            coords.forEach(function (ring) {
                const startPoint = ring[0];
                const endPoint = ring[ring.length - 1];
                if (startPoint[0] !== endPoint[0] || startPoint[1] !== endPoint[1]) {
                    ring[ring.length] = startPoint;
                }
            });
        }
        return super.setCoordinates.call(self, coords);
    }

    getCoords(options) {
        return this.getCoordinates(options);
    }

    setCoords(coords) {
        return this.setCoordinates(coords);
    }

    /**
     * Obtiene la longitud total del borde (perímetro y agujeros) del polígono en metros.
     * @method getLength
     * @memberof SITNA.feature.Polygon
     * @instance
     * @param {SITNA.feature.MeasurementOptions} [options] - Parámetros referentes al CRS que hay que considerar para la medida.
     * @returns {number} Longitud total del polígono en metros.
     */
    getLength(options) {
        const self = this;
        return self.wrap.getLength({ coordinates: self.getCoordinates(options) });
    }

    /**
     * Obtiene el área del polígono en metros cuadrados.
     * @method getArea
     * @memberof SITNA.feature.Polygon
     * @instance
     * @param {SITNA.feature.MeasurementOptions} [options] - Parámetros referentes al CRS que hay que considerar para la medida.
     * @returns {number} Área del polígono en metros cuadrados.
     */
    getArea(options) {
        const self = this;
        return self.wrap.getArea({ coordinates: self.getCoordinates(options) });
    }
}

export default Polygon;

/**
 * Opciones de estilo de polígono. Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de esta propiedad
 * (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
 * @typedef PolygonStyleOptions
 * @memberof SITNA.feature
 * @mixin
 * @mixes SITNA.feature.StrokeStyleOptions
 * @mixes SITNA.feature.FillStyleOptions
 * @mixes SITNA.feature.LabelStyleOptions
 * @see SITNA.layer.StyleOptions
 * @see layout_cfg
 * @property {string} [fillColor="#000000"] - Color de relleno, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [fillOpacity=0.3] - Opacidad de relleno, valor de 0 a 1.
 * @property {string} [fontColor="#000000"] - Color del texto de la etiqueta descriptiva de la entidad geográfica, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [fontSize=10] - Tamaño en puntos tipográficos (`pt`) de la fuente del texto de la etiqueta descriptiva de la entidad geográfica.
 * @property {string} [labelKey] - Nombre de atributo del cual extraer el valor de la etiqueta si esta existe.
 * @property {string} [labelOutlineColor="#ffffff"] - Color del contorno del texto de la etiqueta descriptiva de la entidad geográfica, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [labelOutlineWidth=2] - Anchura en píxeles del trazo del contorno del texto de la etiqueta.
 * @property {string} [labelRotationKey] - Nombre del campo del cual extraer la rotación a aplicar a la etiqueta. El valor tiene que estar en grados.
 * @property {string} [strokeColor="#ff0000"] - Color de trazo de los lados del polígono, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [strokeOpacity=1] - Opacidad de trazo de los lados del polígono, valor de 0 a 1.
 * @property {number} [strokeWidth=2] - Anchura de trazo en de los lados del polígono.
 */

/**
 * Opciones de entidad poligonal. Hay que tener en cuenta que el archivo `config.json` de una maquetación
 * puede sobreescribir los valores por defecto de esta propiedad
 * (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
 * @typedef PolygonOptions
 * @memberof SITNA.feature
 * @extends SITNA.feature.FeatureOptions
 * @mixes SITNA.feature.PolygonStyleOptions
 * @property {object|string} [data] - Diccionario de pares clave-valor que representa los atributos alfanuméricos
 * de la entidad geográfica o bien cadena de caracteres con el código HTML asociado al mismo. Al pulsar sobre el polígono, bien una tabla con los atributos o bien el HTML especificado se mostrarán en un bocadillo.
 * @property {string} [fillColor="#000000"] - Color de relleno, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [fillOpacity=0.3] - Opacidad de relleno, valor de 0 a 1.
 * @property {string} [fontColor="#000000"] - Color del texto de la etiqueta descriptiva de la entidad geográfica, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [fontSize=10] - Tamaño en puntos tipográficos (`pt`) de la fuente del texto de la etiqueta descriptiva de la entidad geográfica.
 * @property {string} [group] - Nombre de grupo en el que incluir la entidad geográfica. Todos las entidades geográficas con el mismo valor en esta propiedad se consideran en un mismo grupo.
 * Los grupos se muestran en la tabla de contenidos y en la leyenda.
 * @property {string} [labelKey] - Nombre de atributo del cual extraer el valor de la etiqueta si esta existe.
 * @property {string} [labelOutlineColor="#ffffff"] - Color del contorno del texto de la etiqueta descriptiva de la entidad geográfica, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [labelOutlineWidth=2] - Anchura en píxeles del trazo del contorno del texto de la etiqueta.
 * @property {string} [labelRotationKey] - Nombre del campo del cual extraer la rotación a aplicar a la etiqueta. El valor tiene que estar en grados.
 * @property {boolean} [showPopup] - Si se establece a `true`, la entidad geográfica se añade al mapa con el bocadillo de información asociada visible por defecto.
 * @property {string} [strokeColor="#ff0000"] - Color de trazo de la línea del contorno, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [strokeOpacity=1] - Opacidad de trazo de la línea del contorno, valor de 0 a 1.
 * @property {number} [strokeWidth=2] - Anchura de trazo en píxeles de la línea del contorno.
 */
import Feature from './Feature';

/**
 * Entidad geográfica que representa una línea de varios segmentos en el mapa.
 * @class Polyline
 * @memberof SITNA.feature
 * @extends SITNA.feature.Feature
 * @param {Array.<number[]>} coordinates - Coordenadas de la línea expresadas como un array de coordenadas 
 * de puntos (los vértices de la línea) en las unidades del CRS del mapa.
 * @param {SITNA.feature.PolylineOptions} [options] Objeto de opciones de la entidad geográfica.
 * @see SITNA.layer.Vector#addPolyline
 * @see SITNA.layer.Vector#addPolylines
 * @see SITNA.layer.Vector#addFeature
 * @see SITNA.layer.Vector#addFeatures
 * @see [Ejemplo de uso de métodos de entidad geográfica](../examples/feature.methods.html)
 * @example <caption>[Ver en vivo](../examples/feature.Polyline.html)</caption> {@lang html}
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

        // Añadimos una instancia de la clase SITNA.feature.Polyline
        const track1 = new SITNA.feature.Polyline([
            [609602, 4742351],
            [609027, 4742090]
        ], {
            strokeColor: '#522852', // violeta
            strokeWidth: 6,
            data: {
                'Vía': '1'
            }
        });
        vectorLayer.addPolyline(track1);

        // Añadimos una entidad geográfica introduciendo directamente las coordenadas de su geometría
        vectorLayer.addPolyline([
            [609599, 4742355],
            [609025, 4742094]
        ], {
            strokeColor: '#b97f24', // dorado
            strokeWidth: 6
        })
            .then(track3 => {
                // Añadimos atributos a la nueva entidad.
                // Estos datos se pueden consultar al pulsar sobre ella.
                track3.setData({
                    'Vía': '3',
                    'Longitud': Math.round(track3.getLength()) + ' m'
                });
                map.zoomToFeatures([
                    track1,
                    track3
                ]);
            });

        // Añadimos dos entidades geográficas de una vez
        const serviceTrack1 = new SITNA.feature.Polyline([
            [609037, 4742095],
            [609148, 4742131],
            [609170, 4742134],
            [609238, 4742142],
            [609261, 4742147],
            [609292, 4742158],
            [609361, 4742190]
        ], {
            strokeColor: '#285228', // verde
            strokeWidth: 4
        });
        const serviceTrack2 = new SITNA.feature.Polyline([
            [609329, 4742270],
            [609277, 4742257],
            [609228, 4742234],
            [609176, 4742208]
        ], {
            strokeColor: '#285228', // verde
            strokeWidth: 4
        });
        vectorLayer.addPolylines([
            serviceTrack1,
            serviceTrack2
        ])
            .then(trackArray => {
                // Añadimos atributos a las nuevas entidades.
                // Estos datos se pueden consultar al pulsar sobre ellas.
                trackArray.forEach(track => {
                    track.setData({
                        'Vía': 'Muerta',
                        'Longitud': Math.round(track.getLength()) + ' m'
                    });
                })
            });
    });
</script>
 */

/**
 * Obtiene el estilo de la entidad.
 * @method getStyle
 * @memberof SITNA.feature.Polyline
 * @instance
 * @returns {SITNA.feature.PolylineStyleOptions}
 */

/**
 * Asigna estilos a la línea.
 * @method setStyle
 * @memberof SITNA.feature.Polyline
 * @instance
 * @param {SITNA.feature.PolylineStyleOptions} style - Objeto de opciones de estilo de línea.
 * @returns {SITNA.feature.Polyline} La propia entidad geográfica.
 */

class Polyline extends Feature {
    STYLETYPE = "line";

    constructor(coords, options) {
        super(coords, options);
        const self = this;

        if (!self.wrap.isNative(coords)) {
            self.wrap.createPolyline(coords, options);
        }
    }

    /**
     * Obtiene las coordenadas de los vértices de la línea en el CRS actual del mapa.
     * @method getCoordinates
     * @memberof SITNA.feature.Polyline
     * @instance
     * @returns {Array.<number[]>} Coordenadas de los vértices de la línea en el CRS actual del mapa.
     */

    /**
     * Establece las coordenadas de los vértices de la línea en el CRS actual del mapa.
     * @method setCoordinates
     * @memberof SITNA.feature.Polyline
     * @instance
     * @param {Array.<number[]>} coordinates - Coordenadas de los vértices de la línea en el CRS actual del mapa.
     * @returns {SITNA.feature.Polyline} La propia entidad geográfica.
     */
    setCoordinates(coords) {
        const self = this;
        if (Array.isArray(coords) && !Array.isArray(coords[0])) {
            coords = [coords];
        }
        return super.setCoordinates.call(self, coords);
    }

    setCoords(coords) {
        return this.setCoordinates(coords);
    }

    /**
     * Obtiene la longitud total de la línea en metros.
     * @method getLength
     * @memberof SITNA.feature.Polyline
     * @instance
     * @param {SITNA.feature.MeasurementOptions} [options] - Parámetros referentes al CRS que hay que considerar para la medida.
     * @returns {number} Longitud total de la línea en metros.
     */
    getLength(options) {
        const self = this;
        return self.wrap.getLength({ coordinates: self.getCoordinates(options) });
    }
}

export default Polyline;

/**
 * Opciones de estilo de línea. Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de esta propiedad
 * (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
 * @typedef PolylineStyleOptions
 * @memberof SITNA.feature
 * @mixin
 * @mixes SITNA.feature.StrokeStyleOptions
 * @mixes SITNA.feature.LabelStyleOptions
 * @see SITNA.layer.StyleOptions
 * @see layout_cfg
 * @property {string} [fontColor="#000000"] - Color del texto de la etiqueta descriptiva de la entidad geográfica, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [fontSize=10] - Tamaño en puntos tipográficos (`pt`) de la fuente del texto de la etiqueta descriptiva de la entidad geográfica.
 * @property {string} [labelKey] - Nombre de atributo del cual extraer el valor de la etiqueta si esta existe.
 * @property {string} [labelOutlineColor="#ffffff"] - Color del contorno del texto de la etiqueta descriptiva de la entidad geográfica, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [labelOutlineWidth=2] - Anchura en píxeles del trazo del contorno del texto de la etiqueta.
 * @property {string} [labelRotationKey] - Nombre del campo del cual extraer la rotación a aplicar a la etiqueta. El valor tiene que estar en grados.
 * @property {string} [strokeColor="#ff0000"] - Color de trazo de la línea, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [strokeOpacity=1] - Opacidad de trazo de la línea, valor de 0 a 1.
 * @property {number} [strokeWidth=2] - Anchura de trazo en píxeles de la línea.
 */

/**
 * Opciones de entidad lineal. Hay que tener en cuenta que el archivo `config.json` de una maquetación
 * puede sobreescribir los valores por defecto de esta propiedad
 * (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
 * @typedef PolylineOptions
 * @memberof SITNA.feature
 * @extends SITNA.feature.FeatureOptions
 * @mixes SITNA.feature.PolylineStyleOptions
 * @property {object|string} [data] - Diccionario de pares clave-valor que representa los atributos alfanuméricos 
 * de la entidad geográfica o bien cadena de caracteres con el código HTML asociado al mismo. Al pulsar sobre la línea, bien una tabla con los atributos o bien el HTML especificado se mostrarán en un bocadillo.
 * @property {string} [fontColor="#000000"] - Color del texto de la etiqueta descriptiva de la entidad geográfica, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [fontSize=10] - Tamaño en puntos tipográficos (`pt`) de la fuente del texto de la etiqueta descriptiva de la entidad geográfica.
 * @property {string} [group] - Nombre de grupo en el que incluir la entidad geográfica. Todos las entidades geográficas con el mismo valor en esta propiedad se consideran en un mismo grupo.
 * Los grupos se muestran en la tabla de contenidos y en la leyenda.
 * @property {string} [labelKey] - Nombre de atributo del cual extraer el valor de la etiqueta si esta existe.
 * @property {string} [labelOutlineColor="#ffffff"] - Color del contorno del texto de la etiqueta descriptiva de la entidad geográfica, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [labelOutlineWidth=2] - Anchura en píxeles del trazo del contorno del texto de la etiqueta.
 * @property {string} [labelRotationKey] - Nombre del campo del cual extraer la rotación a aplicar a la etiqueta. El valor tiene que estar en grados.
 * @property {boolean} [showPopup] - Si se establece a `true`, la entidad geográfica se añade al mapa con el bocadillo de información asociada visible por defecto.
 * @property {string} [strokeColor="#ff0000"] - Color de trazo de la línea, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [strokeOpacity=1] - Opacidad de trazo de la línea, valor de 0 a 1.
 * @property {number} [strokeWidth=2] - Anchura de trazo en píxeles de la línea.
 */
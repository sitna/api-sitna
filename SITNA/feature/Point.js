import Consts from '../../TC/Consts';
import Cfg from '../../TC/Cfg';
import Util from '../../TC/Util';
import Feature from './Feature';

/**
 * Entidad geográfica que representa un punto del mapa.
 * @class Point
 * @memberof SITNA.feature
 * @extends SITNA.feature.Feature
 * @param {number[]} coordinates - Coordenadas del punto expresadas en las unidades del CRS del mapa.
 * @param {SITNA.feature.PointOptions} [options] Objeto de opciones del punto.
 * @see SITNA.layer.Vector#addPoint
 * @see SITNA.layer.Vector#addPoints
 * @see SITNA.layer.Vector#addFeature
 * @see SITNA.layer.Vector#addFeatures
 * @see [Ejemplo de uso de métodos de entidad geográfica](../examples/feature.methods.html)
 * @example <caption>[Ver en vivo](../examples/feature.Point.html)</caption> {@lang html}
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

        // Añadimos una instancia de la clase SITNA.feature.Point
        const tree1 = new SITNA.feature.Point([563220, 4738485], {
            strokeColor: '#ffffff', // blanco
            strokeWidth: 4,
            fillColor: '#285228', // verde
            fillOpacity: 1, // opaco
            radius: 10,
            data: {
                'Denominación': 'Haya de Limitaciones',
                'Especie': 'Fagus sylvatica L.'
            }
        });
        vectorLayer.addPoint(tree1);

        // Añadimos una entidad geográfica introduciendo directamente las coordenadas de su geometría
        vectorLayer.addPoint([570651, 4736235], {
            strokeColor: '#ffffff', // blanco
            strokeWidth: 4,
            fillColor: '#522852', // violeta
            fillOpacity: 1, // opaco
            radius: 10,
            data: {
                'Denominación': 'El centinela',
                'Especie': 'Quercus faginea Lam.'
            }
        });

        // Añadimos varias entidades geográficas de una vez introduciendo directamente las coordenadas de sus geometrías
        vectorLayer.addPoints([
            // Colección de dos puntos
            [571367, 4734769], [578315, 4729752]
        ], {
            strokeColor: '#ffffff', // blanco
            strokeWidth: 4,
            fillColor: '#282892', // azul
            fillOpacity: 1, // opaco
            radius: 10,
        }).then(holmOaks => {
            holmOaks[0].setData({
                'Denominación': 'Encina de Basaura',
                'Especie': 'Quercus ilex L. subsp. ilex L.'
            });
            holmOaks[1].setData({
                'Denominación': 'Encina de Eraul',
                'Especie': 'Quercus ilex L. subsp. ilex L. x Quercus ilex subsp. ballota (Desf.) Samp.'
            });
            map.zoomToFeatures(vectorLayer.features);
        });
    });
</script>
 */

/**
 * Obtiene el estilo de la entidad.
 * @method getStyle
 * @memberof SITNA.feature.Point
 * @instance
 * @returns {SITNA.feature.PointStyleOptions}
 */

/**
 * Asigna estilos al punto.
 * @method setStyle
 * @memberof SITNA.feature.Point
 * @instance
 * @param {SITNA.feature.PointStyleOptions} style - Objeto de opciones de estilo de punto.
 * @returns {SITNA.feature.Point} La propia entidad geográfica.
 */

class Point extends Feature {
    STYLETYPE = Consts.geom.POINT;

    constructor(coords, options) {
        super(coords, options);
        const self = this;

        if (!self.wrap.isNative(coords)) {
            self.wrap.feature = coords;
            self.wrap.createPoint(coords, options);
        }
    }

    /**
     * Establece las coordenadas del punto en el CRS actual del mapa.
     * @method setCoordinates
     * @memberof SITNA.feature.Point
     * @instance
     * @param {number[]} coordinates - Coordenadas del punto en el CRS actual del mapa.
     * @returns {SITNA.feature.Point} La propia entidad geográfica.
     */

    /**
     * Obtiene las coordenadas del punto en el CRS actual del mapa.
     * @method getCoordinates
     * @memberof SITNA.feature.Point
     * @instance
     * @returns {number[]} Coordenadas del punto en el CRS actual del mapa.
     */
    getCoordinates(options) {
        const coords = super.getCoordinates.call(this, options);
        if (options?.pointArray) {
            return [coords];
        }
        return coords;
    }

    getCoords(options) {
        return this.getCoordinates(options);
    }

    getCoordsArray() {
        return [this.getCoordinates()];
    }

    setStyle(style) {
        const self = this;
        const isCluster = Array.isArray(self.features) && self.features.length > 1;
        if (isCluster) {
            const mergedStyles = [];
            if (self.layer?.styles?.cluster) {
                mergedStyles.unshift(self.layer.styles.cluster);
            }
            if (self.layer?.map.options.styles?.cluster) {
                mergedStyles.unshift(self.layer.map.options.styles.cluster);
            }
            if (Cfg?.styles?.cluster) {
                mergedStyles.unshift(Cfg.styles.cluster);
            }
            const newStyle = Util.mergeStyles(...mergedStyles);
            return self.wrap.setStyle(newStyle);
        }
        return super.setStyle.call(self, style);
    }
}

export default Point;

/**
 * Opciones de estilo de punto. Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de esta propiedad
 * (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
 * @typedef PointStyleOptions
 * @memberof SITNA.feature
 * @mixin
 * @mixes SITNA.feature.StrokeStyleOptions
 * @mixes SITNA.feature.FillStyleOptions
 * @mixes SITNA.feature.LabelStyleOptions
 * @see SITNA.layer.StyleOptions
 * @see layout_cfg
 * @property {string} [fillColor="#000000" ("#333366" en clusters)] - Color de relleno, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [fillOpacity=0.3 (0.6 en clusters)] - Opacidad de relleno, valor de 0 a 1.
 * @property {string} [fontColor="#000000" ("#ffffff" en clusters)] - Color del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [fontSize=10 (9 en clusters)] - Tamaño en puntos tipográficos (`pt`) de la fuente del texto de la etiqueta descriptiva del punto.
 * @property {string} [labelKey] - Nombre de atributo del cual extraer el valor de la etiqueta si esta existe.
 * @property {string} [labelOutlineColor="#ffffff" (undefined en clusters)] - Color del contorno del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [labelOutlineWidth=2 (undefined en clusters)] - Anchura en píxeles del trazo del contorno del texto de la etiqueta.
 * @property {string} [labelRotationKey] - Nombre del campo del cual extraer la rotación a aplicar a la etiqueta. El valor tiene que estar en grados.
 * @property {number} [radius=6 (undefined en clusters)] - Radio en píxeles del símbolo que representa el punto.
 * @property {string} [strokeColor="#ff0000" (undefined en clusters)] - Color de trazo de la línea que delimita el símbolo del punto, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [strokeOpacity=1 (undefined en clusters)] - Opacidad de trazo de la línea que delimita el símbolo del punto, valor de 0 a 1.
 * @property {number} [strokeWidth=2 (undefined en clusters)] - Anchura de trazo en píxeles de la línea que delimita el símbolo del punto.
 */

/**
 * Opciones de punto. Hay que tener en cuenta que el archivo `config.json` de una maquetación 
 * puede sobreescribir los valores por defecto de esta propiedad
 * (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
 * @typedef PointOptions
 * @memberof SITNA.feature
 * @extends SITNA.feature.FeatureOptions
 * @mixes SITNA.feature.PointStyleOptions
 * @property {object|string} [data] - Diccionario de pares clave-valor que representa los atributos alfanuméricos 
 * de la entidad geográfica o bien cadena de caracteres con el código HTML asociado al mismo. Al pulsar sobre el punto, bien una tabla con los atributos o bien el HTML especificado se mostrarán en un bocadillo.
 * @property {string} [fillColor="#000000" ("#333366" en clusters)] - Color de relleno, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [fillOpacity=0.3 (0.6 en clusters)] - Opacidad de relleno, valor de 0 a 1.
 * @property {string} [fontColor="#000000" ("#ffffff" en clusters)] - Color del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [fontSize=10 (9 en clusters)] - Tamaño en puntos tipográficos (`pt`) de la fuente del texto de la etiqueta descriptiva del punto.
 * @property {string} [group] - Nombre de grupo en el que incluir el punto. 
 * Todos los puntos con el mismo valor en esta propiedad se consideran en un mismo grupo. 
 * Los grupos se muestran en la tabla de contenidos y en la leyenda.
 * @property {string} [labelKey] - Nombre de atributo del cual extraer el valor de la etiqueta si esta existe.
 * @property {string} [labelOutlineColor="#ffffff" (undefined en clusters)] - Color del contorno del texto de la etiqueta descriptiva del punto, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [labelOutlineWidth=2 (undefined en clusters)] - Anchura en píxeles del trazo del contorno del texto de la etiqueta.
 * @property {string} [labelRotationKey] - Nombre del campo del cual extraer la rotación a aplicar a la etiqueta. El valor tiene que estar en grados.
 * @property {string} [layer] - Identificador de una capa de tipo [SITNA.Consts.layerType.VECTOR]{@link SITNA.Consts} en la que se añadirá el punto.
 * @property {number} [radius=6 (undefined en clusters)] - Radio en píxeles del símbolo que representa el punto.
 * @property {boolean} [showPopup] - Si se establece a `true`, el punto se añade al mapa con el bocadillo de información asociada visible por defecto.
 * @property {string} [strokeColor="#ff0000" (undefined en clusters)] - Color de trazo de la línea que delimita el símbolo del punto, representado en formato hex triplet (`#RRGGBB`).
 * @property {number} [strokeOpacity=1 (undefined en clusters)] - Opacidad de trazo de la línea que delimita el símbolo del punto, valor de 0 a 1.
 * @property {number} [strokeWidth=2 (undefined en clusters)] - Anchura de trazo en píxeles de la línea que delimita el símbolo del punto.
 */
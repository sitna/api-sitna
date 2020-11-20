TC.feature = TC.feature || {};

if (!TC.feature.Point) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Point');
}

/**
 * <p>Opciones de estilo de marcador (punto de mapa con icono). Esta clase no tiene constructor.</p>
 * @class TC.cfg.MarkerStyleOptions
 * @static
 */
/**
 * URL de la imagen del icono del marcador.
 * @property url
 * @type string
 */
/**
 * Clase CSS de la que obtener el icono del marcador, extrayendo la URL de la imagen del atributo <code>background-image</code> asociado a la clase.
 * @property cssClass
 * @type string
 * @default "tc-marker1"
 */
/**
 * Lista de nombres de clase CSS a utilizar para los iconos de los marcadores. La API extraerá la URL de las imágenes del atributo <code>background-image</code> asociado a la clase.
 * @property classes
 * @type array
 * @default ["tc-marker1", "tc-marker2", "tc-marker3", "tc-marker4", "tc-marker5"]
 */
/**
 * Posicionamiento relativo del icono respecto al punto del mapa, representado por un array de dos números entre 0 y 1, siendo [0, 0] la esquina superior izquierda del icono.
 * @property anchor
 * @type array
 * @default [.5, 1]
 */
/**
 * Anchura en píxeles del icono.
 * @property width
 * @type number
 * @default 32
 */
/**
 * Altura en píxeles del icono.
 * @property height
 * @type number
 * @default 32
 */
/**
 * Nombre del grupo en el que incluir el marcador. Los grupos de marcadores son entidades para facilitar la organización de estos: 
 * por un lado, un grupo se mostrará en la tabla de contenidos y en la leyenda, por otro, si no se especifica explícitamente un icono para el marcador, 
 * todos los marcadores del mismo grupo tendrán el mismo icono. La asignación de icono a grupo se hará rotando entre los elementos de la propiedad 
 * {{#crossLink "TC.cfg.MarkerStyleOptions/classes:property"}}{{/crossLink}}.
 * @property group
 * @type string
 * @default 32
 */

/*
 * Map marker, with icon
 * Parameters: coords, 2 element array of numbers or OpenLayers vector; options, object
 * available options: url, cssClass, group, width, height, anchor
 */
TC.feature.Marker = function (coords, options) {
    const self = this;

    TC.Feature.apply(self, arguments);

    if (!self.wrap.isNative(coords)) {
        var locale = self.layer && self.layer.map ? self.layer.map.options.locale: TC.Cfg.locale;
        self.title = self.options.title || TC.i18n[locale][TC.Consts.MARKER];
        self.wrap.createMarker(coords, options);
    }
};

TC.inherit(TC.feature.Marker, TC.feature.Point);

TC.feature.Marker.prototype.STYLETYPE = 'marker';

TC.feature.Marker.prototype.CLASSNAME = 'TC.feature.Marker';
TC.feature = TC.feature || {};

if (!TC.feature.Point) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Point.js');
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
 * Lista de nombres de clase CSS a utilizar para los iconos de los marcadores. La API extraer\u00e1 la URL de las im\u00e1genes del atributo <code>background-image</code> asociado a la clase.
 * @property classes
 * @type array
 * @default ["tc-marker1", "tc-marker2", "tc-marker3", "tc-marker4", "tc-marker5"]
 */
/**
 * Posicionamiento relativo del icono respecto al punto del mapa, representado por un array de dos n\u00fameros entre 0 y 1, siendo [0, 0] la esquina superior izquierda del icono.
 * @property anchor
 * @type array
 * @default [.5, 1]
 */
/**
 * Anchura en p\u00edxeles del icono.
 * @property width
 * @type number
 * @default 32
 */
/**
 * Altura en p\u00edxeles del icono.
 * @property height
 * @type number
 * @default 32
 */
/**
 * Nombre del grupo en el que incluir el marcador. Los grupos de marcadores son entidades para facilitar la organizaci\u00f3n de estos: 
 * por un lado, un grupo se mostrar\u00e1 en la tabla de contenidos y en la leyenda, por otro, si no se especifica expl\u00edcitamente un icono para el marcador, 
 * todos los marcadores del mismo grupo tendr\u00e1n el mismo icono. La asignaci\u00f3n de icono a grupo se har\u00e1 rotando entre los elementos de la propiedad 
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
    var self = this;

    TC.Feature.apply(self, arguments);

    if (self.wrap.isNative(coords)) {
        coords._wrap = self.wrap;
        self.wrap.feature = coords;
    }
    else {
        var opts = self.options = $.extend(true, self.options, TC.Cfg.styles.marker, options);
        var locale = self.layer && self.layer.map ? self.layer.map.options.locale: TC.Cfg.locale;
        self.title = opts.title || TC.i18n[locale][TC.Consts.MARKER];
        self.wrap.createMarker(coords, opts);
    }
};

TC.inherit(TC.feature.Marker, TC.feature.Point);

TC.feature.Marker.prototype.STYLETYPE = 'marker';

TC.feature.Marker.prototype.CLASSNAME = 'TC.feature.Marker';
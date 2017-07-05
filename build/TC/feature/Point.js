TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}

/**
 * <p>Opciones de estilo de punto. Esta clase no tiene constructor.</p>
 * @class TC.cfg.PointStyleOptions
 * @static
 */
/**
 * Radio en p\u00edxeles del s\u00edmbolo del punto.
 * @property radius
 * @type number
 * @default 8
 */
/**
 * Color de relleno del s\u00edmbolo del punto. Cadena en formato <code>#rgb</code>, <code>#rrggbb</code>, <code>rgb(r,g,b)</code> o <code>rgba(r,g,b,a)</code>.
 * @property fillColor
 * @type string
 */
/**
 * Opacidad de relleno del s\u00edmbolo del punto. N\u00famero entre 0 (transparente) y 1 (opaco).
 * @property fillOpacity
 * @type number
 */
/**
 * Color de l\u00ednea del s\u00edmbolo del punto. Cadena en formato <code>#rgb</code>, <code>#rrggbb</code>, <code>rgb(r,g,b)</code> o <code>rgba(r,g,b,a)</code>.
 * @property strokeColor
 * @type string
 */
/**
 * Ancho de l\u00ednea en p\u00edxeles del s\u00edmbolo del punto.
 * @property strokeWidth
 * @type number
 * @default 2
 */
/**
 * Nombre del grupo en el que incluir el punto. Los grupos de puntos son entidades para facilitar la organizaci\u00f3n de estos, 
 * ya que un grupo se mostrar\u00e1 en la tabla de contenidos y en la leyenda.
 * @property group
 * @type string
 * @default 32
 */

/*
 * Map marker, with icon
 * Parameters: coords, 2 element array of numbers or OpenLayers vector; options, object
 * available options: url, cssClass, group, width, height, anchor
 */
TC.feature.Point = function (coords, options) {
    var self = this;

    TC.Feature.apply(self, arguments);

    var opts;
    if (self.wrap.isNative(coords)) {
        coords._wrap = self.wrap;
        self.wrap.feature = coords;
    }
    else {
        opts = self.options = $.extend(true, self.options, TC.Cfg.styles.point, options);
        self.wrap.createPoint(coords, opts);
    }
};

TC.inherit(TC.feature.Point, TC.Feature);

(function () {
    var featProto = TC.feature.Point.prototype;

    featProto.STYLETYPE = TC.Consts.geom.POINT;

    featProto.CLASSNAME = 'TC.feature.Point';

    featProto.getCoords = function () {
        return this.wrap.getGeometry();
    };

    featProto.setCoords = function (coords) {
        return this.wrap.setGeometry(coords);
    };

})();
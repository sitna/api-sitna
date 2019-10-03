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
 * Radio en píxeles del símbolo del punto.
 * @property radius
 * @type number
 * @default 8
 */
/**
 * Color de relleno del símbolo del punto. Cadena en formato <code>#rgb</code>, <code>#rrggbb</code>, <code>rgb(r,g,b)</code> o <code>rgba(r,g,b,a)</code>.
 * @property fillColor
 * @type string
 */
/**
 * Opacidad de relleno del símbolo del punto. Número entre 0 (transparente) y 1 (opaco).
 * @property fillOpacity
 * @type number
 */
/**
 * Color de línea del símbolo del punto. Cadena en formato <code>#rgb</code>, <code>#rrggbb</code>, <code>rgb(r,g,b)</code> o <code>rgba(r,g,b,a)</code>.
 * @property strokeColor
 * @type string
 */
/**
 * Ancho de línea en píxeles del símbolo del punto.
 * @property strokeWidth
 * @type number
 * @default 2
 */
/**
 * Nombre del grupo en el que incluir el punto. Los grupos de puntos son entidades para facilitar la organización de estos, 
 * ya que un grupo se mostrará en la tabla de contenidos y en la leyenda.
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

    if (!self.wrap.isNative(coords)) {
        self.wrap.feature = coords;
        options = self.options = TC.Util.extend(true, self.options, TC.Cfg.styles.point, options);
        self.wrap.createPoint(coords, options);
    }
};

TC.inherit(TC.feature.Point, TC.Feature);

TC.feature.Point.prototype.STYLETYPE = TC.Consts.geom.POINT;

TC.feature.Point.prototype.CLASSNAME = 'TC.feature.Point';

TC.feature.Point.prototype.getCoords = function (options) {
    options = options || {};
    const coords = TC.Feature.prototype.getCoords.call(this, options);
    if (options.pointArray) {
        return [coords];
    }
    return coords;
};
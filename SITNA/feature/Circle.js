import Consts from '../../TC/Consts';
import Feature from './Feature';
import Polygon from './Polygon';

/**
 * Entidad geográfica que representa un círculo en el mapa.
 * @class Circle
 * @memberof SITNA.feature
 * @extends SITNA.feature.Feature
 * @param {SITNA.feature.CircleGeometry|Array.<number[]>} geometry - Si el parámetro es un array, las coordenadas
 * del círculo expresadas como un array de dos elementos, el primero son las coordenadas del centro 
 * en las unidades del CRS del mapa y el segundo son las coordenadas de un punto de su circunferencia, 
 * en las unidades del CRS actual del mapa (metros por defecto).
 * @param {SITNA.feature.PolygonOptions} [options] Objeto de opciones de la entidad geográfica.
 * @see SITNA.layer.Vector#addCircle
 * @see SITNA.layer.Vector#addFeature
 * @see SITNA.layer.Vector#addFeatures
 * @see [Ejemplo de uso de métodos de entidad geográfica](../examples/feature.methods.html)
 * @example <caption>[Ver en vivo](../examples/feature.Circle.html)</caption> {@lang html}
<div id="mapa"></div>
<script>
    SITNA.Cfg.workLayers = [
        {
            id: "entidades",
            title: "Demostración de círculos",
            type: SITNA.Consts.layerType.VECTOR
        }
    ];
    var map = new SITNA.Map("mapa");
    map.loaded(() => {
        // Obtenemos la instancia de la capa vectorial
        const vectorLayer = map.getLayer("entidades");

        // Creamos una instancia de la clase SITNA.feature.Circle pasándole un objeto de definición de geometría
        const circle1 = new SITNA.feature.Circle({
            center: [612175, 4717775],
            radius: 10000
        }, {
            strokeColor: '#522852', // violeta
            strokeWidth: 6,
            fillColor: '#285228', // verde
            fillOpacity: 0.5,
            data: {
                'Color': 'Violeta/verde'
            }
        });

        // Creamos una instancia de la clase SITNA.feature.Circle pasándole un array de coordenadas
        const circle2 = new SITNA.feature.Circle([
            [642175, 4717775], // coordenadas del centro
            [647175, 4717775], // coordenadas de un punto de la circunferencia
        ], {
            strokeColor: '#b97f24', // dorado
            strokeWidth: 8,
            fillColor: '#282852', // azul
            fillOpacity: 0.2,
            data: {
                'Color': 'Dorado/azul'
            }
        });

        // Añadimos una instancia de la clase SITNA.feature.Circle a la capa pasándole un objeto de definición de geometría
        vectorLayer.addCircle({
            center: [612175, 4687775],
            radius: 12000
        }, {
            strokeColor: '#880000', // granate
            strokeWidth: 10,
            fillColor: '#000000', // negro
            fillOpacity: 0, // Completamente transparente
            data: {
                'Color': 'Granate/transparente'
            }
        });

        // Añadimos una instancia de la clase SITNA.feature.Circle a la capa pasándole un array de coordenadas
        vectorLayer.addCircle([
            [642175, 4687775], // coordenadas del centro
            [644175, 4687775], // coordenadas de un punto de la circunferencia
        ], {
            strokeColor: '#000000', // negro
            strokeWidth: 6,
            fillColor: '#cccccc', // gris
            fillOpacity: 1, // Completamente opaco
            data: {
                'Color': 'Negro/gris'
            }
        });

        // Añadimos las dos entidades geográficas de una vez
        vectorLayer.addCircles([
            circle1,
            circle2
        ])
            .then(circleArray => {
                // Añadimos atributos a las nuevas entidades.
                // Estos datos se pueden consultar al pulsar sobre ellas.
                circleArray.forEach(circle => {
                    const newData = circle.getData();
                    newData["Centro"] = circle.getCenter().toString();
                    newData["Radio en metros"] = circle.getRadius();
                    circle.setData(newData);
                })
                map.zoomToFeatures(vectorLayer.features);
            });
    });
</script>
 */

/**
 * Obtiene el estilo de la entidad.
 * @method getStyle
 * @memberof SITNA.feature.Circle
 * @instance
 * @returns {SITNA.feature.PolygonStyleOptions}
 */

/**
 * Asigna estilos al círculo.
 * @method setStyle
 * @memberof SITNA.feature.Circle
 * @instance
 * @param {SITNA.feature.PolygonStyleOptions} style - Objeto de opciones de estilo de polígono.
 * @returns {SITNA.feature.Circle} La propia entidad geográfica.
 */

class Circle extends Feature {
    STYLETYPE = Consts.geom.POLYGON;

    constructor(coords, options) {
        super(coords, options);
        const self = this;

        if (!self.wrap.isNative(coords)) {
            self.wrap.createCircle(Circle.parseGeometry(coords), options);
        }
    }

    static parseGeometry(geometry) {
        // Adoptamos la convención de introducir las coordenadas de dos puntos:
        // El primero es el centro, el segundo es cualquiera de la circunferencia.
        let geom = geometry;
        if (Object.prototype.hasOwnProperty.call(geometry, 'center') &&
            Object.prototype.hasOwnProperty.call(geometry, 'radius')) {
            geom = [geometry.center, [geometry.center[0] + geometry.radius, geometry.center[1]]];
        }
        const center = geom[0];
        const circunferencePoint = geom[1];
        if (Array.isArray(geom) &&
            Array.isArray(center) &&
            !isNaN(center[0]) && !isNaN(center[1]) &&
            Array.isArray(circunferencePoint) &&
            !isNaN(circunferencePoint[0]) && !isNaN(circunferencePoint[1])) {
            return geom;
        }
        throw new Error('Coordinates not valid for circle');
    }

    /**
     * Obtiene las coordenadas de la geometría del círculo en el CRS actual del mapa.
     * @method getCoordinates
     * @memberof SITNA.feature.Circle
     * @instance
     * @returns {Array.<number[]>} Array cuyo primer elemento son las coordenadas 
     * del centro del círculo en el CRS del mapa y el segundo elemento es el punto 
     * de la circunferencia con el mayor valor de x.
     */

    /**
     * Establece la geometría del círculo en el CRS actual del mapa.
     * @method setCoordinates
     * @memberof SITNA.feature.Circle
     * @instance
     * @param {SITNA.feature.CircleGeometry|Array.<number[]>} geometry - Si el parámetro es un array, las coordenadas
     * del círculo expresadas como un array de dos elementos, el primero son las coordenadas del centro
     * en las unidades del CRS del mapa y el segundo son las coordenadas de un punto de su circunferencia,
     * en las unidades del CRS actual del mapa (metros por defecto).
     * @returns {SITNA.feature.Circle} La propia entidad geográfica.
     */
    setCoordinates(coords) {
        const self = this;
        if (coords) {
            coords = Circle.parseGeometry(coords);
        }
        return super.setCoordinates.call(self, coords);
    }

    /**
     * Obtiene las coordenadas del centro del círculo en el CRS actual del mapa.
     * @method getCenter
     * @memberof SITNA.feature.Circle
     * @instance
     * @returns {number[]} Array con las coordenadas del centro del círculo en el CRS del mapa. 
     */
    getCenter() {
        return this.wrap.getGeometry()[0];
    }

    /**
     * Obtiene el radio del círculo en metros.
     * @method getRadius
     * @memberof SITNA.feature.Circle
     * @instance
     * @param {SITNA.feature.MeasurementOptions} [options] - Parámetros referentes al CRS que hay que considerar para la medida.
     * @returns {number} Longitud del radio en metros.
     */
    getRadius(options) {
        const self = this;
        const [center, circonferencePoint] = self.getCoordinates(options);
        return Math.hypot(circonferencePoint[0] - center[0], circonferencePoint[1] - center[1]);
    }

    getCoords() {
        return this.getCoordinates();
    }

    setCoords(coords) {
        return this.setCoordinates(coords);
    }

    getCoordsArray() {
        return this.getCoordinates();
    }

    toPolygon(numPoints = 72) {
        const self = this;
        const radius = self.getRadius();
        const center = self.getCenter();
        const points = new Array(numPoints);
        const dAngle = 2 * Math.PI / numPoints;
        let angle = 0;
        for (var i = 0; i < numPoints; i++) {
            points[i] = [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
            angle += dAngle;
        }
        return new Polygon([points], Object.assign({}, self.options));
    }
}

export default Circle;

/**
 * Objeto de descripción de la geometría de un círculo.
 * @typedef CircleGeometry
 * @memberof SITNA.feature
 * @property {number[]} center - Coordenadas del centro del círculo en el CRS del mapa.
 * @property {number} radius - Radio del círculo en la unidad de longitud del CRS actual del mapa (metros por defecto).
 */
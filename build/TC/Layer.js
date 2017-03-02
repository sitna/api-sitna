/**
 * Opciones de capa.
 * Esta clase no tiene constructor.
 * @class TC.cfg.LayerOptions
 * @static
 */
/**
 * Identificador \u00fanico de capa.
 * @property id
 * @type string|undefined
 */
/**
 * T\u00edtulo de capa. Este valor se mostrar\u00e1 en la tabla de contenidos y la leyenda.
 * @property title
 * @type string|undefined
 */
/**
 * Tipo de capa. Si no se especifica se considera que la capa es WMS. La lista de valores posibles est\u00e1 definida en {{#crossLink "TC.consts.LayerType"}}{{/crossLink}}.
 * @property type
 * @type string|undefined
 */
/**
 * Tipo MIME del formato de archivo de imagen a obtener del servicio. Si esta propiedad no est\u00e1 definida, se comprobar\u00e1 si la capa es un mapa de fondo 
 * (consultar propiedad {{#crossLink "TC.cfg.LayerOptions/isBase:property"}}{{/crossLink}}). En caso afirmativo, el formato elegido ser\u00e1 <code>"image/jpeg"</code>, 
 * de lo contrario el formato ser\u00e1 <code>"image/png"</code>.
 * @property format
 * @type string|undefined
 */
/**
 * La capa se muestra por defecto si forma parte de los mapas de fondo.
 * @property isDefault
 * @type boolean|undefined
 */
/**
 * La capa es un mapa de fondo.
 * @property isBase
 * @type boolean|undefined
 */
/**
 * Aplicable a capas de tipo WMS y KML. La capa no muestra la jerarqu\u00eda de grupos de capas en la tabla de contenidos ni en la leyenda.
 * @property hideTree
 * @type boolean|undefined
 */
/**
 * La capa no muestra su t\u00edtulo cuando es a\u00f1adida al control de capas de trabajo.
 * @property hideTitle
 * @type boolean|undefined
 * @default false
 */
/**
 * La capa no aparece en la tabla de contenidos ni en la leyenda. De este modo se puede a\u00f1adir una superposici\u00f3n de capas de trabajo que el usuario la perciba como parte del mapa de fondo.
 * @property stealth
 * @type boolean|undefined
 */
/**
 * URL de una imagen en miniatura a mostrar en el selector de mapas de fondo.
 * @property thumbnail
 * @type string|undefined
 */

/**
 * \u00c1rbol de elementos de capa.
 * Esta clase no tiene constructor.
 * @class TC.layer.LayerTree
 * @static
 */
/**
 * Nombre de capa en servicios WMS o WMTS.
 * @property name
 * @type string|undefined
 */
/**
 * T\u00edtulo de capa. Es un texto descriptivo para el usuario.
 * @property title
 * @type string|undefined
 */
/**
 * Identificador \u00fanico de la capa.
 * @property uid
 * @type string|undefined
 */
/**
 * URL de la imagen con la leyenda de la capa.
 * @property legend
 * @type string|undefined
 */
/**
 * Lista de nodos hijos del nodo actual.
 * @property children
 * @type array|undefined
 */

/**
 * Capa de mapa. Esta clase no deber\u00eda instanciarse directamente, sino mediante alguna de las clases que heredan de ella.
 * @class TC.Layer
 * @constructor
 * @async
 * @param {TC.cfg.LayerOptions} [options] Objeto de opciones de configuraci\u00f3n de la capa.
 */
TC.Layer = function (options) {
    ///<summary>
    ///Constructor
    ///</summary>
    ///<param name="options" type="object">Objeto de opciones de capa.</param>
    ///<returns type="TC.Layer"></returns>
    var _layer = this;

    /**
     * Objeto de opciones de capa.
     * @property options
     * @type TC.cfg.LayerOptions
     * @default {}
     */
    _layer.options = options || {};
    $.extend(_layer, _layer.options);

    /**
     * Identificador de capa, debe ser \u00fanico en el mapa. Si no se asigna en las opciones del constructor, se genera uno autom\u00e1ticamente.
     * @property id
     * @type string
     */
    _layer.id = _layer.options.id || TC.getUID();

    /**
     * Objeto del mapa al que pertenece la capa.
     * @property map
     * @type TC.Map|undefined
     */
    _layer.map = _layer.options.map;
    /**
     * Tipo de capa.
     * @property type
     * @type TC.consts.LayerType
     */
    _layer.type = _layer.options.type || TC.Consts.layerType.WMS;
    var defaultFormat = _layer.options.isBase ? TC.Consts.mimeType.JPEG : TC.Consts.mimeType.PNG;
    _layer.options.format = _layer.options.format || defaultFormat;

    if (_layer.options.hideTree === undefined) {
        _layer.options.hideTree = true;
    }    

    if (_layer.options.hideTitle === undefined) {
        _layer.options.hideTitle = false;
    }

    _layer._cache = {
        visibilityStates: {}
    };

    /**
     * \u00c1rbol de los componentes de la capa. Estos componentes son distintos seg\u00fan el tipo de capa: as\u00ed, en una capa WMS son las distintas capas del servicio, 
     * en una capa KML son carpetas.
     * @property tree
     * @type TC.layer.LayerTree|null
     */
    _layer.tree = null;

    /**
     * Objeto envoltorio de la capa nativa de OpenLayers.
     * @property wrap
     * @type TC.wrap.Layer|null
     */
    _layer.wrap = null;
};

TC.Layer.state = {
    IDLE: 'idle',
    LOADING: 'loading'
};

/**
 * Establece la visibilidad de la capa en el mapa.
 * @method setVisibility
 * @param {boolean} visible <code>true</code> si se quiere mostrar la capa, <code>false</code> si se quiere ocultarla.
 */
TC.Layer.prototype.setVisibility = function (visible) {
    this.wrap.setVisibility(visible);
};

/**
 * Obtiene la visibilidad actual de la capa en el mapa.
 * @method getVisibility
 * @return {boolean} <code>true</code> si la capa est\u00e1 visible, <code>false</code> si est\u00e1 oculta.
 */
TC.Layer.prototype.getVisibility = function () {
    var layer = this;
    var result = false;
    if (layer.map) {
        if (!layer.isBase || layer.map.getBaseLayer() === layer) {
            result = layer.wrap.getVisibility();
        }
    }
    return result;
};


/**
 * Obtiene la opacidad actual de la capa en el mapa.
 * @method getOpacity
 * @return {number}.
 */
TC.Layer.prototype.getOpacity = function () {
    var layer = this;
    var result = false;
    if (layer.map) {
        if (!layer.isBase || layer.map.getBaseLayer() === layer) {
            result = layer.wrap.getLayer().getOpacity();
        }
    }
    return result;
};

/**
 * Establece la opacidad de la capa en el mapa. Hay que tener en cuenta que establecer opacidad 0 a una capa no es 
 * equivalente que llamar a TC.Layer.{{#crossLink "TC.Layer/setVisibility:method"}}{{/crossLink}} con el valor del par\u00e1metro <code>false</code>.
 * @method setOpacity
 * @param {number} opacity Valor entre <code>0</code> (capa transparente) y <code>1</code> (capa opaca).
 */
TC.Layer.prototype.setOpacity = function (opacity) {
    var layer = this;
    $.when(this.wrap.getLayer()).then(function (olLayer) {
        olLayer.setOpacity(opacity);
        if (layer.map) {
            layer.map.$events.trigger($.Event(TC.Consts.event.LAYEROPACITY, { layer: layer, opacity: opacity }));
        }
    });
};

/**
 * Determina si la capa se puede mostrar en el CRS especificado.
 * @method isCompatible
 * @param {string} crs Cadena con el well-known ID (WKID) del CRS.
 * @return {boolean}
 */
TC.Layer.prototype.isCompatible = function (crs) {
    return true;
};

/**
 * Determina si la capa tiene nombres v\u00e1lidos.
 * @method isValidFromNames
 * @return {boolean}
 */
TC.Layer.prototype.isValidFromNames = function () {
    return true;
};

/**
 * Determina si la capa es de tipo raster.
 * @method isRaster
 * @return {boolean}
 */
TC.Layer.prototype.isRaster = function () {
    var result = true;
    var _layer = this;
    switch (_layer.type) {
        case TC.Consts.layerType.VECTOR:
        case TC.Consts.layerType.KML:
        case TC.Consts.layerType.WFS:
        case TC.Consts.layerType.GROUP:
            result = false;
            break;
        default:
            break;
    }
    return result;
};

/**
 * Determina si la capa es visible a la resoluci\u00f3n actual. Para ello consulta el documento de capabilities en los casos en que exista.
 * @method isVisibleByScale
 * @return {boolean}
 */
TC.Layer.prototype.isVisibleByScale = function (name) {
    return true;
};


/**
 * Determina si una capa del servicio est\u00e1 establecida en el mapa como visible.
 * @method isVisibleByName
 * @return {boolean}
 */
TC.Layer.prototype.isVisibleByName = function (name) {
    return true;
};

/**
 * <p>Devuelve un \u00e1rbol de informaci\u00f3n de la capa. Como m\u00ednimo devuelve un nodo ra\u00edz con el t\u00edtulo de la capa.</p>
 * <p>En capas de servicios WMS es la jerarqu\u00eda de capas obtenida del documento capabilities. Dependiendo del valor de la propiedad TC.cfg.LayerOptions.{{#crossLink "TC.cfg.LayerOptions/hideTree:property"}}{{/crossLink}}, 
 * puede mostrar un \u00e1rbol de todas las capas del servicio o solo un \u00e1rbol de las capas visibles inicialmente.</p>
 * <p>En capas de documentos KML cada nodo es una carpeta del documento.</p>
 * <p>Si la propiedad TC.cfg.LayerOptions.{{#crossLink "TC.cfg.LayerOptions/stealth:property"}}{{/crossLink}} est\u00e1 establecida a <code>true</code>, este m\u00e9todo devuelve <code>null</code>.</p>
 * @method getTree
 * @return {TC.layer.LayerTree}
 */
TC.Layer.prototype.getTree = function () {
    var _layer = this;
    var result = { name: _layer.name, title: _layer.title };
    return result;
};

/**
 * Devuelve un nodo del \u00e1rbol de informaci\u00f3n de la capa.
 * @method findNode
 * @param {string} id Identificador del nodo.
 * @param {TC.layer.LayerTree} parent Nodo desde el que se comienza la b\u00fasqueda.
 * @return {TC.layer.LayerTree} Si no se encuentra el nodo el m\u00e9todo devuelve <code>null</code>.
 */
TC.Layer.prototype.findNode = function findNode(id, parent) {
    var result = null;
    if (parent.uid == id) {
        result = parent;
    }
    else {
        for (var i = 0; i < parent.children.length; i++) {
            var r = findNode(id, parent.children[i]);
            if (r) {
                result = r;
                break;
            }
        }
    }
    return result;
};


/**
 * Establece la visibilidad en el mapa de un elemento asociado a un nodo de \u00e1rbol de la capa. Dependiendo del tipo de capa este elemento 
 * es una entidad u otra, as\u00ed, en capas de tipo WMS son capas de servicio, en KML son carpetas y en capas vectoriales gen\u00e9ricas son grupos de marcadores.
 * @method setNodeVisibility
 * @param {string} id Identificador del nodo.
 * @param {boolean} visible <code>true</code> si se quiere mostrar el elemento, <code>false</code> si se quiere ocultar.
 */
TC.Layer.prototype.setNodeVisibility = function (id, visible) {
    this.setVisibility(visible);
};

/**
 * Obtiene la visibilidad en el mapa de un elemento asociado a un nodo de \u00e1rbol de la capa. Dependiendo del tipo de capa este elemento 
 * es una entidad u otra, as\u00ed, en capas de tipo WMS son capas de servicio, en KML son carpetas y en capas vectoriales gen\u00e9ricas son grupos de marcadores.
 * @method getNodeVisibility
 * @param {string} id Identificador del nodo.
 * @return {TC.consts.Visibility}
 */
TC.Layer.prototype.getNodeVisibility = function (id) {
    return TC.Consts.visibility.VISIBLE;
};


TC.Layer.prototype.getResolutions = function ()
{
    if (this.wrap.getResolutions)
    {
        return this.wrap.getResolutions();
    }
    else
    {
        return [];
    }
};
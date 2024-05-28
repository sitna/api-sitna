import TC from '../../TC';
import Consts from '../../TC/Consts';
import Util from '../../TC/Util';
import localforage from 'localforage';
import Proxification from '../../TC/tool/Proxification';
import wwBlob from '../../workers/tc-caps-web-worker-blob.mjs';

const isWebWorkerEnabled = Object.prototype.hasOwnProperty.call(window, 'Worker');

const srcToURL = function (src) {
    const anchor = document.createElement('a');
    anchor.href = src;

    if (!anchor.origin) {

        if (!(anchor.protocol && anchor.hostname)) {
            var urlParts = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(anchor.href);

            anchor.protocol = urlParts[1];

            if (urlParts[4].indexOf(':') > -1) {
                var hostname = urlParts[4].split(':');
                anchor.hostname = hostname[0];
                anchor.port = hostname[1];
            } else {
                anchor.hostname = urlParts[4];
            }
        }

        anchor.origin = anchor.protocol.length === 0 ? window.location.protocol : anchor.protocol +
            "//" + anchor.hostname + (anchor.port && src.indexOf(anchor.port) > -1 ? ':' + anchor.port : '');
    }

    return anchor;
};

const cleanOgcUrl = function (url) {
    var result = url;
    if (url) {
        var match = url.match(/\??SERVICE=\w+&/i);
        if (match) {
            result = result.replace(match[0], '');
        }
    }
    return result;
};

/**
 * Espacio de nombres de las capas del mapa.
 * @namespace SITNA.layer
 */

/**
 * Capa de mapa. Esta clase no debería instanciarse directamente, sino mediante alguna de las clases que heredan de ella.
 * @class Layer
 * @memberof SITNA.layer
 * @abstract
 * @param {SITNA.layer.LayerOptions} [options] Objeto de opciones de configuración de la capa.
 * @see SITNA.Map#getLayer
 */
class Layer {
    /**
     * Identificador de capa, debe ser único en el mapa. Si no se asigna en las opciones del constructor, se genera uno automáticamente.
     * @member id
     * @memberof SITNA.layer.Layer
     * @instance
     * @type {string}
     */
    id;

    /**
     * Objeto del mapa al que pertenece la capa.
     * @member map
     * @memberof SITNA.layer.Layer
     * @instance
     * @type {SITNA.Map|undefined}
     */
    map;

    /**
     * Tipo de capa.
     * @member type
     * @memberof SITNA.layer.Layer
     * @instance
     * @type {SITNA.Consts.layerType}
     */
    type;

    /**
     * URL del servicio al que pertenenece la capa o del archivo geográfico que contiene los datos de la capa.
     * @member url
     * @memberof SITNA.layer.Layer
     * @instance
     * @type {string}
     */
    url;

    /*
     * Árbol del documento de capabilities del servicio.
     * @property capabilities
     * @memberof SITNA.layer.Raster
     * @type {object}
     */
    capabilities = null;

    tree = null;
    wrap = null;
    #CAPABILITIES_STORE_KEY_PREFIX = 'TC.capabilities.';
    #onlineCapabilitiesPromise;
    #metadata;

    static state = {
        IDLE: 'idle',
        LOADING: 'loading'
    };

    constructor(options = {}) {
        const self = this;
        this.options = options;
        Util.extend(self, self.options);
        self.id = self.options.id || TC.getUID();
        self.type = self.options.type || Consts.layerType.WMS;
        const defaultFormat = self.options.isBase ? Consts.mimeType.JPEG : Consts.mimeType.PNG;
        self.format = self.options.format || defaultFormat;
        if (!Object.prototype.hasOwnProperty.call(self.options, 'hideTree')) {
            self.hideTree = true;
        }
        if (!Object.prototype.hasOwnProperty.call(self.options, 'hideTitle')) {
            self.hideTitle = false;
        }

        self.proxificationTool = new Proxification(TC.proxify);
    }

    /**
     * Establece la visibilidad de la capa en el mapa.
     * @method setVisibility
     * @memberof SITNA.layer.Layer
     * @instance
     * @param {boolean} visible `true` si se quiere mostrar la capa, `false` si se quiere ocultarla.
     */
    setVisibility(visible) {
        const self = this;
        self.wrap.setVisibility(visible);
        return self;
    }

    /**
     * Obtiene la visibilidad actual de la capa en el mapa.
     * @method getVisibility
     * @memberof SITNA.layer.Layer
     * @instance
     * @returns {boolean} `true` si la capa está visible, `false` si está oculta.
     */
    getVisibility() {
        const self = this;
        if (self.map) {
            if (!self.isBase || self.map.getBaseLayer() === self) {
                return self.wrap.getVisibility();
            }
        }
        return false;
    }

    /**
     * Obtiene la opacidad actual de la capa en el mapa.
     * @method getOpacity
     * @memberof SITNA.layer.Layer
     * @instance
     * @return {number} Número de 0 a 1, siendo 0 completamente transparente y 1 completamente opaca.
     */
    getOpacity() {
        const self = this;
        if (self.map) {
            if (!self.isBase || self.map.getBaseLayer() === self) {
                return self.wrap.layer.getOpacity();
            }
        }
        return 1;
    }

    /**
     * Establece la opacidad de la capa en el mapa. Hay que tener en cuenta que establecer opacidad 0 a una capa no es
     * equivalente a llamar a [setVisibility]{@link SITNA.layer.Layer#setVisibility} con el valor del parámetro `false`.
     * @method setOpacity
     * @memberof SITNA.layer.Layer
     * @instance
     * @param {number} opacity Valor entre `0` (capa transparente) y `1` (capa opaca).
     */
    async setOpacity(opacity, silent) {
        const self = this;
        await self.wrap.setOpacity(opacity);
        self.opacity = opacity;
        if (self.map && !silent) {
            self.map.trigger(Consts.event.LAYEROPACITY, { layer: self, opacity: opacity });
        }
    }

    /*
     * Determina si la capa se puede mostrar en el CRS especificado.
     * @method isCompatible
     * @instance
     * @param {string} crs Cadena con el well-known ID (WKID) del CRS.
     * @return {boolean}
     */
    isCompatible(_crs) {
        return true;
    }

    /*
     * Determina si la capa tiene nombres válidos.
     * @method isValidFromNames
     * @instance
     * @return {boolean}
     */
    isValidFromNames() {
        return true;
    }

    /*
     * Determina si la capa es de tipo raster.
     * @method isRaster
     * @instance
     * @return {boolean}
     */
    isRaster() {
        const self = this;
        switch (self.type) {
            case Consts.layerType.VECTOR:
            case Consts.layerType.KML:
            case Consts.layerType.WFS:
            case Consts.layerType.GROUP:
                return false;
            default:
                return true;
        }
    }

    /*
     * Determina si la capa es visible a la resolución actual. Para ello consulta el documento de capabilities en los casos en que exista.
     * @method isVisibleByScale
     * @instance
     * @return {boolean}
     */
    isVisibleByScale() {
        return true;
    }

    /*
     * Determina si una capa del servicio está establecida en el mapa como visible.
     * @method isVisibleByName
     * @return {boolean}
     */
    isVisibleByName(_name) {
        return true;
    }

    /*
     * <p>Devuelve un árbol de información de la capa. Como mínimo devuelve un nodo raíz con el título de la capa.</p>
     * <p>En capas de servicios WMS es la jerarquía de capas obtenida del documento capabilities. Dependiendo del valor de la propiedad TC.cfg.LayerOptions.{{#crossLink "TC.cfg.LayerOptions/hideTree:property"}}{{/crossLink}},
     * puede mostrar un árbol de todas las capas del servicio o solo un árbol de las capas visibles inicialmente.</p>
     * <p>En capas de documentos KML cada nodo es una carpeta del documento.</p>
     * <p>Si la propiedad TC.cfg.LayerOptions.{{#crossLink "TC.cfg.LayerOptions/stealth:property"}}{{/crossLink}} está establecida a <code>true</code>, este método devuelve <code>null</code>.</p>
     * @method getTree
     * @return {TC.layer.LayerTree}
     */
    getTree() {
        const self = this;
        return { name: self.name, title: self.title };
    }

    /*
     * Devuelve un nodo del árbol de información de la capa.
     * @method findNode
     * @param {string} id Identificador del nodo.
     * @param {TC.layer.LayerTree} parent Nodo desde el que se comienza la búsqueda.
     * @return {TC.layer.LayerTree} Si no se encuentra el nodo el método devuelve <code>null</code>.
     */
    findNode(id, parent) {
        const self = this;
        let result = null;
        if (parent.uid == id) {
            result = parent;
        }
        else {
            for (var i = 0; i < parent.children.length; i++) {
                const r = self.findNode(id, parent.children[i]);
                if (r) {
                    result = r;
                    break;
                }
            }
        }
        return result;
    }

    /*
     * Establece la visibilidad en el mapa de un elemento asociado a un nodo de árbol de la capa. Dependiendo del tipo de capa este elemento
     * es una entidad u otra, así, en capas de tipo WMS son capas de servicio, en KML son carpetas y en capas vectoriales genéricas son grupos de marcadores.
     * @method setNodeVisibility
     * @param {string} id Identificador del nodo.
     * @param {boolean} visible <code>true</code> si se quiere mostrar el elemento, <code>false</code> si se quiere ocultar.
     */
    setNodeVisibility(id, visible) {
        const self = this;
        const tree = self.getTree(true); //const tree = self.getTree(!self.options.hideTree);

        const node = self.findNode(id, tree);
        if (!self.isRoot(node)) {
            const setState = function (n, state) {
                n.visibilityState = state;
                n.children && n.children.forEach(c => setState(c, state));
            };
            if (visible) {
                setState(node, Consts.visibility.VISIBLE);

                let n = node.parent;
                do {
                    if (n.visibilityState !== Consts.visibility.VISIBLE) {
                        n.visibilityState = Consts.visibility.HAS_VISIBLE;
                    }
                    n = n.parent;
                }
                while (n);
            }
            else {
                setState(node, Consts.visibility.NOT_VISIBLE);

                let n = node.parent;
                do {
                    if (n.visibilityState === Consts.visibility.HAS_VISIBLE &&
                        n.children.every(c => c.visibilityState === Consts.visibility.NOT_VISIBLE)) {
                        n.visibilityState = Consts.visibility.NOT_VISIBLE;
                    }
                    n = n.parent;
                }
                while (n);
            }
        }
        return node;
    }

    isRoot(node) {
        const self = this;
        const tree = self.tree || self.getTree(true);
        return node.uid === tree.uid
    }

    /*
     * Obtiene la visibilidad en el mapa de un elemento asociado a un nodo de árbol de la capa. Dependiendo del tipo de capa este elemento
     * es una entidad u otra, así, en capas de tipo WMS son capas de servicio, en KML son carpetas y en capas vectoriales genéricas son grupos de marcadores.
     * @method getNodeVisibility
     * @param {string} id Identificador del nodo.
     * @return {TC.consts.Visibility}
     */
    getNodeVisibility(id, opt_tree) {
        const self = this;
        let tree = opt_tree || self.tree;
        if (!tree) {
            tree = self.getTree(true);
        }
        const node = self.findNode(id, tree);
        if (node) {
            return node.visibilityState;
        }
        return node;
    }

    getResolutions() {
        if (this.wrap.getResolutions) {
            return this.wrap.getResolutions();
        }
        else {
            return [];
        }
    }

    setProjection() {
    }

    clone() {
        const self = this;
        const options = Util.extend(true, {}, self.options, { id: self.id + '_clone' });
        return new self.constructor(options);
    }

    getBySSL_(url) {
        return url.replace(/^(f|ht)tp?:\/\//i, "https://");
    }

    clip(geometry) {
        this.wrap.clip(geometry);
    }

    stroke(geometry, options) {
        this.wrap.stroke(geometry, options);
    }

    #parseCapabilities(data) {
        const self = this;
        let capabilities;

        if (data.documentElement) {

            const serviceException = data.getElementsByTagName('ServiceException')[0];
            if (serviceException) {
                capabilities = { error: serviceException.textContent };
            }
            else {
                var format = self.type === Consts.layerType.WMTS ? new self.wrap.WmtsParser() : new self.wrap.WmsParser();
                capabilities = format.read(data);

                //parsear a manija los tileMatrixSetLimits, que openLayers no lo hace (de momento)
                if (self.type === Consts.layerType.WMTS) {
                    if (capabilities.Contents && capabilities.Contents.Layer) {
                        const layerCollection = data.getElementsByTagName('Layer');
                        for (var i = 0, len = layerCollection.length; i < len; i++) {
                            const curXmlLy = layerCollection[i];
                            var nd = Util.getElementByNodeName(curXmlLy, "ows:Identifier")[0];
                            var id = nd.firstChild.data;

                            var capLy = capabilities.Contents.Layer.filter(function (ly) {
                                return ly.Identifier == id;
                            });

                            if (capLy.length) {
                                capLy = capLy[0];
                                for (var j = 0; j < capLy.TileMatrixSetLink.length; j++) {
                                    var capLink = capLy.TileMatrixSetLink[j];
                                    let matrixId = capLink.TileMatrixSet;

                                    var xmlLink;
                                    const xmlLinks = curXmlLy.getElementsByTagName('TileMatrixSetLink');
                                    for (var k = 0, kk = xmlLinks.length; k < kk; k++) {
                                        const curLink = xmlLinks[k];
                                        if (curLink.querySelector("TileMatrixSet:first").textContent == matrixId) {
                                            xmlLink = curLink;
                                            break;
                                        }
                                    }

                                    if (xmlLink) {
                                        capLink.TileMatrixSetLimits = [];
                                        const tmlCollection = Array.from(xmlLink.getElementsByTagName('TileMatrixLimits'));
                                        tmlCollection.forEach(limit => {
                                            capLink.TileMatrixSetLimits.push({
                                                TileMatrix: limit.getElementsByTagName('TileMatrix')[0].textContent,
                                                MinTileRow: parseInt(limit.getElementsByTagName('MinTileRow')[0].textContent),
                                                MinTileCol: parseInt(limit.getElementsByTagName('MinTileCol')[0].textContent),
                                                MaxTileRow: parseInt(limit.getElementsByTagName('MaxTileRow')[0].textContent),
                                                MaxTileCol: parseInt(limit.getElementsByTagName('MaxTileCol')[0].textContent)
                                            });
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            self.#storeCapabilities(capabilities);
            return Promise.resolve(capabilities);
        }
        else {
            return new Promise(function (resolve, reject) {
                if (isWebWorkerEnabled && typeof data === 'string') {
                    const workerUrl = URL.createObjectURL(wwBlob);
                    var worker = new Worker(workerUrl);
                    worker.onmessage = function (e) {
                        if (e.data.state === 'success') {
                            capabilities = e.data.capabilities;

                            // GLS: Sólo almacenamos si el capabilities es correcto
                            self.#storeCapabilities(capabilities);
                        }
                        else {
                            capabilities = {
                                error: 'Web worker error: ' + self.url
                            };
                            reject(capabilities.error);
                        }

                        resolve(capabilities);
                        worker.terminate();
                    };
                    worker.postMessage({
                        type: self.type,
                        text: data,
                        url: TC.apiLocation.indexOf("http") >= 0 ? TC.apiLocation : document.location.protocol + TC.apiLocation
                    });
                }
                else {
                    capabilities = data;
                    resolve(capabilities);
                }
            });
        }
    }

    #capabilitiesError(reason) {
        return 'No se pudo obtener el documento de capacidades del servicio ' + this.url + ': [' + reason + ']';
    }

    getCapabilitiesOnline() {
        const self = this;
        const result = self.#onlineCapabilitiesPromise = self.#onlineCapabilitiesPromise || new Promise(function (resolve, reject) {
            const url = self.getGetCapabilitiesUrl();

            self.proxificationTool.fetch(url, { retryAttempts: 2 }).then(function (data) {
                self.#parseCapabilities(data.responseText)
                    .then(function (capabilities) {
                        if (capabilities.error) {
                            reject(Error(self.#capabilitiesError(capabilities.error)));
                            return;
                        }
                        resolve(capabilities);
                    })
                    .catch(function (error) {
                        delete self._onlineCapabilitesPromise;
                        reject(Error(error));
                    });
            }).catch(function (dataError) {
                delete self._onlineCapabilitesPromise;
                reject(Error(self.#capabilitiesError(dataError)));
            });

        });
        return result;
    }

    async getCapabilitiesFromStorage() {
        const self = this;
        // Obtenemos el capabilities almacenado en caché
        const url = srcToURL(self.url);
        const value = await localforage.getItem(self.#CAPABILITIES_STORE_KEY_PREFIX + self.type + "." + url.href);
        if (value) {
            return value;
        }
        else {
            throw Error('Capabilities not in storage: ' + url.href);
        }
    }

    #storeCapabilities(capabilities) {
        const self = this;
        // Esperamos a que el mapa se cargue y entonces guardamos el capabilities.
        // Así evitamos que la operación, que es bastante pesada, ocupe tiempo de carga 
        // (con el efecto secundario de que LoadingIndicator esté un tiempo largo apagado durante la carga)
        const url = srcToURL(self.options.url);
        var capKey = self.#CAPABILITIES_STORE_KEY_PREFIX + self.type + "." + url.href;
        var setItem = function () {
            // GLS: antes de guardar, validamos que es un capabilities sin error
            if (Object.prototype.hasOwnProperty.call(capabilities, "error")) {
                return;
            } else {

                self.getCapabilitiesPromise().then(function () {
                    localforage.setItem(capKey, capabilities).catch(err => console.warn(err));
                });
            }
        };
        if (self.map) {
            self.map.loaded(setItem);
        }
        else {
            setItem();
        }
    }

    getGetMapUrl() {
        return cleanOgcUrl(this.wrap.getGetMapUrl());
    }

    getMetadata() {
        return this.#metadata;
    }

    setMetadata(obj, options = {}) {
        if (options.replace) {
            this.#metadata = obj;
        }
        else {
            this.#metadata = { ...this.#metadata, ...obj };
        }
    }
}

export default Layer;

/**
 * Opciones de capa. Este objeto se utiliza al [configurar un mapa]{@linkplain SITNA.MapOptions}, el [control del catálogo de capas]{@linkplain LayerCatalogOptions}
 * o como parámetro al [añadir una capa]{@linkplain SITNA.Map#addLayer}.
 * @typedef LayerOptions
 * @memberof SITNA.layer
 * @see SITNA.MapOptions
 * @see SITNA.control.LayerCatalogOptions
 * @see SITNA.Map#addLayer
 * @see SITNA.Map#setBaseLayer
 * @property {string} id - Identificador único de capa. No puede haber en un mapa dos capas con el mismo valor de `id`.
 * @property {string} [format] - En las capas de tipo [WMS]{@link SITNA.Consts} y [WMTS]{@link SITNA.Consts},
 * es el tipo MIME del formato de archivo de imagen a obtener del servicio. En las capas de tipo [VECTOR]{@link SITNA.Consts}, es el tipo MIME
 * del formato de archivo de datos geográficos que queremos cargar (GeoJSON, KML, etc.).
 *
 * Si esta propiedad no está definida, si la capa es un mapa de fondo (consultar propiedad `isBase`), se asume que el formato es `image/jpeg`, en caso contrario se asume que el formato es `image/png`.
 *
 * Para asignar valor a esta propiedad se puede usar las constantes de definidas en [SITNA.Consts.mimeType]{@link SITNA.Consts}.
 * @property {boolean} [hideTree] - Aplicable a capas de tipo [WMS]{@link SITNA.Consts} y [KML]{@link SITNA.Consts}.
 * Si se establece a `true`, la capa no muestra la jerarquía de grupos de capas en la tabla de contenidos ni en la leyenda.
 * @property {boolean} [isBase] - Si se establece a `true`, la capa es un mapa de fondo.
 * @property {boolean} [isDefault] - *__Obsoleta__: En lugar de esta propiedad es recomendable usar la propiedad `defaultBaseLayer`de {@link SITNA.MapOptions}.*
 *
 * Si se establece a true, la capa se muestra por defecto si forma parte de los mapas de fondo.
 * @property {SITNA.layer.LayerOptions|string} [overviewMapLayer] - Definición de la capa que se utilizará como fondo en el control de mapa de situación cuando esta capa está de fondo en el mapa principal.
 * Si el valor es de tipo `string`, tiene que ser un identificador de capas de la API SITNA (un miembro de [SITNA.Consts.layer]{@link SITNA.Consts}).
 *
 * La capa del mapa de situación debe ser compatible con el sistema de referencia de coordenadas del mapa principal (ver propiedad `crs` de {@link SITNA.MapOptions}).
 * @property {boolean} [stealth] - Si se establece a `true`, la capa no aparece en la tabla de contenidos ni en la leyenda.
 * De este modo se puede añadir una superposición de capas de trabajo que el usuario la perciba como parte del mapa de fondo.
 * @property {string} [thumbnail] - URL de una imagen en miniatura a mostrar en el selector de mapas de fondo.
 * @property {string} [title] - Título de capa. Este valor se mostrará en la tabla de contenidos y la leyenda.
 * @property {string} [type] - Tipo de capa. Si no se especifica se considera que la capa es WMS. La lista de valores posibles está definida en [SITNA.Consts.layerType]{@link SITNA.Consts}.
 * @property {string} [url] - URL del servicio OGC o del archivo de datos geográficos que define la capa. Propiedad obligatoria en capas de tipo [WMS]{@link SITNA.Consts},
 * [WMTS]{@link SITNA.Consts}, [WFS]{@link SITNA.Consts} y [KML]{@link SITNA.Consts}.
 *
 * En las capas de tipo [VECTOR]{@link SITNA.Consts} los archivos de datos geográficos soportados son KML, GeoJSON, GPX, GML, WKT y TopoJSON.
 * El formato se deduce de la extensión del nombre de archivo, pero también se puede especificar utilizando la propiedad `format`.
 *
 * En el caso de que un fichero KML tenga definido el <a target="_blank" href="https://developers.google.com/kml/documentation/kmlreference#balloonstyle">estilo del bocadillo</a>, este formato será usado al renderizar el bocadillo en visores basados en la API SITNA.
 * @example <caption>Ejemplo de uso de la propiedad `url` - [Ver en vivo](../examples/cfg.LayerOptions.url.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
 *     SITNA.Cfg.layout = "layout/ctl-container";
 *     // Añadimos el control de tabla de contenidos en la primera posición.
 *     SITNA.Cfg.controls.TOC = {
 *         div: "slot1"
 *     };
 *     // Añadimos una capa raster desde un servicio WMS y cuatro capas vectoriales
 *     // a partir de archivos geográficos: GeoJSON, GPX, KML y GML.
 *     SITNA.Cfg.workLayers = [
 *         {
 *             id: "wms",
 *             title: "Camino de Santiago",
 *             type: SITNA.Consts.layerType.WMS,
 *             url: "//idena.navarra.es/ogc/wms",
 *             layerNames: "IDENA:PATRIM_Lin_CaminoSantR",
 *             format: SITNA.Consts.mimeType.PNG
 *         },
 *         {
 *             id: "geojson",
 *             type: SITNA.Consts.layerType.VECTOR,
 *             url: "data/PARQUESNATURALES.json",
 *             format: SITNA.Consts.mimeType.GEOJSON
 *         },
 *         {
 *             id: "gpx",
 *             type: SITNA.Consts.layerType.VECTOR,
 *             url: "data/CAMINOFRANCES.gpx"
 *         },
 *         {
 *             id: "kml",
 *             type: SITNA.Consts.layerType.VECTOR,
 *             url: "data/MUSEOSNAVARRA.kml"
 *         },
 *         {
 *             id: "gml",
 *             type: SITNA.Consts.layerType.VECTOR,
 *             url: "data/ESTACIONESTREN.gml"
 *         },
 *     ];
 *     var map = new SITNA.Map("mapa");
 * </script>
 * @example <caption>Ejemplo de uso de la propiedad `overviewMapLayer` - [Ver en vivo](../examples/cfg.LayerOptions.overviewMapLayer.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Añadimos una capas de fondo con capas asociadas para el mapa de situación
 *     SITNA.Cfg.baseLayers = [
 *         {
 *             id: "hybrid",
 *             title: "Mapa base/ortofoto",
 *             type: SITNA.Consts.layerType.WMS,
 *             url: "//idena.navarra.es/ogc/wms",
 *             layerNames: "mapaBase_orto",
 *             thumbnail: "//idena.navarra.es/navegar/api/TC/css/img/thumb-base_ortho.png",
 *             overviewMapLayer: {
 *                 id: "hybrid_ov",
 *                 type: SITNA.Consts.layerType.WMS,
 *                 url: "//www.ign.es/wms-inspire/ign-base",
 *                 layerNames: "IGNBaseTodo-gris"
 *             }
 *         },
 *         {
 *             id: "mapbox",
 *             title: "Mapbox Streets",
 *             type: SITNA.Consts.layerType.WMTS,
 *             encoding: SITNA.Consts.WMTSEncoding.RESTFUL,
 *             url: "//idena.navarra.es/navegar/api/wmts/mapbox/",
 *             format: SITNA.Consts.mimeType.PNG,
 *             layerNames: "streets",
 *             matrixSet: "WorldWebMercatorQuad",
 *             thumbnail: "//idena.navarra.es/navegar/api/TC/css/img/thumb-mapbox-streets.png",
 *             overviewMapLayer: SITNA.Consts.layer.CARTO_DARK
 *         }
 *     ];
 *     var map = new SITNA.Map("mapa");
 * </script>
 */


/**
 * Árbol de elementos de capa.
 * @typedef LayerTree
 * @ignore
 * @property {LayerTree} [children] - Lista de nodos hijos del nodo actual.
 * @property {string} [legend] - URL de la imagen con la leyenda de la capa.
 * @property {string} [name] - Nombre de capa en servicios WMS o WMTS.
 * @property {string} [title] - Título de nodo. Es un texto descriptivo para el usuario.
 * @property {string} [uid] - Identificador único del nodo.
 */

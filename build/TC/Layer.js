

/**
 * Opciones de capa.
 * Esta clase no tiene constructor.
 * @class TC.cfg.LayerOptions
 * @static
 */
/**
 * Identificador único de capa.
 * @property id
 * @type string|undefined
 */
/**
 * Título de capa. Este valor se mostrará en la tabla de contenidos y la leyenda.
 * @property title
 * @type string|undefined
 */
/**
 * Tipo de capa. Si no se especifica se considera que la capa es WMS. La lista de valores posibles está definida en {{#crossLink "TC.consts.LayerType"}}{{/crossLink}}.
 * @property type
 * @type string|undefined
 */
/**
 * Tipo MIME del formato de archivo de imagen a obtener del servicio. Si esta propiedad no está definida, se comprobará si la capa es un mapa de fondo 
 * (consultar propiedad {{#crossLink "TC.cfg.LayerOptions/isBase:property"}}{{/crossLink}}). En caso afirmativo, el formato elegido será <code>"image/jpeg"</code>, 
 * de lo contrario el formato será <code>"image/png"</code>.
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
 * Aplicable a capas de tipo WMS y KML. La capa no muestra la jerarquía de grupos de capas en la tabla de contenidos ni en la leyenda.
 * @property hideTree
 * @type boolean|undefined
 */
/**
 * La capa no muestra su título cuando es añadida al control de capas de trabajo.
 * @property hideTitle
 * @type boolean|undefined
 * @default false
 */
/**
 * La capa no aparece en la tabla de contenidos ni en la leyenda. De este modo se puede añadir una superposición de capas de trabajo que el usuario la perciba como parte del mapa de fondo.
 * @property stealth
 * @type boolean|undefined
 */
/**
 * URL de una imagen en miniatura a mostrar en el selector de mapas de fondo.
 * @property thumbnail
 * @type string|undefined
 */
/**
 * Opciones de clustering de puntos.
 * @property cluster
 * @type TC.cfg.ClusterOptions|undefined
 */

/**
 * Árbol de elementos de capa.
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
 * Título de capa. Es un texto descriptivo para el usuario.
 * @property title
 * @type string|undefined
 */
/**
 * Identificador único de la capa.
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
 * Capa de mapa. Esta clase no debería instanciarse directamente, sino mediante alguna de las clases que heredan de ella.
 * @class TC.Layer
 * @constructor
 * @async
 * @param {TC.cfg.LayerOptions} [options] Objeto de opciones de configuración de la capa.
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
    TC.Util.extend(_layer, _layer.options);

    _layer.PROTOCOL_REGEX = /^(f|ht)tp?:\/\//i;

    /**
     * Identificador de capa, debe ser único en el mapa. Si no se asigna en las opciones del constructor, se genera uno automáticamente.
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

    /**
     * Fragmento HTML para utilizar como leyenda.
     * @property customLegend
     * @type string
     */
    _layer.customLegend = _layer.options.customLegend; 
    var defaultFormat = _layer.options.isBase ? TC.Consts.mimeType.JPEG : TC.Consts.mimeType.PNG;
    _layer.options.format = _layer.options.format || defaultFormat;

    if (_layer.options.owner) {
        _layer.owner = _layer.options.owner;
    }

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
     * Árbol de los componentes de la capa. Estos componentes son distintos según el tipo de capa: así, en una capa WMS son las distintas capas del servicio, 
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

TC.Layer.prototype.CAPABILITIES_STORE_KEY_PREFIX = 'TC.capabilities.';

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
 * @return {boolean} <code>true</code> si la capa está visible, <code>false</code> si está oculta.
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
            result = layer.wrap.layer.getOpacity();
        }
    }
    return result;
};

/**
 * Establece la opacidad de la capa en el mapa. Hay que tener en cuenta que establecer opacidad 0 a una capa no es 
 * equivalente que llamar a TC.Layer.{{#crossLink "TC.Layer/setVisibility:method"}}{{/crossLink}} con el valor del parámetro <code>false</code>.
 * @method setOpacity
 * @param {number} opacity Valor entre <code>0</code> (capa transparente) y <code>1</code> (capa opaca).
 * @param {boolean} mute Indica si al establecer opacidad no se lanza evento LAYEROPACITY.
 */
TC.Layer.prototype.setOpacity = function (opacity, mute) {
    var layer = this;
    this.wrap.getLayer().then(function (olLayer) {
        olLayer.setOpacity(opacity);
        layer.opacity = opacity;
        if (layer.map && !mute) {
            layer.map.trigger(TC.Consts.event.LAYEROPACITY, { layer: layer, opacity: opacity });
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
 * Determina si la capa tiene nombres válidos.
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
 * Determina si la capa es visible a la resolución actual. Para ello consulta el documento de capabilities en los casos en que exista.
 * @method isVisibleByScale
 * @return {boolean}
 */
TC.Layer.prototype.isVisibleByScale = function (name) {
    return true;
};


/**
 * Determina si una capa del servicio está establecida en el mapa como visible.
 * @method isVisibleByName
 * @return {boolean}
 */
TC.Layer.prototype.isVisibleByName = function (name) {
    return true;
};

/**
 * <p>Devuelve un árbol de información de la capa. Como mínimo devuelve un nodo raíz con el título de la capa.</p>
 * <p>En capas de servicios WMS es la jerarquía de capas obtenida del documento capabilities. Dependiendo del valor de la propiedad TC.cfg.LayerOptions.{{#crossLink "TC.cfg.LayerOptions/hideTree:property"}}{{/crossLink}}, 
 * puede mostrar un árbol de todas las capas del servicio o solo un árbol de las capas visibles inicialmente.</p>
 * <p>En capas de documentos KML cada nodo es una carpeta del documento.</p>
 * <p>Si la propiedad TC.cfg.LayerOptions.{{#crossLink "TC.cfg.LayerOptions/stealth:property"}}{{/crossLink}} está establecida a <code>true</code>, este método devuelve <code>null</code>.</p>
 * @method getTree
 * @return {TC.layer.LayerTree}
 */
TC.Layer.prototype.getTree = function () {
    var _layer = this;
    var result = { name: _layer.name, title: _layer.title };
    return result;
};

/**
 * Devuelve un nodo del árbol de información de la capa.
 * @method findNode
 * @param {string} id Identificador del nodo.
 * @param {TC.layer.LayerTree} parent Nodo desde el que se comienza la búsqueda.
 * @return {TC.layer.LayerTree} Si no se encuentra el nodo el método devuelve <code>null</code>.
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
 * Establece la visibilidad en el mapa de un elemento asociado a un nodo de árbol de la capa. Dependiendo del tipo de capa este elemento 
 * es una entidad u otra, así, en capas de tipo WMS son capas de servicio, en KML son carpetas y en capas vectoriales genéricas son grupos de marcadores.
 * @method setNodeVisibility
 * @param {string} id Identificador del nodo.
 * @param {boolean} visible <code>true</code> si se quiere mostrar el elemento, <code>false</code> si se quiere ocultar.
 */
TC.Layer.prototype.setNodeVisibility = function (id, visible) {
    this.setVisibility(visible);
};

/**
 * Obtiene la visibilidad en el mapa de un elemento asociado a un nodo de árbol de la capa. Dependiendo del tipo de capa este elemento 
 * es una entidad u otra, así, en capas de tipo WMS son capas de servicio, en KML son carpetas y en capas vectoriales genéricas son grupos de marcadores.
 * @method getNodeVisibility
 * @param {string} id Identificador del nodo.
 * @return {TC.consts.Visibility}
 */
TC.Layer.prototype.getNodeVisibility = function (id) {
    return TC.Consts.visibility.VISIBLE;
};


TC.Layer.prototype.getResolutions = function () {
    if (this.wrap.getResolutions) {
        return this.wrap.getResolutions();
    }
    else {
        return [];
    }
};

TC.Layer.prototype.setProjection = function () {
};

TC.Layer.prototype.clone = function () {
    const self = this;
    const options = TC.Util.extend(true, {}, self.options, { id: self.id + '_clone' });
    return new self.constructor(options);
};

TC.Layer.prototype.getBySSL_ = function (url) {
    var self = this;

    return url.replace(self.PROTOCOL_REGEX, "https://");
};

TC.Layer.prototype.clip = function (geometry) {
    this.wrap.clip(geometry);
};

TC.Layer.prototype.stroke = function (geometry, options) {
    this.wrap.stroke(geometry, options);
};

(function () {
    const isWebWorkerEnabled = window.hasOwnProperty('Worker');
    const wwPromise = TC.Util.getWebWorkerCrossOriginURL(TC.apiLocation + 'TC/workers/tc-caps-web-worker.js');

    const parseCapabilities = function (layer, data) {
        var capabilities;

        if (data.documentElement) {

            const serviceException = data.getElementsByTagName('ServiceException')[0];
            if (serviceException) {
                capabilities = { error: serviceException.textContent };
            }
            else {
                var format = (layer.type === TC.Consts.layerType.WMTS) ? new layer.wrap.WmtsParser() : new layer.wrap.WmsParser();
                capabilities = format.read(data);

                //parsear a manija los tileMatrixSetLimits, que openLayers no lo hace (de momento)
                if (layer.type === TC.Consts.layerType.WMTS) {
                    if (capabilities.Contents && capabilities.Contents.Layer) {
                        const layerCollection = data.getElementsByTagName('Layer');
                        for (var i = 0, len = layerCollection.length; i < len; i++) {
                            const curXmlLy = layerCollection[i];
                            var nd = TC.Util.getElementByNodeName(curXmlLy, "ows:Identifier")[0];
                            var id = nd.firstChild.data;

                            var capLy = capabilities.Contents.Layer.filter(function (ly) {
                                return ly.Identifier == id;
                            });

                            if (capLy.length) {
                                capLy = capLy[0];
                                for (var j = 0; j < capLy.TileMatrixSetLink.length; j++) {
                                    var capLink = capLy.TileMatrixSetLink[j];
                                    matrixId = capLink.TileMatrixSet;

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
                                        const tmlCollection = xmlLink.getElementsByTagName('TileMatrixLimits');
                                        for (var k = 0, kk = tmlCollection.length; k < kk; k++) {
                                            const lim = tmlCollection[k];
                                            capLink.TileMatrixSetLimits.push({
                                                TileMatrix: lim.getElementsByTagName('TileMatrix')[0].textContent,
                                                MinTileRow: parseInt(lim.getElementsByTagName('MinTileRow')[0].textContent),
                                                MinTileCol: parseInt(lim.getElementsByTagName('MinTileCol')[0].textContent),
                                                MaxTileRow: parseInt(lim.getElementsByTagName('MaxTileRow')[0].textContent),
                                                MaxTileCol: parseInt(lim.getElementsByTagName('MaxTileCol')[0].textContent)
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            storeCapabilities(layer, capabilities);
            return Promise.resolve(capabilities);
        }
        else {
            return new Promise(function (resolve, reject) {
                if (isWebWorkerEnabled && typeof data === 'string') {
                    wwPromise.then(function (wwUrl) {
                        var worker = new Worker(wwUrl);
                        worker.onmessage = function (e) {
                            if (e.data.state === 'success') {
                                capabilities = e.data.capabilities;

                                // GLS: Sólo almacenamos si el capabilities es correcto
                                storeCapabilities(layer, capabilities);
                            }
                            else {
                                capabilities = {
                                    error: 'Web worker error: ' + layer.url
                                }
                                reject(capabilities.error);
                            }

                            resolve(capabilities);
                            worker.terminate();
                        };
                        worker.postMessage({
                            type: layer.type,
                            text: data,
                            url: (TC.apiLocation.indexOf("http") >= 0 ? TC.apiLocation : document.location.protocol + TC.apiLocation)
                        });
                    })
                }
                else {
                    capabilities = data;
                    resolve(capabilities);
                }
            });
        }
    };

    const capabilitiesError = function (layer, reason) {
        return 'No se pudo obtener el documento de capacidades del servicio ' + layer.url + ': [' + reason + ']';
    };    

    const getCapabilitiesOnline = function () {
        const layer = this;
        const result = layer._onlineCapabilitiesPromise = layer._onlineCapabilitiesPromise || new Promise(function (resolve, reject) {
            const url = layer.getGetCapabilitiesUrl();

            layer.toolProxification.fetch(url, { retryAttempts: 2 }).then(function (data) {
                parseCapabilities(layer, data.responseText)
                    .then(function (capabilities) {
                        if (capabilities.error) {
                            reject(Error(capabilitiesError(layer, capabilities.error)));
                            return;
                        }
                        resolve(capabilities);
                    })
                    .catch(function (error) {
                        delete layer._onlineCapabilitesPromise;
                        reject(Error(error));
                    });
            }).catch(function (dataError) {
                delete layer._onlineCapabilitesPromise;
                reject(Error(capabilitiesError(layer, dataError)));
            });

        });
        return result;
    };

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

            anchor.origin = (anchor.protocol.length === 0 ? window.location.protocol : anchor.protocol) + "//" + anchor.hostname + (anchor.port && (src.indexOf(anchor.port) > -1) ? ':' + anchor.port : '');
        }

        return anchor;
    };

    const getCapabilitiesFromStorage = function () {
        var layer = this;
        return new Promise(function (resolve, reject) {
            // Obtenemos el capabilities almacenado en caché
            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                const url = srcToURL(layer.url);
                localforage.getItem(layer.CAPABILITIES_STORE_KEY_PREFIX + layer.type + "." + url.href)
                    .then(function (value) {
                        if (value) {
                            resolve(value);
                        }
                        else {
                            reject(Error('Capabilities not in storage: ' + url.href));
                        }
                    })
                    .catch(function () {
                        reject(Error('Undefined storage error'));
                    });
            });
        });
    };

    const storeCapabilities = function (layer, capabilities) {
        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {

            // Esperamos a que el mapa se cargue y entonces guardamos el capabilities.
            // Así evitamos que la operación, que es bastante pesada, ocupe tiempo de carga 
            // (con el efecto secundario de que LoadingIndicator esté un tiempo largo apagado durante la carga)
            const url = srcToURL(layer.options.url);
            var capKey = layer.CAPABILITIES_STORE_KEY_PREFIX + layer.type + "." + url.href; 
            var setItem = function () {
                // GLS: antes de guardar, validamos que es un capabilities sin error
                if (capabilities.hasOwnProperty("error")) {
                    return;
                } else {

                    layer.getCapabilitiesPromise().then(function () {
                        localforage.setItem(capKey, capabilities).catch(err => console.log(err));
                    });
                }
            };
            if (layer.map) {
                layer.map.loaded(setItem);
            }
            else {
                setItem();
            }
        });
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
    TC.Layer.prototype.getGetMapUrl = function () {
        return cleanOgcUrl(this.wrap.getGetMapUrl());
    };

    TC.Layer.prototype.getCapabilitiesOnline = getCapabilitiesOnline
    TC.Layer.prototype.getCapabilitiesFromStorage = getCapabilitiesFromStorage
})();




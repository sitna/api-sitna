
/**
  * Opciones del editor de capas WFS.
  * 
  * Si se desea que este control pueda funcionar en sesiones sin acceso a Internet, es necesario instalar 
  * en el ámbito de la aplicación que contiene el visor el _[Service Worker](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)_ 
  * creado para el funcionamiento de este control en modo desconectado.
  * Para ello basta con copiar el archivo [tc-cb-service-worker.js](https://raw.githubusercontent.com/sitna/api-sitna/master/TC/workers/tc-cb-service-worker.js) a la carpeta raíz de dicha aplicación.
  * @typedef WFSEditOptions
  * @extends ControlOptions
  * @ignore
  * @see MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {ElevationOptions|boolean} [downloadElevation=false] - Si se establece a un valor verdadero, el control ofrecerá la opción de añadir elevaciones 
  * a las geometrías cuando se descarguen las entidades.
  * @property {boolean} [highlightChanges=true] - Si se establece a un valor verdadero, se resaltarán en el mapa con estilo distintivo
  * las entidades modificadas, con un estilo distinto según el tipo de edición (entidad añadida, modificada o eliminada).
  * @property {boolean} [showOriginalFeatures=false] - Si se establece a un valor verdadero, se mostrarán en el mapa las entidades
  * modificadas junto con las mismas entidades antes de ser modificadas, para poder establecer comparaciones.
  * @property {boolean} [snapping=true] - Si se establece a un valor verdadero, la edición de geometrías tendrá un comportamiento 
  * en el que los vértices se "pegarán" y alinearán con otros vértices y aristas al acercarlos a ellos, a la manera de imanes.
  * @property {StyleOptions} [styles] - Opciones de los estilos de las entidades editadas, por tipo de geometría.
  * @example <caption>[Ver en vivo](../examples/cfg.WFSEditOptions.html)</caption> {@lang html}
  * <div id="mapa"></div>
  * <script>
  *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
  *     SITNA.Cfg.layout = "layout/ctl-container";
  *     // Añadimos el control multiFeatureInfo.
  *     SITNA.Cfg.controls.WFSEdit = {
  *         div: "slot1",
  *         downloadElevation: { // Si se desacargan las entidades, se ofrece la opción de añadirles elevaciones
  *             resolution: 20 // Si se interpolan puntos intermedios, por defecto se añadirán cada 20 metros
  *         }
  *     };
  *     // Añadimos una capa WMS sobre la que hacer las consultas.
  *     // El servicio WMS de IDENA tiene un servicio WFS asociado (imprescindible para consultas por línea o recinto).
  *     SITNA.Cfg.workLayers = [
  *         {
  *             id: "cp",
  *             type: SITNA.Consts.layerType.WMS,
  *             url: "https://idena.navarra.es/ogc/wms",
  *             layerNames: ["IDENA:PATRIM_Pol_Merindades"]
  *         }
  *     ];
  *     var map = new SITNA.Map("mapa");
  * </script>
  */

TC.control = TC.control || {};

if (!TC.control.SWCacheClient) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/SWCacheClient');
}

TC.control.WFSEdit = function () {
    const self = this;

    TC.control.SWCacheClient.apply(this, arguments);
    self.serviceWorkerIsRequired = self.options.serviceWorkerIsRequired || false;

    self._classSelector = '.' + self.CLASS;

    self.layer = null;
    //self.feature = self.options.feature ? self.options.feature : null;
    self.callback = TC.Util.isFunction(arguments[2]) ? arguments[2] : (self.options.callback ? self.options.callback : null);
    self.layersEditData = {};
    self.showsOriginalFeatures = (typeof self.options.showOriginalFeatures === 'boolean') ? self.options.showOriginalFeatures : false;
    self.highlightsAdded = self.highlightsModified = self.highlightsRemoved = (typeof self.options.highlightChanges === 'boolean') ? self.options.highlightChanges : true;
    if (!TC.Util.isFunction(self.options.getBeforeEditLayerStyleFunction)) {
        self.getBeforeEditLayerStyleFunction = self.getBeforeEditLayerStyle;
    }
    self.styles = self.options.styles || {
        point: {
            fillColor: "#0000aa",
            fillOpacity: 0.1,
            strokeColor: "#0000aa",
            strokeWidth: 2,
            strokeOpacity: 1,
            radius: 6
        },
        line: {
            strokeColor: "#0000aa",
            strokeWidth: 2,
            strokeOpacity: 1
        },
        polygon: {
            fillColor: "#0000aa",
            fillOpacity: 0.1,
            strokeColor: "#0000aa",
            strokeWidth: 2,
            strokeOpacity: 1
        }
    }
};

TC.inherit(TC.control.WFSEdit, TC.control.SWCacheClient);

(function () {
    var newFeatureIdNumber = 0;
    const getNewFeatureId = function () {
        return "NewFeature." + newFeatureIdNumber++;
    };

    const setSyncState = function (ctl) {
        const layerEditData = ctl.getLayerEditData();
        ctl._saveBtn.disabled = !(navigator.onLine && layerEditData && layerEditData.checkedOut) || ctl.isSyncing;
    };

    const setEditState = function (ctl, enabled) {
        ctl.div.querySelector(ctl._classSelector + '-view').classList.toggle(TC.Consts.classes.HIDDEN, !enabled || !ctl.layer || !(ctl.layer.type === TC.Consts.layerType.WFS || ctl.layer.type === TC.Consts.layerType.WMS));
        if (ctl.layer && ctl.layer.wfsLayer) {
            const isLayerCropped = TC.filter && TC.filter.Bbox && ctl.layer.wfsLayer.properties instanceof TC.filter.Bbox;
            ctl._recropBtn.classList.toggle(TC.Consts.classes.HIDDEN, !isLayerCropped);
        }
        ctl.div.querySelector(ctl._classSelector + '-edit').classList.toggle(TC.Consts.classes.HIDDEN, !enabled);
    };

    const setChangesButtonsState = function (ctl) {
        setSyncState(ctl);
        const layerEditData = ctl.getLayerEditData();
        ctl._discardBtn.disabled = !layerEditData || !layerEditData.checkedOut;
    };

    const setChangedState = function (ctl, isChanged) {
        if (ctl.layer) {
            const layerEditData = ctl.getLayerEditData();
            if (typeof isChanged !== 'undefined') {
                layerEditData.checkedOut = isChanged;
                setChangesButtonsState(ctl);
            }
            else {
                TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                    var storagePrefix = getStoragePrefix(ctl);
                    localforage.keys().then(function (keys) {
                        if (keys) {
                            var disabled = true;
                            for (var i = 0, len = keys.length; i < len; i++) {
                                if (keys[i].indexOf(storagePrefix) === 0) {
                                    disabled = false;
                                    break;
                                }
                            }
                            layerEditData.checkedOut = !disabled;
                            setChangesButtonsState(ctl);
                        }
                    });
                });
            }
        }
        else {
            setChangesButtonsState(ctl);
        }
    };

    const storeFeature = function (key, feature) {
        return new Promise(function (resolve, reject) {
            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                var obj;
                var geometryType;
                switch (true) {
                    case feature instanceof TC.feature.Polygon:
                        geometryType = TC.Consts.geom.POLYGON;
                        break;
                    case feature instanceof TC.feature.Polyline:
                        geometryType = TC.Consts.geom.POLYLINE;
                        break;
                    case feature instanceof TC.feature.Point:
                        geometryType = TC.Consts.geom.POINT;
                        break;
                    case feature instanceof TC.feature.MultiPolygon:
                        geometryType = TC.Consts.geom.MULTIPOLYGON;
                        break;
                    case feature instanceof TC.feature.MultiPolyline:
                        geometryType = TC.Consts.geom.MULTIPOLYLINE;
                        break;
                }
                obj = {
                    id: feature.id || feature.provId,
                    attributes: feature.data,
                    type: geometryType,
                    geometry: feature.geometry,
                }
                localforage.setItem(key, obj)
                    .then(function () {
                        resolve({ feature: feature });
                    })
                    .catch(function (error) {
                        reject({ feature: feature, error: error });
                    });
            });
        });
    };


    const deleteFeature = function (key) {
        return new Promise(function (resolve, reject) {
            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                localforage.removeItem(key)
                    .then(function () {
                        resolve(key);
                    })
                    .catch(function (error) {
                        reject(Error(error));
                    });
            });
        });
    };

    const readFeature = function (key) {
        return new Promise(function (resolve, reject) {
            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                localforage.getItem(key)
                    .then(function (value) {
                        resolve({
                            key: key,
                            feature: value
                        });
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            });
        });
    };

    const getLayerStoreID = function (layer) {
        let featureType = layer.options.featureType[0];
        if (featureType.indexOf(':') < 0) {
            featureType = layer.options.featureNS + ':' + featureType;
        }
        return featureType + '@' + layer.options.url;
    };

    const getStoragePrefix = function (ctl, layer) {
        return ctl.LOCAL_STORAGE_KEY_PREFIX + getLayerStoreID(layer || ctl.layer.wfsLayer || ctl.layer);
    };

    const getAddedStoragePrefix = function (ctl, layer) {
        return getStoragePrefix(ctl, layer) + ctl.LOCAL_STORAGE_ADDED_KEY_PREFIX;
    };

    const getModifiedStoragePrefix = function (ctl, layer) {
        return getStoragePrefix(ctl, layer) + ctl.LOCAL_STORAGE_MODIFIED_KEY_PREFIX;
    };

    const getRemovedStoragePrefix = function (ctl, layer) {
        return getStoragePrefix(ctl, layer) + ctl.LOCAL_STORAGE_REMOVED_KEY_PREFIX;
    };

    const getLayerTitle = function (layer) {
        return layer.getPath ? layer.getPath().join(' • ') : (layer.title || layer.id)
    };

    const ctlProto = TC.control.WFSEdit.prototype;

    ctlProto.CLASS = 'tc-ctl-wfsedit';

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-wfsedit.hbs";

    ctlProto.LOCAL_STORAGE_KEY_PREFIX = "TC.offline.edit.";
    ctlProto.LOCAL_STORAGE_ADDED_KEY_PREFIX = ".added.";
    ctlProto.LOCAL_STORAGE_MODIFIED_KEY_PREFIX = ".modified.";
    ctlProto.LOCAL_STORAGE_REMOVED_KEY_PREFIX = ".removed.";

    ctlProto.register = function (map) {
        const self = this;

        return new Promise(function (resolve, reject) {

            TC.control.SWCacheClient.prototype.register.call(self, map).then(function () {

                window.addEventListener('online', function () {
                    setSyncState(self);
                });
                window.addEventListener('offline', function () {
                    setSyncState(self);
                });

                self._editPromise = map.addControl('edit', {
                    id: self.getUID(),
                    div: self.div.querySelector(`.${self.CLASS}-edit`),
                    styles: self.styles,
                    downloadElevation: self.options.downloadElevation,
                    snapping: self.options.snapping
                });
                self._editPromise.then(function (ctl) {
                    self.editControl = ctl;

                    self.editControl.getAvailableFeaturesToImport = function () {
                        const candidates = Object.getPrototypeOf(self.editControl).getAvailableFeaturesToImport.call(self.editControl);
                        const layerEditData = self.getLayerEditData();
                        return candidates.filter(obj => {
                            const layer = map.getLayer(obj.id);
                            return layer !== layerEditData.addedFeaturesLayer &&
                                layer !== layerEditData.modifiedFeaturesLayer &&
                                layer !== layerEditData.removedFeaturesLayer &&
                                layer !== layerEditData.beforeEditLayer;
                        });
                    };
                    self.editControl.importFeatures = function (features) {
                        const featuresToImport = (features || this.featuresToImport || []);
                        const layerEditData = self.getLayerEditData();
                        const newFeatures = layerEditData.attributes ? featuresToImport.map(function (feature) {
                            const properties = {};
                            for (let key in layerEditData.attributes) {
                                properties[key] = feature.data[key];
                            }
                            return new feature.constructor(feature.geometry, { geometryName: layerEditData.geometryName, data: properties });
                        }) : features;
                        Object.getPrototypeOf(self.editControl).importFeatures.call(self.editControl, newFeatures);
                    };
                    self.editControl
                        .on(TC.Consts.event.DRAWEND, function (e) {
                            if (self.getLayerEditData().serializable) {
                                self._storeFeatureAdd(e.feature);
                            }
                        })
                        .on(TC.Consts.event.FEATUREMODIFY, function (e) {
                            const feat = e.feature;
                            const fid = feat.provId || feat.id;
                            const storeSuccess = function () {
                                setChangedState(self, true);
                            };
                            const storeFailure = function () {
                                TC.error(self.getLocaleString('failedWhenSavingModifyOperationInSession'));
                            };
                            const layerEditData = self.getLayerEditData();
                            if (layerEditData.serializable) {
                                let storedFeature = layerEditData.addedFeaturesLayer.getFeatureById(fid);
                                if (storedFeature) {
                                    storedFeature.setCoords(feat.geometry);
                                    storedFeature.setData(feat.getData());
                                    storeFeature(getAddedStoragePrefix(self) + fid, feat).then(storeSuccess, storeFailure);
                                }
                                else {
                                    storedFeature = layerEditData.modifiedFeaturesLayer.getFeatureById(fid);
                                    if (storedFeature) {
                                        storedFeature.setCoords(feat.geometry);
                                        storedFeature.setData(feat.getData());
                                    }
                                    else {
                                        layerEditData.modifiedFeaturesLayer.addFeature(self._createAuxFeature(feat));
                                    }
                                    storeFeature(getModifiedStoragePrefix(self) + fid, feat).then(storeSuccess, storeFailure);
                                }
                            }
                        })
                        .on(TC.Consts.event.FEATUREADD, function (e) {
                            if (self.getLayerEditData().serializable) {
                                self._storeFeatureAdd(e.feature);
                            }
                        })
                        .on(TC.Consts.event.FEATUREREMOVE, function (e) {
                            if (self.getLayerEditData().serializable) {
                                self._storeFeatureRemove(e.feature);
                            }
                        });

                    map.workLayers.forEach(layer => self.addLayer(layer));

                    map
                        .on(TC.Consts.event.LAYERUPDATE, function (e) {
                            const layer = e.layer;
                            if (layer.type === TC.Consts.layerType.WFS && !layer.options.readOnly) {
                                self.getEditableLayer(layer)
                                    .then(l => self.cacheLayer(l))
                                    .catch(err => console.log('Layer not editable: ' + layer.id));
                            }
                        })
                        .on(TC.Consts.event.ZOOM, function (e) {
                            map.workLayers
                                .filter(l => l.wfsLayer)
                                .filter(l => self.layer !== l)
                                .forEach(function (layer) {
                                    layer.wfsLayer = null;
                                    self.getEditableLayer(layer);
                                });
                        })
                        .on(TC.Consts.event.LAYERADD, function (e) {
                            self.addLayer(e.layer);
                        })
                        .on(TC.Consts.event.LAYERREMOVE, function (e) {
                            const layer = e.layer;
                            if (self._removingLayer === layer) {
                                return;
                            }
                            if (self.layer === layer || (layer.wmsLayer && self.layer === layer.wmsLayer)) {
                                self.setLayer(null);
                            }
                            const option = self._layerSelect.querySelector(`option[value="${layer.id}"]`);
                            if (option) {
                                option.parentElement.removeChild(option);
                            }
                        })
                        .on(TC.Consts.event.LAYERERROR, function (e) {
                            const layer = e.layer;
                            if (layer.type === TC.Consts.layerType.WFS && !layer.options.readOnly) {
                                if (e.reason === TC.Consts.WFSErrors.MAX_NUM_FEATURES) {
                                    map.toast(self.getLocaleString('query.msgTooManyResults', { limit: e.data.limit }), { type: TC.Consts.msgType.WARNING });
                                }
                                if (self.layer === layer || (self.layer && self.layer.wfsLayer === layer)) {
                                    delete self.layersEditData[self.layer.id];
                                    self.setLayer(null);
                                }
                                if (layer.wmsLayer) {
                                    map.removeLayer(layer);
                                    layer.wmsLayer.wfsLayer = null;
                                }
                            }
                        });

                    resolve(self);
                });

                map.loaded(function () {
                    self._layerSelect.disabled = false;

                    if (self.options.layer) {
                        self.setLayer(self.options.layer);
                    }
                    else {
                        const wfsLayers = map.workLayers.filter(function (elm) {
                            return elm.type === TC.Consts.layerType.WFS && !elm.options.stealth;
                        });
                        if (wfsLayers.length === 1) {
                            self.setLayer(wfsLayers[0].id);
                        }
                        else {
                            self.setLayer(null);
                        }
                    }

                    self.showOriginalFeatures(self.showsOriginalFeatures);
                });

                map.ready(function () {
                    map.getControlsByClass('TC.control.WorkLayerManager').forEach(function (ctl) {
                        ctl.addLayerTool({
                            renderFn: function (container, layerId) {
                                const className = self.CLASS + '-btn-edit';
                                let button = container.querySelector('button.' + className);
                                if (!button) {
                                    const text = self.getLocaleString('featureEditing');
                                    button = document.createElement('button');
                                    button.innerHTML = text;
                                    button.setAttribute('title', text);
                                    button.classList.add(className);
                                    button.dataset.layerId = layerId;
                                    container.appendChild(button);
                                    const layer = map.getLayer(layerId);
                                    if (layer.type === TC.Consts.layerType.WMS) {
                                        button.classList.add(TC.Consts.classes.LOADING);
                                        layer.getWFSCapabilities()
                                            .catch(() => button.classList.add(TC.Consts.classes.HIDDEN))
                                            .finally(() => button.classList.remove(TC.Consts.classes.LOADING));
                                    }
                                }
                                return button;
                            },
                            updateEvents: [TC.Consts.event.BEFORELAYERUPDATE, TC.Consts.event.LAYERUPDATE, TC.Consts.event.LAYERERROR, TC.Consts.event.CONTROLACTIVATE, TC.Consts.event.CONTROLDEACTIVATE],
                            updateFn: function (e) {
                                const button = this;
                                const layer = map.getLayer(button.dataset.layerId);
                                setTimeout(() => {
                                    button.classList.toggle(TC.Consts.classes.ACTIVE, self.layer === layer);
                                }, 500);
                                button.disabled = !layer || (layer.isRaster() && layer.names.length !== 1);
                            },
                            actionFn: function () {
                                const button = this;
                                const layer = map.getLayer(button.dataset.layerId);
                                const prevLayer = self.layer;
                                button.classList.remove(TC.Consts.classes.ACTIVE);
                                if ((layer.names && layer.names.length === 1) || !layer.isRaster()) {
                                    if (layer && prevLayer !== layer) {
                                        self.setLayer(layer).then(() => {
                                            //button.classList.toggle(TC.Consts.classes.ACTIVE, self.layer === layer);
                                            self.openEditSession();
                                        });
                                    }
                                    else {
                                        self.setLayer(null);
                                    }
                                }
                            }
                        });
                    });
                });
            });
        });
    };

    ctlProto.render = function (callback) {
        const self = this;
        var editLayers = [];
        if (self.map) {
            for (var i = 0, len = self.map.workLayers.length; i < len; i++) {
                var wl = self.map.workLayers[i];
                if (wl.type === TC.Consts.layerType.WFS && !wl.options.stealth) {
                    editLayers.push({
                        id: wl.id,
                        title: wl.title || wl.id
                    });
                }
            }
        }
        return self._set1stRenderPromise(TC.Control.prototype.renderData.call(self, {
            layers: editLayers,
            showOriginalFeatures: self.showsOriginalFeatures,
            highlightChanges: self.highlightsAdded || self.highlightsModified || self.highlightsRemoved,
            controlId: self.id
        }, function () {

            self._layerDiv = self.div.querySelector(self._classSelector + '-layer');
            self._layerSelect = self._layerDiv.querySelector(self._classSelector + '-layer-sel');
            self._layerSelect.addEventListener('change', function (e) {
                setEditState(self, false);
                self.getEditableLayer(self._layerSelect.value)
                    .then(function (layer) {
                        self.setLayer(layer.wmsLayer || layer).then(function () {
                            if (self.layer) {
                                self.openEditSession();
                            }
                        });
                    })
                    .catch(() => {
                        self.setLayer(null);
                    });
            });

            const viewToolsDiv = self.div.querySelector(self._classSelector + '-view');

            self._editingWatch = viewToolsDiv.querySelector(`.${self.CLASS}-view-watch`);
            self._beforeEditLayerWatch = viewToolsDiv.querySelector(`.${self.CLASS}-view-original-watch`);
            self._addedWatch = viewToolsDiv.querySelector(`.${self.CLASS}-view-added-watch`);
            self._modifiedWatch = viewToolsDiv.querySelector(`.${self.CLASS}-view-modified-watch`);
            self._removedWatch = viewToolsDiv.querySelector(`.${self.CLASS}-view-removed-watch`);

            viewToolsDiv.querySelector(`#${self.CLASS}-view-original-cb-${self.id}`).addEventListener('change', function (e) {
                self.showOriginalFeatures(e.target.checked);
            });

            viewToolsDiv.querySelector(`#${self.CLASS}-view-added-cb-${self.id}`).addEventListener('change', function (e) {
                self.highlightAdded(e.target.checked);
            });

            viewToolsDiv.querySelector(`#${self.CLASS}-view-modified-cb-${self.id}`).addEventListener('change', function (e) {
                self.highlightModified(e.target.checked);
            });

            viewToolsDiv.querySelector(`#${self.CLASS}-view-removed-cb-${self.id}`).addEventListener('change', function (e) {
                self.highlightRemoved(e.target.checked);
            });

            const colorRegExp = new RegExp(`${self.CLASS}-view-clr-(.+)-${self.id}`);
            const onColorClick = function (e) {
                const input = this.parentElement.querySelector('input[type=color]');
                const layerEditData = self.getLayerEditData();
                const layer = layerEditData[input.id.match(colorRegExp)[1] + 'FeaturesLayer'];
                switch (layerEditData.geometryType) {
                    case TC.Consts.geom.POINT:
                        input.value = layer.styles.point.strokeColor;
                        break;
                    case TC.Consts.geom.POLYLINE:
                    case TC.Consts.geom.MULTIPOLYLINE:
                        input.value = layer.styles.line.strokeColor;
                        break;
                    default:
                        input.value = layer.styles.polygon.strokeColor;
                        break;
                }
                input.click();
            };

            const onColorChange = function (e) {
                const input = e.target;
                const layerEditData = self.getLayerEditData();
                const prefix = input.id.match(colorRegExp)[1];
                const layer = layerEditData[prefix + 'FeaturesLayer'];
                const newColor = layerEditData[prefix + 'CustomColor'] = input.value;
                switch (layerEditData.geometryType) {
                    case TC.Consts.geom.POINT:
                        layer.styles.point.strokeColor = newColor;
                        break;
                    case TC.Consts.geom.POLYLINE:
                    case TC.Consts.geom.MULTIPOLYLINE:
                        layer.styles.line.strokeColor = newColor;
                        break;
                    default:
                        layer.styles.polygon.strokeColor = newColor;
                        layer.styles.polygon.fillColor = newColor;
                        break;
                }
                layer.setStyles(layer.styles);
                self[`_${prefix}Watch`].src = getLegendImage(layer, layerEditData.geometryType);
            };

            const addedColorInputId = `${self.CLASS}-view-clr-added-${self.id}`;
            viewToolsDiv.querySelector(`label[for="${addedColorInputId}"]`).addEventListener(TC.Consts.event.CLICK, onColorClick, { passive: true });
            document.getElementById(addedColorInputId).addEventListener('change', onColorChange);

            const modifiedColorInputId = `${self.CLASS}-view-clr-modified-${self.id}`;
            viewToolsDiv.querySelector(`label[for="${modifiedColorInputId}"]`).addEventListener(TC.Consts.event.CLICK, onColorClick, { passive: true });
            document.getElementById(modifiedColorInputId).addEventListener('change', onColorChange);

            const removedColorInputId = `${self.CLASS}-view-clr-removed-${self.id}`;
            viewToolsDiv.querySelector(`label[for="${removedColorInputId}"]`).addEventListener(TC.Consts.event.CLICK, onColorClick, { passive: true });
            document.getElementById(removedColorInputId).addEventListener('change', onColorChange);

            self._saveBtn = self.div.querySelector(self._classSelector + '-btn-save');
            self._saveBtn.addEventListener(TC.Consts.event.CLICK, function () {
                TC.confirm(self.getLocaleString('edit.applyEdits.confirm', { layerTitle: getLayerTitle(self.layer) }), function () {
                    self.applyEdits();
                });
            }, { passive: true });
            
            self._discardBtn = self.div.querySelector(self._classSelector + '-btn-discard');
            self._discardBtn.addEventListener(TC.Consts.event.CLICK, function () {
                TC.confirm(self.getLocaleString('edit.discardEdits.confirm', { layerTitle: getLayerTitle(self.layer) }), function () {
                    self.discardEdits();
                });
            }, { passive: true });

            self._recropBtn = self.div.querySelector(`.${self.CLASS}-view button.${self.CLASS}-btn-crop`);
            self._recropBtn.addEventListener(TC.Consts.event.CLICK, function () {
                if (self.layer) {
                    const reload = () => {
                        if (self.layer && self.layer.wfsLayer && TC.filter && TC.filter.Bbox && self.layer.wfsLayer.properties instanceof TC.filter.Bbox) {
                            const layerEditData = self.getLayerEditData();
                            self.layer.wfsLayer.properties = new TC.filter.Bbox(null, self.map.getExtent(), self.map.getCRS());
                            self.layer.wfsLayer.refresh();
                            if (layerEditData.beforeEditLayer) {
                                layerEditData.beforeEditLayer.properties = self.layer.wfsLayer.properties;
                                layerEditData.beforeEditLayer.refresh();
                            }
                        }
                    };
                    const layerEditData = self.getLayerEditData();
                    const editedFeatures = layerEditData.addedFeaturesLayer.features.concat(layerEditData.modifiedFeaturesLayer.features, layerEditData.removedFeaturesLayer.features);
                    if (editedFeatures.length) {
                        TC.loadJS(
                            !TC.Geometry,
                            TC.apiLocation + 'TC/Geometry',
                            function () {
                                let featuresOutside = false;
                                const extent = self.map.getExtent();
                                const bbox = [[extent[0], extent[1]], [extent[0], extent[3]], [extent[2], extent[3]], [extent[2], extent[1]]];
                                for (var i = 0, ii = editedFeatures.length; i < ii; i++) {
                                    if (!TC.Geometry.intersects(editedFeatures[i].geometry, bbox)) {
                                        featuresOutside = true;
                                        break;
                                    }
                                }
                                if (featuresOutside) {
                                    TC.confirm(self.getLocaleString('refreshLayerToCurrentExtent.confirm'), function () {
                                        reload();
                                    });
                                }
                                else {
                                    reload();
                                }
                            }
                        );
                    }
                    else {
                        reload();
                    }
                    
                }
            }, { passive: true });

            if (TC.Util.isFunction(callback)) {
                callback();
            }
        }));
    };

    ctlProto.addLayer = function (layer) {
        const self = this;
        const appendOption = function (layer) {
            const option = document.createElement('option');
            option.setAttribute('value', layer.id);
            option.innerHTML = getLayerTitle(layer);
            self.renderPromise().then(function () {
                self._layerSelect.appendChild(option);
            });
        };
        if (!layer.isBase && !layer.options.readOnly && !layer.options.stealth) {
            self.getEditableLayer(layer)
                .then(function (l) {
                    // Añadimos opción cuando es una capa WMS con WFS asociado o una capa WFS independiente
                    if (layer.isRaster() || !l.wmsLayer) {
                        appendOption(layer);
                    }
                })
                .catch((err) => console.log(`Layer ${layer.id} not editable. Reason: ${err.message}`));
        }
    };

    ctlProto.setLayer = function (layer) {
        const self = this;
        return new Promise(function (resolve, reject) {

            const map = self.map;
            const selector = self.div.querySelector(self._classSelector + '-layer-sel');

            layer = map.getLayer(layer);
            const mapLayer = map.workLayers.filter(l => l === layer)[0];

            const setNewLayer = function () {
                if (mapLayer) {
                    self.getEditableLayer(mapLayer)
                        .then(function (editableLayer) {
                            const endProcess = function () {
                                self.layer = mapLayer;
                                self._enableEditSerialization(mapLayer)
                                    .then(function () {
                                        self.getEditControl().then(c => {
                                            selector.value = self.layer.id;
                                            c.setMode(null);
                                            c.setLayer(editableLayer);
                                            resolve(self.layer);
                                        });
                                    })
                                    .catch((err) => {
                                        self.setLayer(null);
                                        reject(err);
                                    });
                            };

                            if (map.workLayers.indexOf(editableLayer) >= 0) {
                                endProcess();
                            }
                            else {
                                map.addLayer(editableLayer).then(endProcess);
                            }
                        })
                        .catch(() => {
                            self.setLayer(null);
                            resolve(null);
                        });
                }
                else {
                    if (self.layer && self.layer.wfsLayer) {
                        self._removingLayer = self.layer.wfsLayer;
                    }
                    self.getEditControl().then(c => {
                        setEditState(self, false);
                        //setChangedState(self, false);
                        self.closeEditSession()
                            .then(() => {
                                selector.value = '';
                                c.setMode(null);
                                c.setLayer(null);
                                self.layer = null;
                                resolve(null);
                            })
                            .finally(() => {
                                delete self._removingLayer;
                            });
                    });
                }
            };

            if (layer === null || !self.layer) {
                setNewLayer();
            }
            else {
                if (self.layer.wfsLayer) {
                    self._removingLayer = self.layer.wfsLayer;
                }
                self.closeEditSession().then(() => {
                    if (mapLayer) {
                        setNewLayer();
                    }
                });
            }
        });
    };

    ctlProto._storeFeatureAdd = function (feature) {
        const self = this;
        feature.provId = getNewFeatureId();
        const layerEditData = self.getLayerEditData();
        const newFeature = self._createAuxFeature(feature);
        layerEditData.addedFeaturesLayer.addFeature(newFeature);
        storeFeature(getAddedStoragePrefix(self) + feature.provId, newFeature).then(function () {
            setChangedState(self, true);
            //self.map.toast(self.getLocaleString('addOperationSavedInSession'));
        }, function () {
            TC.error(self.getLocaleString('failedWhenSavingAddOperationInSession'));
        });
    };

    ctlProto._storeFeatureRemove = function (feature) {
        const self = this;
        var fid = feature.provId || feature.id;
        var storeSuccess = function () {
            setChangedState(self);
            //self.map.toast(self.getLocaleString('removeOperationSavedInSession'));
        };
        var storeFailure = function () {
            TC.error(self.getLocaleString('failedWhenSavingRemoveOperationInSession'));
        };
        const layerEditData = self.getLayerEditData();
        if (layerEditData.serializable) {
            let storedFeature = layerEditData.addedFeaturesLayer.getFeatureById(fid);
            if (!storedFeature) {
                var removedStoragePrefix = getRemovedStoragePrefix(self);
                storedFeature = layerEditData.modifiedFeaturesLayer.getFeatureById(fid);
                if (!storedFeature) {
                    storedFeature = layerEditData.removedFeaturesLayer.getFeatureById(fid);
                    if (!storedFeature) {
                        layerEditData.removedFeaturesLayer.addFeature(self._createAuxFeature(feature));
                        storeFeature(removedStoragePrefix + fid, feature).then(storeSuccess, storeFailure);
                    }
                }
                else {
                    layerEditData.modifiedFeaturesLayer.removeFeature(storedFeature);
                    layerEditData.removedFeaturesLayer.addFeature(self._createAuxFeature(feature));
                    deleteFeature(getModifiedStoragePrefix(self) + fid).then(function () {
                        storeSuccess();
                        storeFeature(removedStoragePrefix + fid, feature).then(storeSuccess, storeFailure);
                    }, storeFailure);
                }
            }
            else {
                layerEditData.addedFeaturesLayer.removeFeature(storedFeature);
                deleteFeature(getAddedStoragePrefix(self) + fid).then(storeSuccess, storeFailure);
            }
        }
    };

    ctlProto._createAuxFeature = function (feature) {
        const self = this;
        const fid = feature.provId || feature.id;
        const layerEditData = self.getLayerEditData();
        const result = new feature.constructor(feature.geometry, { geometryName: layerEditData.geometryName, data: feature.getData() });
        result.setStyle(null);
        result.setId(fid);
        return result;
    };

    ctlProto.getEditControl = function () {
        const self = this;
        return self._editPromise || new Promise(function (resolve, reject) {
            self.renderPromise().then(() => resolve(self.editControl));
        });
    };

    ctlProto.cacheLayer = function (layer) {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.getServiceWorker().then(function () {
                if (navigator.onLine) {
                    const gfUrl = layer.wrap.getGetFeatureUrl();
                    const dftUrl = layer.getDescribeFeatureTypeUrl();
                    if (gfUrl && dftUrl) {
                        self.createCache(getStoragePrefix(self, layer), {
                            urlList: [gfUrl, dftUrl]
                        }).then(() => resolve(), error => reject(error));
                    }
                    else {
                        resolve();
                    }
                }
                else {
                    resolve();
                }
            }).catch(error => reject(error));
        });
    };

    ctlProto.getFeatureType = function (layer) {
        const self = this;
        return new Promise(function (resolve, reject) {
            layer = layer || self.layer;
            const li = self.map.getLoadingIndicator();
            const waitId = li && li.addWait();
            layer.describeFeatureType()
                .then(function (attributes) {
                    self.getEditControl().then(function (editControl) {
                        const layerEditData = self.getLayerEditData(layer);
                        // recogemos los atributos no geométricos y definimos la geometría
                        layerEditData.attributes = {};
                        for (var key in attributes) {
                            const attr = attributes[key];
                            const geometryType = editControl.getGeometryType(attr.type);
                            if (geometryType) {
                                layerEditData.geometryName = attr.name;
                                layerEditData.geometryType = typeof geometryType === 'boolean' ? null : geometryType;
                            }
                            else {
                                layerEditData.attributes[key] = attr;
                            }
                        }
                        for (var key in layerEditData.attributes) {
                            const attr = layerEditData.attributes[key];
                            attr.type = attr.type.substr(attr.type.indexOf(':') + 1);
                        }
                        resolve(layerEditData);
                    });
                })
                .catch(function (err) {
                    reject(err);
                })
                .finally(() => li && li.removeWait(waitId));
        });
    };

    ctlProto._addAuxLayersToMap = function (layer) {
        const self = this;
        return new Promise(function (resolve, reject) {
            const map = self.map;
            layer = layer || self.layer;
            const layerEditData = self.getLayerEditData(layer);
            const beLayer = layerEditData.beforeEditLayer;
            if (beLayer) {
                const afLayer = layerEditData.addedFeaturesLayer;
                const mfLayer = layerEditData.modifiedFeaturesLayer;
                const rfLayer = layerEditData.removedFeaturesLayer;
                Promise.all([
                    map.addLayer(beLayer),
                    map.addLayer(afLayer),
                    map.addLayer(mfLayer),
                    map.addLayer(rfLayer)
                ]).then(function () {
                    self.getEditableLayer(layer).then(function (editableLayer) {
                        let idx = map.layers.indexOf(editableLayer);
                        beLayer.setVisibility(self.showsOriginalFeatures);
                        afLayer.setVisibility(self.highlightsAdded);
                        mfLayer.setVisibility(self.highlightsModified);
                        rfLayer.setVisibility(self.highlightsRemoved);
                        map.insertLayer(beLayer, ++idx, function () {
                            const newIdx = idx + 1;
                            map.insertLayer(afLayer, newIdx);
                            map.insertLayer(mfLayer, newIdx);
                            map.insertLayer(rfLayer, newIdx);

                            beLayer.setStyles(self.getBeforeEditLayerStyle(editableLayer));
                            afLayer.setStyles(self.getAddedFeaturesLayerStyle(editableLayer));
                            mfLayer.setStyles(self.getModifiedFeaturesLayerStyle(editableLayer));
                            rfLayer.setStyles(self.getRemovedFeaturesLayerStyle(editableLayer));
                            self._editingWatch.src = getLegendImage(editableLayer, layerEditData.geometryType);
                            self._beforeEditLayerWatch.src = getLegendImage(beLayer, layerEditData.geometryType);
                            self._addedWatch.src = getLegendImage(afLayer, layerEditData.geometryType);
                            self._modifiedWatch.src = getLegendImage(mfLayer, layerEditData.geometryType);
                            self._removedWatch.src = getLegendImage(rfLayer, layerEditData.geometryType);
                            resolve();
                        });
                    });
                });
            }
            else {
                reject(new Error(`No auxiliary layers for ${layer.id}`));
            }
        });
    };

    ctlProto.openEditSession = function () {
        const self = this;
        if (!self.layer) {
            return Promise.reject(Error('No layer set for editing'));
        }
        return new Promise(function (resolve, reject) {

            self.getFeatureType() // Obtenemos datos de los atributos y la geometría
                .then(function (layerEditData) {

                    self.getEditControl().then(function (editControl) {
                        self.getEditableLayer(self.layer).then(function (editableLayer) {
                            editControl.setLayer(editableLayer);
                            switch (layerEditData.geometryType) {
                                case TC.Consts.geom.MULTIPOLYLINE:
                                case TC.Consts.geom.MULTIPOLYGON:
                                    editControl.setComplexGeometry(true);
                                    break;
                                default:
                                    editControl.setComplexGeometry(false);
                                    break;
                            }
                            editControl.activate();
                            setEditState(self, true);
                            setChangedState(self);

                            const modes = [TC.control.Edit.mode.MODIFY, TC.control.Edit.mode.OTHER];
                            switch (layerEditData.geometryType) {
                                case TC.Consts.geom.POINT:
                                    modes.push(TC.control.Edit.mode.ADDPOINT);
                                    break;
                                case TC.Consts.geom.POLYLINE:
                                case TC.Consts.geom.MULTIPOLYLINE:
                                    modes.push(TC.control.Edit.mode.ADDLINE);
                                    //modes.push(TC.control.Edit.mode.CUT);
                                    break;
                                case TC.Consts.geom.POLYGON:
                                case TC.Consts.geom.MULTIPOLYGON:
                                    modes.push(TC.control.Edit.mode.ADDPOLYGON);
                                    //modes.push(TC.control.Edit.mode.CUT);
                                    break;
                                default:
                                    break;
                            }
                            editControl.constrainModes(modes);
                            editControl.setMode(TC.control.Edit.mode.MODIFY);

                            self._addAuxLayersToMap()
                                .then(() => resolve())
                                .catch ((err) => reject(err));
                        })
                    });
                })
                .catch(function (err) {
                    if (self.layer && self.layer.type === TC.Consts.layerType.VECTOR) {
                        self.getEditControl().then(function (editControl) {
                            editControl.activate();
                            setEditState(self, true);
                            editControl.setMode(TC.control.Edit.mode.MODIFY);
                            resolve();
                        });
                    }
                    else {
                        reject(err);
                    }
                });
        });
    };

    ctlProto.closeEditSession = function () {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.renderPromise().then(function () {
                setChangedState(self, false);
                self.getEditControl().then(c => c.deactivate());
                const layerEditData = self.getLayerEditData();
                if (layerEditData && layerEditData.beforeEditLayer) {
                    self._editingWatch.src = TC.Consts.BLANK_IMAGE;
                    self._beforeEditLayerWatch.src = TC.Consts.BLANK_IMAGE;
                    self._addedWatch.src = TC.Consts.BLANK_IMAGE;
                    self._modifiedWatch.src = TC.Consts.BLANK_IMAGE;
                    self._removedWatch.src = TC.Consts.BLANK_IMAGE;
                    const previousLayer = self.layer;
                    self.getEditableLayer(self.layer).then(function (editableLayer) {
                        const removePromises = []
                        const removeLayer = function (layer) {
                            if (map.workLayers.indexOf(layer) >= 0) {
                                removePromises.push(map.removeLayer(layer));
                            }
                        };
                        removeLayer(layerEditData.beforeEditLayer);
                        removeLayer(layerEditData.beforeEditLayer);
                        removeLayer(layerEditData.addedFeaturesLayer);
                        removeLayer(layerEditData.modifiedFeaturesLayer);
                        removeLayer(layerEditData.removedFeaturesLayer);
                        if (previousLayer !== editableLayer) {
                            previousLayer.wfsLayer = null;
                            removeLayer(editableLayer);
                        }
                        Promise.all(removePromises).then(() => resolve());
                    });
                }
                else {
                    resolve();
                }
            });
        });
    };

    ctlProto.getEditableLayer = function (layer) {
        const self = this;
        return new Promise(function (resolve, reject) {
            const notEditableErrorMsg = `Layer ${layer.id} not editable`;
            const map = self.map;
            layer = map ? map.getLayer(layer) : layer;
            if (layer) {
                if (layer.type === TC.Consts.layerType.WFS && (layer.wmsLayer || (!layer.options.stealth && !layer.options.readOnly))) {
                    layer.getCapabilitiesPromise().then(() => resolve(layer));
                }
                else if (layer.type === TC.Consts.layerType.WMS) {
                    if (layer.wfsLayer) {
                        layer.wfsLayer.getCapabilitiesPromise().then(() => resolve(layer.wfsLayer));
                    }
                    else {
                        layer.getWFSCapabilities()
                            .then(function (capabilities) {
                                //comprobamos que la solo es una capa y existe en el capabilities del WFS
                                const layers = layer.getDisgregatedLayerNames();
                                const fullLayerName = layers[0];
                                const colonIdx = fullLayerName.indexOf(':');
                                const shortLayerName = fullLayerName.substring(colonIdx + 1);
                                const prefix = 'Edicion'; //fullLayerName.substr(0, colonIdx + 1);
                                if (layers.length !== 1 || capabilities.FeatureTypes.hasOwnProperty(shortLayerName)) {
                                    TC.loadJS(
                                        !TC.layer.Vector,
                                        TC.apiLocation + 'TC/layer/Vector',
                                        function () {
                                            TC.loadJS(
                                                !TC.filter,
                                                TC.apiLocation + 'TC/filter',
                                                async function () {
                                                    const wfsLayerOptions = {
                                                        id: self.getUID(),
                                                        type: TC.Consts.layerType.WFS,
                                                        url: await layer.getWFSURL(),
                                                        properties: map ? new TC.filter.Bbox(null, map.getExtent(), map.getCRS()) : null,
                                                        outputFormat: TC.Consts.format.JSON,
                                                        title: `${layer.getPath().join(' • ')} - ${self.getLocaleString('featureEditing')}`,
                                                        geometryName: 'geom',
                                                        featureType: [fullLayerName],
                                                        featureNS: prefix,
                                                        styles: self.styles,
                                                        stealth: true
                                                    };
                                                    layer.wfsLayer = new TC.layer.Vector(wfsLayerOptions);
                                                    layer.wfsLayer.wmsLayer = layer;
                                                    resolve(layer.wfsLayer);
                                                }
                                            );
                                        }
                                    );
                                }
                                else {
                                    reject(new Error(notEditableErrorMsg));
                                }
                            })
                            .catch((err) => reject(err));
                    }
                }
                else if (layer.type === TC.Consts.layerType.VECTOR) {
                    resolve(layer);
                }
                else {
                    reject(new Error(notEditableErrorMsg));
                }
            }
            else {
                reject(new Error('No layer to edit'));
            }
        });
    };

    ctlProto.isLayerEdited = function (layer) {
        const self = this;
        return new Promise(function (resolve, reject) {
            const storagePrefix = getStoragePrefix(self, layer);
            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                localforage.keys().then(function (keys) {
                    if (keys) {
                        resolve(keys.some(key => key.indexOf(storagePrefix) === 0));
                    }
                    else {
                        resolve(false);
                    }
                });
            });
        });
    };

    ctlProto.getLayerEditData = function (optionalLayer) {
        const self = this;
        const layer = optionalLayer || self.layer;
        if (!layer) {
            return null;
        }
        return self.layersEditData[layer.id] = self.layersEditData[layer.id] || {
            checkedOut: false
        };
    };

    const getLegendImage = function (layer, geometryType) {
        switch (geometryType) {
            case TC.Consts.geom.POINT:
            case TC.Consts.geom.MULTIPOINT:
                return TC.Util.getLegendImageFromStyle(layer.styles.point, { geometryType: TC.Consts.geom.POINT });
            case TC.Consts.geom.POLYLINE:
            case TC.Consts.geom.MULTIPOLYLINE:
                return TC.Util.getLegendImageFromStyle(layer.styles.line, { geometryType: TC.Consts.geom.POLYLINE });
            default:
                return TC.Util.getLegendImageFromStyle(layer.styles.polygon, { geometryType: TC.Consts.geom.POLYGON });
        }
    };

    ctlProto._enableEditSerialization = function (layer) {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.getEditableLayer(layer)
                .then(function (editableLayer) {

                    const endProcess = function () {
                        const layerEditData = self.getLayerEditData(layer);

                        const baseTitle = layer.getPath ? layer.getPath().join(' • ') : (layer.title || layer.id);

                        var beforeEditLayer = layerEditData.beforeEditLayer;
                        if (!beforeEditLayer) {
                            beforeEditLayer = layerEditData.beforeEditLayer = new TC.layer.Vector(TC.Util.extend({}, editableLayer.options, {
                                id: self.getUID(),
                                title: `${baseTitle} - ${self.getLocaleString('dataBeforeEdits')}`,
                                readOnly: true,
                                owner: self,
                                stealth: true
                            }));
                        }

                        var addedFeaturesLayer = layerEditData.addedFeaturesLayer;
                        let aflIsOld = true;
                        if (!addedFeaturesLayer) {
                            aflIsOld = false;
                            addedFeaturesLayer = layerEditData.addedFeaturesLayer = new TC.layer.Vector({
                                id: self.getUID(),
                                title: `${baseTitle} - ${self.getLocaleString('addedFeatures')}`,
                                owner: self,
                                stealth: true,
                                zIndex: 2
                            });
                        }

                        var modifiedFeaturesLayer = layerEditData.modifiedFeaturesLayer;
                        let mflIsOld = true;
                        if (!modifiedFeaturesLayer) {
                            mflIsOld = false;
                            modifiedFeaturesLayer = layerEditData.modifiedFeaturesLayer = new TC.layer.Vector({
                                id: self.getUID(),
                                title: `${baseTitle} - ${self.getLocaleString('modifiedFeatures')}`,
                                owner: self,
                                stealth: true,
                                zIndex: 2
                            });
                        }

                        var removedFeaturesLayer = layerEditData.removedFeaturesLayer;
                        let rflIsOld = true;
                        if (!removedFeaturesLayer) {
                            rflIsOld = false;
                            removedFeaturesLayer = layerEditData.removedFeaturesLayer = new TC.layer.Vector({
                                id: self.getUID(),
                                title: `${baseTitle} - ${self.getLocaleString('removedFeatures')}`,
                                owner: self,
                                stealth: true,
                                zIndex: 2
                            });
                        }

                        const featurePromises = [];
                        if (aflIsOld && mflIsOld && rflIsOld) {
                            // Existen de antes las capas de adiciones, modificaciones y eliminaciones. Leemos de ahí.
                            removedFeaturesLayer.features.forEach(function (removedFeature) {
                                const f = editableLayer.getFeatureById(removedFeature.id);
                                if (f) {
                                    editableLayer.removeFeature(f);
                                }
                            });
                            modifiedFeaturesLayer.features.forEach(function (modifiedFeature) {
                                const f = editableLayer.getFeatureById(modifiedFeature.id);
                                if (f) {
                                    f.setCoords(modifiedFeature.geometry);
                                    f.setData(modifiedFeature.getData());
                                }
                            });
                            addedFeaturesLayer.features.forEach(function (addedFeature) {
                                if (!editableLayer.getFeatureById(addedFeature.id)) {
                                    featurePromises.push(editableLayer.addFeature(self._createAuxFeature(addedFeature)));
                                }
                            });
                            Promise.all(featurePromises).then(() => {
                                layerEditData.serializable = true;
                                resolve(editableLayer);
                            });
                        }
                        else {
                            // Las capas de adiciones, modificaciones y eliminaciones son nuevas. Leemos de local storage.
                            const storagePrefix = getStoragePrefix(self, editableLayer);
                            const addedStoragePrefix = getAddedStoragePrefix(self, editableLayer);
                            const modifiedStoragePrefix = getModifiedStoragePrefix(self, editableLayer);
                            const removedStoragePrefix = getRemovedStoragePrefix(self, editableLayer);
                            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                                //var li = map.getLoadingIndicator();
                                localforage.keys().then(function (keys) {
                                    if (keys) {
                                        keys
                                            .filter(key => key.indexOf(storagePrefix) === 0)
                                            .forEach(function (key) {
                                                //li && li.addWait(uid);
                                                featurePromises.push(new Promise(function (res, rej) {
                                                    readFeature(key).then(function(obj) {
                                                        var id;
                                                        var k = obj.key;
                                                        if (k.indexOf(removedStoragePrefix) === 0) {
                                                            id = k.substr(removedStoragePrefix.length);
                                                            const feature = editableLayer.getFeatureById(id);
                                                            editableLayer.removeFeature(feature);
                                                            removedFeaturesLayer.addFeature(feature).then(() => res(feature));
                                                            //li && li.removeWait(uid);
                                                        }
                                                        else if (k.indexOf(modifiedStoragePrefix) === 0) {
                                                            id = k.substr(modifiedStoragePrefix.length);
                                                            const feature = editableLayer.getFeatureById(id);
                                                            if (feature) {
                                                                feature.setCoords(obj.feature.geometry);
                                                                feature.setData(obj.feature.attributes);
                                                                const newFeature = feature.clone();
                                                                newFeature.setId(feature.id);
                                                                modifiedFeaturesLayer.addFeature(newFeature).then(() => res(feature));
                                                                //li && li.removeWait(uid);
                                                            }
                                                            else {
                                                                res(feature);
                                                            }
                                                        }
                                                        else if (k.indexOf(addedStoragePrefix) === 0) {
                                                            id = k.substr(addedStoragePrefix.length);
                                                            var idNumber = parseInt(id.substr(id.lastIndexOf('.') + 1));
                                                            newFeatureIdNumber = Math.max(newFeatureIdNumber, idNumber + 1);
                                                            var addPromise;
                                                            switch (obj.feature.type) {
                                                                case TC.Consts.geom.POINT:
                                                                    addPromise = editableLayer.addPoint(obj.feature.geometry);
                                                                    break;
                                                                case TC.Consts.geom.POLYLINE:
                                                                    addPromise = editableLayer.addPolyline(obj.feature.geometry);
                                                                    break;
                                                                case TC.Consts.geom.POLYGON:
                                                                    addPromise = editableLayer.addPolygon(obj.feature.geometry);
                                                                    break;
                                                                case TC.Consts.geom.MULTIPOLYLINE:
                                                                    addPromise = editableLayer.addMultiPolyline(obj.feature.geometry);
                                                                    break;
                                                                case TC.Consts.geom.MULTIPOLYGON:
                                                                    addPromise = editableLayer.addMultiPolygon(obj.feature.geometry);
                                                                    break;
                                                                default:
                                                                    break;
                                                            };
                                                            addPromise.then(function (feat) {
                                                                //feat.setStyle(TC.Util.extend({}, layer.styles.line, layer.styles.polygon));
                                                                feat.provId = id;
                                                                feat.setData(obj.feature.attributes);
                                                                const newFeat = feat.clone();
                                                                newFeat.setStyle(null);
                                                                newFeat.setId(feat.provId);
                                                                addedFeaturesLayer.addFeature(newFeat).then(() =>  res(newFeat));
                                                                //li && li.removeWait(uid);
                                                            });
                                                        }
                                                    });
                                                }));
                                            });
                                    }
                                    Promise.all(featurePromises).then(() => {
                                        layerEditData.serializable = true;
                                        resolve(editableLayer);
                                    });
                                });
                            });
                        }
                    };

                    if (editableLayer.type === TC.Consts.layerType.WFS) {
                        if (editableLayer.state === TC.Layer.state.IDLE) {
                            endProcess();
                        }
                        else {
                            const onLayerUpdate = function (e) {
                                if (e.layer === editableLayer) {
                                    endProcess();
                                    self.map.off(TC.Consts.event.LAYERUPDATE, onLayerUpdate);
                                }
                            }
                            self.map.on(TC.Consts.event.LAYERUPDATE, onLayerUpdate);
                        }
                    }
                    else {
                        resolve(editableLayer);
                    }
                });
        });
    };

    ctlProto.applyEdits = function () {
        const self = this;
        if (self.layer) {
            const layerEditData = self.getLayerEditData();
            if (layerEditData.serializable) {
                self.isSyncing = true;
                setSyncState(self);
                const li = self.map.getLoadingIndicator();
                const waitId = li && li.addWait();
                // Copiamos modificadas para ponerle el nombre de atributo de geometría descrito en DescribeFeatureType.
                const modified = layerEditData.modifiedFeaturesLayer.features.map(function (feature) {
                    const result = new feature.constructor(feature.geometry, { geometryName: layerEditData.geometryName });
                    const unmodifiedFeature = layerEditData.beforeEditLayer.features.filter(f => f.id === feature.id)[0];
                    let newData;
                    if (unmodifiedFeature) {
                        newData = {};
                        for (var key in feature.data) {
                            if (key !== 'id') {
                                const oldValue = unmodifiedFeature.data[key];
                                const newValue = feature.data[key];
                                if (oldValue !== newValue) {
                                    newData[key] = newValue;
                                }
                            }
                        }
                    }
                    else {
                        newData = feature.data;
                    }
                    result.setData(newData);
                    result.setId(feature.id);
                    return result;
                });
                self.getEditableLayer(self.layer)
                    .then(function (l) {
                        l.applyEdits(layerEditData.addedFeaturesLayer.features, modified, layerEditData.removedFeaturesLayer.features)
                            .then(function (response) {
                                // SONDA DE PRUEBA, BORRAR EN PRO //
                                if (response.transactionSummary.totalInserted !== layerEditData.addedFeaturesLayer.features.length ||
                                    response.transactionSummary.totalUpdated !== modified.length ||
                                    response.transactionSummary.totalDeleted !== layerEditData.removedFeaturesLayer.features.length) {
                                    TC.error("Error de concordancia de número de entidades en transacción");
                                    console.log(response, layerEditData.addedFeaturesLayer, modified, layerEditData.removedFeaturesLayer);
                                    throw new Error(`Error en transacción: Insertados ${response.transactionSummary.totalInserted}, hay ${layerEditData.addedFeaturesLayer.features.length} en capa`);
                                }
                                ////////////////////////////////////
                                if (self.layer.type === TC.Consts.layerType.WMS) {
                                    self.layer.refresh();
                                }
                                self.deleteCache(getStoragePrefix(self)).then(function () {
                                    self.cacheLayer(l).finally(function () {
                                        self.isSyncing = false;
                                        li && li.removeWait(waitId);
                                        // Las acciones a realizar a partir de este punto son las mismas que al descartar una edición
                                        self.discardEdits();
                                        self.map.toast(self.getLocaleString('changesSuccessfullySyncedWithServer'), { type: TC.Consts.msgType.INFO });
                                    });
                                });
                            })
                            .catch(function (obj) {
                                self.isSyncing = false;
                                setSyncState(self);
                                li && li.removeWait(waitId);
                                TC.error(self.getLocaleString('errorSyncingChanges', { code: obj.code, reason: obj.reason }), [TC.Consts.msgErrorMode.TOAST, TC.Consts.msgErrorMode.CONSOLE]);
                            });
                    });
            }
        }
    };

    ctlProto.discardEdits = function () {
        var self = this;
        self._joinedFeatureAttributes = [];
        var storagePrefix = getStoragePrefix(self);
        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
            localforage.keys().then(function (keys) {
                if (keys) {
                    for (var i = 0, len = keys.length; i < len; i++) {
                        var key = keys[i];
                        if (key.indexOf(storagePrefix) === 0) {
                            localforage.removeItem(key);
                        }
                    }
                    if (self.layer) {
                        const layerEditData = self.getLayerEditData();
                        if (layerEditData.serializable) {
                            layerEditData.addedFeaturesLayer.clearFeatures();
                            layerEditData.modifiedFeaturesLayer.clearFeatures();
                            layerEditData.removedFeaturesLayer.clearFeatures();
                            self.editControl.setSelectedFeatures([]);
                            self.editControl.modifyControl.closeAttributes();
                            self.getEditableLayer(self.layer).then(l => l.refresh());
                        }
                    }
                    setChangedState(self, false);
                }
            });
            self.editControl.setMode(null);
        });
    };

    ctlProto.showOriginalFeatures = function (show) {
        const self = this;
        self.showsOriginalFeatures = show;
        const layerEditData = self.getLayerEditData();
        if (layerEditData) {
            layerEditData.beforeEditLayer.setVisibility(show);
        }
    };

    ctlProto.highlightAdded = function (highlight) {
        const self = this;
        self.highlightsAdded = highlight;
        const layerEditData = self.getLayerEditData();
        if (layerEditData && layerEditData.addedFeaturesLayer) {
            layerEditData.addedFeaturesLayer.setVisibility(highlight);
        }
    };

    ctlProto.highlightModified = function (highlight) {
        const self = this;
        self.highlightsModified = highlight;
        const layerEditData = self.getLayerEditData();
        if (layerEditData && layerEditData.modifiedFeaturesLayer) {
            layerEditData.modifiedFeaturesLayer.setVisibility(highlight);
        }
    };

    ctlProto.highlightRemoved = function (highlight) {
        const self = this;
        self.highlightsRemoved = highlight;
        const layerEditData = self.getLayerEditData();
        if (layerEditData && layerEditData.removedFeaturesLayer) {
            layerEditData.removedFeaturesLayer.setVisibility(highlight);
        }
    };

    const getStyleFromFeatureType = function (ctl, layer) {
        const result = {};
        const layerEditData = ctl.getLayerEditData(layer.wmsLayer || layer);
        switch (layerEditData.geometryType) {
            case TC.Consts.geom.POLYGON:
            case TC.Consts.geom.MULTIPOLYGON:
                result.polygon = layer.map.options.styles.polygon;
                break;
            case TC.Consts.geom.POLYLINE:
            case TC.Consts.geom.MULTIPOLYLINE:
                result.line = layer.map.options.styles.line;
                break;
            default:
                result.point = layer.map.options.styles.point;
                break;
        }
        return result;
    };

    ctlProto.getBeforeEditLayerStyle = function (layer) {
        const self = this;
        const getNegativeColor = function (color) {
            const rgba = layer.wrap.getRGBA(color);
            for (var i = 0; i < 3; i++) {
                rgba[i] = 255 - rgba[i];
            }
            return '#' + (rgba[0] * 65536 + rgba[1] * 256 + rgba[2]).toString(16).padStart(6, '0');
        };

        const dash = [1, 3];
        const result = TC.Util.extend(true, {}, layer.options.styles || getStyleFromFeatureType(self, layer));
        if (result.point) {
            result.point.strokeColor = getNegativeColor(result.point.strokeColor);
            result.point.lineDash = dash;
        }
        if (result.line) {
            result.line.strokeColor = getNegativeColor(result.line.strokeColor);
            result.line.lineDash = dash;
        }
        if (result.polygon) {
            result.polygon.strokeColor = getNegativeColor(result.polygon.strokeColor);
            result.polygon.lineDash = dash;
        }

        return result;
    };

    const colorizeLayer = function (ctl, layer, color) {
        const result = TC.Util.extend(true, {}, layer.options.styles || getStyleFromFeatureType(ctl, layer));
        if (result.point) {
            result.point.strokeColor = color;
            result.point.fillColor = color;
        }
        if (result.line) {
            result.line.strokeColor = color;
        }
        if (result.polygon) {
            result.polygon.strokeColor = color;
            result.polygon.fillColor = color;
        }

        return result;
    };

    ctlProto.getAddedFeaturesLayerStyle = function (layer) {
        const self = this;
        const layerEditData = self.getLayerEditData(layer.wmsLayer || layer);
        return colorizeLayer(self, layer, layerEditData.addedCustomColor || '#00ff00');
    };

    ctlProto.getModifiedFeaturesLayerStyle = function (layer) {
        const self = this;
        const layerEditData = self.getLayerEditData(layer.wmsLayer || layer);
        return colorizeLayer(self, layer, layerEditData.modifiedCustomColor || '#ff7f00');
    };

    ctlProto.getRemovedFeaturesLayerStyle = function (layer) {
        const self = this;
        const layerEditData = self.getLayerEditData(layer.wmsLayer || layer);
        return colorizeLayer(self, layer, layerEditData.removedCustomColor || '#ff0000');
    };

})();
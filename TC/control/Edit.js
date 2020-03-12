TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

(function () {

    const setEditState = function (ctl, state) {
        ctl.div.querySelectorAll(ctl._selectors.MODE_RADIO_BUTTON).forEach(r => r.disabled = !state);
    }

    /* Creamos el constructor, llamando al constructor del padre */
    TC.control.Edit = function () {
        const self = this;

        TC.Control.apply(this, arguments);

        self._classSelector = '.' + self.CLASS;

        self._selectors = {
            MODE_RADIO_BUTTON: 'input[type=radio][name=mode]'
        };


        self.wrap = new TC.wrap.control.Edit(self);
        self.layer = null;
        //self.feature = self.options.feature ? self.options.feature : null;
        self.callback = TC.Util.isFunction(arguments[2]) ? arguments[2] : (self.options.callback ? self.options.callback : null);
        self.cancelActionConfirmTxt = self.options.cancelText ? self.options.eraseText : "Si continua todos los cambios se perderán. ¿Desea continuar?";
        self.styles = self.options.styles;
        self.layersEditData = {};
        self.pointDrawControl = null;
        self.lineDrawControl = null;
        self.polygonDrawControl = null;
        //self.cutDrawControl = null;
        self.modifyControl = null;
        self.snapping = (typeof self.options.snapping === 'boolean') ? self.options.snapping : true;


            //.on(TC.Consts.event.EDITIONSAVE, function (e) {
            //    if (self.callback)
            //        self.callback(e.added, e.removed, e.modified);
            //});
    };

    TC.inherit(TC.control.Edit, TC.Control);

    TC.control.Edit.mode = {
        MODIFY: 'modify',
        ADDPOINT: 'addpoint',
        ADDLINE: 'addline',
        ADDPOLYGON: 'addpolygon',
        CUT: 'cut',
        OTHER: 'other'
    }

    const ctlProto = TC.control.Edit.prototype;

    ctlProto.CLASS = 'tc-ctl-edit';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Edit.html";
    ctlProto.template[ctlProto.CLASS + '-attr'] = TC.apiLocation + "TC/templates/EditAttributes.html";
    ctlProto.template[ctlProto.CLASS + '-import'] = TC.apiLocation + "TC/templates/EditImport.html";
    ctlProto.template[ctlProto.CLASS + '-import-layer'] = TC.apiLocation + "TC/templates/EditImportLayer.html";
    ctlProto.template[ctlProto.CLASS + '-import-feature'] = TC.apiLocation + "TC/templates/EditImportFeature.html";

    /* Extendemos el método register. 
       La lógica del control suele definirse aquí. */
    ctlProto.register = function (map) {
        const self = this;

        return new Promise(function (resolve, reject) {

            TC.Control.prototype.register.call(self, map).then(function () {

                const DRAW = 'draw';
                self._pointDrawCtlPromise = map.addControl(DRAW, {
                    id: self.getUID(),
                    div: self.div.querySelector(`.${self.CLASS}-point`),
                    mode: TC.Consts.geom.POINT,
                    layer: false
                });
                self._lineDrawCtlPromise = map.addControl(DRAW, {
                    id: self.getUID(),
                    div: self.div.querySelector(`.${self.CLASS}-line`),
                    mode: TC.Consts.geom.POLYLINE,
                    layer: false
                });
                self._polygonDrawCtlPromise = map.addControl(DRAW, {
                    id: self.getUID(),
                    div: self.div.querySelector(`.${self.CLASS}-polygon`),
                    mode: TC.Consts.geom.POLYGON,
                    layer: false
                });
                //self._cutDrawCtlPromise = map.addControl(DRAW, {
                //    id: self.getUID(),
                //    div: self.div.querySelector(`.${self.CLASS}-cut`),
                //    mode: TC.Consts.geom.POLYLINE,
                //    snapping: true,
                //    styles: {
                //        line: {
                //            lineDash: [5, 5]
                //        }
                //    },
                //    layer: false
                //});
                self._modifyCtlPromise = map.addControl('modify', {
                    id: self.getUID(),
                    div: self.div.querySelector(`.${self.CLASS}-modify`),
                    snapping: self.snapping
                });
                Promise.all([
                    self._pointDrawCtlPromise,
                    self._lineDrawCtlPromise,
                    self._polygonDrawCtlPromise,
                    //self._cutDrawCtlPromise,
                    self._modifyCtlPromise
                ]).then(function (controls) {
                    self.pointDrawControl = controls[0];
                    self.lineDrawControl = controls[1];
                    self.polygonDrawControl = controls[2];
                    //self.cutDrawControl = controls[3];
                    self.modifyControl = controls[3];

                    const drawendHandler = function (e) {
                        e.feature.setStyle(null); // Por defecto, Draw añade estilo a todo lo que dibuja. No nos conviene cuando está dentro de Edit.
                        self.trigger(TC.Consts.event.DRAWEND, { feature: e.feature });
                    };
                    const drawcancelHandler = function () {
                        self.cancel();
                    };
                    self.pointDrawControl
                        .on(TC.Consts.event.DRAWEND, drawendHandler)
                        .on(TC.Consts.event.DRAWCANCEL, drawcancelHandler);
                    self.lineDrawControl
                        .on(TC.Consts.event.DRAWEND, drawendHandler)
                        .on(TC.Consts.event.DRAWCANCEL, drawcancelHandler);
                    self.polygonDrawControl
                        .on(TC.Consts.event.DRAWEND, drawendHandler)
                        .on(TC.Consts.event.DRAWCANCEL, drawcancelHandler);
                    //self.cutDrawControl
                    //    .on(TC.Consts.event.DRAWEND, function (e) {
                    //        //TC.loadJS(
                    //        //    !window.turf && !turf.lineSplit,
                    //        //    [TC.apiLocation + 'lib/turf/line-split'],
                    //        //    function () {

                    //        //    }
                    //        //);

                    //        //self.layer.features.filter(f => f)
                    //    })
                    //    .on(TC.Consts.event.DRAWCANCEL, drawcancelHandler);
                    self.modifyControl
                        .on(TC.Consts.event.FEATUREMODIFY, function (e) {
                            self.trigger(TC.Consts.event.FEATUREMODIFY, { feature: e.feature, layer: e.layer });
                        })
                        .on(TC.Consts.event.FEATUREADD, function (e) {
                            self.trigger(TC.Consts.event.FEATUREADD, { feature: e.feature, layer: e.layer });
                        })
                        .on(TC.Consts.event.FEATUREREMOVE, function (e) {
                            self.trigger(TC.Consts.event.FEATUREREMOVE, { feature: e.feature, layer: e.layer });
                        });

                    self.modifyControl.displayAttributes = function () {
                        const selectedFeatures = self.getSelectedFeatures();
                        const feature = selectedFeatures[selectedFeatures.length - 1];
                        if (feature) {
                            self.modifyControl._editAttrBtn.classList.add(TC.Consts.classes.ACTIVE);
                            const attributes = self.getLayerEditData(feature.layer).attributes;
                            const attrArray = Object.keys(attributes).map(k => attributes[k]);
                            const jfa = self._joinedFeatureAttributes || [];
                            const data = feature.getData() || {};

                            attrArray.forEach(function (attributeObj) {
                                attributeObj.value = data[attributeObj.name];
                                if (attributeObj.name === 'id') {
                                    attributeObj.readOnly = true;
                                }
                                attributeObj.availableValues = [];
                                jfa.forEach(function (jfaObj) {
                                    const val = jfaObj[attributeObj.name];
                                    if (val !== undefined && val !== '') {
                                        attributeObj.availableValues[attributeObj.availableValues.length] = val;
                                    }
                                });
                            });

                            attrArray.sort(function (a, b) {
                                if (a.readOnly ? !b.readOnly : b.readOnly) { //XOR
                                    return !a.readOnly - !b.readOnly; // Primero readOnly
                                }
                                if (a.name > b.name) {
                                    return 1;
                                }
                                if (a.name < b.name) {
                                    return -1;
                                }
                                return 0;
                            });
                            self.getRenderedHtml(self.CLASS + '-attr', { data: attrArray }, function (html) {
                                self.modifyControl._attributesSection;
                                const contentDiv = self.getAttributeDisplayTarget();
                                contentDiv.classList.remove(TC.Consts.classes.HIDDEN);
                                contentDiv.innerHTML = html;
                                const inputs = contentDiv.querySelectorAll('input');
                                const selects = contentDiv.querySelectorAll('select');
                                inputs.forEach(function (elm) {
                                    elm.addEventListener('input', function (e) {
                                        const input = e.target;
                                        for (var i = 0, len = selects.length; i < len; i++) {
                                            const select = selects[i];
                                            if (select.matches(`[name=${e.target.getAttribute('name')}]`) && select.value !== input.value) {
                                                select.value = '';
                                                break;
                                            }
                                        }
                                    });
                                });
                                selects.forEach(function (elm) {
                                    elm.addEventListener('change', function (e) {
                                        const select = e.target;
                                        for (var i = 0, len = inputs.length; i < len; i++) {
                                            const input = inputs[i];
                                            if (input.matches(`[name=${e.target.getAttribute('name')}]`)) {
                                                input.value = select.value;
                                                break;
                                            }
                                        }
                                    });
                                });

                                contentDiv.querySelector(`.${self.modifyControl.CLASS}-btn-attr-ok`).addEventListener(TC.Consts.event.CLICK, function (e) {
                                    self.modifyControl._onAttrOK();
                                });

                                contentDiv.querySelector(`.${self.modifyControl.CLASS}-btn-attr-cancel`).addEventListener(TC.Consts.event.CLICK, function () {
                                    self.modifyControl.closeAttributes();
                                });
                            });
                        }
                    };

                    self.modifyControl._onAttrOK = function () {
                        const that = this;
                        const feature = that.getSelectedFeatures()[0];
                        if (feature) {
                            const data = {};
                            const attributes = self.getLayerEditData(feature.layer).attributes;
                            const inputs = that.getAttributeDisplayTarget().querySelectorAll('input');
                            inputs.forEach(function (input) {
                                var name = input.getAttribute('name');
                                var value = input.value;
                                switch (attributes[name].type) {
                                    case 'int':
                                    case 'integer':
                                    case 'byte':
                                    case 'long':
                                    case 'negativeInteger':
                                    case 'nonNegativeInteger':
                                    case 'nonPositiveInteger':
                                    case 'positiveInteger':
                                    case 'short':
                                    case 'unsignedLong':
                                    case 'unsignedInt':
                                    case 'unsignedShort':
                                    case 'unsignedByte':
                                        value = parseInt(value);
                                        if (!Number.isNaN(value)) {
                                            data[name] = value;
                                        }
                                        break;
                                    case 'double':
                                    case 'float':
                                    case 'decimal':
                                        value = parseFloat(value);
                                        if (!Number.isNaN(value)) {
                                            data[name] = value;
                                        }
                                        break;
                                    case 'date':
                                    case 'time':
                                    case 'dateTime':
                                        data[name] = new Date(value);
                                        break;
                                    case 'boolean':
                                        data[name] = !!value;
                                        break;
                                    case undefined:
                                        break;
                                    default:
                                        data[name] = value;
                                        break;
                                }
                            });
                            feature.setData(data);
                            that.trigger(TC.Consts.event.FEATUREMODIFY, { feature: feature, layer: that.layer });
                            that.closeAttributes();
                        }
                    };

                    if (Array.isArray(self.options.modes) && self.options.modes.length == 1) {
                        self.setMode(self.options.modes[0], null);
                    }

                    resolve(self);

                    map.loaded(function () {
                        self.setLayer(self.options.layer);
                    });

                    map
                        .on(TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                            if (e.control === self.featureImportPanel) {
                                self.featuresToImport = [];
                                self.getHighlightsLayer().then(l => l.clearFeatures());
                            }
                        })
                        .on(TC.Consts.event.LAYERREMOVE + ' ' + TC.Consts.event.FEATURESCLEAR, function (e) {
                            if (self.featureImportPanel && !self.featureImportPanel.div.classList.contains(TC.Consts.classes.HIDDEN)) {
                                self.getHighlightsLayer().then(function (hlLayer) {
                                    for (let i = self.featuresToImport.length - 1; i >= 0; i--) {
                                        const fti = self.featuresToImport[i];
                                        if (fti.layer === e.layer || (fti.original && fti.original.layer === e.layer)) {
                                            self.featuresToImport.splice(i, 1);
                                            hlLayer.removeFeature(fti);
                                        }
                                    }
                                    const li = self.featureImportPanel.getInfoContainer().querySelector(`li[data-layer-id="${e.layer.id}"]`);
                                    if (li) {
                                        li.remove();
                                    }
                                });
                            }
                        })
                        .on(TC.Consts.event.FEATUREREMOVE, function (e) {
                            if (self.featureImportPanel && !self.featureImportPanel.div.classList.contains(TC.Consts.classes.HIDDEN)) {
                                self.getHighlightsLayer().then(function (hlLayer) {
                                    for (let i = 0, ii = self.featuresToImport.length; i < ii; i++) {
                                        const fti = self.featuresToImport[i];
                                        if (fti === e.feature || fti.original === e.feature) {
                                            self.featuresToImport.splice(i, 1);
                                            hlLayer.removeFeature(fti);
                                            const lli = self.featureImportPanel.getInfoContainer().querySelector(`li[data-layer-id="${e.layer.id}"]`);
                                            if (lli) {
                                                const fli = lli.querySelector(`#tc-ctl-edit-import-list-cb-${e.layer.id}-${e.feature.id}`);
                                                if (fli) {
                                                    fli.remove();
                                                }
                                                if (!lli.children.length) {
                                                    lli.remove();
                                                }
                                            }
                                            break;
                                        }
                                    }
                                });
                            }
                        })
                        .on(TC.Consts.event.LAYERUPDATE, function (e) { // TODO: Actualizar cuando la capa ya existe en la lista
                            if (self.featureImportPanel && !self.featureImportPanel.div.classList.contains(TC.Consts.classes.HIDDEN)) {
                                const layerObj = self.getAvailableFeaturesToImport().filter(l => l.id === e.layer.id)[0];
                                if (layerObj) {
                                    self.getRenderedHtml(self.CLASS + '-import-layer', layerObj, function (html) {
                                        const list = self
                                            .featureImportPanel
                                            .getInfoContainer()
                                            .querySelector(`.${self.CLASS}-import-list .tc-layers`);
                                        if (!list.querySelector(`li[data-layer-id="${e.layer.id}"]`)) {
                                            list.insertAdjacentHTML('beforeend', html);
                                        }
                                    });
                                }
                            }
                        })
                        .on(TC.Consts.event.FEATUREADD + ' ' + TC.Consts.event.FEATURESADD, function (e) {
                            if (self.featureImportPanel && !self.featureImportPanel.div.classList.contains(TC.Consts.classes.HIDDEN)) {
                                const layer = e.layer;
                                const features = (e.feature ? [e.feature] : e.features).filter(f => self.isFeatureAllowed(f));
                                if (features.length) {
                                    self.displayLayerToImport({
                                        id: layer.id,
                                        title: layer.title,
                                        features: features
                                    });
                                }
                            }
                        });
                });
            });
        });
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(TC.Control.prototype.render.call(self, function () {

            //control de renderizado enfunción del modo de edicion
            if (Array.isArray(self.options.modes) && self.options.modes.length > 0) {
                for (var m in TC.control.Edit.mode)
                    if (typeof m === 'string' && self.options.modes.indexOf(TC.control.Edit.mode[m]) < 0) {
                        const label = self.div.querySelector(`label${self._classSelector}-btn-${TC.control.Edit.mode[m]}`);
                        label.parentElement.removeChild(label);
                        const div = self.div.querySelector(`div${self._classSelector}-${TC.control.Edit.mode[m]}`);
                        div.parentElement.removeChild(div);
                    }
                if (self.options.modes.length === 1) {
                    var mode = self.options.modes[0];
                    const label = self.div.querySelector(`label${self._classSelector}-btn-${mode}`);
                    label.parentElement.removeChild(label);
                }
            }

            self.div.querySelectorAll(self._selectors.MODE_RADIO_BUTTON).forEach(function (radio) {
                radio.addEventListener('change', function () {
                    var newMode = this.value;
                    var mode = self.mode === newMode ? undefined : newMode;
                    self.setMode(mode);
                });
            });

            self.div.querySelector(self._classSelector + '-btn-import').addEventListener(TC.Consts.event.CLICK, function (e) {
                self.showFeatureImportPanel();
            });

            self.div.querySelector(self._classSelector + '-btn-dl').addEventListener(TC.Consts.event.CLICK, function (e) {
                self.getDownloadDialog().then(function (dialog) {
                    const options = {
                        title: self.getLocaleString('download'),
                        fileName: self.layer.id.toLowerCase().replace(' ', '_') + '_' + TC.Util.getFormattedDate(new Date().toString(), true),
                        elevation: self.options.downloadElevation
                    };
                    dialog.open(self.layer.features, options);
                });
            });

            if (TC.Util.isFunction(callback)) {
                callback();
            }
        }));
    };

    ctlProto.getGeometryType = function (geometryType) {
        switch (geometryType) {
            case 'gml:LinearRingPropertyType':
            case 'gml:PolygonPropertyType':
            case 'LinearRingPropertyType':
            case 'PolygonPropertyType':
                return TC.Consts.geom.POLYGON;
            case 'gml:MultiPolygonPropertyType':
            case 'gml:MultiSurfacePropertyType':
            case 'MultiPolygonPropertyType':
            case 'MultiSurfacePropertyType':
                return TC.Consts.geom.MULTIPOLYGON;
            case 'gml:LineStringPropertyType':
            case 'gml:CurvePropertyType':
            case 'LineStringPropertyType':
            case 'CurvePropertyType':
                return TC.Consts.geom.POLYLINE;
            case 'gml:MultiLineStringPropertyType':
            case 'gml:MultiCurvePropertyType':
            case 'MultiLineStringPropertyType':
            case 'MultiCurvePropertyType':
                return TC.Consts.geom.MULTIPOLYLINE;
            case 'gml:PointPropertyType':
            case 'gml:MultiPointPropertyType':
            case 'PointPropertyType':
            case 'MultiPointPropertyType':
                return TC.Consts.geom.POINT;
            case 'gml:BoxPropertyType':
            case 'BoxPropertyType':
                return TC.Consts.geom.RECTANGLE;
            case 'gml:GeometryCollectionPropertyType':
            case 'gml:GeometryAssociationType':
            case 'gml:GeometryPropertyType':
            case 'GeometryCollectionPropertyType':
            case 'GeometryAssociationType':
            case 'GeometryPropertyType':
                return true;
            default:
                return false;
        }

    };

    ctlProto.setLayer = function (layer) {
        const self = this;
        self.layer = self.map.getLayer(layer);
        if (self.layer) {
            layer.describeFeatureType()
                .then(function (attributes) {
                    const layerEditData = {
                        attributes: {}
                    };
                    // recogemos los atributos no geométricos y definimos la geometría
                    for (var key in attributes) {
                        const attr = attributes[key];
                        const geometryType = self.getGeometryType(attr.type);
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
                    self.layersEditData[layer.id] = layerEditData;
                })
                .catch(function (err) {
                    self.layersEditData[layer.id] = {
                        geometryType: null,
                        attributes: {}
                    };
                });
        }
        const setLayer = c => c.setLayer(self.layer);
        self.getModifyControl().then(setLayer);
        self.getPointDrawControl().then(setLayer);
        self.getLineDrawControl().then(setLayer);
        self.getPolygonDrawControl().then(setLayer);
        //self.getCutDrawControl().then(setLayer);
        self.setMode(self.layer ? TC.control.Edit.mode.MODIFY : null);
        setEditState(self, self.layer);
    };

    ctlProto.setMode = function (mode) {
        var self = this;
        self.mode = mode;
        //setFeatureSelectReadyState(self);

        var activateDraw = function (draw) {
            if (draw) {
                if (self.snapping) {
                    draw.snapping = self.layer;
                }
                draw.activate();
            }
        };

        var active;
        var hiddenList;
        Promise.all([
            self._pointDrawCtlPromise,
            self._lineDrawCtlPromise,
            self._polygonDrawCtlPromise,
            //self._cutDrawCtlPromise,
            self._modifyCtlPromise
        ]).then(function (controls) {
            const pointDrawControl = controls[0];
            const lineDrawControl = controls[1];
            const polygonDrawControl = controls[2];
            //const cutDrawControl = controls[3];
            const modifyControl = controls[3];
            switch (mode) {
                case TC.control.Edit.mode.MODIFY:
                    active = self.div.querySelector(self._classSelector + '-modify');
                    hiddenList = self.div.querySelectorAll(self._classSelector + '-point,' + self._classSelector + '-line,' + self._classSelector + '-polygon,' + self._classSelector + '-other');
                    modifyControl.activate();
                    break;
                case TC.control.Edit.mode.ADDPOINT:
                    active = self.div.querySelector(self._classSelector + '-point');
                    hiddenList = self.div.querySelectorAll(self._classSelector + '-modify,' + self._classSelector + '-line,' + self._classSelector + '-polygon,' + self._classSelector + '-other');
                    activateDraw(pointDrawControl);
                    break;
                case TC.control.Edit.mode.ADDLINE:
                    active = self.div.querySelector(self._classSelector + '-line');
                    hiddenList = self.div.querySelectorAll(self._classSelector + '-modify,' + self._classSelector + '-point,' + self._classSelector + '-polygon,' + self._classSelector + '-other');
                    activateDraw(lineDrawControl);
                    break;
                case TC.control.Edit.mode.ADDPOLYGON:
                    active = self.div.querySelector(self._classSelector + '-polygon');
                    hiddenList = self.div.querySelectorAll(self._classSelector + '-modify,' + self._classSelector + '-point,' + self._classSelector + '-line,' + self._classSelector + '-other');
                    activateDraw(polygonDrawControl);
                    break;
                case TC.control.Edit.mode.OTHER:
                    active = self.div.querySelector(self._classSelector + '-other');
                    hiddenList = self.div.querySelectorAll(self._classSelector + '-modify,' + self._classSelector + '-point,' + self._classSelector + '-line,' + self._classSelector + '-polygon');
                    if (controls.indexOf(self.map.activeControl) >= 0) {
                        self.map.activeControl.deactivate();
                    }
                    break;
                default:
                    active = null;
                    hiddenList = self.div.querySelectorAll(self._classSelector + '-modify,' + self._classSelector + '-point,' + self._classSelector + '-line,' + self._classSelector + '-polygon,' + self._classSelector + '-other');
                    if (controls.indexOf(self.map.activeControl) >= 0) {
                        self.map.activeControl.deactivate();
                    }
                    //if (cutDrawControl.isActive) {
                    //    cutDrawControl.deactivate();
                    //}
                    break;
            }

            if (mode) {
                const radio = self.div.querySelector(`${self._selectors.MODE_RADIO_BUTTON}[value=${mode}]`);
                radio.checked = true;
            }
            else {
                self.div.querySelectorAll(self._selectors.MODE_RADIO_BUTTON).forEach(function (radio) {
                    radio.checked = false;
                });
            }
            if (active) {
                active.classList.remove(TC.Consts.classes.HIDDEN);
            }
            hiddenList.forEach(function (hidden) {
                hidden.classList.add(TC.Consts.classes.HIDDEN);
            });
        });
    };

    ctlProto.constrainModes = function (modes) {
        const self = this;
        if (!Array.isArray(modes)) {
            modes = [];
        }
        self.modes = modes
            .filter(function (m) {
                // Quitamos los valores que no sean modos de edición
                for (var key in TC.control.Edit.mode) {
                    if (TC.control.Edit.mode[key] === m) {
                        return true;
                    }
                }
                return false;
            })
            .filter(function (m) {
                // Quitamos los modos de edición que no se definieron en la configuración
                if (!Array.isArray(self.options.modes)) {
                    return true;
                }
                return self.options.modes.indexOf(m) >= 0;
            });
        if (self.modes.indexOf(self.mode) < 0) {
            self.setMode(null);
        }
        const selector = self.modes.map(m => `[value=${m}]`).join() || '[value]';
        self.div.querySelectorAll(self._selectors.MODE_RADIO_BUTTON).forEach(function (rb) {
            rb.disabled = !rb.matches(selector);
        });
    };

    ctlProto.isFeatureAllowed = function (feature) {
        const self = this;
        switch (true) {
            case TC.feature.Point && feature instanceof TC.feature.Point:
                return self.modes.indexOf(TC.control.Edit.mode.ADDPOINT) >= 0;
            case TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                return self.modes.indexOf(TC.control.Edit.mode.ADDLINE) >= 0;
            case TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline:
                return self.modes.indexOf(TC.control.Edit.mode.ADDLINE) >= 0 && self.isMultiple;
            case TC.feature.Polygon && feature instanceof TC.feature.Polygon:
                return self.modes.indexOf(TC.control.Edit.mode.ADDPOLYGON) >= 0;
            case TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon:
                return self.modes.indexOf(TC.control.Edit.mode.ADDPOLYGON) >= 0 && self.isMultiple;
            default:
                return true;
        }
    };

    ctlProto.setComplexGeometry = function (isMultiple) {
        const self = this;
        self.isMultiple = isMultiple;
        //self.getPointDrawControl().then(c => c.setMode(isMultiple ? TC.Consts.geom.MULTIPOINT : TC.Consts.geom.POINT));
        self.getLineDrawControl().then(c => c.setMode(isMultiple ? TC.Consts.geom.MULTIPOLYLINE : TC.Consts.geom.POLYLINE));
        self.getPolygonDrawControl().then(c => c.setMode(isMultiple ? TC.Consts.geom.MULTIPOLYGON : TC.Consts.geom.POLYGON));
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

    ctlProto.cancel = function () {
        var self = this;
        if (Array.isArray(self.options.modes) && self.options.modes.length == 1) {
            self.setMode(self.options.modes[0], null);
        }
        else {
            self.setMode(null, false);
        }
        self.wrap.cancel(true, self.cancelActionConfirmTxt);
    };

    ctlProto.onFeatureClick = function (e) {
        if (!self.activeControl || !self.activeControl.isExclusive()) {
            e.feature.show();
        }
    };
    
    ctlProto.activate = function (options) {
        const self = this;
        options = options || {};
        const activateCtl = function (ctl) {
            if (ctl !== self.map.activeControl) {
                self._previousActiveControl = self.map.activeControl;
            }
        };
        switch (options.mode) {
            case TC.control.Edit.mode.ADDPOINT:
                self.getPointDrawControl().then(activateCtl);
                break;
            case TC.control.Edit.mode.ADDLINE:
                self.getLineDrawControl().then(activateCtl);
                break;
            case TC.control.Edit.mode.ADDPOLYGON:
                self.getPolygonDrawControl().then(activateCtl);
                break;
            default:
                self.getModifyControl().then(activateCtl);
                break;
        }
    };

    ctlProto.deactivate = function () {
        const self = this;
        if (self._previousActiveControl) {
            self.map.previousActiveControl = self._previousActiveControl;
            switch (self.map.activeControl) {
                case self.pointDrawControl:
                    self.pointDrawControl.deactivate();
                    break;
                case self.lineDrawControl:
                    self.lineDrawControl.deactivate();
                    break;
                case self.polygonDrawControl:
                    self.polygonDrawControl.deactivate();
                    break;
                case self.modifyControl:
                    self.modifyControl.deactivate();
                    break;
                default:
                    break;
            }
        }
        self.modifyControl && self.modifyControl.closeAttributes();
    };

    ctlProto.isExclusive = function () {
        return true;
    };

    ctlProto.getAttributeDisplayTarget = function () {
        return this.modifyControl._attributesSection;
    };

    //ctlProto.joinFeatures = function (features) {
    //    var self = this;
    //    if (self.geometryType === TC.Consts.geom.MULTIPOLYLINE ||
    //        self.geometryType === TC.Consts.geom.MULTIPOLYGON ||
    //        self.geometryType === TC.Consts.geom.MULTIPOINT) {
    //        self._joinedFeatureAttributes = [];
    //        if (features.length > 1) {
    //            var geometries = features.map(function (elm) {
    //                self._joinedFeatureAttributes[self._joinedFeatureAttributes.length] = elm.getData();
    //                return elm.geometry;
    //            });
    //            var newGeometry = geometries.reduce(function (a, b) {
    //                return a.concat(b);
    //            });
    //            var newFeature = new features[0].constructor(newGeometry);
    //            for (var i = 0, len = features.length; i < len; i++) {
    //                var feature = features[i];
    //                self.layer.removeFeature(feature);
    //                self.trigger(TC.Consts.event.FEATUREREMOVE, { feature: feature });
    //            }
    //            self.layer.addFeature(newFeature).then(function (feat) {
    //                self.setSelectedFeatures([newFeature]);
    //                self.trigger(TC.Consts.event.FEATUREADD, { feature: feat });
    //                feat.showPopup(self.attributeEditor);
    //            });
    //        }
    //        setFeatureSelectedState(self, [newFeature]);
    //    }
    //};

    //ctlProto.splitFeatures = function (features) {
    //    var self = this;
    //    var complexFeatures = features.filter(complexGeometryFilter);
    //    var geometries = complexFeatures.map(function (elm) {
    //        return elm.geometry;
    //    });
    //    var newFeatures = [];
    //    for (var i = 0, ii = complexFeatures.length; i < ii; i++) {
    //        var feature = complexFeatures[i];
    //        var data = feature.getData();
    //        var geometry = geometries[i];
    //        for (var j = 0, jj = geometry.length; j < jj; j++) {
    //            newFeatures[newFeatures.length] = new feature.constructor([geometry[j]], { data: data });
    //        }
    //    }
    //    for (var i = 0, len = complexFeatures.length; i < len; i++) {
    //        var feature = complexFeatures[i];
    //        self.layer.removeFeature(feature);
    //        self.trigger(TC.Consts.event.FEATUREREMOVE, { feature: feature });
    //    }
    //    var newFeatPromises = new Array(newFeatures.length);
    //    for (var i = 0, len = newFeatures.length; i < len; i++) {
    //        const promise = newFeatPromises[i] = self.layer.addFeature(newFeatures[i]);
    //        promise.then(function (feat) {
    //            self.trigger(TC.Consts.event.FEATUREADD, { feature: feat });
    //        });
    //    }
    //    Promise.all(newFeatPromises).then(function() {
    //        self.setSelectedFeatures(newFeatures);
    //    });
    //    setFeatureSelectedState(self, newFeatures);
    //};

    //ctlProto.deleteFeatures = function (features) {
    //    var self = this;
    //    self.wrap.deleteFeatures(features);
    //    if (self.layer.features.length === 0) {
    //        self._deleteBtn.disabled = true;
    //    }
    //};

    ctlProto.getSelectedFeatures = function () {
        return this.modifyControl.getSelectedFeatures();
    };

    ctlProto.setSelectedFeatures = function (features) {
        return this.modifyControl.setSelectedFeatures(features);
    };

    ctlProto.getLayer = function () {
        var self = this;
        return self.layer;
    };

    ctlProto.getModifyControl = function () {
        const self = this;
        return self._modifyCtlPromise || new Promise(function (resolve, reject) {
            self.renderPromise().then(() => resolve(self.modifyControl));
        });
    };

    ctlProto.getPointDrawControl = function () {
        const self = this;
        return self._pointDrawCtlPromise || new Promise(function (resolve, reject) {
            self.renderPromise().then(() => resolve(self.pointDrawControl));
        });
    };

    ctlProto.getLineDrawControl = function () {
        const self = this;
        return self._lineDrawCtlPromise || new Promise(function (resolve, reject) {
            self.renderPromise().then(() => resolve(self.lineDrawControl));
        });
    };

    ctlProto.getPolygonDrawControl = function () {
        const self = this;
        return self._polygonDrawCtlPromise || new Promise(function (resolve, reject) {
            self.renderPromise().then(() => resolve(self.polygonDrawControl));
        });
    };

    //ctlProto.getCutDrawControl = function () {
    //    const self = this;
    //    return self._cutDrawCtlPromise || new Promise(function (resolve, reject) {
    //        self.renderPromise().then(() => resolve(self.cutDrawControl));
    //    });
    //};

    ctlProto.getFeatureImportPanel = function () {
        const self = this;
        if (!self._featureImportPanelPromise) {
            self._featureImportPanelPromise = self.map.addControl('resultsPanel', {
                titles: {
                    main: self.getLocaleString('importFromOtherLayer')
                }
            });
            self._featureImportPanelPromise.then(panel => self.featureImportPanel = panel);
        }
        return self._featureImportPanelPromise;
    };

    ctlProto.getHighlightsLayer = function () {
        const self = this;
        if (!self._highlightsLayerPromise) {
            self._highlightsLayerPromise = self.map.addLayer({
                id: self.getUID(),
                type: TC.Consts.layerType.VECTOR,
                title: 'Highlights Layer',
                stealth: true,
                styles: self.map.options.styles.selection || TC.Cfg.styles.selection
            });
            self._highlightsLayerPromise.then(layer => self.highlightsLayer = layer);
        }
        return self._highlightsLayerPromise;
    };

    ctlProto.highlightFeatures = function (features) {
        const self = this;
        self.getHighlightsLayer().then(function (layer) {
            const featuresToHighlight = self.featuresToImport.concat(features);
            layer.features.slice().forEach(function (feature) {
                if (!feature.original || featuresToHighlight.indexOf(feature.original) < 0) {
                    layer.removeFeature(feature);
                }
            });
            layer.addFeatures(featuresToHighlight
                .filter(function (feature) {
                    return !layer.features.some(function (f) {
                        return f.original && f.original === feature;
                    });
                })
                .map(function (feature) {
                const newFeature = feature.clone();
                newFeature.toggleSelectedStyle(true);
                newFeature.original = feature;
                return newFeature;
            }));
        });
    };

    ctlProto.getAvailableFeaturesToImport = function () {
        const self = this;
        return self.map.workLayers
            .filter(l => !l.isRaster())
            .filter(l => l !== self.layer)
            .filter(l => l !== self.highlightsLayer)
            .map(function (l) {
                return {
                    id: l.id,
                    title: l.title,
                    features: l.features.filter(function (f) {
                        return self.isFeatureAllowed(f);
                    })
                };
            })
            .filter(l => l.features.length);
    };

    ctlProto.getFeatureFromImportList = function (elm) {
        const self = this;
        const cb = elm.querySelector('input');
        const layer = self.map.getLayer(elm.parentElement.parentElement.dataset.layerId);
        if (layer) {
            return layer.getFeatureById(cb.value);
        }
        return null;
    };

    ctlProto.importFeatures = function (features) {
        const self = this;
        let failure = false;
        const layerEditData = self.getLayerEditData();
        const featuresToImport = (features || self.featuresToImport || [])
            .filter(f => {
                const result = self.isFeatureAllowed(f);
                if (!result) {
                    failure = true;
                }
                return result;
            });
        featuresToImport.map(function (feature) {
            let newFeature;
            const featureOptions = {
                data: feature.data,
                geometryName: layerEditData.geometryName
            };
            if (self.isMultiple) {
                switch (true) {
                    case TC.feature.Polygon && feature instanceof TC.feature.Polygon:
                        newFeature = new TC.feature.MultiPolygon([feature.geometry], featureOptions);
                        break;
                    case TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                        newFeature = new TC.feature.MultiPolyline([feature.geometry], featureOptions);
                        break;
                    default:
                        newFeature = feature.clone();
                        break;
                }
            }
            else {
                switch (true) {
                    case TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon:
                        newFeature = new TC.feature.Polygon(feature.geometry[0], featureOptions);
                        break;
                    case TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline:
                        newFeature = new TC.feature.Polyline(feature.geometry[0], featureOptions);
                        break;
                    default:
                        newFeature = feature.clone();
                        break;
                }
            }
            newFeature.setStyle(null);
            return newFeature;
        }).forEach(function (feature) {
            self.layer.addFeature(feature);
            self.trigger(TC.Consts.event.FEATUREADD, { feature: feature, layer: self.layer });
        });
        
        if (failure) {
            self.map.toast(self.getLocaleString('importFromOtherLayer.warning'), { type: TC.Consts.msgType.WARNING });
        }
    };

    const handleCheck = function (ctl, checkbox) {
        const feature = ctl.getFeatureFromImportList(checkbox.parentElement);
        if (checkbox.checked) {
            ctl.featuresToImport.push(feature);
        }
        else {
            const idx = ctl.featuresToImport.indexOf(feature);
            if (idx >= 0) {
                ctl.featuresToImport.splice(idx, 1);
            }
        }
    };

    ctlProto._addImportLayerEvents = function (li) {
        const self = this;
        
        li.querySelector('input').addEventListener('change', function (e) {
            const cb = this;
            cb.parentElement.querySelectorAll('li.tc-feature input').forEach(function (ccb) {
                if (ccb.checked !== cb.checked) {
                    ccb.checked = cb.checked;
                    handleCheck(self, ccb);
                }
            });
            self.highlightFeatures([]);
        });

        li.querySelectorAll('li.tc-feature').forEach(function (elm) {
            self._addImportFeatureEvents(elm);
        });
    };

    ctlProto._addImportFeatureEvents = function (li) {
        const self = this;
        const highlightListener = function (e) {
            const feature = self.getFeatureFromImportList(this);
            if (feature) {
                self.highlightFeatures([feature]);
            }
        };
        li.addEventListener(TC.Consts.event.CLICK, highlightListener);
        li.addEventListener('mouseover', highlightListener);
        li.querySelector('input').addEventListener('change', function (e) {
            handleCheck(self, this);
        });
    };

    ctlProto.showFeatureImportPanel = function () {
        const self = this;

        self.featuresToImport = [];

        self.getFeatureImportPanel().then(function (panel) {
            const container = panel.getInfoContainer();
            self.getRenderedHtml(self.CLASS + '-import', { layers: self.getAvailableFeaturesToImport() }, function (html) {
                panel.open(html, container);
                container.querySelector('ul').addEventListener('mouseout', function (e) {
                    self.highlightFeatures([]);
                });
                container.querySelectorAll('li.tc-layer').forEach(function (elm) {
                    self._addImportLayerEvents(elm);
                });
                container.querySelector(`.${self.CLASS}-import-btn-ok`).addEventListener(TC.Consts.event.CLICK, function (e) {
                    self.importFeatures();
                    self.featureImportPanel.close();
                });
            });
        });
    };

    ctlProto.displayLayerToImport = function (layer) {
        const self = this;
        return new Promise(function (resolve, reject) {
            if (self.featureImportPanel && !self.featureImportPanel.div.classList.contains(TC.Consts.classes.HIDDEN)) {
                const container = self.featureImportPanel.getInfoContainer();
                const list = container.querySelector(`.${self.CLASS}-import-list .tc-layers`);
                const layerElementSelector = `li[data-layer-id="${layer.id}"]`;
                const li = list.querySelector(layerElementSelector);
                if (li) {
                    features.forEach(function (feature) {
                        if (self.isFeatureAllowed(feature)) {
                            self.getRenderedHtml(self.CLASS + '-import-feature', layerObj, function (html) {
                                li.insertAdjacentHTML('beforeend', html);
                                self._addImportFeatureEvents(li.querySelector('li:last-child'));
                            });
                        }
                    });
                    resolve(li);
                }
                else {
                    self.getRenderedHtml(self.CLASS + '-import-layer', { id: layer.id, title: layer.title, features: layer.features }, function (html) {
                        list.insertAdjacentHTML('beforeend', html);
                        const newLi = list.querySelector(layerElementSelector);
                        self._addImportLayerEvents(newLi);
                        resolve(newLi);
                    });
                }
            }
            else {
                resolve(null);
            }
        });
    };

    ctlProto.getDownloadDialog = function () {
        const self = this;
        if (self._downloadDialog) {
            return Promise.resolve(self._downloadDialog);
        }
        return new Promise(function (resolve, reject) {
            self.map.addControl('FeatureDownloadDialog').then(ctl => {
                self._downloadDialog = ctl;
                resolve(ctl);
            })
        });
    };

})();
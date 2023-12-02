import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Util from '../Util';
import wrap from '../ol/ol';
import './Draw';
import './Modify';
import './Measurement';
import Geometry from '../Geometry';
import Point from '../../SITNA/feature/Point';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';
import WebComponentControl from './WebComponentControl';

TC.wrap = wrap;

const className = 'tc-ctl-edit';
const elementName = 'sitna-edit';

class Edit extends WebComponentControl {
    CLASS = className;
    #classSelector;
    #selectors;
    #previousActiveControl;
    #featureImportPanelPromise;
    #highlightsLayerPromise;
    #measurementControl;
    #originalFeatures = new WeakMap();

    static mode = {
        MODIFY: 'modify',
        ADDPOINT: 'addpoint',
        ADDLINE: 'addline',
        ADDPOLYGON: 'addpolygon',
        CUT: 'cut',
        OTHER: 'other'
    };

    constructor() {
        super(...arguments);
        const self = this;

        self.#classSelector = '.' + self.CLASS;

        self.#selectors = {
            MODE_TAB: `.${self.CLASS}-mode sitna-tab`
        };

        self.mode = self.options.mode 
        self
            .initProperty('stylable')
            .initProperty('snapping')
            .initProperty('mode')
            .initProperty('otherToolsIncluded');
        self.wrap = new TC.wrap.control.Edit(self);
        self.layer = null;
        //self.feature = self.options.feature ? self.options.feature : null;
        self.callback = Util.isFunction(arguments[2]) ? arguments[2] : (self.options.callback ? self.options.callback : null);
        self.cancelActionConfirmTxt = self.options.cancelText ? self.options.eraseText : "Si continua todos los cambios se perderán. ¿Desea continuar?";
        self.layersEditData = {};
        self.pointDrawControl = null;
        self.lineDrawControl = null;
        self.polygonDrawControl = null;
        //self.cutDrawControl = null;
        self.modifyControl = null;
    }

    static get observedAttributes() {
        return ['mode', 'stylable'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        const self = this;
        if (name === 'stylable') {
            self.#onStylableChange();
        }
        if (name === 'mode') {
            self.#onModeChange();
        }
        if (name == 'snapping') {
            self.#onSnappingChange();
        }
    }

    getClassName() {
        return className;
    }

    get stylable() {
        return this.hasAttribute('stylable');
    }

    set stylable(value) {
        this.toggleAttribute('stylable', !!value);
    }

    async #onStylableChange() {
        const self = this;
        const controls = await Promise.all([
            self.getModifyControl(),
            self.getPointDrawControl(),
            self.getLineDrawControl(),
            self.getPolygonDrawControl()
        ]);
        const isStylable = self.stylable;
        controls.forEach(c => c.stylable = isStylable);
    }

    get snapping() {
        return this.hasAttribute('snapping');
    }

    set snapping(value) {
        this.toggleAttribute('snapping', !!value);
    }

    async #onSnappingChange() {
        const self = this;
        const snapping = self.snapping;
        (await self.getPointDrawControl()).snapping = snapping;
        (await self.getLineDrawControl()).snapping = snapping;
        (await self.getPolygonDrawControl()).snapping = snapping;
    }

    get mode() {
        const self = this;
        if (self.hasAttribute('mode')) {
            return self.getAttribute('mode');
        }
        return Edit.mode.MODIFY;
    }

    set mode(value) {
        this.setAttribute('mode', value || '');
    }

    get otherToolsIncluded() {
        const self = this;
        return !self.hasAttribute('no-other-tools');
    }

    set otherToolsIncluded(value) {
        this.toggleAttribute('no-other-tools', !value);
    }

    #onModeChange() {
        const self = this;
        const mode = self.mode;
        //setFeatureSelectReadyState(self);

        var activateDraw = function (draw) {
            if (draw) {
                if (self.snapping) {
                    draw.snapping = self.layer;
                }
                draw.activate();
            }
        };

        Promise.all([
            self.getPointDrawControl(),
            self.getLineDrawControl(),
            self.getPolygonDrawControl(),
            //self._cutDrawCtlPromise,
            self.getModifyControl()
        ]).then(function (controls) {
            const pointDrawControl = controls[0];
            const lineDrawControl = controls[1];
            const polygonDrawControl = controls[2];
            //const cutDrawControl = controls[3];
            const modifyControl = controls[3];
            switch (mode) {
                case Edit.mode.MODIFY:
                    modifyControl.activate();
                    break;
                case Edit.mode.ADDPOINT:
                    activateDraw(pointDrawControl);
                    self.#measurementControl.mode = Consts.geom.POINT;
                    break;
                case Edit.mode.ADDLINE:
                    activateDraw(lineDrawControl);
                    self.#measurementControl.mode = Consts.geom.POLYLINE;
                    break;
                case Edit.mode.ADDPOLYGON:
                    activateDraw(polygonDrawControl);
                    self.#measurementControl.mode = Consts.geom.POLYGON;
                    break;
                case Edit.mode.OTHER:
                    if (controls.indexOf(self.map.activeControl) >= 0) {
                        self.map.activeControl.deactivate();
                    }
                    break;
                default:
                    if (controls.indexOf(self.map.activeControl) >= 0) {
                        self.map.activeControl.deactivate();
                    }
                    //if (cutDrawControl.isActive) {
                    //    cutDrawControl.deactivate();
                    //}
                    break;
            }

            if (mode) {
                const tab = self.querySelector(`${self.#selectors.MODE_TAB}[for="${self.id}-mode-${mode}"]`);
                tab.selected = true;
            }
            else {
                self.querySelectorAll(self.#selectors.MODE_TAB).forEach(function (tab) {
                    tab.selected = false;
                });
            }
        });
    }

    /* Extendemos el método register. 
       La lógica del control suele definirse aquí. */
    async register(map) {
        const self = this;

        await super.register.call(self, map);

        self.#measurementControl = self.querySelector('sitna-measurement');
        self.#measurementControl.displayElevation = self.options.displayElevation;

        //self._cutDrawCtlPromise = map.addControl(DRAW, {
        //    id: self.getUID(),
        //    div: self.querySelector(`.${self.CLASS}-cut`),
        //    mode: Consts.geom.POLYLINE,
        //    snapping: true,
        //    styles: {
        //        line: {
        //            lineDash: [5, 5]
        //        }
        //    },
        //    layer: false
        //});


        if (Array.isArray(self.options.modes) && self.options.modes.length == 1) {
            self.mode = self.options.modes[0];
        }

        map.loaded(function () {
            self.setLayer(self.options.layer);
        });

        map
            .on(Consts.event.RESULTSPANELCLOSE, function (e) {
                if (e.control === self.featureImportPanel) {
                    self.featuresToImport = [];
                    self.getHighlightsLayer().then(l => l.clearFeatures());
                }
            })
            .on(Consts.event.LAYERREMOVE + ' ' + Consts.event.FEATURESCLEAR, function (e) {
                if (self.featureImportPanel && !self.featureImportPanel.div.classList.contains(Consts.classes.HIDDEN)) {
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
            .on(Consts.event.FEATUREREMOVE, function (e) {
                if (self.featureImportPanel && !self.featureImportPanel.div.classList.contains(Consts.classes.HIDDEN)) {
                    self.getHighlightsLayer().then(function (hlLayer) {
                        for (var i = 0, ii = self.featuresToImport.length; i < ii; i++) {
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
            .on(Consts.event.LAYERUPDATE, function (e) { // TODO: Actualizar cuando la capa ya existe en la lista
                if (self.featureImportPanel && !self.featureImportPanel.div.classList.contains(Consts.classes.HIDDEN)) {
                    const layerObj = self.getAvailableFeaturesToImport().find(l => l.id === e.layer.id);
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
            .on(Consts.event.FEATUREADD + ' ' + Consts.event.FEATURESADD, function (e) {
                if (self.featureImportPanel && !self.featureImportPanel.div.classList.contains(Consts.classes.HIDDEN)) {
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
            })
            .on(Consts.event.CONTROLACTIVATE, function (e) {
                switch (e.control) {
                    case self.pointDrawControl:
                        self.#measurementControl.setMode(Consts.geom.POINT);
                        break;
                    case self.lineDrawControl:
                        self.#measurementControl.setMode(Consts.geom.POLYLINE);
                        break;
                    case self.polygonDrawControl:
                        self.#measurementControl.setMode(Consts.geom.POLYGON);
                        break;
                    default:
                        self.#measurementControl.clear();
                        break;
                }
            });
        return self;
    }

    #getModeTab(mode) {
        const self = this;
        return self.querySelector(`sitna-tab[for="${self.id}-mode-${mode}"]`);
    }


    async loadTemplates() {
        const self = this;

        const mainTemplatePromise = import('../templates/tc-ctl-edit.mjs');
        const attributesTemplatePromise = import('../templates/tc-ctl-edit-attr.mjs');
        const importTemplatePromise = import('../templates/tc-ctl-edit-import.mjs');
        const importLayerTemplatePromise = import('../templates/tc-ctl-edit-import-layer.mjs');
        const importFeatureTemplatePromise = import('../templates/tc-ctl-edit-import-feature.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-attr'] = (await attributesTemplatePromise).default;
        template[self.CLASS + '-import'] = (await importTemplatePromise).default;
        template[self.CLASS + '-import-layer'] = (await importLayerTemplatePromise).default;
        template[self.CLASS + '-import-feature'] = (await importFeatureTemplatePromise).default;
        self.template = template;
    }

    async render(callback) {
        const self = this;
        await self._set1stRenderPromise(super.renderData.call(self, {
            controlId: self.id,
            stylable: self.stylable,
            snapping: self.snapping,
            otherToolsIncluded: self.otherToolsIncluded
        }));

        const controls = await Promise.all([
            self.getPointDrawControl(),
            self.getLineDrawControl(),
            self.getPolygonDrawControl(),
            //self._cutDrawCtlPromise,
            self.getModifyControl()
        ]);
        self.pointDrawControl = controls[0];
        self.lineDrawControl = controls[1];
        self.polygonDrawControl = controls[2];
        self.pointDrawControl.id = self.getUID();
        self.lineDrawControl.id = self.getUID();
        self.polygonDrawControl.id = self.getUID();
        self.pointDrawControl.snapping = self.snapping;
        self.lineDrawControl.snapping = self.snapping;
        self.polygonDrawControl.snapping = self.snapping;
        //self.cutDrawControl = controls[3];
        self.modifyControl = controls[3];
        self.modifyControl.id = self.getUID();

        const addElevation = async function (feature) {
            if (self.map.options.elevation && feature.getGeometryStride() > 2) {
                let changed = false;
                let elevationTool;
                for (const point of Geometry.iterateCoordinates(feature.geometry)) {
                    if (!point[2]) {
                        elevationTool = elevationTool || await self.map.getElevationTool();
                        const newCoords = await elevationTool.getElevation({
                            coordinates: [point]
                        });
                        if (newCoords?.length) {
                            changed = true;
                            point[2] = newCoords[0][2];
                        }
                    }
                }
                if (changed) {
                    feature.setCoordinates(feature.geometry);
                }
            }
        };

        const drawstartHandler = function (e) {
            self.#measurementControl.clearMeasurement();
            if (e.feature) {
                self.#cacheOriginalFeature(e.feature);
            }
        };
        const drawendHandler = async function (e) {
            await addElevation(e.feature);
            self.trigger(Consts.event.DRAWEND, { feature: e.feature });
        };
        const drawcancelHandler = function () {
            self.cancel();
        };
        const measureHandler = function (e) {
            self.#measurementControl.displayMeasurement(e);
        };
        self.pointDrawControl
            .on(Consts.event.DRAWEND, drawendHandler)
            .on(Consts.event.DRAWCANCEL, drawcancelHandler)
            .on(Consts.event.MEASURE + ' ' + Consts.event.MEASUREPARTIAL, measureHandler);
        self.lineDrawControl
            .on(Consts.event.DRAWSTART, drawstartHandler)
            .on(Consts.event.DRAWEND, drawendHandler)
            .on(Consts.event.DRAWCANCEL, drawcancelHandler)
            .on(Consts.event.MEASURE + ' ' + Consts.event.MEASUREPARTIAL, measureHandler);
        self.polygonDrawControl
            .on(Consts.event.DRAWSTART, drawstartHandler)
            .on(Consts.event.DRAWEND, drawendHandler)
            .on(Consts.event.DRAWCANCEL, drawcancelHandler)
            .on(Consts.event.MEASURE + ' ' + Consts.event.MEASUREPARTIAL, measureHandler);
        //self.cutDrawControl
        //    .on(Consts.event.DRAWEND, function (e) {
        //        //TC.loadJS(
        //        //    !window.turf && !turf.lineSplit,
        //        //    [TC.apiLocation + 'lib/turf/line-split'],
        //        //    function () {

        //        //    }
        //        //);

        //        //self.layer.features.filter(f => f)
        //    })
        //    .on(Consts.event.DRAWCANCEL, drawcancelHandler);
        self.modifyControl
            .on(Consts.event.FEATUREMODIFY, async function onFeatureModify(e) {
                if (e.layer === self.layer) {
                    self.#measurementControl.displayMeasurement(e.feature);
                }
                await addElevation(e.feature);
                self.trigger(Consts.event.FEATUREMODIFY, { feature: e.feature, layer: e.layer });
            })
            .on(Consts.event.FEATUREADD, function (e) {
                self.trigger(Consts.event.FEATUREADD, { feature: e.feature, layer: e.layer });
            })
            .on(Consts.event.FEATUREREMOVE, function (e) {
                self.trigger(Consts.event.FEATUREREMOVE, { feature: e.feature, layer: e.layer });
            })
            .on(Consts.event.FEATURESSELECT + ' ' + Consts.event.FEATURESUNSELECT, function (_e) {
                const features = self.modifyControl.getSelectedFeatures();
                if (features.length) {
                    self.#measurementControl.displayMeasurement(features[features.length - 1]);
                }
                else {
                    self.#measurementControl.clearMeasurement();
                }
            });

        self.modifyControl.displayAttributes = function () {
            const selectedFeatures = self.getSelectedFeatures();
            const feature = selectedFeatures[selectedFeatures.length - 1];
            if (feature) {
                const data = feature.getData() || {};
                self
                    .modifyControl
                    .querySelector('.' + self.modifyControl.CLASS + '-btn-attr')
                    .classList.add(Consts.classes.ACTIVE);
                let attributes = self.getLayerEditData(feature.layer).attributes;
                if (!Object.keys(attributes).length) {
                    // No hay información de capa concerniente a atributos. 
                    // Tomamos los de la entidad seleccionada
                    const feature = self.getSelectedFeatures()[0];
                    if (feature && Object.keys(data).length) {
                        attributes = {};
                        for (var key in data) {
                            attributes[key] = { name: key, value: data[key] };
                        }
                    }
                }
                const attrArray = Object.keys(attributes).map(k => attributes[k]);
                const jfa = self._joinedFeatureAttributes || [];

                attrArray.forEach(function (attributeObj) {
                    attributeObj.value = data[attributeObj.name];
                    if (attributeObj.name === 'id') {
                        attributeObj.readOnly = true;
                    }
                    attributeObj.availableValues = [];
                    jfa.forEach(function (jfaObj) {
                        const val = jfaObj[attributeObj.name];
                        if (val !== undefined && val !== '') {
                            attributeObj.availableValues.push(val);
                        }
                    });
                });

                attrArray.forEach(function (attributeObj) {
                    if (attributeObj.type === 'date') {
                        if (attributeObj.value) {
                            attributeObj.value = new Date(attributeObj.value).toISOString().substr(0, 10);
                        }
                    }
                    else if (attributeObj.type === 'dateTime') {
                        if (attributeObj.value) {
                            attributeObj.value = new Date(attributeObj.value).toISOString().substr(0, 19);
                        }
                    }
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
                    const contentDiv = self.getAttributeDisplayTarget();
                    contentDiv.classList.remove(Consts.classes.HIDDEN);
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

                    contentDiv.querySelector(`.${self.modifyControl.CLASS}-btn-attr-ok`).addEventListener(Consts.event.CLICK, function (_e) {
                        self.modifyControl._onAttrOK();
                    }, { passive: true });

                    contentDiv.querySelector(`.${self.modifyControl.CLASS}-btn-attr-cancel`).addEventListener(Consts.event.CLICK, function (_e) {
                        self.modifyControl.closeAttributes();
                    }, { passive: true });
                });
            }
        };

        self.modifyControl._onAttrOK = function () {
            const that = this;
            const feature = that.getSelectedFeatures()[0];
            if (feature) {
                const data = {};
                const attributes = self.getLayerEditData(feature.layer).attributes;
                const layerHasInfo = Object.keys(attributes).length > 0;
                const inputs = that.getAttributeDisplayTarget().querySelectorAll('input');
                inputs.forEach(function (input) {
                    var name = input.getAttribute('name');
                    var value = input.value;
                    if (layerHasInfo) {
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
                                // Obtiene el valor yyyy-mm-dd
                                if (value) {
                                    data[name] = new Date(value).toISOString().substr(0, 10);
                                }
                                else {
                                    data[name] = value;
                                }
                                break;
                            case 'dateTime':
                                // Obtiene el valor yyyy-mm-ddThh:mm:ss
                                if (value) {
                                    data[name] = new Date(value).toISOString().substr(0, 19);
                                }
                                else {
                                    data[name] = value;
                                }
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
                    }
                    else {
                        data[name] = value;
                    }
                });
                feature.setData(data);
                that.trigger(Consts.event.FEATUREMODIFY, { feature: feature, layer: that.layer });
                that.closeAttributes();
            }
        };


        //control de renderizado enfunción del modo de edicion
        if (Array.isArray(self.options.modes) && self.options.modes.length > 0) {
            for (var m in Edit.mode) {
                if (typeof m === 'string' && self.options.modes.indexOf(Edit.mode[m]) < 0) {
                    const tab = self.#getModeTab(Edit.mode[m]);
                    const div = tab.target;
                    div.parentElement.removeChild(div);
                    tab.parentElement.removeChild(tab);
                }
            }
            if (self.options.modes.length === 1) {
                var mode = self.options.modes[0];
                const tab = self.#getModeTab(mode);
                tab.parentElement.removeChild(tab);
            }
        }

        self.querySelectorAll(self.#selectors.MODE_TAB).forEach(function (tab) {
            tab.callback = function () {
                const targetId = this.target?.getAttribute('id');
                if (targetId) {
                    const newMode = targetId.substr(targetId.lastIndexOf('-') + 1);
                    self.mode = this.selected ? newMode : null;
                }
            }
        });

        self.querySelector(self.#classSelector + '-btn-import').addEventListener(Consts.event.CLICK, function (_e) {
            self.showFeatureImportPanel();
        }, { passive: true });

        self.querySelector(self.#classSelector + '-btn-dl').addEventListener(Consts.event.CLICK, function (_e) {
            self.getDownloadDialog().then(function (dialog) {
                const options = {
                    title: self.getLocaleString('download'),
                    fileName: self.layer.id.toLowerCase().replace(' ', '_') + '_' + Util.getFormattedDate(new Date().toString(), true),
                    elevation: self.options.downloadElevation
                };
                dialog.open(self.layer.features, options);
            });
        }, { passive: true });

        if (Util.isFunction(callback)) {
            callback();
        }
        return self;
    }

    getGeometryType(geometryType) {
        switch (geometryType) {
            case 'gml:LinearRingPropertyType':
            case 'gml:PolygonPropertyType':
            case 'LinearRingPropertyType':
            case 'PolygonPropertyType':
                return Consts.geom.POLYGON;
            case 'gml:MultiPolygonPropertyType':
            case 'gml:MultiSurfacePropertyType':
            case 'MultiPolygonPropertyType':
            case 'MultiSurfacePropertyType':
                return Consts.geom.MULTIPOLYGON;
            case 'gml:LineStringPropertyType':
            case 'gml:CurvePropertyType':
            case 'LineStringPropertyType':
            case 'CurvePropertyType':
                return Consts.geom.POLYLINE;
            case 'gml:MultiLineStringPropertyType':
            case 'gml:MultiCurvePropertyType':
            case 'MultiLineStringPropertyType':
            case 'MultiCurvePropertyType':
                return Consts.geom.MULTIPOLYLINE;
            case 'gml:PointPropertyType':
            case 'gml:MultiPointPropertyType':
            case 'PointPropertyType':
            case 'MultiPointPropertyType':
                return Consts.geom.POINT;
            case 'gml:BoxPropertyType':
            case 'BoxPropertyType':
                return Consts.geom.RECTANGLE;
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
    }

    setLayer(layer) {
        const self = this;
        self.modifyControl && self.modifyControl.unselectFeatures(self.getSelectedFeatures());
        self.layer = self.map.getLayer(layer);
        if (self.layer) {
            layer.describeFeatureType()
                .then(function (attributes) {
                    const layerEditData = {
                        attributes: {}
                    };
                    // recogemos los atributos no geométricos y definimos la geometría
                    let key;
                    for (key in attributes) {
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
                    for (key in layerEditData.attributes) {
                        const attr = layerEditData.attributes[key];
                        attr.type = attr.type.substr(attr.type.indexOf(':') + 1);
                    }
                    self.layersEditData[layer.id] = layerEditData;
                })
                .catch(function (_err) {
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
        self.mode = self.layer ? Edit.mode.MODIFY : null;
        self.#setEditState(self.layer);
        return self;
    }

    constrainModes(modes) {
        const self = this;
        if (!Array.isArray(modes)) {
            modes = [];
        }
        if (!modes.length) {
            modes = Object.values(Edit.mode);
        }
        self.modes = modes
            .filter(function (m) {
                // Quitamos los valores que no sean modos de edición
                for (var key in Edit.mode) {
                    if (Edit.mode[key] === m) {
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
            self.mode = null;
        }
        const selector = self.modes.map(m => `[for="${self.id}-mode-${m}"]`).join() || '[for]';
        self.querySelectorAll(self.#selectors.MODE_TAB).forEach(function (tab) {
            tab.disabled = !tab.matches(selector);
        });
        return self;
    }

    isFeatureAllowed(feature) {
        const self = this;
        switch (true) {
            case feature instanceof Point:
                return self.modes.includes(Edit.mode.ADDPOINT);
            case feature instanceof Polyline:
                return self.modes.includes(Edit.mode.ADDLINE);
            case feature instanceof MultiPolyline:
                return self.modes.includes(Edit.mode.ADDLINE) && self.isMultiple;
            case feature instanceof Polygon:
                return self.modes.includes(Edit.mode.ADDPOLYGON);
            case feature instanceof MultiPolygon:
                return self.modes.includes(Edit.mode.ADDPOLYGON) && self.isMultiple;
            default:
                return true;
        }
    }

    async setComplexGeometry(isMultiple) {
        const self = this;
        self.isMultiple = isMultiple;
        //(await self.getPointDrawControl()).setMode(isMultiple ? Consts.geom.MULTIPOINT : Consts.geom.POINT);
        (await self.getLineDrawControl()).setMode(isMultiple ? Consts.geom.MULTIPOLYLINE : Consts.geom.POLYLINE);
        (await self.getPolygonDrawControl()).setMode(isMultiple ? Consts.geom.MULTIPOLYGON : Consts.geom.POLYGON);
    }

    getLayerEditData(optionalLayer) {
        const self = this;
        const layer = optionalLayer || self.layer;
        if (!layer) {
            return null;
        }
        return self.layersEditData[layer.id] = self.layersEditData[layer.id] || {
            checkedOut: false
        };
    }

    cancel() {
        const self = this;
        if (Array.isArray(self.options.modes) && self.options.modes.length == 1) {
            self.mode = self.options.modes[0];
        }
        else {
            self.mode = null;
        }
        self.wrap.cancel(true, self.cancelActionConfirmTxt);
        return self;
    }

    async activate(options) {
        const self = this;
        options = options || {};
        let ctl;
        switch (options.mode) {
            case Edit.mode.ADDPOINT:
                ctl = await self.getPointDrawControl();
                break;
            case Edit.mode.ADDLINE:
                ctl = await self.getLineDrawControl();
                break;
            case Edit.mode.ADDPOLYGON:
                ctl = await self.getPolygonDrawControl();
                break;
            default:
                ctl = await self.getModifyControl();
                break;
        }

        if (ctl !== self.map.activeControl) {
            self.#previousActiveControl = self.map.activeControl;
        }
    }

    deactivate() {
        const self = this;
        if (self.#previousActiveControl) {
            self.map.previousActiveControl = self.#previousActiveControl;
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
        return self;
    }

    isExclusive() {
        return true;
    }

    getAttributeDisplayTarget() {
        return this.modifyControl?.getAttributeDisplayTarget();
    }

    //joinFeatures(features) {
    //    const self = this;
    //    if (self.geometryType === Consts.geom.MULTIPOLYLINE ||
    //        self.geometryType === Consts.geom.MULTIPOLYGON ||
    //        self.geometryType === Consts.geom.MULTIPOINT) {
    //        self._joinedFeatureAttributes = [];
    //        if (features.length > 1) {
    //            var geometries = features.map(function (elm) {
    //                self._joinedFeatureAttributes.push(elm.getData());
    //                return elm.geometry;
    //            });
    //            var newGeometry = geometries.reduce(function (a, b) {
    //                return a.concat(b);
    //            });
    //            var newFeature = new features[0].constructor(newGeometry);
    //            for (var i = 0, len = features.length; i < len; i++) {
    //                var feature = features[i];
    //                self.layer.removeFeature(feature);
    //                self.trigger(Consts.event.FEATUREREMOVE, { feature: feature });
    //            }
    //            self.layer.addFeature(newFeature).then(function (feat) {
    //                self.setSelectedFeatures([newFeature]);
    //                self.trigger(Consts.event.FEATUREADD, { feature: feat });
    //                feat.showPopup(self.attributeEditor);
    //            });
    //        }
    //        setFeatureSelectedState(self, [newFeature]);
    //    }
    //    return self;
    //}

    //splitFeatures(features) {
    //    const self = this;
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
    //            newFeatures.push(new feature.constructor([geometry[j]], { data: data }));
    //        }
    //    }
    //    for (var i = 0, len = complexFeatures.length; i < len; i++) {
    //        var feature = complexFeatures[i];
    //        self.layer.removeFeature(feature);
    //        self.trigger(Consts.event.FEATUREREMOVE, { feature: feature });
    //    }
    //    var newFeatPromises = new Array(newFeatures.length);
    //    for (var i = 0, len = newFeatures.length; i < len; i++) {
    //        const promise = newFeatPromises[i] = self.layer.addFeature(newFeatures[i]);
    //        promise.then(function (feat) {
    //            self.trigger(Consts.event.FEATUREADD, { feature: feat });
    //        });
    //    }
    //    Promise.all(newFeatPromises).then(function() {
    //        self.setSelectedFeatures(newFeatures);
    //    });
    //    setFeatureSelectedState(self, newFeatures);
    //    return self;
    //}

    //deleteFeatures(features) {
    //    const self = this;
    //    self.wrap.deleteFeatures(features);
    //    if (self.layer.features.length === 0) {
    //        self._deleteBtn.disabled = true;
    //    }
    //    return self;
    //}

    getSelectedFeatures() {
        return this.modifyControl?.getSelectedFeatures();
    }

    setSelectedFeatures(features) {
        return this.modifyControl?.setSelectedFeatures(features);
    }

    async getLayer() {
        const self = this;
        if (self.layer) {
            return self.layer;
        }
        return await self.layerPromise;
    }

    async getModifyControl() {
        const self = this;
        await self.renderPromise();
        return self.querySelector(`.${self.CLASS}-modify sitna-modify`);
    }

    async getPointDrawControl() {
        const self = this;
        await self.renderPromise();
        return self.querySelector(`.${self.CLASS}-point sitna-draw`);
    }

    async getLineDrawControl() {
        const self = this;
        await self.renderPromise();
        return self.querySelector(`.${self.CLASS}-line sitna-draw`);
    }

    async getPolygonDrawControl() {
        const self = this;
        await self.renderPromise();
        return self.querySelector(`.${self.CLASS}-polygon sitna-draw`);
    }

    //async getCutDrawControl() {
    //    const self = this;
    //    if (self._cutDrawCtlPromise) {
    //        return await self._cutDrawCtlPromise;
    //    await self.renderPromise();
    //    return self.cutDrawControl;
    //}

    async getFeatureImportPanel() {
        const self = this;
        if (!self.#featureImportPanelPromise) {
            self.#featureImportPanelPromise = self.map.addControl('resultsPanel', {
                titles: {
                    main: self.getLocaleString('importFromOtherLayer')
                }
            });
            self.featureImportPanel = await self.#featureImportPanelPromise;
        }
        return await self.#featureImportPanelPromise;
    }

    async getHighlightsLayer() {
        const self = this;
        if (!self.#highlightsLayerPromise) {
            self.#highlightsLayerPromise = self.map.addLayer({
                id: self.getUID(),
                type: Consts.layerType.VECTOR,
                title: 'Highlights Layer',
                stealth: true,
                styles: self.map.options.styles.selection || Cfg.styles.selection
            });
            self.highlightsLayer = await self.#highlightsLayerPromise;
        }
        return self.#highlightsLayerPromise;
    }

    async highlightFeatures(features) {
        const self = this;
        const highlightsLayer = await self.getHighlightsLayer();
        const featuresToHighlight = self.featuresToImport.concat(features);
        highlightsLayer.features.slice().forEach(function (feature) {
            if (!feature.original || featuresToHighlight.indexOf(feature.original) < 0) {
                highlightsLayer.removeFeature(feature);
            }
        });
        await highlightsLayer.addFeatures(featuresToHighlight
            .filter(function (feature) {
                return !highlightsLayer.features.some(function (f) {
                    return f.original && f.original === feature;
                });
            })
            .map(function (feature) {
                const newFeature = feature.clone();
                newFeature.toggleSelectedStyle(true);
                newFeature.original = feature;
                return newFeature;
            }));
    }

    getAvailableFeaturesToImport() {
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
    }

    importFeatures(features) {
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
                    case feature instanceof Polygon:
                        newFeature = new MultiPolygon([feature.geometry], featureOptions);
                        break;
                    case feature instanceof Polyline:
                        newFeature = new MultiPolyline([feature.geometry], featureOptions);
                        break;
                    default:
                        newFeature = feature.clone();
                        break;
                }
            }
            else {
                switch (true) {
                    case feature instanceof MultiPolygon:
                        newFeature = new Polygon(feature.geometry[0], featureOptions);
                        break;
                    case feature instanceof MultiPolyline:
                        newFeature = new Polyline(feature.geometry[0], featureOptions);
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
            self.trigger(Consts.event.FEATUREADD, { feature: feature, layer: self.layer });
        });

        if (failure) {
            self.map.toast(self.getLocaleString('importFromOtherLayer.warning'), { type: Consts.msgType.WARNING });
        }
        return self;
    }

    #getFeatureFromImportList(elm) {
        const self = this;
        const cb = elm.querySelector('input');
        const layer = self.map.getLayer(elm.parentElement.parentElement.dataset.layerId);
        if (layer) {
            return layer.getFeatureById(cb.value);
        }
        return null;
    }

    #setEditState(state) {
        const self = this;
        self.querySelectorAll(self.#selectors.MODE_RADIO_BUTTON).forEach(r => r.disabled = !state);
    }

    #handleCheck(checkbox) {
        const self = this;
        const feature = self.#getFeatureFromImportList(checkbox.parentElement);
        if (checkbox.checked) {
            self.featuresToImport.push(feature);
        }
        else {
            const idx = self.featuresToImport.indexOf(feature);
            if (idx >= 0) {
                self.featuresToImport.splice(idx, 1);
            }
        }
    }

    #addImportLayerEvents(li) {
        const self = this;

        li.querySelector('input').addEventListener('change', function (_e) {
            const cb = this;
            cb.parentElement.querySelectorAll('li.tc-feature input').forEach(function (ccb) {
                if (ccb.checked !== cb.checked) {
                    ccb.checked = cb.checked;
                    self.#handleCheck(ccb);
                }
            });
            self.highlightFeatures([]);
        });

        li.querySelectorAll('li.tc-feature').forEach(function (elm) {
            self.#addImportFeatureEvents(elm);
        });
    }

    #addImportFeatureEvents(li) {
        const self = this;
        const highlightListener = function (_e) {
            const feature = self.#getFeatureFromImportList(this);
            if (feature) {
                self.highlightFeatures([feature]);
            }
        };
        li.addEventListener(Consts.event.CLICK, highlightListener, { passive: true });
        li.addEventListener('mouseover', highlightListener);
        li.querySelector('input').addEventListener('change', function (_e) {
            self.#handleCheck(this);
        });
    }

    showFeatureImportPanel() {
        const self = this;

        self.featuresToImport = [];

        self.getFeatureImportPanel().then(function (panel) {
            const container = panel.getInfoContainer();
            self.getRenderedHtml(self.CLASS + '-import', { layers: self.getAvailableFeaturesToImport() }, function (html) {
                panel.open(html, container);
                container.querySelector('ul').addEventListener('mouseout', function (_e) {
                    self.highlightFeatures([]);
                });
                container.querySelectorAll('li.tc-layer').forEach(function (elm) {
                    self.#addImportLayerEvents(elm);
                });
                container.querySelector(`.${self.CLASS}-import-btn-ok`).addEventListener(Consts.event.CLICK, function (_e) {
                    self.importFeatures();
                    self.featureImportPanel.close();
                }, { passive: true });
            });
        });
    }

    async displayLayerToImport(layer) {
        const self = this;
        if (self.featureImportPanel && !self.featureImportPanel.div.classList.contains(Consts.classes.HIDDEN)) {
            const container = self.featureImportPanel.getInfoContainer();
            const list = container.querySelector(`.${self.CLASS}-import-list .tc-layers`);
            const layerElementSelector = `li[data-layer-id="${layer.id}"]`;
            const li = list.querySelector(layerElementSelector);
            if (li) {
                layer.features.forEach(function (feature) {
                    if (self.isFeatureAllowed(feature)) {
                        self.getRenderedHtml(self.CLASS + '-import-feature', layer, function (html) {
                            li.insertAdjacentHTML('beforeend', html);
                            self.#addImportFeatureEvents(li.querySelector('li:last-child'));
                        });
                    }
                });
                return li;
            }
            else {
                const html = await self.getRenderedHtml(self.CLASS + '-import-layer', { id: layer.id, title: layer.title, features: layer.features });
                list.insertAdjacentHTML('beforeend', html);
                const newLi = list.querySelector(layerElementSelector);
                self.#addImportLayerEvents(newLi);
                return newLi;
            }
        }
        return null;
    }

    #cacheOriginalFeature(feature) {
        const self = this;
        self.#originalFeatures.set(feature, feature.clone());
    }
}

customElements.get(elementName) || customElements.define(elementName, Edit);
export default Edit;
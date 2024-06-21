import TC from '../../TC';
import Consts from '../Consts';
import { Defaults } from '../Cfg';
import Util from '../Util';
import WebComponentControl from './WebComponentControl';
import './FeatureStyler';

TC.control = TC.control || {};

Consts.event.DRAWSTART = 'drawstart.tc';
Consts.event.DRAWEND = 'drawend.tc';
Consts.event.DRAWCANCEL = 'drawcancel.tc';
Consts.event.DRAWUNDO = 'drawundo.tc';
Consts.event.DRAWREDO = 'drawredo.tc';
Consts.event.POINT = 'point.tc';
Consts.event.MEASURE = 'measure.tc';
Consts.event.MEASUREPARTIAL = 'measurepartial.tc';
Consts.event.STYLECHANGE = 'stylechange.tc';
Consts.event.CHANGE = 'change';

const className = 'tc-ctl-draw';
const elementName = 'sitna-draw';

class Draw extends WebComponentControl {
    #classSelector = '.' + className;
    #style;
    #styler;
    #snapping;
    #pointClass = className + '-point';
    #lineClass = className + '-line';
    #polygonClass = className + '-polygon';
    #rectangleClass = className + '-rectangle';
    #hasOwnLayer;
    #layerPromise;
    #newBtn;
    #cancelBtn;
    #endBtn;
    #undoBtn;
    #redoBtn;
    #previousStyles = new WeakMap();

    static extensibility = {
        DISABLED: 'disabled',
        ENABLED: 'enabled',
        EXTEND_ONLY: 'extend_only'
    };

    constructor() {
        super(...arguments);
        const self = this;

        self.styles = self.options.styles || Util.extend(true, {}, Defaults.styles);
        self
            .initProperty('measurer')
            .initProperty('stylable')
            .initProperty('singleSketch')
            .initProperty('extensibleSketch')
            .initProperty('snapping')
            .initProperty('mode');
        // Si self.options.layer === false se instancia el control sin capa asociada
        self.#hasOwnLayer = !(self.options.layer === false);

        self.history = [];
        self.historyIndex = 0;
        self.exportsState = true;

        self.#layerPromise = null;

        self
            .on(Consts.event.DRAWSTART, function (e) {
                self.resetValues();
                if (e.feature) {
                    self.history = e.feature.getCoordinates();
                    self.historyIndex = self.history.length;
                }
            })
            .on(Consts.event.POINT, function (e) {
                if (self.layer && self.singleSketch && self.layer.features && self.layer.features.length > 0) {
                    self.layer.clearFeatures();
                }

                self.history.length = self.historyIndex;
                self.history[self.historyIndex++] = e.point;

                self.#setDrawState();
            })
            .on(Consts.event.DRAWEND, function (e) {
                self.#setFeatureAddReadyState();

                // Sacamos prefijo de las entidades que tienen id con formato prefijo.nnn
                const defaultPrefix = self.getLocaleString('sketch');
                const usedIds = self.layer.features.map(f => f.getId());
                const prefix = usedIds
                    .map(id => id ? id.substring(0, id.indexOf('.')) : '')
                    .map(f => f ? f : defaultPrefix)
                    .reduce((acc, cur, idx) => {
                        if (idx === 0) {
                            return cur;
                        }
                        return cur === acc ? cur : defaultPrefix
                    }, defaultPrefix);

                const featureId = TC.getUID({
                    prefix: prefix + '.',
                    banlist: usedIds
                });
                e.feature.setId(featureId);

                if (self.callback) {
                    self.callback(e.feature);
                }
            });
    }

    connectedCallback() {
        super.connectedCallback();
        const self = this;
        self.#hasOwnLayer = !self.hasAttribute('borrowed-layer');
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
    }

    get mode() {
        const self = this;
        if (self.hasAttribute('mode')) {
            return self.getAttribute('mode');
        }
        return Consts.geom.POLYLINE;
    }

    set mode(value) {
        const self = this;
        if (value) {
            self.setAttribute('mode', value);
        }
        else {
            self.removeAttribute('mode');
        }
    }

    async #onModeChange() {
        const self = this;
        const mode = self.mode;
        await self.renderPromise();
        (await self.getStyler()).mode = mode;
    }

    get stylable() {
        return this.hasAttribute('stylable');
    }

    set stylable(value) {
        this.toggleAttribute('stylable', !!value);
    }

    async #onStylableChange() {
        const self = this;
        await self.renderPromise();
        self.querySelector(`.${self.CLASS}-style`).classList.toggle(Consts.classes.HIDDEN, !self.stylable);
    }

    get measurer() {
        return this.hasAttribute('measurer');
    }

    set measurer(value) {
        this.toggleAttribute('measurer', !!value);
    }

    get snapping() {
        return this.#snapping;
    }

    set snapping(value) {
        const self = this;
        self.#snapping = value;
        if (self.isActive) {
            self.wrap.setSnapping(value);
        }
    }

    get singleSketch() {
        return this.hasAttribute('single-sketch');
    }

    set singleSketch(value) {
        this.toggleAttribute('single-sketch', !!value);
    }

    get extensibleSketch() {
        return this.hasAttribute('extensible-sketch');
    }

    set extensibleSketch(value) {
        this.toggleAttribute('extensible-sketch', !!value);
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-draw.mjs');
        self.template = module.default;
    }

    render(callback) {
        const self = this;
        let strToolTip;
        switch (self.mode) {
            case Consts.geom.POLYLINE:
            case Consts.geom.MULTIPOLYLINE:
                strToolTip = self.getLocaleString('drawLine');
                self.classList.add(self.#lineClass);
                break;
            case Consts.geom.POLYGON:
            case Consts.geom.MULTIPOLYGON:
                strToolTip = self.getLocaleString('drawPolygon');
                self.classList.add(self.#polygonClass);
                break;
            case Consts.geom.POINT:
            case Consts.geom.MULTIPOINT:
                strToolTip = self.getLocaleString('drawPoint');
                self.classList.add(self.#pointClass);
                break;
            case Consts.geom.RECTANGLE:
                strToolTip = self.getLocaleString('drawRectangle');
                self.classList.add(self.#rectangleClass);
                break;
            default:
                strToolTip = self.getLocaleString('draw');
                break;
        }
        const renderObject = {
            tooltip: strToolTip,
            stylable: self.stylable
        };
        return self.renderData(renderObject, function () {
            self.reset = true;
            self.callback = null;

            if (Util.isFunction(self.options.callback)) {
                self.callback = self.options.callback;
            }

            self.wrap = new TC.wrap.control.Draw(self);

            self.getStyler().then(styler => {
                styler.setStyles(self.styles);
            });

            self.#newBtn = self.querySelector(self.#classSelector + '-btn-new');
            self.#cancelBtn = self.querySelector(self.#classSelector + '-btn-cancel');
            self.#endBtn = self.querySelector(self.#classSelector + '-btn-end');
            self.#undoBtn = self.querySelector(self.#classSelector + '-btn-undo');
            self.#redoBtn = self.querySelector(self.#classSelector + '-btn-redo');

            self.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
        });
    }

    addUIEventListeners() {
        const self = this;
        self.getStyler().then(styler => {
            styler.addEventListener(Consts.event.STYLECHANGE, e => {
                self.wrap.setStyle();
                const eventData = {};
                eventData[e.detail.property] = e.detail.value;
                self.trigger(Consts.event.STYLECHANGE, eventData);
            });
        });

        self.#newBtn.addEventListener(Consts.event.CLICK, function () {
            self.new();
        }, { passive: true });
        self.#cancelBtn.addEventListener(Consts.event.CLICK, function () {
            self.cancel();
        }, { passive: true });
        self.#endBtn.addEventListener(Consts.event.CLICK, function () {
            self.end();
        }, { passive: true });
        self.#undoBtn.addEventListener(Consts.event.CLICK, function () {
            self.undo();
        }, { passive: true });
        self.#redoBtn.addEventListener(Consts.event.CLICK, function () {
            self.redo();
        }, { passive: true });
    }

    async register(map) {
        const self = this;
        self.styles = Util.extend(true, {}, map.options.styles, self.options.styles);
        await super.register(map);

        const styler = await self.getStyler();
        styler.setStyles(self.styles);

        self.map
            .on(Consts.event.VIEWCHANGE, function () {
                if (self.map.view === Consts.view.PRINTING) {
                    self.end();

                    // No lanzo el evento porque da error al no llegar una feature
                    // self.trigger(Consts.event.DRAWEND);
                }
            })
            .on(Consts.event.PROJECTIONCHANGE, function (e) {
                self.history.forEach(function (point, idx, arr) {
                    arr[idx] = Util.reproject(point, e.oldCrs, e.newCrs);
                });
            });

        self.#layerPromise = new Promise(function (resolve, _reject) {
            map.loaded(function () {
                if (self.options.layer) {
                    self.setLayer(self.options.layer);
                    resolve(self.layer);
                }
                else {
                    if (!self.#hasOwnLayer) {
                        resolve(null);
                    }
                    else {
                        map.addLayer({
                            id: self.getUID(),
                            title: 'DrawControl',
                            stealth: true,
                            owner: self,
                            type: Consts.layerType.VECTOR,
                            styles: {
                                point: Object.assign({}, self.styles.point),
                                line: Object.assign({}, self.styles.line),
                                polygon: Object.assign({}, self.styles.polygon)
                            }
                        }).then(function (layer) {
                            map.putLayerOnTop(layer);
                            self.setLayer(layer);
                            resolve(self.layer);
                        });
                    }
                }
            });
        });

        return self;
    }

    new() {
        const self = this;
        if (self.layer && self.singleSketch) {
            self.layer.clearFeatures();
        }
        self.#cancelBtn.disabled = false;
        self.setMode(self.mode, true);
        return self;
    }

    undo() {
        const self = this;
        let result = self.wrap.undo();
        if (result) {
            self.historyIndex--;
            self.#setDrawState();

            if (self.historyIndex <= 0) {
                self.resetValues();
            }
            self.trigger(Consts.event.DRAWUNDO);
        }

        return result;
    }

    redo() {
        const self = this;
        let result = this.wrap.redo();
        if (result) {
            self.historyIndex++;
            self.#setDrawState();
            self.trigger(Consts.event.DRAWREDO);
        }
        return result;
    }

    cancel() {
        const self = this;
        self.resetValues();
        self.#setFeatureAddReadyState();
        self.#cancelBtn.disabled = true;
        self.trigger(Consts.event.DRAWCANCEL, { ctrl: self });
        return self;
    }

    activate() {
        const self = this;
        self.#newBtn.classList.add(Consts.classes.ACTIVE);
        self.#cancelBtn.disabled = false;
        super.activate.call(self);
        self.wrap.activate(self.mode);
        self.classList.remove(self.#pointClass, self.#lineClass, self.#polygonClass, self.#rectangleClass);
        self.getStyler().then(styler => styler.mode = self.mode);
        switch (self.mode) {
            case Consts.geom.POINT:
                self.classList.add(self.#pointClass);
                break;
            case Consts.geom.POLYLINE:
                self.classList.add(self.#lineClass);
                break;
            case Consts.geom.POLYGON:
                self.classList.add(self.#polygonClass);
                break;
            case Consts.geom.RECTANGLE:
                self.classList.add(self.#rectangleClass);
                break;
            default:
                break;
        }
        return self;
    }

    deactivate() {
        const self = this;
        if (self.#newBtn) {
            self.#newBtn.classList.remove(Consts.classes.ACTIVE);
        }
        if (self.#cancelBtn) {
            self.#cancelBtn.disabled = true;
        }
        super.deactivate.call(self);
        if (self.wrap) {
            self.wrap.deactivate();
        }
        self.resetValues();
        //self.trigger(Consts.event.DRAWCANCEL, { ctrl: self });
        return self;
    }

    clear() {
        const self = this;
        if (self.layer) {
            self.layer.clearFatures();
        }
        self.resetValues();
        return self;
    }

    isExclusive() {
        return true;
    }

    end() {
        const self = this;
        self.wrap.end();
        self.resetValues();
        return self;
    }

    setMode(mode, activate) {
        const self = this;

        self.mode = mode;
        if (activate && mode) {
            //if (self.layer) {
            //self.layer.map.putLayerOnTop(self.layer);
            //}
            self.activate();
        }
        else {
            if (self.isActive) {
                self.deactivate();
            }
        }
        return self;
    }

    setStyle(style) {
        const self = this;
        style = Util.extend(self.#style, style);

        switch (self.mode) {
            case Consts.geom.POLYLINE:
            case Consts.geom.MULTIPOLYLINE:
            case Consts.geom.RECTANGLE:
                self.styles.line = style;
                break;
            case Consts.geom.POLYGON:
            case Consts.geom.MULTIPOLYGON:
                self.styles.polygon = style;
                break;
            case Consts.geom.POINT:
            case Consts.geom.MULTIPOINT:
                self.styles.point = style;
                break;
            default:
                style = {};
                break;
        }
        self.getStyler().then(styler => {
            styler.setStyles(self.styles);
            self.wrap.setStyle();
        });
    }

    getStyle() {
        return this.#styler?.getStyle();
    }

    resetStyle() {
        const self = this;
        self.getStyler().then(styler => styler.resetStyle());
        return self;
    }

    setStrokeColor(color) {
        const self = this;
        self.styler.setStrokeColor(color);
        return self;
    }

    setFillColor(color) {
        const self = this;
        self.styler.setFillColor(color);
        return self;
    }

    setFillOpacity(alpha) {
        const self = this;
        self.styler.setFillOpacityWatch(alpha);
        return self;
    }

    setStrokeWidth(width) {
        const self = this;
        self.styler.setStrokeWidth(width);
        return self;
    }

    #toggleTools(tools, visible) {
        if (tools) {
            const classToggle = visible !== undefined ? !visible : undefined;
            tools.classList.toggle(Consts.classes.HIDDEN, classToggle);
        }
    }

    toggleStyleTools(visible) {
        const self = this;
        self.#toggleTools(self.querySelector(`.${self.CLASS}-style`), visible);
        return self;
    }

    getLayer() {
        const self = this;
        if (self.layer) {
            return Promise.resolve(self.layer);
        }
        return this.#layerPromise;
    }

    setLayer(layer) {
        const self = this;
        if (self.map) {
            if (self.layer) {
                self.#previousStyles.set(self.layer, Object.assign({}, self.#style));
            }
            if (typeof layer === "string") {
                self.layer = self.map.getLayer(layer);
            }
            else {
                self.layer = layer;
            }

            self.getStyler().then(function (styler) {
                styler.setLayer(layer);
            });


            //self.styles = {};
            //const previousStyle = self.#previousStyles.get(layer);
            //if (previousStyle) {
            //    self.setStyle(previousStyle);
            //}
            //else {
            //    const layerStyles = self.layer && self.layer.styles || Cfg.styles;
            //    Util.extend(true, self.styles, self.options.styles || layerStyles);
            //    self.resetStyle();
            //}
            if (!layer && self.isActive) {
                self.deactivate();
            }
        }
        return self;
    }

    setFeature(feature) {
        this.getStyler().then(styler => styler.setFeature(feature));
        return self;
    }

    resetValues() {
        const self = this;
        self.history.length = 0;
        self.historyIndex = 0;
        self.#setDrawState();
        return self;
    }

    async getStyler() {
        const self = this;
        await self.renderPromise();
        self.#styler = self.querySelector('sitna-feature-styler');
        return self.#styler;
    }

    exportState() {
        const self = this;
        if (self.exportsState && self.layer) {
            return {
                id: self.id,
                layer: self.layer.exportState()
            };
        }
        return null;
    }

    importState(state) {
        const self = this;
        self.getLayer().then(function (layer) {
            layer.importState(state.layer);
        });
        return self;
    }

    async #setDrawState() {
        const self = this;
        await self.renderPromise();
        const mode = self.mode;
        self.#endBtn.disabled =
            self.historyIndex === 0 ||
            mode === Consts.geom.POLYGON && self.historyIndex < 3 ||
            mode === Consts.geom.POLYLINE && self.historyIndex < 2 || 
            mode === Consts.geom.RECTANGLE;
        self.#redoBtn.disabled = self.history.length === self.historyIndex;
        self.#undoBtn.disabled = self.historyIndex === 0 || self.mode === Consts.geom.RECTANGLE;
    }


    async #setFeatureAddReadyState() {
        const self = this;
        await self.renderPromise();
        self.resetValues();
        self.#endBtn.disabled = true;
        self.#cancelBtn.disabled = false;
    }
}

Draw.prototype.CLASS = 'tc-ctl-draw';
customElements.get(elementName) || customElements.define(elementName, Draw);
TC.control.Draw = Draw;
export default Draw;
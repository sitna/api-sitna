import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import { Defaults } from '../Cfg';
import Util from '../Util';
import WebComponentControl from './WebComponentControl';

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

const formatColor = function (color) {
    const match = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (match && match.length) {
        return '#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3];
    }
    return color;
};

const className = 'tc-ctl-draw';
const elementName = 'sitna-draw';

class Draw extends WebComponentControl {
    CLASS = className;
    #classSelector = '.' + className;
    #pointClass = className + '-point';
    #lineClass = className + '-line';
    #polygonClass = className + '-polygon';
    #rectangleClass = className + '-rectangle';
    #style;
    #hasOwnLayer;
    #layerPromise;
    #cancelClick;
    #newBtn;
    #cancelBtn;
    #endBtn;
    #undoBtn;
    #redoBtn;
    #strokeColorPicker;
    #strokeWidthSelector;
    #strokeWidthWatch;
    #fillColorPicker;
    #fillOpacitySelector;
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

                const featureId = TC.getUID({
                    prefix: self.getLocaleString('sketch') + '.',
                    banlist: self.layer.features.map(f => f.getId())
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

    getClassName() {
        return className;
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

    #onModeChange() {
        const self = this;
        const mode = self.mode;
        self.#style = self.getModeStyle(mode);
        self.toggleFillStyleTools(mode !== Consts.geom.POLYLINE &&
            mode !== Consts.geom.MULTIPOLYLINE &&
            mode !== Consts.geom.RECTANGLE);
    }

    get stylable() {
        return this.hasAttribute('stylable');
    }

    set stylable(value) {
        this.toggleAttribute('stylable', !!value);
    }

    #onStylableChange() {
        const self = this;
        if (self.map) {
            self.render();
        }
    }

    get measurer() {
        return this.hasAttribute('measurer');
    }

    set measurer(value) {
        this.toggleAttribute('measurer', !!value);
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
        let strokeColor;
        let strokeWidth;
        let fillColor;
        let fillOpacity;
        const styles = self.styles;
        switch (self.mode) {
            case Consts.geom.POLYLINE:
            case Consts.geom.MULTIPOLYLINE:
                strToolTip = self.getLocaleString('drawLine');
                self.classList.add(self.#lineClass);
                strokeColor = styles.line.strokeColor;
                strokeWidth = styles.line.strokeWidth;
                fillColor = styles.polygon.fillColor;
                fillOpacity = styles.polygon.fillOpacity;
                break;
            case Consts.geom.POLYGON:
            case Consts.geom.MULTIPOLYGON:
                strToolTip = self.getLocaleString('drawPolygon');
                self.classList.add(self.#polygonClass);
                strokeColor = styles.polygon.strokeColor;
                strokeWidth = styles.polygon.strokeWidth;
                fillColor = styles.polygon.fillColor;
                fillOpacity = styles.polygon.fillOpacity;
                break;
            case Consts.geom.POINT:
            case Consts.geom.MULTIPOINT:
                strToolTip = self.getLocaleString('drawPoint');
                self.classList.add(self.#pointClass);
                strokeColor = styles.point.strokeColor;
                strokeWidth = styles.point.strokeWidth;
                fillColor = styles.point.fillColor;
                fillOpacity = styles.point.fillOpacity;
                break;
            case Consts.geom.RECTANGLE:
                strToolTip = self.getLocaleString('drawRectangle');
                self.classList.add(self.#rectangleClass);
                strokeColor = styles.line.strokeColor;
                strokeWidth = styles.line.strokeWidth;
                fillColor = styles.polygon.fillColor;
                fillOpacity = 0;
                break;
            default:
                strToolTip = self.getLocaleString('draw');
                strokeColor = styles.line.strokeColor;
                strokeWidth = styles.line.strokeWidth;
                fillColor = styles.polygon.fillColor;
                fillOpacity = styles.polygon.fillOpacity;
                break;
        }
        const renderObject = {
            tooltip: strToolTip,
            strokeColor: formatColor(strokeColor),
            strokeWidth: strokeWidth,
            fillColor: formatColor(fillColor),
            fillOpacity: (fillOpacity || 0) * 100,
            stylable: self.stylable
        };
        return self._set1stRenderPromise(self.renderData(renderObject, function () {
            self.reset = true;
            self.callback = null;
            self.#cancelClick = false;

            if (Util.isFunction(self.options.callback)) {
                self.callback = self.options.callback;
            }

            self.wrap = new TC.wrap.control.Draw(self);

            self.#newBtn = self.querySelector(self.#classSelector + '-btn-new');
            self.#newBtn.addEventListener(Consts.event.CLICK, function () {
                self.new();
            }, { passive: true });

            self.#cancelBtn = self.querySelector(self.#classSelector + '-btn-cancel');
            self.#cancelBtn.addEventListener(Consts.event.CLICK, function () {
                self.cancel();
            }, { passive: true });

            self.#endBtn = self.querySelector(self.#classSelector + '-btn-end');
            self.#endBtn.addEventListener(Consts.event.CLICK, function () {
                self.end();
            }, { passive: true });

            self.#undoBtn = self.querySelector(self.#classSelector + '-btn-undo');
            self.#undoBtn.addEventListener(Consts.event.CLICK, function () {
                self.undo();
            }, { passive: true });

            self.#redoBtn = self.querySelector(self.#classSelector + '-btn-redo');
            self.#redoBtn.addEventListener(Consts.event.CLICK, function () {
                self.redo();
            }, { passive: true });

            if (self.stylable) {
                self.#strokeColorPicker = self.querySelector(self.#classSelector + '-str-c');
                self.#strokeColorPicker.addEventListener(Consts.event.CHANGE, function (e) {
                    self.setStrokeColor(e.target.value);
                });

                self.#strokeWidthSelector = self.querySelector(self.#classSelector + '-str-w');
                self.#strokeWidthSelector.addEventListener(Consts.event.CHANGE, function (e) {
                    self.setStrokeWidth(e.target.value);
                });
                self.#strokeWidthWatch = self.querySelector(self.#classSelector + '-str-w-watch');

                self.#fillColorPicker = self.querySelector(self.#classSelector + '-fll-c');
                self.#fillColorPicker.addEventListener(Consts.event.CHANGE, function (e) {
                    self.setFillColor(e.target.value);
                });
                self.#fillOpacitySelector = self.querySelector(self.#classSelector + '-fll-w');
                self.#fillOpacitySelector.addEventListener(Consts.event.CHANGE, function (e) {
                    self.setFillOpacity(parseFloat(e.target.value) / 100);
                });
            }

            if (Util.isFunction(callback)) {
                callback();
            }
        }));
    }

    async register(map) {
        const self = this;
        self.styles = Util.extend(true, {}, map.options.styles, self.options.styles);
        await super.register(map);

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
                                point: self.styles.point,
                                line: self.styles.line,
                                polygon: self.styles.polygon
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
        self.#cancelClick = true;
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
        TC.Control.prototype.activate.call(self);
        self.wrap.activate(self.mode);
        self.classList.remove(self.#pointClass, self.#lineClass, self.#polygonClass, self.#rectangleClass);
        self.toggleFillStyleTools(self.mode !== Consts.geom.POLYLINE &&
            self.mode !== Consts.geom.MULTIPOLYLINE && 
            self.mode !== Consts.geom.RECTANGLE);
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
        TC.Control.prototype.deactivate.call(self, !self.#cancelClick);
        if (self.wrap) {
            self.wrap.deactivate();
        }
        self.resetValues();
        //self.trigger(Consts.event.DRAWCANCEL, { ctrl: self });
        self.#cancelClick = false;
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
        self.renderPromise().then(function () {
            switch (self.mode) {
                case Consts.geom.POLYLINE:
                case Consts.geom.MULTIPOLYLINE:
                case Consts.geom.RECTANGLE:
                    if (style.strokeColor) {
                        self.setStrokeColor(style.strokeColor);
                    }
                    if (style.strokeWidth) {
                        self.setStrokeWidth(style.strokeWidth);
                    }
                    break;
                case Consts.geom.POLYGON:
                case Consts.geom.MULTIPOLYGON:
                    if (style.strokeColor) {
                        self.setStrokeColor(style.strokeColor);
                    }
                    if (style.strokeWidth) {
                        self.setStrokeWidth(style.strokeWidth);
                    }
                    if (style.fillColor) {
                        self.setFillColor(style.fillColor);
                    }
                    if (style.fillOpacity) {
                        self.setFillOpacity(style.fillOpacity);
                    }
                    break;
                case Consts.geom.POINT:
                case Consts.geom.MULTIPOINT:
                    if (style.strokeColor) {
                        self.setStrokeColor(style.strokeColor);
                    }
                    if (style.strokeWidth) {
                        self.setStrokeWidth(style.strokeWidth);
                    }
                    if (style.fillColor) {
                        self.setFillColor(style.fillColor);
                    }
                    if (style.fillOpacity) {
                        self.setFillOpacity(style.fillOpacity);
                    }
                    break;
                default:
                    style = {};
                    break;
            }
            self.wrap.setStyle();
        });
    }

    getStyle() {
        return this.#style;
    }

    resetStyle() {
        const self = this;
        self.setStyle(self.getModeStyle());
        return self;
    }

    getModeStyle(mode) {
        const self = this;
        mode = mode || self.mode;
        switch (mode) {
            case Consts.geom.POLYLINE:
            case Consts.geom.MULTIPOLYLINE:
            case Consts.geom.RECTANGLE:
                return self.styles.line;
            case Consts.geom.POLYGON:
            case Consts.geom.MULTIPOLYGON:
                return self.styles.polygon;
            case Consts.geom.POINT:
            case Consts.geom.MULTIPOINT:
                return self.styles.point;
            default:
                return null;
        }
    }

    #setColorWatch(colorPicker, color) {
        const toHex = c => new Number(c).toString(16).padStart(2, '0');
        if (Array.isArray(color)) {
            color = `#${toHex(color[0])}${toHex(color[1])}${toHex(color[2])}`;
        }
        else {
            const match = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
            if (match && match.length) {
                color = '#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3];
            }
        }
        colorPicker.value = color;
        if (!TC.browserFeatures.inputTypeColor()) {
            const input = colorPicker;
            input.style.backgroundColor = color;
            input.blur();
        }
    }

    setStrokeColorWatch(color) {
        const self = this;
        if (self.stylable) {
            if (color === undefined) {
                color = self.getModeStyle().strokeColor;
            }
            self.#setColorWatch(self.#strokeColorPicker, color);
        }
        return self;
    }

    setFillColorWatch(color) {
        const self = this;
        if (self.stylable) {
            if (color === undefined) {
                color = self.getModeStyle().fillColor;
            }
            self.#setColorWatch(self.#fillColorPicker, color);
        }
        return self;
    }

    #setPropertyColor(property, watchFn, color) {
        const self = this;
        const style = self.#style;
        if (style) {
            watchFn.call(self, color);
            const currentValue = style[property];
            if (currentValue === color) {
                return self;
            }
            style[property] = color;
        }

        self.wrap.setStyle();

        self.trigger(Consts.event.STYLECHANGE, { property: property, value: color });
        return self;
    }

    setStrokeColor(color) {
        const self = this;
        return self.#setPropertyColor('strokeColor', self.setStrokeColorWatch, color);
    }

    setFillColor(color) {
        const self = this;
        return self.#setPropertyColor('fillColor', self.setFillColorWatch, color);
    }

    setFillOpacityWatch(percentage) {
        const self = this;
        if (self.stylable) {
            if (percentage === undefined) {
                percentage = Math.round(self.getModeStyle().fillOpacity * 100);
            }
            percentage = parseInt(percentage, 10);
            if (!Number.isNaN(percentage)) {
                self.#fillOpacitySelector.value = percentage;
            }
        }
        return self;
    }

    setFillOpacity(alpha) {
        const self = this;
        if (!Number.isNaN(alpha)) {
            self.setFillOpacityWatch(Math.round(alpha * 100));
            const style = self.#style;
            if (style) {
                if (style.fillOpacity === alpha) {
                    return self;
                }
                style.fillOpacity = alpha;
            }

            self.wrap.setStyle();

            self.trigger(Consts.event.STYLECHANGE, { property: 'fillOpacity', value: alpha });
        }
        return self;
    }

    setStrokeWidthWatch(width) {
        const self = this;
        if (self.stylable) {
            if (width === undefined) {
                width = self.getModeStyle().strokeWidth;
            }
            width = parseInt(width, 10);
            if (!Number.isNaN(width)) {
                self.#strokeWidthSelector.value = width;
                self.#strokeWidthWatch.style.borderBottomWidth = width + 'px';
            }
        }
        return self;
    }

    setStrokeWidth(width) {
        const self = this;
        width = parseInt(width, 10);
        if (!Number.isNaN(width)) {
            self.setStrokeWidthWatch(width);
            const style = self.#style;
            if (style) {
                if (style.strokeWidth === width) {
                    return self;
                }
                style.strokeWidth = width;
            }

            self.wrap.setStyle();

            self.trigger(Consts.event.STYLECHANGE, { property: 'strokeWidth', value: width });
        }
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

    toggleFillStyleTools(visible) {
        const self = this;
        self.#toggleTools(self.querySelector(`.${self.CLASS}-style-fill`), visible);
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

            self.styles = {};
            const previousStyle = self.#previousStyles.get(layer);
            if (previousStyle) {
                self.setStyle(previousStyle);
            }
            else {
                const layerStyles = self.layer && self.layer.styles || Cfg.styles;
                Util.extend(true, self.styles, self.options.styles || layerStyles);
                self.resetStyle();
            }
        }
    }

    resetValues() {
        const self = this;
        self.history.length = 0;
        self.historyIndex = 0;
        self.#setDrawState();
        return self;
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
            mode === Consts.geom.POLYLINE && self.historyIndex < 2;
        self.#redoBtn.disabled = self.history.length === self.historyIndex;
        self.#undoBtn.disabled = self.historyIndex === 0;
    }


    async #setFeatureAddReadyState() {
        const self = this;
        await self.renderPromise();
        self.resetValues();
        self.#endBtn.disabled = true;
        self.#cancelBtn.disabled = false;
    }
}

customElements.get(elementName) || customElements.define(elementName, Draw);
TC.control.Draw = Draw;
export default Draw;
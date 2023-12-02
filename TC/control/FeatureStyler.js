import TC from '../../TC';
import Consts from '../Consts';
import { Defaults } from '../Cfg';
import Util from '../Util';
import WebComponentControl from './WebComponentControl';
import Point from '../../SITNA/feature/Point';
import MultiPoint from '../../SITNA/feature/MultiPoint';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';

Consts.event.STYLECHANGE = 'stylechange.tc';

const className = 'tc-ctl-fstyler';
const elementName = 'sitna-feature-styler';

const formatColor = function (color) {
    if (color) {
        const match = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
        if (match && match.length) {
            return '#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3];
        }
    }
    return color;
};

class FeatureStyler extends WebComponentControl {
    CLASS = className;
    #classSelector = '.' + className;
    #style;
    #strokeColorPicker;
    #strokeWidthSelector;
    #strokeWidthWatch;
    #fillColorPicker;
    #fillOpacitySelector;
    #radiusSelector;
    #initialStyles;
    #previousStyles = new WeakMap();

    constructor() {
        super(...arguments);
        const self = this;

        self.#initialStyles = self.options.styles || Util.extend(true, {}, Defaults.styles);
        self.styles = self.#initialStyles;
        self.initProperty('mode');
        self.setStyle(self.getModeStyle());
    }

    static get observedAttributes() {
        return ['mode', 'disabled'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        const self = this;
        if (name === 'mode') {
            self.#onModeChange();
        }
        if (name === 'disabled') {
            self.#onDisabledChange();
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
        return Consts.geom.POINT;
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
        self.#toggleFillStyleTools(mode !== Consts.geom.POLYLINE &&
            mode !== Consts.geom.MULTIPOLYLINE &&
            mode !== Consts.geom.RECTANGLE);
        self.#toggleRadiusStyleTools(mode === Consts.geom.POINT ||
            mode === Consts.geom.MULTIPOINT);
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        this.toggleAttribute('disabled', !!value);
    }

    #onDisabledChange() {
        const self = this;
        self.querySelectorAll('input').forEach(i => i.disabled = self.disabled);
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-fstyler.mjs');
        self.template = module.default;
    }

    render(callback) {
        const self = this;
        let strokeColor;
        let strokeWidth;
        let fillColor;
        let fillOpacity;
        let radius;
        const styles = self.styles;
        switch (self.mode) {
            case Consts.geom.POLYLINE:
            case Consts.geom.MULTIPOLYLINE:
                strokeColor = styles.line.strokeColor;
                strokeWidth = styles.line.strokeWidth;
                break;
            case Consts.geom.POLYGON:
            case Consts.geom.MULTIPOLYGON:
                strokeColor = styles.polygon.strokeColor;
                strokeWidth = styles.polygon.strokeWidth;
                fillColor = styles.polygon.fillColor;
                fillOpacity = styles.polygon.fillOpacity;
                break;
            case Consts.geom.POINT:
            case Consts.geom.MULTIPOINT:
                strokeColor = styles.point.strokeColor;
                strokeWidth = styles.point.strokeWidth;
                fillColor = styles.point.fillColor;
                fillOpacity = styles.point.fillOpacity;
                radius = styles.point.radius;
                break;
            case Consts.geom.RECTANGLE:
                strokeColor = styles.line.strokeColor;
                strokeWidth = styles.line.strokeWidth;
                fillColor = styles.polygon?.fillColor;
                fillOpacity = 0;
                break;
            default:
                strokeColor = styles.line?.strokeColor;
                strokeWidth = styles.line?.strokeWidth;
                fillColor = styles.polygon?.fillColor;
                fillOpacity = styles.polygon?.fillOpacity;
                break;
        }
        const renderObject = {
            strokeColor: formatColor(strokeColor),
            strokeWidth: strokeWidth,
            fillColor: formatColor(fillColor),
            fillOpacity: (fillOpacity || 0) * 100,
            radius: radius
        };
        return self._set1stRenderPromise(self.renderData(renderObject, function () {
            self.#onModeChange();
            self.#onDisabledChange();
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
            self.#radiusSelector = self.querySelector(self.#classSelector + '-rad-w');
            self.#radiusSelector.addEventListener(Consts.event.CHANGE, function (e) {
                self.setRadius(parseFloat(e.target.value));
            });

            if (Util.isFunction(callback)) {
                callback();
            }
        }));
    }

    setStyles(styles) {
        const self = this;
        self.styles = Util.extend(true, {}, styles);
        self.setStyle(self.getModeStyle());
        return self;
    }

    setStyle(style) {
        const self = this;
        const appliedStyle = Util.extend(self.#style, style);
        let newStyle = {};
        for (var key in appliedStyle) {
            if (self.#isSupportedProperty(key)) {
                newStyle[key] = appliedStyle[key];
            }
        }
        self.#style = newStyle;
        switch (self.mode) {
            case Consts.geom.POLYLINE:
            case Consts.geom.MULTIPOLYLINE:
            case Consts.geom.RECTANGLE:
                self.styles.line = newStyle;
                break;
            case Consts.geom.POLYGON:
            case Consts.geom.MULTIPOLYGON:
                self.styles.polygon = newStyle;
                break;
            case Consts.geom.POINT:
            case Consts.geom.MULTIPOINT:
                self.styles.point = newStyle;
                break;
            default:
                newStyle = {};
                break;
        }
        self.renderPromise().then(function () {
            switch (self.mode) {
                case Consts.geom.POLYLINE:
                case Consts.geom.MULTIPOLYLINE:
                case Consts.geom.RECTANGLE:
                    const lineStyle = self.styles.line;
                    if (lineStyle.strokeColor) {
                        self.setStrokeColor(lineStyle.strokeColor);
                    }
                    if (lineStyle.strokeWidth) {
                        self.setStrokeWidth(lineStyle.strokeWidth);
                    }
                    break;
                case Consts.geom.POLYGON:
                case Consts.geom.MULTIPOLYGON:
                    const polygonStyle = self.styles.polygon;
                    if (polygonStyle.strokeColor) {
                        self.setStrokeColor(polygonStyle.strokeColor);
                    }
                    if (polygonStyle.strokeWidth) {
                        self.setStrokeWidth(polygonStyle.strokeWidth);
                    }
                    if (polygonStyle.fillColor) {
                        self.setFillColor(polygonStyle.fillColor);
                    }
                    if (polygonStyle.fillOpacity) {
                        self.setFillOpacity(polygonStyle.fillOpacity);
                    }
                    break;
                case Consts.geom.POINT:
                case Consts.geom.MULTIPOINT:
                    const pointStyle = self.styles.point;
                    if (pointStyle.strokeColor) {
                        self.setStrokeColor(pointStyle.strokeColor);
                    }
                    if (pointStyle.strokeWidth) {
                        self.setStrokeWidth(pointStyle.strokeWidth);
                    }
                    if (pointStyle.fillColor) {
                        self.setFillColor(pointStyle.fillColor);
                    }
                    if (pointStyle.fillOpacity) {
                        self.setFillOpacity(pointStyle.fillOpacity);
                    }
                    break;
                default:
                    break;
            }
            self.#cacheStyles();
        });
        return self;
    }

    getStyle() {
        const self = this;
        return self.#style;
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

    #cacheStyles() {
        const self = this;
        if (self.layer) {
            self.#previousStyles.set(self.layer, self.styles);
        }
    }

    setLayer(layer) {
        const self = this;
        self.layer = layer;
        if (!layer) {
            return self;
        }
        let styles = self.#previousStyles.get(layer);
        if (!styles) {
            if (layer.styles) {
                styles = [{}, self.#initialStyles, layer.styles];
            }
            else {
                styles = [{}, self.#initialStyles].concat(layer
                    .features
                    .map(f => {
                        const style = f.getStyle();
                        if (Object.keys(style).length === 0) {
                            return null;
                        }
                        const styleObj = {};
                        switch (true) {
                            case f instanceof Polyline:
                            case f instanceof MultiPolyline:
                                styleObj.line = style;
                                break;
                            case f instanceof Polygon:
                            case f instanceof MultiPolygon:
                                styleObj.polygon = style;
                                break;
                            case f instanceof Point:
                            case f instanceof MultiPoint:
                                styleObj.point = style;
                                break;
                            default:
                                return null;
                        }
                        return styleObj;
                    })
                    .filter(style => !!style));
            }
            styles = TC.Util.extend(...styles);
        }
        self.setStyles(styles);
        return self;
    }

    #isSupportedProperty(name) {
        return name === 'strokeColor' || name === 'strokeWidth' ||
            name === 'fillColor' || name === 'fillOpacity' || 
            name === 'radius';
    }

    setFeature(feature) {
        const self = this;
        self.layer = null;
        const style = feature?.getStyle();
        switch (true) {
            case feature instanceof Polyline:
            case feature instanceof MultiPolyline:
                self.mode = Consts.geom.POLYLINE;
                break;
            case feature instanceof Point:
            case feature instanceof MultiPoint:
                self.mode = Consts.geom.POINT;
                break;
            default:
                self.mode = Consts.geom.POLYGON;
        }
        if (style && Object.keys(style).length > 0) {
            self.setStyle(style);
        }
        return self;
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
        if (color === undefined) {
            color = self.getModeStyle().strokeColor;
        }
        self.#setColorWatch(self.#strokeColorPicker, color);
        return self;
    }

    setFillColorWatch(color) {
        const self = this;
        if (color === undefined) {
            color = self.getModeStyle().fillColor;
        }
        self.#setColorWatch(self.#fillColorPicker, color);
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

        self.#triggerStyleChange({ property: property, value: color });
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
        if (percentage === undefined) {
            percentage = Math.round(self.getModeStyle().fillOpacity * 100);
        }
        percentage = parseInt(percentage, 10);
        if (!Number.isNaN(percentage)) {
            self.#fillOpacitySelector.value = percentage;
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

            self.#triggerStyleChange({ property: 'fillOpacity', value: alpha });
        }
        return self;
    }

    setStrokeWidthWatch(width) {
        const self = this;
        if (width === undefined) {
            width = self.getModeStyle().strokeWidth;
        }
        width = parseInt(width, 10);
        if (!Number.isNaN(width)) {
            self.#strokeWidthSelector.value = width;
            self.#strokeWidthWatch.style.borderBottomWidth = width + 'px';
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

            self.#triggerStyleChange({ property: 'strokeWidth', value: width });
        }
        return self;
    }

    setRadiusWatch(radius) {
        const self = this;
        if (radius === undefined) {
            radius = self.getModeStyle().radius;
        }
        radius = parseInt(radius, 10);
        if (!Number.isNaN(radius)) {
            self.#radiusSelector.value = radius;
        }
        return self;
    }

    setRadius(radius) {
        const self = this;
        radius = parseInt(radius, 10);
        if (!Number.isNaN(radius)) {
            self.setRadiusWatch(radius);
            const style = self.#style;
            if (style) {
                if (style.radius === radius) {
                    return self;
                }
                style.radius = radius;
            }

            self.#triggerStyleChange({ property: 'radius', value: radius });
        }
        return self;
    }

    #toggleTools(tools, visible) {
        if (tools) {
            const classToggle = visible !== undefined ? !visible : undefined;
            tools.classList.toggle(Consts.classes.HIDDEN, classToggle);
        }
    }

    #getFillStyleTools() {
        const self = this;
        return self.querySelector(`.${self.CLASS}-fill`);
    }

    #getRadiusStyleTools() {
        const self = this;
        return self.querySelector(`.${self.CLASS}-radius`);
    }

    #toggleFillStyleTools(visible) {
        const self = this;
        self.#toggleTools(self.#getFillStyleTools(), visible);
        return self;
    }

    #toggleRadiusStyleTools(visible) {
        const self = this;
        self.#toggleTools(self.#getRadiusStyleTools(), visible);
        return self;
    }

    #triggerStyleChange(data) {
        const self = this;
        const event = new CustomEvent(Consts.event.STYLECHANGE, { detail: data });
        self.dispatchEvent(event);
    }
}

customElements.get(elementName) || customElements.define(elementName, FeatureStyler);
TC.control.FeatureStyler = FeatureStyler;
export default FeatureStyler;
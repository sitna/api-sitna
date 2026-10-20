/**
  * Opciones de elemento de línea de tiempo.
  * @interface TimelineElementOptions
  * @see TimeSliderOptions
  * @see {@link SITNA.Consts} - La propiedad <code>layer</code> contiene identficadores de capas predefinidas disponibles.
  * @property {string} layer - Identificador de la capa correspondiente a este punto en el tiempo.
  * @property {string} from - Fecha en formato ISO 8601 a partir de la cual la capa es visible.
  * @property {string} [to] - Fecha en formato ISO 8601 hasta la cual la capa es visible.
  */


import WebComponentControl from './WebComponentControl.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import Observer from '../Observer.js';
import Controller from '../Controller.js';

const nextLayerValidate = function (current, candidate, provisional) {
    return candidate.from > current.from && (!provisional || provisional.from > candidate.from);
};

const prevLayerValidate = function (current, candidate, provisional) {
    return candidate.from < current.from && (!provisional || provisional.from < candidate.from);
};

class TimeSliderModel {
    constructor() {
        this.timeProgress = "";
        this.layerNotInTimeline = "";
    }
}

class TimeSlider extends WebComponentControl {

    static {
        customElements.define('sitna-time-slider', this);
    }

    static msPerUnit = {
        YEAR: 31536000000,
        MONTH: 2592000000,
        DAY: 86400000,
        HOUR: 3600000,
        MINUTE: 60000,
        SECOND: 1000
    }

    #stepValue;

    constructor() {
        super(...arguments);

        this.model = new TimeSliderModel();

        const stepMatch = (this.options.step || '1Y').trim().match(/^(\d*)([YyMDdHhmSs])$/);
        let unitsPerStep;
        if (stepMatch) {
            this.step = stepMatch.input;
            unitsPerStep = parseInt(stepMatch[1]);
            switch (stepMatch[2]) {
                case 'Y':
                case 'y':
                    this._msPerUnit = TimeSlider.msPerUnit.YEAR;
                    break;
                case 'M':
                    this._msPerUnit = TimeSlider.msPerUnit.MONTH;
                    break;
                case 'D':
                case 'd':
                    this._msPerUnit = TimeSlider.msPerUnit.DAY;
                    break;
                case 'H':
                case 'h':
                    this._msPerUnit = TimeSlider.msPerUnit.HOUR;
                    break;
                case 'm':
                    this._msPerUnit = TimeSlider.msPerUnit.MINUTE;
                    break;
                case 'S':
                case 's':
                    this._msPerUnit = TimeSlider.msPerUnit.SECOND;
                    break;
            }
        }
        else {
            this.step = '1Y';
            this._msPerUnit = TimeSlider.msPerUnit.YEAR;
            unitsPerStep = 1;
        }
        this.#stepValue = this._msPerUnit * unitsPerStep;

        this.timelines = [];
        this.currentTimeline = null;
        const timelines = this.options.timelines || [];
        for (const timeline of timelines) {
            const timelineWithDates = timeline.map((layerRange) => {
                const result = { ...layerRange };
                if (layerRange.from) {
                    result.from = new Date(layerRange.from);
                }
                if (layerRange.to) {
                    result.to = new Date(layerRange.to);
                }
                return result;
            });
            // Completamos los objetos de timeline poniendo límites superiores
            timelineWithDates
                .sort((a, b) => a.from.getTime() - b.from.getTime())
                .forEach((layerRange, idx, arr) => {
                    if (idx < arr.length - 1) {
                        const nextLayerRange = arr[idx + 1];
                        layerRange.to = layerRange.to ? new Date(Math.min(layerRange.to, nextLayerRange.from)) : nextLayerRange.from;
                    }
                });
            this.timelines.push(timelineWithDates);
        }
    }

    async loadTemplates() {
        const template = {};
        const mainTemplatePromise = import(
            /* webpackChunkName: "tc-ctl-time" */
            /* webpackMode: "lazy" */
            '../templates/tc-ctl-time.mjs'
        );
        template[this.CLASS] = (await mainTemplatePromise).default;
        this.template = template;
    }

    async render(callback) {
        await super.renderData({ controlId: this.getId() });

        this.slider = this.querySelector(`.${this.CLASS}-rng`);

        this.slider.addEventListener('input', (_e) => {
            this.displayValue();
            const [layerId] = this.getLayerIdsFromDate(this.getSliderTime());
            if (layerId && this.map.baseLayer.id !== layerId) {
                this.map.setBaseLayer(layerId);
            }
            this.update();
        });

        this.querySelector(`.${this.CLASS}-prev-btn`).addEventListener(Consts.event.CLICK, (_e) => {
            this.setPreviousLayer();
        }, { passive: true });

        this.querySelector(`.${this.CLASS}-next-btn`).addEventListener(Consts.event.CLICK, (_e) => {
            this.setNextLayer();
        }, { passive: true });

        this.controller = new Controller(this.model, new Observer(this));
        this.updateModel();

        if (Util.isFunction(callback)) {
            callback();
        }
    }

    async register(map) {
        await super.register(map);
        const update = () => this.update();
        map.on(Consts.event.BASELAYERCHANGE, update);
        map.loaded(update);
        return this;
    }

    enable(enabled) {
        if (arguments.length === 0 || enabled) {
            this.classList.remove(Consts.classes.DISABLED);
            this.slider.disabled = false;
        }
        else {
            this.disable();
        }
        return !this.slider.disabled;
    }

    disable() {
        this.classList.add(Consts.classes.DISABLED);
        this.slider.disabled = true;
    }

    async update(forceUpdate) {
        if (this.enable(this.isAvailable())) {
            const MAX_MILLISECONDS = 8640000000000000;
            let minFrom = new Date(MAX_MILLISECONDS);
            let maxTo = new Date(-MAX_MILLISECONDS);
            this.currentTimeline = this.timelines.find((tl) => tl.some((obj) => obj.layer === this.map.baseLayer.id));
            for (const { from, to } of this.currentTimeline) {
                if (from < minFrom) {
                    minFrom = from;
                }
                if (from > maxTo) {
                    maxTo = from;
                }
                if (to > maxTo) {
                    maxTo = to;
                }
            }

            const datalist = this.querySelector(`#${this.getId()}-time-ticks`);
            datalist.replaceChildren();
            for (const { from } of this.currentTimeline) {
                const option = document.createElement('option');
                option.value = from.valueOf();
                datalist.appendChild(option);
            }

            const axisElement = this.querySelector(`.${this.CLASS}-axis`);
            axisElement.dataset.starts = this.getDateString(minFrom);
            axisElement.dataset.ends = this.getDateString(maxTo);

            const startTimestamp = minFrom.getTime();
            let endTimestamp = maxTo.getTime();
            if ((endTimestamp - startTimestamp) % this.#stepValue !== 0) {
                endTimestamp = endTimestamp + this.#stepValue;
            }
            if (forceUpdate || this.slider.min != startTimestamp || this.slider.max != endTimestamp) {
                this.slider.setAttribute('min', startTimestamp);
                this.slider.setAttribute('max', endTimestamp);
                this.slider.setAttribute('step', this.#stepValue);
            }
            const layerRange = this.getLayerRange(this.map.baseLayer);
            if (layerRange.from != this.slider.value) {
                const getValue = (ts) => {
                    const dts = ts - startTimestamp;
                    const module = dts % this.#stepValue;
                    if (module === 0) {
                        return ts;
                    }
                    return ts + this.#stepValue - dts % this.#stepValue;
                };
                if (layerRange.from) {
                    this.slider.value = getValue(layerRange.from.getTime());
                }
                else if (layerRange.to) {
                    this.slider.value = getValue(layerRange.to.getTime());
                }
                this.displayValue();
            }
        }
    }

    getSliderTime() {
        return new Date(parseInt(this.slider.value));
    }

    getDateString(date) {
        let dateStringOptions;
        switch (this._msPerUnit) {
            case TimeSlider.msPerUnit.SECOND:
                dateStringOptions = { dateStyle: 'short', timeStyle: 'medium' };
                break;
            case TimeSlider.msPerUnit.MINUTE:
            case TimeSlider.msPerUnit.HOUR:
                dateStringOptions = { dateStyle: 'short', timeStyle: 'short' };
                break;
            case TimeSlider.msPerUnit.DAY:
                dateStringOptions = { dateStyle: 'short' };
                break;
            case TimeSlider.msPerUnit.MONTH:
                dateStringOptions = { year: 'numeric', month: 'long' };
                break;
            default:
                dateStringOptions = { year: 'numeric' };
        }
        return date.toLocaleString(this.map.locale, dateStringOptions);
    }

    displayValue() {
        this.querySelector(`.${this.CLASS}-cur`).innerHTML = this.getDateString(this.getSliderTime());
    }

    isAvailable() {
        return this.map && this.isLayerinTimelines(this.map.baseLayer);
    }

    isLayerinTimelines(layer) {
        return this.timelines.some((tl) => tl.some((range) => range.layer === layer.id));
    }

    getLayerRange(layer) {
        for (const timeline of this.timelines) {
            for (const layerRange of timeline) {
                if (layerRange.layer === layer.id) {
                    return layerRange;
                }
            }
        }
        return null;
    }

    #setAdjacentLayer(validationFunction) {
        if (this.currentTimeline) {
            const currentLayerRange = this.getLayerRange(this.map.baseLayer);
            let nextLayerRange;
            let nextLayerId;
            for (const layerRange of this.currentTimeline) {
                if (validationFunction(currentLayerRange, layerRange, nextLayerRange)) {
                    nextLayerRange = layerRange;
                    nextLayerId = layerRange.layer;
                }
            }
            if (nextLayerId) {
                this.map.setBaseLayer(nextLayerId);
            }
        }
    }

    setNextLayer() {
        this.#setAdjacentLayer(nextLayerValidate);
    }

    setPreviousLayer() {
        this.#setAdjacentLayer(prevLayerValidate);
    }

    getLayerIdsFromDate(date) {
        const results = [];
        if (this.currentTimeline) {
            for (const range of this.currentTimeline) {
                if (range.from <= date && (!range.to || range.to > date)) {
                    results.push(range.layer);
                }
            }
        }
        return results;
    }

    updateModel() {
        for (const key of Object.keys(this.model)) {
            if (!key.startsWith("#")) {
                this.model[key] = this.getLocaleString(key);
            }
        }
    }
}

TimeSlider.prototype.CLASS = 'tc-ctl-time';
export default TimeSlider;
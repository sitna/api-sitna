
/**
  * Opciones de control de comparación de capas.
  * @interface LayerComparerOptions
  * @extends ControlOptions
  * @see SITNA.control.LayerComparer
  * @see MapControlsOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {SITNA.control.LayerComparer.view} [view] - Vista inicial del comparador de capas.
  * @property {SITNA.control.LayerComparer.view[]} [availableViews] - Vistas disponibles para el comparador de capas. Si no se especifica, se habilitan todas las vistas.
  * @property {number} [secondaryMapCount=1] - Número de mapas secundarios para comparar. Solo es relevante para las vistas que permiten comparar más de una capa (vista partida y de transparencia). Si no se especifica, se crea un solo mapa secundario.
  * @property {number} [spyglassMaxRadius] - Radio máximo en píxeles de la ventana en la vista de catalejo. Si no se especifica, se establece a al valor máximo en que la ventana se pueda ver completa.
  * @property {number} [spyglassMinRadius] - Radio mínimo en píxeles de la ventana en la vista de catalejo. Si no se especifica, se establece a un octavo del radio máximo.
  * @property {Array<string|LayerOptions>} [secondaryBaseLayers] - Identificadores de capa para usar como mapa de fondo por defecto u objeto de opciones de capa. Si no se especifica, se usará la capa de fondo por defecto del mapa principal.
  * @property {TimelineElementOptions[][]} [timelines] - Líneas de tiempo disponibles para el comparador de capas. Cada línea 
  * de tiempo es un array de elementos {@link TimelineElementOptions}. Si se especifica, se habilitará la vista de línea de tiempo.
  * @example <caption>[Ver en vivo](../examples/control.LayerComparer.html)</caption> {@lang html}
    <div id="my-map"></div>
    <script>
        // Creamos un mapa con un control LayerComparer.
        const myMap = new SITNA.Map("my-map", {
            layout: "layout/ctl-container",
            controls: {
                layerComparer: {
                    div: "slot1",
                    view: SITNA.control.LayerComparer.view.SWIPE,
                    availableViews: [
                        SITNA.control.LayerComparer.view.SINGLE,
                        SITNA.control.LayerComparer.view.TRANSPARENCY,
                        SITNA.control.LayerComparer.view.SWIPE,
                        SITNA.control.LayerComparer.view.SPYGLASS,
                        SITNA.control.LayerComparer.view.SPLIT,
                        SITNA.control.LayerComparer.view.TIMELINE
                    ],
                    secondaryBaseLayers: [SITNA.Consts.layer.IDENA_ORTHOPHOTO],
                    timelines: [
                        [
                            {
                                layer: SITNA.Consts.layer.IDENA_ORTHOPHOTO2012,
                                from: "2012-01-01",
                            },
                            {
                                layer: SITNA.Consts.layer.IDENA_ORTHOPHOTO2014,
                                from: "2014-01-01"
                            },
                            {
                                layer: SITNA.Consts.layer.IDENA_ORTHOPHOTO2017,
                                from: "2017-01-01"
                            },
                            {
                                layer: SITNA.Consts.layer.IDENA_ORTHOPHOTO2018,
                                from: "2018-01-01"
                            },
                            {
                                layer: SITNA.Consts.layer.IDENA_ORTHOPHOTO2019,
                                from: "2019-01-01"
                            },
                            {
                                layer: SITNA.Consts.layer.IDENA_ORTHOPHOTO2020,
                                from: "2020-01-01"
                            },
                            {
                                layer: SITNA.Consts.layer.IDENA_ORTHOPHOTO2021,
                                from: "2021-01-01"
                            },
                            {
                                layer: SITNA.Consts.layer.IDENA_ORTHOPHOTO2022,
                                from: "2022-01-01"
                            },
                            {
                                layer: SITNA.Consts.layer.IDENA_ORTHOPHOTO2023,
                                from: "2023-01-01"
                            },
                            {
                                layer: SITNA.Consts.layer.IDENA_ORTHOPHOTO,
                                from: "2025-01-01"
                            }
                        ]
                    ]
                }
            }
        });
    </script>
  * @example <caption>[Ver en vivo](../examples/control.LayerComparer.secondaryMapCount.html)</caption> {@lang html}
    <div id="my-map"></div>
    <script>
        // Creamos un mapa con un control LayerComparer configurado para tener dos mapas secundarios.
        const myMap = new SITNA.Map("my-map", {
            layout: "layout/ctl-container",
            controls: {
                layerComparer: {
                    div: "slot1",
                    secondaryMapCount: 2,
                    view: SITNA.control.LayerComparer.view.SPLIT,
                    availableViews: [
                        SITNA.control.LayerComparer.view.SPLIT,
                        SITNA.control.LayerComparer.view.TRANSPARENCY
                    ],
                    secondaryBaseLayers: [
                        SITNA.Consts.layer.IDENA_ORTHOPHOTO,
                        SITNA.Consts.layer.IDENA_ORTHOPHOTO2012
                    ]
                }
            }
        });
    </script>
  */

import TC from '../../TC.js';
import Consts from '../Consts.js';
import Cfg from '../Cfg.js';
import Util from '../Util.js';
import WebComponentControl from './WebComponentControl.js';
import LayerComparerWrapper from '../ol/LayerComparer.js';
import Observer from '../Observer.js';
import Controller from '../Controller.js';
import FeatureTools from './FeatureTools.js';
import Draw from './Draw.js';
import Measure from './Measure.js';
import FeatureInfoCommons from './FeatureInfoCommons.js';

class LayerComparerModel {
    constructor() {
        this.compareLayers = "";
        this.spyglassDiameter = "";
        this.transparencyDegree = "";
        this.secondaryLayersTransparencyDegree = "";
        this.swapLayers = "";
        this.comparativeViewTypes = "";
    }
}

/**
 * Este control permite comparar visualmente 
 * varias capas de fondo de un mapa mediante diferentes métodos, como la transparencia, el deslizamiento o la lupa.
 * @class LayerComparer
 * @memberof SITNA.control
 * @extends SITNA.control.Control
 * @summary `<sitna-layer-comparer>`<p>Clase que implementa el control de comparación de capas de fondo.</p>
 * @implements {MapControl}
 * @param {HTMLElement|string} [container] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
 * @param {LayerComparerOptions} [options] - Opciones de configuración del control.
 * @see {@link SITNA.Map#addControl}
 */

class LayerComparer extends WebComponentControl {

    static {
        customElements.define('sitna-layer-comparer', this);
    }

    /**
     * Vistas disponibles para el comparador de capas.
     * @readonly
     * @static
     * @memberof SITNA.control.LayerComparer
     * @property {string} SINGLE="single" - Vista simple, sin comparación
     * @property {string} TRANSPARENCY="transparency" - Vista de transparencia
     * @property {string} SPLIT="split" - Vista de división
     * @property {string} SWIPE="swipe" - Vista de cortina
     * @property {string} SPYGLASS="spyglass" - Vista de catalejo
     * @property {string} TIMELINE="timeline" - Vista de línea de tiempo
     */
    static view = {
        SINGLE: 'single',
        TRANSPARENCY: 'transparency',
        SPLIT: 'split',
        SWIPE: 'swipe',
        SPYGLASS: 'spyglass',
        TIMELINE: 'timeline',
    };

    SWIPE_SLIDER_TOUCH_WIDTH = '32px';
    /**
     * Lista de mapas secundarios que muestran las capas comparadas.
     * @instance
     * @memberof SITNA.control.LayerComparer
     * @type {Array<SITNA.Map>}
     */
    secondaryMaps = [];
    #secondaryCursors = [];
    #secondaryMapOpacities = [];

    #eventHandlers = {};
    #layerReplicas;
    #layerOriginals;
    #featureReplicas;
    #controlReplicas;
    #spyglassX;
    #spyglassY;
    #dialogElement;

    constructor() {
        super(...arguments);
        this.exportsState = true;

        this.wrap = new LayerComparerWrapper(this);

        this.model = new LayerComparerModel();

        this.secondaryMapCount = this.options.secondaryMapCount || 1;
        this.mainBaseLayerSelector = null;
        this.secondaryBaseLayerSelectors = new Array(this.secondaryMapCount);
    }

    async loadTemplates() {
        const template = {};
        const mainTemplatePromise = import(
            /* webpackChunkName: "tc-ctl-lcomp" */
            /* webpackMode: "lazy" */
            '../templates/tc-ctl-lcomp.mjs'
        );
        template[this.CLASS] = (await mainTemplatePromise).default;
        this.template = template;
    }

    async render(callback) {
        const layers = new Array(this.secondaryMapCount);
        layers.fill(1);
        const views = this.options.availableViews ?? Object.values(LayerComparer.view);
        if (!this.options.timelines && views.includes(LayerComparer.view.TIMELINE)) {
            views.splice(views.indexOf(LayerComparer.view.TIMELINE), 1);
        }
        await this.renderData({
            controlId: this.getId(),
            showButton: views.length > 1,
            layers,
            spyglassMinRadius: this.spyglassMinRadius,
            spyglassMaxRadius: this.spyglassMaxRadius,
            spyglassRadius: this.spyglassRadius,
            views,
        });

        this.#dialogElement = this.querySelector('dialog');

        this.openDialogButton = this.querySelector(`.${this.CLASS}-btn`);
        this.swapButton = this.querySelector(`.${this.CLASS}-swap`);

        this.radioButtons = Array.from(this.#dialogElement.querySelectorAll(`#${this.getId()}-dialog input[type=radio]`));
        const singleRadio = this.radioButtons.find(r => r.value === this.constructor.view.SINGLE);
        if (singleRadio) singleRadio.checked = true;

        this.addUIEventListeners();

        this.controller = new Controller(this.model, new Observer(this));
        this.updateModel();

        if (Util.isFunction(callback)) {
            callback();
        }
    }

    addUIEventListeners() {
        if (!('commandForElement' in this.openDialogButton)) this.openDialogButton?.addEventListener('click', (_e) => this.showSelectionDialog());

        this.#dialogElement.querySelector('sitna-button.tc-modal-close').addEventListener(Consts.event.CLICK, () => {
            this.closeSelectionDialog();
        });

        const onChange = (e) => {
            this.setView(e.target.value);
            this.#dialogElement.close();
        };
        this.radioButtons.forEach(function (radio) {
            radio.addEventListener('change', onChange);
        });
        const onClick = (e) => {
            if (e.currentTarget.querySelector('input:checked')) {
                this.#dialogElement.close();
            }
        };
        this.#dialogElement.querySelectorAll('label').forEach(function (label) {
            label.addEventListener(Consts.event.CLICK, onClick);
        });


        this.querySelector(`.${this.CLASS}-view-spyglass-slider-rng`).addEventListener('input', (e) => {
            this.setSpyglassRadius(parseInt(e.target.value));
            this.updateClipping();
        });

        this.querySelectorAll(`.${this.CLASS}-view-transp-slider-rng`).forEach((slider, idx) => {
            slider.addEventListener('input', (e) => {
                const opacityValue = 1 - parseFloat(e.target.value);
                if (idx === 0) this.mainMapOpacity = opacityValue;
                else this.#secondaryMapOpacities[idx - 1] = opacityValue;
                this.updateOpacity();
            });
        });

        this.swapButton.addEventListener(Consts.event.CLICK, () => {
            this.swapLayers();
        });
    }

    async register(map) {

        const mapRect = map.div.getBoundingClientRect();
        this.spyglassMaxRadius = this.options.spyglassMaxRadius || (Math.min(mapRect.width, mapRect.height) / 2);
        this.spyglassMinRadius = this.options.spyglassMinRadius || (this.spyglassMaxRadius / 8);
        this.spyglassRadius = (this.spyglassMinRadius + this.spyglassMaxRadius) / 2;

        this.swipeSliderX = 0.5;

        // Parche para cubrir todos los canvas del mapa
        map.wrap.getCanvas = () => this.secondaryMaps
            .map(m => m.wrap.getCanvas())
            .flat()
            .concat(TC.wrap.Map.prototype.getCanvas.call(map.wrap));

        await super.register.call(this, map);

        this.hasMouse = window.matchMedia('(pointer: fine)').matches;

        this.mainBaseLayerSelector = await map.addControl('compactBasemapSelector', {
            div: this.querySelector(`.${this.CLASS}-layer-main`)
        });

        if (this.options.timelines) {
            this.timeSlider = await map.addControl('sitna-time-slider', {
                div: this.querySelector(`.${this.CLASS}-view-time-slider`),
                timelines: this.options.timelines
            });
        }

        const n = this.secondaryMapCount;
        const controlOptions = Object.assign({}, Cfg.controls);
        for (let key in controlOptions) {
            controlOptions[key] = false;
        }
        const setSecondaryMapStyle = (div) => {
            if (this.currentView !== LayerComparer.view.SPLIT) {
                const mainMapRect = map.div.getBoundingClientRect();
                div.style.position = 'absolute';
                div.style.top = mainMapRect.top + 'px';
                div.style.left = mainMapRect.left + 'px';
                div.style.width = mainMapRect.width + 'px';
                div.style.height = mainMapRect.height + 'px';
            }
        };
        const secondaryMapOptions = {
            layout: {
                config: TC.apiLocation + ('layout/minimal/config.json')
            },
            locale: map.options.locale,
            controls: controlOptions,
            baseLayers: map.options.baseLayers,
            availableBaseLayers: map.options.availableBaseLayers,
            crossOrigin: 'anonymous',
        };
        let referenceDiv = map.div;
        for (var i = 0; i < n; i++) {
            const div = document.createElement('div');
            div.classList.add(`${this.CLASS}-map`);
            if (i === n - 1) {
                div.classList.add(`${this.CLASS}-map-last`);
            }
            setSecondaryMapStyle(div);
            referenceDiv.insertAdjacentElement('beforebegin', div);
            referenceDiv = div;
            const mapOptions = { ...secondaryMapOptions, baseLayers: secondaryMapOptions.baseLayers.slice() };
            mapOptions.defaultBaseLayer = this.options.secondaryBaseLayers?.[i] || map.options.defaultBaseLayer;
            const defaultBaseLayerId = (mapOptions.defaultBaseLayer && typeof mapOptions.defaultBaseLayer === 'string') ? mapOptions.defaultBaseLayer : mapOptions.defaultBaseLayer?.id;
            if (!mapOptions.baseLayers.some((layer) => {
                if (typeof layer === 'string') return layer === defaultBaseLayerId;
                return layer.id === defaultBaseLayerId;
            })) {
                mapOptions.baseLayers = mapOptions.baseLayers.concat(mapOptions.defaultBaseLayer);
            }
            const secondaryMap = new map.constructor(div, mapOptions);
            map.ready(function () {
                if (map.mustBeExportable) {
                    secondaryMap.mustBeExportable = true;
                }
            });
            this.secondaryMaps.push(secondaryMap);
            this.#secondaryMapOpacities.push(1);
            const linkMap = () => {
                secondaryMap.loaded(() => secondaryMap.linkTo(this.map));
            };
            map
                .on(Consts.event.BASELAYERCHANGE, linkMap)
                .on(Consts.event.BASELAYERCHANGE, () => {
                    this.updateClipping();
                    this.updateOpacity();
                });
            secondaryMap.on(Consts.event.BASELAYERCHANGE, linkMap);

            const cbsElm = this.querySelector(`.${this.CLASS}-layer-sec-${i}`);
            let idx = i;
            await secondaryMap.loaded();
            this.secondaryBaseLayerSelectors[idx] = await secondaryMap.addControl('compactBasemapSelector', {
                div: cbsElm
            });

            setTimeout(linkMap, 300);
        }

        this.setView();

        const onResize = () => {
            this.#updateSwipeSliderPosition();
            this.setSpyglassRadius();
            this.#updateViewports();
        };

        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                this.secondaryMaps.forEach((m) => setSecondaryMapStyle(m.div));
            });
            resizeObserver.observe(map.div);

            const observer = new ResizeObserver(onResize);
            observer.observe(this.map.div);
        }
        window.addEventListener('resize', onResize);

        map.on(Consts.event.PROJECTIONCHANGE, (e) => {
            for (const sm of this.secondaryMaps) {
                const projectionOptions = {
                    crs: e.newCrs
                };
                const firstOption = sm.baseLayer.firstOption;
                if (firstOption && firstOption.isRaster()) {
                    const crsList = firstOption.getCompatibleCRS();
                    for (const crs of crsList) {
                        if (Util.CRSCodesEqual(crs, e.newCrs)) {
                            projectionOptions.baseLayer = firstOption;
                            break;
                        }
                    }
                }
                sm.setProjection(projectionOptions);
            }
        });

        if (this.options.view) {
            await this.secondaryMaps[this.secondaryMaps.length - 1].loaded();
            this.setView(this.options.view);
        }

        return this;
    }

    /**
     * Establece la vista del comparador de capas.
     * @method setView
     * @memberof SITNA.control.LayerComparer
     * @instance
     * @param {SITNA.control.LayerComparer.view} view - La vista a establecer.
     * @returns {this}
     */

    setView(view) {
        if (!view) {
            const [checkedRadio] = this.radioButtons.filter(r => r.checked);
            if (checkedRadio) {
                view = checkedRadio.value;
            }
        }

        const views = this.constructor.view;
        switch (view) {
            case views.SINGLE:
                this.setSingleView();
                break;
            case views.SPLIT:
                this.setSplitView();
                break;
            case views.TRANSPARENCY:
                this.setTransparencyView();
                break;
            case views.SWIPE:
                this.setSwipeView();
                break;
            case views.SPYGLASS:
                this.setSpyglassView();
                break;
            case views.TIMELINE:
                this.setTimelineView();
                break;
            default:
                this.#removeViewClasses();
                break;
        }

        const [radio] = this.radioButtons.filter(r => r.value === view);
        if (radio) {
            radio.checked = true;
            this.openDialogButton?.classList.add('tc-map-comp-view-' + view);
        }
        return this;
    }

    /**
     * Establece la vista simple (una sola capa sin nada con qué comparar).
     * @method setSingleView
     * @memberof SITNA.control.LayerComparer
     * @instance
     * @returns {this}
     */

    setSingleView() {
        this.#setView(LayerComparer.view.SINGLE, false);
        return this;
    }

    /**
     * Establece la vista partida (Dos mapas sincronizados en paralelo).
     * @method setSplitView
     * @memberof SITNA.control.LayerComparer
     * @instance
     * @returns {this}
     */

    setSplitView() {
        this.#setView(LayerComparer.view.SPLIT, true);
        this.wrap.updateMapSizes();

        const getEventTransferTargetMaps = (e) => {
            const result = [];
            let point;
            if (window.TouchEvent && e instanceof TouchEvent) {
                if (e.touches.length) {
                    point = [e.touches[0].clientX, e.touches[0].clientY];
                }
            }
            else {
                point = [e.clientX, e.clientY];
            }
            if (!point || !this.wrap.isInsideViewport(point, this.map)) {
                for (const map of this.secondaryMaps) {
                    if (!point || this.wrap.isInsideViewport(point, map)) {
                        result.push(map);
                    }
                }
            }
            return result;
        };

        const transferEvent = (e) => {
            const targetMaps = getEventTransferTargetMaps(e);
            if (targetMaps.length) {
                let newEvent;
                if (window.TouchEvent && e instanceof TouchEvent) {
                    newEvent = new TouchEvent(e.type, e);
                }
                else if (e instanceof WheelEvent) {
                    newEvent = new WheelEvent(e.type, e);
                }
                else if (window.MouseWheelEvent && e instanceof MouseWheelEvent) {
                    newEvent = new MouseWheelEvent(e.type, e);
                }
                else if (e instanceof MouseEvent) {
                    newEvent = new MouseEvent(e.type, e);
                }
                else if (e instanceof PointerEvent) {
                    newEvent = new PointerEvent(e.type, e);
                }
                for (const targetMap of targetMaps) {
                    targetMap.wrap.map.getViewport().dispatchEvent(newEvent)
                }
            }
        };

        const getMapPointForEvent = (e, map) => {
            const mapRect = map.div.getBoundingClientRect();
            return [e.clientX - mapRect.left, e.clientY - mapRect.top];
        };

        const showCursors = () => {
            if (!this.#secondaryCursors.length) {
                this.secondaryMaps.forEach(() => {
                    const cursor = document.createElement('div');
                    cursor.classList.add(`tc-map-comp-view-${LayerComparer.view.SPLIT}-cursor`);
                    this.#secondaryCursors.push(cursor);
                    this.map.div.appendChild(cursor);
                });
            }
            this.#secondaryCursors.forEach(cursor => cursor.style.visibility = 'visible');
        }
        const hideCursors = () => this.#secondaryCursors.forEach((cursor) => cursor.style.visibility = 'hidden');
        const distributeCursors = (e, ...maps) => {
            const mapIndex = maps.findIndex((m) => this.wrap.isInsideViewport([e.clientX, e.clientY], m));
            const point = getMapPointForEvent(e, maps[mapIndex]);
            let cursorIndex = 0;
            const otherMaps = maps.toSpliced(mapIndex, 1);
            for (const otherMap of otherMaps) {
                otherMap.getViewHTML().then((vp) => {
                    const currentMapRect = vp.getBoundingClientRect();
                    this.#secondaryCursors[cursorIndex].style.left = point[0] + currentMapRect.left + 'px';
                    this.#secondaryCursors[cursorIndex].style.top = point[1] + currentMapRect.top + 'px';
                    cursorIndex++;
                });
            }
        };

        const eventHandlers = this.#eventHandlers;
        const main = eventHandlers.main = eventHandlers.main ?? {};
        const secondary = eventHandlers.secondary = eventHandlers.secondary ?? {};

        if (this.hasMouse) {
            main.mousemove = main.mousemove ?? {};
            main.mousemove.forSplitView = main.mousemove.forSplitView ?? ((e) => {
                showCursors();
                const point = getMapPointForEvent(e, this.map);
                this.map.wrap.getViewport().then((viewport) => {
                    const vpRect = viewport.getBoundingClientRect();
                    const x = point[0];
                    const y = point[1];
                    if (x >= 0 && x <= vpRect.width && y >= 0 && y <= vpRect.height) {
                        distributeCursors(e, this.map, ...this.secondaryMaps);
                    }
                    else {
                        for (const secondaryMap of this.secondaryMaps) {
                            const point = getMapPointForEvent(e, secondaryMap);
                            const mapRect = secondaryMap.div.getBoundingClientRect();
                            const x = point[0];
                            const y = point[1];
                            if (x >= 0 && x <= mapRect.width && y >= 0 && y <= mapRect.height) {
                                secondaryMap.div.dispatchEvent(new MouseEvent(e.type, e));
                            }
                        }
                    }
                });
            });
            main.pointerdown = main.pointerdown ?? {};
            main.pointerdown.forSplitView = main.pointerdown.forSplitView ?? function (e) {
                hideCursors();
                transferEvent(e);
            };
            main.pointerup = main.pointerup ?? {};
            main.pointerup.forSplitView = main.pointerup.forSplitView ?? function (e) {
                showCursors();
                transferEvent(e);
            };
            main.pointermove = main.pointermove ?? {};
            main.pointermove.forSplitView = main.pointermove.forSplitView ?? transferEvent;
            main.wheel = main.wheel ?? {};
            main.wheel.forSplitView = main.wheel.forSplitView ?? transferEvent;
            main.mousewheel = main.mousewheel ?? {};
            main.mousewheel.forSplitView = main.mousewheel.forSplitView ?? transferEvent;
            main.mouseenter = main.mouseenter ?? {};
            main.mouseenter.forSplitView = main.mouseenter.forSplitView ?? showCursors;
            main.mouseleave = main.mouseleave ?? {};
            main.mouseleave.forSplitView = main.mouseleave.forSplitView ?? hideCursors;
            secondary.mousemove = secondary.mousemove ?? {};
            secondary.mousemove.forSplitView = secondary.mousemove.forSplitView ?? ((e) => {
                showCursors();
                this.#secondaryCursors.forEach((_cursor, idx) => {
                    if (this.secondaryMaps[idx].div === e.currentTarget) {
                        distributeCursors(e, this.map, ...this.secondaryMaps);
                    }
                })
            });
            secondary.pointerdown = secondary.pointerdown ?? {};
            secondary.pointerdown.forSplitView = secondary.pointerdown.forSplitView ?? hideCursors;
            secondary.pointerup = secondary.pointerup ?? {};
            secondary.pointerup.forSplitView = secondary.pointerup.forSplitView ?? function (_e) {
                showCursors();
            };
            secondary.mouseenter = secondary.mouseenter ?? {};
            secondary.mouseenter.forSplitView = secondary.mouseenter.forSplitView ?? showCursors;
            secondary.mouseleave = secondary.mouseleave ?? {};
            secondary.mouseleave.forSplitView = secondary.mouseleave.forSplitView ?? hideCursors;

            secondary.drop = secondary.drop ?? {};
            secondary.drop.forSplitView = secondary.drop.forSplitView ?? ((e) => {
                const newEvent = new DragEvent(e.type, e);
                this.map.wrap.getViewport().then(vp => vp.dispatchEvent(newEvent));
            });

            this.map.div.addEventListener('mousemove', main.mousemove.forSplitView);
            this.map.div.addEventListener('mouseleave', main.mouseleave.forSplitView);
            this.map.wrap.getViewport().then(function (vp) {
                vp.addEventListener('pointerdown', main.pointerdown.forSplitView);
                vp.addEventListener('pointerup', main.pointerup.forSplitView);
                vp.addEventListener('pointermove', main.pointermove.forSplitView);
                vp.addEventListener('wheel', main.wheel.forSplitView);
                vp.addEventListener('mousewheel', main.mousewheel.forSplitView);
            });
            this.secondaryMaps.forEach(m => {
                m.div.addEventListener('mouseenter', secondary.mouseenter.forSplitView);
                m.div.addEventListener('mousemove', secondary.mousemove.forSplitView);
                m.div.addEventListener('mouseleave', secondary.mouseleave.forSplitView);
                m.wrap.getViewport().then(function (vp) {
                    //m.div.addEventListener('mouseout', secondary.mouseout.forSplitView);
                    vp.addEventListener('pointerdown', secondary.pointerdown.forSplitView);
                    vp.addEventListener('pointerup', secondary.pointerup.forSplitView);
                    vp.addEventListener('drop', secondary.drop.forSplitView);
                });
            });
        }
        else {
            main.touchstart = main.touchstart ?? {};
            main.touchstart.forSplitView = main.touchstart.forSplitView ?? transferEvent;
            main.touchmove = main.touchmove ?? {};
            main.touchmove.forSplitView = main.touchmove.forSplitView ?? transferEvent;
            main.touchend = main.touchend ?? {};
            main.touchend.forSplitView = main.touchend.forSplitView ?? transferEvent;
            main.pointerdown = main.pointerdown ?? {};
            main.pointerdown.forSplitView = main.pointerdown.forSplitView ?? transferEvent;
            main.pointermove = main.pointermove ?? {};
            main.pointermove.forSplitView = main.pointermove.forSplitView ?? transferEvent;
            main.pointerup = main.pointerup ?? {};
            main.pointerup.forSplitView = main.pointerup.forSplitView ?? transferEvent;
            this.map.wrap.getViewport().then(function (vp) {
                vp.addEventListener('touchstart', main.touchstart.forSplitView);
                vp.addEventListener('touchmove', main.touchmove.forSplitView);
                vp.addEventListener('touchend', main.touchend.forSplitView);
                vp.addEventListener('pointerdown', main.pointerdown.forSplitView);
                vp.addEventListener('pointerup', main.pointerup.forSplitView);
                vp.addEventListener('pointermove', main.pointermove.forSplitView);
            });
        }

        const layerUpdatekey = Consts.event.LAYERADD + ' ' +
            Consts.event.LAYERUPDATE + ' ' +
            Consts.event.LAYERORDER + ' ' +
            Consts.event.UPDATEPARAMS + ' ' +
            Consts.event.LAYERVISIBILITY + ' ' +
            Consts.event.LAYEROPACITY + ' ' +
            Consts.event.FEATURESADD + ' ' +
            Consts.event.FEATURESCLEAR;
        const layerUpdate = main[layerUpdatekey] = main[layerUpdatekey] || {};
        layerUpdate.forSplitView = layerUpdate.forSplitView ?? ((e) => {
            if (!e.layer.isBase) {
                this.#replicateLayer(e.layer);
            }
        });
        this.map.on(layerUpdatekey, layerUpdate.forSplitView);

        const featureAddForMain = main[Consts.event.FEATUREADD] = main[Consts.event.FEATUREADD] ?? {};
        featureAddForMain.forSplitView = featureAddForMain.forSplitView ?? ((e) => {
            this.#replicateFeature(e.feature);
        });
        this.map.on(Consts.event.FEATUREADD, featureAddForMain.forSplitView);

        const featureAddForSec = secondary[Consts.event.FEATUREADD] = secondary[Consts.event.FEATUREADD] ?? {};
        featureAddForSec.forSplitView = featureAddForSec.forSplitView ?? ((e) => {
            this.#replicateFeature(e.feature);
        });
        for (const secMap of this.secondaryMaps) {
            secMap.on(Consts.event.FEATUREADD, featureAddForSec.forSplitView);
        }

        const featureRemove = main[Consts.event.FEATUREREMOVE] = main[Consts.event.FEATUREREMOVE] ?? {};
        featureRemove.forSplitView = featureRemove.forSplitView ?? ((e) => {
            this.#removeFeatureReplicas(e.feature);
        });
        this.map.on(Consts.event.FEATUREREMOVE, featureRemove.forSplitView);

        const featureRemoveForSec = secondary[Consts.event.FEATUREREMOVE] = secondary[Consts.event.FEATUREREMOVE] ?? {};
        featureRemoveForSec.forSplitView = featureRemoveForSec.forSplitView ?? ((e) => {
            this.#removeFeatureReplicas(e.feature);
        });
        for (const secMap of this.secondaryMaps) {
            secMap.on(Consts.event.FEATUREREMOVE, featureRemoveForSec.forSplitView);
        }

        const featuresClearForMain = main[Consts.event.FEATURESCLEAR] = main[Consts.event.FEATURESCLEAR] ?? {};
        featuresClearForMain.forSplitView = featuresClearForMain.forSplitView ?? ((e) => {
            this.#getLayerReplicas(e.layer).forEach((l) => l.features?.slice().forEach((f) => l.removeFeature(f)));
        });
        this.map.on(Consts.event.FEATURESCLEAR, featuresClearForMain.forSplitView);

        const featuresClearForSec = secondary[Consts.event.FEATURESCLEAR] = secondary[Consts.event.FEATURESCLEAR] || {};
        featuresClearForSec.forSplitView = featuresClearForSec.forSplitView ?? ((e) => {
            const original = this.#getLayerOriginal(e.layer);
            original && original.features.slice().forEach(f => original.removeFeature(f));
        });
        for (const secMap of this.secondaryMaps) {
            secMap.on(Consts.event.FEATURESCLEAR, featuresClearForSec.forSplitView);
        }

        const layerRemove = main[Consts.event.LAYERREMOVE] = main[Consts.event.LAYERREMOVE] ?? {};
        layerRemove.forSplitView = layerRemove.forSplitView ?? ((e) => {
            this.#removeLayerReplicas(e.layer);
        });
        this.map.on(Consts.event.LAYERREMOVE, layerRemove.forSplitView);

        this.map.workLayers.forEach((wl) => {
            this.#replicateLayer(wl).then(() => {
                this.#replicateControl(wl.owner);
            });
        });

        if (this.map.options.controls && this.map.options.controls.featureTools) {
            this.map.ready(() => {
                this.#replicateControl(this.map.getControlsByClass(FeatureTools)[0]);
            });
        }

        //if (this.map.options.controls && this.map.options.controls.fileImport) {
        //    this.map.ready(() => {
        //        this.#replicateControl(this.map.getControlsByClass(FileImport)[0]);
        //    });
        //}

        return this;
    }


    /**
     * Establece la vista de transparencia (una capa sobre otra con un grado de transparencia variable).
     * @method setTransparencyView
     * @memberof SITNA.control.LayerComparer
     * @instance
     * @returns {this}
     */

    setTransparencyView() {
        this.mainMapOpacity = 1 - parseFloat(this.querySelector(`.${this.CLASS}-view-transp-slider-rng`).value);
        this.#setView(LayerComparer.view.TRANSPARENCY, true);
        this.updateOpacity();
        return this;
    }

    /**
     * Establece la vista de cortina (se pasa de una capa a otra desplazando un separador).
     * @method setSwipeView
     * @memberof SITNA.control.LayerComparer
     * @instance
     * @returns {this}
     */

    setSwipeView() {
        this.#setView(LayerComparer.view.SWIPE, true);
        const onDragMove = () => {
            const mapRect = this.map.div.getBoundingClientRect();
            const sliderRect = this.swipeSlider.getBoundingClientRect();
            this.swipeSliderX = (sliderRect.left - mapRect.left + sliderRect.width / 2) / this.map.div.getBoundingClientRect().width;
            this.updateClipping();
        };
        if (!this.swipeSlider) {
            const slider = document.createElement('div');
            slider.classList.add(`tc-map-comp-view-${LayerComparer.view.SWIPE}-slider`);
            if (!this.hasMouse) {
                slider.style.width = this.SWIPE_SLIDER_TOUCH_WIDTH;
            }
            this.map.div.appendChild(slider);
            Util.makeDraggableElement(slider, {
                axis: 'x',
                containment: this.map.div,
                dragMoveCallback: onDragMove,
                dragEndCallback: onDragMove,
            });
            this.swipeSlider = slider;
        }
        this.swipeSlider.style.display = 'block';
        this.#updateSwipeSliderPosition();
        onDragMove();
        return this;
    }

    /**
     * Establece la vista de catalejo (una ventana circular movible muestra una capa a través de la otra).
     * @method setSpyglassView
     * @memberof SITNA.control.LayerComparer
     * @instance
     * @returns {this}
     */

    setSpyglassView() {
        if (this.hasMouse) {
            return this.setMouseSpyglassView();
        }
        return this.setTouchSpyglassView();
    }

    setTouchSpyglassView() {
        this.#setView(LayerComparer.view.SPYGLASS, true);

        const onDragMove = () => {
            const spyglassRect = this.spyglass.getBoundingClientRect();
            const mapRect = this.map.div.getBoundingClientRect();
            this.#spyglassX = (spyglassRect.left + spyglassRect.width / 2) / mapRect.width;
            this.#spyglassY = (spyglassRect.top + spyglassRect.height / 2) / mapRect.height;
            this.updateClipping();
        };
        if (!this.spyglass) {
            const spyglass = document.createElement('div');
            spyglass.classList.add(`tc-map-comp-view-${LayerComparer.view.SPYGLASS}-glass`);
            this.map.div.appendChild(spyglass);
            this.spyglass = spyglass;
            this.#spyglassX = 0.5;
            this.#spyglassY = 0.5;
            this.setSpyglassRadius();
            Util.makeDraggableElement(spyglass, {
                dragMoveCallback: onDragMove,
            });
        }
        this.spyglass.style.display = 'block';
        onDragMove();
        return this;
    }

    setMouseSpyglassView() {
        this.#setView(LayerComparer.view.SPYGLASS, true);

        this.#spyglassX = 0.5;
        this.#spyglassY = 0.5;

        const eventHandlers = this.#eventHandlers;
        const main = eventHandlers.main = eventHandlers.main || {};
        main.mousemove = main.mousemove || {};
        main.mousemove.forSpyglassView = main.mousemove.forSpyglassView || ((e) => {
            if (e) {
                const mapRect = this.map.div.getBoundingClientRect();
                this.#spyglassX = e.clientX / mapRect.width;
                this.#spyglassY = e.clientY / mapRect.height;
            }
            this.updateClipping();
        });
        this.updateClipping();
        this.map.div.addEventListener('mousemove', main.mousemove.forSpyglassView);
        return this;
    }

    /**
     * Establece la vista de línea temporal (un deslizador cambia la capa en base al momento en el tiempo).
     * @method setTimelineView
     * @memberof SITNA.control.LayerComparer
     * @instance
     * @returns {this}
     */

    setTimelineView() {
        this.#setView(LayerComparer.view.TIMELINE, false);
        if (this.timeSlider) {
            if (!this.timeSlider.isAvailable()) {
                const timeline = this.timeSlider.timelines[0];
                if (timeline) {
                    let from = new Date(-8640000000000000);
                    let newLayerId;
                    for (const layerRange of timeline) {
                        if (layerRange.from > from) {
                            from = layerRange.from;
                            newLayerId = layerRange.layer;
                        }
                    }
                    if (newLayerId) {
                        this.map.setBaseLayer(newLayerId);
                    }
                }
            }
            this.timeSlider.enable();
        }
    }

    /**
     * Intercambia las capas de fondo entre el mapa principal y el secundario.
     * @method swapLayers
     * @async
     * @memberof SITNA.control.LayerComparer
     * @instance
     */

    async swapLayers() {
        const currentBaseLayer = this.map.baseLayer;
        const secondaryMap = this.secondaryMaps.at(-1);
        const secondaryBaseLayer = secondaryMap.baseLayer;
        const mainPromise = this.map.setBaseLayer(secondaryBaseLayer.id);
        const secondaryPromise = secondaryMap.setBaseLayer(currentBaseLayer.id);
        await Promise.all([mainPromise, secondaryPromise]);
    }

    /**
     * Establece el radio en píxels de la ventana circular en la vista de catalejo.
     * @method setSpyglassRadius
     * @memberof SITNA.control.LayerComparer
     * @instance
     * @returns {this}
     */

    setSpyglassRadius(radius) {
        radius = radius || this.spyglassRadius;
        this.spyglassRadius = radius;
        if (this.hasMouse) {
            this.#eventHandlers?.main?.mousemove?.forSpyglassView?.();
        }
        else {
            if (this.spyglass) {
                const spyglassStyle = this.spyglass.style;
                spyglassStyle.width = `${2 * this.spyglassRadius}px`;
                spyglassStyle.height = `${2 * this.spyglassRadius}px`;
                const mapRect = this.map.div.getBoundingClientRect();
                spyglassStyle.left = `${(this.#spyglassX * mapRect.width) - this.spyglassRadius}px`;
                spyglassStyle.top = `${(this.#spyglassY * mapRect.height) - this.spyglassRadius}px`;
            }
        }
        return this;
    }

    updateClipping() {
        if (this.map.baseLayer) {
            const mapRect = this.map.div.getBoundingClientRect();
            const width = mapRect.width;
            const height = mapRect.height;
            switch (this.currentView) {
                case LayerComparer.view.SWIPE: {
                    const sliderLeft = this.swipeSliderX * width;
                    this.map.baseLayer.clip([[0, 0], [sliderLeft, 0], [sliderLeft, height], [0, height], [0, 0]]);
                    break;
                }
                case LayerComparer.view.SPYGLASS: {
                    const clipPath = new Path2D();
                    clipPath.rect(0, 0, width, height);
                    const circle = new Path2D();
                    const sgx = this.#spyglassX * width;
                    const sgy = this.#spyglassY * height;
                    circle.arc(sgx, sgy, this.spyglassRadius, 0, Math.PI * 2);
                    clipPath.addPath(circle);
                    this.map.baseLayer.clip(clipPath);
                    const strokePath = new Path2D();
                    strokePath.arc(sgx, sgy, this.spyglassRadius + 1, 0, Math.PI * 2);
                    this.map.baseLayer.stroke(strokePath, { strokeWidth: 2, strokeColor: '#000000' });
                    break;
                }
                default:
                    this.map.baseLayer.clip();
                    this.map.baseLayer.stroke();
            }
        }
        return this;
    }

    updateOpacity() {
        if (this.map.baseLayer) {
            if (this.currentView === LayerComparer.view.TRANSPARENCY) {
                this.map.baseLayer.setOpacity(this.mainMapOpacity);
            }
            else {
                this.map.baseLayer.setOpacity(1);
            }
        }
        for (let i = 0; i < this.secondaryMaps.length - 1; i++) {
            const secondaryMap = this.secondaryMaps[i];
            if (this.currentView === LayerComparer.view.TRANSPARENCY) {
                secondaryMap.baseLayer?.setOpacity(this.#secondaryMapOpacities[i]);
            }
            else {
                secondaryMap.baseLayer?.setOpacity(1);
            }
        }
        return this;
    }

    #updateViewports() {
        this.updateClipping();
        this.updateOpacity();
        this.wrap.updateMapSizes();
        return this;
    }

    showSelectionDialog() {
        this.#dialogElement.showModal();
    }

    closeSelectionDialog() {
        this.#dialogElement.close();
    }

    exportState() {
        if (this.exportsState) {
            const result = {
                id: this.getId(),
                v: this.currentView,
                sm: this.secondaryMaps.map((m) => ({ bl: m.baseLayer.id })),
            };
            if (this.currentView === LayerComparer.view.TRANSPARENCY) {
                result.a = this.mainMapOpacity;
                result.sa = this.#secondaryMapOpacities;
            }
            return result;
        }
        return null;
    }

    importState(state) {
        this.map.loaded(() => {
            if (state.v === LayerComparer.view.TRANSPARENCY) {
                this.div.querySelector(`.${this.CLASS}-view-transp-slider-rng`).value = 1 - state.a;
                this.#secondaryMapOpacities = state.sa;
            }
            this.setView(state.v);
            this.secondaryMaps.forEach((m, idx) => m.loaded(m.setBaseLayer(state.sm[idx].bl)));
        });
    }

    #removeViewClasses() {
        for (const view of Object.values(LayerComparer.view)) {
            const className = 'tc-map-comp-view-' + view;
            this.map.div.classList.remove(className);
            for (const m of this.secondaryMaps) {
                m.div.classList.remove(className);
            }
            this.openDialogButton?.classList.remove(className);
        }
    }

    #hideAuxElements() {
        if (this.swipeSlider) {
            this.swipeSlider.style.display = 'none';
        }
        if (this.spyglass) {
            this.spyglass.style.display = 'none';
        }
    }

    #removeEventListeners() {
        const { main, secondary, viewport } = this.#eventHandlers;
        const isOwn = (eventType) => eventType.endsWith('.tc') || eventType.startsWith('sitna:');
        if (main) {
            for (const eventType in main) {
                const handlers = main[eventType];
                for (const name in handlers) {
                    if (isOwn(eventType)) {
                        this.map.off(eventType, handlers[name]);
                    }
                    else {
                        this.map.div.removeEventListener(eventType, handlers[name]);
                    }
                }
            }
        }
        if (secondary) {
            for (const eventType in secondary) {
                const handlers = main[eventType];
                for (const name in handlers) {
                    if (isOwn(eventType)) {
                        for (const sm of this.secondaryMaps) sm.off(eventType, handlers[name]);
                    }
                    else {
                        for (const sm of this.secondaryMaps) sm.div.removeEventListener(eventType, handlers[name]);
                    }
                }
            }
        }
        if (viewport) {
            this.map.wrap.getViewport().then((vp) => {
                for (const eventType in viewport) {
                    const handlers = main[eventType];
                    for (const name in handlers) {
                        vp.removeEventListener(eventType, handlers[name]);
                    }
                }
            });
        }
    }

    #clearAllLayerReplicas() {
        if (this.#layerReplicas) {
            this.#layerReplicas.forEach(function clearLayers(layers) {
                for (const layer of layers) layer.clearFeatures();
            });
        }
    }

    #setSecondaryLayerVisibility(visible) {
        for (const map of this.secondaryMaps) {
            map.baseLayer?.setVisibility(visible);
        }
    }

    #setView(type, secondaryLayerVisibility) {
        const viewClass = 'tc-map-comp-view-' + type;
        this.#removeViewClasses();
        this.#hideAuxElements();
        this.#removeEventListeners();
        this.#clearAllLayerReplicas();
        if (this.map.baseLayer) {
            this.map.baseLayer.clip();
            this.map.baseLayer.stroke();
        }
        this.map.div.classList.add(viewClass);
        this.secondaryMaps.forEach(m => m.div.classList.add(viewClass));
        this.currentView = type;
        const title = this.getLocaleString(type + '.title');
        if (this.openDialogButton) {
            this.openDialogButton.setAttribute('title', title);
            this.openDialogButton.textContent = title;
        }
        const selector = 'button';
        let mainBaseLayerSelectorTitle, secondaryBaseLayerSelectorTitle;
        if (type === LayerComparer.view.SINGLE || type === LayerComparer.view.TIMELINE) {
            mainBaseLayerSelectorTitle = this.getLocaleString('changeBackgroundLayer');
            secondaryBaseLayerSelectorTitle = this.getLocaleString('changeBackgroundLayer');
            for (const selector of this.secondaryBaseLayerSelectors) {
                selector.renderPromise().then(() => selector.div.querySelector('button').disabled = true);
            }
            this.swapButton.classList.add(Consts.classes.HIDDEN);
        }
        else {
            mainBaseLayerSelectorTitle = this.getLocaleString('changeMainBackgroundLayer');
            secondaryBaseLayerSelectorTitle = this.getLocaleString('changeSecondaryBackgroundLayer');
            for (const selector of this.secondaryBaseLayerSelectors) {
                selector.renderPromise().then(() => selector.div.querySelector('button').disabled = false);
            }
            this.swapButton.classList.toggle(Consts.classes.HIDDEN, this.secondaryMaps.length >= 2);
        }
        if (this.mainBaseLayerSelector) {
            this.mainBaseLayerSelector.div.querySelector(selector).setAttribute('title', mainBaseLayerSelectorTitle);
        }
        for (const ctl of this.secondaryBaseLayerSelectors) {
            if (ctl) {
                ctl.renderPromise().then(() => ctl.div.querySelector(selector).setAttribute('title', secondaryBaseLayerSelectorTitle));
            }
        }
        this.#setSecondaryLayerVisibility(secondaryLayerVisibility);
        this.wrap.updateMapSizes();
        this.updateOpacity();

        if (this.timeSlider) {
            this.timeSlider.disable();
        }
    }

    async #replicateLayer(layerOrId) {
        const layer = this.map.getLayer(layerOrId);
        const lIndex = this.map.layers.indexOf(layer);
        if (lIndex >= 0) {
            const visibility = layer.getVisibility();
            const opacity = layer.getOpacity();

            let layerReplicas = this.#getLayerReplicas(layer);
            if (!layerReplicas.length) {
                layerReplicas = new Array(this.secondaryMaps.length);
                this.#layerReplicas.set(layer.id, layerReplicas);
            }
            const layersToAdd = new Array(this.secondaryMaps.length);
            this.secondaryMaps.forEach(function createClones(m, idx) {
                if (layerReplicas[idx]) {
                    layersToAdd[idx] = false;
                }
                else {
                    layerReplicas[idx] = layer.clone();
                    layersToAdd[idx] = true;
                }
            });

            await Promise.all(this.secondaryMaps.map((map) => map.loaded()));
            const lrPromises = new Array(layerReplicas.length);
            this.secondaryMaps.forEach((map, idx) => {
                if (layersToAdd[idx]) {
                    lrPromises[idx] = map.addLayer(layerReplicas[idx]).then(l => {
                        this.#layerOriginals.set(l, layer);
                        return l;
                    });
                }
                else {
                    lrPromises[idx] = layerReplicas[idx];
                }
            });
            await Promise.all(lrPromises);
            layerReplicas.forEach(lr => {
                lr.setVisibility(visibility);
                lr.setOpacity(opacity);
            });
            this.secondaryMaps.forEach((secMap) => {
                const sortedLayers = secMap.workLayers.sort((a, b) => {
                    const oa = this.#layerOriginals.get(a);
                    const ob = this.#layerOriginals.get(b);
                    if (!oa || !ob) {
                        return 0;
                    }
                    return this.map.workLayers.indexOf(oa) - this.map.workLayers.indexOf(ob);
                });
                for (var i = 0, ii = secMap.workLayers.length; i < ii; i++) {
                    const wl = secMap.workLayers[i];
                    const slIdx = sortedLayers.indexOf(wl);
                    if (slIdx > i) {
                        secMap.setLayerIndex(wl, slIdx + secMap.baseLayers.length);
                        i--;
                    }
                }
            });
            return layerReplicas;
        }
        return [];
    }

    async #replicateFeature(feature) {
        this.#featureReplicas ??= new WeakMap();
        if (!this.#featureReplicas.has(feature)) {
            const parentLayer = feature.layer;
            let original;
            if (parentLayer.map === this.map) {
                original = parentLayer;
            }
            else {
                original = this.#getLayerOriginal(parentLayer) || [];
            }
            const layerReplicas = await this.#replicateLayer(original);
            const otherLayers = layerReplicas
                .concat(original)
                .filter((l) => parentLayer !== l);
            const clones = otherLayers.map(function cloneFeature() {
                const clone = feature.clone();
                clone.setId(feature.id + '_clone');
                return clone;
            });
            this.#featureReplicas.set(feature, clones);
            clones.forEach((clone, i, arr) => {
                const replicas = arr.concat(feature);
                replicas.splice(i, 1);
                this.#featureReplicas.set(clone, replicas);
            });
            for (let i = 0; i < otherLayers.length; i++) {
                await otherLayers[i].addFeature(clones[i]);
            }
            setTimeout(function () {
                clones.forEach(f => f.showsPopup = feature.showsPopup);
            }, 100);
        }
    }

    #removeFeatureReplicas(feature) {
        this.#featureReplicas ??= new WeakMap();
        const replicas = this.#featureReplicas.get(feature);
        if (replicas) {
            replicas.forEach(f => this.#featureReplicas.delete(f));
            this.#featureReplicas.delete(feature);
            replicas.forEach(f => f.remove());
        }
    }

    #removeLayerReplicas(layerOrId) {
        if (this.#layerReplicas) {
            const layer = this.map.getLayer(layerOrId);
            this.#getLayerReplicas(layer).forEach((l) => l.map.removeLayer(l));
            this.#layerReplicas.delete(layer.id);
        }
    }

    #getLayerReplicas(layer) {
        this.#layerReplicas ??= new Map();
        this.#layerOriginals ??= new WeakMap();
        return this.#layerReplicas.get(layer.id) ?? [];
    }

    #getLayerOriginal(layer) {
        return this.#layerOriginals.get(layer);
    }

    #updateControlStatus() {
        const activeControl = this.map.activeControl;
        let originalControl;
        if (activeControl instanceof Draw && activeControl.containerControl) {
            originalControl = activeControl.containerControl;
        }
        else {
            originalControl = activeControl;
        }
        const replicas = this.#controlReplicas.get(originalControl);
        this.secondaryMaps.forEach(function replicateControlStatus(map, idx) {
            if (replicas) {
                const ctlReplica = replicas[idx];
                if (ctlReplica instanceof Measure) {
                    ctlReplica.activateMode(originalControl.mode);
                }
                else {
                    ctlReplica.activate();
                }
            }
            else {
                map.activeControl && map.activeControl.deactivate();
            }
        });
    }

    #replicateControl(ctl) {
        if (!ctl) return this;

        this.#controlReplicas ??= new WeakMap();
        if (!this.#controlReplicas.has(ctl)) {
            const div = document.createElement('div');
            const layerReplicas = ctl.layer ? this.#getLayerReplicas(ctl.layer) : [];
            const filterLayerReplicas = ctl.filterLayer ? this.#getLayerReplicas(ctl.filterLayer) : [];
            const resultsLayerReplicas = ctl.resultsLayer ? this.#getLayerReplicas(ctl.resultsLayer) : [];
            this.map
                .on(Consts.event.CONTROLACTIVATE, (_e) => {
                    setTimeout(() => {
                        this.#updateControlStatus();
                    }, 50);
                })
                .on(Consts.event.CONTROLDEACTIVATE, (_e) => {
                    setTimeout(() => {
                        this.#updateControlStatus();
                    }, 50);
                });
            let ctlReplicas;
            this.secondaryMaps.forEach((secMap, idx) => {
                let ctlReplica;
                switch (true) {
                    case ctl instanceof Measure:
                        ctlReplica = new ctl.constructor(Util.extend({}, ctl.options, { div: div }));
                        secMap.addControl(ctlReplica).then(function (cr) {
                            cr.drawControls.forEach(dc => dc.on(Consts.event.MEASURE + ' ' + Consts.event.MEASUREPARTIAL, function (e) {
                                ctl.showMeasurements(e);
                            }));
                            if (layerReplicas.length) {
                                secMap.removeLayer(cr.layer);
                                cr.layer = layerReplicas[idx];
                                layerReplicas[idx].owner = cr;
                                cr.drawControls.forEach(dc => dc.setLayer(cr.layer));
                                if (ctl.mode) {
                                    if (ctl.isActive) cr.activateMode(ctl.mode);
                                    else cr.mode = ctl.mode;
                                }
                            }
                        });
                        break;
                    case ctl instanceof FeatureInfoCommons:
                        ctlReplica = new ctl.constructor(Util.extend({}, ctl.options, {
                            div: div,
                            resultsLayer: resultsLayerReplicas[idx],
                            filterLayer: filterLayerReplicas[idx]
                        }));
                        secMap.addControl(ctlReplica).then(function (cr) {
                            resultsLayerReplicas[idx].owner = ctlReplica;
                            filterLayerReplicas[idx].owner = ctlReplica;
                            if (ctl.isActive) {
                                cr.activate();
                            }
                        });
                        break;
                    case ctl instanceof Draw:
                        break;
                    case ctl instanceof FeatureTools:
                        ctlReplica = new ctl.constructor(Util.extend({}, ctl.options));
                        secMap.addControl(ctlReplica);
                        break;
                    default:
                        break;
                }
                if (ctlReplica) {
                    ctlReplicas = ctlReplicas || new Array(this.secondaryMaps.length);
                    ctlReplicas[idx] = ctlReplica;
                }
            });
            if (ctlReplicas) {
                this.#controlReplicas.set(ctl, ctlReplicas);
            }
        }
        return this;
    }

    #updateSwipeSliderPosition() {
        if (this.swipeSlider) {
            const mapRect = this.map.div.getBoundingClientRect();
            this.swipeSlider.style.left = `${Math.round(this.swipeSliderX * mapRect.width - this.swipeSlider.getBoundingClientRect().width / 2)}px`;
        }
    }

    updateModel() {
        for (const key of Object.keys(this.model)) {
            if (!key.startsWith("#")) {
                this.model[key] = this.getLocaleString(key);
            }
        }
    }
}

LayerComparer.prototype.CLASS = 'tc-ctl-lcomp';
export default LayerComparer;

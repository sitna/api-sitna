import WebComponentControl from './WebComponentControl';
import LayerComparerWrapper from '../ol/LayerComparer';
import Controller from '../Controller';
import Map from '../Map';

/**
 * Opciones de control de comparación de capas.
 * @interface LayerComparerOptions
 * @extends ControlOptions
 */
export interface LayerComparerOptions {
    /**
     * Contenedor del control.
     */
    div?: HTMLElement | string;
    /**
     * Vista inicial del comparador de capas.
     */
    view?: string;
    /**
     * Vistas disponibles para el comparador de capas. Si no se especifica, se habilitan todas las vistas.
     */
    availableViews?: string[];
    /**
     * Número de mapas secundarios para comparar. Solo es relevante para las vistas que permiten comparar más de una capa (vista partida y de transparencia). Si no se especifica, se crea un solo mapa secundario.
     */
    secondaryMapCount?: number;
    /**
     * Identificadores de capa para usar como mapa de fondo por defecto u objeto de opciones de capa. Si no se especifica, se usará la capa de fondo por defecto del mapa principal.
     */
    secondaryBaseLayers?: Array<string | any>;
    /**
     * Líneas de tiempo disponibles para el comparador de capas. Cada línea de tiempo es un array de elementos TimelineElementOptions. Si se especifica, se habilitará la vista de línea de tiempo.
     */
    timelines?: any[][];
    /**
     * Radio máximo en píxeles para la vista de catalejo.
     */
    spyglassMaxRadius?: number;
    /**
     * Radio mínimo en píxeles para la vista de catalejo.
     */
    spyglassMinRadius?: number;
}

declare class LayerComparerModel {
    compareLayers: string;
    spyglassDiameter: string;
    transparencyDegree: string;
    secondaryLayersTransparencyDegree: string;
    swapLayers: string;
}

/**
 * Este control permite comparar visualmente 
 * varias capas de fondo de un mapa mediante diferentes métodos, como la transparencia, el deslizamiento o la lupa.
 * @class LayerComparer
 * @memberof SITNA.control
 * @extends SITNA.control.Control
 * @summary `<sitna-layer-comparer>`<p>Clase que implementa el control de comparación de capas de fondo.</p>
 */
export default class LayerComparer extends WebComponentControl {
    /**
     * Vistas disponibles para el comparador de capas.
     * @readonly
     * @static
     */
    static view: {
        /** Vista simple, sin comparación */
        SINGLE: string;
        /** Vista de transparencia */
        TRANSPARENCY: string;
        /** Vista de división */
        SPLIT: string;
        /** Vista de cortina */
        SWIPE: string;
        /** Vista de catalejo */
        SPYGLASS: string;
        /** Vista de línea de tiempo */
        TIMELINE: string;
    };

    secondaryMaps: Map[];
    model: LayerComparerModel;
    secondaryMapCount: number;
    controller: Controller;
    currentView?: string;
    mainMapOpacity?: number;
    spyglassMaxRadius: number;
    spyglassMinRadius: number;
    spyglassRadius: number;
    swipeSliderX: number;
    swipeSlider?: HTMLElement;
    spyglass?: HTMLElement;
    timeSlider?: any;
    openDialogButton: HTMLElement;
    swapButton: HTMLElement;
    radioButtons: HTMLInputElement[];
    hasMouse?: boolean;

    /**
     * @param container - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
     * @param options - Opciones de configuración del control.
     */
    constructor(container?: HTMLElement | string, options?: LayerComparerOptions);

    loadTemplates(): Promise<void>;
    render(callback?: () => void): Promise<void>;
    addUIEventListeners(): void;
    register(map: Map): Promise<this>;

    /**
     * Establece la vista del comparador de capas.
     * @param view - La vista a establecer.
     * @returns {this}
     */
    setView(view?: string): this;

    /**
     * Establece la vista simple (una sola capa sin nada con qué comparar).
     * @returns {this}
     */
    setSingleView(): this;

    /**
     * Establece la vista partida (Dos mapas sincronizados en paralelo).
     * @returns {this}
     */
    setSplitView(): this;

    /**
     * Establece la vista de transparencia (una capa sobre otra con un grado de transparencia variable).
     * @returns {this}
     */
    setTransparencyView(): this;

    /**
     * Establece la vista de cortina (se pasa de una capa a otra desplazando un separador).
     * @returns {this}
     */
    setSwipeView(): this;

    /**
     * Establece la vista de catalejo (una ventana circular movible muestra una capa a través de la otra).
     * @returns {this}
     */
    setSpyglassView(): this;

    setTouchSpyglassView(): this;
    setMouseSpyglassView(): this;

    /**
     * Establece la vista de línea temporal (un deslizador cambia la capa en base al momento en el tiempo).
     * @returns {this}
     */
    setTimelineView(): this;

    /**
     * Intercambia las capas base entre el mapa principal y el secundario.
     */
    swapLayers(): Promise<void>;

    /**
     * Establece el radio en píxels de la ventana circular en la vista de catalejo.
     * @param radius - Radio en píxeles. Si no se especifica, se usa el radio actual.
     * @returns {this}
     */
    setSpyglassRadius(radius?: number): this;

    updateClipping(): this;
    updateOpacity(): this;
    showSelectionDialog(): void;
    exportState(): any;
    importState(state: any): this;
    updateModel(): this;
}

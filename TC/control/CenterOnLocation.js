/**
  * Opciones de control de centrado en posición actual.
  * @interface CenterOnLocationOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {string} [buttonVariant=SITNA.ui.Button.variant.OVERLAY] - Variante visual con la que se representará el botón de activación.
  * @property {object} [styles] - Estilos para la representación de la posición actual.
  * @property {PointStyleOptions} [styles.locationPoint] - Estilos para la representación del punto de posición actual.
  * @property {PolygonStyleOptions} [styles.accuracyCircle] - Estilos para la representación del círculo de precisión de la posición actual.
  * @example <caption>[Ver en vivo](../examples/control.CenterOnLocation.html)</caption> {@lang html}
  * <div id="my-map"></div>
  * <script>
  *     // Creamos un mapa con un control CenterOnLocation.
  *     // El control tendrá estilos personalizados para los indicadores de posición y precisión.
  *     const myMap = new SITNA.Map("my-map", {
  *         controls: {
  *         centerOnLocation: {
  *             styles: {
  *                 locationPoint: {
  *                     strokeColor: '#00ff7b',
  *                     strokeWidth: 3,
  *                     strokeOpacity: 0.5,
  *                     radius: 8,
  *                     fillColor: '#00ff7b',
  *                     fillOpacity: 0.4,
  *                 },
  *                 accuracyCircle: {
  *                     strokeColor: '#00ff7b',
  *                     strokeWidth: 1,
  *                     strokeOpacity: 0.5,
  *                     fillColor: '#00ff7b',
  *                     fillOpacity: 0.2,
  *                 }
  *             }
  *         }
  *     });
  * </script>
  */


import WebComponentControl from './WebComponentControl.js';
import Controller from '../Controller.js';
import Observer from '../Observer.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import Button from '../../SITNA/ui/Button.js';

class CenterOnLocationModel {
    constructor() {
        this.zoomToCurrentLocation = "";
        this.stopDisplayingLocation = "";
    }
}

class CenterOnLocation extends WebComponentControl {

    static {
        customElements.define('sitna-center-on-location', this);
    }

    currentPosition = null;
    snapDistanceRatio = 0.1;
    layer = null;
    #watchId;
    state = CenterOnLocation.state.OFF;

    static state = {
        WATCHING: 'watching',
        OFF: 'off',
        LOCKED: 'locked',
    };

    constructor() {
        super(...arguments);
        if (this.options.snapDistance) this.snapDistance = this.options.snapDistance;
        this.styles = {
            locationPoint: this.options.styles?.locationPoint || {
                strokeColor: '#007bff',
                strokeWidth: 2,
                strokeOpacity: 0.8,
                radius: 6,
                fillColor: '#007bff',
                fillOpacity: 0.4,
            },
            accuracyCircle: this.options.styles?.accuracyCircle || {
                strokeColor: '#007bff',
                strokeWidth: 0,
                strokeOpacity: 0.2,
                fillColor: '#007bff',
                fillOpacity: 0.2,
            },
        }
        this.model = new CenterOnLocationModel();
    }

    async loadTemplates() {
        const template = {};
        template[this.CLASS] = (await import(
            /* webpackChunkName: "tc-ctl-col" */
            /* webpackMode: "lazy" */
            '../templates/tc-ctl-col.mjs'
        )).default;
        this.template = template;
    }

    async render(callback) {
        const buttonVariant = this.options.buttonVariant || Button.variant.OVERLAY;
        await super.renderData.call(this, { buttonVariant });

        this.onButton = this.querySelector('.tc-ctl-col-btn-on');
        this.offButton = this.querySelector('.tc-ctl-col-btn-off');
        this.controller = new Controller(this.model, new Observer(this));
        this.#setUIState();

        this.addUIEventListeners();
        if (Util.isFunction(callback)) {
            callback();
        }
    }

    async register(map) {
        if (!this.div) this.div = await map.getControlContainer();
        await super.register.call(this, map);

        this.layer = await map.addLayer({
            id: this.getUID(),
            type: Consts.layerType.VECTOR,
            owner: this,
            stealth: true,
            title: 'Posicionar.GPS'
        })

        map.on(Consts.event.ZOOM, () => {
            this.#setUIState();
        });

        return this;
    }

    addUIEventListeners() {
        this.onButton?.addEventListener(Consts.event.CLICK, (_e) => this.onOnButtonClick());
        this.offButton?.addEventListener(Consts.event.CLICK, (_e) => this.onOffButtonClick());
    }

    #setUIState() {

        if (this.#watchId) {
            this.onButton.active = true;
            const mapRect = this.map.div.getBoundingClientRect();
            const mapCenter = [mapRect.width / 2, mapRect.height / 2];
            const mapDimensions = [mapRect.width, mapRect.height];
            const mapPosition = this.getPositionMapCoordinates();
            if (mapPosition && this.map.getPixelFromCoordinate(mapPosition)
                .every((coord, i) => Math.abs(coord - mapCenter[i]) <= mapDimensions[i] * this.snapDistanceRatio)) {
                this.onButton.classList.add(Consts.classes.HIDDEN);
                this.offButton.classList.remove(Consts.classes.HIDDEN);
                this.state = CenterOnLocation.state.LOCKED;
            }
            else {
                this.offButton.classList.add(Consts.classes.HIDDEN);
                this.onButton.classList.remove(Consts.classes.HIDDEN);
                this.state = CenterOnLocation.state.WATCHING;
            }
        }
        else {
            this.onButton.active = false;
            this.onButton.classList.remove(Consts.classes.HIDDEN);
            this.offButton.classList.add(Consts.classes.HIDDEN);
            this.state = CenterOnLocation.state.OFF;
        }
        this.updateModel();
    }

    watchPosition() {
        if (this.state === CenterOnLocation.state.OFF) {
            return this.map.wait(new Promise((resolve, reject) => {
                this.unwatchPosition();
                this.#watchId = navigator.geolocation.watchPosition((data) => {
                    const firstTime = this.currentPosition == null;
                    this.currentPosition = data;
                    this.updatePosition(firstTime);
                    resolve(data);
                }, (error) => {
                    let messageKey;
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            messageKey = 'geolocationPermissionDenied';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            messageKey = 'geolocationUnavailable';
                            break;
                        case error.TIMEOUT:
                            messageKey = 'geolocationTimeout';
                            break;
                        default:
                            break;
                    }
                    this.currentPosition = null;
                    this.unwatchPosition();
                    TC.error(messageKey ? this.getLocaleString(messageKey) : error.message);
                    reject(error);
                }, {
                    timeout: this.options.timeout ?? 5000,
                    maximumAge: this.options.maximumAge ?? 100,
                    enableHighAccuracy: this.options.enableHighAccuracy ?? true,
                });
            }));
        }
        return Promise.resolve(null);
    }

    unwatchPosition() {
        navigator.geolocation.clearWatch(this.#watchId);
        this.#watchId = null;
        this.currentPosition = null;
        this.updatePosition();
    }

    async updatePosition(zoomToPosition) {
        this.layer.clearFeatures();
        this.#setUIState();
        if (this.currentPosition === null) return;

        await this.displayPosition();
        if (zoomToPosition) {
            const extentMargin = this.options.extentMargin;
            this.map.zoomToFeatures(this.layer.features, { extentMargin });
            return await Util.getTimedPromise(() => this.#setUIState(), Consts.ZOOM_ANIMATION_DURATION);
        }
    }

    async displayPosition() {
        if (this.currentPosition === null) return false;

        this.layer.clearFeatures();
        let mapPosition;
        const [mapX, mapY] = mapPosition = this.getPositionMapCoordinates();
        await this.layer.addPoint(mapPosition, { showsPopup: false, ...this.styles.locationPoint });
        const accuracyInMapUnits = this.currentPosition.coords.accuracy / this.map.getMetersPerUnit();
        await this.layer.addCircle([mapPosition, [mapX + accuracyInMapUnits, mapY]],
            { showsPopup: false, ...this.styles.accuracyCircle });
        return true;
    }

    clearPosition() {
        this.layer.clearFeatures();
        this.currentPosition = null;
    }

    getPositionMapCoordinates() {
        if (this.currentPosition == null) return null;
        return Util.reproject([this.currentPosition.coords.longitude, this.currentPosition.coords.latitude], 'EPSG:4326', this.map.crs);
    }

    onOnButtonClick() {
        switch (this.state) {
            case CenterOnLocation.state.OFF:
                this.watchPosition();
                break;
            case CenterOnLocation.state.WATCHING:
                this.updatePosition(true);
                break;
            default:
                break;
        }
    }

    onOffButtonClick() {
        this.unwatchPosition();
    }

    updateModel() {
        this.model.zoomToCurrentLocation = this.getLocaleString('zoomToCurrentLocation');
        this.model.stopDisplayingLocation = this.getLocaleString('stopDisplayingLocation');
    }
}

CenterOnLocation.prototype.CLASS = 'tc-ctl-col';
export default CenterOnLocation;
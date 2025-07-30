import Util from '../Util.js';
import Consts from '../Consts.js';
import Control from '../Control.js';
import MapContents from './MapContents.js';
import Raster from '../../SITNA/layer/Raster.js';
import WorkLayerManager from './WorkLayerManager';
import Button from '../../SITNA/ui/Button';
import WebComponentControl from './WebComponentControl.js';


import Observer from '../Observer.js';
import Controller from '../Controller.js';

const elementName = 'sitna-time-control';
const timeSeparatorChar = 'T';
const splitDateTimeString = value => value.split(timeSeparatorChar);
const getDateStringFromDateTimeString = value => splitDateTimeString(value)[0];
const getIsoStringFromDate = dateValue => dateValue.toLocaleString("sv-SE").replace(' ', timeSeparatorChar);
const getIsoStringFromMilliseconds = millisecondsValue => getIsoStringFromDate(new Date(millisecondsValue));
const millisecondsInDay = 86400000; //-- 24 * 60 * 60 * 1000;


function convertirMilisegundos(ms) {
    const unidades = [
        { nombre: 'año', valor: 1000 * 60 * 60 * 24 * 365 },
        { nombre: 'mes', valor: 1000 * 60 * 60 * 24 * 30 },
        { nombre: 'semana', valor: 1000 * 60 * 60 * 24 * 7 },
        { nombre: 'día', valor: 1000 * 60 * 60 * 24 },
        { nombre: 'hora', valor: 1000 * 60 * 60 },
        { nombre: 'minuto', valor: 1000 * 60 },
        { nombre: 'segundo', valor: 1000 },
        { nombre: 'milisegundo', valor: 1000 }
    ];

    for (let i = 0; i < unidades.length; i++) {
        const unidad = unidades[i];
        if (ms >= unidad.valor) {
            const cantidad = Math.floor(ms / unidad.valor);
            return `${cantidad} ${unidad.nombre}${cantidad > 1 ? 's' : ''}`;
        }
    }
    return 'menos de un segundo';
}


const  findClosestNumber = (arr, target) => {
    if (arr.length === 0) return null;

    let left = 0;
    let right = arr.length - 1;

    while (left < right) {
        let mid = Math.floor((left + right) / 2);

        if (arr[mid] === target) {
            return arr[mid];
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    // Comparar los dos candidatos más cercanos
    if (left === 0) {
        return arr[0];
    } else if (left === arr.length) {
        return arr[arr.length - 1];
    } else {
        let candidate1 = arr[left];
        let candidate2 = arr[left - 1];
        return Math.abs(candidate1 - target) < Math.abs(candidate2 - target) ? candidate1 : candidate2;
    }
}

class TimeLine extends Control {       
    #Layers;
    #template;
    constructor() {
        super(...arguments);
        this.#Layers = new WeakMap();
    }
    register(map) {
        const self = this;

        //TODO cambiar a una clase css desde constante
        map.div.classList.add(Consts.classes.TIME_DIMENSION);

        const wlm = map.getControlsByClass(WorkLayerManager);
        if (wlm && wlm.length) {            
            wlm[0].addAddon({
                renderFn: function (container, layerId) {
                    const layer = self.map.getLayer(layerId);
                    if (!layer.isBase && layer instanceof Raster) {
                        return layer.time ? self.getTemplate(layer) : null;                        
                    }
                    return null;
                }
            });
        }
        map.on(Consts.event.LAYERVISIBILITY, function (event) {
            const timeControl = self.#Layers.get(event.layer)
            if (timeControl) {
                timeControl.style.display = event.layer.getVisibility() ? '' : 'none';
            }            
        });
        map.on(Consts.event.LAYERREMOVE, function (event) {
            const timeControl = self.#Layers.get(event.layer)
            if (timeControl) {
                timeControl.stopAnimation();
            }
        });
        TC.Consts.event.LAYERREMOVE
        return Control.prototype.register.call(self, map);
    }

    getTemplate(layer) {
        const timeControl = new TimeControl({ layer: layer, config: layer.time });
        this.#Layers.set(layer, timeControl);
        timeControl.style.display = layer.getVisibility() ? '' : 'none';
        timeControl.containerControl = this;
        return timeControl;
    }

    getLayerUIElements() {
        const self = this;
        return self.div;
    }

    
}

class TimeControlModel{
    constructor() {
        this["time.first"] = "";
        this["time.backward"] = "";
        this["time.forward"] = "";
        this["time.last"] = "";
        this["time.dateTime"] = "";
        this["time.date"] = "";
        this["time.dateTime2"] = "";
        this["time.date2"] = "";
        this["time.start"] = "";
        this["time.pause"] = "";
        this["time.animationSpeed"] = "";
        this["time.range"] = "";
        this["time.speedUp"] = "";
        this["time.speedDown"] = "";
        this["time.from"] = "";
        this["time.to"] = "";
        this.dateMin = "";
        this.dateMax = "";
        this.dateMin2 = "";
        this.dateMax2 = "";
        
        this.dateStep = "";
        this.dateTimeMin = "";
        this.dateTimeMax = "";
        this.dateTimeMin2 = "";
        this.dateTimeMax2 = "";
        this.dateTimeStep = "";
        this.dateValue = "";
        this.dateValue2 = "";
        this.dateTimeValue = "";
        this.dateTimeValue2 = "";
        this.sliderMin = "";
        this.sliderMax = "";
        this.sliderStep = "";
        this.sliderValue = "";
        this.playMode = false;        
        this.speed = "x 1";
        this.dateTimeMode = false;
        this.atTheBegin = true;
        this.atTheEnd = false;
        this.minSpeedValue = true;
        this.maxSpeedValue = false;
    }
 }

class TimeControl extends WebComponentControl {

    static adjustTimeToSteps = (firstTime, step, value) => firstTime + Math.floor((value - firstTime) / step) * step;
    static adjustTimeToRange = (range, value) => range.includes(value) ? value : findClosestNumber(range,value) ;
    static frameRate = 0.5; //-- frames per second --> por defecto

    constructor(options) {
        super(...arguments);
        const self = this;        
        this.model = new TimeControlModel();
        this.model["start"] = () => {
            self.startAnimation();
        };
        this.model["stop"] = () => {
            self.stopAnimation();
        };
        this.model["next"] = () => {
            self.setNextTime();
        };
        this.model["previous"] = () => {
            self.setPreviousTime();            
        };
        this.model["first"] = () => {
            self.setLayerTime(self.firstTime);
        };
        this.model["last"] = () => {
            self.setLayerTime(self.lastTime);
        };
        
        this.model["sliderChange"] = (event) => {
            self.setLayerTime(event.target.valueAsNumber);
        }

        this.model["dateChange"] = (event) => {
            if (event.target.valueAsNumber && !isNaN(event.target.valueAsNumber))
                self.setLayerTime(event.target.valueAsNumber)
            
        }
        this.model["dateTimeChange"] = (event) => {
            if (event.target.valueAsNumber && !isNaN(event.target.valueAsNumber)) { 
                let newTime = event.target.valueAsNumber;
                newTime += new Date(newTime).getTimezoneOffset() * 60000; //-- 60.000 milisegundos en 1 minuto
                self.setLayerTime(newTime);
            }   
        }
        this.model["dateChange2"] = (event) => {
            if (event.target.valueAsNumber && !isNaN(event.target.valueAsNumber))
                self.setLayerTime(event.target.valueAsNumber-this.step)

        }
        this.model["dateTimeChange2"] = (event) => {
            if (event.target.valueAsNumber && !isNaN(event.target.valueAsNumber)) {
                let newTime = event.target.valueAsNumber - this.step;
                newTime += new Date(newTime).getTimezoneOffset() * 60000; //-- 60.000 milisegundos en 1 minuto
                self.setLayerTime(newTime);
            }
        }


        this.model["speedChange"] = (event) => {
            if (event.target.className === "tc-btn-speedUp") {
                self.currentSpeed = Math.min(self.currentSpeed + 1, self.maxSpeed);
            }               
            if (event.target.className === "tc-btn-speedDown") {
                self.currentSpeed = Math.max(self.currentSpeed - 1, self.minSpeed);
            }
            self.model.minSpeedValue = self.minSpeed === self.currentSpeed;
            self.model.maxSpeedValue = self.maxSpeed === self.currentSpeed;
            self.model.speed = "x " + self.currentSpeed;
        }
        if (!options?.config) return;
        Object.assign(this, options.config);
        this.currentSpeed = 1;
        this.minSpeed = 1;
        this.maxSpeed = 8;
        if (this.step) { 
            const adjustedLastTime = TimeControl.adjustTimeToSteps(this.firstTime, this.step, this.lastTime);
            if (this.lastTime > adjustedLastTime) {
                this.lastTime = adjustedLastTime + this.step; //-- Trampa por cambio horario, importante!
            }
            const millisecondsInDay = 86400000; //-- 24 * 60 * 60 * 1000;
            if (this.step < millisecondsInDay) {
                this.model.dateTimeMode = true;
            }
            console.log(convertirMilisegundos(this.step));
        }
        this.layer = options.layer;
        const currentTime=this.layer.getTime()
        this.time = new Date(currentTime ? Number.parseFloat(currentTime.split("/")[0]) : this.from);
        this.interval = !!this.step && this.step != millisecondsInDay;
        if (this.interval)
            this.lastTime -= this.step;
        this.setButtonsState();
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-timeline.mjs');
        self.template = module.default;
    }
    async register(map) {
        const self = this;
        await super.register.call(self, map);

        return self;
    }
    async render(callback) {
        const self = this;

        const sliderOptions = [];
        if (self.step) { 
            for (let markTime = self.firstTime; markTime <= self.lastTime; markTime += self.step) {
                sliderOptions.push({ value: markTime });
            }            
        }
        if (self.range) {
            self.range.forEach((date) => { sliderOptions.push({ "value": date }); });
        }
        [0, Math.round(sliderOptions.length / 2), sliderOptions.length - 1].forEach((index) => {
            const option = sliderOptions[index];
            sliderOptions[index]["label"] = new Date(option.value).toLocaleString();
        });
        
        sliderOptions.interval = self.interval;
        sliderOptions.dateTimeMode = self.model.dateTimeMode;
        await self.renderData(sliderOptions);
        self.controller = new Controller(self.model, new Observer(self));

        self.model.dateMin = getDateStringFromDateTimeString(getIsoStringFromMilliseconds(self.firstTime));
        self.model.dateMax = getDateStringFromDateTimeString(getIsoStringFromMilliseconds(self.lastTime - (self.interval?self.step:0)));
        if (self.interval) { 
            self.model.dateMin2 = getDateStringFromDateTimeString(getIsoStringFromMilliseconds(self.firstTime + self.step));
            self.model.dateMax2 = getDateStringFromDateTimeString(getIsoStringFromMilliseconds(self.lastTime));
        }
        
        self.model.dateStep = self.step ? self.step / millisecondsInDay : "";

        self.model.dateTimeMin = getIsoStringFromMilliseconds(getIsoStringFromMilliseconds(self.firstTime));
        self.model.dateTimeMax = getIsoStringFromMilliseconds(getIsoStringFromMilliseconds(self.lastTime - (self.interval ? self.step : 0)));
        if (self.interval) {
            self.model.dateTimeMin2 = getIsoStringFromMilliseconds(getIsoStringFromMilliseconds(self.firstTime + self.step));
            self.model.dateTimeMax2 = getIsoStringFromMilliseconds(getIsoStringFromMilliseconds(self.lastTime));
        }

        self.model.dateTimeStep = self.step? self.step / 1000:"";  

        self.model.sliderMin = self.firstTime;
        self.model.sliderMax = self.lastTime;
        self.model.sliderStep = self.step || "";

        this.setControlsTime();
        self.updateModel();
    }

    async startAnimation() {
        this.model.playMode = true;        
        while (this.model.playMode) {
            const delay = 1000 / TimeControl.frameRate / this.currentSpeed;
            await this.setNextTime();
            await (() => {
                const referrer = Promise.withResolvers();
                window.setTimeout(referrer.resolve, delay);
                return referrer.promise;
            })();
        }        
    }
    stopAnimation() { 
        this.model.playMode = false;        
    }

    //#animationTimeoutId;
    //#cancelTimer() { 
    //    if (this.#animationTimeoutId) {
    //        window.clearTimeout(this.animationTimeoutId);
    //        this.animationTimeoutId = null;
    //    }
    //}

    //#startTimer() { 
    //    this.#cancelTimer();
    //    this.animationTimeoutId = window.setTimeout(this.setNextTime, 1000);
    //}


    async setLayerTime(value) {
        if (this.step)
            value = TimeControl.adjustTimeToSteps(this.firstTime, this.step, value); //-- Por si el usuario selecciona en el calendario valores intermedios no válidos
        if (this.range) { 
            value = TimeControl.adjustTimeToRange(this.range, value);
        }
        if (value > this.lastTime) {
            value = this.lastTime;
        }
        else if (value < this.firstTime) {
            value = this.firstTime;
        }
        this.time.setTime(value); //-- No vale time=value porque se igualarían referencias, no valores    
        await this.layer.setTime(this.time, this.step?new Date(this.time.getTime() + this.step-1):null);  
        this.setControlsTime(); 
        this.setButtonsState();
        this.layer?.map.trigger(Consts.event.TIMECHANGE, { layer: this.layer, time: this.time });
    }

    async setNextTime() {
        const currentTime = this.time.getTime();
        let nextValue;
        if (this.step) {
            nextValue = currentTime + this.step;
            if (nextValue > this.lastTime) { //-- Bucle de tiempo
                nextValue = this.firstTime;
            }
        }
        else { 
            let index = this.range.indexOf(currentTime) + 1;
            if (index === this.range.length)
                nextValue = this.firstTime;
            else
                nextValue = this.range[index];
        }
        await this.setLayerTime(nextValue);        
    }

    setPreviousTime() {
        const currentTime = this.time.getTime();
        let previousValue;
        if (this.step) {
            previousValue = currentTime - this.step;
            if (previousValue < this.firstTime) { //-- Bucle de tiempo
                previousValue = this.lastTime;
            }
        }
        else {
            let index = this.range.indexOf(currentTime) - 1;
            if (index < 0)
                previousValue = this.lastTime;
            else
                previousValue = this.range[index];
        }        
        this.setLayerTime(previousValue);
    }

    setControlsTime() {
        const isoString = getIsoStringFromDate(this.time);
        const isoString2 = getIsoStringFromDate(new Date(this.time.getTime() + (this.step || 0)));
        this.model.dateTimeValue = isoString
        this.model.dateTimeValue2 = isoString2
        const splittedDateTime = splitDateTimeString(isoString);
        const splittedDateTime2 = splitDateTimeString(isoString2);
        this.model.dateValue = splittedDateTime[0];        
        this.model.dateValue2 = splittedDateTime2[0];
        //clock.value = splittedDateTime[1];
        this.model.sliderValue = this.time.getTime();        
    }
    setButtonsState() {
        if (this.time.getTime() === this.firstTime) {
            this.model.atTheBegin = true;
            this.model.atTheEnd = false;
        } else if (this.time.getTime() === this.lastTime) {
            this.model.atTheBegin = false;
            this.model.atTheEnd = true;
        }
        else {
            this.model.atTheBegin = false;
            this.model.atTheEnd = false;
        }
    }

    updateModel() {
        this.lang = this.map.getLocale();
        this.model["time.first"] = this.getLocaleString("time.first");
        this.model["time.backward"] = this.getLocaleString("time.backward");
        this.model["time.forward"] = this.getLocaleString("time.forward");
        this.model["time.last"] = this.getLocaleString("time.last");
        this.model["time.dateTime"] = this.interval ? this.getLocaleString("time.datetime.from") : this.getLocaleString("time.datetime");
        this.model["time.date"] = this.interval ? this.getLocaleString("time.date.from") : this.getLocaleString("time.date");
        this.model["time.dateTime2"] = this.getLocaleString("time.datetime.to");
        this.model["time.date2"] = this.getLocaleString("time.date.to");
        this.model["time.start"] = this.getLocaleString("time.start");
        this.model["time.pause"] = this.getLocaleString("time.pause");
        this.model["time.animationSpeed"] = this.getLocaleString("time.animationSpeed");
        this.model["time.range"] = this.getLocaleString("time.range");
        this.model["time.speedUp"] = this.getLocaleString("time.speedUp");
        this.model["time.speedDown"] = this.getLocaleString("time.speedDown");
        this.model["time.from"] = this.getLocaleString("time.from");
        this.model["time.to"] = this.getLocaleString("time.to");
    }
    async updateLanguage() {
        const self = this;
        self.updateModel();
    }
}
customElements.get(elementName) || customElements.define(elementName, TimeControl);
TimeControl.prototype.CLASS = 'tc-ctl-timecontrol';
TC.control.TimeControl = TimeControl;

TimeLine.prototype.CLASS = 'tc-ctl-timeline';
TC.control.TimeLine = TimeLine;
export default TimeLine;
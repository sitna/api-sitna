import TC from '../TC';
import Consts from './Consts';
import Cfg from './Cfg';
import EventTarget from './EventTarget';
import i18n from './i18n';
import Handlebars from '../lib/handlebars/helpers';
TC.i18n = TC.i18n || i18n;
TC._hbs = Handlebars;

/**
  * Opciones básicas de control.
  * @typedef ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @see 2-configuration
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  */

TC.control = TC.control || {};

TC.Control = function () {
    const self = this;
    EventTarget.call(self);

    self.map = null;
    self.isActive = false;
    self.isDisabled = false;
    self.CLASS = self.getClassName();

    var len = arguments.length;

    self.options = TC.Util.extend({}, len > 1 ? arguments[1] : arguments[0]);
    self.id = self.options.id || TC.getUID({
        prefix: self.CLASS.substr(TC.Control.prototype.CLASS.length + 1) + '-'
    });
    self.div = TC.Util.getDiv(self.options.div ? self.options.div : arguments[0]);
    self.div.classList.add(TC.Control.prototype.CLASS, self.CLASS);

    self.template = self.options.template || self.template;
    self.exportsState = false;    
};

TC.inherit(TC.Control, EventTarget);

(function () {
    const ctlProto = TC.Control.prototype;

    ctlProto.CLASS = 'tc-ctl';

    ctlProto.template = void 0;

    ctlProto.show = function () {
        this.div.style.display = '';
    };

    ctlProto.hide = function () {
        const self = this;
        self.div.style.display = 'none';
        self.unhighlight();
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(self.renderData(null, function () {
            self.addUIEventListeners();
            if (typeof callback === 'function') {
                callback();
            }
        }));
    };

    ctlProto.loadTemplates = async function () {

    };

    ctlProto.getClassName = function () {
        return this.CLASS;
    };

    ctlProto._set1stRenderPromise = function (promise) {
        const self = this;
        if (!self._firstRender) {
            self._firstRender = promise;
        }
        return promise;
    };

    ctlProto.renderData = async function (data, callback) {
        const self = this;
        if (self.map) {
            self.trigger(Consts.event.BEFORECONTROLRENDER, { dataObject: data });
        }
        self.div.classList.toggle(Consts.classes.DISABLED, self.isDisabled);

        let template;
        if (!self.template) {
            await self.loadTemplates();
        }
        if (typeof self.template === 'object' && !self.template.compiler) {
            template = self.template[self.CLASS];
        }
        else {
            template = self.template;
            self.template = {};
            self.template[self.CLASS] = template;
        }

        const html = await self.getRenderedHtml(self.CLASS, data);
        self.div.innerHTML = html;
        if (self.map) {
            self.trigger(Consts.event.CONTROLRENDER);
        }
        if (TC.Util.isFunction(callback)) {
            callback();
        }
    };

    const processTemplates = async function (templates, options) {
        options = options || {};

        const templatePromises = [];
        for (var key in templates) {
            const templateName = key;
            let template = templates[templateName];
            if (typeof template === 'string') {
                templatePromises.push(new Promise(function (res, rej) {
                    TC.ajax({
                        url: template,
                        method: 'GET',
                        responseType: 'text'
                    })
                        .then(function (response) {
                            templates[templateName] = template = Handlebars.compile(response.data); // TODO: add optimization options
                            res(template);
                        })
                        .catch(function (err) {
                            console.log("Error fetching template: " + err);
                            rej(err);
                        });
                }));
            }
            else {
                if (typeof template === 'object') {
                    templates[key] = template = Handlebars.template(template);
                }
            }
        }

        await Promise.all(templatePromises);
        for (var key2 in templates) {
            const t = templates[key2];
            if (t && key2 !== options.className) {
                Handlebars.registerPartial(key2, templates[key2]);
            }
        }
    };

    ctlProto.getRenderedHtml = async function (templateId, data, callback) {
        const self = this;

        const endFn = function (template) {
            if (typeof template === 'undefined') {
                return '';
            }
            const html = template(data);
            if (TC.Util.isFunction(callback)) {
                callback(html);
            }
            return html;
        };

        if (!self.template) {
            await self.loadTemplates();
        }
        const template = self.template[templateId];
        if (typeof template !== 'function') {
            await processTemplates(self.template, { locale: self.map && self.map.options.locale, className: self.CLASS });
            return endFn(self.template[templateId]);
        }
        else {
            return endFn(template);
        }
    };

    ctlProto.register = async function (map) {
        const self = this;
        self.map = map;
        await self.render();
        if (self.options.active) {
            self.activate();
        }
        return self;
    };

    ctlProto.activate = function () {
        const self = this;
        if (self.map && self.map.activeControl && self.map.activeControl !== self) {
            self.map.previousActiveControl = self.map.activeControl;
            self.map.activeControl.deactivate();
        }
        self.isActive = true;
        if (self.map) {
            self.map.activeControl = self;
            self.map.trigger(Consts.event.CONTROLACTIVATE, { control: self });
            self.trigger(Consts.event.CONTROLACTIVATE, { control: self });
        }
    };

    ctlProto.deactivate = function (stopChain) {
        if (arguments.length === 0) {
            stopChain = false;
        }

        const self = this;
        self.isActive = false;
        if (self.map) {
            self.map.activeControl = null;

            if (!stopChain) {
                //determinar cuál es el control predeterminado para reactivarlo
                //salvo que sea yo mismo, claro
                var nextControl = self.map.getDefaultControl();
                if (nextControl === self) nextControl = null;
                else if (self.map.previousActiveControl === self) // GLS: Validamos antes de activar que el control activo anterior sea distinto al control actual
                    nextControl = null;
                else if (!nextControl) {
                    nextControl = self.map.previousActiveControl;
                }

                if (nextControl)
                    nextControl.activate();
            }
            self.map.trigger(Consts.event.CONTROLDEACTIVATE, { control: self });
            self.trigger(Consts.event.CONTROLDEACTIVATE, { control: self });
        }
    };

    ctlProto.enable = function () {
        const self = this;
        self.isDisabled = false;
        if (self.div) {
            self.div.classList.remove(Consts.classes.DISABLED);
            delete self.div.dataset.tcMessage;
        }
        if (self.containerControl && self.containerControl.onControlEnable) {
            self.containerControl.onControlEnable(self);
        }
    };

    ctlProto.disable = function (options) {
        const self = this;
        options = options || {};
        self.isDisabled = true;
        if (self.div) {
            self.div.classList.add(Consts.classes.DISABLED);
            let message = self.getLocaleString('disabledControl');
            if (options.reason) {
                message = `${message} - ${options.reason}`;
            }
            self.div.dataset.tcMessage = message;
        }
        if (self.containerControl && self.containerControl.onControlDisable) {
            self.containerControl.onControlDisable(self);
        }
    };

    ctlProto.highlight = function () {
        const self = this;
        if (self.div) {
            self.div.classList.add(Consts.classes.HIGHLIGHTED);
        }
        if (self.map) {
            self.map.trigger(Consts.event.CONTROLHIGHLIGHT, { control: self });
        }
    };

    ctlProto.unhighlight = function () {
        const self = this;
        if (self.div) {
            self.div.classList.remove(Consts.classes.HIGHLIGHTED);
        }
        if (self.map) {
            self.map.trigger(Consts.event.CONTROLUNHIGHLIGHT, { control: self });
        }
    };

    ctlProto.isHighlighted = function () {
        const self = this;
        if (self.div) {
            return self.div.classList.contains(Consts.classes.HIGHLIGHTED);
        }
        return false;
    };

    //ctlProto.remove = function () {
    //    const self = this;
    //    if (self.map) {
    //        if (self.isActive) {
    //            self.deactivate();
    //        }
    //        const idx = self.map.controls.indexOf(self);
    //        if (idx >= 0) {
    //            self.map.controls.splice(idx, 1);
    //        }
    //        self.map = null;
    //        if (self._dialogDiv) {
    //            self._dialogDiv.remove();
    //        }
    //        if (self.div) {
    //            self.div.remove();
    //        }
    //    }
    //};

    ctlProto.renderPromise = function () {
        const self = this;
        return self._firstRender || new Promise(function (resolve, _reject) {
            self.one(Consts.event.CONTROLRENDER, function () {
                resolve(self);
            });
        });
    };

    ctlProto.addUIEventListener = function (selector, event, listener) {
        const self = this;
        const elements = selector ? self.div.querySelectorAll(selector) : [self.div];
        elements.forEach(function (elm) {
            elm.addEventListener(event, listener);
        });
    };

    ctlProto.addUIEventListeners = function () {
    };

    ctlProto.isExclusive = function () {
        return false;
    };

    ctlProto.getLocaleString = function (key, texts) {
        var self = this;
        var locale = self.map ? self.map.options.locale : Cfg.locale;
        return TC.Util.getLocaleString(locale, key, texts);
    };

    ctlProto.getUID = function () {
        const self = this;
        return TC.getUID({
            prefix: self.id + '-'
        });
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.exportsState) {
            return {};
        }
        return null;
    };

    ctlProto.importState = function (_state) {
    };
    
    ctlProto.getDownloadDialog = async function () {
        const self = this;
        self._downloadDialog = self._downloadDialog || self.map.getControlsByClass('TC.control.FeatureDownloadDialog')[0];
        if (!self._downloadDialog) {
            self._downloadDialog = await self.map.addControl('FeatureDownloadDialog');
        }
        self._downloadDialog.caller = self;
        return self._downloadDialog;
    };

    ctlProto.getElevationTool = async function () {
        const self = this;
        if (!self.displayElevation && !self.options.displayElevation) {
            return null;
        }
        if (self.elevation) {
            return self.elevation;
        }
        if (!TC.tool.Elevation) {
            await import('./tool/Elevation');
        }
        if (typeof self.options.displayElevation === 'boolean') {
            if (self.map) {
                const mapElevation = await self.map.getElevationTool();
                if (mapElevation) {
                    self.elevation = mapElevation;
                }
                else {
                    self.elevation = new TC.tool.Elevation();
                }
            }
            else {
                self.elevation = new TC.tool.Elevation();
            }
        }
        else {
            if (self.map) {
                const mapElevation = await self.map.getElevationTool();
                if (mapElevation) {
                    self.elevation = new TC.tool.Elevation(TC.Util.extend(true, {}, mapElevation.options, self.options.displayElevation));
                }
                else {
                    self.elevation = new TC.tool.Elevation(self.options.displayElevation);
                }
            }
            else {
                self.elevation = new TC.tool.Elevation(self.options.displayElevation);
            }
        }
        return self.elevation;
    };

})();

TC.Control.create = async function (type, options) {
    const ctorName = type.substr(0, 1).toUpperCase() + type.substr(1);
    if (!TC.control[ctorName]) {
        const module = await import('./control/' + ctorName);
        TC.control[ctorName] = module.default;
    }
    return new TC.control[ctorName](null, options);
};

var Control = TC.Control;
export default Control;
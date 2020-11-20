TC.control = TC.control || {};

// Carga de dust solamente si alguna plantilla lo usa
(function () {
    const parent = this;
    let value;
    Object.defineProperty(parent, 'dust', {
        get: function () {
            if (!TC._dustLoaded) {
                TC._dustLoaded = true;
                TC.syncLoadJS(TC.apiLocation + 'lib/dust/dust-full.min.js');
                TC.syncLoadJS(TC.apiLocation + 'lib/dust/dust-helpers.min.js');
                TC.syncLoadJS(TC.apiLocation + 'lib/dust/dust-i18n.min.js');
                TC.syncLoadJS(TC.apiLocation + 'lib/dust/dust.overrides.js');
                value = parent.dust;
            }
            return value;
        },
        set: function (newValue) { value = newValue; },
    });
})();
/////////////////////////////////////////////////////

TC.Control = function () {
    const self = this;
    TC.EventTarget.call(self);

    self.map = null;
    self.isActive = false;
    self.isDisabled = false;

    var len = arguments.length;

    self.options = TC.Util.extend({}, len > 1 ? arguments[1] : arguments[0]);
    self.id = self.options.id || TC.getUID(self.CLASS.substr(TC.Control.prototype.CLASS.length + 1) + '-');
    self.div = TC.Util.getDiv(self.options.div ? self.options.div : arguments[0]);
    if (TC._jQueryIsLoaded) {
        self._$div = $(self.div);
    }

    self.div.classList.add(TC.Control.prototype.CLASS, self.CLASS);

    self.template = self.options.template || self.template;
    self.exportsState = false;
};

TC.inherit(TC.Control, TC.EventTarget);

(function () {
    const ctlProto = TC.Control.prototype;

    ctlProto.CLASS = 'tc-ctl';

    ctlProto.template = void(0);

    ctlProto.show = function () {
        this.div.style.display = '';
    };

    ctlProto.hide = function () {
        this.div.style.display = 'none';
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

    ctlProto._set1stRenderPromise = function (promise) {
        const self = this;
        if (!self._firstRender) {
            self._firstRender = promise;
        }
        return promise;
    };

    const processTemplates = function (ctl) {
        return new Promise(function (resolve, reject) {
            const templates = ctl.template;
            let mustCompile = false;
            // Verificamos si hay plantillas mezcladas de los dos motores
            let hbsTemplates = false;
            let dustTemplates = false;
            const hbsTemplateKeys = [];
            for (var key in templates) {
                const template = templates[key];
                if (typeof template === 'string') {
                    mustCompile = true;
                    if (template.endsWith('.hbs')) {
                        hbsTemplates = true;
                        hbsTemplateKeys.push(key);
                    }
                    else {
                        dustTemplates = true;
                    }
                }
                else if (typeof template === 'object' || (template && template._isHbs)) {
                    hbsTemplates = true;
                    hbsTemplateKeys.push(key);
                }
                else if (typeof template === 'function') {
                    dustTemplates = true;
                }
            }

            if (hbsTemplates && dustTemplates) {
                // Plantillas mezcladas, luego estamos en un visor legacy, entonces cambiamos las Handlebars por dust.
                hbsTemplateKeys.forEach(function (key) {
                    templates[key] = TC.apiLocation + "TC/templates/" + key + ".html";
                });
                // No quedan plantillas Handlebars por compilar
                mustCompile = false;
            }

            if (dustTemplates) {
                // Si es la primera vez que pasamos por aquí, dust.i18n no está inicializado, inicializamos
                if (!dust.i18n._done) {
                    const locale = ctl.map.options.locale;
                    dust.i18n.setLanguages([locale]);
                    dust.i18n.add(locale, TC.i18n[locale]);
                    dust.i18n._done = true;
                }
            }

            const callback = function () {
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
                                    if (template.endsWith('.html')) {
                                        // Plantilla dust
                                        dust.loadSource(dust.compile(response.data, templateName));
                                        templates[templateName] = template = dust.cache[templateName];
                                        res(template);
                                        /////////////////
                                    }
                                    else {
                                        // Plantilla Handlebars
                                        templates[templateName] = template = TC._hbs.compile(response.data); // TODO: add optimization options
                                        template._isHbs = true;
                                        res(template);
                                    }
                                })
                                .catch(function (err) {
                                    console.log("Error fetching template: " + err);
                                    rej(err);
                                });
                        }));
                    }
                    else {
                        if (typeof template === 'object') {
                            templates[key] = template = TC._hbs.template(template);
                            template._isHbs = true;
                        }
                        else {
                            if (TC.Util.isFunction(template) && !template._isHbs) {
                                // Plantilla dust
                                if (!dust.cache[templateName]) {
                                    template();
                                    templates[templateName] = template = dust.cache[templateName];
                                }
                                /////////////////
                            }
                        }
                        templatePromises.push(Promise.resolve(template));
                    }
                }

                Promise.all(templatePromises).then(function () {
                    for (var key in templates) {
                        const t = templates[key];
                        if (t && t._isHbs && key !== self.CLASS) {
                            TC._hbs.registerPartial(key, templates[key]);
                        }
                    }
                    resolve();
                });
            };

            if (mustCompile) {
                TC.loadJSInOrder(
                    !TC._hbs || !TC._hbs.compile,
                    TC.url.templatingFull,
                    callback
                );
            }
            else {
                TC.loadJSInOrder(
                    !TC._hbs,
                    TC.url.templatingRuntime,
                    callback
                );
            }
        });
    };

    ctlProto.renderData = function (data, callback) {
        const self = this;
        return new Promise(function (resolve, reject) {
            if (self.map) {
                self.trigger(TC.Consts.event.BEFORECONTROLRENDER, { dataObject: data });
            }
            self.div.classList.toggle(TC.Consts.classes.DISABLED, self.isDisabled);

            let template;
            if (typeof self.template === 'object' && !self.template.compiler) {
                template = self.template[self.CLASS];
            }
            else {
                template = self.template;
                self.template = {};
                self.template[self.CLASS] = template;
            };

            self.getRenderedHtml(self.CLASS, data)
                .then(function (html) {
                    self.div.innerHTML = html;
                    if (self.map) {
                        self.trigger(TC.Consts.event.CONTROLRENDER);
                    }
                    if (TC.Util.isFunction(callback)) {
                        callback();
                    }
                    resolve();
                });
        });
    };

    ctlProto.getRenderedHtml = function (templateId, data, callback) {
        const self = this;
        return new Promise(function (resolve, reject) {

            const endFn = function (template) {
                if (typeof template === 'undefined') {
                    resolve('');
                    return;
                }
                if (template._isHbs) {
                    // Es una plantilla Handlebars
                    const html = template(data);
                    if (TC.Util.isFunction(callback)) {
                        callback(html);
                    }
                    resolve(html);
                }
                else {
                    // Es una plantilla dust
                    if (dust.cache[templateId]) {
                        self.template[templateId] = template = dust.cache[templateId];
                        dust.render(templateId, data || {}, function (err, out) {
                            if (err) {
                                TC.error(err);
                                reject(Error(err));
                            }
                            else {
                                if (TC.Util.isFunction(callback)) {
                                    callback(out);
                                }
                                resolve(out);
                            }
                        });
                    }
                    else {
                        processTemplates(self).then(function () {
                            endFn(self.template[templateId]);
                        })
                    }
                    ////////////////////////
                }
            };
            const template = self.template[templateId];

            if (typeof template !== 'function') {
                processTemplates(self).then(function () {
                    endFn(self.template[templateId]);
                })
            }
            else {
                endFn(template);
            }
        });
    };

    ctlProto.register = function (map) {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.map = map;
            Promise.resolve(self.render()).then(function () {
                if (self.options.active) {
                    self.activate();
                }
                resolve(self);
            });
        });
    };

    ctlProto.activate = function () {
        var self = this;
        if (self.map && self.map.activeControl && self.map.activeControl != self) {
            self.map.previousActiveControl = self.map.activeControl;
            self.map.activeControl.deactivate();
        }
        self.isActive = true;
        if (self.map) {
            self.map.activeControl = self;
            self.map.trigger(TC.Consts.event.CONTROLACTIVATE, { control: self });
            self.trigger(TC.Consts.event.CONTROLACTIVATE, { control: self });
        }
    };

    ctlProto.deactivate = function (stopChain) {
        if (arguments.length == 0) stopChain = false;

        var self = this;
        self.isActive = false;
        if (self.map) {
            self.map.activeControl = null;

            if (!stopChain) {
                //determinar cuál es el control predeterminado para reactivarlo
                //salvo que sea yo mismo, claro
                var nextControl = self.map.getDefaultControl();
                if (nextControl == self) nextControl = null;
                else if (self.map.previousActiveControl == self) // GLS: Validamos antes de activar que el control activo anterior sea distinto al control actual
                    nextControl = null;
                else if (!nextControl) {
                    nextControl = self.map.previousActiveControl;
                }

                if (nextControl)
                    nextControl.activate();
            }
            self.map.trigger(TC.Consts.event.CONTROLDEACTIVATE, { control: self });
            self.trigger(TC.Consts.event.CONTROLDEACTIVATE, { control: self });
        }
    };

    ctlProto.enable = function () {
        var self = this;
        self.isDisabled = false;
        if (self.div) {
            self.div.classList.remove(TC.Consts.classes.DISABLED);
        }
    };

    ctlProto.disable = function () {
        var self = this;
        self.isDisabled = true;
        if (self.div) {
            self.div.classList.add(TC.Consts.classes.DISABLED);
        }
    };

    ctlProto.renderPromise = function () {
        const self = this;
        return self._firstRender || new Promise(function (resolve, reject) {
            self.one(TC.Consts.event.CONTROLRENDER, function () {
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
        var locale = self.map ? self.map.options.locale : TC.Cfg.locale;
        return TC.Util.getLocaleString(locale, key, texts);
    };

    ctlProto.getUID = function () {
        const self = this;
        return TC.getUID(self.id + '-');
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.exportsState) {
            return {};
        }
        return null;
    };

    ctlProto.importState = function (state) {
    };
    
    ctlProto.getDownloadDialog = function () {
        const self = this;
        self._downloadDialog = self._downloadDialog || self.map.getControlsByClass('TC.control.FeatureDownloadDialog')[0];
        if (self._downloadDialog) {
            self._downloadDialog.caller = self;
            return Promise.resolve(self._downloadDialog);
        }
        return new Promise(function (resolve, reject) {
            self.map.addControl('FeatureDownloadDialog').then(ctl => {
                self._downloadDialog = ctl;
                self._downloadDialog.caller = self;
                resolve(ctl);
            })
        });
    };

    ctlProto.getElevationTool = function () {
        const self = this;
        if (!self.displayElevation && !self.options.displayElevation) {
            return Promise.resolve(null);
        }
        if (self.elevation) {
            return Promise.resolve(self.elevation);
        }
        return new Promise(function (resolve, reject) {
            TC.loadJS(
                !TC.tool || !TC.tool.Elevation,
                TC.apiLocation + 'TC/tool/Elevation',
                function () {
                    if (typeof self.options.displayElevation === 'boolean') {
                        if (self.map) {
                            self.map.getElevationTool().then(function (mapElevation) {
                                if (mapElevation) {
                                    self.elevation = mapElevation;
                                }
                                else {
                                    self.elevation = new TC.tool.Elevation();
                                }
                                resolve(self.elevation);
                            });
                        }
                        else {
                            self.elevation = new TC.tool.Elevation();
                            resolve(self.elevation);
                        }
                    }
                    else {
                        if (self.map) {
                            self.map.getElevationTool().then(function (mapElevation) {
                                if (mapElevation) {
                                    self.elevation = new TC.tool.Elevation(TC.Util.extend(true, {}, mapElevation.options, self.options.displayElevation));
                                }
                                else {
                                    self.elevation = new TC.tool.Elevation(self.options.displayElevation);
                                }
                                resolve(self.elevation);
                            });
                        }
                        else {
                            self.elevation = new TC.tool.Elevation(self.options.displayElevation);
                            resolve(self.elevation);
                        }
                    }
                }
            );
        });
    };

})();

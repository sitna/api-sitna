TC.control = TC.control || {};
TC.Control = function () {
    const self = this;
    TC.EventTarget.call(self);

    self.map = null;
    self.isActive = false;
    self.isDisabled = false;

    var len = arguments.length;

    self.options = $.extend({}, len > 1 ? arguments[1] : arguments[0]);
    self.id = self.options.id || TC.getUID(self.CLASS.substr(TC.Control.prototype.CLASS.length + 1) + '-');
    self.div = TC.Util.getDiv(self.options.div ? self.options.div : arguments[0]);
    self._$div = $(self.div);

    // 12/03/2019 GLS https://developer.mozilla.org/es/docs/Web/API/Element/classList
    // Múltiples argumentos para add() y remove() IE	Sin soporte
    self.div.classList.add(TC.Control.prototype.CLASS);
    self.div.classList.add(self.CLASS);    
    
    self.template = self.options.template || self.template;
    self.exportsState = false;
};

TC.inherit(TC.Control, TC.EventTarget);

(function () {
    const ctlProto = TC.Control.prototype;

    ctlProto.CLASS = 'tc-ctl';

    ctlProto.template = '';

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

    const processTemplates = function (ctl, data, templates) {
        return new Promise(function (resolve, reject) {
            const htmlPromises = [];
            const templateKeys = [];
            for (var key in templates) {
                var template = templates[key];
                if (typeof template === 'string') {
                    if (dust.cache[ctl.CLASS]) {
                        dust.render(ctl.CLASS, data, function (err, out) {
                            ctl.div.innerHTML = out;
                            if (err) {
                                TC.error(err);
                            }
                        });
                    } else {
                        var prom = TC.ajax({
                            url: template,
                            method: "GET",
                            responseType: 'text'
                        });
                        htmlPromises.push(prom);
                        templateKeys.push(key);
                    }
                }
                else if ($.isFunction(template)) {
                    template();
                }
            }

            if (htmlPromises.length === 0) {
                resolve();
            }
            else {
                Promise.all(htmlPromises)
                    .then(function (templateArray) {
                        templateArray.forEach(function (template, idx) {
                            const tpl = dust.compile(template, templateKeys[idx]);
                            dust.loadSource(tpl);
                        });
                        resolve();
                    })
                    .catch(function (err) {
                        console.error("Error fetching templates: " + err);
                        reject(err instanceof Error ? err : Error(err));
                    });
            }

        });
    };

    ctlProto.renderData = function (data, callback) {
        const self = this;
        return new Promise(function (resolve, reject) {
            if (self.map) {
                self.trigger(TC.Consts.event.BEFORECONTROLRENDER, { dataObject: data });
            }
            if (self.isDisabled) {
                self.div.classList.add(TC.Consts.classes.DISABLED);
            }
            else {
                self.div.classList.remove(TC.Consts.classes.DISABLED);
            }

            TC.loadJSInOrder(
                !window.dust,
                TC.url.templating,
                function () {
                    var tplProm;

                    if (typeof self.template === 'object') {
                        tplProm = processTemplates(self, data, self.template);
                    }
                    else {
                        var templates = {};

                        if (self.template) templates[self.CLASS] = self.template;


                        tplProm = processTemplates(self, data, templates);
                    }

                    tplProm
                        .then(function () {
                            if (dust.cache[self.CLASS]) {
                                dust.render(self.CLASS, data, function (err, out) {
                                    self.div.innerHTML = out;
                                    if (err) {
                                        reject(Error(err));
                                        TC.error(err);
                                    }
                                });
                            }

                            self.trigger(TC.Consts.event.CONTROLRENDER);
                            if ($.isFunction(callback)) {
                                callback();
                            }
                            resolve();
                        })
                        .catch(function (err) {
                            reject(Error(err));
                        });
                }
            );
        });
    };

    ctlProto.getRenderedHtml = function (templateId, data, callback) {
        const self = this;
        return new Promise(function (resolve, reject) {
            var render = function () {
                if (dust.cache[templateId]) {
                    dust.render(templateId, data, function (err, out) {
                        if (err) {
                            TC.error(err);
                            reject(Error(err));
                        }
                        else {
                            if ($.isFunction(callback)) {
                                callback(out);
                            }
                            resolve(out);
                        }
                    });
                }
            };
            TC.loadJSInOrder(
                !window.dust,
                TC.url.templating,
                function () {
                    if (!dust.cache[templateId]) {
                        var template = self.template[templateId];
                        if (typeof template === 'string') {
                            TC.ajax({
                                url: template,
                                method: "GET",
                                responseType: 'text'
                            })
                                .then(function (html) {
                                    var tpl = dust.compile(html, templateId);
                                    dust.loadSource(tpl);
                                    render();
                                })
                                .catch(function (err) {
                                    console.log("Error fetching template: " + err)
                                });
                        }
                        else if ($.isFunction(template)) {
                            template();
                            render();
                        }
                    }
                    else {
                        render();
                    }
                }
            );
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
})();
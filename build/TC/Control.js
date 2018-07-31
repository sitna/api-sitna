TC.control = TC.control || {};
TC.Control = function () {
    var self = this;
    
    //TC.Object.apply(self, arguments);
    self.$events = $(self);

    self.map = null;
    self.isActive = false;
    self.isDisabled = false;
    self._firstRender = $.Deferred();

    var len = arguments.length;

    self.options = $.extend({}, len > 1 ? arguments[1] : arguments[0]);
    self.id = self.options.id || TC.getUID(self.CLASS.substr(TC.Control.prototype.CLASS.length + 1) + '-');
    self.div = TC.Util.getDiv(self.options.div ? self.options.div : arguments[0]);
    self._$div = $(self.div);
    self._$div.addClass(TC.Control.prototype.CLASS).addClass(self.CLASS);
    self.template = self.options.template || self.template;
    self.exportsState = false;

    //self.render();
};

//TC.inherit(TC.Control, TC.Object);
TC.Control.prototype.on = function (events, callback) {
    var obj = this;
    obj.$events.on(events, callback);
    return obj;
};

TC.Control.prototype.one = function (events, callback) {
    var obj = this;
    obj.$events.one(events, callback);
    return obj;
};

TC.Control.prototype.off = function (events, callback) {
    var obj = this;
    obj.$events.off(events, callback);
    return obj;
};

TC.Control.prototype.CLASS = 'tc-ctl';

TC.Control.prototype.template = '';

TC.Control.prototype.show = function () {
    this._$div.show();
};

TC.Control.prototype.hide = function () {
    this._$div.hide();
};

TC.Control.prototype.render = function (callback) {
    var self = this;
    self.renderData(null, callback);
};

TC.Control.prototype.renderData = function (data, callback) {
    var self = this;
    if (self.map) {
        var e = $.Event(TC.Consts.event.BEFORECONTROLRENDER, { dataObject: data });
        self.$events.trigger(e);
    }
    self._$div.toggleClass(TC.Consts.classes.DISABLED, self.isDisabled);

    TC.loadJSInOrder(
        !window.dust,
        TC.url.templating,
        function () {
            var processTemplates = function (templates)
            {
                var ret = $.Deferred();
                var htmDefs = [];
                for (var key in templates)
                {
                    var template = templates[key];
                    if (typeof template === 'string')
                    {
                        if (dust.cache[self.CLASS]) {
                            dust.render(self.CLASS, data, function (err, out) {
                                self._$div.html(out);
                                if (err) {
                                    TC.error(err);
                                }
                            });                            
                        } else {
                            var def = $.ajax({
                                url: template,
                                type: "get",
                                dataType: "html"
                            });
                            def.templateKey = key;

                            htmDefs.push(def);
                        }                        
                    }
                    else if ($.isFunction(template))
                    {
                        template();
                    }
                }

                //si defs está vacío, resolver inmediatamente
                if (htmDefs.length == 0) ret.resolve();
                else
                {                    
                    $.when.apply($, htmDefs).then(function ()   //args tiene los htms
                    {
                        //si sólo había un deferred, args es arguments
                        if (arguments.length==3 && !$.isArray(arguments[0]))
                        {
                            var htm = arguments[0];
                            var key = arguments[2].templateKey;
                            var tpl = dust.compile(htm, key);
                            dust.loadSource(tpl);
                        }
                        else
                        {
                            for (var i = 0; i < arguments.length; i++)
                            {
                                var args = arguments[i];
                                var htm = args[0];
                                var key = args[2].templateKey;
                                var tpl = dust.compile(htm, key);
                                dust.loadSource(tpl);
                            }
                        }

                        
                        ret.resolve();
                    }, 
                    function (a,b,c)
                    {
                        console.error("Deferred fallido");
                    });
                }

                return ret;
            };


            var tplDef;

            if (typeof self.template === 'object') {
                tplDef = processTemplates(self.template);
            }
            else {
                var templates = {};

                if(self.template) templates[self.CLASS] = self.template;
                

                tplDef = processTemplates(templates);
            }

            tplDef.then(function ()
            {
                if (dust.cache[self.CLASS])
                {
                    dust.render(self.CLASS, data, function (err, out)
                    {
                        self._$div.html(out);
                        if (err)
                        {
                            TC.error(err);
                        }
                    });
                }

                self._firstRender.resolve();
                self.$events.trigger($.Event(TC.Consts.event.CONTROLRENDER));
                if ($.isFunction(callback))
                {
                    callback();
                }
            });
        }
    );
};

TC.Control.prototype.getRenderedHtml = function (templateId, data, callback) {
    var self = this;
    var result = $.Deferred();
    var render = function () {
        if (dust.cache[templateId]) {
            dust.render(templateId, data, function (err, out) {
                if (err) {
                    TC.error(err);
                    result.reject();
                }
                else {
                    if ($.isFunction(callback)) {
                        callback(out);
                    }
                    result.resolve(out);
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
                    $.ajax({
                        url: template,
                        type: "get",
                        dataType: "html"
                    }).done(function () {
                        var html = arguments[0];
                        var tpl = dust.compile(html, templateId);
                        dust.loadSource(tpl);
                        render();
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
    return result;
};

TC.Control.prototype.register = function (map) {
    var self = this;
    self.map = map;
    self.render();
    if (self.options.active) {
        self.activate();
    }
};

TC.Control.prototype.activate = function () {
    var self = this;
    if (self.map && self.map.activeControl && self.map.activeControl != self)
    {
        self.map.previousActiveControl = self.map.activeControl;

        /* provisional hasta que el 3D deje de ser un control */
        if (!(TC.control.ThreeD && self instanceof TC.control.ThreeD)) {
            self.map.activeControl.deactivate();
        }
    }
    self.isActive = true;
    if (self.map) {
        self.map.activeControl = self;
        self.map.$events.trigger($.Event(TC.Consts.event.CONTROLACTIVATE, { control: self }));
        self.$events.trigger($.Event(TC.Consts.event.CONTROLACTIVATE, { control: self }));
    }
};

TC.Control.prototype.deactivate = function (stopChain)
{
    if (arguments.length == 0) stopChain = false;

    var self = this;
    self.isActive = false;
    if (self.map)
    {
        self.map.activeControl = null;

        if (!stopChain)
        {
            //determinar cuál es el control predeterminado para reactivarlo
            //salvo que sea yo mismo, claro
            var nextControl = self.map.getDefaultControl();
            if (nextControl == self) nextControl = null;
            else if(self.map.previousActiveControl == self) // GLS: Validamos antes de activar que el control activo anterior sea distinto al control actual
                nextControl = null;
            else if (!nextControl) { 
                nextControl = self.map.previousActiveControl;
            }

            if (nextControl)
                nextControl.activate();
        }
        self.map.$events.trigger($.Event(TC.Consts.event.CONTROLDEACTIVATE, { control: self }));
        self.$events.trigger($.Event(TC.Consts.event.CONTROLDEACTIVATE, { control: self }));
    }
};

TC.Control.prototype.enable = function () {
    var self = this;
    self.isDisabled = false;
    if (self._$div) {
        self._$div.removeClass(TC.Consts.classes.DISABLED);
    }
};

TC.Control.prototype.disable = function () {
    var self = this;
    self.isDisabled = true;
    if (self._$div) {
        self._$div.addClass(TC.Consts.classes.DISABLED);
    }
};

TC.Control.prototype.renderPromise = function ()
{
    return this._firstRender.promise();
};

TC.Control.prototype.isExclusive = function () {
    return false;
};

TC.Control.prototype.getLocaleString = function (key, texts) {
    var self = this;
    var locale = self.map ? self.map.options.locale : TC.Cfg.locale;
    return TC.Util.getLocaleString(locale, key, texts);
};

TC.Control.prototype.getUID = function () {
    const self = this;
    return TC.getUID(self.id + '-');
};

TC.Control.prototype.exportState = function () {
    const self = this;
    if (self.exportsState) {
        return {};
    }
    return null;
};

TC.Control.prototype.importState = function (state) {
};
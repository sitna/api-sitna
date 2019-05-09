TC.control = TC.control || {};

if (!TC.control.Container) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control/Container');
}

TC.control.TabContainer = function () {
    var self = this;

    TC.control.Container.apply(self, arguments);

    var cs = self._classSelector = '.' + self.CLASS;
    self._selectors = {
        TAB: cs + '-tab',
        RADIOBUTTON: 'input[type=radio][name=sctnr-sel]',
        ELEMENT: cs + '-elm'
    };    
};

TC.inherit(TC.control.TabContainer, TC.control.Container);

(function () {
    var ctlProto = TC.control.TabContainer.prototype;

    ctlProto.CLASS = 'tc-ctl-tctr';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/TabContainer.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").f(ctx.get(["title"], false), ctx, "h").w("</h2><div class=\"tc-ctl-tctr-select\"><form>").s(ctx.get(["controls"], false), ctx, { "block": body_1 }, {}).w("</form></div>").s(ctx.get(["controls"], false), ctx, { "block": body_2 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<label class=\"tc-ctl-tctr-tab tc-ctl-tctr-tab-").f(ctx.get(["$idx"], false), ctx, "h").w("\" style=\"width:calc(100%/").f(ctx.get(["$len"], false), ctx, "h").w(" - 1px)\"><input type=\"radio\" name=\"sctnr-sel\" value=\"").f(ctx.get(["$idx"], false), ctx, "h").w("\" /><span>").f(ctx.get(["title"], false), ctx, "h").w("</span></label>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<div class=\"tc-ctl-tctr-elm tc-ctl-tctr-elm-").f(ctx.get(["$idx"], false), ctx, "h").w(" tc-hidden\"></div>"); } body_2.__dustBody = !0; return body_0 };
    }

    ctlProto.onRenderPromise = function () {
        const self = this;

        self.title = self.title || self.getLocaleString(self.options.title || 'moreControls');
        self.div.querySelector('h2').innerHTML = self.title;

        var bufferPromises = new Array(self.ctlCount);
        for (var i = 0, len = self.controlOptions.length; i < len; i++) {
            var ctl = self.controlOptions[i];
            bufferPromises[i] = self.map.addControl(ctl.name, $.extend({
                id: self.uids[i],
                div: self.div.querySelector('.' + self.CLASS + '-elm-' + i)
            }, ctl.options));
        }
        var writeTitle = function (ctl, idx) {
            ctl.renderPromise().then(function () {
                const title = self.getLocaleString(self.controlOptions[idx].title) || ctl.div.querySelector('h2').innerHTML;
                var parent = ctl.div;
                do {
                    parent = parent.parentElement;
                }
                while (parent && !parent.matches(self._classSelector));
                parent.querySelector(self._selectors.TAB + '-' + idx + ' span').innerHTML = title;
            });
        };
        Promise.all(bufferPromises).then(function (controls) {
            for (var i = 0, len = controls.length; i < len; i++) {
                var ctl = controls[i];
                ctl.containerControl = self;
                writeTitle(ctl, i);                
            }
        });
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(self.renderData({ title: self.title, controls: self.controlOptions }, function () {

            var clickHandler = function (e) {
                var closest = this;
                while (closest && !closest.matches(self._selectors.TAB)) {
                    closest = closest.parentElement;
                }
                var active, hidden = [];
                const checkbox = closest.querySelector(self._selectors.RADIOBUTTON);
                const newValue = checkbox.value;
                const elms = self.div.querySelectorAll(self._selectors.ELEMENT);
                if (self._oldValue === newValue && self.options.deselectable) {
                    setTimeout(function () {
                        checkbox.checked = false;
                    }, 0);
                    self._oldValue = null;
                    active = null;
                    hidden = elms;
                }
                else {
                    elms.forEach(function (elm) {
                        if (elm.matches(self._selectors.ELEMENT + '-' + newValue)) {
                            active = elm;
                        }
                        else {
                            hidden.push(elm);
                        }
                    });
                    self._oldValue = newValue;
                }

                if (active) {
                    active.classList.remove(TC.Consts.classes.HIDDEN);
                }
                hidden.forEach(function (elm) {
                    elm.classList.add(TC.Consts.classes.HIDDEN);
                });
                checkbox.checked = true;
            };

            self.div.querySelectorAll('span').forEach(function (span) {
                span.addEventListener(TC.Consts.event.CLICK, clickHandler);
            });

            // GLS: Si en el register de control se llama a render, ¿por qué volvemos a llamarlo aquí?
            //for (var i = 0, len = self._ctlPromises.length; i < len; i++) {
            //    self.getControl(i).then(function (ctl) {
            //        ctl.render();
            //    });
            //}

            if (typeof self.defaultSelection === 'number') {
                clickHandler.call(self.div.querySelectorAll(self._selectors.RADIOBUTTON)[self.defaultSelection]);
            }
        }));
    };

})();

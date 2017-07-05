TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.SelectContainer = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    var cs = self._classSelector = '.' + self.CLASS;
    self._selectors = {
        TAB: cs + '-tab',
        RADIOBUTTON: 'input[type=radio][name=sctnr-sel]',
        ELEMENT: cs + '-elm'
    };

    self.controlOptions = self.options.controls || [];
    var ctlCount = self.controlOptions.length;
    self._ctlDeferreds = new Array(ctlCount);
    for (var i = 0; i < ctlCount; i++) {
        self._ctlDeferreds[i] = $.Deferred();
    }
};

TC.inherit(TC.control.SelectContainer, TC.Control);

(function () {
    var ctlProto = TC.control.SelectContainer.prototype;

    ctlProto.CLASS = 'tc-ctl-sctnr';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/SelectContainer.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").f(ctx.get(["title"], false), ctx, "h").w("</h2><div class=\"tc-ctl-sctnr-select\"><form>").s(ctx.get(["controls"], false), ctx, { "block": body_1 }, {}).w("</form></div>").s(ctx.get(["controls"], false), ctx, { "block": body_2 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<label class=\"tc-ctl-sctnr-tab tc-ctl-sctnr-tab-").f(ctx.get(["$idx"], false), ctx, "h").w("\" style=\"width:calc(100%/").f(ctx.get(["$len"], false), ctx, "h").w(" - 1px)\"><input type=\"radio\" name=\"sctnr-sel\" value=\"").f(ctx.get(["$idx"], false), ctx, "h").w("\" /><span>").f(ctx.get(["title"], false), ctx, "h").w("</span></label>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<div class=\"tc-ctl-sctnr-elm tc-ctl-sctnr-elm-").f(ctx.get(["$idx"], false), ctx, "h").w(" tc-hidden\"></div>"); } body_2.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);
        self.renderPromise().then(function () {
            self.title = self.getLocaleString(self.options.title || 'moreControls');
            self._$div.find('h2').first().html(self.title);            

            var bufferDeferreds = new Array(self.controlOptions.length);
            for (var i = 0, len = self.controlOptions.length; i < len; i++) {
                var ctl = self.controlOptions[i];
                bufferDeferreds[i] = map.addControl(ctl.name, $.extend({ div: self._$div.find('.' + self.CLASS + '-elm-' + i) }, ctl.options));
            }
            var writeTitle = function (ctl, idx) {
                ctl.renderPromise().then(function () {
                    var title = self.getLocaleString(self.controlOptions[idx].title) || ctl._$div.find('h2').first().html();
                    ctl._$div
                        .parents(self._classSelector)
                        .first()
                        .find(self._selectors.TAB + '-' + idx + ' span')
                        .html(title);
                });
            };
            $.when.apply(self, bufferDeferreds).then(function () {
                for (var i = 0, len = arguments.length; i < len; i++) {
                    var ctl = arguments[i];
                    writeTitle(ctl, i);
                    self._ctlDeferreds[i].resolve(ctl);
                }
            });
        });
    };

    ctlProto.render = function (callback) {
        var self = this;
        self.renderData({ title: self.title, controls: self.controlOptions }, function () {

            var clickHandler = function (e) {
                var $cb = $(this).closest(self._selectors.TAB).find(self._selectors.RADIOBUTTON);
                var newValue = $cb.val();
                var $elms = self._$div.find(self._selectors.ELEMENT);
                if (self._oldValue === newValue && self.options.deselectable) {
                    setTimeout(function () {
                        $cb.prop("checked", false);
                    }, 0);
                    self._oldValue = null;
                    $active = $();
                    $hidden = $elms;
                }
                else {
                    $active = $elms.filter(self._selectors.ELEMENT + '-' + newValue);
                    $hidden = $elms.not($active);
                    self._oldValue = newValue;
                }

                $active.removeClass(TC.Consts.classes.HIDDEN);
                $hidden.addClass(TC.Consts.classes.HIDDEN);
                $cb.prop("checked", true);
            };

            self._$div.find('span').on(TC.Consts.event.CLICK, clickHandler);

            for (var i = 0, len = self._ctlDeferreds.length; i < len; i++) {
                self.getControl(i).then(function (ctl) {
                    ctl.render();
                });
            }

            if (typeof self.options.defaultSelection === 'number') {
                clickHandler.call(self._$div.find(self._selectors.RADIOBUTTON).get(self.options.defaultSelection));
            }
        });
    };

    ctlProto.getControl = function (idx) {
        var deferred = this._ctlDeferreds[idx];
        if (!deferred) {
            deferred = $.Deferred();
            deferred.reject();
        }
        return deferred.promise();
    };

})();

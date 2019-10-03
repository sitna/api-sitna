TC.control = TC.control || {};

if (!TC.control.Container) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control/Container');
}

TC.control.ControlContainer = function () {
    var self = this;

    TC.control.Container.apply(self, arguments);

    var cs = self._classSelector = '.' + self.CLASS;
};

TC.inherit(TC.control.ControlContainer, TC.control.Container);

(function () {
    var ctlProto = TC.control.ControlContainer.prototype;

    ctlProto.CLASS = 'tc-ctl-cctr';
    ctlProto.SIDE = {
        LEFT: "left",
        RIGHT: "right"
    };

    ctlProto.template = {};
    if (TC.isDebug) {        
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/ControlContainer.html";
        ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/ControlContainerNode.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.write("<ul class=\"tc-ctl-cctr-left\">").section(ctx.get("controls"), ctx, { "block": body_1 }, null).write("</ul><ul class=\"tc-ctl-cctr-right\">").section(ctx.get("controls"), ctx, { "block": body_3 }, null).write("</ul>"); } function body_1(chk, ctx) { return chk.helper("eq", ctx, { "block": body_2 }, { "key": ctx.get("side"), "value": "left" }); } function body_2(chk, ctx) { return chk.write("<li class=\"tc-ctl-cctr-elm tc-ctl-cctr-elm-").reference(ctx.get("index"), ctx, "h").write("\"><div></div></li>"); } function body_3(chk, ctx) { return chk.helper("eq", ctx, { "block": body_4 }, { "key": ctx.get("side"), "value": "right" }); } function body_4(chk, ctx) { return chk.write("<li class=\"tc-ctl-cctr-elm tc-ctl-cctr-elm-").reference(ctx.get("index"), ctx, "h").write("\"><div></div></li>"); } return body_0; };        
        ctlProto.template[ctlProto.CLASS + '-node'] = function () { dust.register(ctlProto.CLASS + '-node', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-cctr-elm tc-ctl-cctr-elm-").f(ctx.get(["index"], false), ctx, "h").w("\"><div></div></li>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.onRenderPromise = function () {
        const self = this;

        var bufferPromises = new Array(self.ctlCount);

        Object.keys(self.controlOptions).forEach(function (key, i) {
            var ctl = self.controlOptions[key];            
            bufferPromises[i] = self.map.addControl(key, TC.Util.extend({
                id: self.uids[i],
                div: self.div.querySelector('.' + self.CLASS + '-elm-' + i).querySelector('div')
            }, ctl.options));
        });

        Promise.all(bufferPromises).then(function () {
            for (var i = 0, len = arguments.length; i < len; i++) {
                var ctl = arguments[i];
                ctl.containerControl = self;
            }
        });
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(self.renderData({
            controls: Object.keys(self.controlOptions).map(function (key, i) {
                return TC.Util.extend(self.controlOptions[key], { index: i });
            })
        }));
    };

    ctlProto.addControl = function (control, options) {
        const self = this;
        options.side = options.side || self.SIDE.LEFT;

        return new Promise(function (resolve, reject) {
            self.getRenderedHtml(self.CLASS + '-node', { index: ++self.ctlCount }, function (html) {
                var template = document.createElement('template');
                template.innerHTML = html.trim();

                self.div.querySelector('ul.' + self.CLASS + '-' + options.side).appendChild(template.content ? template.content.firstChild : template.firstChild);
                self.map.addControl(control, TC.Util.extend({
                    id: self.getUID(),
                    div: self.div.querySelector('.' + self.CLASS + '-elm-' + self.ctlCount).querySelector('div')
                }, options)).then(function (ctrl) {
                    resolve(ctrl);
                });
            });
        });
    };

    ctlProto.addElement = function (options) {
        const self = this;

        options.side = options.side || self.SIDE.LEFT;

        var li = document.createElement('li');
        li.setAttribute('class', (self.CLASS + '-elm ') + (self.CLASS + '-elm-' + self.ctlCount++ + ' '));

        self.div.querySelector('ul.' + self.CLASS + '-' + options.side).appendChild(li);

        var addedElement = li.appendChild(options.htmlElement);
        addedElement.setAttribute('class', addedElement.getAttribute('class') + ' tc-ctl');
        return addedElement;
    };
})();

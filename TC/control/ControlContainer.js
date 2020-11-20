TC.control = TC.control || {};

if (!TC.control.Container) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control/Container');
}

TC.control.ControlContainer = function () {
    var self = this;

    TC.control.Container.apply(self, arguments);

    var cs = self._classSelector = '.' + self.CLASS;

    // GLS: 20/01/2020 código compatibilidad hacia atrás
    if (!Array.isArray(self.controlOptions)) {
        console.log('Gestionamos config de controlContainer antiguo');

        var controlOptions = [];

        Object.keys(self.controlOptions).forEach((key) => {
            const ctl = self.controlOptions[key];
            var newCtl = {
                position: ctl.side
            };

            newCtl[key] = ctl.options;

            controlOptions.push(newCtl);
        });

        self.controlOptions = controlOptions;
    }
};

TC.inherit(TC.control.ControlContainer, TC.control.Container);

(function () {
    var ctlProto = TC.control.ControlContainer.prototype;

    ctlProto.CLASS = 'tc-ctl-cctr';
    ctlProto.POSITION = {
        LEFT: "left",
        RIGHT: "right"
    };

    // GLS: 20/01/2020 código compatibilidad hacia atrás
    ctlProto.SIDE = ctlProto.POSITION;

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-cctr.hbs";
    ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/tc-ctl-cctr-node.hbs";

    ctlProto.onRender = function () {
        const self = this;

        return new Promise(function (resolve, reject) {
            const bufferPromises = new Array(self.ctlCount);

            for (var i = 0, len = self.controlOptions.length; i < len; i++) {
                var ctl = self.controlOptions[i];

                var ctlName = Object.keys(ctl).filter((key) => {
                    return ["position", "index"].indexOf(key) < 0;
                })[0];
                bufferPromises[i] = self.map.addControl(ctlName, TC.Util.extend({
                    id: self.uids[i],
                    div: self.div.querySelector('.' + self.CLASS + '-elm-' + i).querySelector('div')
                }, ctl[ctlName]));
            }

            Promise.all(bufferPromises).then(function () {
                for (var i = 0, len = arguments.length; i < len; i++) {
                    var ctl = arguments[i];
                    ctl.containerControl = self;
                }
                resolve(self);
            });
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
        options.position = options.position || options.side || self.POSITION.LEFT;

        return new Promise(function (resolve, reject) {
            const idx = ++self.ctlCount;
            self.getRenderedHtml(self.CLASS + '-node', { index: idx }, function (html) {
                var template = document.createElement('template');
                template.innerHTML = html.trim();

                self.div.querySelector('ul.' + self.CLASS + '-' + options.position).appendChild(template.content ? template.content.firstChild : template.firstChild);
                self.map.addControl(control, TC.Util.extend({
                    id: self.getUID(),
                    div: self.div.querySelector('.' + self.CLASS + '-elm-' + idx).querySelector('div')
                }, options)).then(function (ctrl) {
                    resolve(ctrl);
                });
            });
        });
    };

    ctlProto.addElement = function (options) {
        const self = this;

        options.position = options.position || options.side || self.POSITION.LEFT;

        var li = document.createElement('li');
        li.setAttribute('class', (self.CLASS + '-elm ') + (self.CLASS + '-elm-' + self.ctlCount++ + ' '));

        self.div.querySelector('ul.' + self.CLASS + '-' + options.position).appendChild(li);

        var addedElement = li.appendChild(options.htmlElement);
        addedElement.setAttribute('class', addedElement.getAttribute('class') + ' tc-ctl');
        return addedElement;
    };
})();

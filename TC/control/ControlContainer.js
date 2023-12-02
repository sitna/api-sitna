import TC from '../../TC';
import Container from './Container';

TC.control = TC.control || {};

const ControlContainer = function () {
    var self = this;

    Container.apply(self, arguments);

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

TC.inherit(ControlContainer, Container);

(function () {
    var ctlProto = ControlContainer.prototype;

    ctlProto.CLASS = 'tc-ctl-cctr';
    ctlProto.POSITION = {
        LEFT: "left",
        RIGHT: "right"
    };

    // GLS: 20/01/2020 código compatibilidad hacia atrás
    ctlProto.SIDE = ctlProto.POSITION;

    ctlProto.onRender = async function () {
        const self = this;

        self.controlOptions.forEach(function addCtl(ctl, i) {
            const ctlName = Object.keys(ctl).find(key => ["position", "index"].indexOf(key) < 0);
            self._ctlPromises[i] = self.map.addControl(ctlName, TC.Util.extend({
                id: self.uids[i],
                div: self.div.querySelector('.' + self.CLASS + '-elm-' + i).querySelector('div')
            }, ctl[ctlName]));
        });

        await Promise.all(self._ctlPromises);
        for (var i = 0, len = arguments.length; i < len; i++) {
            var ctl = arguments[i];
            ctl.containerControl = self;
        }
        return self;
    };

    ctlProto.loadTemplates = async function () {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-cctr.mjs');
        const nodeTemplatePromise = import('../templates/tc-ctl-cctr-node.mjs');

        const template = {};
        template[ctlProto.CLASS] = (await mainTemplatePromise).default;
        template[ctlProto.CLASS + '-node'] = (await nodeTemplatePromise).default;
        self.template = template;
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(self.renderData({
            controls: Object.keys(self.controlOptions).map(function (key, i) {
                return TC.Util.extend(self.controlOptions[key], { index: i });
            })
        }, callback));
    };

    ctlProto.addControl = async function (control, options) {
        const self = this;
        options.position = options.position || options.side || self.POSITION.LEFT;

        const idx = ++self.ctlCount;
        await self.renderPromise();
        const html = await self.getRenderedHtml(self.CLASS + '-node', { index: idx });
        var template = document.createElement('template');
        template.innerHTML = html.trim();

        self.div.querySelector('ul.' + self.CLASS + '-' + options.position).appendChild(template.content ? template.content.firstChild : template.firstChild);
        const ctrl = await self.map.addControl(control, TC.Util.extend({
            id: self.getUID(),
            div: self.div.querySelector('.' + self.CLASS + '-elm-' + idx).querySelector('div')
        }, options));
        return ctrl;
    };

    ctlProto.addElement = function (options) {
        const self = this;

        options.position = options.position || options.side || self.POSITION.LEFT;

        var li = document.createElement('li');
        li.setAttribute('class', self.CLASS + '-elm ' + (self.CLASS + '-elm-' + self.ctlCount++ + ' '));

        self.div.querySelector('ul.' + self.CLASS + '-' + options.position).appendChild(li);

        var addedElement = li.appendChild(options.htmlElement);
        addedElement.setAttribute('class', addedElement.getAttribute('class') + ' tc-ctl');
        return addedElement;
    };
})();

TC.control.ControlContainer = ControlContainer;
export default ControlContainer;
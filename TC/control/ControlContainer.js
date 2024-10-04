import TC from '../../TC';
import Util from '../Util';
import Container from './Container';

TC.control = TC.control || {};

class ControlContainer extends Container {
    POSITION = {
        LEFT: "left",
        RIGHT: "right"
    };
    // GLS: 20/01/2020 código compatibilidad hacia atrás
    SIDE = this.POSITION;
    //constructor() {
        //super(...arguments);

        // GLS: 20/01/2020 código compatibilidad hacia atrás
        //if (!Array.isArray(self.controlOptions)) {
        //    console.log('Gestionamos config de controlContainer antiguo');

        //    var controlOptions = [];

        //    Object.keys(self.controlOptions).forEach((key) => {
        //        const ctl = self.controlOptions[key];
        //        var newCtl = {
        //            position: ctl.side
        //        };

        //        newCtl[key] = ctl.options;

        //        controlOptions.push(newCtl);
        //    });

        //    self.controlOptions = controlOptions;
        //}
    //}

    async onRender() {
        const self = this;

        self.controlOptions.forEach(function addCtl(ctl, i) {
            const ctlName = Object.keys(ctl).find(key => ["position", "index"].indexOf(key) < 0);
            self._ctlPromises[i] = self.map.addControl(ctlName, Util.extend({
                id: self.uids[i],
                div: self.div.querySelector('.' + self.CLASS + '-elm-' + i).querySelector('div')
            }, ctl[ctlName].options || ctl[ctlName]));
        });

        await Promise.all(self._ctlPromises);
        for (var i = 0, len = arguments.length; i < len; i++) {
            var ctl = arguments[i];
            ctl.containerControl = self;
        }
        return self;
    }

    mergeOptions(...options) {
        const previousOptions = options.map(opts => {
            if (!Array.isArray(opts.controls)) {
                const newOpts = { ...opts };
                for (var key in newOpts.controls) {
                    const newCtlOpts = { ...newOpts.controls[key] };
                    newCtlOpts.position = newCtlOpts.side;
                    delete newCtlOpts.side;
                    newOpts.controls[key] = newCtlOpts;
                }

                return newOpts;
            }
            return opts;
        });
        return super.mergeOptions(...previousOptions);
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-cctr.mjs');
        const nodeTemplatePromise = import('../templates/tc-ctl-cctr-node.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-node'] = (await nodeTemplatePromise).default;
        self.template = template;
    }

    render(callback) {
        const self = this;
        return self.renderData({
            controls: self.controlOptions.map(function (obj, i) {
                return Util.extend(obj, { index: i });
            })
        }, callback);
    }

    async addControl(control, options) {
        const self = this;
        options.position = options.position || options.side || self.POSITION.LEFT;

        const idx = ++self.ctlCount;
        await self.renderPromise();
        const html = await self.getRenderedHtml(self.CLASS + '-node', { index: idx });
        var template = document.createElement('template');
        template.innerHTML = html.trim();

        self.div.querySelector('ul.' + self.CLASS + '-' + options.position).appendChild(template.content ? template.content.firstChild : template.firstChild);
        const ctrl = await self.map.addControl(control, Util.extend({
            id: self.getUID(),
            div: self.div.querySelector('.' + self.CLASS + '-elm-' + idx).querySelector('div')
        }, options));
        return ctrl;
    }

    addElement(options) {
        const self = this;

        options.position = options.position || options.side || self.POSITION.LEFT;

        var li = document.createElement('li');
        li.setAttribute('class', self.CLASS + '-elm ' + (self.CLASS + '-elm-' + self.ctlCount++ + ' '));

        self.div.querySelector('ul.' + self.CLASS + '-' + options.position).appendChild(li);

        var addedElement = li.appendChild(options.htmlElement);
        addedElement.setAttribute('class', addedElement.getAttribute('class') + ' tc-ctl');
        return addedElement;
    }
}

ControlContainer.prototype.CLASS = 'tc-ctl-cctr';
TC.control.ControlContainer = ControlContainer;
export default ControlContainer;
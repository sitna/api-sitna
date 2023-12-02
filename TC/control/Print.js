import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Control from '../Control';

TC.control = TC.control || {};

Consts.classes.PRINTABLE = 'tc-printable';

const Print = function (options)
{
    const self = this;
    self.options = options || {};

    self.ready = false;

    self.title = self.options.title || TC.Util.getLocaleString(Cfg.locale, 'printPage');
    self.cssUrl = self.options.cssUrl || TC.apiLocation + 'css/print.css';

    if (self.options.target) {
        (self.options.printableElement || self.options.target).classList.add(Consts.classes.PRINTABLE);
        self.render();
    }
};

TC.inherit(Print, Control);

(function () {
    const ctlProto = Print.prototype;

    ctlProto.CLASS = 'tc-ctl-print';

    ctlProto.renderPrintPage = function () {
        const self = this;
        const page = open(null, self.CLASS);
        const content = (self.options.printableElement || self.options.target).innerHTML;
        self.getRenderedHtml(self.CLASS + '-page', { title: self.title, content: content, cssUrl: self.cssUrl })
            .then(function (out) {
                page.document.write(out);
                page.document.close();
                page.focus();
            })
            .catch(function (err) {
                TC.error(err);
            });
    };

    ctlProto.getRenderTarget = function () {
        const self = this;
        return self.options.target || self.div;
    };

    ctlProto.addUIEventListeners = function () {
        const self = this;
        if (self._mustAddListeners) {
            const target = self.getRenderTarget();
            if (target) {
                const btn = target.querySelector('.' + self.CLASS + '-btn');
                if (btn) {
                    btn.addEventListener('click', function (_e) {
                        self.renderPrintPage();
                    });
                    delete self._mustAddListeners;
                }
            }
        }
    };

    ctlProto.loadTemplates = async function () {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-print.mjs');
        const pageTemplatePromise = import('../templates/tc-ctl-print-page.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-page'] = (await pageTemplatePromise).default;
        self.template = template;
    };

    ctlProto.renderData = async function (data, callback) {
        const self = this;
        if (self.div) {
            await Control.prototype.renderData.call(self, data, callback);
            return;
        }
        const target = self.getRenderTarget();
        if (target) {
            const html = await self.getRenderedHtml(self.CLASS, null);
            if (!target.querySelector('.' + self.CLASS + '-btn')) {
                self._mustAddListeners = true;
                target.insertAdjacentHTML('beforeend', html);
            }
        }
        if (TC.Util.isFunction(callback)) {
            callback();
        }
    };

})();

TC.control.Print = Print;
export default Print;
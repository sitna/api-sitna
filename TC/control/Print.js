import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Control from '../Control';

TC.control = TC.control || {};
TC.Control = Control;

Consts.classes.PRINTABLE = 'tc-printable';

TC.control.Print = function (options)
{
    const self = this;
    self.options = options || {};

    self.ready = false;

    self.title = self.options.title || TC.Util.getLocaleString(Cfg.locale, 'printPage');
    self.cssUrl = self.options.cssUrl || TC.apiLocation + 'TC/css/print.css';

    if (self.options.target) {
        (self.options.printableElement || self.options.target).classList.add(Consts.classes.PRINTABLE);
        self.render();
    }
};

TC.inherit(TC.control.Print, TC.Control);

(function () {
    const ctlProto = TC.control.Print.prototype;

    ctlProto.CLASS = 'tc-ctl-print';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-print.hbs";
    ctlProto.template[ctlProto.CLASS + '-page'] = TC.apiLocation + "TC/templates/tc-ctl-print-page.hbs";

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

    ctlProto.renderData = async function (data, callback) {
        const self = this;
        if (self.div) {
            await TC.Control.prototype.renderData.call(self, data, callback);
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

const Print = TC.control.Print;
export default Print;
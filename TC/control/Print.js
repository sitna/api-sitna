import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Util from '../Util';
import Control from '../Control';

TC.control = TC.control || {};

Consts.classes.PRINTABLE = 'tc-printable';

class Print extends Control {
    #mustAddListeners;

    constructor() {
        super(...arguments);
        const self = this;
        delete self.div;

        self.ready = false;

        self.title = self.options.title || Util.getLocaleString(Cfg.locale, 'printPage');
        self.cssUrl = self.options.cssUrl || TC.apiLocation + 'css/print.css';

        if (self.options.target) {
            (self.options.printableElement || self.options.target).classList.add(Consts.classes.PRINTABLE);
            self.render();
        }
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-print.mjs');
        const pageTemplatePromise = import('../templates/tc-ctl-print-page.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-page'] = (await pageTemplatePromise).default;
        self.template = template;
    }

    renderData(data, callback) {
        const self = this;
        if (self.div) {
            return super.renderData.call(self, data, callback);
        }
        const renderPromise = new Promise(function (resolve, _reject) {
            const target = self.getRenderTarget();
            if (target) {
                self.getRenderedHtml(self.CLASS, null).then(function (html) {
                    if (!target.querySelector('.' + self.CLASS + '-btn')) {
                        self.#mustAddListeners = true;
                        target.insertAdjacentHTML('beforeend', html);
                    }
                    if (Util.isFunction(callback)) {
                        callback();
                    }
                    resolve();
                });
            }
            else {
                if (Util.isFunction(callback)) {
                    callback();
                }
                resolve();
            }
        });
        self._firstRender ??= renderPromise;
        return renderPromise;
    }

    renderPrintPage() {
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
    }

    getRenderTarget() {
        const self = this;
        return self.options.target || self.div;
    }

    addUIEventListeners() {
        const self = this;
        if (self.#mustAddListeners) {
            const target = self.getRenderTarget();
            if (target) {
                const btn = target.querySelector('.' + self.CLASS + '-btn');
                if (btn) {
                    btn.addEventListener('click', function (_e) {
                        self.renderPrintPage();
                    });
                    self.#mustAddListeners = false;
                }
            }
        }
        return self;
    }
}

Print.prototype.CLASS = 'tc-ctl-print';
TC.control.Print = Print;
export default Print;
TC.control = TC.control || {};

TC.Consts.classes.PRINTABLE = 'tc-printable';




TC.control.Print = function (options)
{
    var self = this;
    var opts = options || {};

    self.ready = false;

    self.title = opts.title || TC.Util.getLocaleString(TC.Cfg.locale, 'printPage');
    self.cssUrl = opts.cssUrl || TC.apiLocation + 'TC/css/print.css';

    if (opts.target)
    {
        const target = opts.target;

        if (!target.querySelector('.' + self.CLASS + '-btn')) {
            //for (var key in self.template) {
            //    if (!dust.cache[key]) {
            //        self.template[key]();
            //    }
            //}
            (opts.printableElement || target).classList.add(TC.Consts.classes.PRINTABLE);

            var renderPage = function (e) {
                var page = open(null, self.CLASS);
                var content = (opts.printableElement || target).innerHTML;
                TC.Control.prototype.getRenderedHtml.call(self, self.CLASS + '-page', { title: self.title, content: content, cssUrl: self.cssUrl })
                    .then(function (out) {
                        page.document.write(out);
                        page.document.close();
                        page.focus();
                    })
                    .catch(function (err) {
                        TC.error(err);
                    });
            };
            TC.Control.prototype.getRenderedHtml.call(self, self.CLASS, null).then(function (out) {
                target.insertAdjacentHTML('afterbegin', out);
                target.querySelector('.' + self.CLASS + '-btn').addEventListener('click', renderPage.bind(self));
            });
        }
    }
};

(function () {
    var ctlProto = TC.control.Print.prototype;

    ctlProto.CLASS = 'tc-ctl-print';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Print.html";
    ctlProto.template[ctlProto.CLASS + '-page'] = TC.apiLocation + "TC/templates/PrintPage.html";

})();
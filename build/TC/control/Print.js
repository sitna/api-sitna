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
        for (var key in self.template)
        {
            if (!dust.cache[key])
            {
                self.template[key]();
            }
        }
        var $target = $(opts.target);
        $target.addClass(TC.Consts.classes.PRINTABLE);

        var renderPage = function (e)
        {
            var page = open(null, self.CLASS);
            var content = $target.html();
            dust.render(self.CLASS + '-page', { title: self.title, content: content, cssUrl: self.cssUrl }, function (err, out)
            {
                page.document.write(out);
                page.document.close();
                page.focus();
                if (err)
                {
                    TC.error(err);
                }
            });
        };
        dust.render(self.CLASS, null, function (err, out)
        {
            $target.append(out);
            $target.find('.' + self.CLASS + '-btn').on('click', renderPage);
        });
    }
};

(function () {
    var ctlProto = TC.control.Print.prototype;

    ctlProto.CLASS = 'tc-ctl-print';

    ctlProto.template = {};

    //if (TC.isDebug) {
    //    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Print.html";
    //    ctlProto.template[ctlProto.CLASS + '-page'] = TC.apiLocation + "TC/templates/PrintPage.html";
    //}
    //else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<a class=\"tc-ctl-print-btn\" title=\"").h("i18n", ctx, {}, { "$key": "printThisWindow" }).w("\">").h("i18n", ctx, {}, { "$key": "print" }).w("</a>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-page'] = function () { dust.register(ctlProto.CLASS + '-page', body_0); function body_0(chk, ctx) { return chk.w("<!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\"><head><title>").f(ctx.get(["title"], false), ctx, "h").w("</title><link rel=\"stylesheet\" href=\"").f(ctx.get(["cssUrl"], false), ctx, "h").w("\" /></head><body onload=\"print()\" class=\"tc-ctl-print-page\"><h1>").f(ctx.get(["title"], false), ctx, "h").w("</h1>").f(ctx.get(["content"], false), ctx, "h", ["s"]).w("</body></html>"); } body_0.__dustBody = !0; return body_0 };
    //}

})();

var expect = chai.expect;

// only critical error messages
$.mockjaxSettings.logging = 0;

describe('Tests de TC.control.ExternalWMS', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    describe('render', function () {
        it("debe establecer la propiedad _firstRender", function () {
            var ctl = new TC.control.ExternalWMS({ div: 'ctl-container' });
            ctl.render();
            expect(ctl._firstRender).to.be.an.instanceof(Promise);
        });
    });
});
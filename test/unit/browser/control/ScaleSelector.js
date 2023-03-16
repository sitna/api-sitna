describe('Tests de TC.control.ScaleSelector', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    describe('render', function () {
        it("debe establecer la propiedad _firstRender", async function () {
            var ctl = await TC.Control.create('ScaleSelector', { div: addControlDiv() });
            ctl.render().catch(() => {});
            expect(ctl._firstRender).to.be.an.instanceof(Promise);
        });
    });
});
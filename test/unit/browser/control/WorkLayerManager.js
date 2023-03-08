describe('Tests de TC.control.WorkLayerManager', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    describe('render', function () {
        it("debe establecer la propiedad _firstRender", async function () {
            var ctl = await TC.Control.create('WorkLayerManager', { div: 'ctl-container' });
            ctl.render().catch(() => { });
            expect(ctl._firstRender).to.be.an.instanceof(Promise);
        });
    });
});
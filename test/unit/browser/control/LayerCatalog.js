
describe('Tests de TC.control.LayerCatalog', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    describe('render', function () {
        it("debe establecer la propiedad _firstRender", async function () {
            var ctl = await TC.Control.create('LayerCatalog', { div: addControlDiv() });
            ctl.render();
            expect(ctl._firstRender).to.be.an.instanceof(Promise);
        });
    });
});
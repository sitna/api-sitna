
describe('Tests de TC.control.BasemapSelector', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    // No se puede llamar a render sin un mapa

    //describe('render', function () {
    //    it("debe establecer la propiedad _firstRender", async function () {
    //        var ctl = await TC.Control.create('BasemapSelector', { div: addControlDiv() });
    //        await ctl.render();
    //        expect(ctl._firstRender).to.be.an.instanceof(Promise);
    //    });
    //});
});
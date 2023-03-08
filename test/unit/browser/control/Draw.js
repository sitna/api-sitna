
describe('Tests de TC.control.Draw', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    // No se puede llamar a render sin mapa en este control

    //describe('render', function () {
    //    it("debe establecer la propiedad _firstRender", async function () {
    //        var ctl = await TC.Control.create('Draw', { div: 'ctl-container' });
    //        ctl.render();
    //        expect(ctl._firstRender).to.be.an.instanceof(Promise);
    //    });
    //});
});
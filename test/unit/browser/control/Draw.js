
describe('Tests de TC.control.Draw', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    describe('render', function () {
        it("debe establecer la propiedad _firstRender", async function () {
            const ctl = await TC.Control.create('Draw', { div: addControlDiv() });
            ctl.render();
            expect(ctl._firstRender).to.be.an.instanceof(Promise);
        });
    });

    describe('mode', function () {
        it("debe devolver por defecto POLYLINE", async function () {
            const ctl = await TC.Control.create('Draw', { div: addControlDiv() });
            expect(ctl.mode).to.equal(SITNA.Consts.geom.POLYLINE);
        });
    });
});
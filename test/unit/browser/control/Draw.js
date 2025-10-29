
describe('Tests de TC.control.Draw', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    describe('render', function () {
        it("debe resolver renderPromise", async function () {
            const ctl = await TC.Control.create('Draw', { div: addControlDiv() });
            await ctl.render();
            expect(ctl.renderPromise()).to.resolve;
        });
    });

    describe('mode', function () {
        it("debe devolver por defecto POLYLINE", async function () {
            const ctl = await TC.Control.create('Draw', { div: addControlDiv() });
            expect(ctl.mode).to.equal(SITNA.Consts.geom.POLYLINE);
        });
    });
});
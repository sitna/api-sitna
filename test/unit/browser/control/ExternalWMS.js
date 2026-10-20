
describe('Tests de TC.control.ExternalWMS', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    describe('render', function () {
        it("ddebe resolver renderPromise", async function () {
            var ctl = await TC.Control.create('ExternalWMS', { div: addControlDiv() });
            await ctl.render();
            expect(ctl.renderPromise()).to.resolve;
        });
    });
});
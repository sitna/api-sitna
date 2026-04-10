
describe('Tests de TC.control.FullScreen', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    describe('render', function () {
        it("debe resolver renderPromise", async function () {
            var ctl = await TC.Control.create('FullScreen', { div: addControlDiv() });
            await ctl.render();
            expect(ctl.renderPromise()).to.resolve;
        });
    });
});
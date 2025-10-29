
describe('Tests de TC.control.FileImport', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    describe('render', function () {
        it("debe resolver renderPromise", async function () {
            const ctl = document.createElement('sitna-file-import');
            await ctl.render();
            expect(ctl.renderPromise()).to.resolve;
        });
    });
});
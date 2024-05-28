
describe('Tests de TC.control.FileImport', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    describe('render', function () {
        it("debe establecer la propiedad _firstRender", async function () {
            const ctl = document.createElement('sitna-file-import');
            await ctl.render();
            expect(ctl._firstRender).to.be.an.instanceof(Promise);
        });
    });
});
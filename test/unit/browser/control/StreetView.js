﻿describe('Tests de TC.control.StreetView', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    // No se puede llamara a render sin un mapa

    //describe('render', function () {
    //    it("debe establecer la propiedad _firstRender", async function () {
    //        var ctl = await TC.Control.create('StreetView', { div: addControlDiv() });
    //        await ctl.render();
    //        expect(ctl._firstRender).to.be.an.instanceof(Promise);
    //    });
    //});
});
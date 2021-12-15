// Hackeos para hacer el mock
window.addEventListener('unload', function () {
    caches.delete('TC.offline.edit.IDENA:PATRIM_Pol_Merindades@https://idena.navarra.es/ogc/wfs');
});

TC.control.WFSEdit.prototype.SW_URL = 'cfg.WFSEditOptions.mock-sw.js';
TC.layer.Vector.prototype.refresh = function () { };

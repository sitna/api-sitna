// Hackeos para hacer el mock
window.addEventListener('unload', function () {
    caches.delete('TC.offline.edit.IDENA:PATRIM_Pol_Merindades@https://idena.navarra.es/ogc/wfs');
});

(function () {
    TC.control.WFSEdit.prototype.SW_URL = 'cfg.WFSEditOptions.mock-sw.js';

    const oldApplyEdits = TC.layer.Vector.prototype.applyEdits;
    let applyingEdits = false;

    TC.layer.Vector.prototype.applyEdits = function (inserts, updates, deletes) {
        applyingEdits = true;
        return oldApplyEdits.call(this, inserts, updates, deletes);
    };

    const oldRefresh = TC.layer.Vector.prototype.refresh;
    TC.layer.Vector.prototype.refresh = function () {
        if (!applyingEdits) {
            return oldRefresh.call(this);
        }
        applyingEdits = false;
        return Promise.resolve();
    };
})();

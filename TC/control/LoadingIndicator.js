import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';

TC.control = TC.control || {};
TC.Control = Control;

TC.control.LoadingIndicator = function () {
    const self = this;

    TC.Control.apply(self, arguments);

    self._waits = {};

    window.addEventListener('error', function () {
        self.reset();
        // Tell browser to run its own error handler as well
        return false;
    }, false);
};

TC.inherit(TC.control.LoadingIndicator, TC.Control);

(function () {
    var ctlProto = TC.control.LoadingIndicator.prototype;

    ctlProto.CLASS = 'tc-ctl-load';

    //var ctlProto.waits = {};
    
    ctlProto.startWait = function (e) {
        const self = this;
        const layerId = e.layer.id;
        if (self._waits[layerId] === undefined) {
            self._waits[layerId] = 0;
        }
        self._waits[layerId] = self._waits[layerId] + 1;
        self.show();

        self.map.trigger(Consts.event.STARTLOADING);
    };

    ctlProto.stopWait = function (e) {
        const self = this;
        const layerId = e.layer.id;
        var wait = self._waits[layerId];
        if (wait > 0) {
            wait = self._waits[layerId] = wait - 1;
        }
        if (!wait) {
            delete self._waits[layerId];
        }
        const count = Object.keys(self._waits).length;
        if (!count) {
            self.hide();
            self.map.trigger(Consts.event.STOPLOADING);
        }
    };

    ctlProto.endWait = function (e) {
        const self = this;
        const layerId = e.layer.id;
        var wait = self._waits[layerId];
        if (wait > 0) {
            delete self._waits[layerId];
        }
        const count = Object.keys(self._waits).length;
        if (!count) {
            self.hide();
            self.map.trigger(Consts.event.STOPLOADING);
        }
    };

    ctlProto.reset = function (_e) {
        var self = this;
        self._waits = {};
        self.hide();
        self.map && self.map.trigger(Consts.event.STOPLOADING);
    };

    ctlProto.loadTemplates = async function () {
        const self = this;
        const module = await import('../templates/tc-ctl-load.mjs');
        self.template = module.default;
    };

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);
        map
            .on(Consts.event.BEFORELAYERADD + ' ' +
                Consts.event.BEFORELAYERUPDATE + ' ' +
                Consts.event.BEFOREFEATURESADD, function (e) {
                    self.startWait(e);
                })
            .on(Consts.event.LAYERADD + ' ' +
                Consts.event.LAYERERROR + ' ' +
                Consts.event.LAYERUPDATE + ' ' +
                Consts.event.FEATURESADD, function (e) {
                    self.stopWait(e);
                })
            .on(Consts.event.BEFOREFEATUREINFO, function () {
                self.addWait(Consts.event.FEATUREINFO);
            })
            .on(Consts.event.FEATUREINFO + ' ' +
                Consts.event.NOFEATUREINFO + ' ' +
                Consts.event.FEATUREINFOERROR, function () {
                    self.removeWait(Consts.event.FEATUREINFO);
                })
            .on(Consts.event.LAYERREMOVE, function (e) {
                self.endWait(e);
            });
        if (!TC.isDebug) {
            //Para evitar que se quede el indicador indefinidamente activo cuando hay un error en la página
            window.addEventListener('error', function (_msg, _url, _line, _col, _error) {
                self.reset();
                return false;
            });

            //$(document).ajaxError(function (event, request, settings) {
            //    self.reset();
            //});
        }

        return result;
    };

    ctlProto.addWait = function (uid) {
        const self = this;
        const result = uid || TC.getUID();
        self.startWait({ layer: { id: result } });
        return result;
    };

    ctlProto.removeWait = function (uid) {
        this.stopWait({ layer: { id: uid } });
    };

})();

const LoadingIndicator = TC.control.LoadingIndicator;
export default LoadingIndicator;
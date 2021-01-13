TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

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

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-load.hbs";

    //var ctlProto.waits = {};
    
    ctlProto.startWait = function (e) {
        const self = this;
        const layerId = e.layer.id;
        if (self._waits[layerId] === undefined) {
            self._waits[layerId] = 0;
        }
        self._waits[layerId] = self._waits[layerId] + 1;
        self.show();

        self.map.trigger(TC.Consts.event.STARTLOADING);
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
        var count = 0;
        for (var key in self._waits) {
            count++;
        }
        if (!count) {
            self.hide();
            self.map.trigger(TC.Consts.event.STOPLOADING);
        }
    };

    ctlProto.endWait = function (e) {
        const self = this;
        const layerId = e.layer.id;
        var wait = self._waits[layerId];
        if (wait > 0) {
            delete self._waits[layerId];
        }
        var count = 0;
        for (var key in self._waits) {
            count++;
        }
        if (!count) {
            self.hide();
            self.map.trigger(TC.Consts.event.STOPLOADING);
        }
    };

    ctlProto.reset = function (e) {
        var self = this;
        self._waits = {};
        self.hide();
        self.map.trigger(TC.Consts.event.STOPLOADING);
    };

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);
        map
            .on(TC.Consts.event.BEFORELAYERADD + ' ' +
                TC.Consts.event.BEFORELAYERUPDATE + ' ' +
                TC.Consts.event.BEFOREFEATURESADD, function (e) {
                    self.startWait(e);
                })
            .on(TC.Consts.event.LAYERADD + ' ' +
                TC.Consts.event.LAYERERROR + ' ' +
                TC.Consts.event.LAYERUPDATE + ' ' +
                TC.Consts.event.FEATURESADD, function (e) {
                    self.stopWait(e);
                })
            .on(TC.Consts.event.BEFOREFEATUREINFO, function () {
                self.addWait(TC.Consts.event.FEATUREINFO);
            })
            .on(TC.Consts.event.FEATUREINFO + ' ' +
                TC.Consts.event.NOFEATUREINFO + ' ' +
                TC.Consts.event.FEATUREINFOERROR, function () {
                    self.removeWait(TC.Consts.event.FEATUREINFO);
                })
            .on(TC.Consts.event.LAYERREMOVE, function (e) {
                self.endWait(e);
            });
        if (!TC.isDebug) {
            //Para evitar que se quede el indicador indefinidamente activo cuando hay un error en la página
            window.addEventListener('error', function (msg, url, line, col, error) {
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

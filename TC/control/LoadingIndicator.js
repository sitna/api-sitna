import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';

TC.control = TC.control || {};

class LoadingIndicator extends Control {
    #waits = {};

    constructor() {
        super(...arguments);
        const self = this;
        self.div.classList.add(self.CLASS);

        window.addEventListener('error', function () {
            self.reset();
            // Tell browser to run its own error handler as well
            return false;
        }, false);
    }

    getClassName() {
        return 'tc-ctl-load';
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-load.mjs');
        self.template = module.default;
    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);
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
        }

        return self;
    }

    startWait(e) {
        const self = this;
        const layerId = e.layer.id;
        if (self.#waits[layerId] === undefined) {
            self.#waits[layerId] = 0;
        }
        self.#waits[layerId] = self.#waits[layerId] + 1;
        self.show();

        self.map.trigger(Consts.event.STARTLOADING);
    }

    stopWait(e) {
        const self = this;
        const layerId = e.layer.id;
        var wait = self.#waits[layerId];
        if (wait > 0) {
            wait = self.#waits[layerId] = wait - 1;
        }
        if (!wait) {
            delete self.#waits[layerId];
        }
        const count = Object.keys(self.#waits).length;
        if (!count) {
            self.hide();
            self.map.trigger(Consts.event.STOPLOADING);
        }
    }

    endWait(e) {
        const self = this;
        const layerId = e.layer.id;
        var wait = self.#waits[layerId];
        if (wait > 0) {
            delete self.#waits[layerId];
        }
        const count = Object.keys(self.#waits).length;
        if (!count) {
            self.hide();
            self.map.trigger(Consts.event.STOPLOADING);
        }
    }

    reset(_e) {
        const self = this;
        self.#waits = {};
        self.hide();
        self.map && self.map.trigger(Consts.event.STOPLOADING);
    }

    addWait(uid) {
        const self = this;
        const result = uid || TC.getUID();
        self.startWait({ layer: { id: result } });
        return result;
    }

    removeWait(uid) {
        this.stopWait({ layer: { id: uid } });
    }
}

TC.control.LoadingIndicator = LoadingIndicator;
export default LoadingIndicator;
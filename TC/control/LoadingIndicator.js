import TC from '../../TC.js';
import Consts from '../Consts.js';
import Control from '../Control.js';

TC.control = TC.control || {};

class LoadingIndicator extends Control {
    #waits = {};
    #isDebug = false;

    constructor() {
        super(...arguments);
        const self = this;

        window.addEventListener('error', function () {
            self.reset();
            // Tell browser to run its own error handler as well
            return false;
        }, false);
    }

    async loadTemplates() {
        const self = this;
        const module = await import(
            /* webpackChunkName: "tc-ctl-load" */
            /* webpackMode: "lazy" */
            '../templates/tc-ctl-load.mjs'
        );
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
        if (this.#isDebug) {
            console.warn('Starting wait for ' + e.layer.id);
            console.trace();
        }
        const layerId = e.layer.id;
        if (this.#waits[layerId] === undefined) {
            this.#waits[layerId] = 0;
        }
        this.#waits[layerId] = this.#waits[layerId] + 1;
        this.show();

        this.map.trigger(Consts.event.STARTLOADING);
    }

    stopWait(e) {
        if (this.#isDebug) {
            console.warn('Stopping wait for ' + e.layer.id);
            console.trace();
        }
        const layerId = e.layer.id;
        var wait = this.#waits[layerId];
        if (wait > 0) {
            wait = this.#waits[layerId] = wait - 1;
        }
        if (!wait) {
            delete this.#waits[layerId];
        }
        const count = Object.keys(this.#waits).length;
        if (!count) {
            this.hide();
            this.map.trigger(Consts.event.STOPLOADING);
        }
    }

    endWait(e) {
        if (this.#isDebug) {
            console.warn('Ending wait for ' + e.layer.id);
            console.trace();
        }
        const layerId = e.layer.id;
        var wait = this.#waits[layerId];
        if (wait > 0) {
            delete this.#waits[layerId];
        }
        const count = Object.keys(this.#waits).length;
        if (!count) {
            this.hide();
            this.map.trigger(Consts.event.STOPLOADING);
        }
    }

    reset(_e) {
        const self = this;
        self.#waits = {};
        self.hide();
        self.map && self.map.trigger(Consts.event.STOPLOADING);
    }

    addWait(uid) {
        if (this.#isDebug) console.warn('Adding wait for ' + uid);
        const result = uid || TC.getUID();
        this.startWait({ layer: { id: result } });
        return result;
    }

    removeWait(uid) {
        if (this.#isDebug) console.warn('Removing wait for ' + uid);
        this.stopWait({ layer: { id: uid } });
    }

    setDebug(condition) {
        this.#isDebug = condition;
        console.warn('Debug mode ' + (condition ? 'enabled' : 'disabled') + ' for LoadingIndicator');
    }
}

LoadingIndicator.prototype.CLASS = 'tc-ctl-load';
TC.control.LoadingIndicator = LoadingIndicator;
export default LoadingIndicator;
import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';

TC.control = TC.control || {};

const addMessageEventListener = function (resolve, reject, cacheName, action, eventName) {
    var MESSAGE = 'message';
    var messageHandler = function messageHandler(event) {
        if (event.data.name === cacheName) {
            if (event.data.action === action && event.data.event === eventName) {
                resolve(cacheName);
            }
            else if (event.data.event === 'error') {
                reject(Error(`Error message from service worker [${event.data.url} - ${event.data.action} - ${event.data.name}]`));
            }
            if (event.data.event !== 'progress') {
                navigator.serviceWorker.removeEventListener(MESSAGE, messageHandler);
            }
        }
    };
    navigator.serviceWorker.addEventListener(MESSAGE, messageHandler);
};

class SWCacheClient extends Control {
    SW_URL = 'tc-cb-service-worker.js';
    #swPromise;

    constructor() {
        super(...arguments);
        const self = this;

        self.serviceWorkerEnabled = false;
        self.serviceWorkerIsRequired = self.options.serviceWorkerIsRequired || true;
    }

    register(map) {
        const self = this;

        const result = super.register.call(self, map);

        // Si el navegador es compatible, añadimos el service worker.
        self.#swPromise = new Promise(function (resolve, reject) {
            if (navigator.serviceWorker) {

                navigator.serviceWorker.register(self.SW_URL, {
                    updateViaCache: 'none'
                }).then(
                    function (reg) {
                        self.serviceWorkerEnabled = true;
                        if (reg.installing) {
                            resolve(reg.installing);
                        } else if (reg.waiting) {
                            resolve(reg.waiting);
                        } else if (reg.active) {
                            resolve(reg.active);
                        }
                        console.log(reg.scope, 'register');
                    },
                    function (reason) {
                        self.serviceWorkerEnabled = false;
                        reject(new Error(reason));
                        console.error('Could not register service worker: ' + reason);
                    });
            }
            else {
                reject(new Error("Browser does not support service workers"));
            }
        });

        self.#swPromise.catch(() => {
            let unsafeProtocol = false;
            const isFrame = window.parent !== window;
            for (var scope = window; !unsafeProtocol; scope = scope.parent) {
                try {
                    if (scope.location.protocol !== 'https:') {
                        unsafeProtocol = true;
                    }
                }
                catch (e) {
                }
                if (scope === scope.parent) {
                    break;
                }
            }
            if (unsafeProtocol) {
                map.toast(self.getLocaleString('httpsRequired.warning', { url: location.href.replace(location.protocol, '') }), { type: Consts.msgType.WARNING });
            }
            else if (isFrame) {
                map.toast(self.getLocaleString('frameOrNotCompatible.warning'), { type: Consts.msgType.WARNING });
            }
            else {
                if (self.serviceWorkerIsRequired) {
                    map.toast(self.getLocaleString('browserNotCompatible.warning'), { type: Consts.msgType.WARNING });
                }
            }
        });
        return result;
    }

    getServiceWorker() {
        const self = this;
        if (!self.#swPromise) {
            return Promise.reject(new Error('No service worker available'));
        }
        return self.#swPromise;
    }

    createCache(name, options = {}) {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.getServiceWorker().then(function (sw) {
                var ACTION = 'create';
                addMessageEventListener(resolve, reject, name, ACTION, 'cached');
                sw.postMessage({
                    action: ACTION,
                    name: name,
                    requestId: options.requestId,
                    list: options.urlList || [],
                    silent: options.silent
                });
            }, function () {
                resolve(false);
            });
        });
    }

    deleteCache(name, options = {}) {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.getServiceWorker().then(function (sw) {
                var ACTION = 'delete';
                addMessageEventListener(resolve, reject, name, ACTION, 'deleted');
                sw.postMessage({
                    action: ACTION,
                    requestId: options.requestId,
                    name: name,
                    silent: options.silent
                });
            }, function () {
                resolve(false);
            });
        });
    }
}

SWCacheClient.prototype.CLASS = 'tc-ctl-swcc';
TC.control.SWCacheClient = SWCacheClient;
export default SWCacheClient;
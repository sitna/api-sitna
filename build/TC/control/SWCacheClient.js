TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

(function () {

    TC.control.SWCacheClient = function () {
        const self = this;
        TC.Control.apply(this, arguments);
        self.serviceWorkerEnabled = false;
    };

    TC.inherit(TC.control.SWCacheClient, TC.Control);

    var ctlProto = TC.control.SWCacheClient.prototype;

    ctlProto.CLASS = 'tc-ctl-swcc';

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.Control.prototype.register.call(self, map);

        // Si el navegador es compatible, añadimos el service worker.
        self._swPromise = new Promise(function (resolve, reject) {
            if (navigator.serviceWorker) {

                navigator.serviceWorker.register('tc-cb-service-worker.js', {
                    scope: './'
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
                        reject();
                        console.error('Could not register service worker: ' + reason);
                    });
            }
            else {                
                reject(new Error("Browser does not support service workers"));
            }
        });

        return result;
    };

    ctlProto.getServiceWorker = function () {
        if (!this._swPromise) {
            return Promise.reject(new Error('No service worker available'));
        }
        return this._swPromise;
    };

    var addMessageEventListener = function (resolve, reject, cacheName, action, eventName) {
        var MESSAGE = 'message';
        var messageHandler = function messageHandler(event) {
            if (event.data.name === cacheName) {
                if (event.data.action === action && event.data.event === eventName) {
                    resolve(cacheName);
                }
                else if (event.data.event === 'error') {
                    reject();
                }
                navigator.serviceWorker.removeEventListener(MESSAGE, messageHandler);
            }
        };
        navigator.serviceWorker.addEventListener(MESSAGE, messageHandler);
    };

    ctlProto.createCache = function (name, options) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.getServiceWorker().then(function (sw) {
                var ACTION = 'create';
                var opts = options || {};
                addMessageEventListener(resolve, reject, name, ACTION, 'cached');
                sw.postMessage({
                    action: ACTION,
                    name: name,
                    list: opts.urlList || [],
                    silent: opts.silent
                });
            }, function () {
                resolve(false);
            });
        });
    };

    ctlProto.deleteCache = function (name, options) {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.getServiceWorker().then(function (sw) {
                var ACTION = 'delete';
                var opts = options || {};
                addMessageEventListener(resolve, reject, name, ACTION, 'deleted');
                sw.postMessage({
                    action: ACTION,
                    name: name,
                    silent: opts.silent
                });
            }, function () {
                resolve(false);
            });
        });
    };

})();

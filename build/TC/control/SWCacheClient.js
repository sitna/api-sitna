TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

(function () {

    TC.control.SWCacheClient = function () {
        var self = this;
        self.serviceWorkerEnabled = false;
        self._serviceWorkerDeferred = $.Deferred();

    };

    TC.inherit(TC.control.SWCacheClient, TC.Control);

    var ctlProto = TC.control.SWCacheClient.prototype;

    ctlProto.CLASS = 'tc-ctl-swcc';

    ctlProto.register = function (map) {
        var self = this;

        TC.Control.prototype.register.call(self, map);

        // Si el navegador es compatible, añadimos el service worker.
        if (navigator.serviceWorker) {

            navigator.serviceWorker.register('tc-cb-service-worker.js', {
                scope: './'
            }).then(
                function (reg) {
                    self.serviceWorkerEnabled = true;
                    if (reg.installing) {
                        self._serviceWorkerDeferred.resolve(reg.installing);
                    } else if (reg.waiting) {
                        self._serviceWorkerDeferred.resolve(reg.waiting);
                    } else if (reg.active) {
                        self._serviceWorkerDeferred.resolve(reg.active);
                    }
                    console.log(reg.scope, 'register');
                },
                function (reason) {
                    self.serviceWorkerEnabled = false;
                    self._serviceWorkerDeferred.reject();
                    console.error('Could not register service worker: ' + reason);
                }
            );
        }
        else {
            self._serviceWorkerDeferred.reject();
        }
    };

    ctlProto.getServiceWorker = function () {
        return this._serviceWorkerDeferred.promise();
    };

    var addMessageEventListener = function (deferred, cacheName, action, eventName) {
        var MESSAGE = 'message';
        var messageHandler = function messageHandler(event) {
            if (event.data.name === cacheName) {
                if (event.data.action === action && event.data.event === eventName) {
                    deferred.resolve(cacheName);
                }
                else if (event.data.event === 'error') {
                    deferred.reject();
                }
                navigator.serviceWorker.removeEventListener(MESSAGE, messageHandler);
            }
        };
        navigator.serviceWorker.addEventListener(MESSAGE, messageHandler);
    };

    ctlProto.createCache = function (name, options) {
        var self = this;
        var deferred = $.Deferred();
        self.getServiceWorker().then(function (sw) {
            var ACTION = 'create';
            var opts = options || {};
            addMessageEventListener(deferred, name, ACTION, 'cached');
            sw.postMessage({
                action: ACTION,
                name: name,
                list: opts.urlList || [],
                silent: opts.silent
            });
        }, function () {
            deferred.resolve(false);
        });
        return deferred.promise();
    };

    ctlProto.deleteCache = function (name, options) {
        var self = this;
        var deferred = $.Deferred();
        self.getServiceWorker().then(function (sw) {
            var ACTION = 'delete';
            var opts = options || {};
            addMessageEventListener(deferred, name, ACTION, 'deleted');
            sw.postMessage({
                action: ACTION,
                name: name,
                silent: opts.silent
            });
        }, function () {
            deferred.resolve(false);
        });
        return deferred.promise();
    };

})();

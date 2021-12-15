(function () {

    // Arreglo del bug de actualización de la cache
    self.addEventListener('install', function (event) {
        const cacheName = 'TC.offline.map.common';
        event.waitUntil(
            caches.has(cacheName).then(function (hasCache) {
                if (hasCache) {
                    caches.open(cacheName).then(function (cache) {
                        cache.keys().then(function (keys) {
                            console.log("Revisando cache...");
                            if (keys.length) {
                                return fetch(keys[0]).then(function () {
                                    // Estamos online, borramos cache
                                    caches.delete(cacheName).then(function () {
                                        console.log("Cache con bug (" + cacheName + ") borrada");
                                    });
                                }, function (e) {
                                    console.log(e);
                                });
                            }
                            return self.skipWaiting();
                        });
                    });
                }
            })
        );
    });

    //self.addEventListener('install', function (event) {
    // No hacemos nada en la instalaci\u00f3n del service worker
    //    event.waitUntil(self.skipWaiting());
    //});

    self.addEventListener('activate', function (event) {
        // Reclamamos el control inmediatamente, para evitar tener que recargar la página
        event.waitUntil(self.clients.claim());
    });

    self.addEventListener('fetch', function (event) {
        // Si está la petición en la cache se responde de ella, si no, se pide a la red
        event.respondWith(
            caches.match(event.request)
                .then(function (response) {
                    if (response) {
                        return response;
                    }

                    return fetch(event.request).catch(function (reason) {
                        console.log('[fetch] Could not fetch ' + event.request.url + ': ' + reason);
                    });
                })
        );
    });

    // Diccionario de estados de cacheo de mapas. Necesario para poder cancelar cacheos.
    const currentMapStates = {};

    const postMessage = function (msg) {
        self.clients.matchAll({ includeUncontrolled: true })
            .then(function (clientList) {
                clientList.forEach(function (client) {
                    client.postMessage(msg);
                });
            });
    };

    self.addEventListener('message', function (event) {
        // Procesamos las solicitudes de cacheo y borrado

        const action = event.data.action;
        const name = event.data.name;
        const silent = event.data.silent;
        const urlList = event.data.list;
        switch (action) {
            case 'create':
                currentMapStates[name] = action;
                caches.delete(name).finally(function () {
                    caches.open(name)
                        .then(function (cache) {
                            const addToCache = function (idx) {
                                if (!currentMapStates[name]) { // Se ha cancelado la creación de la cache
                                    return;
                                }
                                if (idx === urlList.length) {
                                    if (!silent) {
                                        postMessage({
                                            action: action,
                                            name: name,
                                            event: 'cached'
                                        });
                                    }
                                    return;
                                }
                                const count = idx + 1;
                                const url = urlList[idx];
                                cache.add(url)
                                    .then(
                                        function () {
                                            if (!silent) {
                                                postMessage({
                                                    action: action,
                                                    name: name,
                                                    event: 'progress',
                                                    count: count,
                                                    total: urlList.length
                                                });
                                            }
                                        },
                                        function () {
                                            postMessage({
                                                action: action,
                                                name: name,
                                                event: 'error',
                                                url: url
                                            });
                                        }
                                    )
                                    .finally(function () {
                                        addToCache(count);
                                    });
                            };
                            addToCache(0);
                        });
                });
                break;
            case 'delete':
                delete currentMapStates[name];
                caches.delete(name).then(
                    function () {
                        if (!silent) {
                            postMessage({
                                action: action,
                                name: name,
                                event: 'deleted'
                            });
                        }
                    },
                    function () {
                        postMessage({
                            action: action,
                            name: name,
                            event: 'error'
                        });
                    }
                );
            default:
                break;
        }
    });

    self.addEventListener('notificationclick', function (event) {
        var notification = event.notification;
        var action = event.action;
        if (action === "back") {
            notification.close();
            var promise = Promise.resolve();
            promise =
                promise.then(function () { return firstWindowClient(notification.data.url); })
                    .then(function (client) { return client ? client.focus() : null; });
            event.waitUntil(promise);
        }
    });
    function firstWindowClient(url) {
        return self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (windowClients) {
            return windowClients.length ? windowClients.find(function (wc) {
                return wc.url === url;
            }) : null;
        });
    }

})();
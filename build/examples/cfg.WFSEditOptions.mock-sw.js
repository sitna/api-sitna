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
                .then(async function (response) {
                    if (response) {
                        return response;
                    }
                    const text = await event.request.text();
                    if (text.startsWith('<Transaction')) {
                        const insertMatch = text.match(/\<Insert>/g);
                        const insertNum = insertMatch ? insertMatch.length : 0;
                        const deleteMatch = text.match(/\<Delete\s/g);
                        const deleteNum = deleteMatch ? deleteMatch.length : 0;
                        const updateMatch = text.match(/\<Update\s/g);
                        const updateNum = updateMatch ? updateMatch.length : 0;

                        const responseInit = {
                            // status/statusText default to 200/OK, but we're explicitly setting them here.
                            status: 200,
                            statusText: 'OK',
                            headers: {
                                'Content-Type': 'application/xml; charset=UTF-8',
                                // Purely optional, but we return a custom response header indicating that this is a
                                // mock response. The controlled page could check for this header if it wanted to.
                                'X-Mock-Response': 'yes'
                            }
                        };

                        return new Response(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<wfs:TransactionResponse xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:ows="http://www.opengis.net/ows" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1.0" xsi:schemaLocation="http://www.opengis.net/wfs http://pmpwvinet11.tcsa.local:8080/geoserver/schemas/wfs/1.1.0/wfs.xsd">
    <wfs:TransactionSummary>
        <wfs:totalInserted>${insertNum}</wfs:totalInserted>
        <wfs:totalUpdated>${updateNum}</wfs:totalUpdated>
        <wfs:totalReplaced>0</wfs:totalReplaced>
        <wfs:totalDeleted>${deleteNum}</wfs:totalDeleted>
    </wfs:TransactionSummary>
    <wfs:TransactionResults/>
    <wfs:InsertResults>
		<wfs:Feature>
			<ogc:FeatureId fid="none" />
		</wfs:Feature>
	</wfs:InsertResults>
</wfs:TransactionResponse>`, responseInit);
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
                // mock delete
                delete currentMapStates[name];
                postMessage({
                    action: action,
                    name: name,
                    event: 'deleted'
                });
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
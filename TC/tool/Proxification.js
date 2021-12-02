var TC = TC || {};

TC.tool = TC.tool || {};

TC.tool.Proxification = function (proxy, options) {
    var self = this;

    self.Consts = {
        url: {
            SPLIT_REGEX: /([^:]*:)?\/\/([^:]*:?[^@]*@)?([^:\/\?]*):?([^\/\?]*)/
        }
    };

    if (proxy === undefined) {
        throw new TypeError('"proxy" parameter is undefined', "TC.tool.Proxification.js");
    }

    if (typeof proxy == "function") {
        self.proxy = proxy;
    } else {
        self.proxy = function (url) {
            var result = proxy;
            if (url.substr(0, 4) != "http") {
                result += window.location.protocol;
            }
            result += encodeURIComponent(url);
            return result;
        };
    }

    options = options || {};

    self._location = options.location || window.location;

    self.preventMixedContent = options.allowedMixedContent !== undefined ? !options.allowedMixedContent : true;
};

(function () {
    if (!window.fetch) {
        (function (self) {
            // polyfill https://github.com/github/fetch/
            'use strict'; if (self.fetch) { return }
            var support = {
                searchParams: 'URLSearchParams' in self, iterable: 'Symbol' in self && 'iterator' in Symbol, blob: 'FileReader' in self && 'Blob' in self && (function () {
                    try {
                        new Blob()
                        return !0
                    } catch (e) { return !1 }
                })(), formData: 'FormData' in self, arrayBuffer: 'ArrayBuffer' in self
            }
            if (support.arrayBuffer) {
                var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]']
                var isDataView = function (obj) { return obj && DataView.prototype.isPrototypeOf(obj) }
                var isArrayBufferView = ArrayBuffer.isView || function (obj) { return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1 }
            }
            function normalizeName(name) {
                if (typeof name !== 'string') { name = String(name) }
                if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) { throw new TypeError('Invalid character in header field name') }
                return name.toLowerCase()
            }
            function normalizeValue(value) {
                if (typeof value !== 'string') { value = String(value) }
                return value
            }
            function iteratorFor(items) {
                var iterator = {
                    next: function () {
                        var value = items.shift()
                        return { done: value === undefined, value: value }
                    }
                }
                if (support.iterable) { iterator[Symbol.iterator] = function () { return iterator } }
                return iterator
            }
            function Headers(headers) {
                this.map = {}
                if (headers instanceof Headers) { headers.forEach(function (value, name) { this.append(name, value) }, this) } else if (Array.isArray(headers)) { headers.forEach(function (header) { this.append(header[0], header[1]) }, this) } else if (headers) { Object.getOwnPropertyNames(headers).forEach(function (name) { this.append(name, headers[name]) }, this) }
            }
            Headers.prototype.append = function (name, value) {
                name = normalizeName(name)
                value = normalizeValue(value)
                var oldValue = this.map[name]
                this.map[name] = oldValue ? oldValue + ',' + value : value
            }
            Headers.prototype['delete'] = function (name) { delete this.map[normalizeName(name)] }
            Headers.prototype.get = function (name) {
                name = normalizeName(name)
                return this.has(name) ? this.map[name] : null
            }
            Headers.prototype.has = function (name) { return this.map.hasOwnProperty(normalizeName(name)) }
            Headers.prototype.set = function (name, value) { this.map[normalizeName(name)] = normalizeValue(value) }
            Headers.prototype.forEach = function (callback, thisArg) { for (var name in this.map) { if (this.map.hasOwnProperty(name)) { callback.call(thisArg, this.map[name], name, this) } } }
            Headers.prototype.keys = function () {
                var items = []
                this.forEach(function (value, name) { items.push(name) })
                return iteratorFor(items)
            }
            Headers.prototype.values = function () {
                var items = []
                this.forEach(function (value) { items.push(value) })
                return iteratorFor(items)
            }
            Headers.prototype.entries = function () {
                var items = []
                this.forEach(function (value, name) { items.push([name, value]) })
                return iteratorFor(items)
            }
            if (support.iterable) { Headers.prototype[Symbol.iterator] = Headers.prototype.entries }
            function consumed(body) {
                if (body.bodyUsed) { return Promise.reject(new TypeError('Already read')) }
                body.bodyUsed = !0
            }
            function fileReaderReady(reader) {
                return new Promise(function (resolve, reject) {
                    reader.onload = function () { resolve(reader.result) }
                    reader.onerror = function () { reject(reader.error) }
                })
            }
            function readBlobAsArrayBuffer(blob) {
                var reader = new FileReader()
                var promise = fileReaderReady(reader)
                reader.readAsArrayBuffer(blob)
                return promise
            }
            function readBlobAsText(blob) {
                var reader = new FileReader()
                var promise = fileReaderReady(reader)
                reader.readAsText(blob)
                return promise
            }
            function readArrayBufferAsText(buf) {
                var view = new Uint8Array(buf)
                var chars = new Array(view.length)
                for (var i = 0; i < view.length; i++) { chars[i] = String.fromCharCode(view[i]) }
                return chars.join('')
            }
            function bufferClone(buf) {
                if (buf.slice) { return buf.slice(0) } else {
                    var view = new Uint8Array(buf.byteLength)
                    view.set(new Uint8Array(buf))
                    return view.buffer
                }
            }
            function Body() {
                this.bodyUsed = !1
                this._initBody = function (body) {
                    this._bodyInit = body
                    if (!body) { this._bodyText = '' } else if (typeof body === 'string') { this._bodyText = body } else if (support.blob && Blob.prototype.isPrototypeOf(body)) { this._bodyBlob = body } else if (support.formData && FormData.prototype.isPrototypeOf(body)) { this._bodyFormData = body } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) { this._bodyText = body.toString() } else if (support.arrayBuffer && support.blob && isDataView(body)) {
                        this._bodyArrayBuffer = bufferClone(body.buffer)
                        this._bodyInit = new Blob([this._bodyArrayBuffer])
                    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) { this._bodyArrayBuffer = bufferClone(body) } else { throw new Error('unsupported BodyInit type') }
                    if (!this.headers.get('content-type')) { if (typeof body === 'string') { this.headers.set('content-type', 'text/plain;charset=UTF-8') } else if (this._bodyBlob && this._bodyBlob.type) { this.headers.set('content-type', this._bodyBlob.type) } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) { this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8') } }
                }
                if (support.blob) {
                    this.blob = function () {
                        var rejected = consumed(this)
                        if (rejected) { return rejected }
                        if (this._bodyBlob) { return Promise.resolve(this._bodyBlob) } else if (this._bodyArrayBuffer) { return Promise.resolve(new Blob([this._bodyArrayBuffer])) } else if (this._bodyFormData) { throw new Error('could not read FormData body as blob') } else { return Promise.resolve(new Blob([this._bodyText])) }
                    }
                    this.arrayBuffer = function () { if (this._bodyArrayBuffer) { return consumed(this) || Promise.resolve(this._bodyArrayBuffer) } else { return this.blob().then(readBlobAsArrayBuffer) } }
                }
                this.text = function () {
                    var rejected = consumed(this)
                    if (rejected) { return rejected }
                    if (this._bodyBlob) { return readBlobAsText(this._bodyBlob) } else if (this._bodyArrayBuffer) { return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer)) } else if (this._bodyFormData) { throw new Error('could not read FormData body as text') } else { return Promise.resolve(this._bodyText) }
                }
                if (support.formData) { this.formData = function () { return this.text().then(decode) } }
                this.json = function () { return this.text().then(JSON.parse) }
                return this
            }
            var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']
            function normalizeMethod(method) {
                var upcased = method.toUpperCase()
                return (methods.indexOf(upcased) > -1) ? upcased : method
            }
            function Request(input, options) {
                options = options || {}
                var body = options.body
                if (input instanceof Request) {
                    if (input.bodyUsed) { throw new TypeError('Already read') }
                    this.url = input.url
                    this.credentials = input.credentials
                    if (!options.headers) { this.headers = new Headers(input.headers) }
                    this.method = input.method
                    this.mode = input.mode
                    if (!body && input._bodyInit != null) {
                        body = input._bodyInit
                        input.bodyUsed = !0
                    }
                } else { this.url = String(input) }
                this.credentials = options.credentials || this.credentials || 'omit'
                if (options.headers || !this.headers) { this.headers = new Headers(options.headers) }
                this.method = normalizeMethod(options.method || this.method || 'GET')
                this.mode = options.mode || this.mode || null
                this.referrer = null
                if ((this.method === 'GET' || this.method === 'HEAD') && body) { throw new TypeError('Body not allowed for GET or HEAD requests') }
                this._initBody(body)
            }
            Request.prototype.clone = function () { return new Request(this, { body: this._bodyInit }) }
            function decode(body) {
                var form = new FormData()
                body.trim().split('&').forEach(function (bytes) {
                    if (bytes) {
                        var split = bytes.split('=')
                        var name = split.shift().replace(/\+/g, ' ')
                        var value = split.join('=').replace(/\+/g, ' ')
                        form.append(decodeURIComponent(name), decodeURIComponent(value))
                    }
                })
                return form
            }
            function parseHeaders(rawHeaders) {
                var headers = new Headers()
                var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
                preProcessedHeaders.split(/\r?\n/).forEach(function (line) {
                    var parts = line.split(':')
                    var key = parts.shift().trim()
                    if (key) {
                        var value = parts.join(':').trim()
                        headers.append(key, value)
                    }
                })
                return headers
            }
            Body.call(Request.prototype)
            function Response(bodyInit, options) {
                if (!options) { options = {} }
                this.type = 'default'
                this.status = options.status === undefined ? 200 : options.status
                this.ok = this.status >= 200 && this.status < 300
                this.statusText = 'statusText' in options ? options.statusText : 'OK'
                this.headers = new Headers(options.headers)
                this.url = options.url || ''
                this._initBody(bodyInit)
            }
            Body.call(Response.prototype)
            Response.prototype.clone = function () { return new Response(this._bodyInit, { status: this.status, statusText: this.statusText, headers: new Headers(this.headers), url: this.url }) }
            Response.error = function () {
                var response = new Response(null, { status: 0, statusText: '' })
                response.type = 'error'
                return response
            }
            var redirectStatuses = [301, 302, 303, 307, 308]
            Response.redirect = function (url, status) {
                if (redirectStatuses.indexOf(status) === -1) { throw new RangeError('Invalid status code') }
                return new Response(null, { status: status, headers: { location: url } })
            }
            self.Headers = Headers
            self.Request = Request
            self.Response = Response
            self.fetch = function (input, init) {
                return new Promise(function (resolve, reject) {
                    var request = new Request(input, init);
                    init = init || {};
                    var xhr = new XMLHttpRequest();
                    xhr.onload = function () {
                        if (xhr.status === 0) {
                            return new Response(null, { status: xhr.status });
                        } else {
                            var options = { status: xhr.status, statusText: xhr.statusText, headers: parseHeaders(xhr.getAllResponseHeaders() || '') }
                            options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
                            var body = 'response' in xhr ? xhr.response : xhr.responseText
                            resolve(new Response(body, options))
                        }
                    }
                    xhr.onerror = function () { reject(new TypeError('Network request failed')) }
                    xhr.ontimeout = function () { reject(new TypeError('Network request failed')) }
                    xhr.open(request.method, request.url, !init.sync)
                    if (request.credentials === 'include') { xhr.withCredentials = !0 } else if (request.credentials === 'omit') { xhr.withCredentials = !1 }
                    if (!init.sync && ('responseType' in xhr && support.blob)) { xhr.responseType = 'blob' }
                    request.headers.forEach(function (value, name) { xhr.setRequestHeader(name, value) })
                    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
                })
            }
            self.fetch.polyfill = !0
        })(typeof self !== 'undefined' ? self : this);
    }

    var srcToURL = function (src) {
        // GLS: 30/01/2019 Se carga un polyfill que no implementa correctamente el origin
        //if (window.URL && !(src.indexOf('//') == 0)) {
        //    try {
        //        var url = new URL(src);
        //        if (url.origin && url.origin.length > 0) {
        //            return url;
        //        }
        //    }
        //    catch (error) {
        //        // no hacemos nada y seguimos adelante
        //    }
        //}

        var anchor = document.createElement('a');
        anchor.href = src;

        if (!anchor.origin) {

            if (!(anchor.protocol && anchor.hostname)) {
                var urlParts = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(anchor.href);

                anchor.protocol = urlParts[1];

                if (urlParts[4].indexOf(':') > -1) {
                    var hostname = urlParts[4].split(':');
                    anchor.hostname = hostname[0];
                    anchor.port = hostname[1];
                } else {
                    anchor.hostname = urlParts[4];
                }
            }

            anchor.origin = (anchor.protocol.length === 0 ? window.location.protocol : anchor.protocol) + "//" + anchor.hostname + (anchor.port && (src.indexOf(anchor.port) > -1) ? ':' + anchor.port : '');
        }

        return anchor;
    };

    function HostCacheService(objectStoreName) {
        this.database = null;
        this.objectStoreName = objectStoreName;
    }

    HostCacheService.prototype = {
        /* createDB : create the scheme of the database  */
        createDB: function () {

            // In the following line, you should include the prefixes of implementations you want to test.
            window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            // DON'T use "var indexedDB = ..." if you're not in a function.
            // Moreover, you may need references to some window.IDB* objects:
            window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
            window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
            if (!window.indexedDB) {
                window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
            }

            var request = window.indexedDB.open('HostCacheService', 1);
            var that = this;
            request.onsuccess = function (evt) {
                that.database = evt.target.result;
            };
            request.onerror = function (evt) {
                console.log("IndexedDB--> onerror ");
            };
            request.onupgradeneeded = function (evt) {
                var thisDB = evt.target.result;
                if (!thisDB.objectStoreNames.contains('HostAction')) {
                    var store = thisDB.createObjectStore('HostAction', { keyPath: 'id' });
                    store.createIndex("host", ["action"], { unique: true });
                }
            };
        },
        /* info on available storage */
        info: function () {
            // Request storage usage and capacity left
            window.webkitStorageInfo.queryUsageAndQuota(window.TEMPORARY, //the type can be either TEMPORARY or PERSISTENT
                function (used, remaining) {
                    console.log("Used quota: " + used + ", remaining quota: " + remaining);
                }, function (e) {
                    console.log('Error', e);
                });
        },
        /* isReady when objectStore has been created  */
        isReady: function () {
            if (!this.database)
                return false;

            return this.database.objectStoreNames.contains(this.objectStoreName);
        },
        getHost: function (host) {
            return new Promise(function (resolve, reject) {
                if (!this.database) {
                    console.log("getAction no database", this.database);
                    reject("no IndexedDB");
                }
                else {
                    var transaction = this.database.transaction(this.objectStoreName);
                    var hostIndex = transaction.objectStore(this.objectStoreName).index("host");

                    var requestGet = hostIndex.get([host]);
                    requestGet.onsuccess = function (evt) {
                        if (evt.target.result) {
                            resolve({ data: evt.target.result });
                        }
                        else { reject("no action"); }
                    };

                    requestGet.onerror = function (evt) {
                        reject("no action get failed");
                    };
                }
            });
        }
    };

    const HostCacheItem = function () {
        this.key = "";
        this.action = null;
        this.actionName = "";
    };

    const HostCache = function () {
        var toHost = function (src) {
            var url = srcToURL(src);
            if (url) {
                return url.origin;
            }

            return null;
        };

        //this.hostCacheService = new HostCacheService("HostAction");
        //this.hostCacheService.createDB();

        this._hosts = [];
        this._hostsImage = [];

        this.is = function (src, options) {
            var host = toHost(src);

            return this.get(host, options) !== null;
        };

        this.get = function (host, options) {
            if (this.getList(options).length === 0) {
                return null;
            } else {
                var filtered = this.getList(options).filter(function (h) {
                    return h.key === host && options.exportable == h.exportable;
                });
                if (filtered.length === 0) {
                    return null;
                } else {
                    return filtered[0];
                }
            }
        };

        this.getList = function (options) {
            return options.forImage ? this._hostsImage : this._hosts;
        };

        this.addKey = function (src, options) {
            var host = toHost(src);
            var newItem = { key: host, action: null };
            if (options.exportable) {
                newItem.exportable = options.exportable;
            }
            this.getList(options).push(newItem);
            return this.getList(options)[this.getList(options).length - 1];
        };

        this.removeKey = function (src, options) {
            var host = toHost(src);

            for (var i = 0; i < this.getList(options).length; i++) {
                if (this.getList(options)[i].key === host && options.exportable == this.getList(options)[i].exportable) {
                    this.getList(options).splice(i, 1);
                    break;
                }
            }
        };

        this.getAction = function (src, options) {
            options = options || {};

            var host = toHost(src);
            var cache = this.get(host, options);
            if (!cache) {
                return Promise.reject(new Error('Cache null'));
            }
            return cache._actionPromise;
        };
    };

    var toolProto = TC.tool.Proxification.prototype;

    toolProto.cacheHost = new HostCache();

    toolProto._isServiceWorker = function () {
        if (navigator.serviceWorker) {
            if (navigator.serviceWorker.controller && navigator.serviceWorker.controller.state === "activated") {
                return true;
            } else {
                navigator.serviceWorker.ready
                    .then(function (registration) {
                        if (registration.active) {
                            return true;
                        } else {
                            return false;
                        }
                    })
                    .catch(() => {
                        console.log('Capturamos error que se produce en FF por configuración del navegador.');
                    });

                return false;
            }
        } else {
            return false;
        }
    };

    toolProto._isSameOrigin = function (uri) {
        var self = this;

        var result = uri.indexOf("http") !== 0 && uri.indexOf("//") !== 0;
        var urlParts = !result && uri.match(self.Consts.url.SPLIT_REGEX);
        if (urlParts) {
            var uProtocol = urlParts[1];
            result = (uProtocol == self._location.protocol || uProtocol == undefined) && urlParts[3] == self._location.hostname;
            var uPort = urlParts[4], lPort = self._location.port;
            if (uPort != 80 && uPort !== "" || lPort != "80" && lPort !== "") {
                result = result && uPort == lPort;
            }
        }
        return result;
    };

    toolProto._isSameProtocol = function (uri) {
        var protocolRegex = /^(https?:\/\/)/i;
        var uriProtocol = uri.match(protocolRegex);
        if (uriProtocol && uriProtocol.length > 1) {
            var locationProtocol = self._location.match(protocolRegex);
            if (locationProtocol && locationProtocol.length > 1) {
                return uriProtocol[0].trim() === locationProtocol[0].trim();
            }
        }

        return false;
    };

    toolProto._isSecureURL = function (url) {
        //sino empieza por http ni por https la consideramos segura
        if (!/^(f|ht)tps?:\/\//i.test(url))
            return true;
        return (/^(f|ht)tps:\/\//i.test(url));
    };

    const ResponseError = function (status, text, url) {
        this.status = status;
        this.text = text;
        this.url = url;
    };

    var changeProtocol = function (src, newProtocol) {
        var url = srcToURL(src);
        return src.replace(url.protocol, newProtocol);
    };

    var toHTTPS = function (src) {
        return changeProtocol(src, "https:");
    };

    var toHTTP = function (src) {
        return changeProtocol(src, "http:");
    };

    var _currentHTTP = function (src, options, resolve, reject) {
        var self = this;
        src = toHTTPS(src);

        self._image.getImgTag(src, options).then(function (img) {
            resolve(img, self._actionHTTPS);
        }, function (error) {
            if (error === self._image.ErrorType.PROTOCOL) {
                reject(error);
            } else {
                _byProxy.call(self, toHTTP(src), options, resolve, reject);
            }
        });
    };

    var _currentHTTPS = function (src, options, resolve, reject) {
        var self = this;
        src = toHTTP(src);

        self._image.getImgTag(src, options).then(function (img) {
            resolve(img, self._actionHTTP);
        }, function (error) {
            if (error === self._image.ErrorType.PROTOCOL) {
                reject(error);
            } else {
                _byProxy.call(self, toHTTPS(src), options, resolve, reject);
            }
        });
    };

    var _byProxy = function (src, options, resolve, reject) {
        var self = this;

        options.sameOrigin = self._isSameOrigin(self._actionProxy.call(self, src));

        self._image.getImgTagByAction(src, options, self._actionProxy.bind(self)).then(function (img) {
            resolve(img, self._actionProxy);
        }, function (error) {
            reject(error);
        });
    };

    toolProto._actionDirect = function (src) {
        return src;
    };

    toolProto._actionHTTP = function (src) {
        return changeProtocol(src, "http:");
    };

    toolProto._actionHTTPS = function (src) {
        return changeProtocol(src, "https:");
    };

    toolProto._actionProxy = function (src) {
        var self = this;

        return self.proxy(src);
    };

    toolProto._image = {
        ErrorType: {
            CORS: 'cors',
            PROTOCOL: 'protocol',
            NOTFOUNDED: 'notfounded',
            UNEXPECTED: 'unexpected',
            OFFLINE: 'offline'
        },
        checkHttpStatus: function (src) {
            const self = this;
            if (!navigator.onLine) {
                return Promise.reject({ statusText: self.ErrorType.OFFLINE });
            }

            return fetch(src, { credentials: 'omit' })
                .then(function (response) {
                    return { status: response.status, statusText: response.statusText };
                })
                .catch(function (error) {
                    return { statusText: self.ErrorType.UNEXPECTED };
                });
        },
        getImgTag: function (src, options) {
            return new Promise(function (resolve, reject) {
                var self = this;

                var img = document.createElement("img");

                if (options.exportable && !options.sameOrigin) {
                    img.dataset.checkCORSHeaders = true;
                    img.crossOrigin = "anonymous";
                }

                img.onload = function () {

                    console.log('Load OK: ' + img.src);

                    img.onload = img.onerror = undefined;

                    if (options.exportable && !options.sameOrigin) {
                        var createCanvas = function (img) {
                            var canvas = document.createElement('CANVAS');
                            var ctx = canvas.getContext('2d');
                            canvas.height = img.height;
                            canvas.width = img.width;
                            ctx.drawImage(img, 0, 0);

                            return canvas;
                        };

                        try {
                            var canvas = createCanvas(img);
                            result = canvas.toDataURL("image/png");
                            resolve(img);
                        } catch (e) {
                            if (e.code === 18) { // GLS: 18 - SECURITY_ERR
                                reject(self.ErrorType.CORS);
                            } else {
                                resolve(img);
                            }
                        }
                    } else { resolve(img); }
                };

                img.onerror = function (error) {

                    console.log('Load crossOrigin ERROR: ' + img.src);

                    if (img.dataset.checkCORSHeaders) {
                        img.crossOrigin = null;

                        img.onerror = undefined;
                        img.onerror = function (error) {
                            console.log('Load ERROR: ' + img.src);

                            self.checkHttpStatus(img.src).then(function (error) {
                                if (options.ignoreProxification) {
                                    reject(self.ErrorType.PROTOCOL);
                                } else {
                                    if (error.status === 400) {
                                        reject(self.ErrorType.PROTOCOL);
                                    } else {
                                        reject(error);
                                    }
                                }
                            }).catch(reject);
                            img.onload = img.onerror = undefined;
                        };

                        img.src = src;

                    } else {
                        console.log('Load ERROR: ' + img.src);

                        img.onload = img.onerror = undefined;

                        self.checkHttpStatus(img.src).then(function (error) {
                            if (options.ignoreProxification) {
                                reject(self.ErrorType.PROTOCOL);
                            } else {
                                if (error.status === 400) {
                                    reject(self.ErrorType.PROTOCOL);
                                } else {
                                    reject(error);
                                }
                            }
                        }).catch(reject);
                    }
                };

                try {
                    img.src = src;
                } catch (ex) {
                    console.log('Load ERROR: ' + img.src);

                    reject(self.ErrorType.UNEXPECTED);
                }
            }.bind(toolProto._image));
        },
        getImgTagByAction: function (src, options, action) {
            return new Promise(function (resolve, reject) {
                var self = this;

                var img = document.createElement("img");

                if (!options.sameOrigin) {
                    if (options.exportable) {
                        img.crossOrigin = "anonymous";
                    }
                }

                img.onload = function () {
                    img.onload = img.onerror = undefined;
                    resolve(img);
                };
                img.onerror = function (error) {
                    console.log('Load ERROR: ' + img.src);
                    img.onload = img.onerror = undefined;

                    self.checkHttpStatus(img.src).then(function (error) {
                        if (options.ignoreProxification) {
                            reject(self.ErrorType.PROTOCOL);
                        } else {
                            if (error.status === 400) {
                                reject(self.ErrorType.PROTOCOL);
                            } else {
                                reject(error);
                            }
                        }
                    }).catch(reject);
                };
                img.src = action(src);
            }.bind(toolProto._image));
        }
    };

    toolProto._fetch = {
        Headers: {
            CONTENTTYPE: "content-type",
            CONTENTDISPOSITION:"content-disposition"
        },
        ErrorType: {
            CORS: 'cors',
            PROTOCOL: 'protocol',
            NOTFOUNDED: 'Not_Founded',
            UNEXPECTED: 'Un_Expected',
            UNEXPECTEDCONTENTTYPE: 'Un_Expected_ContentType'
        },
        validateResponse: function (response) {
            if (!response.ok) { // status no está en el rango 200-299
                throw new ResponseError(response.status, response.statusText, response.url);
            }
            return response;
        },
        validateContentType: function (expectedContentType, response) {
            const self = this;

            if (!expectedContentType) {
                return response;
            }

            var contentType = response.headers.get(self._fetch.Headers.CONTENTTYPE);
            if (contentType && contentType.indexOf(expectedContentType) === -1) {
                throw Error(self._fetch.ErrorType.UNEXPECTEDCONTENTTYPE);
            }

            return response;
        }
    };

    /* Sólo GET */
    toolProto.fetchImage = function (src, options) {
        var self = this;

        options = options || {};
        options.forImage = true;

        return new Promise(function (resolve, reject) {

            if (self.cacheHost.is(src, options)) {
                self.cacheHost.getAction(src, options).then(function (cache) {
                    options.sameOrigin = self._isSameOrigin(cache.action(src));
                    self._image.getImgTagByAction(src, options, cache.action).then(function (img) {
                        resolve(img);
                    }, function (error) {
                        reject(error);
                    });
                }).catch(error => reject(error));
            } else {
                var cache = self.cacheHost.addKey(src, options);
                cache._actionPromise = new Promise(function (resolveActionPromise, rejectActionPromise) {

                    const _caching = function (img, action) {
                        cache.action = action.bind(self);
                        cache.exportable = options.exportable;

                        resolveActionPromise({ action: cache.action });

                        resolve(img);
                    };

                    const _reject = function (error) {
                        rejectActionPromise(error);

                        if (error.status == 200) {
                            //options.useCredentials = true;

                            // GLS: 04/01/2019 comento la siguiente línea porque no para de pedir al obtener una respuesta correcta y en el cuerpo viene una excepción
                            //makeRequest(options);

                            self.cacheHost.removeKey(src, options);
                            reject(error);
                        } else {
                            self.cacheHost.removeKey(src, options);
                            reject(error);
                        }
                    };

                    const makeRequest = function (options) {
                        if (self._isSameOrigin(src)) {
                            options.sameOrigin = true;
                            self._image.getImgTag(src, options).then(function (img) {
                                _caching(img, self._actionDirect);
                            }, _reject);
                        } else {
                            if (!self._isSecureURL(src)) {
                                if (self._isServiceWorker() || (self._isSecureURL(self._location) && self.preventMixedContent)) {
                                    // HTTP (sin intento) -> HTTPS -> (HTTP)Proxy
                                    _currentHTTP.call(self, src, options, _caching, _reject);
                                } else {
                                    // HTTP -> HTTPS (si el visor no es HTTP) -> (HTTP)Proxy
                                    self._image.getImgTag(src, options).then(function (img) {
                                        _caching(img, self._actionDirect);
                                    }, function (error) {
                                        if ((options.exportable && error === self._image.ErrorType.CORS) || !self._isSecureURL(self._location)) {
                                            // Si la imagen debe ser exportable y en la solicitud por HTTP tenemos error de CORS, deducimos que por HTTPS pasará lo mismo
                                            if (error === self._image.ErrorType.PROTOCOL && options.ignoreProxification) {
                                                _reject(error);
                                            } else {
                                                _byProxy.call(self, src, options, _caching, _reject);
                                            }
                                        } else {
                                            _currentHTTP.call(self, src, options, _caching, _reject);
                                        }
                                    });

                                }
                            } else {
                                // HTTPS -> HTTP -> (HTTPS)Proxy
                                self._image.getImgTag(src, options).then(function (img) {
                                    _caching(img, self._actionDirect);
                                }, function (error) {
                                    if ((options.exportable && error === self._image.ErrorType.CORS) || self._isServiceWorker() || (self._isSecureURL(self._location) && self.preventMixedContent)) {
                                        // Si la imagen debe ser exportable y en la solicitud por HTTPS tenemos error de CORS, deducimos que por HTTP pasará lo mismo
                                        if (error === self._image.ErrorType.PROTOCOL && options.ignoreProxification) {
                                            _reject(error);
                                        } else {
                                            _byProxy.call(self, src, options, _caching, _reject);
                                        }
                                    } else {
                                        _currentHTTPS.call(self, src, options, _caching, _reject);
                                    }
                                });
                            }
                        }
                    };

                    makeRequest(options);
                });
            }
        });        
    };

    toolProto.fetchRetry = function (url, options, n) {
        const self = this;
        var _fetch = fetch;

        if (options.sync) {
            _fetch = self.fetchSync;
        }

        return _fetch(url, options).catch(function (error) {
            if (n === 1) throw error;
            return self.fetchRetry(url, options, n - 1);
        });
    };

    toolProto.fetchSync = function (url, options) {
        var self = this;

        return new Promise(function (resolve, reject) {

            var support = {
                searchParams: 'URLSearchParams' in self, iterable: 'Symbol' in self && 'iterator' in Symbol, blob: 'FileReader' in self && 'Blob' in self && (function () {
                    try {
                        new Blob()
                        return !0
                    } catch (e) { return !1 }
                })(), formData: 'FormData' in self, arrayBuffer: 'ArrayBuffer' in self
            }

            if (support.arrayBuffer) {
                var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]']
                var isDataView = function (obj) { return obj && DataView.prototype.isPrototypeOf(obj) }
                var isArrayBufferView = ArrayBuffer.isView || function (obj) { return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1 }
            }

            function parseHeaders(rawHeaders) {
                var headers = new Headers()
                var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
                preProcessedHeaders.split(/\r?\n/).forEach(function (line) {
                    var parts = line.split(':')
                    var key = parts.shift().trim()
                    if (key) {
                        var value = parts.join(':').trim()
                        headers.append(key, value)
                    }
                })
                return headers
            }


            var request = new Request(url, options);
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                var options = { status: xhr.status, statusText: xhr.statusText, headers: parseHeaders(xhr.getAllResponseHeaders() || '') };
                options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
                var body = 'response' in xhr ? xhr.response : xhr.responseText;
                resolve(new Response(body, options));
            };
            xhr.onerror = function () { reject(new TypeError('Network request failed')) };
            xhr.ontimeout = function () { reject(new TypeError('Network request failed')) };
            xhr.open(request.method, request.url, false);
            if (request.credentials === 'include') { xhr.withCredentials = !options.sync } else if (request.credentials === 'omit') { xhr.withCredentials = !1 };
            if (!options.sync && ('responseType' in xhr && support.blob)) { xhr.responseType = 'blob' };
            request.headers.forEach(function (value, name) { xhr.setRequestHeader(name, value) });
            xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
        })
    };

    toolProto.fetchXML = function (url, options) {
        const self = this;

        options = options || {};
        options.responseType = "xml"; // No puedo usar la constante de la API porque está como application/xml y hay servicios que devuelven text/xml //TC.Consts.mimeType.XML;

        return self.fetch(url, options);
    };

    toolProto.fetchJSON = function (url, options) {
        const self = this;

        options = options || {};
        options.responseType = TC.Consts.mimeType.JSON;

        return self.fetch(url, options);
    };

    toolProto.fetchBlob = function (url, options) {
        const self = this;

        options = options || {};
        options.responseType = "blob";

        return self.fetch(url, options);
    };

    /* Para imágenes por POST */
    toolProto.fetchImageAsBlob = function (url, options) {
        const self = this;

        options = options || {};
        options.responseType = "image";

        return self.fetch(url, options);
    };

    /*
        type: GET|POST
        data: cuerpo del mensaje
        contentType: tipo del cuerpo del mensaje
        responseType: tipo de respuesta esperada
        retryAttempts: número de intentos por llamada
    */
    // indicar responseType en options
    toolProto.fetch = function (url, options) {
        const self = this;

        options = options || {};

        if (options.type) {
            options.method = options.type;

            delete options.type;
        }

        if (options.data) {
            options.body = options.data;

            delete options.data;
        }

        if (options.contentType) {
            options.headers = new Headers();
            options.headers.append('Content-Type', options.contentType);

            delete options.contentType;
        }

        if (!options.responseType) {
            options.responseType = '';
        }

        var _makeRequest = function (url, options, actions, cache) {
            var request;

            // fetch no incluye por defecto las cookies de autenticación, hay que indicarlo.
            //options.credentials = 'include';

            return (options.retryAttempts ? self.fetchRetry(actions[0].call(self, url), options, options.retryAttempts) : fetch(actions[0].call(self, url), options))
                .then(self._fetch.validateResponse)
                .then(self._fetch.validateContentType.bind(self, options.responseType))
                .then(function (response) {
                    if (cache) {
                        cache.action = actions[0].bind(self);
                    }

                    const contentType = response.headers.get(self._fetch.Headers.CONTENTTYPE);
                    if (options.nomanage)
                        return Promise.resolve(response);
                    //if (!options.responseType) {
                    //    if (contentType) {
                    //        options.responseType = contentType;
                    //    } else {
                    //        return response.text();
                    //    }
                    //}

                    const responseWithCharsetToDecodedString = function (charset) {
                        /*
                                2018 08 16
                                https://developer.mozilla.org/en-US/docs/Web/API/Response#Methods
                                No existe método xml

                                https://developer.mozilla.org/en-US/docs/Web/API/Body/text
                                The text() method of the Body mixin takes a Response stream and reads it to completion.
                                It returns a promise that resolves with a USVString object (text).
                                The response is always decoded using UTF-8.
                            */

                        return response.blob()
                            .then(function (blob) {
                                const reader = new FileReader();

                                return new Promise(function (resolve, reject) {

                                    reader.addEventListener("error", function () {
                                        reader.abort();
                                        reject(new DOMException("Problem decoding"));
                                    });

                                    reader.addEventListener("loadend", function () {
                                        resolve(reader.result);
                                    });

                                    reader.readAsText(blob, charset);
                                });
                            }).catch(function (error) { throw error; });
                    };

                    switch (true) {
                        case options.responseType.indexOf('xml') > -1:
                        case options.responseType.indexOf('text/xml') > -1:
                        case options.responseType.indexOf(TC.Consts.mimeType.XML) > -1:
                            var hasCharset = /charset=([^;]*)/i.exec(contentType);
                            if (hasCharset && hasCharset.length === 2 && hasCharset[1] !== "UTF-8") {
                                return responseWithCharsetToDecodedString(hasCharset[1]).then(function (text) {
                                    return (new window.DOMParser()).parseFromString(text, "text/xml");
                                }).catch(function (error) { throw error; });
                            } else {
                                return response.text().then(function (data) {
                                    return (new window.DOMParser()).parseFromString(data, "text/xml");
                                }).catch(function (error) { throw error; });
                            }
                        case options.responseType.indexOf('arraybuffer') > -1:                        
                            return response.arrayBuffer();
                        case options.responseType.indexOf('image') > -1:
                        case options.responseType.indexOf('blob') > -1:                        
                        case options.responseType.indexOf('application/zip') > -1:
                        case options.responseType.indexOf('application/x-zip-compressed') > -1:
                        case options.responseType.indexOf('application/vnd.google-earth.kmz') > -1:
                        case options.responseType.indexOf('application/octet-stream') > -1:
                        case options.responseType.indexOf('application/geopackage+sqlite3') > -1:
                            return response.blob().then(function (blob) {
                                return new Blob([blob], { type: contentType });
                            }).catch(function (error) { throw error; });
                        case options.responseType.indexOf('document') > -1:
                            throw new DeveloperError('Unhandled responseType: ' + options.responseType);
                        case options.responseType.indexOf(TC.Consts.mimeType.JSON) > -1:
                            return response.json();
                        case options.responseType == '':
                        case options.responseType.indexOf('text') > -1:
                        default:
                            var hasCharset = /charset=([^;]*)/i.exec(contentType);
                            if (hasCharset && hasCharset.length === 2 && hasCharset[1] !== "UTF-8") {
                                return responseWithCharsetToDecodedString(hasCharset[1]).then(function (text) {
                                    if (options.responseType == '') {
                                        return { responseText: text, contentType: contentType };
                                    } else {
                                        return text;
                                    }
                                }).catch(function (error) { throw error; });
                            } else {
                                return response.text().then(function (text) {
                                    if (options.responseType == '') {
                                        return { responseText: text, contentType: contentType };
                                    } else {
                                        return text;
                                    }
                                }).catch(function (error) { throw error; });
                            }
                    }
                })
                .catch(function (error) {
                    if (actions.length === 1) {
                        console.log('request failed', error);
                        return Promise.reject(error);
                    }

                    actions.shift();
                    return _makeRequest(url, options, actions, cache);
                });
        };

        if (self.cacheHost.is(url, options)) {
            return new Promise(function (resolve, reject) {
                self.cacheHost.getAction(url, options).then(function (cache) {
                    resolve(_makeRequest(url, options, [cache.action]));
                }).catch(function (error) {
                    if (!error.status || error.status >= 400) {
                        reject(new Error(error.text));
                    } else {
                        resolve(self.fetch(url, options));
                    }
                });
            });
        } else {
            var cache = self.cacheHost.addKey(url, options);
            return new Promise(function (resolve, reject) {
                cache._actionPromise = new Promise(function (resolveActionPromise, rejectActionPromise) {

                    url = srcToURL(url).href;

                    const fnResolve = function (data) {                        
                        resolveActionPromise({ action: cache.action });
                        resolve(data);
                    };

                    const fnReject = function (error) {                        
                        self.cacheHost.removeKey(url, options);

                        rejectActionPromise(error);
                        reject(new Error(error.text));
                    };

                    if (self._isSameOrigin(url)) {
                        _makeRequest(url, options, [self._actionDirect, self._actionProxy], cache).then(fnResolve).catch(fnReject);
                    } else {
                        if (!self._isSecureURL(url)) {
                            if (self._isServiceWorker()) {
                                // HTTP (sin intento) -> HTTPS -> (HTTP)Proxy
                                _makeRequest(url, options, [self._actionHTTPS, self._actionProxy], cache).then(fnResolve).catch(fnReject);
                            } else {
                                // HTTP (si el visor no es HTTPS) -> HTTPS -> (HTTP)Proxy
                                _makeRequest(url, options, !self._isSecureURL(self._location) ? [self._actionDirect, self._actionHTTPS, self._actionProxy] : [self._actionHTTPS, self._actionProxy], cache).then(fnResolve).catch(fnReject);
                            }
                        } else {
                            if (self._isServiceWorker()) {
                                // HTTPS -> (HTTPS)Proxy
                                _makeRequest(url, options, [self._actionDirect, self._actionProxy], cache).then(fnResolve).catch(fnReject);
                            } else {
                                // HTTPS -> HTTP (si el visor no es HTTPS) -> (HTTPS)Proxy
                                _makeRequest(url, options, !self._isSecureURL(self._location) ? [self._actionDirect, self._actionHTTP, self._actionProxy] : [self._actionDirect, self._actionProxy], cache).then(fnResolve).catch(fnReject);
                            }
                        }
                    }
                });
                cache._actionPromise.catch(function (error) {
                    if (!error.status || error.status >= 400) {
                        reject(new Error(error.text));
                    } else {
                        resolve(self.fetch(url, options));
                    }
                });
            });
        }
    };

    toolProto.fetchFile = function (url, options) {
        const self = this;

        options = options || {};
        options.nomanage = true;
        return new Promise(function (resolve, reject) {
            self.fetch(url, options).then(function (response) {
                const contentDisposition = response.headers.get(self._fetch.Headers.CONTENTDISPOSITION);
                var filename = new RegExp(/\w+.\w{1,}$/gi).exec(url)[0];
                if (contentDisposition && /(attachment);([^;]*)/gi.test(contentDisposition)) {
                    try {
                        filename = /filename\*?=\"?([\w|-]*\'\')?(.*\.\w*)\"?/gi.exec(contentDisposition)[2];                        
                    } catch (ex) {
                        try {
                            filename = contentDisposition.substring((contentDisposition.lastIndexOf("'") || contentDisposition.indexOf("=")) + 1);
                        } catch (ex2) { }                        
                    }
                }
                response.blob().then(function (blob) {
                    resolve(new File([blob], filename, { type: response.headers.get(self._fetch.Headers.CONTENTTYPE) }));
                })
                
            }).catch(reject);
        });
    }
})();
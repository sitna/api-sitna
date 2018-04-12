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
    if (typeof Promise === 'undefined') {
        // polyfill https://github.com/stefanpenner/es6-promise#readme
        !function (t, e) { "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : t.ES6Promise = e() }(this, function () { "use strict"; function t(t) { var e = typeof t; return null !== t && ("object" === e || "function" === e) } function e(t) { return "function" == typeof t } function n(t) { G = t } function r(t) { H = t } function o() { return function () { return process.nextTick(a) } } function i() { return "undefined" != typeof B ? function () { B(a) } : c() } function s() { var t = 0, e = new Q(a), n = document.createTextNode(""); return e.observe(n, { characterData: !0 }), function () { n.data = t = ++t % 2 } } function u() { var t = new MessageChannel; return t.port1.onmessage = a, function () { return t.port2.postMessage(0) } } function c() { var t = setTimeout; return function () { return t(a, 1) } } function a() { for (var t = 0; t < z; t += 2) { var e = X[t], n = X[t + 1]; e(n), X[t] = void 0, X[t + 1] = void 0 } z = 0 } function f() { try { var t = require, e = t("vertx"); return B = e.runOnLoop || e.runOnContext, i() } catch (n) { return c() } } function l(t, e) { var n = this, r = new this.constructor(p); void 0 === r[$] && k(r); var o = n._state; if (o) { var i = arguments[o - 1]; H(function () { return x(o, r, i, n._result) }) } else E(n, r, t, e); return r } function h(t) { var e = this; if (t && "object" == typeof t && t.constructor === e) return t; var n = new e(p); return g(n, t), n } function p() { } function v() { return new TypeError("You cannot resolve a promise with itself") } function d() { return new TypeError("A promises callback cannot return that same promise.") } function _(t) { try { return t.then } catch (e) { return rt.error = e, rt } } function y(t, e, n, r) { try { t.call(e, n, r) } catch (o) { return o } } function m(t, e, n) { H(function (t) { var r = !1, o = y(n, e, function (n) { r || (r = !0, e !== n ? g(t, n) : S(t, n)) }, function (e) { r || (r = !0, j(t, e)) }, "Settle: " + (t._label || " unknown promise")); !r && o && (r = !0, j(t, o)) }, t) } function b(t, e) { e._state === et ? S(t, e._result) : e._state === nt ? j(t, e._result) : E(e, void 0, function (e) { return g(t, e) }, function (e) { return j(t, e) }) } function w(t, n, r) { n.constructor === t.constructor && r === l && n.constructor.resolve === h ? b(t, n) : r === rt ? (j(t, rt.error), rt.error = null) : void 0 === r ? S(t, n) : e(r) ? m(t, n, r) : S(t, n) } function g(e, n) { e === n ? j(e, v()) : t(n) ? w(e, n, _(n)) : S(e, n) } function A(t) { t._onerror && t._onerror(t._result), M(t) } function S(t, e) { t._state === tt && (t._result = e, t._state = et, 0 !== t._subscribers.length && H(M, t)) } function j(t, e) { t._state === tt && (t._state = nt, t._result = e, H(A, t)) } function E(t, e, n, r) { var o = t._subscribers, i = o.length; t._onerror = null, o[i] = e, o[i + et] = n, o[i + nt] = r, 0 === i && t._state && H(M, t) } function M(t) { var e = t._subscribers, n = t._state; if (0 !== e.length) { for (var r = void 0, o = void 0, i = t._result, s = 0; s < e.length; s += 3) r = e[s], o = e[s + n], r ? x(n, r, o, i) : o(i); t._subscribers.length = 0 } } function T() { this.error = null } function P(t, e) { try { return t(e) } catch (n) { return ot.error = n, ot } } function x(t, n, r, o) { var i = e(r), s = void 0, u = void 0, c = void 0, a = void 0; if (i) { if (s = P(r, o), s === ot ? (a = !0, u = s.error, s.error = null) : c = !0, n === s) return void j(n, d()) } else s = o, c = !0; n._state !== tt || (i && c ? g(n, s) : a ? j(n, u) : t === et ? S(n, s) : t === nt && j(n, s)) } function C(t, e) { try { e(function (e) { g(t, e) }, function (e) { j(t, e) }) } catch (n) { j(t, n) } } function O() { return it++ } function k(t) { t[$] = it++, t._state = void 0, t._result = void 0, t._subscribers = [] } function Y() { return new Error("Array Methods must be provided an Array") } function Y() { return new Error("Array Methods must be provided an Array") } function q(t) { return new st(this, t).promise } function F(t) { var e = this; return new e(W(t) ? function (n, r) { for (var o = t.length, i = 0; i < o; i++) e.resolve(t[i]).then(n, r) } : function (t, e) { return e(new TypeError("You must pass an array to race.")) }) } function D(t) { var e = this, n = new e(p); return j(n, t), n } function K() { throw new TypeError("You must pass a resolver function as the first argument to the promise constructor") } function L() { throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.") } function N() { var t = void 0; if ("undefined" != typeof global) t = global; else if ("undefined" != typeof self) t = self; else try { t = Function("return this")() } catch (e) { throw new Error("polyfill failed because global object is unavailable in this environment") } var n = t.Promise; if (n) { var r = null; try { r = Object.prototype.toString.call(n.resolve()) } catch (e) { } if ("[object Promise]" === r && !n.cast) return } t.Promise = ut } var U = void 0; U = Array.isArray ? Array.isArray : function (t) { return "[object Array]" === Object.prototype.toString.call(t) }; var W = U, z = 0, B = void 0, G = void 0, H = function (t, e) { X[z] = t, X[z + 1] = e, z += 2, 2 === z && (G ? G(a) : Z()) }, I = "undefined" != typeof window ? window : void 0, J = I || {}, Q = J.MutationObserver || J.WebKitMutationObserver, R = "undefined" == typeof self && "undefined" != typeof process && "[object process]" === {}.toString.call(process), V = "undefined" != typeof Uint8ClampedArray && "undefined" != typeof importScripts && "undefined" != typeof MessageChannel, X = new Array(1e3), Z = void 0; Z = R ? o() : Q ? s() : V ? u() : void 0 === I && "function" == typeof require ? f() : c(); var $ = Math.random().toString(36).substring(16), tt = void 0, et = 1, nt = 2, rt = new T, ot = new T, it = 0, st = function () { function t(t, e) { this._instanceConstructor = t, this.promise = new t(p), this.promise[$] || k(this.promise), W(e) ? (this.length = e.length, this._remaining = e.length, this._result = new Array(this.length), 0 === this.length ? S(this.promise, this._result) : (this.length = this.length || 0, this._enumerate(e), 0 === this._remaining && S(this.promise, this._result))) : j(this.promise, Y()) } return t.prototype._enumerate = function (t) { for (var e = 0; this._state === tt && e < t.length; e++) this._eachEntry(t[e], e) }, t.prototype._eachEntry = function (t, e) { var n = this._instanceConstructor, r = n.resolve; if (r === h) { var o = _(t); if (o === l && t._state !== tt) this._settledAt(t._state, e, t._result); else if ("function" != typeof o) this._remaining--, this._result[e] = t; else if (n === ut) { var i = new n(p); w(i, t, o), this._willSettleAt(i, e) } else this._willSettleAt(new n(function (e) { return e(t) }), e) } else this._willSettleAt(r(t), e) }, t.prototype._settledAt = function (t, e, n) { var r = this.promise; r._state === tt && (this._remaining--, t === nt ? j(r, n) : this._result[e] = n), 0 === this._remaining && S(r, this._result) }, t.prototype._willSettleAt = function (t, e) { var n = this; E(t, void 0, function (t) { return n._settledAt(et, e, t) }, function (t) { return n._settledAt(nt, e, t) }) }, t }(), ut = function () { function t(e) { this[$] = O(), this._result = this._state = void 0, this._subscribers = [], p !== e && ("function" != typeof e && K(), this instanceof t ? C(this, e) : L()) } return t.prototype["catch"] = function (t) { return this.then(null, t) }, t.prototype["finally"] = function (t) { var e = this, n = e.constructor; return e.then(function (e) { return n.resolve(t()).then(function () { return e }) }, function (e) { return n.resolve(t()).then(function () { throw e }) }) }, t }(); return ut.prototype.then = l, ut.all = q, ut.race = F, ut.resolve = h, ut.reject = D, ut._setScheduler = n, ut._setAsap = r, ut._asap = H, ut.polyfill = N, ut.Promise = ut, ut });
    }

    if (!window.fetch) {
        (function (self) {
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
                    var request = new Request(input, init)
                    var xhr = new XMLHttpRequest()
                    xhr.onload = function () {
                        var options = { status: xhr.status, statusText: xhr.statusText, headers: parseHeaders(xhr.getAllResponseHeaders() || '') }
                        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
                        var body = 'response' in xhr ? xhr.response : xhr.responseText
                        resolve(new Response(body, options))
                    }
                    xhr.onerror = function () { reject(new TypeError('Network request failed')) }
                    xhr.ontimeout = function () { reject(new TypeError('Network request failed')) }
                    xhr.open(request.method, request.url, !0)
                    if (request.credentials === 'include') { xhr.withCredentials = !0 } else if (request.credentials === 'omit') { xhr.withCredentials = !1 }
                    if ('responseType' in xhr && support.blob) { xhr.responseType = 'blob' }
                    request.headers.forEach(function (value, name) { xhr.setRequestHeader(name, value) })
                    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
                })
            }
            self.fetch.polyfill = !0
        })(typeof self !== 'undefined' ? self : this);
    }

    var srcToURL = function (src) {
        if (window.URL) {
            try {
                var url = new URL(src);
                if (url.origin) {
                    return url;
                }
            }
            catch (error) {
                // no hacemos nada y seguimos adelante
            }
        }

        var anchor = document.createElement('a');
        anchor.href = src;

        if (!anchor.origin) {
            anchor.origin = anchor.protocol + "//" + anchor.hostname + (anchor.port && (src.indexOf(anchor.port) > -1) ? ':' + anchor.port : '');
        }

        return anchor;
    };

    var HostCache = function () {
        var toHost = function (src) {
            var url = srcToURL(src);
            if (url) {
                return url.origin;
            }

            return null;
        };

        this._hosts = [];

        this.is = function (src) {
            var host = toHost(src);
            return this.get(host) !== null;
        };

        this.get = function (host) {
            if (this._hosts.length === 0) {
                return null;
            } else {
                var filtered = this._hosts.filter(function (h) { return h.key === host; });
                if (filtered.length === 0) {
                    return null;
                } else {
                    return filtered[0];
                }
            }
        };

        this.addKey = function (src) {
            var host = toHost(src);
            this._hosts.push({ key: host, action: null });
            return this._hosts[this._hosts.length - 1];
        };

        this.getAction = function (src) {
            var host = toHost(src);
            var cache = this.get(host);
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

    var _currentHTTP = function (src, exportable, resolve, reject) {
        var self = this;
        src = toHTTPS(src);

        var fn = exportable ? self._image.getImgTag(src, exportable) : self._image.getImgTag(src);
        fn.then(function (img) {
            resolve(img, self._actionHTTPS);
        }, function (error) {
            _byProxy.call(self, toHTTP(src), exportable, resolve, reject);
        });
    };

    var _currentHTTPS = function (src, exportable, resolve, reject) {
        var self = this;
        src = toHTTP(src);

        fn = exportable ? self._image.getImgTag(src, exportable) : self._image.getImgTag(src);
        fn.then(function (img) {
            resolve(img, self._actionHTTP);
        }, function (error) {
            _byProxy.call(self, toHTTPS(src), exportable, resolve, reject);
        });
    };

    var _byProxy = function (src, exportable, resolve, reject) {
        var self = this;

        fn = exportable ? self._image.getImgTagByAction(src, exportable, self._actionProxy.bind(self)) : self._image.getImgTagByAction(src, false, self._actionProxy.bind(self));
        fn.then(function (img) {
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
            NOTFOUNDED: 'notfounded',
            UNEXPECTED: 'unexpected'
        },
        getImgTag: function (src, checkCORSHeaders) {
            return new Promise(function (resolve, reject) {
                var self = this;

                var img = document.createElement("img");

                if (checkCORSHeaders) {
                    img.dataset.checkCORSHeaders = true;
                    img.crossOrigin = "anonymous";                    
                }

                img.onload = function () {

                    console.log('Load OK: ' + img.src);

                    img.onload = img.onerror = undefined;

                    if (checkCORSHeaders) {
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

                img.onerror = function () {

                    console.log('Load crossOrigin ERROR: ' + img.src);

                    if (img.dataset.checkCORSHeaders) {
                        img.crossOrigin = null;

                        img.onerror = undefined;
                        img.onerror = function () {
                            console.log('Load ERROR: ' + img.src);

                            img.onload = img.onerror = undefined;                            

                            reject(self.ErrorType.NOTFOUNDED);
                        };

                        img.src = src;

                    } else {
                        console.log('Load ERROR: ' + img.src);

                        img.onload = img.onerror = undefined;

                        reject(self.ErrorType.NOTFOUNDED);
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
        getImgTagByAction: function (src, checkCORSHeaders, action) {
            return new Promise(function (resolve, reject) {
                var self = this;

                var img = document.createElement("img");
                if (checkCORSHeaders) {
                    img.crossOrigin = "anonymous";
                }
                img.onload = function () {
                    img.onload = img.onerror = undefined;
                    resolve(img);
                };
                img.onerror = function () {
                    console.log('Load ERROR: ' + img.src);
                    img.onload = img.onerror = undefined;
                    reject(self.ErrorType.NOTFOUNDED);
                };
                img.src = action(src);
            }.bind(toolProto._image));
        }
    };

    toolProto.getImage = function (src, exportable) {
        var self = this;

        return new Promise(function (resolve, reject) {

            if (self.cacheHost.is(src)) {
                self.cacheHost.getAction(src).then(function (action) {
                    self._image.getImgTagByAction(src, exportable, action).then(function (img) {
                        resolve(img);
                    }, function (error) { reject(error); });
                });
            } else {
                var cache = self.cacheHost.addKey(src);
                cache._actionPromise = new Promise(function (resolveActionPromise, rejectActionPromise) {

                    var _caching = function (img, action) {
                        cache.action = action.bind(self);
                        resolveActionPromise(cache.action);

                        resolve(img);
                    };

                    if (self._isSameOrigin(src)) {
                        self._image.getImgTag(src, exportable).then(function (img) {
                            _caching(img, self._actionDirect);
                        }, function (error) { reject(error); });
                    } else {

                        if (!self._isSecureURL(src)) {
                            if (self._isServiceWorker() || (self._isSecureURL(self._location) && self.preventMixedContent)) {
                                // HTTP (sin intento) -> HTTPS -> (HTTP)Proxy
                                _currentHTTP.call(self, src, exportable, _caching, reject);
                            } else {
                                // HTTP -> HTTPS (si el visor no es HTTP) -> (HTTP)Proxy
                                var fn = exportable ? self._image.getImgTag(src, exportable) : self._image.getImgTag(src);
                                fn.then(function (img) {
                                    _caching(img, self._actionDirect);
                                }, function (error) {
                                    if ((exportable && error === self._image.ErrorType.CORS) || !self._isSecureURL(self._location)) {
                                        // Si la imagen debe ser exportable y en la solicitud por HTTP tenemos error de CORS, deducimos que por HTTPS pasará lo mismo
                                        _byProxy.call(self, src, exportable, _caching, reject);
                                    } else {
                                        _currentHTTP.call(self, src, exportable, _caching, reject);
                                    }
                                });

                            }
                        } else {
                            // HTTPS -> HTTP -> (HTTPS)Proxy
                            var fn = exportable ? self._image.getImgTag(src, exportable) : self._image.getImgTag(src);
                            fn.then(function (img) {
                                _caching(img, self._actionDirect);
                            }, function (error) {
                                if ((exportable && error === self._image.ErrorType.CORS) || self._isServiceWorker() || (self._isSecureURL(self._location) && self.preventMixedContent)) {
                                    // Si la imagen debe ser exportable y en la solicitud por HTTPS tenemos error de CORS, deducimos que por HTTP pasará lo mismo
                                    _byProxy.call(self, src, exportable, _caching, reject);
                                } else {
                                    _currentHTTPS.call(self, src, exportable, _caching, reject);
                                }
                            });
                        }
                    }
                });
            }
        });
    };
})();
const signalEvents = new WeakMap();
const getNativeListener = function (evt, callback) {
    const result = function (evt) {
        const cbParameter = {
            type: evt.type,
            target: this,
            currentTarget: this
        };
        if (evt.detail) {
            Object.keys(evt.detail).forEach(function (key) {
                if (!(key in cbParameter)) {
                    cbParameter[key] = evt.detail[key];
                }
            });
        }
        return callback.call(this, cbParameter);
    }.bind(this);
    const stack = this._listeners[evt] = this._listeners[evt] || new Map();
    stack.set(callback, result);
    return result;
};

const onInternal = function (events, callback, options) {
    const self = this;
    events.split(' ').forEach(function (evt) {
        self.$events.addEventListener(evt, getNativeListener.call(self, evt, callback), options);
    });
    return self;
};

const EventTarget = function () {
    const self = this;
    self._listeners = {};
    self.$events = document.createDocumentFragment();

    const delegate = function (method) {
        this[method] = self.$events[method].bind(self.$events);
    };
    const methods = [
        'addEventListener',
        'dispatchEvent',
        'removeEventListener'
    ];
    methods.forEach(delegate, self);

    const fill$events = function (method) {
        self.$events[method] = self[method].bind(self);
    };
    methods.push('on');
    methods.push('one');
    methods.push('off');
    methods.push('trigger');
    methods.forEach(fill$events, self);
};

const etProto = EventTarget.prototype;

etProto.on = function (events, callback, options) {
    const et = this;
    var arrEvents = null;
    if (options?.signal) {
        arrEvents = signalEvents.has(options.signal) ? signalEvents.get(options.signal) : [];
    }
    const map = onInternal.call(this, events, callback, options);
    if (options?.signal) {
        arrEvents.push({ "evt": events, "callback": callback });
    }
    if (options?.signal) {
        signalEvents.set(options.signal, arrEvents);
        options.signal.onabort = function () {
            signalEvents.get(options.signal).forEach(function (i) {
                et.off(i.evt, i.callback);                
            });
        }
    }
    return map
};

etProto.one = function (events, callback) {
    return onInternal.call(this, events, callback, { once: true });
};

etProto.off = function (events, callback) {
    const self = this;
    const eventList = events.split(' ');
    if (callback) {
        eventList.forEach(function (evt) {
            const stack = self._listeners[evt];
            if (stack && stack.has(callback)) {
                self.$events.removeEventListener(evt, stack.get(callback));
            }
        });
    }
    else {
        eventList.forEach(function (evt) {
            const stack = self._listeners[evt];
            if (stack) {
                stack.forEach(function (cb) {
                    self.$events.removeEventListener(evt, cb);
                });
                stack.clear();
            }
        });
    }
    return self;
};

etProto.trigger = function (type, options) {
    const self = this;
    //Compatibilidad hacia atrás
    if (window.$ && $.Event && type instanceof $.Event) {
        options = {};
        Object.keys(type).forEach(function (key) {
            if (key !== 'type') {
                options[key] = type[key];
            }
        });
        type = type.type;
    }
    var ceOptions;
    if (options) {
        ceOptions = {
            detail: options
        };
    }
    const event = new CustomEvent(type, ceOptions);
    self.dispatchEvent(event);
};

EventTarget._onBySelectorMap = new WeakMap();

EventTarget.listenerBySelector = function (selector, callback) {
    // Crea una estructura a partir de un mapa cuyas claves son los elementos.
    // Los valores son objetos cuyas claves son tipos de eventos
    // y cuyos valores son objetos que tienen como claves los selectores
    // y cuyos valores son las funciones de callback.
    // Se crea una función que va buscando la primera correspondencia con un selector.
    // En cuanto la encuentra, ejecuta el callback y deja de procesar.
    return function (e) {
        const element = this;
        const eventType = e.type;
        var eventTypes = EventTarget._onBySelectorMap.get(element);
        if (!eventTypes) {
            eventTypes = {};
            EventTarget._onBySelectorMap.set(element, eventTypes);
        }
        var selectors = eventTypes[eventType];
        if (!selectors) {
            eventTypes[eventType] = selectors = {};
        }
        if (!selectors[selector]) {
            selectors[selector] = callback;
        }
        // Para cada evento en cada elemento hay que llamar una sola vez al callback que toque.
        // Así que si se ejecuta un callback, prohibimos al resto de los listeners resolverse.
        if (!e._listenerBySelectorCalled) {
            var matches = false;
            var elm = e.target;
            var result;
            while (elm && elm !== element) {
                for (selector in selectors) {
                    if (elm.matches && elm.matches(selector)) {
                        matches = true;
                        result = selectors[selector].call(element, e);
                        e._listenerBySelectorCalled = true;
                    }
                }
                if (matches) {
                    return result;
                }
                elm = elm.parentNode;
            }
        }
    };
};

export default EventTarget;
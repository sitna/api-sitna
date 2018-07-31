TC.feature = TC.feature || {};
TC.Feature = function (coords, options) {
    var self = this;

    self.wrap = new TC.wrap.Feature();
    self.wrap.parent = self;

    if ($.isArray(coords)) {
        self.geometry = coords;
    }
    else if (self.wrap.isNative(coords)) {
        self.wrap.feature = coords;
        self.id = self.wrap.getId();
        self.geometry = self.wrap.getGeometry();
        self.folders = coords._folders;
        self.data = self.wrap.getData();
    }

    var opts = self.options = $.extend(true, {}, options);

    self.id = self.id || opts.id || TC.getUID();
    self.data = opts.data || self.data || null;
    self._visibilityState = TC.Consts.visibility.VISIBLE;
    if (opts.showsPopup === undefined) {
        self.showsPopup = true;
    }
    else {
        self.showsPopup = opts.showsPopup;
    }
    self.layer = opts.layer || null;
    self._selected = false;

    if (opts.selected) {
        self.select();
    }
};

TC.Feature.prototype.STYLETYPE = TC.Consts.geom.POLYGON;

TC.Feature.prototype.CLASSNAME = 'TC.Feature';

TC.Feature.prototype.getPath = function () {
    var result = [];
    var self = this;
    if (self.folders) {
        result = self.folders;
    }
    else if (self.options.group) {
        result = [self.options.group];
    }
    return result;
};

TC.Feature.prototype.setVisibility = function (visible) {
    var self = this;
    if ((visible && self._visibilityState === TC.Consts.visibility.NOT_VISIBLE) || (!visible && self._visibilityState === TC.Consts.visibility.VISIBLE)) {
        self._visibilityState = visible ? TC.Consts.visibility.VISIBLE : TC.Consts.visibility.NOT_VISIBLE;
        self.layer.wrap.setFeatureVisibility(self, visible);
    }
};

TC.Feature.prototype.setId = function (id) {
    var self = this;
    self.id = id;
    self.wrap.setId(id);
};

TC.Feature.prototype.getBounds = function () {
    return this.wrap.getBounds();
};

TC.Feature.prototype.setStyle = function (style) {
    this.wrap.setStyle(style);
};

TC.Feature.prototype.getLegend = function () {
    var self = this;
    if (!self._legend) {
        self._legend = self.wrap.getLegend();
    }
    return self._legend;
};

TC.Feature.prototype.getCoords = function () {
    return this.wrap.getGeometry();
};

TC.Feature.prototype.setCoords = function (coords) {
    const self = this;
    self.geometry = coords;
    return self.wrap.setGeometry(coords);
};

TC.Feature.prototype.getData = function () {
    var result = null;
    var self = this;
    if (self.data) {
        result = self.data;
    }
    else {
        result = self.wrap.getData();
    }
    return result;
};

TC.Feature.prototype.setData = function (data) {
    var self = this;
    self.data = $.extend(self.data, data);
    self.wrap.setData(data);
};

TC.Feature.prototype.getInfo = function () {
    var result = null;
    var self = this;
    var locale = self.layer && self.layer.map && TC.Util.getMapLocale(self.layer.map);
    var data = self.getData();
    if (typeof data === 'object') {
        var template = self.wrap.getTemplate();
        if (template) {
            // GLS: Contemplo en la expresión regular la opción de que el nombre del campo se componga de $[aaa/abc/loQueMeInteresa] 
            // (la expresión no está limitada a 2 niveles), hasta ahora se manejaba $[loQueMeInteresa]
            result = template.replace(/\$\[?(?:\w+\/)*(\w+)\]/g, function (match, p1) {
                return data[p1];
            });
        }
        else {
            var html = [];
            var openText = TC.Util.getLocaleString(locale, 'open');
            for (var key in data) {
                var value = data[key];
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'undefined') {
                    html[html.length] = '<tr><th>';
                    html[html.length] = key;
                    html[html.length] = '</th><td>';
                    var isUrl = TC.Util.isURL(value);
                    if (isUrl) {
                        html[html.length] = '<a href="';
                        html[html.length] = value;
                        html[html.length] = '" target="_blank">';
                        html[html.length] = openText;
                        html[html.length] = '</a>';
                    }
                    else {
                        html[html.length] = value !== void (0) ? TC.Util.formatNumber(value, locale) : '&mdash;';
                    }
                    html[html.length] = '</td></tr>';
                }
            }
            if (html.length > 0) {
                html.unshift('<table>');
                html[html.length] = '</table>';
                result = html.join('');
            }
        }
    }
    else if (typeof data === 'string') {
        result = data;
    }
    if (!result) {
        result = self.title;
        if (self.group) {
            result += ' ' + self.group;
        }
    }
    if (!result) {
        result = TC.Util.getLocaleString(locale, 'noData');
    }
    return result;
};

TC.Feature.prototype.clone = function () {
    var self = this;
    var nativeClone = self.wrap.cloneFeature();
    nativeClone._wrap = self.wrap;
    return new self.constructor(nativeClone, self.options);
};

TC.Feature.prototype.getStyle = function () {
    return this.wrap.getStyle();
};

TC.Feature.prototype.showPopup = function (control) {
    var self = this;
    if (self.layer && self.layer.map) {
        var ctlDeferred;
        var popup = control || self.popup;
        if (!popup) {
            // Buscamos un popup existente que no esté asociado a un control.
            var popups = self.layer.map.getControlsByClass('TC.control.Popup');
            for (var i = 0, len = popups.length; i < len; i++) {
                var p = popups[i];
                if (!p.caller) {
                    popup = p;
                    break;
                }
            }
        }
        if (popup) {
            ctlDeferred = $.Deferred();
            ctlDeferred.resolve(popup);
        }
        else {
            ctlDeferred = self.layer.map.addControl('popup');
        }
        ctlDeferred.then(function (ctl) {
            ctl.currentFeature = self;
            self.layer.map.getControlsByClass(TC.control.Popup).forEach(function (p) {
                if (p.isVisible()) {
                    p.hide();
                }
            });
            self.wrap.showPopup(ctl);
            self.layer.map.$events.trigger($.Event(TC.Consts.event.POPUP, { control: ctl }));
            ctl.fitToView(true);
        });
    }
};

TC.Feature.prototype.select = function () {
    var self = this;
    self._selected = true;
    if (self.layer) {
        self.layer.selectedFeatures.push(self);
    }
    var selectionOptions = self.options.selection || {};
    self.setStyle($.extend({}, TC.Cfg.styles.selection[self.STYLETYPE], selectionOptions[self.STYLETYPE]));
};

TC.Feature.prototype.unselect = function () {
    var self = this;
    self._selected = false;
    // Volvemos al estilo por defecto
    self.setStyle(self.options);

    if (self.layer) {
        var idx = $.inArray(self, self.layer.selectedFeatures);
        if (idx >= 0) {
            self.layer.selectedFeatures.splice(idx, 1);
        }
    }
};

TC.Feature.prototype.isSelected = function () {
    return this._selected;
};

TC.Feature.prototype.toGML = function (version,srsName) {
    return this.wrap.toGML(version,srsName);
};



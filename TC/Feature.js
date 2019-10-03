TC.feature = TC.feature || {};
TC.Feature = function (coords, options) {
    var self = this;

    self.wrap = new TC.wrap.Feature();
    self.wrap.parent = self;
    if (self.wrap.isNative(coords)) {
        self.wrap.feature = coords;
        coords._wrap = self.wrap;
        self.id = self.wrap.getId();
        self.geometry = self.wrap.getGeometry();
        if (coords._folders) {
            self.folders = coords._folders;
        }
        self.data = self.wrap.getData();
    }

    var opts = self.options = TC.Util.extend(true, {}, options);

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

    // Ocultamos el posible popup
    if (!visible && self.showsPopup && self.layer) {
        var popup = self.layer.map.getControlsByClass(TC.control.Popup).filter(function (popup) {
            return popup.currentFeature === self
        });

        if (popup.length > 0) {
            popup[0].hide();
        }
    }

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

TC.Feature.prototype.toggleSelectedStyle = function (condition) {
    this.wrap.toggleSelectedStyle(condition);
};

TC.Feature.prototype.getLegend = function () {
    var self = this;
    if (!self._legend) {
        self._legend = self.wrap.getLegend();
    }
    return self._legend;
};

TC.Feature.prototype.getCoords = function () {
    const self = this;
    self.geometry = self.wrap.getGeometry();
    return self.geometry;
};

TC.Feature.prototype.getCoordsArray = function () {
    const self = this;
    const isPoint = function (elm) {
        return Array.isArray(elm) && elm.length >= 2 && typeof elm[0] === 'number' && typeof elm[1] === 'number';
    };
    const flattenFn = function (val) {
        return isPoint(val) ? [val] : val.reduce(reduceFn, []);
    }
    const reduceFn = function (acc, elm) {
        if (isPoint(elm)) {
            acc[acc.length] = elm;
        }
        else {
            acc = acc.concat(flattenFn(elm));
        }
        return acc;
    };
    return flattenFn(self.getCoords());
};

TC.Feature.prototype.getGeometryStride = function () {
    const self = this;
    const coordsArray = self.getCoordsArray();
    const firstCoord = coordsArray[0];
    if (firstCoord) {
        return firstCoord.length;
    }
    return 0;
}


TC.Feature.prototype.setCoords = function (coords) {
    const self = this;

    const toNumberCoords = function (arr) {
        arr.forEach(function (elm, idx) {
            if (Array.isArray(elm)) {
                toNumberCoords(elm);
            }
            else {
                if (typeof elm !== 'number') {
                    console.log('Warning: coordinate does not have number type');
                    arr[idx] = parseFloat(elm);
                }
            }
        });
    };

    if (Array.isArray(coords)) {
        toNumberCoords(coords);
    }

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
    self.data = TC.Util.extend(self.data, data);
    self.wrap.setData(data);
};

TC.Feature.prototype.clearData = function () {
    var self = this;
    self.data = {};
    self.wrap.clearData();
};

TC.Feature.prototype.getInfo = function (options) {
    var result = null;
    var self = this;
    options = options || {};
    var locale = options.locale || (self.layer && self.layer.map && TC.Util.getMapLocale(self.layer.map));
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
            const hSlots = [];
            const openText = TC.Util.getLocaleString(locale, 'open');
            const titleText = TC.Util.getLocaleString(locale, 'linkInNewWindow');
            for (var key in data) {
                const value = data[key];
                const match = key.match(/^h(\d)_/i);
                if (match) {
                    hSlots[match[1]] = value;
                }
                else {
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'undefined') {
                        html[html.length] = '<tr><th>';
                        html[html.length] = key;
                        html[html.length] = '</th><td>';
                        var isUrl = TC.Util.isURL(value);
                        if (isUrl) {
                            html[html.length] = '<a href="';
                            html[html.length] = value;
                            html[html.length] = '" target="_blank" title="';
                            html[html.length] = titleText;
                            html[html.length] = '">';
                            html[html.length] = openText;
                            html[html.length] = '</a>';
                        }
                        else {
                            html[html.length] = value !== undefined ? TC.Util.formatNumber(value, locale) : '&mdash;';
                        }
                        html[html.length] = '</td></tr>';
                    }
                }
            }
            const headers = hSlots
                .map(function (val, idx) {
                    if (val) {
                        return '<h' + idx + '>' + val + '</h' + idx + '>';
                    }
                })
                .filter(function (val) {
                    return val;
                });
            if (headers.length) {
                html = headers.concat(html);
            }
            if (html.length > 0) {
                html.unshift('<table class="tc-attr">');
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
    const self = this;
    const map = (self.layer && self.layer.map) || (control && control.map);
    if (map) {
        var ctlPromise;
        var popup = control || self.popup;
        if (!popup) {
            // Buscamos un popup existente que no esté asociado a un control.
            var popups = map.getControlsByClass('TC.control.Popup');
            for (var i = 0, len = popups.length; i < len; i++) {
                var p = popups[i];
                if (!p.caller) {
                    popup = p;
                    break;
                }
            }
        }
        if (popup) {
            popup.currentFeature = self;
            ctlPromise = Promise.resolve(popup);
        }
        else {
            ctlPromise = map.addControl('popup');
        }
        ctlPromise.then(function (ctl) {            
            ctl.currentFeature = self;
            map.getControlsByClass(TC.control.Popup).forEach(function (p) {
                if (p.isVisible()) {
                    p.hide();
                }
            });
            self.wrap.showPopup(ctl);
            // Ajustamos el ancho del título al de la tabla de atributos
            const attrTable = ctl.contentDiv.querySelector("table.tc-attr");
            const headers = ctl.contentDiv.querySelectorAll("h1,h2,h3,h4,h5");
            if (attrTable && headers.length) {
                const maxWidth = attrTable.getBoundingClientRect().width + 'px';
                headers.forEach(function (h) {
                    h.style.maxWidth = maxWidth;
                });
            }
            map.trigger(TC.Consts.event.POPUP, { control: ctl });
            ctl.fitToView(true);
        });
    }
};

TC.Feature.prototype.showResultsPanel = function (control) {
    const self = this;
    const map = (self.layer && self.layer.map) || (control && control.map);
    if (map) {
        var ctlPromise;
        var panel = control;
        if (!panel) {
            // Buscamos un resultsPanel existente que no esté asociado a un control.
            var resultsPanels = map.getControlsByClass('TC.control.ResultsPanel').filter(function (ctrl) { return ctrl.options.content === "table" });
            for (var i = 0, len = resultsPanels.length; i < len; i++) {
                var p = resultsPanels[i];
                if (!p.caller) {
                    panel = p;
                    break;
                }
            }
        }
        if (panel) {
            panel.currentFeature = self;
            ctlPromise = Promise.resolve(panel);
        }
        else {
            var resultsPanelOptions = {
                content: "table"
            };            
            var controlContainer = map.getControlsByClass('TC.control.ControlContainer')[0];
            if (controlContainer) {
                resultsPanelOptions.side = controlContainer.SIDE.RIGHT;
                ctlPromise = controlContainer.addControl('resultsPanel', resultsPanelOptions);
            } else {
                resultsPanelOptions.div = document.createElement('div');
                map.div.appendChild(resultsPanelOptions.div);
                ctlPromise = map.addControl('resultsPanel', resultsPanelOptions);
            }
        }
        ctlPromise.then(function (ctl) {            
            ctl.currentFeature = self;

            // GLS: si contamos con el contenedor de controles no es necesario cerra el resto de paneles ya que no habrá solape excepto los paneles
            if (map.getControlsByClass(TC.control.ControlContainer).length === 0) {
                map.getControlsByClass(TC.control.ResultsPanel).filter(function (ctrl) { return ctrl.options.content === "table" }).forEach(function (p) {
                    p.close();
                });
            }

            // cerramos los paneles con feature asociada
            const panels = map.getControlsByClass('TC.control.ResultsPanel');
            panels.forEach(function (p) {
                if (p.currentFeature) {
                    p.close();
                }
            });

            if (ctl.div.querySelector('.tc-ctl-print-btn')) {
                ctl.div.querySelector('.tc-ctl-print-btn').remove();
            }
            ctl.menuDiv.innerHTML = '';
            ctl.open(self.getInfo({ locale: map.options.locale }), ctl.getInfoContainer());            

            var onViewChange = function (e) {
                map.off(TC.Consts.event.VIEWCHANGE, onViewChange);

                ctl.close();
            };
            map.on(TC.Consts.event.VIEWCHANGE, onViewChange);
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
    self.setStyle(TC.Util.extend({}, TC.Cfg.styles.selection[self.STYLETYPE], selectionOptions[self.STYLETYPE]));
};

TC.Feature.prototype.unselect = function () {
    const self = this;
    self._selected = false;
    // Volvemos al estilo por defecto
    self.setStyle(self.options);

    if (self.layer) {
        const idx = self.layer.selectedFeatures.indexOf(self);
        if (idx >= 0) {
            self.layer.selectedFeatures.splice(idx, 1);
        }
    }
};

TC.Feature.prototype.isSelected = function () {
    return this._selected;
};

TC.Feature.prototype.toGML = function (version, srsName) {
    return this.wrap.toGML(version, srsName);
};



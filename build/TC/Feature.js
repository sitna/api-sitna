TC.feature = TC.feature || {};
TC.Feature = function (coords, options) {
    var self = this;

    let olFeatureId;
    self.wrap = new TC.wrap.Feature();
    self.wrap.parent = self;
    if (self.wrap.isNative(coords)) {
        self.wrap.feature = coords;
        coords._wrap = self.wrap;
        olFeatureId = self.wrap.getId();
        self.geometry = self.wrap.getGeometry();
        if (coords._folders) {
            self.folders = coords._folders;
        }
        self.setData(self.wrap.getData());
    }

    var opts = self.options = TC.Util.extend(true, {}, options);

    self.id = olFeatureId || opts.id || TC.getUID();
    if (self.wrap.feature && !olFeatureId) {
        self.wrap.feature.setId(self.id);
    }
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
            const p = popup[0];
            if (p.isVisible()) {
                p.hide();
            }
        }
    }

    if ((visible && self._visibilityState === TC.Consts.visibility.NOT_VISIBLE) || (!visible && self._visibilityState === TC.Consts.visibility.VISIBLE)) {
        self._visibilityState = visible ? TC.Consts.visibility.VISIBLE : TC.Consts.visibility.NOT_VISIBLE;
        self.layer.wrap.setFeatureVisibility(self, visible);
    }
};

TC.Feature.prototype.getId = function () {
    return this.wrap.getId();
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
    const self = this;
    if (self._hasSelectedStyle != condition) {
        self._hasSelectedStyle = condition;
        self.wrap.toggleSelectedStyle(condition);
    }
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
            acc.push(elm);
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
                if (elm === null) {
                    arr[idx] = 0;
                }
                else if (typeof elm !== 'number') {
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
    const self = this;
    if (typeof data === 'string') {
        self.data = data;
    }
    else {
        self.data = TC.Util.extend(self.data, data);
        self.attributes = self.attributes || [];
        for (var key in data) {
            let attr = self.attributes.filter(attr => attr.name === key)[0];
            if (attr) {
                attr.value = data[key];
            }
            else {
                self.attributes.push({ name: key, value: data[key] });
            }
        }
        self.wrap.setData(data);
    }
};

TC.Feature.prototype.unsetData = function (key) {
    const self = this;
    delete self.data[key];
    const attr = (self.attributes || []).filter(attr => attr.name === key)[0];
    if (attr) {
        self.attributes.splice(self.attributes.indexOf(attr), 1);
    }
    self.wrap.unsetData(key);
};

TC.Feature.prototype.clearData = function () {
    const self = this;
    self.data = {};
    self.attributes = [];
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
            const formatValue = function (value) {
                let result;
                var isUrl = TC.Util.isURL(value);
                if (isUrl) {
                    result = `<a href="${value}" target="_blank" title="${titleText}">${openText}</a>`;
                }
                else {
                    result = value !== undefined ? (typeof (value) === "number" ? TC.Util.formatNumber(value, locale):value) : '&mdash;';
                }
                return result;
            }
            const recursiveFn = function (data) {
                var html = [];
                if (data instanceof Array) {
                    var id = 'complexAttr_' + TC.getUID()
                    html.push(`<div class="complexAttr"><input type="checkbox" id="${id}" /><div><label for="${id}" title="" class="plus"></label>`);
                    html.push(`<label for="${id}" title="" class="title">${data.length} ${TC.Util.getLocaleString(locale, 'featureInfo.complexData.array')}</label><br/>`);
                    html.push('<table class="complexAttr"><tbody>');
                    for (var i = 0; i < data.length; i++) {
                        html.push('<tr><td>');
                        html = html.concat(recursiveFn(data[i]));
                        html.push('</td></tr>');
                    }
                    html.push('</tbody></table></div></div>');
                } else if (data instanceof Object) {
                    if (data.getType) {
                        const tttt = {
                            type: data.getType(),
                            coordinates: data.getCoordinates()
                        };
                        html = html.concat(recursiveFn(tttt));
                    }
                    else {
                        html.push('<table class="complexAttr"><tbody>');
                        for (var i in data) {
                            html.push('<tr>');
                            if (data[i] && data[i] instanceof Array) {

                                html.push(`<th style="display:none">${i}</th>
                                           <td><label for="${id}" class="title">${i}</label><br/>`);
                                html = html.concat(recursiveFn(data[i]));
                                html.push('</div></td>');
                            }
                            else if (data[i] && data[i] instanceof Object) {
                                //if(data[i] && Object.entries(data[i]).some((item)=>{return item[1] instanceof Object})){						
                                var id = 'complexAttr_' + TC.getUID()
                                html.push(`<th style="display:none">${i}</th>
                                           <td><input type="checkbox" id="${id}" /><div><label for="${id}" title="" class="plus"></label>`);
                                html.push(`<label for="${id}" title="" class="title">${i}</label><br/>`);
                                html = html.concat(recursiveFn(data[i]));
                                html.push('</div></td>');
                            }
                            else {
                                html.push(`<th class="key">${i}</th>
                                           <td class="value">`);
                                html = html.concat(recursiveFn(data[i]));
                                html.push('</td>');
                            }
                            html.push('</tr>');
                        }
                        html.push('</tbody></table>');
                    }
                } else {
                    html.push(formatValue(data));
                }
                return html;
            };
            for (var key in data) {
                const value = data[key];
                const match = key.match(/^h(\d)_/i);
                if (match) {
                    hSlots[match[1]] = value;
                }
                else {
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'undefined') {
                        html.push(`<tr><th>${key}</th><td>${formatValue(value)}</td></tr>`);
                    }
                    else {
                        html.push(`<tr><th>${key}</th><td>`);
                        html = html.concat(recursiveFn(value))
                        html.push('</td></tr>');

                    }
                }
            }
            const headers = hSlots
                .map(function (val, idx) {
                    if (val) {
                        return `<h${idx}>${val}</h${idx}>`;
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
                html.push('</table>');
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

TC.Feature.prototype.getTemplate = function () {
    const self = this;
    let result = self.wrap.getTemplate();
    if (result) {
        return result;
    }
    return null;
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

TC.Feature.prototype.showPopup = async function (options) {
    const self = this;
    options = options || {};
    const control = options && options instanceof TC.Control ? options : options.control;
    const map = (self.layer && self.layer.map) || (control && control.map);
    if (map) {
        let popup = control || self.popup;
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
        if (!popup) {
            popup = await map.addControl('popup');
        }
        popup.currentFeature = self;
        map.getControlsByClass(TC.control.Popup)
            .filter(p => p !== popup && p.isVisible())
            .forEach(p => p.hide());
        self.wrap.showPopup(Object.assign({}, options, { control: popup }));
        map.trigger(TC.Consts.event.POPUP, { control: popup });
        popup.fitToView(true);
        popup.contentDiv.querySelectorAll('img').forEach(img => img.addEventListener('load', () => popup.fitToView()));
        return popup;
    }
    return null;
};

TC.Feature.prototype.showResultsPanel = async function (options) {
    const self = this;
    options = options || {};
    const control = options && options instanceof TC.Control ? options : options.control;
    const map = (self.layer && self.layer.map) || (control && control.map);
    if (map) {
        let panel;

        var resultsPanelOptions = {
            content: "table",
            titles: {
                main: TC.Util.getLocaleString(map.options.locale, "rsp.title"),
                max: TC.Util.getLocaleString(map.options.locale, "rsp.title")
            }
        };
        var controlContainer = map.getControlsByClass('TC.control.ControlContainer')[0];
        if (controlContainer) {
            resultsPanelOptions.position = controlContainer.POSITION.RIGHT;
            panel = await controlContainer.addControl('resultsPanel', resultsPanelOptions);
        } else {
            resultsPanelOptions.div = document.createElement('div');
            map.div.appendChild(resultsPanelOptions.div);
            panel = await map.addControl('resultsPanel', resultsPanelOptions);
        }

        panel.currentFeature = self;

        // GLS: si contamos con el contenedor de controles no es necesario cerra el resto de paneles ya que no habrá solape excepto los paneles
        if (map.getControlsByClass(TC.control.ControlContainer).length === 0) {
            map.getControlsByClass(TC.control.ResultsPanel).filter(function (ctrl) { return ctrl.options.content === "table" }).forEach(function (p) {
                p.close();
            });
        }

        // cerramos los paneles con feature asociada que no sean gráfico
        const panels = map.getControlsByClass('TC.control.ResultsPanel');
        panels.forEach(function (p) {
            if (p.currentFeature && !p.chart) {
                p.close();
            }
        });

        panel.menuDiv.innerHTML = '';
        panel.open(options.html || self.getInfo({ locale: map.options.locale }), panel.getInfoContainer());

        var onViewChange = function (e) {
            map.off(TC.Consts.event.VIEWCHANGE, onViewChange);

            panel.close();
        };
        map.on(TC.Consts.event.VIEWCHANGE, onViewChange);
        return panel;
    }
    return null;
};

TC.Feature.prototype.showInfo = function (options) {
    const self = this;
    options = options || {};

    TC.loadJS(
        !TC.control || !TC.control.FeatureInfoCommons,
        TC.apiLocation + 'TC/control/FeatureInfoCommons',
        async function () {
            let html;
            if (self.getTemplate()) {
                html = self.getInfo();
            }
            else {
                if (typeof self.data === 'string') {
                    html = self.data;
                }
                else {
                    html = await TC.control.FeatureInfoCommons.renderFeatureAttributeTable({ attributes: self.attributes, singleFeature: true });
                }
            }
            const opts = TC.Util.extend({}, options, { html: html });
            let control;
            if (options.control && TC.control) {
                const optionsControl = options.control;
                if (optionsControl instanceof TC.control.Popup) {
                    control = await self.showPopup(opts);
                }
                else if (optionsControl instanceof TC.control.ResultsPanel) {
                    control = await self.showResultsPanel(opts);
                }
            }
            else {
                if (self.layer.map.on3DView || self.layer.map.defaultInfoContainer === TC.Consts.infoContainer.RESULTS_PANEL) {
                    control = await self.showResultsPanel(opts);
                }
                else {
                    control = await self.showPopup(opts);
                }
            }

            TC.control.FeatureInfoCommons.addSpecialAttributeEventListeners(control.getContainerElement());
        }
    );
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



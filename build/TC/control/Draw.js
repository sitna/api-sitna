TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}
if (!TC.Feature || !TC.feature.Point) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Point');
}
if (!TC.Feature || !TC.feature.Polyline) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Polyline');
}
if (!TC.Feature || !TC.feature.Polygon) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Polygon');
}

TC.Consts.event.DRAWSTART = 'drawstart.tc';
TC.Consts.event.DRAWEND = 'drawend.tc';
TC.Consts.event.DRAWCANCEL = 'drawcancel.tc';
TC.Consts.event.DRAWUNDO = 'drawundo.tc';
TC.Consts.event.DRAWREDO = 'drawredo.tc';
TC.Consts.event.POINT = 'point.tc';
TC.Consts.event.MEASURE = 'measure.tc';
TC.Consts.event.MEASUREPARTIAL = 'measurepartial.tc';
TC.Consts.event.STYLECHANGE = 'stylechange.tc';
TC.Consts.event.CHANGE = 'change';

(function () {

    const formatColor = function (color) {
        const match = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
        if (match && match.length) {
            return '#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3];
        }
        return color;
    };

    TC.control.Draw = function () {
        var self = this;

        TC.Control.apply(self, arguments);

        if (!TC.browserFeatures.inputTypeColor() && !window.CP) {
            TC.loadCSS(TC.apiLocation + 'lib/color-picker/color-picker.min.css');
            TC.syncLoadJS(TC.apiLocation + 'lib/color-picker/color-picker.min.js');
        }

        self._classSelector = '.' + self.CLASS;

        self._pointClass = self.CLASS + '-point';
        self._lineClass = self.CLASS + '-line';
        self._polygonClass = self.CLASS + '-polygon';

        self.history = [];
        self.historyIndex = 0;
        self.exportsState = true;

        self
            .on(TC.Consts.event.DRAWSTART, function (e) {
                self.resetValues();
            })
            .on(TC.Consts.event.POINT, function (e) {
                if (self.layer && !self.persistent && self.layer.features && self.layer.features.length > 0) {
                    self.layer.clearFeatures();
                }

                self.history.length = self.historyIndex;
                self.history[self.historyIndex++] = e.point;

                setDrawState(self);
            })
            .on(TC.Consts.event.DRAWEND, function (e) {
                setFeatureAddReadyState(self);

                e.feature.setId(TC.getUID(self.getLocaleString('sketch') + '.'));

                if (self.callback) {
                    self.callback(e.feature);
                }
            });

        self._layerPromise = null;
    };

    TC.inherit(TC.control.Draw, TC.Control);

    var ctlProto = TC.control.Draw.prototype;

    ctlProto.CLASS = 'tc-ctl-draw';

    var setDrawState = function (ctl) {
        ctl._endBtn.disabled =
            ctl.historyIndex === 0 ||
            (ctl.mode === TC.Consts.geom.POLYGON && ctl.historyIndex < 3) ||
            (ctl.mode === TC.Consts.geom.POLYLINE && ctl.historyIndex < 2);
        ctl._redoBtn.disabled = ctl.history.length === ctl.historyIndex;
        ctl._undoBtn.disabled = ctl.historyIndex === 0;
    };

    var setFeatureAddReadyState = function (ctl) {
        ctl.resetValues();
        ctl._endBtn.disabled = true;
        ctl._cancelBtn.disabled = false;
    };

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-draw.hbs";

    ctlProto.render = function (callback) {
        const self = this;
        let strToolTip;
        let strokeColor;
        let strokeWidth;
        switch (self.options.mode) {
            case TC.Consts.geom.POLYLINE:
            case TC.Consts.geom.MULTIPOLYLINE:
                strToolTip = self.getLocaleString('drawLine');
                self.div.classList.add(self._lineClass);
                strokeColor = self.styles.line.strokeColor;
                strokeWidth = self.styles.line.strokeWidth;
                break;
            case TC.Consts.geom.POLYGON:
            case TC.Consts.geom.MULTIPOLYGON:
                strToolTip = self.getLocaleString('drawPolygon');
                self.div.classList.add(self._polygonClass);
                strokeColor = self.styles.polygon.strokeColor;
                strokeWidth = self.styles.polygon.strokeWidth;
                break;
            case TC.Consts.geom.POINT:
            case TC.Consts.geom.MULTIPOINT:
                strToolTip = self.getLocaleString('drawPoint');
                self.div.classList.add(self._pointClass);
                strokeColor = self.styles.point.strokeColor;
                strokeWidth = self.styles.point.strokeWidth;
                break;
            default:
                strToolTip = self.getLocaleString('draw');
                strokeColor = self.styles.line.strokeColor;
                strokeWidth = self.styles.line.strokeWidth;
                break;
        }
        const renderObject = {
            tooltip: strToolTip,
            strokeColor: formatColor(strokeColor),
            strokeWidth: strokeWidth,
            styling: self.options.styling
        };
        return self._set1stRenderPromise(self.renderData(renderObject, function () {
            if (!TC.browserFeatures.inputTypeColor()) {
                // El navegador no soporta input[type=color], usamos polyfill
                const input = self.div.querySelector('input[type=color]');
                if (input) {
                    input.style.backgroundColor = input.value;
                    input.style.color = 'transparent';
                    const picker = new CP(input, 'click', document.body);

                    input.onclick = function (e) {
                        e.preventDefault();
                    };

                    // Evitamos que salga el teclado virtual en iOS
                    input.onfocus = function (e) {
                        this.blur();
                    };

                    input.onchange = function (e) {
                        this.style.backgroundColor = this.value;
                    };

                    self.map.loaded(function () {
                        picker.on("change", function (color) {
                            self.setStrokeColor('#' + color);
                        });
                    });
                }
            }
            self.reset = true;
            self.callback = null;
            self.measure = false;
            self._cancelClick = false;

            self.mode = self.options.mode || TC.Consts.geom.POLYLINE;

            if (self.options.measure)
                self.measure = self.options.measure
            if (TC.Util.isFunction(self.options.callback))
                self.callback = self.options.callback;
            if (self.options.persistent === undefined) {
                self.persistent = true;
            }
            else {
                self.persistent = self.options.persistent;
            }

            self.wrap = new TC.wrap.control.Draw(self);

            self._newBtn = self.div.querySelector(self._classSelector + '-btn-new');
            self._newBtn.addEventListener(TC.Consts.event.CLICK, function () {
                self.new();
            }, { passive: true });

            self._cancelBtn = self.div.querySelector(self._classSelector + '-btn-cancel');
            self._cancelBtn.addEventListener(TC.Consts.event.CLICK, function () {
                self.cancel();
            }, { passive: true });

            self._endBtn = self.div.querySelector(self._classSelector + '-btn-end');
            self._endBtn.addEventListener(TC.Consts.event.CLICK, function () {
                self.end();
            }, { passive: true });

            self._undoBtn = self.div.querySelector(self._classSelector + '-btn-undo');
            self._undoBtn.addEventListener(TC.Consts.event.CLICK, function () {
                self.undo();
            }, { passive: true });

            self._redoBtn = self.div.querySelector(self._classSelector + '-btn-redo');
            self._redoBtn.addEventListener(TC.Consts.event.CLICK, function () {
                self.redo();
            }, { passive: true });

            if (self.options.styling) {
                self._strokeColorPicker = self.div.querySelector(self._classSelector + '-str-c');
                self._strokeColorPicker.addEventListener(TC.Consts.event.CHANGE, function (e) {
                    self.setStrokeColor(e.target.value);
                });

                self._strokeWidthSelector = self.div.querySelector(self._classSelector + '-str-w');
                self._strokeWidthSelector.addEventListener(TC.Consts.event.CHANGE, function (e) {
                    self.setStrokeWidth(e.target.value);
                });
                self._strokeWidthWatch = self.div.querySelector(self._classSelector + '-str-w-watch');
            }

            if (TC.Util.isFunction(callback)) {
                callback();
            }
        }));
    };

    ctlProto.register = function (map) {
        const self = this;
        self.styles = TC.Util.extend(true, {}, map.options.styles, self.options.styles);
        const result = TC.Control.prototype.register.call(self, map);

        self.map
            .on(TC.Consts.event.VIEWCHANGE, function () {
                if (self.map.view === TC.Consts.view.PRINTING) {
                    self.end();

                    // No lanzo el evento porque da error al no llegar una feature
                    // self.trigger(TC.Consts.event.DRAWEND);
                }
            })
            .on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
                self.history.forEach(function (point, idx, arr) {
                    arr[idx] = TC.Util.reproject(point, e.oldCrs, e.newCrs);
                });
            });

        self._layerPromise = new Promise(function (resolve, reject) {
            map.loaded(function () {
                if (self.options.layer) {
                    self.setLayer(self.options.layer);
                    resolve(self.layer);
                }
                else {
                    // Si self.options.layer === false se instancia el control sin capa asociada
                    if (self.options.layer === false) {
                        self.setLayer(null);
                        resolve(null);
                    }
                    else {
                        map.addLayer({
                            id: self.getUID(),
                            title: 'DrawControl',
                            stealth: true,
                            owner: self,
                            type: TC.Consts.layerType.VECTOR,
                            styles: {
                                point: self.styles.point,
                                line: self.styles.line,
                                polygon: self.styles.polygon
                            }
                        }).then(function (layer) {
                            map.putLayerOnTop(layer);
                            self.setLayer(layer);
                            resolve(self.layer);
                        });
                    }
                }
            });
        });

        return result;
    };

    ctlProto.new = function () {
        var self = this;
        if (self.layer && !self.persistent) {
            self.layer.clearFeatures();
        }
        self._cancelBtn.disabled = false;
        self.setMode(self.mode, true);
        return self;
    };

    ctlProto.undo = function () {
        var self = this;
        var result = self.wrap.undo();
        if (result) {
            self.historyIndex--;
            setDrawState(self);

            if (self.historyIndex <= 0) {
                self.resetValues();
            }
            self.trigger(TC.Consts.event.DRAWUNDO);
        }

        return result;
    };

    ctlProto.redo = function () {
        var self = this;
        var result = this.wrap.redo();
        if (result) {
            self.historyIndex++;
            setDrawState(self);
            self.trigger(TC.Consts.event.DRAWREDO);
        }
        return result;
    };

    ctlProto.cancel = function () {
        var self = this;
        self._cancelClick = true;
        this.setMode(null, false);
        self.resetValues();
        setFeatureAddReadyState(self);
        self._cancelBtn.disabled = true;
        self.trigger(TC.Consts.event.DRAWCANCEL, { ctrl: self });
        return self;
    };

    ctlProto.activate = function () {
        var self = this;
        self._newBtn.classList.add(TC.Consts.classes.ACTIVE);
        self._cancelBtn.disabled = false;
        TC.Control.prototype.activate.call(self);
        self.wrap.activate(self.mode);
        self.div.classList.remove(self._pointClass, self._lineClass, self._polygonClass);
        switch (self.mode) {
            case TC.Consts.geom.POINT:
                self.div.classList.add(self._pointClass);
                break;
            case TC.Consts.geom.POLYLINE:
                self.div.classList.add(self._lineClass);
                break;
            case TC.Consts.geom.POLYGON:
                self.div.classList.add(self._polygonClass);
                break;
            default:
                break;
        }

    };

    ctlProto.deactivate = function () {
        var self = this;
        if (self._newBtn) {
            self._newBtn.classList.remove(TC.Consts.classes.ACTIVE);
        }
        if (self._cancelBtn) {
            self._cancelBtn.disabled = true;
        }
        TC.Control.prototype.deactivate.call(self, !self._cancelClick);
        if (self.wrap) {
            self.wrap.deactivate();
        }
        self.resetValues();
        //self.trigger(TC.Consts.event.DRAWCANCEL, { ctrl: self });
        self._cancelClick = false;
    };

    ctlProto.clear = function () {
        const self = this;
        if (self.layer) {
            self.layer.clearFatures();
        }
        self.resetValues();
        return self;
    };

    ctlProto.isExclusive = function () {
        return true;
    };

    ctlProto.end = function () {
        const self = this;
        self.wrap.end();
        self.resetValues();
        return self;
    };

    ctlProto.setMode = function (mode, activate) {
        const self = this;

        if (mode)
            self.mode = mode;

        if (activate && mode) {
            //if (self.layer) {
                //self.layer.map.putLayerOnTop(self.layer);
            //}
            self.activate();
        }
        else {
            self.deactivate();
        }
        return self;
    };

    ctlProto.setStyle = function (style) {
        const self = this;
        if (style) {
            self.style = TC.Util.extend(self.style, style);
        }
        else {
            switch (self.options.mode) {
                case TC.Consts.geom.POLYLINE:
                case TC.Consts.geom.MULTIPOLYLINE:
                    style = { line: self.styles.line };
                    break;
                case TC.Consts.geom.POLYGON:
                case TC.Consts.geom.MULTIPOLYGON:
                    style = { polygon: self.styles.polygon };
                    break;
                case TC.Consts.geom.POINT:
                case TC.Consts.geom.MULTIPOINT:
                    style = { point: self.styles.point };
                    break;
                default:
                    style = {};
                    break;
            }
        }
        if (self.isActive) {
            self.wrap.setStyle(style);
        }
    };

    ctlProto.getModeStyle = function(mode) {
        const self = this;
        mode = mode || self.options.mode;
        switch (mode) {
            case TC.Consts.geom.POLYLINE:
            case TC.Consts.geom.MULTIPOLYLINE:
                return self.styles.line;
            case TC.Consts.geom.POLYGON:
            case TC.Consts.geom.MULTIPOLYGON:
                return self.styles.polygon;
            case TC.Consts.geom.POINT:
            case TC.Consts.geom.MULTIPOINT:
                return self.styles.point;
            default:
                return null;
                break;
        }
    };

    ctlProto.setStrokeColorWatch = function (color) {
        const self = this;
        if (self.options.styling) {
            if (color === undefined) {
                color = self.getModeStyle().strokeColor;
            }
            const match = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
            if (match && match.length) {
                color = '#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3];
            }
            self._strokeColorPicker.value = color;
            if (!TC.browserFeatures.inputTypeColor()) {
                const input = self._strokeColorPicker;
                input.style.backgroundColor = color;
                input.blur();
            }
        }
        return self;
    };

    ctlProto.setStrokeColor = function (color) {
        const self = this;
        const style = self.getModeStyle();
        if (style) {
            style.strokeColor = color;
        }

        // Resetea el estilo
        if (self.isActive) {
            self.setStyle();
        }

        self.setStrokeColorWatch(color);
        self.trigger(TC.Consts.event.STYLECHANGE, { property: 'strokeColor', value: color });
        return self;
    };

    ctlProto.setStrokeWidthWatch = function (width) {
        const self = this;
        if (self.options.styling) {
            if (width === undefined) {
                width = self.getModeStyle().strokeWidth;
            }
            width = parseInt(width, 10);
            if (width !== Number.NaN) {
                self._strokeWidthSelector.value = width;
                self._strokeWidthWatch.style.borderBottomWidth = width + 'px';
            }
        }
        return self;
    };

    ctlProto.setStrokeWidth = function(width) {
        const self = this;
        width = parseInt(width, 10);
        if (width !== Number.NaN) {
            const style = self.getModeStyle();
            if (style) {
                style.strokeWidth = width;
            }

            // Resetea el estilo
            if (self.isActive) {
                self.setStyle();
            }

            self.setStrokeWidthWatch(width);
            self.trigger(TC.Consts.event.STYLECHANGE, { property: 'strokeWidth', value: width });
        }
        return self;
    };

    ctlProto.getLayer = function () {
        const self = this;
        if (self.layer) {
            return Promise.resolve(self.layer);
        }
        return this._layerPromise;
    };

    ctlProto.setLayer = function (layer) {
        const self = this;
        if (self.map) {
            if (typeof (layer) === "string") {
                self.layer = self.map.getLayer(layer);
            }
            else {
                self.layer = layer;
            }

            self.styles = {};
            const layerStyles = (self.layer && self.layer.styles) || TC.Cfg.styles;
            TC.Util.extend(true, self.styles, self.options.styles || layerStyles);

        }
    };

    ctlProto.resetValues = function () {
        const self = this;
        self.history.length = 0;
        self.historyIndex = 0;
        setDrawState(self);
        return self;
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.exportsState && self.layer) {
            return {
                id: self.id,
                layer: self.layer.exportState()
            };
        }
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;
        self.getLayer().then(function (layer) {
            layer.importState(state.layer);
        });
    };
})();
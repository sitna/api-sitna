TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.Consts.event.BEFOREFEATUREMODIFY = "beforefeaturemodify.tc";
TC.Consts.event.FEATUREMODIFY = "featuremodify.tc";
TC.Consts.event.FEATURESSELECT = "featuresselect.tc";
TC.Consts.event.FEATURESUNSELECT = "featuresunselect.tc";
TC.Consts.event.CHANGE = 'change';

(function () {

    TC.control.Modify = function () {
        var self = this;

        TC.Control.apply(self, arguments);

        if (!Modernizr.inputtypes.color && !window.CP) {
            TC.loadCSS(TC.apiLocation + 'lib/color-picker/color-picker.min.css');
            TC.syncLoadJS(TC.apiLocation + 'lib/color-picker/color-picker.min.js');
        }

        self.styles = $.extend(true, TC.Cfg.styles.selection, self.options.styles);
        self.styles.text = self.styles.text || {
            fontSize: self.styles.line.fontSize,
            fontColor: self.styles.line.fontColor,
            labelOutlineColor: self.styles.line.labelOutlineColor,
            labelOutlineWidth: self.styles.line.labelOutlineWidth
        };

        self._classSelector = '.' + self.CLASS;

        self.wrap = new TC.wrap.control.Modify(self);
    };

    TC.inherit(TC.control.Modify, TC.Control);

    var ctlProto = TC.control.Modify.prototype;

    ctlProto.CLASS = 'tc-ctl-mod';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/Modify.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<button class=\"tc-ctl-btn tc-ctl-mod-btn-select\" disabled title=\"").h("i18n", ctx, {}, { "$key": "select" }).w("\">").h("i18n", ctx, {}, { "$key": "select" }).w("</button><button class=\"tc-ctl-btn tc-ctl-mod-btn-delete\" disabled title=\"").h("i18n", ctx, {}, { "$key": "deleteSelection" }).w("\">").h("i18n", ctx, {}, { "$key": "deleteSelection" }).w("</button><button class=\"tc-ctl-btn tc-ctl-mod-btn-join\" disabled title=\"").h("i18n", ctx, {}, { "$key": "joinGeometries.tooltip" }).w("\">").h("i18n", ctx, {}, { "$key": "joinGeometries" }).w("</button><button class=\"tc-ctl-btn tc-ctl-mod-btn-split\" disabled title=\"").h("i18n", ctx, {}, { "$key": "splitGeometry" }).w("\">").h("i18n", ctx, {}, { "$key": "splitGeometry" }).w("</button><button class=\"tc-ctl-btn tc-ctl-mod-btn-text\" contenteditable=\"true\" disabled title=\"").h("i18n", ctx, {}, { "$key": "addText" }).w("\">").h("i18n", ctx, {}, { "$key": "addText" }).w("</button><div class=\"tc-ctl-mod-style tc-hidden\"><input type=\"text\" class=\"tc-ctl-mod-txt tc-textbox\" placeholder=\"").h("i18n", ctx, {}, { "$key": "writeTextForSketch" }).w("\" style=\"font-size:").f(ctx.get(["fontSize"], false), ctx, "h").w("pt;font-color:").f(ctx.get(["fontColor"], false), ctx, "h").w(";text-shadow: 0 0 ").f(ctx.get(["labelOutlineWidth"], false), ctx, "h").w("px ").f(ctx.get(["labelOutlineColor"], false), ctx, "h").w(";\" />").h("i18n", ctx, {}, { "$key": "textColor" }).w("<input type=\"color\" class=\"tc-ctl-mod-fnt-c\" value=\"").f(ctx.get(["fontColor"], false), ctx, "h").w("\" />").h("i18n", ctx, {}, { "$key": "fontSize" }).w("<input type=\"number\" class=\"tc-ctl-mod-fnt-s tc-textbox\" value=\"").f(ctx.get(["fontSize"], false), ctx, "h").w("\" min=\"7\" max=\"20\" /></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    const setFeatureSelectedState = function (ctl, features) {
        ctl._deleteBtn.disabled = features.length === 0;
        ctl._joinBtn.disabled = features.length < 2;
        ctl._splitBtn.disabled = features.filter(complexGeometryFilter).length === 0;
        ctl.displayLabelText();
    };

    const styleFunction = function (feature, mapStyles) {
        var result;
        switch (true) {
            case TC.feature.Polygon && feature instanceof TC.feature.Polygon:
            case TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon:
                result = $.extend({}, mapStyles.polygon);
                break;
            case TC.feature.Point && feature instanceof TC.feature.Point:
            case TC.feature.MultiPoint && feature instanceof TC.feature.MultiPoint:
                result = $.extend({}, mapStyles.point);
                break;
            default:
                result = $.extend({}, mapStyles.line);
                break;
        }
        const style = feature.getStyle();
        if (style.label) {
            result.label = style.label;
            result.fontSize = style.fontSize;
            result.fontColor = style.fontColor;
            result.labelOutlineColor = style.labelOutlineColor;
            result.labelOutlineWidth = style.labelOutlineWidth;
        }
        return result;
    };

    //const setFeatureSelectedStyle = function (ctl, features) {
    //    const mapStyles = ctl.map.options.styles.selection;
    //    features.forEach(function (feature) {
    //        feature._originalStyle = $.extend({}, feature.getStyle());
    //        feature.setStyle(ctl.styleFunction(feature));
    //    });
    //};

    //const setFeatureUnselectedStyle = function (ctl, features) {
    //    features.forEach(function (feature) {
    //        if (feature._originalStyle) {
    //            const style = feature.getStyle();
    //            if (style.label) {
    //                const originalStyle = feature._originalStyle;
    //                originalStyle.label = style.label;
    //                originalStyle.fontSize = style.fontSize;
    //                originalStyle.fontColor = style.fontColor;
    //                originalStyle.labelOutlineColor = style.labelOutlineColor;
    //                originalStyle.labelOutlineWidth = style.labelOutlineWidth;
    //            }
    //            feature.setStyle(feature._originalStyle);
    //            feature._originalStyle = undefined;
    //        }
    //    })
    //};

    const complexGeometryFilter = function (elm) {
        var result = false;
        if ((TC.feature.MultiPolygon && elm instanceof TC.feature.MultiPolygon) ||
            (TC.feature.MultiPolyline && elm instanceof TC.feature.MultiPolyline)) {
            if (elm.geometry.length > 1) {
                result = true;
            }
        }
        return result;
    };

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);
        if (self.options.layer) {

            self.setLayer(self.options.layer);

            map
                .on(TC.Consts.event.FEATUREADD + ' ' + TC.Consts.event.FEATURESADD, function (e) {
                    Promise.all([self.getLayer(), self.renderPromise()]).then(function (objects) {
                        const layer = objects[0];
                        if (e.layer === layer) {
                            self._selectBtn.disabled = false;
                            self._textBtn.disabled = false;
                        }
                    });
                })
                .on(TC.Consts.event.FEATUREREMOVE + ' ' + TC.Consts.event.FEATURESCLEAR, function (e) {
                    const layer = e.layer;
                    const feature = e.feature;
                    Promise.all([self.getLayer(), self.renderPromise()]).then(function (objects) {
                        if (layer === objects[0]) {
                            if (feature) {
                                self.unselectFeatures([feature]);
                            }
                            else {
                                self.unselectFeatures();
                            }
                            setFeatureSelectedState(self, self.getSelectedFeatures());
                            if (self.layer.features.length === 0) {
                                self._selectBtn.disabled = true;
                                self.setTextMode(false);
                                self._textBtn.disabled = true;
                            }
                        }
                    });
                });

            const featureSelectUpdater = function () {
                const selectedFeatures = self.getSelectedFeatures();
                setFeatureSelectedState(self, selectedFeatures);
                const unselectedFeatures = self.layer.features.filter(function (feature) {
                    return selectedFeatures.indexOf(feature) < 0;
                });
                unselectedFeatures.forEach(function (feature) {
                    feature.toggleSelectedStyle(false);
                });
                selectedFeatures.forEach(function (feature) {
                    feature.toggleSelectedStyle(true);
                });
            };
            self
                .on(TC.Consts.event.FEATURESSELECT, featureSelectUpdater)
                .on(TC.Consts.event.FEATURESUNSELECT, featureSelectUpdater);
        }

        return result;
    };

    ctlProto.render = function (callback) {
        const self = this;

        const renderCallback = function () {
            self._selectBtn = self.div.querySelector('.' + self.CLASS + '-btn-select');
            self._selectBtn.addEventListener(TC.Consts.event.CLICK, function (e) {
                if (!e.target.disabled) {
                    if (self.isActive) {
                        self.deactivate();
                    }
                    else {
                        self.activate();
                    }
                }
            });
            self._deleteBtn = self.div.querySelector('.' + self.CLASS + '-btn-delete');
            self._deleteBtn.addEventListener(TC.Consts.event.CLICK, function () {
                self.deleteSelectedFeatures();
            });
            self._textBtn = self.div.querySelector('.' + self.CLASS + '-btn-text');
            self._textBtn.addEventListener(TC.Consts.event.CLICK, function () {
                self.setTextMode(!self.textActive);
            });
            self._joinBtn = self.div.querySelector('.' + self.CLASS + '-btn-join');
            self._splitBtn = self.div.querySelector('.' + self.CLASS + '-btn-split');
            self._textInput = self.div.querySelector('input.' + self.CLASS + '-txt');
            self._textInput.addEventListener('input', function (e) {
                self.labelFeatures(e.target.value);
            });
            self._styleSection = self.div.querySelector('.' + self.CLASS + '-style');

            self._fontColorPicker = self.div.querySelector(self._classSelector + '-fnt-c');
            self._fontColorPicker.addEventListener(TC.Consts.event.CHANGE, function (e) {
                self.setFontColor(e.target.value);
            });

            self._fontSizeSelector = self.div.querySelector('.' + self.CLASS + '-fnt-s');
            self._fontSizeSelector.addEventListener(TC.Consts.event.CHANGE, function (e) {
                self.setFontSize(e.target.value);
            });

            if ($.isFunction(callback)) {
                callback();
            }
        };

        const renderObject = {
            fontSize: self.styles.text.fontSize,
            fontColor: self.styles.text.fontColor,
            labelOutlineColor: self.styles.text.labelOutlineColor,
            labelOutlineWidth: self.styles.text.labelOutlineWidth
        };

        var promise;
        if (Modernizr.inputtypes.color) {
            promise = self._set1stRenderPromise(self.renderData(renderObject, renderCallback));
        }
        else {
            // El navegador no soporta input[type=color], usamos polyfill
            promise = self._set1stRenderPromise(self.renderData(renderObject, function () {
                const input = self.div.querySelector('input[type=color]');
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
                        self.setFontColor('#' + color);
                    });
                });

                renderCallback();
            }));
        }
        return promise;
    };

    ctlProto.activate = function () {
        const self = this;
        self._selectBtn.classList.add(TC.Consts.classes.ACTIVE);
        TC.Control.prototype.activate.call(self);
        self.wrap.activate(self.mode);
    };

    ctlProto.deactivate = function () {
        const self = this;
        TC.Control.prototype.deactivate.call(self);
        if (self._selectBtn) {
            setFeatureSelectedState(self, []);
        }
        if (self.wrap) {
            self.wrap.deactivate();
        }
        //self.trigger(TC.Consts.event.DRAWCANCEL, { ctrl: self });
        if (self._selectBtn) {
            self._selectBtn.classList.remove(TC.Consts.classes.ACTIVE);
            self.layer.features.forEach(function (feature) {
                feature.toggleSelectedStyle(false);
            });
            //setFeatureUnselectedStyle(self, self.getSelectedFeatures());
        }
    };

    ctlProto.clear = function () {
        const self = this;
        if (self.layer) {
            self.layer.clearFatures();
        }
        return self;
    };

    ctlProto.isExclusive = function () {
        return true;
    };

    ctlProto.end = function () {
        const self = this;
        self.wrap.end();
        return self;
    };

    ctlProto.setMode = function (mode, activate) {
        const self = this;

        if (mode)
            self.mode = mode;

        if (activate && mode) {
            if (self.layer) {
                self.layer.map.putLayerOnTop(self.layer);
            }
            self.activate();
        }
        else {
            self.deactivate();
        }
        return self;
    };

    ctlProto.getLayer = function () {
        var self = this;
        // Se ha instanciado un control sin capa asociada
        if (self.options && typeof self.options.layer === 'boolean' && !self.options.layer) {
            return Promise.resolve(null);
        }
        if (self.layer) {
            return Promise.resolve(self.layer);
        }
        return self._layerPromise;
    };

    ctlProto.setLayer = function (layer) {
        var self = this;
        if (self.map) {
            self._layerPromise = new Promise(function (resolve, reject) {
                if (typeof (layer) === "string") {
                    self.map.loaded(function () {
                        self.layer = self.map.getLayer(layer);
                        resolve(self.layer);
                    });
                }
                else {
                    self.layer = layer;
                    resolve(self.layer);
                }
            });
        }
    };

    ctlProto.getSelectedFeatures = function () {
        return this.wrap.getSelectedFeatures();
    };

    ctlProto.setSelectedFeatures = function (features) {
        const self = this;
        const result = self.wrap.setSelectedFeatures(features);
        self.displayLabelText();
        return result;
    };

    ctlProto.getActiveFeatures = function () {
        const self = this;
        const result = self.getSelectedFeatures();
        if (!result.length && self.layer.features.length) {
            result.push(self.layer.features[self.layer.features.length - 1]);
        }
        return result;
    };

    ctlProto.unselectFeatures = function (features) {
        features = features || [];
        this.wrap.unselectFeatures(features.map(function (feat) {
            return feat.wrap.feature;
        }));
        return this;
    };

    ctlProto.deleteSelectedFeatures = function () {
        const self = this;
        const features = self.getSelectedFeatures();
        self.wrap.unselectFeatures(features);
        features.forEach(function (feature) {
            self.layer.removeFeature(feature);
        });
        return self;
    };

    ctlProto.styleFunction = function (feature, resolution) {
        const self = this;
        var result;
        const mapStyles = self.map.options.styles.selection;
        switch (true) {
            case TC.feature.Polygon && feature instanceof TC.feature.Polygon:
            case TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon:
                result = $.extend({}, mapStyles.polygon);
                break;
            case TC.feature.Point && feature instanceof TC.feature.Point:
            case TC.feature.MultiPoint && feature instanceof TC.feature.MultiPoint:
                result = $.extend({}, mapStyles.point);
                break;
            default:
                result = $.extend({}, mapStyles.line);
                break;
        }
        const style = feature.getStyle();
        if (style.label) {
            result.label = style.label;
            result.fontSize = style.fontSize;
            result.fontColor = style.fontColor;
            result.labelOutlineColor = style.labelOutlineColor;
            result.labelOutlineWidth = style.labelOutlineWidth;
        }
        return result;
    };

    ctlProto.setTextMode = function (active) {
        const self = this;
        self.textActive = active;
        if (active) {
            self._textBtn.classList.add(TC.Consts.classes.ACTIVE);
            self._textBtn.classList.add(active);
        }
        else {
            self._textBtn.classList.remove(TC.Consts.classes.ACTIVE);
            self._textBtn.classList.remove(active);
        }
        if (active) {
            self._styleSection.classList.remove(TC.Consts.classes.HIDDEN);
        }
        else {
            self._styleSection.classList.add(TC.Consts.classes.HIDDEN);
        }
        self.displayLabelText();
        return self;
    };

    ctlProto.setFontColorWatch = function (color, outlineColor) {
        const self = this;
        if (color === undefined) {
            color = self.styles.text.fontColor;
        }
        color = TC.Util.colorArrayToString(color);
        outlineColor = outlineColor || self.getLabelOutlineColor(color);
        self.renderPromise().then(function () {
            self._fontColorPicker.value = color;
            self._textInput.style.color = color;
            self._textInput.style.textShadow = '0 0 ' + self.styles.text.labelOutlineWidth + 'px ' + outlineColor;
            if (!Modernizr.inputtypes.color) {
                self._fontColorPicker.style.backgroundColor = color;
                self._fontColorPicker.blur();
            }
        });
        return self;
    };

    ctlProto.setFontColor = function (color) {
        const self = this;
        self.styles.text.fontColor = color;
        self.styles.text.labelOutlineColor = self.getLabelOutlineColor(color);
        self.setFontColorWatch(color, self.styles.text.labelOutlineColor);
        const features = self.getActiveFeatures();
        features.forEach(function (feature) {
            const style = feature.getStyle();
            style.fontColor = color;
            style.labelOutlineColor = self.styles.text.labelOutlineColor;
            feature.setStyle(style);
        });
        return self;
    };

    ctlProto.setFontSizeWatch = function (size) {
        const self = this;
        if (size === undefined) {
            size = self.styles.text.fontSize;
        }
        const sizeValue = parseInt(size);
        if (sizeValue !== Number.NaN) {
            self.renderPromise().then(function () {
                self._fontSizeSelector.value = sizeValue;
                self._textInput.style.fontSize = sizeValue + 'pt';
            });
        }
        return self;
    };

    ctlProto.setFontSize = function (size) {
        const self = this;
        const sizeValue = parseInt(size);
        if (sizeValue !== Number.NaN) {
            self.styles.text.fontSize = sizeValue;
            self.setFontSizeWatch(sizeValue);
            const features = self.getActiveFeatures();
            features.forEach(function (feature) {
                const style = feature.getStyle();
                style.fontSize = sizeValue;
                feature.setStyle(style);
            });
        }
        return self;
    };

    ctlProto.getLabelOutlineColor = function (fontColor) {
        if (fontColor) {
            fontColor = TC.Util.colorArrayToString(fontColor);
            const matchForShort = fontColor.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
            if (matchForShort && matchForShort.length) {
                fontColor = '#' + matchForShort[1] + matchForShort[1] + matchForShort[2] + matchForShort[2] + matchForShort[3] + matchForShort[3];
            }
            const matchForLong = fontColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
            if (matchForLong && matchForLong.length) {
                const r = parseInt(matchForLong[1], 16);
                const g = parseInt(matchForLong[2], 16);
                const b = parseInt(matchForLong[3], 16);
                return (r + g + b) / 3 < 128 ? '#ffffff' : '#000000';
            }
        }
        return '#ffffff';
    };

    ctlProto.displayLabelText = function () {
        const self = this;
        const features = self.getSelectedFeatures();
        var text;
        var size;
        var color;
        if (self.isActive && features.length) {
            const feature = features[features.length - 1];
            const style = feature.getStyle();
            text = style.label;
            color = style.fontColor;
            size = style.fontSize;
        }
        else {
            text = '';
            color = self.styles.text.fontColor;
            size = self.styles.text.fontSize;
        }
        self.renderPromise().then(function () {
            self
                .setFontSizeWatch(size)
                .setFontColorWatch(color)
                ._textInput.value = text;
        });
        return self;
    };

    ctlProto.labelFeatures = function (text) {
        const self = this;
        const features = self.getActiveFeatures();
        if (features.length) {
            const style = features[0].getStyle();
            features.forEach(function (feature) {
                const textStyle = $.extend({}, self.styles.text, style);
                style.label = text;
                style.labelOffset = textStyle.labelOffset;
                style.fontColor = textStyle.fontColor;
                style.fontSize = textStyle.fontSize;
                style.labelOutlineColor = textStyle.labelOutlineColor;
                style.labelOutlineWidth = textStyle.labelOutlineWidth;
                feature.setStyle(style);
            });
        }
        return self;
    };

})();
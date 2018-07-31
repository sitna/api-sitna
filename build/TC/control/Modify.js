TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.Consts.event.BEFOREFEATUREMODIFY = "beforefeaturemodify.tc";
TC.Consts.event.FEATUREMODIFY = "featuremodify.tc";
TC.Consts.event.FEATURESSELECT = "featureselect.tc";
TC.Consts.event.FEATURESUNSELECT = "featureunselect.tc";
TC.Consts.event.CHANGE = 'change.tc';

(function () {

    TC.control.Modify = function () {
        var self = this;

        TC.Control.apply(self, arguments);

        self.__firstRender = $.Deferred();

        self.styles = $.extend(true, TC.Cfg.styles.selection, self.options.styles);
        self.styles.text = self.styles.text || {
            fontSize: self.styles.line.fontSize,
            fontColor: self.styles.line.fontColor,
            labelOutlineColor: self.styles.line.labelOutlineColor,
            labelOutlineWidth: self.styles.line.labelOutlineWidth
        };

        self._classSelector = '.' + self.CLASS;

        self.wrap = new TC.wrap.control.Modify(self);

        self._layerPromise = $.Deferred();
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
        ctl._$deleteBtn.prop('disabled', features.length === 0);
        ctl._$joinBtn.prop('disabled', features.length < 2);
        ctl._$splitBtn.prop('disabled', features.filter(complexGeometryFilter).length === 0);
        ctl.displayLabelText();
    }

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
        var self = this;
        TC.Control.prototype.register.call(self, map);
        if (self.options.layer) {

            self.setLayer(self.options.layer);

            map
                .on(TC.Consts.event.FEATUREADD + ' ' + TC.Consts.event.FEATURESADD, function (e) {
                    $.when(self.getLayer(), self.renderPromise()).then(function (layer) {
                        if (e.layer === layer) {
                            self._$selectBtn.prop('disabled', false);
                            self._$textBtn.prop('disabled', false);
                        }
                    });
                })
                .on(TC.Consts.event.FEATUREREMOVE + ' ' + TC.Consts.event.FEATURESCLEAR, function (e) {
                    $.when(self.getLayer(), self.renderPromise()).then(function (layer) {
                        if (e.layer === layer) {
                            if (e.feature) {
                                self.unselectFeatures([e.feature]);
                            }
                            else {
                                self.unselectFeatures();
                            }
                            setFeatureSelectedState(self, self.getSelectedFeatures());
                            if (self.layer.features.length === 0) {
                                self._$selectBtn.prop('disabled', true);
                                self.setTextMode(false);
                                self._$textBtn.prop('disabled', true);
                            }
                        }
                    });
                });

            self
                .on(TC.Consts.event.FEATURESSELECT, function (e) {
                    const selectedFeatures = self.getSelectedFeatures();
                    setFeatureSelectedState(self, selectedFeatures);
                    //setFeatureUnselectedStyle(self, self.layer.features.filter(function (feature) {
                    //    return selectedFeatures.indexOf(feature) < 0;
                    //}));
                    //setFeatureSelectedStyle(self, e.features);

                })
                .on(TC.Consts.event.FEATURESUNSELECT, function (e) {
                    setFeatureSelectedState(self, self.getSelectedFeatures());
                    //setFeatureUnselectedStyle(self, e.features);
                });
        }
    };

    ctlProto.render = function (callback) {
        const self = this;

        const renderCallback = function () {
            self._$selectBtn = self._$div.find('.' + self.CLASS + '-btn-select').on(TC.Consts.event.CLICK, function (e) {
                if (!e.target.disabled) {
                    if (self.isActive) {
                        self.deactivate();
                    }
                    else {
                        self.activate();
                    }
                }
            });
            self._$deleteBtn = self._$div.find('.' + self.CLASS + '-btn-delete').on(TC.Consts.event.CLICK, function () {
                self.deleteSelectedFeatures();
            });
            self._$textBtn = self._$div.find('.' + self.CLASS + '-btn-text')
                .on(TC.Consts.event.CLICK, function () {
                    self.setTextMode(!self.textActive);
                });
            self._$joinBtn = self._$div.find('.' + self.CLASS + '-btn-join');
            self._$splitBtn = self._$div.find('.' + self.CLASS + '-btn-split');
            self._$text = self._$div.find('input.' + self.CLASS + '-txt')
                .on('input.tc', function (e) {
                    self.labelFeatures(e.target.value);
                });
            self._$styleSection = self._$div.find('.' + self.CLASS + '-style');

            self._$fontColorPicker = self._$div.find(self._classSelector + '-fnt-c').on(TC.Consts.event.CHANGE, function (e) {
                self.setFontColor(e.target.value);
            });

            self._$fontSizeSelector = self._$div.find('.' + self.CLASS + '-fnt-s')
                .on(TC.Consts.event.CHANGE, function (e) {
                    self.setFontSize(e.target.value);
                });

            self.__firstRender.resolve();

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

        if (Modernizr.inputtypes.color) {
            self.renderData(renderObject, renderCallback);
        }
        else {
            // El navegador no soporta input[type=color], cargamos polyfill
            TC.loadJS(
                !$.fn.spectrum,
                TC.apiLocation + 'lib/spectrum/spectrum.min.js',
                function () {
                    TC.loadCSS(TC.apiLocation + 'lib/spectrum/spectrum.css');
                    self.renderData(renderObject, function () {
                        self._$div.find('input[type=color]').spectrum({
                            preferredFormat: 'hex',
                            showPalette: true,
                            palette: [],
                            selectionPalette: [],
                            cancelText: self.getLocaleString('cancel'),
                            chooseText: self.getLocaleString('ok'),
                            replacerClassName: self.CLASS + '-str-c'
                        });

                        renderCallback();
                    });
                }
            )
        }
    };

    ctlProto.renderPromise = function () {
        return this.__firstRender.promise();
    };

    ctlProto.activate = function () {
        var self = this;
        self._$selectBtn.addClass(TC.Consts.classes.ACTIVE);
        TC.Control.prototype.activate.call(self);
        self.wrap.activate(self.mode);
    };

    ctlProto.deactivate = function () {
        var self = this;
        if (self._$selectBtn) {
            self._$selectBtn.removeClass(TC.Consts.classes.ACTIVE);
            //setFeatureUnselectedStyle(self, self.getSelectedFeatures());
        }
        TC.Control.prototype.deactivate.call(self);
        if (self._$selectBtn) {
            setFeatureSelectedState(self, []);
        }
        if (self.wrap) {
            self.wrap.deactivate();
        }
        //self.$events.trigger($.Event(TC.Consts.event.DRAWCANCEL, { ctrl: self }));
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

        var event = activate ? TC.Consts.event.CONTROLACTIVATE : TC.Consts.event.CONTROLDEACTIVATE;
        if (self.map) {
            self.map.$events.trigger($.Event(event, { control: self }));
        }
        return self;
    };

    ctlProto.getLayer = function () {
        var self = this;
        // Se ha instanciado un control sin capa asociada
        if (self.options && typeof self.options.layer === 'boolean' && !self.options.layer) {
            return null;
        }
        return self.layer ? self.layer : self._layerPromise;
    };

    ctlProto.setLayer = function (layer) {
        var self = this;
        if (self.map) {
            if (typeof (layer) === "string") {
                self.map.loaded(function () {
                    self.layer = self.map.getLayer(layer);
                    self._layerPromise.resolve(self.layer);
                });
            }
            else {
                self.layer = layer;
                self._layerPromise.resolve(self.layer);
            }
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
        self._$textBtn.toggleClass(TC.Consts.classes.ACTIVE, active);
        self._$styleSection.toggleClass(TC.Consts.classes.HIDDEN, !active);
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
            self._$fontColorPicker.val(color);
            if (!Modernizr.inputtypes.color) {
                self._$fontColorPicker.spectrum('set', color);
            }
            self._$text.css('color', color);
            self._$text.css('text-shadow', '0 0 ' + self.styles.text.labelOutlineWidth + 'px ' + outlineColor);
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
                self._$fontSizeSelector.val(sizeValue);
                self._$text.css('font-size', sizeValue + 'pt');
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
                return (r + g + b) / 3 < 128 ? '#fff' : '#000';
            }
        }
        return '#fff';
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
                ._$text.val(text);
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
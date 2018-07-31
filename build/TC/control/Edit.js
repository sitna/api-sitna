TC.control = TC.control || {};

if (!TC.control.SWCacheClient) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/SWCacheClient');
}

TC.Consts.editMode = {
    SELECT: 'select',
    ADDPOINT: 'addpoint',
    ADDLINE: 'addline',
    ADDPOLYGON: 'addpolygon'
};
TC.Consts.editStyles = {
    NEW: 'temporary',
    SELECTED: 'select',
    DEFAULT: 'default'
};

TC.Consts.event.POINT = 'point.tc';
TC.Consts.event.BEFOREFEATUREMODIFY = "beforefeaturemodify.tc";
TC.Consts.event.FEATUREMODIFY = "featuremodify.tc";
TC.Consts.event.FEATURESSELECT = "featureselect.tc";
TC.Consts.event.FEATURESUNSELECT = "featureunselect.tc";

(function () {
    var newFeatureIdNumber = 0;
    var getNewFeatureId = function () {
        return "NewFeature." + newFeatureIdNumber++;
    };

    var storeFeature = function (key, feature) {
        var deferred = $.Deferred();
        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
            var obj;
            var geometryType;
            switch (true) {
                case feature instanceof TC.feature.Polygon:
                    geometryType = TC.Consts.geom.POLYGON;
                    break;
                case feature instanceof TC.feature.Polyline:
                    geometryType = TC.Consts.geom.POLYLINE;
                    break;
                case feature instanceof TC.feature.Point:
                    geometryType = TC.Consts.geom.POINT;
                    break;
                case feature instanceof TC.feature.MultiPolygon:
                    geometryType = TC.Consts.geom.MULTIPOLYGON;
                    break;
                case feature instanceof TC.feature.MultiPolyline:
                    geometryType = TC.Consts.geom.MULTIPOLYLINE;
                    break;
            }
            obj = {
                id: feature.id || feature.provId,
                attributes: feature.data,
                type: geometryType,
                geometry: feature.geometry,
            }
            localforage.setItem(key, obj)
                .then(function () {
                    deferred.resolve({ feature: feature });
                })
                .catch(function (error) {
                    deferred.reject({ feature: feature, error: error });
                });
        });
        return deferred.promise();
    };

    var deleteFeature = function (key) {
        var deferred = $.Deferred();
        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
            localforage.removeItem(key)
                .then(function () {
                    deferred.resolve(key);
                })
                .catch(function (error) {
                    deferred.reject(error);
                });
        });
        return deferred.promise();
    };

    var readFeature = function (key) {
        var deferred = $.Deferred();
        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
            localforage.getItem(key)
                .then(function (value) {
                    deferred.resolve({
                        key: key,
                        feature: value
                    });
                })
                .catch(function (error) {
                    deferred.reject(error);
                });
        });
        return deferred.promise();
    };

    var getStoragePrefix = function (ctl, layerId) {
        return ctl.LOCAL_STORAGE_KEY_PREFIX + (layerId || ctl.layer.id);
    };

    var getAddedStoragePrefix = function (ctl, layerId) {
        return getStoragePrefix(ctl, layerId) + ctl.LOCAL_STORAGE_ADDED_KEY_PREFIX;
    };

    var getModifiedStoragePrefix = function (ctl, layerId) {
        return getStoragePrefix(ctl, layerId) + ctl.LOCAL_STORAGE_MODIFIED_KEY_PREFIX;
    };

    var getRemovedStoragePrefix = function (ctl, layerId) {
        return getStoragePrefix(ctl, layerId) + ctl.LOCAL_STORAGE_REMOVED_KEY_PREFIX;
    };

    var setFeatureSelectReadyState = function (ctl) {
        ctl._$deleteBtn.prop('disabled', true);
        ctl._$joinBtn.prop('disabled', true);
        ctl._$splitBtn.prop('disabled', true);
    }

    var complexGeometryFilter = function (elm) {
        var result = false;
        if ((TC.feature.MultiPolygon && elm instanceof TC.feature.MultiPolygon) ||
            (TC.feature.MultiPolyline && elm instanceof TC.feature.MultiPolyline)) {
            if (elm.geometry.length > 1) {
                result = true;
            }
        }
        return result;
    };

    var setFeatureSelectedState = function (ctl, features) {
        ctl._$deleteBtn.prop('disabled', features.length === 0);
        ctl._$joinBtn.prop('disabled', features.length < 2);
        ctl._$splitBtn.prop('disabled', features.filter(complexGeometryFilter).length === 0);
    }

    var setSaveButtonsState = function (ctl, disabled) {
        ctl._$saveBtn.prop('disabled', disabled);
        ctl._$discardBtn.prop('disabled', disabled);
        self.checkedOut = !disabled;
    };

    var setChangedState = function (ctl, isChanged) {
        if (typeof isChanged !== 'undefined') {
            setSaveButtonsState(ctl, !isChanged);
        }
        else {
            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                var storagePrefix = getStoragePrefix(ctl);
                localforage.keys().then(function (keys) {
                    if (keys) {
                        var disabled = true;
                        for (var i = 0, len = keys.length; i < len; i++) {
                            if (keys[i].indexOf(storagePrefix) === 0) {
                                disabled = false;
                                break;
                            }
                        }
                        setSaveButtonsState(ctl, disabled);
                    }
                });
            });
        }
    };

    var addChangesLayer = function (ctl, layer) {
        var deferred = $.Deferred();
        var changesLayer = ctl._changesLayers[layer.id];
        if (changesLayer) {
            deferred.resolve(changesLayer);
        }
        else {
            changesLayer = ctl._changesLayers[layer.id] = new TC.layer.Vector({
                id: TC.getUID(),
                title: layer.title + ' - cambios pendientes',
                stealth: true,
                styles: ctl.getChangesLayerStyle(layer)
            });
            var idx = ctl.map.layers.indexOf(layer);
            ctl.map.insertLayer(changesLayer, idx + 1, function () {
                deferred.resolve(changesLayer);
            });
        }
        return deferred.promise();
    };

    /* Creamos el constructor, llamando al constructor del padre */
    TC.control.Edit = function () {
        var self = this;

        TC.control.SWCacheClient.apply(this, arguments);

        self._classSelector = '.' + self.CLASS;

        self.$events = $(self);
        self.wrap = new TC.wrap.control.Edit(self);
        self._layerDeferred = $.Deferred();
        self.layer = null;
        self.checkedOut = false;
        //self.feature = self.options.feature ? self.options.feature : null;
        self.callback = (arguments[2] && $.isFunction(arguments[2])) ? arguments[2] : (self.options.callback ? self.options.callback : null);
        self.multi = self.options.multi ? self.options.multi : false;
        self.eraseActionConfirmTxt = self.options.eraseText ? self.options.eraseText : "¿Está seguro de eliminar esta(s) geometría(s)?";
        self.cancelActionConfirmTxt = self.options.cancelText ? self.options.eraseText : "Si continua todos los cambios se perderán. ¿Desea continuar?";
        self.styles = self.options.styles;
        self.features = {};
        self.attributeEditor = null;
        self.pointDraw = null;
        self.lineDraw = null;
        self.polygonDraw = null;
        self.snapping = (typeof self.options.snapping === 'boolean') ? self.options.snapping : true;
        self._changesLayers = {};
        self._showsChanges = (typeof self.options.showChanges === 'boolean') ? self.options.showChanges : true;
        if ($.isFunction(self.options.getChangesLayerStyleFunction)) {
            self.getChangesLayerStyleFunction = self.getChangesLayerStyle;
        }

        self.$events
            .on(TC.Consts.event.FEATUREADD, function (e) {
                var feat = e.feature;
                feat.provId = getNewFeatureId();
                var changesLayer = self._changesLayers[self.layer.id];
                self.features[self.layer.id].added.push(feat);
                changesLayer.addFeature(feat);
                storeFeature(getAddedStoragePrefix(self) + feat.provId, feat).then(function () {
                    setChangedState(self, true);
                    TC.toast("Adición guardada");
                }, function () {
                    TC.error("Fallo al guardar adición");
                });
            })
            .on(TC.Consts.event.FEATUREREMOVE, function (e) {
                var feat = e.feature;
                var fid = feat.provId || feat.id;
                var storeSuccess = function () {
                    setChangedState(self);
                    TC.toast("Eliminación guardada");
                };
                var storeFailure = function () {
                    TC.error("Fallo al guardar eliminación");
                };
                var changesLayer = self._changesLayers[self.layer.id];
                var features = self.features[self.layer.id];
                var idx = features.added.indexOf(feat);
                if (idx < 0) {
                    var removedStoragePrefix = getRemovedStoragePrefix(self);
                    idx = features.modified.indexOf(feat);
                    if (idx < 0) {
                        idx = features.removed.indexOf(feat);
                        if (idx < 0) {
                            features.removed.push(feat);
                            changesLayer.addFeature(feat);
                            storeFeature(removedStoragePrefix + feat.id, feat).then(storeSuccess, storeFailure);
                        }
                    }
                    else {
                        features.modified.splice(idx, 1);
                        features.removed.push(feat);
                        deleteFeature(getModifiedStoragePrefix(self) + feat.id).then(function () {
                            storeSuccess();
                            storeFeature(removedStoragePrefix + feat.id, feat).then(storeSuccess, storeFailure);
                        }, storeFailure);
                    }
                }
                else {
                    changesLayer.removeFeature(feat);
                    features.added.splice(idx, 1);
                    deleteFeature(getAddedStoragePrefix(self) + fid).then(storeSuccess, storeFailure);
                }
            })
            .on(TC.Consts.event.FEATUREMODIFY, function (e) {
                var feat = e.feature;
                var fid = feat.provId || feat.id;
                var storeSuccess = function () {
                    setChangedState(self, true);
                    TC.toast("Modificación guardada");
                };
                var storeFailure = function () {
                    TC.error("Fallo al guardar modificación");
                };
                var changesLayer = self._changesLayers[self.layer.id];
                var features = self.features[self.layer.id];
                var idx = features.added.indexOf(feat);
                if (idx < 0) {
                    idx = features.modified.indexOf(feat);
                    if (idx < 0) {
                        changesLayer.addFeature(feat);
                        features.modified.push(feat);
                    }
                    storeFeature(getModifiedStoragePrefix(self) + fid, feat).then(storeSuccess, storeFailure);
                }
                else {
                    storeFeature(getAddedStoragePrefix(self) + fid, feat).then(storeSuccess, storeFailure);
                }
            })
            .on(TC.Consts.event.FEATUREADD + ' ' + TC.Consts.event.FEATUREREMOVE + ' ' + TC.Consts.event.FEATUREMODIFY, function (e) {
                if (self.serviceWorkerEnabled && navigator.onLine) {
                    var gfUrl = self.layer.wrap.getGetFeatureUrl();
                    var dftUrl = self.layer.wrap.getDescribeFeatureTypeUrl();
                    if (gfUrl && dftUrl) {
                        self.createCache(self.LOCAL_STORAGE_KEY_PREFIX + self.layer.id, {
                            urlList: [gfUrl, dftUrl]
                        });
                    }
                }
            })
            //.on(TC.Consts.event.MEASURE + ' ' + TC.Consts.event.MEASUREPARTIAL, function (e) {
            //    var precision = e.units === 'm' ? 0 : 3;
            //    if (e.area) {
            //        self._$area.html(e.area.toFixed(precision).replace('.', ',') + ' ' + e.units + '&sup2;');
            //    }
            //    if (e.perimeter) {
            //        self._$peri.html(e.perimeter.toFixed(precision).replace('.', ',') + ' ' + e.units);
            //    }
            //    if (e.length) {
            //        self._$len.html(e.length.toFixed(precision).replace('.', ',') + ' ' + e.units);
            //    }
            //})
            //.on(TC.Consts.event.MEASURE, function (e) {
            //    self._pointHistoryIdx = 0;
            //    self.history.length = self._pointHistoryIdx;
            //    self._$undoBtn.prop('disabled', true);
            //    self._$redoBtn.prop('disabled', true);
            //})
            .on(TC.Consts.event.CONTROLDEACTIVATE, function (e) {
                //self._$area.html('-');
                //self._$peri.html('-');
                //self._$len.html('-');
            })
            .on(TC.Consts.event.FEATURESSELECT, function (e) {
                
                var features = self.getSelectedFeatures();
                setFeatureSelectedState(self, features);
                if (features.length) {
                    features[0].showPopup(self.attributeEditor);
                }
            })
            .on(TC.Consts.event.FEATURESUNSELECT, function (e) {
                setFeatureSelectedState(self, self.getSelectedFeatures());
            });
            //.on(TC.Consts.event.EDITIONSAVE, function (e) {
            //    if (self.callback)
            //        self.callback(e.added, e.removed, e.modified);
            //});
    };

    TC.inherit(TC.control.Edit, TC.control.SWCacheClient);

    var ctlProto = TC.control.Edit.prototype;

    ctlProto.CLASS = 'tc-ctl-edit';
    ctlProto.LOCAL_STORAGE_KEY_PREFIX = "TC.offline.edit.";
    ctlProto.LOCAL_STORAGE_ADDED_KEY_PREFIX = ".added.";
    ctlProto.LOCAL_STORAGE_MODIFIED_KEY_PREFIX = ".modified.";
    ctlProto.LOCAL_STORAGE_REMOVED_KEY_PREFIX = ".removed.";

    ctlProto.template = {};

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Edit.html";
        ctlProto.template[ctlProto.CLASS + '-attr'] = TC.apiLocation + "TC/templates/EditAttributes.html";
    } else {
        ctlProto.template[ctlProto.CLASS] = function () {
            dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "featureEdit" }).w(" <span class=\"tc-beta\">").h("i18n", ctx, {}, { "$key": "beta" }).w("</span></h2><div class=\"tc-ctl-edit-layer\"><select class=\"tc-combo tc-ctl-edit-layer-sel\"><option value=\"\">").h("i18n", ctx, {}, { "$key": "selectLayerToEdit" }).w("</option>").s(ctx.get(["layers"], false), ctx, { "block": body_1 }, {}).w("</select><input type=\"checkbox\" id=\"tc-ctl-edit-view-changes-cb\"").x(ctx.get(["showChanges"], false), ctx, { "block": body_2 }, {}).w(" /><label class=\"tc-ctl-edit-view-changes\" for=\"tc-ctl-edit-view-changes-cb\">").h("i18n", ctx, {}, { "$key": "highlightUnsyncedChanges" }).w("</label></div><div class=\"tc-ctl-edit-mode\"><form><label class=\"tc-ctl-edit-btn-select\" title=\"").h("i18n", ctx, {}, { "$key": "select" }).w("\"><input type=\"radio\" name=\"mode\" value=\"select\" /><span>").h("i18n", ctx, {}, { "$key": "select" }).w("</span></label><label class=\"tc-ctl-edit-btn-point\" title=\"").h("i18n", ctx, {}, { "$key": "newPoint" }).w("\"><input type=\"radio\" name=\"mode\" value=\"addpoint\" /><span>").h("i18n", ctx, {}, { "$key": "newPoint" }).w("</span></label><label class=\"tc-ctl-edit-btn-line\" title=\"").h("i18n", ctx, {}, { "$key": "newLine" }).w("\"><input type=\"radio\" name=\"mode\" value=\"addline\" /><span>").h("i18n", ctx, {}, { "$key": "newLine" }).w("</span></label><label class=\"tc-ctl-edit-btn-polygon\" title=\"").h("i18n", ctx, {}, { "$key": "newPolygon" }).w("\"><input type=\"radio\" name=\"mode\" value=\"addpolygon\" /><span>").h("i18n", ctx, {}, { "$key": "newPolygon" }).w("</span></label></form></div><div class=\"tc-ctl-edit-select tc-hidden\"><button class=\"tc-ctl-btn tc-ctl-edit-btn-delete\" disabled title=\"").h("i18n", ctx, {}, { "$key": "delete" }).w("\">").h("i18n", ctx, {}, { "$key": "delete" }).w("</button><button class=\"tc-ctl-btn tc-ctl-edit-btn-join\" disabled title=\"").h("i18n", ctx, {}, { "$key": "joinGeometries.tooltip" }).w("\">").h("i18n", ctx, {}, { "$key": "joinGeometries" }).w("</button><button class=\"tc-ctl-btn tc-ctl-edit-btn-split\" disabled title=\"").h("i18n", ctx, {}, { "$key": "splitGeometry" }).w("\">").h("i18n", ctx, {}, { "$key": "splitGeometry" }).w("</button><button class=\"tc-ctl-btn tc-ctl-edit-btn-cancel\" disabled title=\"").h("i18n", ctx, {}, { "$key": "cancel" }).w("\">").h("i18n", ctx, {}, { "$key": "cancel" }).w("</button></div><div class=\"tc-ctl-edit-point tc-hidden\"></div><div class=\"tc-ctl-edit-line tc-hidden\"></div><div class=\"tc-ctl-edit-polygon tc-hidden\"></div><div class=\"tc-ctl-edit-save\"><button class=\"tc-button tc-icon-button tc-ctl-edit-btn-save\" disabled title=\"").h("i18n", ctx, {}, { "$key": "syncChanges" }).w("\">").h("i18n", ctx, {}, { "$key": "syncChanges" }).w("</button><button class=\"tc-button tc-icon-button tc-ctl-edit-btn-discard\" disabled title=\"").h("i18n", ctx, {}, { "$key": "discardChanges" }).w("\">").h("i18n", ctx, {}, { "$key": "discardChanges" }).w("</button></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<option value=\"").f(ctx.get(["id"], false), ctx, "h").w("\">").f(ctx.get(["title"], false), ctx, "h").w("</option>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w(" checked"); } body_2.__dustBody = !0; return body_0
        };
        ctlProto.template[ctlProto.CLASS + '-attr'] = function () {
            dust.register(ctlProto.CLASS + '-attr', body_0); var blocks = { "inputText": body_27, "inputNumber": body_28, "inputCheckbox": body_29, "inputDate": body_31, "inputTime": body_32, "inputDatetime": body_33 }; function body_0(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w("<div class=\"tc-ctl-edit-attr\"><h3>").h("i18n", ctx, {}, { "$key": "attributeEdit" }).w("</h3><div class=\"tc-ctl-edit-attr-body\"><table><tbody>").s(ctx.get(["data"], false), ctx, { "block": body_1 }, {}).w("</tbody></table></div><div class=\"tc-ctl-edit-attr-footer\"><button class=\"tc-button tc-ctl-edit-btn-attr-ok\">").h("i18n", ctx, {}, { "$key": "ok" }).w("</button><button class=\"tc-button tc-ctl-edit-btn-attr-cancel\">").h("i18n", ctx, {}, { "$key": "cancel" }).w("</button></div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w("<tr><th>").f(ctx.get(["name"], false), ctx, "h").w("</th><td>").x(ctx.get(["readOnly"], false), ctx, { "else": body_2, "block": body_34 }, {}).w("</td></tr>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.x(ctx.get(["availableValues"], false), ctx, { "block": body_3 }, {}).h("select", ctx, { "block": body_5 }, { "key": ctx.get(["type"], false) }); } body_2.__dustBody = !0; function body_3(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w("<select class=\"tc-combo\" name=\"").f(ctx.get(["name"], false), ctx, "h").w("\"><option value=\"\"></option>").s(ctx.get(["availableValues"], false), ctx, { "block": body_4 }, {}).w("</select>"); } body_3.__dustBody = !0; function body_4(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w("<option value=\"").f(ctx.getPath(true, []), ctx, "h").w("\">").f(ctx.getPath(true, []), ctx, "h").w("</option>"); } body_4.__dustBody = !0; function body_5(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.h("none", ctx, { "block": body_6 }, {}).h("eq", ctx, { "block": body_7 }, { "value": "int" }).h("eq", ctx, { "block": body_8 }, { "value": "integer" }).h("eq", ctx, { "block": body_9 }, { "value": "double" }).h("eq", ctx, { "block": body_10 }, { "value": "boolean" }).h("eq", ctx, { "block": body_11 }, { "value": "date" }).h("eq", ctx, { "block": body_12 }, { "value": "time" }).h("eq", ctx, { "block": body_13 }, { "value": "dateTime" }).h("eq", ctx, { "block": body_14 }, { "value": "byte" }).h("eq", ctx, { "block": body_15 }, { "value": "long" }).h("eq", ctx, { "block": body_16 }, { "value": "negativeInteger" }).h("eq", ctx, { "block": body_17 }, { "value": "nonNegativeInteger" }).h("eq", ctx, { "block": body_18 }, { "value": "nonPositiveInteger" }).h("eq", ctx, { "block": body_19 }, { "value": "positiveInteger" }).h("eq", ctx, { "block": body_20 }, { "value": "short" }).h("eq", ctx, { "block": body_21 }, { "value": "unsignedLong" }).h("eq", ctx, { "block": body_22 }, { "value": "unsignedInt" }).h("eq", ctx, { "block": body_23 }, { "value": "unsignedShort" }).h("eq", ctx, { "block": body_24 }, { "value": "unsignedByte" }).h("eq", ctx, { "block": body_25 }, { "value": "float" }).h("eq", ctx, { "block": body_26 }, { "value": "decimal" }); } body_5.__dustBody = !0; function body_6(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputText"), ctx, {}, {}); } body_6.__dustBody = !0; function body_7(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_7.__dustBody = !0; function body_8(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_8.__dustBody = !0; function body_9(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_9.__dustBody = !0; function body_10(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputCheckbox"), ctx, {}, {}); } body_10.__dustBody = !0; function body_11(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputDate"), ctx, {}, {}); } body_11.__dustBody = !0; function body_12(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputTime"), ctx, {}, {}); } body_12.__dustBody = !0; function body_13(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputDatetime"), ctx, {}, {}); } body_13.__dustBody = !0; function body_14(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_14.__dustBody = !0; function body_15(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_15.__dustBody = !0; function body_16(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_16.__dustBody = !0; function body_17(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_17.__dustBody = !0; function body_18(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_18.__dustBody = !0; function body_19(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_19.__dustBody = !0; function body_20(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_20.__dustBody = !0; function body_21(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_21.__dustBody = !0; function body_22(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_22.__dustBody = !0; function body_23(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_23.__dustBody = !0; function body_24(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_24.__dustBody = !0; function body_25(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_25.__dustBody = !0; function body_26(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.b(ctx.getBlock("inputNumber"), ctx, {}, {}); } body_26.__dustBody = !0; function body_27(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w("<input type=\"text\" class=\"tc-textbox\" name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" value=\"").f(ctx.get(["value"], false), ctx, "h").w("\" />"); } body_27.__dustBody = !0; function body_28(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w("<input type=\"number\" class=\"tc-textbox\" name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" value=\"").f(ctx.get(["value"], false), ctx, "h").w("\" />"); } body_28.__dustBody = !0; function body_29(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w("<input type=\"checkbox\" name=\"").f(ctx.get(["name"], false), ctx, "h").w("\"").x(ctx.get(["value"], false), ctx, { "block": body_30 }, {}).w("/>"); } body_29.__dustBody = !0; function body_30(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w(" checked"); } body_30.__dustBody = !0; function body_31(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w("<input type=\"date\" class=\"tc-textbox\" name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" value=\"").f(ctx.get(["value"], false), ctx, "h").w("\" />"); } body_31.__dustBody = !0; function body_32(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w("<input type=\"time\" class=\"tc-textbox\" name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" value=\"").f(ctx.get(["value"], false), ctx, "h").w("\" />"); } body_32.__dustBody = !0; function body_33(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.w("<input type=\"datetime\" class=\"tc-textbox\" name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" value=\"").f(ctx.get(["value"], false), ctx, "h").w("\" />"); } body_33.__dustBody = !0; function body_34(chk, ctx) { ctx = ctx.shiftBlocks(blocks); return chk.f(ctx.get(["value"], false), ctx, "h"); } body_34.__dustBody = !0; return body_0
        };
    }

    /* Extendemos el método register. 
       La lógica del control suele definirse aquí. */
    ctlProto.register = function (map) {
        var self = this;
        TC.control.SWCacheClient.prototype.register.call(self, map);

        const drawPointsId = self.getUID();
        const drawLinesId = self.getUID();
        const drawPolygonsId = self.getUID();

        map.addControl('popup', { closeButton: true }).then(function (ctl) {
            self.attributeEditor = ctl;
        });

        map
            .on(TC.Consts.event.LAYERUPDATE, function (e) {
                if (e.layer.type === TC.Consts.layerType.WFS && !e.layer.options.stealth) {
                    var layer = e.layer;
                    var features = self.features[e.layer.id] = self.features[e.layer.id] || {
                        added: [],
                        modified: [],
                        removed: []
                    };
                    addChangesLayer(self, layer).then(function (changesLayer) {
                        if (self.layer !== layer) {
                            changesLayer.setVisibility(false);
                        }
                        var storagePrefix = getStoragePrefix(self, layer.id);
                        var addedStoragePrefix = getAddedStoragePrefix(self, layer.id);
                        var modifiedStoragePrefix = getModifiedStoragePrefix(self, layer.id);
                        var removedStoragePrefix = getRemovedStoragePrefix(self, layer.id);
                        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                            //var li = map.getLoadingIndicator();
                            var uid = TC.getUID();
                            localforage.keys().then(function (keys) {
                                if (keys) {
                                    for (var i = 0, len = keys.length; i < len; i++) {
                                        var key = keys[i];
                                        if (key.indexOf(storagePrefix) === 0) {
                                            //li && li.addWait(uid);
                                            readFeature(key).then(function (obj) {
                                                var id;
                                                var k = obj.key;
                                                if (k.indexOf(removedStoragePrefix) === 0) {
                                                    id = k.substr(removedStoragePrefix.length);
                                                    var feature = layer.getFeatureById(id);
                                                    layer.removeFeature(feature);
                                                    changesLayer.addFeature(feature);
                                                    features.removed.push(feature);
                                                    //li && li.removeWait(uid);
                                                }
                                                else if (k.indexOf(modifiedStoragePrefix) === 0) {
                                                    id = k.substr(modifiedStoragePrefix.length);
                                                    var feature = layer.getFeatureById(id);
                                                    if (feature) {
                                                        changesLayer.addFeature(feature);
                                                        features.modified.push(feature);
                                                        feature.wrap.setGeometry(obj.feature.geometry);
                                                        feature.setData(obj.feature.attributes);
                                                        //li && li.removeWait(uid);
                                                    }
                                                }
                                                else if (k.indexOf(addedStoragePrefix) === 0) {
                                                    id = k.substr(addedStoragePrefix.length);
                                                    var idNumber = parseInt(id.substr(id.lastIndexOf('.') + 1));
                                                    newFeatureIdNumber = Math.max(newFeatureIdNumber, idNumber + 1);
                                                    var addDeferred;
                                                    switch (obj.feature.type) {
                                                        case TC.Consts.geom.POINT:
                                                            addDeferred = layer.addPoint(obj.feature.geometry);
                                                            break;
                                                        case TC.Consts.geom.POLYLINE:
                                                            addDeferred = layer.addPolyline(obj.feature.geometry);
                                                            break;
                                                        case TC.Consts.geom.POLYGON:
                                                            addDeferred = layer.addPolygon(obj.feature.geometry);
                                                            break;
                                                        case TC.Consts.geom.MULTIPOLYLINE:
                                                            addDeferred = layer.addMultiPolyline(obj.feature.geometry);
                                                            break;
                                                        case TC.Consts.geom.MULTIPOLYGON:
                                                            addDeferred = layer.addMultiPolygon(obj.feature.geometry);
                                                            break;
                                                        default:
                                                            break;
                                                    };
                                                    addDeferred.then(function (feat) {
                                                        //feat.setStyle($.extend({}, layer.styles.line, layer.styles.polygon));
                                                        changesLayer.addFeature(feat);
                                                        features.added.push(feat);
                                                        feat.provId = id;
                                                        feat.setData(obj.feature.attributes);
                                                        //li && li.removeWait(uid);
                                                    });
                                                }
                                            });
                                        }
                                    }
                                }
                            });
                        });
                    });
                    //map.off(TC.Consts.event.LAYERUPDATE, layerUpdateHandler);
                }
            })
            .on(TC.Consts.event.LAYERADD, function (e) {
                if (e.layer.type === TC.Consts.layerType.WFS && !e.layer.options.stealth) {
                    self.features[e.layer.id] = self.features[e.layer.id] || {
                        added: [],
                        modified: [],
                        removed: []
                    };
                    $('<option>')
                        .attr('value', e.layer.id)
                        .html(e.layer.title || e.layer.id)
                        .appendTo(self._$layerSelect);
                }
            })
            .on(TC.Consts.event.LAYERREMOVE, function (e) {
                if (e.layer.type === TC.Consts.layerType.WFS && !e.layer.options.stealth) {
                    var $option = self._$layerSelect.find('option[value=' + e.layer.id + ']');
                    if ($option.filter(':selected').length > 0) {
                        self.setLayer(null);
                    }
                    $option.remove();
                }
            })
            .on(TC.Consts.event.POPUP, function (e) {
                if (e.control === self.attributeEditor) {
                    var feature = e.control.currentFeature;
                    var attributes = self.attributes.slice();
                    var attributeTypes = {};
                    var jfa = self._joinedFeatureAttributes || [];
                    for (var i = 0, ii = attributes.length; i < ii; i++) {
                        var attr
                        var data = feature.getData() || {};
                        var attributeObj = attributes[i];
                        attributeObj.value = data[attributeObj.name];
                        if (attributeObj.name === 'id') {
                            attributeObj.readOnly = true;
                        }
                        attributeObj.availableValues = [];
                        for (var j = 0, jj = jfa.length; j < jj; j++) {
                            var val = jfa[j][attributeObj.name];
                            if (val !== undefined && val !== '') {
                                attributeObj.availableValues[attributeObj.availableValues.length] = val;
                            }
                        }
                        attributeTypes[attributeObj.name] = attributeObj.type;
                    }
                    attributes.sort(function (a, b) {
                        if (a.readOnly ? !b.readOnly : b.readOnly) { //XOR
                            return !a.readOnly - !b.readOnly; // Primero readOnly
                        }
                        if (a.name > b.name) {
                            return 1;
                        }
                        if (a.name < b.name) {
                            return -1;
                        }
                        return 0;
                    });
                    self.getRenderedHtml(self.CLASS + '-attr', { data: attributes }, function (html) {
                        var $contentDiv = self.attributeEditor.$contentDiv;
                        $contentDiv.html(html);
                        var $input = $contentDiv.find('input');
                        var $select = $contentDiv.find('select');
                        $input.on('input', function (e) {
                            var $ipt = $(e.target);
                            var $sel = $select.filter('[name=' + $ipt.attr('name') + ']');
                            if ($sel.val() !== $ipt.val()) {
                                $sel.val('');
                            }
                        });
                        $select.on('change', function (e) {
                            var $sel = $(e.target);
                            $input.filter('[name=' + $sel.attr('name') + ']').val($sel.val());
                        });
                        $contentDiv.find('.' + self.CLASS + '-btn-attr-ok').on('click', function () {
                            var data = {};
                            $input.each(function (idx, elm) {
                                $input = $(elm);
                                var name = $input.attr('name');
                                var value = $input.val();
                                switch (attributeTypes[name]) {
                                    case 'int':
                                    case 'integer':
                                    case 'byte':
                                    case 'long':
                                    case 'negativeInteger':
                                    case 'nonNegativeInteger':
                                    case 'nonPositiveInteger':
                                    case 'positiveInteger':
                                    case 'short':
                                    case 'unsignedLong':
                                    case 'unsignedInt':
                                    case 'unsignedShort':
                                    case 'unsignedByte':
                                        value = parseInt(value);
                                        if (!Number.isNaN(value)) {
                                            data[name] = value;
                                        }
                                        break;
                                    case 'double':
                                    case 'float':
                                    case 'decimal':
                                        value = parseFloat(value);
                                        if (!Number.isNaN(value)) {
                                            data[name] = value;
                                        }
                                        break;
                                    case 'date':
                                    case 'time':
                                    case 'dateTime':
                                        data[name] = new Date(value);
                                        break;
                                    case 'boolean':
                                        data[name] = !!value;
                                        break;
                                    case undefined:
                                        break;
                                    default:
                                        data[name] = value;
                                        break;
                                }
                            });
                            feature.setData(data);
                            self.$events.trigger($.Event(TC.Consts.event.FEATUREMODIFY, { feature: feature, layer: self.layer }));
                            self.attributeEditor.hide();
                        });
                        $contentDiv.find('.' + self.CLASS + '-btn-attr-cancel').on('click', function () {
                            self.attributeEditor.hide();
                        });
                    });
                }
            });



        map.loaded(function () {
            if (self.options.layer) {
                self.setLayer(self.options.layer);
            }
            else {
                var wfsLayers = map.workLayers.filter(function (elm) {
                    return elm.type === TC.Consts.layerType.WFS && !elm.options.stealth;
                });
                if (wfsLayers.length === 1) {
                    self.setLayer(wfsLayers[0].id);
                }
                else {
                    self.setLayer(null);
                }
            }

            self.showChanges(self._showsChanges);

            self.renderPromise().then(function () {
                var DRAW = 'draw';
                $.when.apply(self, [
                    map.addControl(DRAW, {
                        id: drawPointsId,
                        div: self._$div.find('.' + self.CLASS + '-point'),
                        mode: TC.Consts.geom.POINT,
                        layer: false
                    }),
                    map.addControl(DRAW, {
                        id: drawLinesId,
                        div: self._$div.find('.' + self.CLASS + '-line'),
                        mode: TC.Consts.geom.POLYLINE,
                        layer: false
                    }),
                    map.addControl(DRAW, {
                        id: drawPolygonsId,
                        div: self._$div.find('.' + self.CLASS + '-polygon'),
                        mode: TC.Consts.geom.POLYGON,
                        layer: false
                    })
                ]).then (function (pntCtl, linCtl, pgnCtl) {
                    self.pointDraw = pntCtl;
                    self.lineDraw = linCtl;
                    self.polygonDraw = pgnCtl;

                    var drawendHandler = function (e) {
                        //var styleObj = {};
                        var feature = e.feature;
                        var featConstructor;
                        switch (self.geometryType) {
                            case TC.Consts.geom.POINT:
                                featConstructor = TC.feature.Point;
                                //$.extend(styleObj, self.layer.styles.point);
                                break;
                            case TC.Consts.geom.POLYLINE:
                                featConstructor = TC.feature.Polyline;
                                //$.extend(styleObj, self.layer.styles.line);
                                break;
                            case TC.Consts.geom.POLYGON:
                                featConstructor = TC.feature.Polygon;
                                //$.extend(styleObj, self.layer.styles.line, self.layer.styles.polygon);
                                break;
                            case TC.Consts.geom.MULTIPOLYLINE:
                                featConstructor = TC.feature.MultiPolyline;
                                //$.extend(styleObj, self.layer.styles.line);
                                break;
                            case TC.Consts.geom.MULTIPOLYGON:
                                featConstructor = TC.feature.MultiPolygon;
                                //$.extend(styleObj, self.layer.styles.line, self.layer.styles.polygon);
                                break;
                            default:
                                //$.extend(styleObj, self.layer.styles.line, self.layer.styles.polygon);
                                break;
                        }
                        if (featConstructor) {
                            feature = new featConstructor(feature.geometry, { geometryName: self.layer.options.geometryName });
                        }
                        //feature.setStyle(styleObj);
                        self.layer.addFeature(feature);
                        self.$events.trigger($.Event(TC.Consts.event.FEATUREADD, { feature: feature }));
                    };
                    var drawcancelHandler = function () {
                        self.cancel();
                    };
                    pntCtl
                        .on(TC.Consts.event.DRAWEND, drawendHandler)
                        .on(TC.Consts.event.DRAWCANCEL, drawcancelHandler);
                    linCtl
                        .on(TC.Consts.event.DRAWEND, drawendHandler)
                        .on(TC.Consts.event.DRAWCANCEL, drawcancelHandler);
                    pgnCtl
                        .on(TC.Consts.event.DRAWEND, drawendHandler)
                        .on(TC.Consts.event.DRAWCANCEL, drawcancelHandler);
                    if (self.options.modes && $.isArray(self.options.modes) && self.options.modes.length == 1) {
                        self.setMode(self.options.modes[0], null);
                    }
                });
            });
        });
        //self.miEvent = map.on(TC.Consts.event.FEATURESADD + ".HasFeatures", function (evt) {
        //    if (evt.layer == self.layer) {
        //        self.miEvent = map.off(TC.Consts.event.FEATURESADD + ".HasFeatures");
        //    }
        //});

        //if (!self.layer || self.layer.features.length==0)
        //self._$resetBtn.prop('disabled', true);
        //self._$deleteBtn.prop('disabled', true);

    };

    ctlProto.render = function (callback) {
        var self = this;
        var editLayers = [];
        if (self.map) {
            for (var i = 0, len = self.map.workLayers.length; i < len; i++) {
                var wl = self.map.workLayers[i];
                if (wl.type === TC.Consts.layerType.WFS && !wl.options.stealth) {
                    editLayers.push({
                        id: wl.id,
                        title: wl.title || wl.id
                    });
                }
            }
        }
        TC.Control.prototype.renderData.call(self, { layers: editLayers, showChanges: self.showChanges }, function () {

            self._$layerDiv = self._$div.find(self._classSelector + '-layer');
            self._$layerSelect = self._$layerDiv.find(self._classSelector + '-layer-sel').on('change', function (e) {
                self.setLayer(self._$layerSelect.val());
            });

            self._$layerDiv.find('#' + self.CLASS + '-view-changes-cb').on('change', function (e) {
                self.showChanges($(e.target).prop('checked'));
            });

            //self._$len = self._$div.find(self._classSelector + '-val-len');
            //self._$area = self._$div.find(self._classSelector + '-val-area');
            //self._$peri = self._$div.find(self._classSelector + '-val-peri');

            self._$cancelBtn = self._$div.find(self._classSelector + '-btn-cancel').on('click', function () {
                self.cancel();
            });

            self._$deleteBtn = self._$div.find(self._classSelector + '-btn-delete').on('click', function () {
                TC.confirm(self.eraseActionConfirmTxt, function () {
                    self.deleteFeatures(self.getSelectedFeatures());
                });
            });
            self._$joinBtn = self._$div.find(self._classSelector + '-btn-join').on('click', function () {
                self.joinFeatures(self.getSelectedFeatures());
            });
            self._$splitBtn = self._$div.find(self._classSelector + '-btn-split').on('click', function () {
                self.splitFeatures(self.getSelectedFeatures());
            });
            self._$saveBtn = self._$div.find(self._classSelector + '-btn-save').on('click', function () {
                self.applyEdits();
            });
            self._$discardBtn = self._$div.find(self._classSelector + '-btn-discard').on('click', function () {
                self.discardEdits();
            });
            //control de renderizado enfunción del modo de edicion        
            if (self.options.modes && $.isArray(self.options.modes) && self.options.modes.length > 0) {
                for (var m in TC.Consts.editMode)
                    if (typeof m == "string" && self.options.modes.indexOf(TC.Consts.editMode[m]) < 0) {
                        $("label" + self._classSelector + "-btn-" + TC.Consts.editMode[m], self._$div).remove();
                        $("div" + self._classSelector + "-" + TC.Consts.editMode[m], self._$div).remove();
                    }
                if (self.options.modes.length == 1) {
                    var mode = self.options.modes[0];
                    $("label" + self._classSelector + "-btn-" + mode, self._$div).css("display", "none");
                }


            }
            self._$div.find('input[type=radio][name=mode]').on('change', function () {
                var $cb = $(this);
                var newMode = $cb.val();
                var mode = self.mode === newMode ? undefined : newMode;
                self.setMode(mode);
            });

            if ($.isFunction(callback)) {
                callback();
            }
        });
    };

    ctlProto.setLayer = function (layer) {
        var self = this;
        self.layer = map.getLayer(layer);
        self.setMode(null);
        var rbSelector = 'input[type=radio][name=mode]';
        if (self.layer) {
            addChangesLayer(self, self.layer).then(function (changesLayer) {
                for (var key in self._changesLayers) {
                    var cl = self._changesLayers[key];
                    cl.setVisibility(self._showsChanges && cl === changesLayer);
                }
            });

            self.layer.describeFeatureType().then(function (attributes) {
                // recogemos los atributos no geométricos y definimos la geometría
                self.attributes = attributes.filter(function (elm) {
                    switch (elm.type) {
                        case 'gml:LinearRingPropertyType':
                        case 'gml:PolygonPropertyType':
                            self.geometryType = TC.Consts.geom.POLYGON;
                            return false;
                        case 'gml:MultiPolygonPropertyType':
                        case 'gml:MultiSurfacePropertyType':
                            self.geometryType = TC.Consts.geom.MULTIPOLYGON;
                            return false;
                        case 'gml:LineStringPropertyType':
                            self.geometryType = TC.Consts.geom.POLYLINE;
                            return false;
                        case 'gml:MultiLineStringPropertyType':
                            self.geometryType = TC.Consts.geom.MULTIPOLYLINE;
                            return false;
                        case 'gml:PointPropertyType':
                        case 'gml:MultiPointPropertyType':
                            self.geometryType = TC.Consts.geom.POINT;
                            return false;
                        case 'gml:BoxPropertyType':
                            self.geometryType = TC.Consts.geom.RECTANGLE;
                            return false;
                        case 'gml:GeometryCollectionPropertyType':
                        case 'gml:GeometryAssociationType':
                            return false;
                            break;
                        default:
                            return true;
                    }
                });
                for (var i = 0, len = self.attributes.length; i < len; i++) {
                    var attr = self.attributes[i];
                    attr.type = attr.type.substr(attr.type.indexOf(':') + 1);
                }
                self.renderPromise().then(function () {
                    setChangedState(self);
                    self._$div.find(self._classSelector + '-layer-sel').val(self.layer.id);

                    $rb = self._$div.find(rbSelector);
                    var selector;
                    switch (self.geometryType) {
                        case TC.Consts.geom.POINT:
                            selector = '[value=select],[value=' + TC.Consts.editMode.ADDPOINT + ']';
                            break;
                        case TC.Consts.geom.POLYLINE:
                        case TC.Consts.geom.MULTIPOLYLINE:
                            selector = '[value=select],[value=' + TC.Consts.editMode.ADDLINE + ']';
                            break;
                        case TC.Consts.geom.POLYGON:
                        case TC.Consts.geom.MULTIPOLYGON:
                            selector = '[value=select],[value=' + TC.Consts.editMode.ADDPOLYGON + ']';
                            break;
                        default:
                            selector = '[value]'
                            break;
                    }
                    var $activeRb = $rb.filter(selector).attr('disabled', false);
                    $rb.not($activeRb).attr('disabled', true);
                });
            });
            self._layerDeferred.resolve(self.layer);
        }
        else {
            self.renderPromise().then(function () {
                setChangedState(self, false);
                $rb = self._$div.find(rbSelector).attr('disabled', true);
                $rb.each(function (idx, elm) {
                    $(elm).prop('checked', false);
                });
            });
            self._layerDeferred.resolve(null);
        }
    };

    ctlProto.setMode = function (mode) {
        var self = this;
        self.mode = mode;
        setFeatureSelectReadyState(self);

        var activateDraw = function (draw) {
            if (draw) {
                if (self.snapping) {
                    draw.snapping = self.layer;
                }
                draw.activate();
            }
        };

        var $active, $hidden;
        switch (mode) {
            case TC.Consts.editMode.SELECT:
                $active = self._$div.find(self._classSelector + '-select');
                $hidden = self._$div.find(self._classSelector + '-point,' + self._classSelector + '-line,' + self._classSelector + '-polygon');
                self.activate();
                break;
            case TC.Consts.editMode.ADDPOINT:
                $active = self._$div.find(self._classSelector + '-point');
                $hidden = self._$div.find(self._classSelector + '-select,' + self._classSelector + '-line,' + self._classSelector + '-polygon');
                activateDraw(self.pointDraw);
                break;
            case TC.Consts.editMode.ADDLINE:
                $active = self._$div.find(self._classSelector + '-line');
                $hidden = self._$div.find(self._classSelector + '-select,' + self._classSelector + '-point,' + self._classSelector + '-polygon');
                activateDraw(self.lineDraw);
                break;
            case TC.Consts.editMode.ADDPOLYGON:
                $active = self._$div.find(self._classSelector + '-polygon');
                $hidden = self._$div.find(self._classSelector + '-select,' + self._classSelector + '-point,' + self._classSelector + '-line');
                activateDraw(self.polygonDraw);
                break;
            default:
                $active = $();
                $hidden = self._$div.find(self._classSelector + '-select,' + self._classSelector + '-point,' + self._classSelector + '-line,' + self._classSelector + '-polygon');
                if (self.isActive) {
                    self.deactivate();
                }
                if (self.pointDraw && self.pointDraw.isActive) {
                    self.pointDraw.deactivate();
                }
                if (self.lineDraw && self.lineDraw.isActive) {
                    self.lineDraw.deactivate();
                }
                if (self.polygonDraw && self.polygonDraw.isActive) {
                    self.polygonDraw.deactivate();
                }
                break;
        }

        // Class TC.Consts.classes.CHECKED is for IE8 support
        var $radio;
        if (mode) {
            $radio = self._$div.find('input[type=radio][name=mode][value=' + mode + ']').prop('checked', true).addClass(TC.Consts.classes.CHECKED);
            $radio.next().addClass(TC.Consts.classes.CHECKED);
        }
        else {
            $radio = self._$div.find('input[type=radio][name=mode]').prop('checked', false).removeClass(TC.Consts.classes.CHECKED);
            $radio.next().removeClass(TC.Consts.classes.CHECKED);
        }
        $active.removeClass(TC.Consts.classes.HIDDEN);
        //$($hidden).addClass(TC.Consts.classes.HIDDEN);
        $hidden.addClass(TC.Consts.classes.HIDDEN);
    };

    ctlProto.showChanges = function (show) {
        var self = this;
        self._showsChanges = show;
        for (var key in self._changesLayers) {
            var cl = self._changesLayers[key];
            cl.setVisibility(show && self.layer && key === self.layer.id);
        }
    };

    ctlProto.cancel = function () {
        var self = this;
        if (self.options.modes && $.isArray(self.options.modes) && self.options.modes.length == 1) {
            self.setMode(self.options.modes[0], null);
        }
        else {
            self.setMode(null, false);
        }
        self.wrap.cancel(true, self.cancelActionConfirmTxt);
    };

    ctlProto.onFeatureClick = function (e) {
        if (!self.activeControl || !self.activeControl.isExclusive()) {
            e.feature.show();
        }
    };
    
    ctlProto.activate = function (options) {
        //window.meas.deactivate();
        var self = this;
        TC.Control.prototype.activate.call(self);
        var opts = options || {};
        self._$cancelBtn.prop('disabled', false);
        $.when(self.getLayer()).then(function () {
            self.wrap.activate(opts.mode ? opts.mode : self.mode);
            TC.Control.prototype.activate.call(self);
        });
    };

    ctlProto.deactivate = function () {
        var self = this;
        TC.Control.prototype.deactivate.call(self);
        //self.features = {
        //    added: []
        //    , removed: []
        //};
        self.wrap.cancel(true);
        self._$cancelBtn.prop('disabled', true);
        self.wrap.deactivate();
    };

    ctlProto.isExclusive = function () {
        return true;
    };

    ctlProto.joinFeatures = function (features) {
        var self = this;
        if (self.geometryType === TC.Consts.geom.MULTIPOLYLINE ||
            self.geometryType === TC.Consts.geom.MULTIPOLYGON ||
            self.geometryType === TC.Consts.geom.MULTIPOINT) {
            self._joinedFeatureAttributes = [];
            if (features.length > 1) {
                var geometries = features.map(function (elm) {
                    self._joinedFeatureAttributes[self._joinedFeatureAttributes.length] = elm.getData();
                    return elm.geometry;
                });
                var newGeometry = geometries.reduce(function (a, b) {
                    return a.concat(b);
                });
                var newFeature = new features[0].constructor(newGeometry);
                for (var i = 0, len = features.length; i < len; i++) {
                    var feature = features[i];
                    self.layer.removeFeature(feature);
                    self.$events.trigger($.Event(TC.Consts.event.FEATUREREMOVE, { feature: feature }));
                }
                self.layer.addFeature(newFeature).then(function (feat) {
                    self.setSelectedFeatures([newFeature]);
                    self.$events.trigger($.Event(TC.Consts.event.FEATUREADD, { feature: feat }));
                    feat.showPopup(self.attributeEditor);
                });
            }
            setFeatureSelectedState(self, [newFeature]);
        }
    };

    ctlProto.splitFeatures = function (features) {
        var self = this;
        var complexFeatures = features.filter(complexGeometryFilter);
        var geometries = complexFeatures.map(function (elm) {
            return elm.geometry;
        });
        var newFeatures = [];
        for (var i = 0, ii = complexFeatures.length; i < ii; i++) {
            var feature = complexFeatures[i];
            var data = feature.getData();
            var geometry = geometries[i];
            for (var j = 0, jj = geometry.length; j < jj; j++) {
                newFeatures[newFeatures.length] = new feature.constructor([geometry[j]], { data: data });
            }
        }
        for (var i = 0, len = complexFeatures.length; i < len; i++) {
            var feature = complexFeatures[i];
            self.layer.removeFeature(feature);
            self.$events.trigger($.Event(TC.Consts.event.FEATUREREMOVE, { feature: feature }));
        }
        var newFeatDeferreds = new Array(newFeatures.length);
        for (var i = 0, len = newFeatures.length; i < len; i++) {
            var deferred = newFeatDeferreds[i] = self.layer.addFeature(newFeatures[i]);
            deferred.then(function (feat) {
                self.$events.trigger($.Event(TC.Consts.event.FEATUREADD, { feature: feat }));
            });
        }
        $.when.apply(this, newFeatDeferreds).then(function() {
            self.setSelectedFeatures(newFeatures);
        });
        setFeatureSelectedState(self, newFeatures);
    };

    ctlProto.deleteFeatures = function (features) {
        var self = this;
        self.wrap.deleteFeatures(features);
        if (self.layer.features.length === 0) {
            self._$deleteBtn.prop('disabled', true);
        }
    };

    ctlProto.applyEdits = function () {
        var self = this;
        if (self.layer) {
            var features = self.features[self.layer.id];
            self.layer.applyEdits(features.added, features.modified, features.removed).then(function () {
                // Las acciones a realizar a partir de este punto son las mismas que al descartar una edición
                self.discardEdits();
                self.map.toast('Cambios sincronizados con éxito con el servidor');
            },
            function (obj) {
                TC.error("Error [" + obj.code + "] al guardar cambios: " + obj.reason);
            });
        }
    };

    ctlProto.discardEdits = function () {
        var self = this;
        self._joinedFeatureAttributes = [];
        var storagePrefix = getStoragePrefix(self);
        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
            localforage.keys().then(function (keys) {
                if (keys) {
                    for (var i = 0, len = keys.length; i < len; i++) {
                        var key = keys[i];
                        if (key.indexOf(storagePrefix) === 0) {
                            localforage.removeItem(key);
                        }
                    }
                    if (self.layer) {
                        var features = self.features[self.layer.id];
                        features.added.length = 0;
                        features.modified.length = 0;
                        features.removed.length = 0;
                        self.setSelectedFeatures([]);
                        self.attributeEditor.hide();
                        var changesLayer = self._changesLayers[self.layer.id];
                        changesLayer.clearFeatures();
                        self.deleteCache(storagePrefix).then(function () {
                            self.layer.refresh();
                        });
                    }
                    setChangedState(self, false);
                }
            });
        });
    };

    //ctlProto.setFeature = function (feature) {
    //    var self = this;
    //    self.feature = feature;
    //}

    ctlProto.getSelectedFeatures = function () {
        return this.wrap.getSelectedFeatures();
    };

    ctlProto.setSelectedFeatures = function (features) {
        return this.wrap.setSelectedFeatures(features);
    };

    ctlProto.getLayer = function () {
        var self = this;
        return self.layer || self._layerDeferred;
    };

    ctlProto.getChangesLayerStyle = function (layer) {
        var getNegativeColor = function (color) {
            var str;
            var rgba = layer.wrap.getRGBA(color);
            for (var i = 0; i < 3; i++) {
                rgba[i] = 255 - rgba[i];
            }
            str = (rgba[0] * 65536 + rgba[1] * 256 + rgba[2]).toString(16);
            if (str.length === 4) {
                str = '00' + str;
            }
            else if (str.length === 5) {
                str = '0' + str;
            }
            return '#' + str;
        };

        var dash = [1, 3];
        var result = $.extend(true, {}, layer.options.styles);
        if (result.point) {
            result.point.strokeColor = getNegativeColor(result.point.strokeColor);
            result.point.lineDash = dash;
        }
        if (result.line) {
            result.line.strokeColor = getNegativeColor(result.line.strokeColor);
            result.line.lineDash = dash;
        }
        if (result.polygon) {
            result.polygon.strokeColor = getNegativeColor(result.polygon.strokeColor);
            result.polygon.lineDash = dash;
        }

        return result;
    };

})();
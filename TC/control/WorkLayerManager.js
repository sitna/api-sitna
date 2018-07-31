TC.control = TC.control || {};

if (!TC.control.TOC) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/TOC');
}

TC.control.WorkLayerManager = function () {
    var self = this;
    TC.control.TOC.apply(self, arguments);
    self.layers = [];
};

TC.inherit(TC.control.WorkLayerManager, TC.control.TOC);

(function () {
    var ctlProto = TC.control.WorkLayerManager.prototype;

    ctlProto.CLASS = 'tc-ctl-wlm';
    ctlProto.CLICKEVENT = 'click.tc';

    TC.Consts.classes.DRAG = TC.Consts.classes.DRAG || 'tc-drag';
    TC.Consts.classes.DRAGEND = TC.Consts.classes.DRAGEND || 'tc-dragend';

    TC.Consts.event.TOOLSOPEN = TC.Consts.event.TOOLSOPEN || 'toolsopen.tc';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/WorkLayerManager.html";
        ctlProto.template[ctlProto.CLASS + '-elm'] = TC.apiLocation + "TC/templates/WorkLayerManagerElement.html";
        ctlProto.template[ctlProto.CLASS + '-type-sgl'] = TC.apiLocation + "TC/templates/WorkLayerManagerTooltipSingle.html";
        ctlProto.template[ctlProto.CLASS + '-type-grp'] = TC.apiLocation + "TC/templates/WorkLayerManagerTooltipGroup.html";
        ctlProto.template[ctlProto.CLASS + '-type-grp-node'] = TC.apiLocation + "TC/templates/WorkLayerManagerTooltipGroupNode.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "loadedLayers" }).w("<span class=\"tc-ctl-wlm-n\"></span><button class=\"tc-ctl-wlm-del-all tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "removeAllLayersFromMap" }).w("\"></button></h2><div class=\"tc-ctl-wlm-empty\">").h("i18n", ctx, {}, { "$key": "noData" }).w("</div><div class=\"tc-ctl-wlm-content tc-hidden\"><form><ul>").s(ctx.get(["workLayers"], false), ctx, { "block": body_1 }, {}).w("</ul></form></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-wlm-elm", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-elm'] = function () { dust.register(ctlProto.CLASS + '-elm', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-wlm-elm\" tabindex=\"-1\"><div class=\"tc-ctl-wlm-lyr\">").x(ctx.get(["path"], false), ctx, { "block": body_1 }, {}).w("</div><div class=\"tc-ctl-wlm-type\"></div><div class=\"tc-ctl-wlm-path\" title=\"").s(ctx.get(["path"], false), ctx, { "else": body_2, "block": body_3 }, {}).w("\">").s(ctx.get(["path"], false), ctx, { "else": body_5, "block": body_6 }, {}).w("</div><div><div class=\"tc-ctl-wlm-btn-info\" title=\"").h("i18n", ctx, {}, { "$key": "infoFromThisLayer" }).w("\"></div><input type=\"range\" value=\"").f(ctx.get(["opacity"], false), ctx, "h").w("\" title=\"").h("i18n", ctx, {}, { "$key": "transparencyOfThisLayer" }).w("\" /><input type=\"checkbox\" ").nx(ctx.get(["hide"], false), ctx, { "block": body_8 }, {}).w(" title=\"").h("i18n", ctx, {}, { "$key": "visibilityOfThisLayer" }).w("\" /></div><div class=\"tc-ctl-wlm-info tc-hidden\">").x(ctx.get(["abstract"], false), ctx, { "block": body_9 }, {}).x(ctx.get(["customLegend"], false), ctx, { "else": body_10, "block": body_13 }, {}).x(ctx.get(["metadata"], false), ctx, { "block": body_14 }, {}).w("</div><div class=\"tc-ctl-wlm-dd ").x(ctx.get(["hide"], false), ctx, { "block": body_16 }, {}).w("\" title=\"").h("i18n", ctx, {}, { "$key": "dragToReorder" }).w("\"></div><div class=\"tc-ctl-wlm-del ").nx(ctx.get(["hide"], false), ctx, { "block": body_17 }, {}).w("\" title=\"").h("i18n", ctx, {}, { "$key": "removeLayerFromMap" }).w("\"></div></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.f(ctx.get(["title"], false), ctx, "h"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.f(ctx.get(["title"], false), ctx, "h"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.f(ctx.getPath(true, []), ctx, "h").h("sep", ctx, { "block": body_4 }, {}); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w(" &bull; "); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.f(ctx.get(["title"], false), ctx, "h"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.f(ctx.getPath(true, []), ctx, "h").h("sep", ctx, { "block": body_7 }, {}); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w(" &bull; "); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.w("checked=\"checked\""); } body_8.__dustBody = !0; function body_9(chk, ctx) { return chk.w("<div class=\"tc-ctl-wlm-abstract\"><h4>").h("i18n", ctx, {}, { "$key": "abstract" }).w("</h4><div><pre>").f(ctx.get(["abstract"], false), ctx, "h", ["s"]).w("</pre></div></div>"); } body_9.__dustBody = !0; function body_10(chk, ctx) { return chk.x(ctx.get(["legend"], false), ctx, { "block": body_11 }, {}); } body_10.__dustBody = !0; function body_11(chk, ctx) { return chk.w("<div class=\"tc-ctl-wlm-legend\" data-tc-layer-name=\"").f(ctx.get(["layerNames"], false), ctx, "h").w("\"><h4>").h("i18n", ctx, {}, { "$key": "content" }).w("</h4>").s(ctx.get(["legend"], false), ctx, { "block": body_12 }, {}).w("</div>"); } body_11.__dustBody = !0; function body_12(chk, ctx) { return chk.w("<div><p>").f(ctx.get(["title"], false), ctx, "h").w("</p><img data-tc-img=\"").f(ctx.get(["src"], false), ctx, "h").w("\" /></div>"); } body_12.__dustBody = !0; function body_13(chk, ctx) { return chk.w("<ul class=\"tc-ctl-wlm-custom-legend\">").f(ctx.get(["customLegend"], false), ctx, "h", ["s"]).w("</ul>"); } body_13.__dustBody = !0; function body_14(chk, ctx) { return chk.w("<div class=\"tc-ctl-wlm-metadata\"><h4>").h("i18n", ctx, {}, { "$key": "metadata" }).w("</h4><ul>").s(ctx.get(["metadata"], false), ctx, { "block": body_15 }, {}).w("</ul></div>"); } body_14.__dustBody = !0; function body_15(chk, ctx) { return chk.w("<li><a href=\"").f(ctx.get(["url"], false), ctx, "h", ["s"]).w("\" type=\"").f(ctx.get(["format"], false), ctx, "h").w("\" title=\"").f(ctx.get(["formatDescription"], false), ctx, "h").w("\" target=\"_blank\">").f(ctx.get(["formatDescription"], false), ctx, "h").w("</a></li>"); } body_15.__dustBody = !0; function body_16(chk, ctx) { return chk.w("tc-hidden"); } body_16.__dustBody = !0; function body_17(chk, ctx) { return chk.w("tc-hidden"); } body_17.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-type-sgl'] = function () { dust.register(ctlProto.CLASS + '-type-sgl', body_0); function body_0(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "singleLayer" }); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-type-grp'] = function () { dust.register(ctlProto.CLASS + '-type-grp', body_0); function body_0(chk, ctx) { return chk.w("<div>").h("i18n", ctx, {}, { "$key": "groupLayerThatContains" }).w(":</div><ul>").s(ctx.get(["Layer"], false), ctx, { "block": body_1 }, {}).w("</ul>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-wlm-type-grp-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-type-grp-node'] = function () { dust.register(ctlProto.CLASS + '-type-grp-node', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-wlm-tip-grp-elm\"><span>").f(ctx.get(["Title"], false), ctx, "h").w("</span><ul>").s(ctx.get(["Layer"], false), ctx, { "block": body_1 }, {}).w("</ul></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-wlm-type-grp-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
    }

    var _dataKeys = {
        layer: 'tcLayer'
    };

    var findLayerElement = function (ctl, layer) {
        var result;
        ctl._$div.find('li.' + ctl.CLASS + '-elm').each(function (idx, elm) {
            var $li = $(elm);
            if ($li.data(_dataKeys.layer) === layer) {
                result = $li;
                return false;
            }
        });
        return result;
    };

    var getElligibleLayersNumber = function (ctl) {
        return $.grep(ctl.map.workLayers, function (lyr) {
            return !lyr.stealth;
        }).length;
    };

    ctlProto.register = function (map) {
        var self = this;

        TC.control.TOC.prototype.register.call(self, map);

        // Este control no tiene que aceptar servicios externos directamente
        map.off(TC.Consts.event.EXTERNALSERVICEADDED);

        map
            .on(TC.Consts.event.LAYEROPACITY, function (e) {
                var $li = findLayerElement(self, e.layer);
                if ($li) {
                    $li.find('input[type=range]').val(Math.round(e.opacity * 100));
                }
            })
            .on(TC.Consts.event.FEATURESIMPORT, function (e) {
                var fileName = e.fileName;
                if (e.features && e.features.length > 0) { // GLS: Escuchamos al evento FEATURESIMPORT para poder desplegar el control de capas cargadas
                    // Ignoramos los GPX (se supone que los gestionará Geolocation)
                    var pattern = '.' + TC.Consts.format.GPX.toLowerCase();
                    if (e.fileName.toLowerCase().indexOf(pattern) === e.fileName.length - pattern.length) {
                        return;
                    }

                    map.one(TC.Consts.event.LAYERADD, function (e) {
                        if (e && e.layer && e.layer.title == fileName) {
                            // Desplegamos el control capas cargadas
                            if (self.map && self.map.layout && self.map.layout.accordion) {
                                if (self._$div.hasClass(TC.Consts.classes.COLLAPSED)) {
                                    for (var i = 0; i < self.map.controls.length; i++) {
                                        if (self.map.controls[i] !== self) {
                                            self.map.controls[i]._$div.addClass(TC.Consts.classes.COLLAPSED);
                                        }
                                    }
                                }
                            }

                            // abrimos el panel de herramientas
                            self.map.$events.trigger($.Event(TC.Consts.event.TOOLSOPEN), {});

                            self._$div.removeClass(TC.Consts.classes.COLLAPSED);
                        }
                    });
                }
            });
    };

    ctlProto._addBrowserEventHandlers = function () {
        var self = this;
        self._$div
            .on(self.CLICKEVENT, 'input[type=checkbox]', function (e) {
                // al estar en ipad el evento pasa a ser touchstart en la constante: TC.Consts.event.CLICK, los checkbox no funcionan bien con este evento
                var $cb = $(e.target);

                var $li = $cb.parents('li.' + self.CLASS + '-elm').first();
                var layer = $li.data(_dataKeys.layer);
                var checked = $cb.prop('checked');

                layer.setVisibility(checked);

                e.stopPropagation();
            })
            .on('change input', 'input[type=range]', function (e) {
                var $range = $(e.target);

                var layer = $range.parents('li').first().data(_dataKeys.layer);
                layer.setOpacity($range.val() / 100);
            })
            .on(self.CLICKEVENT, '.' + self.CLASS + '-del', function (e) {
                var $li = $(e.target).parents('li').first();
                var layer = $li.data(_dataKeys.layer);
                self.map.removeLayer(layer);
            })
            .on(self.CLICKEVENT, '.' + self.CLASS + '-del-all', function (e) {
                TC.confirm(self.getLocaleString('layersRemove.confirm'), function () {
                    var $lis = self._$div.find('li.' + self.CLASS + '-elm');
                    var layers = new Array($lis.length);
                    $lis.each(function (idx, elm) {
                        layers[idx] = $(elm).data(_dataKeys.layer);
                    });
                    for (var i = 0, len = layers.length; i < len; i++) {
                        self.map.removeLayer(layers[i]);
                    }
                });
            })
            .on(self.CLICKEVENT, '.' + self.CLASS + '-btn-info', function (e) {
                var $a = $(e.target);
                var $li = $a.parents('li').first();
                var $info = $li.find('.' + self.CLASS + '-info');
                // Cargamos la imagen de la leyenda
                $info.find('.' + self.CLASS + '-legend img').each(function (idx, img) {
                    var layer = $li.data(_dataKeys.layer);
                    self.styleLegendImage($(img), layer);
                });
                $info.toggleClass(TC.Consts.classes.HIDDEN);

                if ($li.find('input[type="checkbox"]').is(':checked')) {
                    $li.find('.' + self.CLASS + '-dd').toggleClass(TC.Consts.classes.HIDDEN, !$info.hasClass(TC.Consts.classes.HIDDEN));
                }
                $a.toggleClass(TC.Consts.classes.CHECKED);
            });
    };

    ctlProto.updateLayerVisibility = function (layer) {
        var self = this;
        var $li = findLayerElement(self, layer);
        if ($li) {
            var visible = layer.getVisibility();
            $li.find('.' + self.CLASS + '-del').toggleClass(TC.Consts.classes.HIDDEN, visible);

            if ($li.find('.' + self.CLASS + '-info').hasClass(TC.Consts.classes.HIDDEN)) {
                $li.find('.' + self.CLASS + '-dd').toggleClass(TC.Consts.classes.HIDDEN, !visible);
            }
        }
    };

    ctlProto.updateLayerTree = function (layer) {
        var self = this;

        var moveLayer = function ($source, $target, callback) {
            var $lis;
            if ($source !== $target) {
                var sourceLayer = $source.data(_dataKeys.layer);
                var targetLayer = $target.data(_dataKeys.layer);

                var newIdx = -1;
                for (var i = 0; i < self.map.layers.length; i++) {
                    if (targetLayer === self.map.layers[i]) {
                        newIdx = i;
                        break;
                    }
                }
                if (newIdx >= 1 && newIdx < self.map.layers.length) {
                    self.map.insertLayer(sourceLayer, newIdx, callback);
                }
            }
        };

        var getLegendImgByPost = function (layer) {
            var deferred = $.Deferred();

            if (layer && layer.options.method && layer.options.method === "POST") {
                layer.getLegendGraphicImage()
                    .done(function (src) {
                        deferred.resolve(src);
                    })
                .fail(function (err) { TC.error(err); });
            } else {
                deferred.resolve();
            }
            return deferred.promise();
        };

        if (!layer.isBase && !layer.options.stealth) {
            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            var alreadyExists = false;
            for (var i = 0, len = self.layers.length; i < len; i++) {
                if (layer === self.layers[i]) {
                    alreadyExists = true;
                    break;
                }
            }

            if (!alreadyExists) {
                var template = self.CLASS + '-elm';
                self.layers.push(layer);

                TC.loadJSInOrder(
                    !window.dust,
                    TC.url.templating,
                    function () {
                        TC.loadJS(
                            !$.fn.drag,
                            [TC.apiLocation + 'lib/jQuery/jquery.event.drag.js'],
                            function () {
                                var layerTitle = layer.title || layer.wrap.getServiceTitle();
                                var layerData = {
                                    title: layer.options.hideTitle ? '' : layerTitle,
                                    hide: layer.renderOptions && layer.renderOptions.hide ? true : false,
                                    opacity: layer.renderOptions && layer.renderOptions.opacity ? (layer.renderOptions.opacity * 100) : 100,
                                    customLegend: layer.customLegend
                                };
                                var isRaster = layer.isRaster();
                                if (isRaster) {
                                    layerData.layerNames = layer.layerNames;
                                    var path = layer.getPath();
                                    path.shift();
                                    layerData.path = path;
                                    var name = layer.names[0];
                                    var info = layer.wrap.getInfo(name);
                                    layerData.legend = info.legend;
                                    layerData['abstract'] = info['abstract'];
                                    var hasInfo = (info.hasOwnProperty('abstract') || info.hasOwnProperty('legend') || info.hasOwnProperty('metadata'));
                                    var metadata;
                                    if (layer.tree && layer.tree.children && layer.tree.children.length && layer.tree.children[0].children && layer.tree.children[0].children.length) {
                                        metadata = null;
                                    }
                                    else {
                                        metadata = info.metadata;
                                        if (metadata) {
                                            for (var j = 0, len = metadata.length; j < len; j++) {
                                                var md = metadata[j];
                                                md.formatDescription = self.getLocaleString(TC.Util.getSimpleMimeType(md.format)) || self.getLocaleString('viewMetadata');
                                            }
                                        }
                                    }
                                    layerData.metadata = metadata;
                                }


                                getLegendImgByPost(layer).done(function (src) {
                                    if (src) {
                                        legend.src = layer.getLegendUrl(src);
                                    }


                                    dust.render(template, layerData, function (err, out) {
                                        var $li = $(out);
                                        var layerNode;
                                        var isGroup = false;
                                        if (isRaster) {
                                            isGroup = layer.names.length > 1;
                                            if (!isGroup) {
                                                var layerNodes = layer.wrap.getAllLayerNodes();
                                                for (var i = 0; i < layerNodes.length; i++) {
                                                    var node = layerNodes[i];
                                                    if (layer.wrap.getName(node) === name) {
                                                        layerNode = node;
                                                        if (layer.wrap.getLayerNodes(node).length > 0) {
                                                            isGroup = true;
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                        }

                                        var $type = $li.find('.' + self.CLASS + '-type');
                                        var className = isGroup ? self.CLASS + '-type-grp' : self.CLASS + '-type-sgl';
                                        $type.addClass(className);

                                        if (!hasInfo) {
                                            $li.find('.' + self.CLASS + '-btn-info').addClass(TC.Consts.classes.HIDDEN);
                                        }

                                        if (layerNode) {
                                            layer.wrap.normalizeLayerNode(layerNode);

                                            dust.render(className, layerNode, function (err, out) {
                                                var $tip;
                                                $type
                                                    .on('mouseover', function (e) {
                                                        var offset = $type.offset();
                                                        var ref = $(self.map.div).offset();
                                                        $tip = $('<div>').addClass(self.CLASS + '-tip').html(out).css({
                                                            top: (offset.top - ref.top) + 'px',
                                                            right: $(self.map.div).width() - (offset.left - ref.left) + 'px'
                                                        }).appendTo(self.map.div);
                                                    }).on('mouseout', function (e) {
                                                        $tip.remove();
                                                    });
                                            });
                                        }
                                        var $ul = self._$div.find('ul').first();
                                        $li.data(_dataKeys.layer, layer);
                                        $li
                                            .drag("start", function (e, dd) {
                                                var $drag = $(this);
                                                var $lis = $ul.children('li');
                                                $lis.not($drag).addClass(TC.Consts.classes.DRAGEND);
                                                var dragIdx = $lis.index($drag);
                                                $drag.css('zIndex', 100).addClass(TC.Consts.classes.DRAG);
                                                var $lastLi = $lis.last();
                                                var positionLi = $drag.position();
                                                dd.limit = {
                                                    top: $lis.first().position().top - positionLi.top,
                                                    bottom: $lastLi.height() + $lastLi.position().top - positionLi.top - $drag.height() - 1
                                                };
                                                dd.dropTargetIndex = -1;
                                            })
                                            .drag("end", function (e, dd) {
                                                var $drag = $(this);
                                                $drag
                                                    .removeClass(TC.Consts.classes.DRAG)
                                                    .addClass(TC.Consts.classes.DRAGEND);

                                                var getDeltaYFromTransform = function (transform) {
                                                    // css('transform') tendrá un valor así: 'matrix(1, 0, 0, 1, 0, Y)'
                                                    return parseInt(transform.substr(transform.lastIndexOf(',') + 1));
                                                };

                                                var dragDeltaY = getDeltaYFromTransform($drag.css('transform'));
                                                var dragLiTop = this.getBoundingClientRect().top - dragDeltaY;
                                                var dropElm;
                                                var $drop;
                                                if (dd.dropTargetIndex >= 0) {
                                                    dropElm = $ul.children('li').get(dd.dropTargetIndex);
                                                    $drop = $(dropElm);
                                                    var dropDeltaY = getDeltaYFromTransform($drop.css('transform'));
                                                    var dropLiTop = dropElm.getBoundingClientRect().top - dropDeltaY;
                                                }
                                                $drag.css('transform', $drop ? 'translateY(' + (dropLiTop - dragLiTop) + 'px)' : '');
                                                var transitionEnd = 'transitionend.tc';
                                                $drag.on(transitionEnd, function transitionEndHandler(e) {
                                                    if (e.originalEvent.propertyName === 'transform') {
                                                        $drag
                                                            .off(transitionEnd, transitionEndHandler)
                                                            .removeClass(TC.Consts.classes.DRAGEND)
                                                            .css('zIndex', '');
                                                        if ($drop) {
                                                            moveLayer($drag, $drop, function () {
                                                                $ul.children('li')
                                                                    .css('transform', '')
                                                                    .removeClass(TC.Consts.classes.DRAGEND);
                                                            });
                                                        }
                                                    }
                                                });
                                            })
                                            .drag(function (e, dd) {
                                                var $drag = $(this);
                                                var deltaY = Math.min(Math.max(dd.limit.top, Math.round(dd.deltaY)), dd.limit.bottom);
                                                var clientRect = this.getBoundingClientRect();
                                                var dragHeight = clientRect.height - 1;
                                                var yMiddle = (clientRect.top + clientRect.bottom) / 2;
                                                var yThresholds = [];
                                                var dragIdx;
                                                var $lis = $ul.children('li');
                                                $lis.each(function (idx, elm) {
                                                    var cr = elm.getBoundingClientRect();
                                                    yThresholds[idx] = { elm: elm, top: cr.top, bottom: cr.bottom };
                                                    if (elm === dd.drag) {
                                                        dragIdx = idx;
                                                    }
                                                });
                                                var tValue;
                                                var dropTargetIdx = -1;
                                                for (var i = 0, len = yThresholds.length; i < len; i++) {
                                                    var th = yThresholds[i];
                                                    if (i < dragIdx) {
                                                        if (yMiddle < th.bottom) {
                                                            if (yMiddle > th.top && dd.deltaY > dd.prevDeltaY) {
                                                                tValue = '';
                                                            }
                                                            else {
                                                                tValue = 'translateY(' + dragHeight + 'px)';
                                                                if (dropTargetIdx < 0) {
                                                                    dropTargetIdx = i;
                                                                }
                                                            }
                                                        }
                                                        else {
                                                            tValue = '';
                                                        }
                                                        $(th.elm).css('transform', tValue);
                                                    }
                                                    else if (i > dragIdx) {
                                                        if (yMiddle > th.top) {
                                                            if (yMiddle < th.bottom && dd.deltaY < dd.prevDeltaY) {
                                                                tValue = '';
                                                            }
                                                            else {
                                                                tValue = 'translateY(-' + dragHeight + 'px)';
                                                                dropTargetIdx = i;
                                                            }
                                                        }
                                                        else {
                                                            tValue = '';
                                                        }
                                                        $(th.elm).css('transform', tValue);
                                                    }
                                                }
                                                dd.dropTargetIndex = dropTargetIdx;
                                                $drag.css('transform', 'translateY(' + deltaY + 'px)');
                                                dd.prevDeltaY = dd.deltaY;
                                            },
                                            {
                                                handle: '.' + self.CLASS + '-dd'
                                            }
                                            )
                                            .on('keydown', function (e) {
                                                // Para mover capas con el teclado.
                                                var elm = this;
                                                var setFocus = function () {
                                                    elm.focus();
                                                }
                                                var $elm = $(this);
                                                switch (true) {
                                                    case /Up$/.test(e.key):
                                                        var $prev = $elm.prev();
                                                        if ($prev.length) {
                                                            moveLayer($elm, $prev, setFocus);
                                                        }
                                                        break;
                                                    case /Down$/.test(e.key):
                                                        var $next = $elm.next();
                                                        if ($next.length) {
                                                            moveLayer($elm, $next, setFocus);
                                                        }
                                                        break;
                                                    default:
                                                        break;
                                                }

                                                //e.stopPropagation();
                                            });

                                        const insertIdx = self.map.workLayers
                                            .filter(function (l) {
                                                return !l.stealth;
                                            })
                                            .reverse()
                                            .indexOf(layer);
                                        const $lis = $ul.find('li.' + self.CLASS + '-elm');
                                        if ($lis.length <= insertIdx) {
                                            $ul.append($li);
                                        }
                                        else {
                                            $li.insertBefore($lis[insertIdx]);
                                        }
                                        self.updateScale();
                                    });
                                });
                            }
                        );
                    }
                );

                var elligibleLayersNum = getElligibleLayersNumber(self);
                $('.' + self.CLASS + '-n').text(elligibleLayersNum).toggleClass(TC.Consts.classes.VISIBLE, elligibleLayersNum > 0);

                self._$div.find('.' + self.CLASS + '-empty').toggleClass(TC.Consts.classes.HIDDEN, elligibleLayersNum > 0);
                self._$div.find('.' + self.CLASS + '-content').toggleClass(TC.Consts.classes.HIDDEN, elligibleLayersNum === 0);
                self._$div.find('.' + self.CLASS + '-del-all').toggleClass(TC.Consts.classes.HIDDEN, false);
            }
        }
    };

    ctlProto.updateScale = function () {
        var self = this;
        self._$div.find('ul').find('li.' + self.CLASS + '-elm').each(function (idx, elm) {
            var $li = $(elm);
            var layer = $li.data(_dataKeys.layer);
            if (layer.names) {
                var isVisible = false;
                for (var i = 0; i < layer.names.length; i++) {
                    if (layer.isVisibleByScale(layer.names[i])) {
                        isVisible = true;
                        break;
                    }
                }
                $li.toggleClass(self.CLASS + '-elm-notvisible', !isVisible);
            }
        });
    };

    ctlProto.updateLayerOrder = function (layer, oldIdx, newIdx) {
        TC.control.MapContents.prototype.updateLayerOrder.call(this, layer, oldIdx, newIdx);
    };

    ctlProto.removeLayer = function (layer) {
        var self = this;
        var idx = self.layers.indexOf(layer);
        if (idx >= 0) {
            self.layers.splice(idx, 1);
        }
        var $ul = self._$div.find('ul').first();
        $ul.find('li.' + self.CLASS + '-elm').each(function (idx, elm) {
            var $li = $(elm);
            if ($li.data(_dataKeys.layer) === layer) {
                $li.remove();
                return false;
            }
        });
        var nChildren = getElligibleLayersNumber(self);
        self._$div.find('.' + self.CLASS + '-del-all').toggleClass(TC.Consts.classes.HIDDEN, nChildren === 0);
        self._$div.find('.' + self.CLASS + '-content').toggleClass(TC.Consts.classes.HIDDEN, nChildren === 0);
        self._$div.find('.' + self.CLASS + '-empty').toggleClass(TC.Consts.classes.HIDDEN, nChildren > 0);
        $('.' + self.CLASS + '-n').text(nChildren).toggleClass(TC.Consts.classes.VISIBLE, nChildren > 0);
    };

    ctlProto.getLayerUIElements = function () {
        var self = this;
        return self._$div.find('ul').first().children('li.' + self.CLASS + '-elm');
    };

    var _controlRemoveAllLayersBtnVisibility = function () {
        var self = this;
        var layersLoaded = self._$div.find('li');

        if (layersLoaded && layersLoaded.length > 0) {

        }
    }
})();
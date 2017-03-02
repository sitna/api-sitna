TC.control = TC.control || {};

if (!TC.control.TOC) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/TOC.js');
}

TC.control.ListTOC = function () {
    var self = this;
    TC.control.TOC.apply(self, arguments);
    self.layers = [];
};

TC.inherit(TC.control.ListTOC, TC.control.TOC);

(function () {
    var ctlProto = TC.control.ListTOC.prototype;

    ctlProto.CLASS = 'tc-ctl-ltoc';
    ctlProto.CLICKEVENT = 'click.tc';

    TC.Consts.classes.DRAG = TC.Consts.classes.DRAG || 'tc-drag';
    TC.Consts.classes.DRAGEND = TC.Consts.classes.DRAGEND || 'tc-dragend';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/ListTOC.html";
        ctlProto.template[ctlProto.CLASS + '-elm'] = TC.apiLocation + "TC/templates/ListTOCElement.html";
        ctlProto.template[ctlProto.CLASS + '-type-sgl'] = TC.apiLocation + "TC/templates/ListTOCTooltipSingle.html";
        ctlProto.template[ctlProto.CLASS + '-type-grp'] = TC.apiLocation + "TC/templates/ListTOCTooltipGroup.html";
        ctlProto.template[ctlProto.CLASS + '-type-grp-node'] = TC.apiLocation + "TC/templates/ListTOCTooltipGroupNode.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "loadedLayers" }).w("<span class=\"tc-ctl-ltoc-n\"></span><button class=\"tc-ctl-ltoc-del-all tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "removeAllLayersFromMap" }).w("\"></button></h2><div class=\"tc-ctl-ltoc-empty\">").h("i18n", ctx, {}, { "$key": "noData" }).w("</div><div class=\"tc-ctl-ltoc-content\"><form><ul>").s(ctx.get(["workLayers"], false), ctx, { "block": body_1 }, {}).w("</ul></form></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-ltoc-elm", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-elm'] = function () { dust.register(ctlProto.CLASS + '-elm', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-ltoc-elm\"><div class=\"tc-ctl-ltoc-lyr\">").f(ctx.get(["title"], false), ctx, "h").w("</div><div class=\"tc-ctl-ltoc-type\"></div><div class=\"tc-ctl-ltoc-path\">").s(ctx.get(["path"], false), ctx, { "block": body_1 }, {}).w("</div><div><div class=\"tc-ctl-ltoc-btn-info\" title=\"").h("i18n", ctx, {}, { "$key": "infoFromThisLayer" }).w("\"></div><input type=\"range\" value=\"").f(ctx.get(["opacity"], false), ctx, "h").w("\" title=\"").h("i18n", ctx, {}, { "$key": "transparencyOfThisLayer" }).w("\" /><input type=\"checkbox\" ").nx(ctx.get(["hide"], false), ctx, { "block": body_3 }, {}).w(" title=\"").h("i18n", ctx, {}, { "$key": "visibilityOfThisLayer" }).w("\" /></div><div class=\"tc-ctl-ltoc-info tc-hidden\">").x(ctx.get(["abstract"], false), ctx, { "block": body_4 }, {}).x(ctx.get(["legend"], false), ctx, { "block": body_5 }, {}).x(ctx.get(["metadata"], false), ctx, { "block": body_7 }, {}).w("</div><div class=\"tc-ctl-ltoc-dd ").x(ctx.get(["hide"], false), ctx, { "block": body_9 }, {}).w("\" title=\"").h("i18n", ctx, {}, { "$key": "dragToReorder" }).w("\"></div><div class=\"tc-ctl-ltoc-del ").nx(ctx.get(["hide"], false), ctx, { "block": body_10 }, {}).w("\" title=\"").h("i18n", ctx, {}, { "$key": "removeLayerFromMap" }).w("\"></div></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.f(ctx.getPath(true, []), ctx, "h").h("sep", ctx, { "block": body_2 }, {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w(" &bull; "); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("checked=\"checked\""); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("<div class=\"tc-ctl-ltoc-abstract\"><h4>").h("i18n", ctx, {}, { "$key": "abstract" }).w("</h4><div>").f(ctx.get(["abstract"], false), ctx, "h").w("</div></div>"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w("<div class=\"tc-ctl-ltoc-legend\" data-tc-layer-name=\"").f(ctx.get(["layerNames"], false), ctx, "h").w("\"><h4>").h("i18n", ctx, {}, { "$key": "content" }).w("</h4>").s(ctx.get(["legend"], false), ctx, { "block": body_6 }, {}).w(" </div>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w("<div><p>").f(ctx.get(["title"], false), ctx, "h").w("</p><img data-tc-img=\"").f(ctx.get(["src"], false), ctx, "h").w("\" /></div>"); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w("<div class=\"tc-ctl-ltoc-metadata\"><h4>").h("i18n", ctx, {}, { "$key": "metadata" }).w("</h4><ul>").s(ctx.get(["metadata"], false), ctx, { "block": body_8 }, {}).w("</ul></div>"); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.w("<li><a href=\"").f(ctx.get(["url"], false), ctx, "h").w("\" target=\"_blank\">").f(ctx.get(["formatDescription"], false), ctx, "h").w("</a></li>"); } body_8.__dustBody = !0; function body_9(chk, ctx) { return chk.w("tc-hidden"); } body_9.__dustBody = !0; function body_10(chk, ctx) { return chk.w("tc-hidden"); } body_10.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-type-sgl'] = function () { dust.register(ctlProto.CLASS + '-type-sgl', body_0); function body_0(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "singleLayer" }); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-type-grp'] = function () { dust.register(ctlProto.CLASS + '-type-grp', body_0); function body_0(chk, ctx) { return chk.w("<div>").h("i18n", ctx, {}, { "$key": "groupLayerThatContains" }).w(":</div><ul>").s(ctx.get(["Layer"], false), ctx, { "block": body_1 }, {}).w("</ul>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-ltoc-type-grp-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-type-grp-node'] = function () { dust.register(ctlProto.CLASS + '-type-grp-node', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-ltoc-tip-grp-elm\"><span>").f(ctx.get(["Title"], false), ctx, "h").w("</span><ul>").s(ctx.get(["Layer"], false), ctx, { "block": body_1 }, {}).w("</ul></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-ltoc-type-grp-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
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
        map.$events.off(TC.Consts.event.EXTERNALSERVICEADDED);

        self._$div // GLS: como se trata de un override, desactivamos el click al que está suscrito por herencia y aplicamos el del override
            .off(TC.Consts.event.CLICK, 'input[type=checkbox]')
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
                map.removeLayer(layer);
            })
            .on(self.CLICKEVENT, '.' + self.CLASS + '-del-all', function (e) {
                TC.confirm(self.getLocaleString('layersRemove.confirm'), function () {
                    var $lis = self._$div.find('li.' + self.CLASS + '-elm');
                    var layers = new Array($lis.length);
                    $lis.each(function (idx, elm) {
                        layers[idx] = $(elm).data(_dataKeys.layer);
                    });
                    for (var i = 0, len = layers.length; i < len; i++) {
                        map.removeLayer(layers[i]);
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

        map
            .on(TC.Consts.event.LAYEROPACITY, function (e) {
                var $li = findLayerElement(self, e.layer);
                if ($li) {
                    $li.find('input[type=range]').val(Math.round(e.opacity * 100));
                }
            })
            .on(TC.Consts.event.LAYERORDER, function (e) {
                if (e.oldIndex >= 0 && e.oldIndex !== e.newIndex) {
                    var $currentLi, $previousLi;
                    var $ul = self._$div.find('ul').first();
                    var $lis = $ul.children('li.' + self.CLASS + '-elm');
                    for (var i = map.workLayers.length - 1; i >= 0; i--) {
                        var layer = map.workLayers[i];
                        $previousLi = $currentLi;
                        $lis.each(function (idx, elm) {
                            var $li = $(elm);
                            if ($li.data(_dataKeys.layer) === layer) {
                                $currentLi = $li;
                                return false;
                            }
                        });
                        if (layer === e.layer) {
                            if ($previousLi) {
                                $previousLi.after($currentLi);
                            }
                            else {
                                $ul.prepend($currentLi);
                            }
                            break;
                        }
                    }
                }
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
                            !$.fn.drag || !$.fn.drop,
                            [TC.apiLocation + 'lib/jQuery/jquery.event.drag.js', TC.apiLocation + 'lib/jQuery/jquery.event.drop.js'],
                            function () {
                                $.drop({ mode: 'middle' });

                                var layerTitle = layer.title ? layer.title : layer.capabilities.Service.Title;
                                var layerData = {
                                    title: layer.options.hideTitle ? '' : layerTitle,
                                    hide: layer.renderOptions && layer.renderOptions.hide ? true : false,
                                    opacity: layer.renderOptions && layer.renderOptions.opacity ? (layer.renderOptions.opacity * 100) : 100
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
                                        legend.src = src;
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
                                                $drag.css('zIndex', 100).addClass(TC.Consts.classes.DRAG);
                                                var positionLi = $drag.position();
                                                var positionUl = $ul.position();
                                                dd.limit = { top: -positionLi.top + positionUl.top, bottom: $ul.height() + positionUl.top - positionLi.top - $drag.height() };
                                            })
                                            .drag("end", function (e, dd) {
                                                var $drag = $(this);
                                                if (!dd.drop.length) {
                                                    $drag
                                                        .css({
                                                            transform: '',
                                                            zIndex: ''
                                                        })
                                                        .removeClass(TC.Consts.classes.DRAG);
                                                }
                                                else {
                                                    $drag.addClass(TC.Consts.classes.DRAGEND);
                                                    for (var i = 0; i < dd.drop.length; i++) {
                                                        $(dd.drop[i]).removeClass(TC.Consts.classes.DROP);
                                                    }
                                                    var $drop = $(dd.drop[0]);
                                                    var deltaY = $drag.css('transform');
                                                    deltaY = parseInt(deltaY.substr(deltaY.lastIndexOf(',') + 1));
                                                    var dragLiTop = $drag.position().top - deltaY;
                                                    var dropLiTop = $drop.position().top;
                                                    deltaY = dropLiTop - dragLiTop;
                                                    $drag.css('transform', 'translateY(' + deltaY + 'px)');
                                                    var transitionEnd = 'transitionend.tc';
                                                    $drag.on(transitionEnd, function (e) {
                                                        if (e.originalEvent.propertyName === 'transform') {
                                                            $drag.off(transitionEnd);
                                                            moveLayer($drag, $drop, function () {
                                                                $drag
                                                                    .removeClass(TC.Consts.classes.DRAGEND)
                                                                    .removeClass(TC.Consts.classes.DRAG)
                                                                    .css('zIndex', '')
                                                                    .css('transform', '');
                                                            });
                                                        }
                                                    });
                                                }
                                            })
                                            .drag(function (e, dd) {
                                                $(this).css('transform', 'translateY(' + Math.min(Math.max(dd.limit.top, Math.round(dd.deltaY)), dd.limit.bottom) + 'px)');
                                            },
                                                {
                                                    handle: '.' + self.CLASS + '-dd'
                                                }
                                            )
                                            .drop("init", function (e, dd) {
                                                return !(this == dd.drag);
                                            })
                                            .drop("start", function () {
                                                $(this).addClass(TC.Consts.classes.DROP);
                                            })
                                            .drop("end", function () {
                                                $(this).removeClass(TC.Consts.classes.DROP);
                                            });

                                        $ul.prepend($li);
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
        self._$div.find('.' + self.CLASS + '-empty').toggleClass(TC.Consts.classes.HIDDEN, nChildren > 0);
        $('.' + self.CLASS + '-n').text(nChildren).toggleClass(TC.Consts.classes.VISIBLE, nChildren > 0);
    };

    var _controlRemoveAllLayersBtnVisibility = function () {
        var self = this;
        var layersLoaded = self._$div.find('li');

        if (layersLoaded && layersLoaded.length > 0) {

        }
    }
})();

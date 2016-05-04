TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}

(function () {

    var appCache = window.applicationCache;

    if (!TC._appCacheBuilders) {
        TC._appCacheBuilders = [];
    }

    if (!TC._appCacheUpdater) {
        TC._appCacheUpdater = function (e, url) {
            var params = TC.Util.getQueryStringParams(url);
            for (var i = 0, len = TC._appCacheBuilders.length; i < len; i++) {
                var ctl = TC._appCacheBuilders[i];
                var mapName = decodeURIComponent(params[ctl.MAP_NAME_PARAM_NAME]).replace('+', ' ');
                var extent = decodeURIComponent(params[ctl.MAP_EXTENT_PARAM_NAME]);
                switch (e.type) {
                    case 'cached':
                        // Nuevo mapa
                        ctl.$events.trigger($.Event(TC.Consts.event.MAPCACHEDOWNLOAD, { name: mapName, extent: extent, url: url }));
                        break;
                    case 'obsolete':
                        // Borrado de mapa
                        ctl.$events.trigger($.Event(TC.Consts.event.MAPCACHEDELETE, { name: mapName }));
                        break;
                    case 'checking':
                        break;
                    case 'progress':
                        ctl.$events.trigger($.Event(TC.Consts.event.MAPCACHEPROGRESS, { name: mapName, loaded: e.loaded, total: e.total }));
                        break;
                    case 'error':
                        ctl.$events.trigger($.Event(TC.Consts.event.MAPCACHEERROR, { name: mapName, extent: extent, url: url, reason: e.reason, status: e.status }));
                    default:
                        break;
                }
            }
        };
    }

    var sendAppCacheEvent = function (e) {
        if (window.parent && parent.TC && parent.TC._appCacheUpdater) {
            parent.TC._appCacheUpdater(e, location.href);
        }
    };

    // Fired after the first cache of the manifest.
    appCache.addEventListener('cached', sendAppCacheEvent, false);

    //// Checking for an update. Always the first event fired in the sequence.
    //appCache.addEventListener('checking', handleCacheEvent, false);


    //// An update was found. The browser is fetching resources.
    //appCache.addEventListener('downloading', handleCacheEvent, false);

    // The manifest returns 404 or 410, the download failed,
    // or the manifest changed while the download was in progress.
    appCache.addEventListener('error', sendAppCacheEvent, false);

    //// Fired after the first download of the manifest.
    //appCache.addEventListener('noupdate', handleCacheEvent, false);

    //// Fired if the manifest file returns a 404 or 410.
    //// This results in the application cache being deleted.
    appCache.addEventListener('obsolete', sendAppCacheEvent, false);

    //// Fired for each resource listed in the manifest as it is being fetched.
    appCache.addEventListener('progress', sendAppCacheEvent, false);

    //// Fired when the manifest resources have been newly redownloaded.
    //appCache.addEventListener('updateready', handleCacheEvent, false);

    TC.control.CacheBuilder = function () {
        var self = this;

        self.storedMaps = [];

        TC._appCacheBuilders.push(self);

        // Carga de mapas guardados
        if (window.localStorage) {
            for (var i = 0, len = localStorage.length; i < len; i++) {
                var key = localStorage.key(i);
                if (key.indexOf(self.LOCAL_STORAGE_KEY_PREFIX) === 0) {
                    var values = localStorage.getItem(key).split(" ");
                    var extent = getExtentFromString(values[0]);
                    var url = values[1];
                    var map = {
                        name: decodeURIComponent(key.substr(self.LOCAL_STORAGE_KEY_PREFIX.length)).replace('+', ' '),
                        extent: extent,
                        url: url
                    }
                    self.storedMaps.push(map);
                }
            }
        }

        var options = $.extend({}, len > 1 ? arguments[1] : arguments[0]);
        self._$dialogDiv = $(TC.Util.getDiv(options.dialogDiv));
        if (!options.dialogDiv) {
            self._$dialogDiv.appendTo('body');
        }

        TC.Control.apply(self, arguments);
        self.wrap = new TC.wrap.control.CacheBuilder(self);

        self.isDownloading = false;
        self.baseLayers = [];

        self.options.avgTileSize = self.options.avgTileSize || TC.Cfg.avgTileSize;
        self.requestSchemas = [];
        self.minResolution = 0;

        self._loadedCount = 0;

        self.$events.on(TC.Consts.event.CONTROLRENDER, function () {

            self._$dialogDiv.find('.' + self.CLASS + '-btn-ok').on(TC.Consts.event.CLICK, function () {
                var options = {
                    mapName: self._$dialogDiv.find('.' + self.CLASS + '-txt-name').val()
                }
                if (self.findStoredMap(options.mapName)) {
                    TC.alert(self.getLocaleString('cb.mapNameAlreadyExists.error', options));
                }
                else {
                    var startRequest = function () {
                    self._$div.find('.' + self.CLASS + '-name').html(options.mapName);
                    setDownloadingState(self);
                    self.requestCache(options);
                    };
                    // Usamos Quota Management API si existe
                    var storageInfo = navigator.temporaryStorage || navigator.webkitTemporaryStorage || {};
                    if (storageInfo.queryUsageAndQuota) {
                        storageInfo.queryUsageAndQuota(
                            function (usedBytes, grantedBytes) {
                                var availableMB = (grantedBytes - usedBytes) / 1048576;
                                if (self.estimatedMapSize < availableMB) {
                                    startRequest();
                                }
                                else {
                                    TC.confirm(self.getLocaleString('cb.mapCreation.warning', {
                                        mapName: options.mapName,
                                        mapSize: formatSize(self, self.estimatedMapSize),
                                        availableStorage: formatSize(self, Math.round(availableMB))
                                    }), startRequest);
                                }
                            },
                            function (e) {
                                TC.error(e);
                            }
                        );
                    }
                    else {
                        startRequest();
                    }
                }
            });
            self._$dialogDiv.find('.' + self.CLASS + '-txt-name').on('input', function () {
                checkValidity(self);
            });
            self._$div.find('.' + self.CLASS + '-btn-new').on(TC.Consts.event.CLICK, function () {
                setEditState(self);
            });
            self._$div.find('.' + self.CLASS + '-btn-cancel').on(TC.Consts.event.CLICK, function () {
                setReadyState(self);
            });

            self._$div.find('.' + self.CLASS + '-list')
                .on(TC.Consts.event.CLICK, '.' + self.CLASS + '-btn-del', function (e) {
                    $btn = $(e.target);
                    var mapName = $btn.parent().find('a').html();
                    if (mapName) {
                        if (confirm(self.getLocaleString('cb.delete.confirm', { mapName: mapName }))) {
                            $btn.prop('disabled', true);
                            $btn.parents('li').first().addClass(TC.Consts.classes.DISABLED);
                            self.deleteMap(mapName);
                        }
                    }
                }).on(TC.Consts.event.CLICK, '.' + self.CLASS + '-btn-view', function (e) {
                    $btn = $(e.target);
                    var showExtent = !$btn.hasClass(TC.Consts.classes.ACTIVE);
                    self._$div.find('.' + self.CLASS + '-btn-view').removeClass(TC.Consts.classes.ACTIVE);
                    var mapName = $btn.parent().find('a').html();
                    if (mapName) {
                        var map = self.findStoredMap(mapName);
                        if (map) {
                            var extent = getExtentFromString(map.extent);
                            self.layer.clearFeatures();
                            if (showExtent) {
                            self.layer.addPolygon([[[extent[0], extent[1]], [extent[0], extent[3]], [extent[2], extent[3]], [extent[2], extent[1]]]]);
                                $btn.addClass(TC.Consts.classes.ACTIVE);
                        }
                    }
                    }
                });

            self._$dialogDiv.find('.' + self.CLASS + '-bl-list')
                .on('change', 'input[type=checkbox]', function (e) {
                    self.baseLayers.length = 0;
                    self._$dialogDiv.find('.' + self.CLASS + '-bl-list input[type=checkbox]').each(function (idx, elm) {
                        var $cb = $(elm);
                        if ($cb.prop('checked')) {
                            var layerId = $cb.val();
                            for (var i = 0, len = self.map.baseLayers.length; i < len; i++) {
                                var layer = self.map.baseLayers[i];
                                if (layer.id === layerId && layer.type === TC.Consts.layerType.WMTS) {
                                    self.baseLayers[self.baseLayers.length] = layer;
                                    break;
                                }
                            }
                        }
                    });
                    self.updateRequestSchemas();
                    updateResolutions(self);
                    updateThumbnails(self);
                    checkValidity(self);
                    showEstimatedMapSize(self);
                });

            self._$dialogDiv.find('.' + self.CLASS + '-rng-maxres')
                .on('input change', function (e) {
                    updateResolutions(self, {
                        rangeValue: $(e.target).val()
                    });
                    updateThumbnails(self);
                    showEstimatedMapSize(self);
                });

            var params = TC.Util.getQueryStringParams();
            $getListElementByMapName(self, params[self.MAP_NAME_PARAM_NAME]).addClass(TC.Consts.classes.ACTIVE);

            // Control para evitar que se cancele una descarga de cache al salir de la página
            window.addEventListener('beforeunload', function (e) {
                if (self.isDownloading) {
                    var msg = self.getLocaleString('cb.mapDownloading.warning');
                    e.returnValue = msg;
                    return msg;
                }
            }, true);
        })
    };

    TC.inherit(TC.control.CacheBuilder, TC.Control);

    var ctlProto = TC.control.CacheBuilder.prototype;

    ctlProto.CLASS = 'tc-ctl-cbuild';
    ctlProto.TILE_SCHEMA_PARAM_NAME = "offline-schema";
    ctlProto.MAP_NAME_PARAM_NAME = "map-name";
    ctlProto.MAP_EXTENT_PARAM_NAME = "map-extent";
    ctlProto.CLEAR_CACHE_PARAM_NAME = "cache-clear";
    ctlProto.LOCAL_STORAGE_KEY_PREFIX = "TC.offline.map.";
    ctlProto.COOKIE_KEY_PREFIX = "TC.offline.map.";
    ctlProto.CACHE_REQUEST_PATH = "offline";
    ctlProto.DELETE_REQUEST_PATH = "delete";
    ctlProto._states = {
        READY: 'ready',
        EDIT: 'editing',
        DOWNLOADING: 'downloading'
    };

    TC.Consts.event.MAPCACHEDOWNLOAD = TC.Consts.event.MAPCACHEDOWNLOAD || 'mapcachedownload.tc';
    TC.Consts.event.MAPCACHEDELETE = TC.Consts.event.MAPCACHEDELETE || 'mapcachedelete.tc';
    TC.Consts.event.MAPCACHEPROGRESS = TC.Consts.event.MAPCACHEPROGRESS || 'mapcacheprogress.tc';
    TC.Consts.event.MAPCACHEERROR = TC.Consts.event.MAPCACHEERROR || 'mapcacheerror.tc';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/CacheBuilder.html";
        ctlProto.template[ctlProto.CLASS + '-bl-node'] = TC.apiLocation + "TC/templates/CacheBuilderBaseLayerNode.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/CacheBuilderDialog.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "offlineMaps" }).w("</h2><div class=\"tc-ctl-cbuild-content\"><div class=\"tc-ctl-cbuild-draw tc-hidden\"></div><ul class=\"tc-ctl-cbuild-list\">").s(ctx.get(["storedMaps"], false), ctx, { "block": body_1 }, {}).w("</ul><div class=\"tc-ctl-cbuild-new\"><button class=\"tc-button tc-ctl-cbuild-btn-new\" disabled title=\"").h("i18n", ctx, {}, { "$key": "newOfflineMap" }).w("\">").h("i18n", ctx, {}, { "$key": "newOfflineMap" }).w("...</button></div><div class=\"tc-ctl-cbuild-draw tc-hidden\"><div class=\"tc-ctl-cbuild-tile-cmd\"><button class=\"tc-button tc-ctl-cbuild-btn-cancel\" title=\"").h("i18n", ctx, {}, { "$key": "cancel" }).w("\">").h("i18n", ctx, {}, { "$key": "cancel" }).w("</button></div></div><div class=\"tc-ctl-cbuild-progress tc-hidden\"><p>").h("i18n", ctx, {}, { "$key": "cb.DownloadingMap|s" }).w(": <span class=\"tc-ctl-cbuild-progress-count\"></span></p><div class=\"tc-ctl-cbuild-progress-bar\"><div class=\"tc-ctl-cbuild-progress-ratio\" style=\"width:0\"></div></div></div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li data-extent=\"").f(ctx.get(["extent"], false), ctx, "h").w("\"><a href=\"").f(ctx.get(["url"], false), ctx, "h").w("\">").f(ctx.get(["name"], false), ctx, "h").w("</a><button class=\"tc-ctl-cbuild-btn-view\" title=\"").h("i18n", ctx, {}, { "$key": "viewMapExtent" }).w("\">").h("i18n", ctx, {}, { "$key": "viewMapExtent" }).w("</button><button class=\"tc-ctl-cbuild-btn-del\" title=\"").h("i18n", ctx, {}, { "$key": "deleteMap" }).w("\">").h("i18n", ctx, {}, { "$key": "deleteMap" }).w("</button></li>"); } body_1.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-bl-node'] = function () { dust.register(ctlProto.CLASS + '-bl-node', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-cbuild-bl-node\" data-tc-layer-uid=\"").f(ctx.get(["id"], false), ctx, "h").w("\"><label style=\"background-size: 100% 100%; background-image: url(").f(ctx.get(["thumbnail"], false), ctx, "h").w(")\"><input type=\"checkbox\" name=\"cbbl\" value=\"").f(ctx.get(["id"], false), ctx, "h").w("\"><span>").f(ctx.get(["title"], false), ctx, "h").w("</span></label></li>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-modal tc-ctl-cbuild-dialog\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "newOfflineMap" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><input type=\"text\" class=\"tc-ctl-cbuild-txt-name\" placeholder=\"").h("i18n", ctx, {}, { "$key": "nameRequired" }).w("\" required /><div class=\"tc-ctl-cbuild-bl-panel\"><h4>").h("i18n", ctx, {}, { "$key": "availableOfflineMaps" }).w("</h4><p>").h("i18n", ctx, {}, { "$key": "selectAtLeastOne" }).w(":</p><ul class=\"tc-ctl-cbuild-bl-list\"></ul></div><div class=\"tc-ctl-cbuild-res-panel\"><h4>").h("i18n", ctx, {}, { "$key": "maxRes" }).w("</h4><div class=\"tc-ctl-cbuild-res\"></div><input type=\"range\" class=\"tc-ctl-cbuild-rng-maxres\" disabled value=\"0\" title=\"").h("i18n", ctx, {}, { "$key": "maxRes" }).w("\"></div><div class=\"tc-ctl-cbuild-tile-count\"></div></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "cancel" }).w("</button><button class=\"tc-button tc-modal-close tc-ctl-cbuild-btn-ok\" disabled>").h("i18n", ctx, {}, { "$key": "ok" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    var getExtentFromString = function (str) {
        return $.map(decodeURIComponent(str).split(','), function (elm) {
            return parseFloat(elm);
        });
    };

    var setReadyState = function (ctl) {
        ctl._state = ctl._states.READY;
        ctl._$div.find('.' + ctl.CLASS + '-draw').addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find('.' + ctl.CLASS + '-progress').addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find('.' + ctl.CLASS + '-new').removeClass(TC.Consts.classes.HIDDEN);
        ctl._$dialogDiv.find('.' + ctl.CLASS + '-btn-ok').prop('disabled', true);
        ctl._$div.find('.' + ctl.CLASS + '-btn-new').prop('disabled', false);
        ctl._$dialogDiv.find('.' + ctl.CLASS + '-tile-count').html('');
        ctl.extent = null;
        self._loadedCount = 0;
        ctl.boxDraw.cancel();
    };

    var setEditState = function (ctl) {
        ctl._state = ctl._states.EDITING;
        ctl._$div.find('.' + ctl.CLASS + '-new').addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find('.' + ctl.CLASS + '-progress').addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find('.' + ctl.CLASS + '-draw').removeClass(TC.Consts.classes.HIDDEN);
        ctl.map.toast(ctl.getLocaleString('offlineMapInstructions'), { duration: 10000 });
        ctl._$dialogDiv.find('.' + ctl.CLASS + '-btn-ok').prop('disabled', true);
        ctl._$div.find('.' + ctl.CLASS + '-btn-new').prop('disabled', true);
        ctl._$dialogDiv.find('.' + ctl.CLASS + '-txt-name').val('');
        ctl.boxDraw.activate();
    };

    var setDownloadingState = function (ctl) {
        ctl._state = ctl._states.DOWNLOADING;
        TC.Util.closeModal();
        ctl.showDownloadProgress(0, 1);
        ctl._$div.find('.' + ctl.CLASS + '-new').addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find('.' + ctl.CLASS + '-draw').addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find('.' + ctl.CLASS + '-progress').removeClass(TC.Consts.classes.HIDDEN);
        ctl._$dialogDiv.find('.' + ctl.CLASS + '-btn-ok').prop('disabled', true);
        ctl._$div.find('.' + ctl.CLASS + '-btn-new').prop('disabled', true);
        ctl.layer.clearFeatures();
        ctl.boxDraw.cancel();
    };

    var formatNumber = function (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    var updateResolutions = function (ctl, options) {
        var opts = options || {};
        var $res = ctl._$dialogDiv.find('.' + ctl.CLASS + '-res');
        var $rng = ctl._$dialogDiv.find('.' + ctl.CLASS + '-rng-maxres');
        var resolutions = ctl.getResolutions();
        var resText, resLevel, resLeft;
        if (resolutions.length) {
            if (ctl.minResolution) {
                // Si ya había resolución previa y no se ha tocado el slider, se actualiza su valor
                var idx = $.inArray(ctl.minResolution, resolutions);
                if (idx >= 0) {
                    if (opts.rangeValue === undefined) {
                        $rng.val(idx);
                    }
                }
            }
            else {
                if (opts.rangeValue === undefined) {
                    $rng.val(Math.floor(resolutions.length / 2));
                }
            }
            resLevel = parseInt($rng.attr('max', resolutions.length - 1).val());
            resText = ctl.getLocaleString('metersPerPixel', { value: resolutions[resLevel] });
            resLeft = (resLevel + 1) * 100 / (resolutions.length + 1) + '%';
            $rng.prop('disabled', false);
            ctl.minResolution = resolutions[$rng.val()];
        }
        else {
            resLevel = 0;
            resText = '';
            $rng.val(0);
            resLeft = '0';
            ctl.minResolution = 0;
            $rng.prop('disabled', true);
        }
        $res
            .css('left', resLeft)
            .html(resText);
    };

    var updateThumbnails = function (ctl) {
        var $cbList = ctl._$dialogDiv.find('.' + ctl.CLASS + '-bl-node input[type=checkbox]');
        $cbList.each(function (idx, cb) {
            var $cb = $(cb);
            if ($cb.prop('checked')) {
                var schema = ctl.requestSchemas.filter(function (elm) {
                    return elm.layerId === $cb.val();
                })[0];
                if (schema) {
                    for (var i = 0, len = schema.tileMatrixLimits.length; i < len; i++) {
                        var tml = schema.tileMatrixLimits[i];
                        if (tml.res === ctl.minResolution) {
                            $cb.parent('label')
                                .css('background-size', 'auto')
                                .css('background-position', 'left bottom')
                                .css('background-image', 'url(' + schema.url.replace('{TileMatrix}', tml.mId).replace('{TileRow}', tml.rt).replace('{TileCol}', tml.cl) + ')');
                            break;
                        }
                    }
                }
            }
        });
    }

    var formatSize = function (ctl, size) {
        var result;
        if (size < 1) {
            result = ctl.getLocaleString('lessThan1Mb');
        }
        else {
            result = ctl.getLocaleString('approxXMb', { quantity: formatNumber(size) });
        }
        return result;
    };

    var showEstimatedMapSize = function (ctl) {
        var text = '';
        var total = 0;
        for (var i = 0, slen = ctl.requestSchemas.length; i < slen; i++) {
            var schema = ctl.requestSchemas[i];
            for (var j = 0, llen = schema.tileMatrixLimits.length; j < llen; j++) {
                var tml = schema.tileMatrixLimits[j];
                if (tml.res < ctl.minResolution) {
                    break;
                }
                else {
                    total += (tml.cr - tml.cl + 1) * (tml.rb - tml.rt + 1);
                }
            }
        }
        if (total) {
            ctl.estimatedMapSize = Math.round(total * ctl.options.avgTileSize / 1048576);
            text = ctl.getLocaleString('xTiles', { quantity: formatNumber(total) }) + ' (' + formatSize(ctl, ctl.estimatedMapSize) + ')';
        }
        ctl._$dialogDiv.find('.' + ctl.CLASS + '-tile-count').html(text);
    };

    var $getListElementByMapName = function (ctl, name) {
        return ctl._$div.find('.' + ctl.CLASS + '-list > li').filter(function (idx, elm) {
            return $(elm).find('a').first().html() === name;
        });
    };

    var openCachedPage = function (ctl, name, url) {
        $('<iframe>')
            .css('display', 'none')
            .attr('src', url)
            .attr('data-name', name)
            .appendTo(ctl._$div);
    };

    var closeCachedPage = function (ctl, name) {
        var $iframe = ctl._$div.find('iframe[data-name="' + name + '"]');
        $iframe.remove();
    };

    var addMap = function (ctl, name, extent, url) {
        if (window.localStorage) {
            localStorage.setItem(ctl.LOCAL_STORAGE_KEY_PREFIX + name, extent + " " + url);
            var viewMapExtentText = ctl.getLocaleString('viewMapExtent');
            var deleteMapText = ctl.getLocaleString('deleteMap');
            $('<li>')
                .data('extent', extent)
                .append($('<a>').attr('href', url).html(name))
                .append($('<button>').addClass(ctl.CLASS + '-btn-view').attr('title', viewMapExtentText).html(viewMapExtentText))
                .append($('<button>').addClass(ctl.CLASS + '-btn-del').attr('title', deleteMapText).html(deleteMapText))
                .appendTo(ctl._$div.find('.' + ctl.CLASS + '-list'));
            ctl.storedMaps.push({
                name: name,
                extent: extent,
                url: url
            })
        }
    }

    var removeMap = function (ctl, name) {
        document.cookie = ctl.COOKIE_KEY_PREFIX + 'delete=;expires=' + new Date().toGMTString();
        if (window.localStorage) {
            localStorage.removeItem(encodeURIComponent(ctl.LOCAL_STORAGE_KEY_PREFIX + name));
            $getListElementByMapName(ctl, name).remove();
        }
        var map = ctl.findStoredMap(name);
        var idx = $.inArray(map, ctl.storedMaps);
        ctl.storedMaps.splice(idx, 1);
    };

    var checkValidity = function (ctl) {
        ctl._$dialogDiv.find('.' + ctl.CLASS + '-btn-ok').prop('disabled',
            !ctl.extent || 
            ctl._$dialogDiv.find('.' + ctl.CLASS + '-txt-name').val().length === 0 ||
            ctl._$dialogDiv.find('.' + ctl.CLASS + '-bl-list input[type=checkbox]:checked').length === 0);
    };

    ctlProto.render = function (callback) {
        var self = this;
        var renderObject = { storedMaps: self.storedMaps };
        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv.html(html);
            self._$dialogDiv.find('.' + self.CLASS + '-txt-name').on(TC.Consts.event.CLICK, function (e) {
                e.preventDefault();
                this.selectionStart = 0;
                this.selectionEnd = this.value.length;
                this.focus();
            });
            self.renderData(renderObject, callback);
        });
        
    };

    ctlProto.register = function (map) {
        var self = this;

        TC.Control.prototype.register.call(self, map);

        self.layer = null;
        map.addLayer({
            id: TC.getUID(),
            type: TC.Consts.layerType.VECTOR,
            stealth: true
        }).then(function (layer) {
            self.layer = layer;
            TC.loadJS(
                !TC.control.Draw,
                TC.apiLocation + 'TC/control/Draw.js',
                function () {
                    self.boxDraw = new TC.control.Draw({
                        div: self._$div.find('.' + self.CLASS + '-draw'),
                        mode: TC.Consts.geom.RECTANGLE,
                        layer: self.layer
                    });
                    self.boxDraw.$events
                        .on(TC.Consts.event.DRAWEND, function (e) {
                            var points = e.geometry.geometry[0];
                            var pStart = points[0];
                            var pEnd = points[2];
                            var minx = Math.min(pStart[0], pEnd[0]);
                            var maxx = Math.max(pStart[0], pEnd[0]);
                            var miny = Math.min(pStart[1], pEnd[1]);
                            var maxy = Math.max(pStart[1], pEnd[1]);
                            self.setExtent([minx, miny, maxx, maxy]);
                            showEstimatedMapSize(self);
                            TC.Util.showModal(self._$dialogDiv.find('.' + self.CLASS + '-dialog'), 300, 400, function () {
                                var time;
                                if (Date.prototype.toLocaleString) {
                                    var opt = {};
                                    opt.year = opt.month = opt.day = opt.hour = opt.minute = opt.second = 'numeric';
                                    time = new Date().toLocaleString(self.map.options.locale.replace('_', '-'), opt);
                                }
                                else {
                                    time = new Date().toString();
                                }
                                var text = self._$dialogDiv.find('.' + self.CLASS + '-txt-name').val(time)[0];
                                checkValidity(self);
                            });
                        });
                    map.on(TC.Consts.event.CONTROLDEACTIVATE, function (e) {
                        if (self.boxDraw === e.control) {
                            if (self._state === self._states.EDITING) {
                                setReadyState(self);
                            }
                        }
                    });
                    map.addControl(self.boxDraw);
                }
            );
        });

        var addRenderedListNode = function ($list, layer) {
            var result = false;
            if (layer.type === TC.Consts.layerType.WMTS) {
                if ($list.find('li[data-tc-layer-uid="' + layer.id + '"]').length === 0) {
                    result = true;
                    self.getRenderedHtml(self.CLASS + '-bl-node', layer, function (html) {
                        $list.append(html);
                    });
                }
            }
            return result;
        };

        self.$events.on(TC.Consts.event.CONTROLRENDER, function () {
            var $blList = self._$dialogDiv.find('.' + self.CLASS + '-bl-list');
            map
                .on(TC.Consts.event.LAYERADD, function (e) {
                    addRenderedListNode($blList, e.layer);
                })
                .on(TC.Consts.event.LAYERREMOVE, function (e) {
                    if (e.layer.type === TC.Consts.layerType.WMTS) {
                        $blList.find('li[data-tc-layer-uid="' + e.layer.id + '"]').remove();
                    }
                });
            map.loaded(function () {
                self._$div.find('.' + self.CLASS + '-btn-new').prop('disabled', false);
                for (var i = 0, len = map.baseLayers.length; i < len; i++) {
                    addRenderedListNode($blList, map.baseLayers[i]);
                }
            });
        });


        map.loaded(function () {
            map.putLayerOnTop(self.layer);

            var params = TC.Util.getQueryStringParams();
            var schemaString = params[self.TILE_SCHEMA_PARAM_NAME];
            var extentString = params[self.MAP_EXTENT_PARAM_NAME];
            if (extentString && schemaString) {
                // Estamos en modo offline
                var schemas = JSON.parse(window.atob(decodeURIComponent(schemaString)));
                var excludedLayers = [];
                // Obtenemos la primera capa del esquema de la cache y de paso vemos qué capas no van a estar disponibles
                var baseLayer = $.grep(map.baseLayers, function (layer) {
                    var result = false;
                    if (layer.type === TC.Consts.layerType.WMTS) {
                        for (var i = 0, len = schemas.length; i < len; i++) {
                            if (self.wrap.getUrlPattern(layer) === schemas[i].url) {
                                result = true;
                                break;
                            }
                        }
                    }
                    // Quitamos todas las capas que no estén cacheadas y que no sean el mapa en blanco
                    if (!result) {
                        if (layer.type !== TC.Consts.layerType.VECTOR) {
                            excludedLayers[excludedLayers.length] = layer;
                        }
                    }
                    return result;
                })[0];
                if (baseLayer) {
                    map.setBaseLayer(baseLayer);
                }
                for (var i = 0, len = excludedLayers.length; i < len; i++) {
                    map.removeLayer(excludedLayers[i]);
                }

                map.setExtent(getExtentFromString(extentString));
            }
        });

        self.$events
            .on(TC.Consts.event.MAPCACHEDOWNLOAD, function (e) {
                self.isDownloading = false;
                addMap(self, e.name, e.extent, e.url);
                closeCachedPage(self, e.mapName);
                setReadyState(self);
            })
            .on(TC.Consts.event.MAPCACHEDELETE, function (e) {
                self.isDownloading = false;
                removeMap(self, e.name);
                closeCachedPage(self, e.name);
                setReadyState(self);
            })
            .on(TC.Consts.event.MAPCACHEPROGRESS, function (e) {
                var total = e.total;
                if (!total && self.requestSchemas) {
                    total = self.requestSchemas[0].tileCount;
                }
                var loaded = e.loaded;
                if (loaded) {
                    self._loadedCount = loaded;
                }
                else {
                    self._loadedCount += 1;
                    loaded = self._loadedCount;
                }
                self.showDownloadProgress(loaded, total);
            })
            .on(TC.Consts.event.MAPCACHEERROR, function (e) {
                self.isDownloading = false;
                closeCachedPage(self, e.name);
                setReadyState(self);
                var msg = self.getLocaleString('cb.mapCreation.error', { mapName: e.name });
                var handleError = true;
                switch (e.reason) {
                    case 'quota':
                        msg += self.getLocaleString('cb.mapCreation.error.reasonQuota');
                        break;
                    case 'resource':
                        msg += self.getLocaleString('cb.mapCreation.error.reasonResource');
                        break;
                    case 'manifest':
                        if (e.status == '410') {
                            removeMap(self, e.name);
                        }
                        handleError = false;
                        break;
                    default:
                        break;
                }
                if (handleError) {
                TC.alert(msg);
                TC.error(msg);
                }
            });
    };

    ctlProto.setExtent = function (extent) {
        var self = this;
        if ($.isArray(extent) && extent.length >= 4) {
            self.extent = extent;
            self.updateRequestSchemas();
        }
    };

    ctlProto.requestCache = function (options) {
        var self = this;
        var opts = options || {};
        if (self.map) {
            var extent = opts.extent || self.extent || self.map.getExtent();
            self.updateRequestSchemas({ extent: extent });
            if (self.requestSchemas) {
                var filterTml = function (tml) {
                    return tml.res >= self.minResolution;
                };
                var trimTml = function (tml) {
                    return {
                        mId: tml.mId,
                        cl: tml.cl,
                        cr: tml.cr,
                        rt: tml.rt,
                        rb: tml.rb
                    };
                };
                // Eliminamos de los esquemas los niveles con resolución menor que la mínima
                var requestSchemas = self.requestSchemas.map(function (schema) {
                    return {
                        url: schema.url,
                        tileMatrixLimits: schema.tileMatrixLimits.filter(filterTml)
                    };
                });
                // Actualizamos el extent para que coincida con las teselas del último nivel de los esquemas
                // También eliminamos del esquema todo lo irrelevante para la petición
                var intersectionExtent = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
                for (var i = 0, len = requestSchemas.length; i < len; i++) {
                    var rs = requestSchemas[i];
                    var tml = rs.tileMatrixLimits[rs.tileMatrixLimits.length - 1];
                    var unitsPerTile = tml.res * tml.tSize;
                    intersectionExtent[0] = Math.max(intersectionExtent[0], tml.origin[0] + unitsPerTile * tml.cl);
                    intersectionExtent[1] = Math.max(intersectionExtent[1], tml.origin[1] - unitsPerTile * (tml.rb + 1));
                    intersectionExtent[2] = Math.min(intersectionExtent[2], tml.origin[0] + unitsPerTile * (tml.cr + 1));
                    intersectionExtent[3] = Math.min(intersectionExtent[3], tml.origin[1] - unitsPerTile * tml.rt);
                    rs.tileMatrixLimits = rs.tileMatrixLimits.map(trimTml);
                }

                var params = TC.Util.getQueryStringParams();
                var n = params[self.MAP_NAME_PARAM_NAME] = opts.mapName;
                var e = params[self.MAP_EXTENT_PARAM_NAME] = intersectionExtent.toString();
                var s = params[self.TILE_SCHEMA_PARAM_NAME] = btoa(JSON.stringify(requestSchemas));
                var u = location.pathname.substr(0, location.pathname.lastIndexOf('/') + 1) + self.CACHE_REQUEST_PATH + '?' + $.param(params) + location.hash;
                self.isDownloading = true;
                openCachedPage(self, n, u);
            }
        }
    }

    ctlProto.deleteMap = function (name) {
        var self = this;

        var map = self.findStoredMap(name);
        if (map) {
            var params = TC.Util.getQueryStringParams(map.url);
            var errorCallback = function (request, status, error) {
                TC.error('[' + status + '] ' + error);
            };
            document.cookie = self.COOKIE_KEY_PREFIX + 'delete=' + params[self.TILE_SCHEMA_PARAM_NAME];
            openCachedPage(self, name, map.url);
        }
    }

    ctlProto.findStoredMap = function (name) {
        var self = this;
        return $.grep(self.storedMaps, function (elm) {
            var result = false;
            if (elm.name === name) {
                result = true;
            }
            return result;
        })[0];
    };

    ctlProto.showDownloadProgress = function (current, total) {
        var self = this;
        var $count = self._$div.find('.' + self.CLASS + '-progress-count');
        if (total) {
            var percent = Math.min(Math.round(current * 100 / total), 100);
            var percentString = percent + '%';
            self._$div.find('.' + self.CLASS + '-progress-ratio').css('width', percentString);
            $count.html(percentString);
        }
        else {
            self._$div.find('.' + self.CLASS + '-progress-bar').addClass(TC.Consts.classes.HIDDEN);
            $count.html(self.getLocaleString('xFiles', { quantity: current }));
        }
    };

    ctlProto.updateRequestSchemas = function (options) {
        var self = this;
        var opts = options || {};
        opts.extent = opts.extent || self.extent;
        opts.layers = opts.layers || self.baseLayers;
        self.requestSchemas = self.wrap.getRequestSchemas(opts);
        return self.requestSchemas;
    };

    ctlProto.getResolutions = function () {
        var self = this;
        var result = [];

        var resolutionMapper = function (tml) {
            return tml.res;
        };
        // Obtenemos un array de resoluciones por cada esquema de cada capa
        var resolutions = self.requestSchemas.map(function (schema) {
            return schema.tileMatrixLimits.map(resolutionMapper);
        });
        // Seleccionamos las resoluciones que aparecen en todas las capas
        if (resolutions.length) {
            result = resolutions[0].filter(function (elm, idx, arr) {
                for (var i = 1, len = resolutions.length; i < len; i++) {
                    if (resolutions[i].indexOf(elm) < 0) {
                        return false;
                    }
                }
                return true;
            });
            result.sort(function (a, b) {
                return b - a;
            });
        }
        return result;
    };

})();

TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}

(function () {

    TC.Consts.classes.CONNECTION_OFFLINE = TC.Consts.classes.CONNECTION_OFFLINE || 'tc-conn-offline';
    TC.Consts.classes.CONNECTION_WIFI = TC.Consts.classes.CONNECTION_WIFI || 'tc-conn-wifi';
    TC.Consts.classes.CONNECTION_MOBILE = TC.Consts.classes.CONNECTION_MOBILE || 'tc-conn-mobile';

    var ALREADY_EXISTS = 'already_exists';

    var appCache = window.applicationCache;

    if (!TC._appCacheBuilders) {
        TC._appCacheBuilders = [];
    }

    if (!TC._appCacheUpdater) {
        TC._appCacheUpdater = function (e, url) {
            var params = TC.Util.getQueryStringParams(url);
            for (var i = 0, len = TC._appCacheBuilders.length; i < len; i++) {
                var ctl = TC._appCacheBuilders[i];
                switch (e.type) {
                    case 'cached':
                        // Nuevo mapa
                        ctl.$events.trigger($.Event(TC.Consts.event.MAPCACHEDOWNLOAD, { url: url }));
                        break;
                    case 'obsolete':
                        // Borrado de mapa
                        ctl.$events.trigger($.Event(TC.Consts.event.MAPCACHEDELETE, { url: url }));
                        break;
                    case 'checking':
                        break;
                    case 'progress':
                        ctl.$events.trigger($.Event(TC.Consts.event.MAPCACHEPROGRESS, { url: url, loaded: e.loaded, total: e.total }));
                        break;
                    case 'error':
                        ctl.$events.trigger($.Event(TC.Consts.event.MAPCACHEERROR, { url: url, reason: e.reason, status: e.status }));
                        break;
                    case 'noupdate':
                    case 'updateready':
                        // En este caso se está pidiendo un mapa que ya tenemos pedido de antes
                        ctl.$events.trigger($.Event(TC.Consts.event.MAPCACHEERROR, { url: url, reason: ALREADY_EXISTS, status: e.status }));
                        break;
                    default:
                        break;
                }
            }
        };
    }

    var sendAppCacheEvent = function (e) {
        if (window.parent !== window && parent.TC && parent.TC._appCacheUpdater) {
            parent.TC._appCacheUpdater(e, location.href);
        }
    };

    var cacheResourceCount = 0;
    var handleProgressCacheEvent = function (e) {
        if (e && e.lengthComputable && e.total) {
            cacheResourceCount = e.total;
        }
        sendAppCacheEvent.call(this, e);
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

    // Fired after the first download of the manifest.
    appCache.addEventListener('noupdate', sendAppCacheEvent, false);

    // Fired if the manifest file returns a 404 or 410.
    // This results in the application cache being deleted.
    appCache.addEventListener('obsolete', sendAppCacheEvent, false);

    // Fired for each resource listed in the manifest as it is being fetched.
    appCache.addEventListener('progress', handleProgressCacheEvent, false);

    // Fired when the manifest resources have been newly redownloaded.
    appCache.addEventListener('updateready', sendAppCacheEvent, false);

    TC.control.CacheBuilder = function () {
        var self = this;

        var cs = self._classSelector = '.' + self.CLASS;
        self._selectors = {
            DRAW: cs + '-draw',
            PROGRESS: cs + '-progress',
            NEW: cs + '-new',
            LIST: cs + '-list',
            LISTITEM: cs + '-list > li',
            DELBTN: cs + '-btn-del',
            OKBTN: cs + '-btn-ok',
            NEWBTN: cs + '-btn-new',
            SAVEBTN: '.tc-btn-save',
            CANCELBTN: '.tc-btn-cancel',
            EDITBTN: '.tc-btn-edit',
            VIEWBTN: '.tc-btn-view',
            DELETEBTN: '.tc-btn-delete',
            TILECOUNT: cs + '-tile-count',
            NAMETB: cs + '-txt-name',
            TEXTBOX: 'input.tc-textbox',
            EXIT: cs + '-link-exit',
            OFFPANEL: cs + '-off-panel',
            BLLIST: cs + '-bl-list',
            RNGMAXRES: cs + '-rng-maxres',
            SEARCH: cs + '-map-available-srch',
            EMPTYLIST: cs + '-map-available-empty'
        };

        self.storedMaps = [];

        TC._appCacheBuilders.push(self);

        // Carga de mapas guardados
        if (window.localStorage) {
            for (var i = 0, len = localStorage.length; i < len; i++) {
                var key = localStorage.key(i);
                if (key.indexOf(self.LOCAL_STORAGE_KEY_PREFIX) === 0) {
                    var values = localStorage.getItem(key).split(" ");
                    var extent = getExtentFromString(values.shift());
                    var name = values.join(" ");
                    var map = {
                        name: name,
                        extent: extent,
                        url: decodeURIComponent(key.substr(self.LOCAL_STORAGE_KEY_PREFIX.length))
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

        self.mapIsOffline = location.pathname.indexOf('/' + self.CACHE_REQUEST_PATH) === location.pathname.length - self.CACHE_REQUEST_PATH.length - 1;

        TC.Control.apply(self, arguments);
        self.wrap = new TC.wrap.control.CacheBuilder(self);

        self.isDownloading = false;
        self.baseLayers = [];

        self.options.avgTileSize = self.options.avgTileSize || TC.Cfg.avgTileSize;
        self.requestSchemas = [];
        self.minResolution = 0;
        self.currentMap = null;

        self._loadedCount = 0;

        // Actualización del enlace al modo online
        // Parche para detectar cambios en el hash. Lo usamos para actualizar los enlaces a los idiomas
        var pushState = history.pushState;
        history.pushState = function (state) {
            var result;
            //if (typeof history.onpushstate == "function") {
            //    history.onpushstate({ state: state });
            //}
            result = pushState.apply(history, arguments);
            if (self._$offlinePanelDiv) {
                var newPath = location.pathname.replace('/' + self.CACHE_REQUEST_PATH, '/');
                var params = TC.Util.getQueryStringParams();
                delete params[self.MAP_DEFINITION_PARAM_NAME];
                delete params[self.MAP_EXTENT_PARAM_NAME];
                var newParams = $.param(params);
                if (newParams.length) {
                    newParams = '?' + newParams;
                }
                var href = newPath + newParams + location.hash;
                self._$offlinePanelDiv.find(self._selectors.EXIT).attr('href', href);
            }
            return result;
        }

        // Detección de estado de conexión
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
        var onlineHandler = function () {
            if (self._$offlinePanelDiv) {
                var $panel = self._$offlinePanelDiv.find(self._selectors.OFFPANEL);
                $panel
                    .removeClass(TC.Consts.classes.CONNECTION_OFFLINE)
                    .removeClass(TC.Consts.classes.CONNECTION_MOBILE)
                    .removeClass(TC.Consts.classes.CONNECTION_WIFI);

                var type = connection.type;
                switch (type) {
                    case 1:
                    case 2:
                    case undefined:
                        $panel.addClass(TC.Consts.classes.CONNECTION_WIFI);
                        break;
                    default:
                        $panel.addClass(TC.Consts.classes.CONNECTION_MOBILE);
                        break;
                }
            }
        };
        if (connection.addEventListener) {
            connection.addEventListener('typechange', onlineHandler);
        }
        window.addEventListener('online', onlineHandler);
        window.addEventListener('offline', function () {
            if (self._$offlinePanelDiv) {
                self._$offlinePanelDiv
                    .find(self._selectors.OFFPANEL)
                    .addClass(TC.Consts.classes.CONNECTION_OFFLINE)
                    .removeClass(TC.Consts.classes.CONNECTION_MOBILE)
                    .removeClass(TC.Consts.classes.CONNECTION_WIFI);
            }
        });
    };

    TC.inherit(TC.control.CacheBuilder, TC.Control);

    var ctlProto = TC.control.CacheBuilder.prototype;

    ctlProto.CLASS = 'tc-ctl-cbuild';
    ctlProto.MAP_DEFINITION_PARAM_NAME = "map-def";
    ctlProto.MAP_EXTENT_PARAM_NAME = "map-extent";
    ctlProto.LOCAL_STORAGE_KEY_PREFIX = "TC.offline.map.";
    ctlProto.COOKIE_KEY_PREFIX = "TC.offline.map.";
    ctlProto.CACHE_REQUEST_PATH = "offline";
    ctlProto._states = {
        READY: 'ready',
        EDIT: 'editing',
        DOWNLOADING: 'downloading',
        DELETING: 'deleting'
    };
    ctlProto.offlineControls = [
        'attribution',
        'basemapSelector',
        'cacheBuilder',
        'click',
        'coordinates',
        'draw',
        'geolocation',
        'loadingIndicator',
        'measure',
        'navBar',
        'popup',
        'print',
        'scale',
        'scaleBar',
        'scaleSelector',
        'state'
    ];

    TC.Consts.event.MAPCACHEDOWNLOAD = TC.Consts.event.MAPCACHEDOWNLOAD || 'mapcachedownload.tc';
    TC.Consts.event.MAPCACHEDELETE = TC.Consts.event.MAPCACHEDELETE || 'mapcachedelete.tc';
    TC.Consts.event.MAPCACHEPROGRESS = TC.Consts.event.MAPCACHEPROGRESS || 'mapcacheprogress.tc';
    TC.Consts.event.MAPCACHEERROR = TC.Consts.event.MAPCACHEERROR || 'mapcacheerror.tc';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/CacheBuilder.html";
        ctlProto.template[ctlProto.CLASS + '-map-node'] = TC.apiLocation + "TC/templates/CacheBuilderMapNode.html";
        ctlProto.template[ctlProto.CLASS + '-bl-node'] = TC.apiLocation + "TC/templates/CacheBuilderBaseLayerNode.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/CacheBuilderDialog.html";
        ctlProto.template[ctlProto.CLASS + '-off-panel'] = TC.apiLocation + "TC/templates/CacheBuilderOfflinePanel.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "offlineMaps" }).w(" <span class=\"tc-beta\">beta</span></h2><div class=\"tc-ctl-cbuild-content\"><div class=\"tc-ctl-cbuild-draw tc-hidden\"></div><i class=\"tc-ctl-cbuild-map-search-icon\"></i><input type=\"search\" list=\"").f(ctx.get(["listId"], false), ctx, "h").w("\" class=\"tc-ctl-cbuild-map-available-srch tc-textbox\" placeholder=\"").h("i18n", ctx, {}, { "$key": "cb.filter.plhr" }).w("\"").x(ctx.get(["storedMaps"], false), ctx, { "else": body_1, "block": body_2 }, {}).w(" maxlength=\"200\" /> <ul id=\"").f(ctx.get(["listId"], false), ctx, "h").w("\" class=\"tc-ctl-cbuild-list\"><li class=\"tc-ctl-cbuild-map-available-empty\"").x(ctx.get(["storedMaps"], false), ctx, { "block": body_3 }, {}).w("><span>").h("i18n", ctx, {}, { "$key": "cb.noMaps" }).w("</span></li><li class=\"tc-ctl-cbuild-map-not\" hidden><span>").h("i18n", ctx, {}, { "$key": "noMatches" }).w("</span></li>").s(ctx.get(["storedMaps"], false), ctx, { "block": body_4 }, {}).w("</ul><div class=\"tc-ctl-cbuild-new\"><button class=\"tc-button tc-icon-button tc-ctl-cbuild-btn-new\" disabled title=\"").h("i18n", ctx, {}, { "$key": " newofflinemap" }).w("\">").h("i18n", ctx, {}, { "$key": "newOfflineMap" }).w("</button></div><div class=\"tc-ctl-cbuild-draw tc-hidden\"><div class=\"tc-ctl-cbuild-tile-cmd\"><button class=\"tc-button tc-icon-button tc-ctl-cbuild-btn-cancel-draw\" title=\"").h("i18n", ctx, {}, { "$key": "cancel" }).w("\">").h("i18n", ctx, {}, { "$key": "cancel" }).w("</button></div></div><div class=\"tc-ctl-cbuild-progress tc-hidden\"><p>").h("i18n", ctx, {}, { "$key": "cb.DownloadingMap|s" }).w(": <span class=\"tc-ctl-cbuild-progress-count\"></span></p><div class=\"tc-ctl-cbuild-progress-bar\"><div class=\"tc-ctl-cbuild-progress-ratio\" style=\"width:0\"></div></div><button class=\"tc-button tc-icon-button tc-ctl-cbuild-btn-cancel-dl\" title=\"").h("i18n", ctx, {}, { "$key": "cancel" }).w("\">").h("i18n", ctx, {}, { "$key": "cancel" }).w("</button></div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w(" disabled"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk; } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w(" hidden"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.p("tc-ctl-cbuild-map-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_4.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-bl-node'] = function () { dust.register(ctlProto.CLASS + '-bl-node', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-cbuild-bl-node\" data-tc-layer-uid=\"").f(ctx.get(["id"], false), ctx, "h").w("\"><label style=\"background-size: 100% 100%; background-image: url(").f(ctx.get(["thumbnail"], false), ctx, "h").w(")\"><input type=\"checkbox\" name=\"cbbl\" value=\"").f(ctx.get(["id"], false), ctx, "h").w("\"><span>").f(ctx.get(["title"], false), ctx, "h").w("</span></label></li>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-map-node'] = function () { dust.register(ctlProto.CLASS + '-map-node', body_0); function body_0(chk, ctx) { return chk.w("<li data-extent=\"").f(ctx.get(["extent"], false), ctx, "h").w("\"><a href=\"").f(ctx.get(["url"], false), ctx, "h").w("\">").f(ctx.get(["name"], false), ctx, "h").w("</a><input class=\"tc-textbox tc-hidden\" type=\"text\" value=\"").f(ctx.get(["name"], false), ctx, "h").w("\" /><button class=\"tc-btn-save tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "save" }).w("\"></button><button class=\"tc-btn-cancel tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "cancel" }).w("\"></button><button class=\"tc-btn-edit\" title=\"").h("i18n", ctx, {}, { "$key": "editMapName" }).w("\">").h("i18n", ctx, {}, { "$key": "editMapName" }).w("</button><button class=\"tc-btn-view\" title=\"").h("i18n", ctx, {}, { "$key": "viewMapExtent" }).w("\">").h("i18n", ctx, {}, { "$key": "viewMapExtent" }).w("</button><button class=\"tc-btn-delete\" title=\"").h("i18n", ctx, {}, { "$key": "deleteMap" }).w("\">").h("i18n", ctx, {}, { "$key": "deleteMap" }).w("</button></li>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-modal tc-ctl-cbuild-dialog\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "newOfflineMap" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><input type=\"text\" class=\"tc-ctl-cbuild-txt-name\" placeholder=\"").h("i18n", ctx, {}, { "$key": "nameRequired" }).w("\" required /><div class=\"tc-ctl-cbuild-bl-panel\"><h4>").h("i18n", ctx, {}, { "$key": "availableOfflineMaps" }).w("</h4><p>").h("i18n", ctx, {}, { "$key": "selectAtLeastOne" }).w(":</p><ul class=\"tc-ctl-cbuild-bl-list\"></ul></div><div class=\"tc-ctl-cbuild-res-panel\"><h4>").h("i18n", ctx, {}, { "$key": "maxRes" }).w("</h4><div class=\"tc-ctl-cbuild-res\"></div><input type=\"range\" class=\"tc-ctl-cbuild-rng-maxres\" disabled value=\"0\" title=\"").h("i18n", ctx, {}, { "$key": "maxRes" }).w("\"></div><div class=\"tc-ctl-cbuild-tile-count\"></div></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "cancel" }).w("</button><button class=\"tc-button tc-modal-close tc-ctl-cbuild-btn-ok\" disabled>").h("i18n", ctx, {}, { "$key": "ok" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-off-panel'] = function () { dust.register(ctlProto.CLASS + '-off-panel', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-cbuild-off-panel tc-conn-wifi\"><span>").h("i18n", ctx, {}, { "$key": "offlineMap" }).w("</span> <a href=\"\" class=\"tc-ctl-cbuild-link-exit\" title=\"").h("i18n", ctx, {}, { "$key": "returnToOnlineMaps" }).w("\"><span>").h("i18n", ctx, {}, { "$key": "returnToOnlineMaps" }).w("</span></a></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    var getExtentFromString = function (str) {
        return $.map(decodeURIComponent(str).split(','), function (elm) {
            return parseFloat(elm);
        });
    };

    var setReadyState = function (ctl) {
        ctl._state = ctl._states.READY;
        ctl.showDownloadProgress(0, 1);
        ctl._$div.find(ctl._selectors.DRAW).addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find(ctl._selectors.PROGRESS).addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find(ctl._selectors.NEW).removeClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find(ctl._selectors.LISTITEM).removeClass(TC.Consts.classes.DISABLED);
        ctl._$div.find(ctl._selectors.DELBTN).prop('disabled', false);
        ctl._$dialogDiv.find(ctl._selectors.OKBTN).prop('disabled', true);
        ctl._$div.find(ctl._selectors.NEWBTN).prop('disabled', false);
        ctl._$dialogDiv.find(ctl._selectors.TILECOUNT).html('');
        ctl.extent = null;
        ctl._loadedCount = 0;
        if (ctl.boxDraw) {
            ctl.boxDraw.cancel();
        }
    };

    var setEditState = function (ctl) {
        ctl._state = ctl._states.EDITING;
        ctl.showDownloadProgress(0, 1);
        ctl._$div.find(ctl._selectors.NEW).addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find(ctl._selectors.PROGRESS).addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find(ctl._selectors.DRAW).removeClass(TC.Consts.classes.HIDDEN);
        ctl.map.toast(ctl.getLocaleString('offlineMapInstructions'), { duration: 10000 });
        ctl._$dialogDiv.find(ctl._selectors.OKBTN).prop('disabled', true);
        ctl._$div.find(ctl._selectors.NEWBTN).prop('disabled', true);
        ctl._$dialogDiv.find(ctl._selectors.NAMETB).val('');
        ctl.boxDraw.activate();
    };

    var setDownloadingState = function (ctl) {
        ctl._state = ctl._states.DOWNLOADING;
        TC.Util.closeModal();
        ctl.showDownloadProgress(0, 1);
        ctl._$div.find(ctl._selectors.NEW).addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find(ctl._selectors.DRAW).addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find(ctl._selectors.PROGRESS).removeClass(TC.Consts.classes.HIDDEN);
        ctl._$dialogDiv.find(ctl._selectors.OKBTN).prop('disabled', true);
        ctl._$div.find(ctl._selectors.NEWBTN).prop('disabled', true);
        ctl.layer.clearFeatures();
        ctl.boxDraw.cancel();
    };

    var setDeletingState = function (ctl) {
        ctl._state = ctl._states.DELETING;
        ctl.showDownloadProgress(0, 1);
        ctl._$div.find(ctl._selectors.DRAW).addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find(ctl._selectors.PROGRESS).addClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find(ctl._selectors.NEW).removeClass(TC.Consts.classes.HIDDEN);
        ctl._$div.find(ctl._selectors.LISTITEM).addClass(TC.Consts.classes.DISABLED);
        ctl._$div.find(ctl._selectors.DELBTN).prop('disabled', true);
        ctl._$dialogDiv.find(ctl._selectors.OKBTN).prop('disabled', true);
        ctl._$div.find(ctl._selectors.NEWBTN).prop('disabled', false);
        ctl._$dialogDiv.find(ctl._selectors.TILECOUNT).html('');
        ctl.boxDraw.cancel();
    };

    var setNameEditingState = function (ctl, $li) {
        $li.find('a').first().addClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.TEXTBOX).removeClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.SAVEBTN).removeClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.CANCELBTN).removeClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.EDITBTN).addClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.VIEWBTN).addClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.DELETEBTN).addClass(TC.Consts.classes.HIDDEN);
    };

    var setNameReadyState = function (ctl, $li) {
        $li.find('a').first().removeClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.TEXTBOX).addClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.SAVEBTN).addClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.CANCELBTN).addClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.EDITBTN).removeClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.VIEWBTN).removeClass(TC.Consts.classes.HIDDEN);
        $li.find(ctl._selectors.DELETEBTN).removeClass(TC.Consts.classes.HIDDEN);
    };

    var formatNumber = function (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    var updateResolutions = function (ctl, options) {
        var opts = options || {};
        var $res = ctl._$dialogDiv.find(ctl._classSelector + '-res');
        var $rng = ctl._$dialogDiv.find(ctl._selectors.RNGMAXRES);
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
            resText = ctl.getLocaleString('metersPerPixel', {
                value: new Number(resolutions[resLevel]).toLocaleString((ctl.map ? ctl.map.options.locale : TC.Cfg.locale).replace('_', '-'))
            });
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
        var $cbList = ctl._$dialogDiv.find(ctl._classSelector + '-bl-node input[type=checkbox]');
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
        ctl.tileCount = 0;
        for (var i = 0, slen = ctl.requestSchemas.length; i < slen; i++) {
            var schema = ctl.requestSchemas[i];
            for (var j = 0, llen = schema.tileMatrixLimits.length; j < llen; j++) {
                var tml = schema.tileMatrixLimits[j];
                if (tml.res < ctl.minResolution) {
                    break;
                }
                else {
                    ctl.tileCount += (tml.cr - tml.cl + 1) * (tml.rb - tml.rt + 1);
                }
            }
        }
        if (ctl.tileCount) {
            ctl.estimatedMapSize = Math.round(ctl.tileCount * ctl.options.avgTileSize / 1048576);
            text = ctl.getLocaleString('xTiles', { quantity: formatNumber(ctl.tileCount) }) + ' (' + formatSize(ctl, ctl.estimatedMapSize) + ')';
        }
        ctl._$dialogDiv.find(ctl._selectors.TILECOUNT).html(text);
    };

    var $getListElementByMapName = function (ctl, name) {
        return ctl._$div.find(ctl._selectors.LISTITEM).filter(function (idx, elm) {
            return $(elm).find('a').first().html() === name;
        });
    };

    var $getListElementByMapUrl = function (ctl, url) {
        return ctl._$div.find(ctl._selectors.LISTITEM).filter(function (idx, elm) {
            return $(elm).find('a').first().attr('href') === url;
        });
    };

    var openCachedPage = function (ctl, url) {
        $('<iframe>')
            .css('display', 'none')
            .attr('src', url)
            .appendTo(ctl._$div);
    };

    var closeCachedPage = function (ctl, url) {
        var $iframe = ctl._$div.find('iframe[src="' + url + '"]');
        $iframe.remove();
    };

    var saveMapToStorage = function (ctl, map) {
        var result = false;
        if (window.localStorage) {
            localStorage.setItem(ctl.LOCAL_STORAGE_KEY_PREFIX + map.url, map.extent + " " + map.name);
            result = true;
        }
        return result;
    };

    var removeMapFromStorage = function (ctl, url) {
        var result = false;
        if (window.localStorage) {
            localStorage.removeItem(ctl.LOCAL_STORAGE_KEY_PREFIX + url);
            result = true;
        }
        return result;
    };

    var addMap = function (ctl) {
        var map = ctl.currentMap;
        if (saveMapToStorage(ctl, map)) {
            ctl.getRenderedHtml(ctl.CLASS + '-map-node', { name: map.name, url: map.url }, function (html) {
                ctl._$div.find(ctl._selectors.LIST).append(html);
                ctl._$div.find(ctl._selectors.EMPTYLIST).attr('hidden', 'hidden');
                ctl._$div.find(ctl._selectors.SEARCH).prop('disabled', false);
            });
            ctl.storedMaps.push(map);
        }
    }

    var removeMap = function (ctl, url) {
        var map = ctl.findStoredMap({ url: url });
        if (map) {
            if (removeMapFromStorage(ctl, url)) {
                $getListElementByMapName(ctl, map.name).remove();
            }
            var idx = $.inArray(map, ctl.storedMaps);
            ctl.storedMaps.splice(idx, 1);
            if (!ctl.storedMaps.length) {
                ctl._$div.find(ctl._selectors.SEARCH).prop('disabled', true);
                ctl._$div.find(ctl._selectors.EMPTYLIST).removeAttr('hidden');
            }
        }
    };

    var checkValidity = function (ctl) {
        ctl._$dialogDiv.find(ctl._selectors.OKBTN).prop('disabled',
            !ctl.extent ||
            ctl._$dialogDiv.find(ctl._selectors.NAMETB).val().length === 0 ||
            ctl._$dialogDiv.find(ctl._selectors.BLLIST + ' input[type=checkbox]:checked').length === 0);
    };

    ctlProto.render = function (callback) {
        var self = this;
        var renderObject = { storedMaps: self.storedMaps, listId: self.CLASS + '-list-' + TC.getUID() };
        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv.html(html);
            self._$dialogDiv.find(self._selectors.NAMETB).on(TC.Consts.event.CLICK, function (e) {
                e.preventDefault();
                this.selectionStart = 0;
                this.selectionEnd = this.value.length;
                this.focus();

            });
        }).then(function () {
            self.renderData(renderObject, function () {
                self._$dialogDiv.find(self._selectors.OKBTN).on(TC.Consts.event.CLICK, function () {
                    var options = {
                        mapName: self._$dialogDiv.find(self._selectors.NAMETB).val()
                    }
                    if (self.findStoredMap({ name: options.mapName })) {
                        TC.alert(self.getLocaleString('cb.mapNameAlreadyExists.error', options));
                    }
                    else {
                        var startRequest = function () {
                            self._$div.find(self._classSelector + '-name').html(options.mapName);
                            self.map.toast(self.getLocaleString('downloadingMap', { mapName: options.mapName }));
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
                                        TC.confirm(self.getLocaleString('cb.mapCreation.warning.reasonSize', {
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
                            // En IE por defecto el límite de recursos por manifiesto es 1000, en Edge, 2000
                            var ieVersion = TC.Util.detectIE();
                            if (ieVersion) {
                                var maxResourceCount = ieVersion < 12 ? 1000 : 2000;
                                var resourceCount = self.tileCount + cacheResourceCount;
                                if (resourceCount > maxResourceCount) {
                                    TC.confirm(self.getLocaleString('cb.mapCreation.warning.reasonCount', {
                                        mapName: options.mapName,
                                        resourceCount: formatNumber(resourceCount),
                                        maxResourceCount: formatNumber(maxResourceCount)
                                    }), startRequest);
                                }
                                else {
                                    startRequest();
                                }
                            }
                            else {
                                startRequest();
                            }
                        }
                    }
                });
                self._$dialogDiv.find(self._selectors.NAMETB).on('input', function () {
                    checkValidity(self);
                });
                self._$div.find(self._selectors.NEWBTN).on(TC.Consts.event.CLICK, function () {
                    setEditState(self);
                });
                self._$div.find(self._classSelector + '-btn-cancel-draw').on(TC.Consts.event.CLICK, function () {
                    setReadyState(self);
                });

                self._$div.find(self._classSelector + '-btn-cancel-dl').on(TC.Consts.event.CLICK, function () {
                    self.cancelCacheRequest();
                });

                self._$div.find(self._selectors.LIST)
                    .on(TC.Consts.event.CLICK, self._selectors.DELETEBTN, function (e) {
                        $btn = $(e.target);
                        var mapName = $btn.parent().find('a').html();
                        if (mapName) {
                            if (confirm(self.getLocaleString('cb.delete.confirm', { mapName: mapName }))) {
                                setDeletingState(self);
                                self.deleteMap(mapName);
                            }
                        }
                    })
                    .on(TC.Consts.event.CLICK, self._selectors.EDITBTN, function (e) {
                        setNameEditingState(self, $(e.target).parent());
                    })
                    .on(TC.Consts.event.CLICK, self._selectors.CANCELBTN, function (e) {
                        setNameReadyState(self, $(e.target).parent());
                    })
                    .on(TC.Consts.event.CLICK, self._selectors.SAVEBTN, function (e) {
                        var $li = $(e.target).parent();
                        setNameReadyState(self, $li);
                        var $a = $li.find('a');
                        var oldName = $a.html();
                        var newName = $li.find(self._selectors.TEXTBOX).val();
                        var map = self.findStoredMap({ url: $a.attr('href') });
                        if (map) {
                            map.name = newName;
                            $a.html(newName);
                            saveMapToStorage(self, map);
                        }
                    })
                    .on(TC.Consts.event.CLICK, self._selectors.VIEWBTN, function (e) {
                        $btn = $(e.target);
                        var showExtent = !$btn.hasClass(TC.Consts.classes.ACTIVE);
                        self._$div.find(self._selectors.VIEWBTN)
                            .removeClass(TC.Consts.classes.ACTIVE)
                            .parent()
                            .removeClass(TC.Consts.classes.ACTIVE);
                        var mapName = $btn.parent().find('a').html();
                        if (mapName) {
                            var map = self.findStoredMap({ name: mapName });
                            if (map) {
                                var extent = getExtentFromString(map.extent);
                                self.layer.clearFeatures();
                                if (showExtent) {
                                    self.layer.addPolygon(
                                        [
                                            [
                                                [extent[0], extent[1]],
                                                [extent[0], extent[3]],
                                                [extent[2], extent[3]],
                                                [extent[2], extent[1]]
                                            ]
                                        ]
                                    ).then(function () {
                                        self.layer.map.zoomToFeatures(self.layer.features);
                                    });
                                    $btn.addClass(TC.Consts.classes.ACTIVE);
                                    $btn.parent().addClass(TC.Consts.classes.ACTIVE);
                                    $btn.attr('title', self.getLocaleString('removeMapExtent'));
                                }
                            }
                        }
                    });

                var _filter = function (searchTerm) {
                    searchTerm = searchTerm.toLowerCase();
                    //tc-ctl-cbuild-map-available-empty
                    var $li = self._$div.find(self._selectors.LISTITEM).hide();
                    var $mapLi = $li.filter('li:not([class]),li.' + TC.Consts.classes.ACTIVE);

                    if (searchTerm.length === 0) {
                        $mapLi.show();
                        self._$div.find(self._classSelector + '-map-search-icon').css('visibility', 'visible');
                    } else {
                        self._$div.find(self._classSelector + '-map-search-icon').css('visibility', 'hidden');
                        var r = new RegExp(searchTerm, 'i');
                        $mapLi.each(function () {
                            var $this = $(this);
                            $this.toggle(r.test($this.children('a').text()));
                        });

                        if ($mapLi.filter(':visible').length === 0) {
                            $li.filter('[class^="tc-ctl-cbuild-map-not"]').show();
                        }
                    }
                };

                var $trackSearch = self._$div.find(self._selectors.SEARCH);
                $trackSearch.on('keyup search', function () {
                    _filter($(this).val().toLowerCase().trim());
                });

                // IE10 polyfill
                try {
                    if ($trackSearch.has($('::-ms-clear'))) {
                        var oldValue;
                        $trackSearch.on('mouseup', function (e) {
                            oldValue = $trackSearch.val();

                            if (oldValue === '') {
                                return;
                            }

                            // When this event is fired after clicking on the clear button
                            // the value is not cleared yet. We have to wait for it.
                            setTimeout(function () {
                                var newValue = $trackSearch.val();

                                if (newValue === '') {
                                    _filter(newValue);
                                }
                            }, 1);
                        });
                    }
                }
                catch (e) { };

                self._$dialogDiv.find(self._selectors.BLLIST)
                    .on('change', 'input[type=checkbox]', function (e) {
                        self.baseLayers.length = 0;
                        self._$dialogDiv.find(self._selectors.BLLIST + ' input[type=checkbox]').each(function (idx, elm) {
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

                self._$dialogDiv.find(self._selectors.RNGMAXRES)
                    .on('input change', function (e) {
                        updateResolutions(self, {
                            rangeValue: $(e.target).val()
                        });
                        updateThumbnails(self);
                        showEstimatedMapSize(self);
                    });

                var params = TC.Util.getQueryStringParams();
                $getListElementByMapUrl(self, location.href).addClass(TC.Consts.classes.ACTIVE);

                if ($.isFunction(callback)) {
                    callback();
                }
            });
        });

        // Control para evitar que se cancele una descarga de cache al salir de la página
        window.addEventListener('beforeunload', function (e) {
            if (self.isDownloading) {
                var msg = self.getLocaleString('cb.mapDownloading.warning');
                e.returnValue = msg;
                return msg;
            }
        }, true);
    };

    ctlProto.register = function (map) {
        var self = this;

        TC.Control.prototype.register.call(self, map);

        if (self.mapIsOffline) {
            // Si no está especificado, el panel de aviso offline se cuelga del div del mapa
            self._$offlinePanelDiv = $(TC.Util.getDiv(self.options.offlinePanelDiv));
            if (!self.options.offlinePanelDiv) {
                self._$offlinePanelDiv.appendTo(map._$div);
            }
            self.getRenderedHtml(self._selectors.OFFPANEL, null, function (html) {
                self._$offlinePanelDiv.html(html);
                if (!navigator.onLine) {
                    self._$offlinePanelDiv.find(self._selectors.OFFPANEL)
                        .addClass(TC.Consts.classes.CONNECTION_OFFLINE)
                        .removeClass(TC.Consts.classes.CONNECTION_MOBILE)
                        .removeClass(TC.Consts.classes.CONNECTION_WIFI);
                }
                self._$offlinePanelDiv.find(self._selectors.EXIT).on(TC.Consts.event.CLICK, function (e) {
                    TC.confirm(self.getLocaleString('offlineMapExit.confirm'),
                        null,
                        function () {
                            e.preventDefault();
                        });
                });
            });
        }


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
                        div: self._$div.find(self._selectors.DRAW),
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
                            TC.Util.showModal(self._$dialogDiv.find(self._classSelector + '-dialog'), {
                                openCallback: function () {
                                    var time;
                                    if (Date.prototype.toLocaleString) {
                                        var opt = {};
                                        opt.year = opt.month = opt.day = opt.hour = opt.minute = opt.second = 'numeric';
                                        time = new Date().toLocaleString(self.map.options.locale.replace('_', '-'), opt);
                                    }
                                    else {
                                        time = new Date().toString();
                                    }
                                    var text = self._$dialogDiv.find(self._selectors.NAMETB).val(time)[0];
                                    checkValidity(self);
                                },
                                closeCallback: function () {
                                    self.layer.clearFeatures();
                                }
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

        var addRenderedListNode = function (layer) {
            var result = false;
            var $blList = self._$dialogDiv.find(self._selectors.BLLIST);
            if (layer.type === TC.Consts.layerType.WMTS) {
                if ($blList.find('li[data-tc-layer-uid="' + layer.id + '"]').length === 0) {
                    result = true;
                    self.getRenderedHtml(self.CLASS + '-bl-node', layer, function (html) {
                        $blList.append(html);
                    });
                }
            }
            return result;
        };

        map
            .on(TC.Consts.event.LAYERADD, function (e) {
                addRenderedListNode(e.layer);
            })
            .on(TC.Consts.event.LAYERREMOVE, function (e) {
                if (e.layer.type === TC.Consts.layerType.WMTS) {
                    self._$dialogDiv
                        .find(self._selectors.BLLIST)
                        .find('li[data-tc-layer-uid="' + e.layer.id + '"]')
                        .remove();
                }
            });


        var params = TC.Util.getQueryStringParams();
        var mapDefString = params[self.MAP_DEFINITION_PARAM_NAME];
        var extentString = params[self.MAP_EXTENT_PARAM_NAME];

        map.loaded(function () {
            map.putLayerOnTop(self.layer);

            self._$div.find(self._selectors.NEWBTN).prop('disabled', false);
            for (var i = 0, len = map.baseLayers.length; i < len; i++) {
                addRenderedListNode(map.baseLayers[i]);
            }

            if (self.mapIsOffline) {
                // Deshabilitamos los controles que no son usables en modo offline
                var offCtls = [];
                for (var i = 0, len = self.offlineControls.length; i < len; i++) {
                    var offCtl = self.offlineControls[i];
                    offCtl = offCtl.substr(0, 1).toUpperCase() + offCtl.substr(1);
                    offCtls = offCtls.concat(map.getControlsByClass('TC.control.' + offCtl));
                }

                for (var i = 0, len = map.controls.length; i < len; i++) {
                    var ctl = map.controls[i];
                    if (offCtls.indexOf(ctl) < 0) {
                        ctl.disable();
                    }
                }

                var mapDef = JSON.parse(window.atob(decodeURIComponent(mapDefString)));
                var excludedLayers = [];
                // Obtenemos la primera capa del esquema de la cache y de paso vemos qué capas no van a estar disponibles
                var baseLayer = $.grep(map.baseLayers, function (layer) {
                    var result = false;
                    if (layer.type === TC.Consts.layerType.WMTS) {
                        for (var i = 0, len = mapDef.layers.length; i < len; i++) {
                            var l = mapDef.layers[i];
                            if (layer.url === mapDef.url[l.urlIdx] && layer.layerNames === l.id && layer.matrixSet === mapDef.tms[l.tmsIdx]) {
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
                var $li = $getListElementByMapUrl(self, e.url);
                if ($li.length) {
                    // Se ha descargado un mapa cuando se quería borrar. Pasa cuando la cache ya estaba borrada pero la entrada en localStorage no.
                    $li.removeClass(TC.Consts.classes.DISABLED);
                    $li.find(self._selectors.DELBTN).prop('disabled', false);
                    TC.alert(self.getLocaleString('cb.delete.error'));
                }
                else {
                    if (self.currentMap && e.url === self.currentMap.url) {
                        addMap(self);
                        map.toast(self.getLocaleString('mapDownloaded', { mapName: self.currentMap.name }));
                    }
                }
                self.currentMap = null;
                closeCachedPage(self, e.url);
                setReadyState(self);
            })
            .on(TC.Consts.event.MAPCACHEDELETE, function (e) {
                self.isDownloading = false;
                removeMap(self, e.url);
                closeCachedPage(self, e.url);
                document.cookie = self.COOKIE_KEY_PREFIX + 'delete=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                map.toast(self.getLocaleString('mapDeleted'));
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
                closeCachedPage(self, e.url);
                setReadyState(self);
                var msg = self.getLocaleString('cb.mapCreation.error');
                var handleError = true;
                switch (e.reason) {
                    case 'quota':
                        msg += '. ' + self.getLocaleString('cb.mapCreation.error.reasonQuota');
                        break;
                    case 'resource':
                        msg += '. ' + self.getLocaleString('cb.mapCreation.error.reasonResource');
                        break;
                    case 'manifest':
                        if (e.status == '410') {
                            removeMap(self, e.url);
                        }
                        handleError = false;
                        break;
                    case ALREADY_EXISTS:
                        msg += '. ' + self.getLocaleString('cb.mapCreation.error.reasonAlreadyExists');
                    default:
                        break;
                }
                if (handleError) {
                    if (TC.Util.detectIE()) {
                        TC.error(msg);
                        TC.alert(self.getLocaleString('cb.mapCreation.error.reasonIE'));
                    }
                    else {
                        TC.alert(msg);
                    }
                }
                self.currentMap = null;
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

                var mapDefinition = {
                    bBox: intersectionExtent,
                    res: self.minResolution,
                    url: [],
                    tms: [],
                    format: [],
                    layers: new Array(self.baseLayers.length)
                };
                for (var i = 0, len = self.baseLayers.length; i < len; i++) {
                    var layer = self.baseLayers[i];
                    var urlIdx = $.inArray(layer.url, mapDefinition.url);
                    if (urlIdx < 0) {
                        urlIdx = mapDefinition.url.push(layer.url) - 1;
                    }
                    var tmsIdx = $.inArray(layer.matrixSet, mapDefinition.tms);
                    if (tmsIdx < 0) {
                        tmsIdx = mapDefinition.tms.push(layer.matrixSet) - 1;
                    }
                    var shortFormat = layer.format.substr(layer.format.indexOf('/') + 1);
                    var formatIdx = $.inArray(shortFormat, mapDefinition.format);
                    if (formatIdx < 0) {
                        formatIdx = mapDefinition.format.push(shortFormat) - 1;
                    }
                    mapDefinition.layers[i] = {
                        urlIdx: urlIdx,
                        id: layer.layerNames,
                        tmsIdx: tmsIdx,
                        formatIdx: formatIdx
                    };
                }

                var params = TC.Util.getQueryStringParams();
                var e = params[self.MAP_EXTENT_PARAM_NAME] = intersectionExtent.toString();
                var s = params[self.MAP_DEFINITION_PARAM_NAME] = btoa(JSON.stringify(mapDefinition));
                var u = location.origin + location.pathname.substr(0, location.pathname.lastIndexOf('/') + 1) + self.CACHE_REQUEST_PATH + '?' + $.param(params) + location.hash;
                self.currentMap = { name: opts.mapName, extent: e, url: u };
                self.isDownloading = true;
                openCachedPage(self, u);
            }
        }
    }

    ctlProto.cancelCacheRequest = function () {
        var self = this;
        if (self.currentMap) {
            closeCachedPage(self, self.currentMap.url);
            self.currentMap = null;
        }
        self.isDownloading = false;
        setReadyState(self);
    };

    ctlProto.deleteMap = function (name) {
        var self = this;

        var map = self.findStoredMap({ name: name });
        if (map) {
            var params = TC.Util.getQueryStringParams(map.url);
            var errorCallback = function (request, status, error) {
                TC.error('[' + status + '] ' + error);
            };
            document.cookie = self.COOKIE_KEY_PREFIX + 'delete=' + atob(decodeURIComponent(params[self.MAP_DEFINITION_PARAM_NAME]));
            openCachedPage(self, map.url);
        }
    };

    ctlProto.findStoredMap = function (options) {
        var self = this;
        return $.grep(self.storedMaps, function (elm) {
            var result = true;
            if (options.name && options.name !== elm.name) {
                result = false;
            }
            if (result && options.url && options.url !== elm.url) {
                result = false;
            }
            return result;
        })[0];
    };

    ctlProto.showDownloadProgress = function (current, total) {
        var self = this;
        var cs = self._classSelector;
        var $count = self._$div.find(cs + '-progress-count');
        if (total) {
            var percent = Math.min(Math.round(current * 100 / total), 100);
            var percentString = percent + '%';
            self._$div.find(cs + '-progress-ratio').css('width', percentString);
            $count.html(percentString);
        }
        else {
            self._$div.find(cs + '-progress-bar').addClass(TC.Consts.classes.HIDDEN);
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

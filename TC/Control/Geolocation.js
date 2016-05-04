TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}

TC.control.Geolocation = function () {
    var self = this;
    self.$events = $(self);

    self.Const = {
        Classes: {
            ACTIVE: 'tc-ctl-geolocation-active',
            CLOSED: 'closed',
            SELECTEDTRACK: 'selectedTrack'
        },
        LocalStorageKey: {
            TRACKING: 'trk',
            TRACKINGTEMP: 'trktemp'
        },
        Message: {
            VALIDATENAME: '',
        },
        Event: {
            POSITIONCHANGE: 'positionchange.tc.geolocation',
            GPSPOSITIONCHANGE: 'gpspositionchange.tc.geolocation',
            GPSPOSITIONERROR: 'positionerror.tc.geolocation',
            STATEUPDATED: 'stateupdated.tc.geolocation',
            GPSADD: 'gpsadd.tc.geolocation',
            TRACKSNAPPING: 'tracksnapping.tc.geolocation'
        },
        MimeMap: {
            KML: 'application/vnd.google-earth.kml+xml',
            GPX: 'application/gpx+xml'
        }
    };

    TC.Control.apply(self, arguments);

    self.deltaMean = 500;
};

TC.inherit(TC.control.Geolocation, TC.Control);

(function () {
    var ctlProto = TC.control.Geolocation.prototype;

    ctlProto.CLASS = 'tc-ctl-geolocation';

    ctlProto.template = {};

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Geolocation.html";
        ctlProto.template[ctlProto.CLASS + '-track-node'] = TC.apiLocation + "TC/templates/GeolocationTrackNode.html";
        ctlProto.template[ctlProto.CLASS + '-track-snapping-node'] = TC.apiLocation + "TC/templates/GeolocationTrackSnappingNode.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "geo" }).w("</h2><div class=\"tc-ctl-geolocation-content\"><div class=\"tc-ctl-geolocation-gps\"><button class=\"tc-button tc-icon-button\" title=\"").h("i18n", ctx, {}, { "$key": "geo.gps" }).w("\"> </button></div><div class=\"tc-ctl-geolocation-showCoords tc-hidden\"><!--se inserta en el div del mapa--><div class=\"tc-ctl-geolocation-icon-cross\" style=\"display: none;\"></div><button class=\"tc-button tc-icon-button\" title=\"").h("i18n", ctx, {}, { "$key": "geo.coords" }).w("\"></button></div><div class=\"tc-ctl-geolocation-pause\"><button class=\"tc-button tc-icon-button\" title=\"Pausar el tracking\"> </button></div><div class=\"tc-ctl-geolocation-track\"><div class=\"tc-ctl-geolocation-track-snap-info\"></div><div class=\"tc-ctl-geolocation-info-track\" style=\"display:none;\"></div><!-- img se insertan en el div del mapa--><img id=\"tc-ctl-geolocation-track-marker\" src=\"data:image/png;base64,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\" style=\"display: none;\" /><img id=\"tc-ctl-geolocation-track-elevation-marker\" src=\"data:image/png;base64,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\" style=\"display: none;\" /><div class=\"tc-ctl-geolocation-track-mng\"><h4>").h("i18n", ctx, {}, { "$key": "geo.tracks" }).w("</h4><div class=\"tc-ctl-geolocation-track-available tc-ctl-geolocation-track-cnt\"><!--<label class=\"tc-ctl-geolocation-track-available-label\" for=\"tc-ctl-geolocation-track-available-srch\">Tracks disponibles:</label>--><input id=\"tc-ctl-geolocation-track-available-srch\" type=\"search\" list=\"tc-ctl-geolocation-track-available-lst\" class=\"tc-ctl-geolocation-track-available-srch tc-textbox\" placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.filter.plhr" }).w("\" maxlength=\"200\" /><ol id=\"tc-ctl-geolocation-track-available-lst\" class=\"tc-ctl-geolocation-track-available-lst\"><li class=\"tc-ctl-geolocation-track-available-empty\">").h("i18n", ctx, {}, { "$key": "geo.noTracks" }).w("</li><li class=\"tc-ctl-geolocation-track-not\" hidden>").h("i18n", ctx, {}, { "$key": "geo.noFilteredTracks" }).w("</li></ol></div><h4>").h("i18n", ctx, {}, { "$key": "geo.track" }).w("</h4><div class=\"tc-alert alert-warning tc-hidden\"><p id=\"panel-msg\">").h("i18n", ctx, {}, { "$key": "geo.trk.panel.1" }).w(" <ul><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.2" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.3" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.4" }).w("</li></ul></p></div><div class=\"tc-ctl-geolocation-track-ui\"><div class=\"tc-ctl-geolocation-track-panel-block\"><i class=\"tc-ctl-geolocation-track-panel tc-ctl-geolocation-track-panel-opened\"></i><span class=\"tc-ctl-geolocation-track-panel-span\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.1" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.2" }).w("</span><i class=\"tc-ctl-geolocation-track-panel-help icon-question-sign\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.3" }).w("\"></i><a href=\"#\" id=\"panelOpened\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.4" }).w("\"></a></div><button class=\"tc-button tc-icon-button\" title=\"").h("i18n", ctx, {}, { "$key": "geo.track" }).w("\"> </button></div><div class=\"tc-ctl-geolocation-track-current tc-ctl-geolocation-track-cnt\"><input type=\"text\" class=\"tc-ctl-geolocation-track-title tc-textbox\" disabled placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.trk.name.plhr" }).w("\" maxlength=\"200\" /><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-save\" disabled title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.name.save" }).w("\"></button><input type=\"text\" class=\"tc-ctl-geolocation-track-waypoint tc-textbox\" disabled placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.trk.wyp.plhr" }).w("\" maxlength=\"200\" /><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-add-wpt\" disabled title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.wyp.save" }).w("\"></button></div><h4>").h("i18n", ctx, {}, { "$key": "geo.trk.import.lbl" }).w("</h4><div class=\"tc-ctl-geolocation-track-cnt\"><input type=\"file\" class=\"tc-ctl-geolocation-track-import tc-button\" accept=\".gpx,.kml\" disabled /></div></div></div></div><div id=\"track-chart\"><div class=\"track-chart-collapse\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.chart.exp" }).w("\"><span></span></div><div class=\"track-chart-chart\"><h5>").h("i18n", ctx, {}, { "$key": "geo.trk.chart.chpe" }).w("</h5><div id=\"chart\"></div><p hidden>").h("i18n", ctx, {}, { "$key": "geo.trk.chart.chpe.empty" }).w("</p></div></div><div id=\"continue-track\" class=\"tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "geo.track" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><button id=\"tc-ctl-geolocation-track-continue\" class=\"tc-button\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.cnt" }).w(" </button><button id=\"tc-ctl-geolocation-track-new\" class=\"tc-button\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.new" }).w(" </button> <button class=\"tc-button tc-modal-close\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.cancel" }).w(" </button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-track-node'] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<li data-id=\"").f(ctx.get(["id"], false), ctx, "h").w("\"><a href=\"#\" id=\"draw\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.draw" }).w("\"></a><a href=\"#\" id=\"simulate\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.simulate" }).w("\"></a><span title=\"").f(ctx.get(["name"], false), ctx, "h").w("\">").f(ctx.get(["name"], false), ctx, "h").w("</span><input type=\"text\" hidden value=\"").f(ctx.get(["name"], false), ctx, "h").w("\" /><a href=\"#\" id=\"edit\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.edit" }).w("\"></a><a href=\"#\" hidden id=\"save\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.save" }).w("\"></a><a href=\"#\" hidden id=\"cancel\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.cancel" }).w("\"></a><a href=\"#\" id=\"delete\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.delete" }).w("\"></a><a href=\"#\" id=\"exportGPX\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.exportGPX" }).w("\"></a><a href=\"#\" id=\"exportKML\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.exportKML" }).w("\"></a></li>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-track-snapping-node'] = function () { function body_0(chk, ctx) { return chk.w("<p>").h("i18n", ctx, {}, { "$key": "geo.trk.snapping" }).w("</p><ul>").x(ctx.getPath(false, ["data", "n"]), ctx, { "block": body_1 }, {}).w(" <li> X - data.x + </li><li> Y - data.y + </li>").x(ctx.getPath(false, ["data", "z"]), ctx, { "block": body_2 }, {}).w(" ").x(ctx.getPath(false, ["data", "t"]), ctx, { "block": body_3 }, {}).w("</ul>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li> ").h("i18n", ctx, {}, { "$key": "geo.trk.snapping.name" }).w(" - ").f(ctx.getPath(false, ["data", "n"]), ctx, "h").w(" </li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<li> Z - ").f(ctx.getPath(false, ["data", "z"]), ctx, "h").w(" </li>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<li> T - data.t + </li>"); } body_3.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        self.wrap = new TC.wrap.control.Geolocation(self);
        self.wrap.register(map);

        map.loaded(function () {
            $.when(map.addLayer({
                id: TC.getUID(),
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                title: 'Posicionar',
            })).then(function (layer) {
                self.layer = layer;
            });

            // control de coordenadas, si no hay instanciamos
            self.showCoords.coordsCtl = self.map.getControlsByClass('TC.control.Coordinates');
            self.showCoords.coordsCtl = self.showCoords.coordsCtl || [];
            if (self.showCoords.coordsCtl.length == 0) {
                TC.syncLoadJS(TC.apiLocation + 'TC/control/Coordinates.js');
                self.showCoords.coordsCtl = new TC.control.Coordinates();
            }
            else self.showCoords.coordsCtl = self.showCoords.coordsCtl[0];
        });
    };

    ctlProto.renderData = function (data, callback) {
        var self = this;

        TC.Control.prototype.renderData.call(self, data, function () {
            self.showCoords = {};

            self.$toolsPanel = $('.tools-panel');
            self.showCoords.$button = self._$div.find('.tc-ctl-geolocation-showCoords button');
            self.showCoords.$textCoords = self._$div.find('.tc-ctl-geolocation-showCoords-txt');

            // GLS; después de la demo borrar
            self.pause = {};
            self.pause.$button = self._$div.find('.tc-ctl-geolocation-pause button');
            self.pause.paused;
            self.pause.$button.on('click', function () {
                console.log('pausa pero tracking no activado');
                if (self.track.$button.hasClass(self.Const.Classes.ACTIVE)) {
                    if (self.pause.paused == undefined || !self.pause.paused) {
                        $(this).addClass('clicked');
                        self.pause.paused = true;
                        console.log('pausado tracking');
                    }
                    else {
                        $(this).removeClass('clicked');
                        self.pause.paused = false;
                        console.log('reanudado tracking');
                    }
                }
            });

            self.gps = {};
            self.gps.$button = self._$div.find('.tc-ctl-geolocation-gps button');

            self.track = {};
            self.track.$button = self._$div.find('.tc-ctl-geolocation-track-ui button');
            self.track.$info = self._$div.find('.tc-ctl-geolocation-info-track');
            self.track.htmlMarker = document.getElementById('tc-ctl-geolocation-track-marker');


            self.track.$trackChartPanel = self._$div.find('#track-chart');
            self.track.$trackChart = self._$div.find('#chart');
            self.track.htmlElevationMarker = document.getElementById('tc-ctl-geolocation-track-elevation-marker');

            self.track.$trackSearch = self._$div.find('.tc-ctl-geolocation-track-available-srch');
            self.track.$trackList = self._$div.find('.tc-ctl-geolocation-track-available-lst');

            self.track.$trackToolPanelOpened = self._$div.find('.tc-ctl-geolocation-track-panel-opened');
            self.track.$trackToolPanelOpened.click(function () {
                $(this).toggleClass(self.Const.Classes.CLOSED);
            });

            self._$div.find('.tc-ctl-geolocation-track-panel-help').click(function () {
                _showAlerMsg.call(self);
            });

            self.track.$trackName = self._$div.find('.tc-ctl-geolocation-track-title');
            self.track.$trackSave = self._$div.find('.tc-ctl-geolocation-track-save');

            self.track.$trackWPT = self._$div.find('.tc-ctl-geolocation-track-waypoint');
            self.track.$trackAdd = self._$div.find('.tc-ctl-geolocation-track-add-wpt');

            self.track.$trackContinue = self._$div.find('#tc-ctl-geolocation-track-continue');
            self.track.$trackRenew = self._$div.find('#tc-ctl-geolocation-track-new');
            self.track.$trackAddSegment = self._$div.find('#tc-ctl-geolocation-track-segment');

            self.track.$trackImportFile = self._$div.find('.tc-ctl-geolocation-track-import');


            if (!TC.Util.detectMouse()) {
                self._$div.find('.tc-ctl-geolocation-showCoords').removeClass('tc-hidden');

                if (Modernizr.mq('screen and (max-height: 50em) and (max-width: 50em)'))
                    self.track.$trackToolPanelOpened.addClass(self.Const.Classes.CLOSED);
            }

            if (window.File && window.FileReader && window.FileList && window.Blob) {
                self.track.$trackImportFile.removeAttr('disabled');
                self.track.$trackImportFile.on('change', $.proxy(self.import, self));
            } else {
                console.log('no es posible la importación');
            }

            self.showCoords.$button.on('click', function () {

                if ($(this).hasClass(self.Const.Classes.ACTIVE))
                    self.deactivateCoords();
                else {
                    if (self.deactivateGPS() && self.deactivateTracking()) {
                        self.activateCoords();
                    }
                }
            });
            self.gps.$button.on('click', function () {

                if ($(this).hasClass(self.Const.Classes.ACTIVE))
                    self.deactivateGPS();
                else {
                    if (self.deactivateCoords() && self.deactivateTracking()) {
                        self.activateGPS();
                    }
                }
            });
            self.track.$button.on('click', function () {

                if ($(this).hasClass(self.Const.Classes.ACTIVE))
                    self.deactivateTracking();
                else {
                    if (self.deactivateCoords() && self.deactivateGPS()) {
                        self.activateTracking();
                    }
                }
            });

            self.track.$chartViewChart = self._$div.find("#track-chart");
            self.track.$chartCollapse = self._$div.find("#track-chart > span");

            var _filter = function (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                //tc-ctl-geolocation-track-available-empty
                self.track.$trackList.find('li').hide();

                if (searchTerm.length == 0)
                    self.track.$trackList.find('li:not([class]),li.' + self.Const.Classes.SELECTEDTRACK).show();
                else {
                    var r = new RegExp(searchTerm, 'i');
                    self.track.$trackList.find('li:not([class]),li.' + self.Const.Classes.SELECTEDTRACK).each(function () {
                        if ($(this).text().match(r))
                            $(this).show();
                        else $(this).hide();
                    });

                    if (self.track.$trackList.find('li:not([class]):visible,li.' + self.Const.Classes.SELECTEDTRACK + ':visible').length == 0)
                        self.track.$trackList.find('li[class^="tc-ctl-geolocation-track-not"]').show();
                }
            };
            self.track.$trackSearch.on("keyup search", function () {
                _filter($(this).val().toLowerCase().trim());
            });

            // IE10 polyfill
            try {
                if (self.track.$trackSearch.has($('::-ms-clear'))) {
                    var oldValue;
                    self.track.$trackSearch.on('mouseup', function (e) {
                        oldValue = self.track.$trackSearch.val();

                        if (oldValue === '') {
                            return;
                        }

                        // When this event is fired after clicking on the clear button
                        // the value is not cleared yet. We have to wait for it.
                        setTimeout(function () {
                            var newValue = self.track.$trackSearch.val();

                            if (newValue === '') {
                                _filter(newValue);
                            }
                        }, 1);
                    });
                }
            }
            catch (e) { }

            // en el panel
            self.track.$trackSave.on('click', $.proxy(self.saveTrack, self));
            self.track.$trackAdd.on('click', $.proxy(self.addWaypoint, self));

            // en lista
            self.uiSimulate = function (simulate, $self) {
                var editControls = ['a#simulate', 'a#edit', 'a#delete', 'a#exportGPX', 'a#exportKML'];
                var simulateControls = ['a#stop', 'a#pause', 'select#velocity'];
                var cnt = $self.is('li') ? $self : $self.parent();

                if (simulate) {
                    for (var i = 0; i < editControls.length; i++)
                        $(cnt).find(editControls[i]).first().attr('hidden', 'hidden');

                    for (var i = 0; i < simulateControls.length; i++)
                        $(cnt).find(simulateControls[i]).first().removeAttr('hidden');
                } else {
                    for (var i = 0; i < simulateControls.length; i++) {
                        $(cnt).find(simulateControls[i]).first().attr('hidden', 'hidden');
                        if (simulateControls[i] == 'select#velocity')
                            $(cnt).find(simulateControls[i]).val(0.5);
                    }

                    for (var i = 0; i < editControls.length; i++)
                        $(cnt).find(editControls[i]).first().removeAttr('hidden');
                }
            };
            $(document).on("click", "a#simulate", function () {
                self.uiSimulate(false, self.getSelectedTrack());
                $(this).parent().parent().find('li').removeClass(self.Const.Classes.SELECTEDTRACK);

                $(this).parent().addClass(self.Const.Classes.SELECTEDTRACK);
                self.uiSimulate(true, $(this));

                self.simulate_paused = false;
                self.simulateTrack($(this).parent());
            });
            $(document).on("click", "a#draw", function () {
                if ($(this).parent().hasClass(self.Const.Classes.SELECTEDTRACK)) {
                    $(this).attr('title', self.getLocaleString("tr.lst.draw"));
                    self.uiSimulate(false, $(this));
                    self.clear();
                }
                else {
                    self.drawTrack($(this).parent());
                }
            });

            var _edit = function (edit, $self) {
                if (edit) {
                    $self.parent().find('input').first().removeAttr('hidden');
                    $self.parent().find('span').first().attr('hidden', 'hidden');

                    $self.parent().find('input').first().val($self.parent().find('span').first().text()).focus();

                    $self.parent().find('a#simulate').first().attr('hidden', 'hidden');
                    $self.parent().find('a#edit').first().attr('hidden', 'hidden');
                    $self.parent().find('a#delete').first().attr('hidden', 'hidden');

                    $self.parent().find('a#save').first().removeAttr('hidden');
                    $self.parent().find('a#cancel').first().removeAttr('hidden');
                } else {
                    $self.parent().find('input').first().attr('hidden', 'hidden');
                    $self.parent().find('span').first().removeAttr('hidden');

                    $self.parent().find('a#simulate').first().removeAttr('hidden');
                    $self.parent().find('a#edit').first().removeAttr('hidden');
                    $self.parent().find('a#delete').first().removeAttr('hidden');

                    $self.parent().find('a#save').first().attr('hidden', 'hidden');
                    $self.parent().find('a#cancel').first().attr('hidden', 'hidden');
                }
            };
            $(document).on("click", "a#edit", function () {
                _edit(true, $(this));
            });
            $(document).on("click", "a#delete", function () {
                self.removeTrack($(this).parent());
            });
            $(document).on("click", "a#save", function () {
                var newName = $(this).parent().find('input').first().val();
                if (newName.trim().length == 0) {
                    TC.alert(self.getLocaleString("geo.trk.edit.alert"));
                }
                else {
                    self.editTrackName($(this).parent().attr('data-id'), $(this).parent().find('input').first().val());
                    _edit(false, $(this));
                }
            });
            $(document).on("click", "a#cancel", function () {
                _edit(false, $(this));
            });

            $(document).on("click", "a#exportGPX,a#exportKML", function () {
                var that = this;
                var id = $(this).attr('id');
                var mimeType = id.replace('export', '');

                self.export(mimeType, $(this).parent()).then(function (data) {
                    if (data) idena.utils.fileDownload($(that).parent().find('span').first().text() + '.' + mimeType.toLowerCase(), self.Const.MimeMap[mimeType.toUpperCase()], data);
                    else TC.alert(self.getLocaleString("geo.error.export"));
                });
            });


            $(document).on("click", "a#stop", function () {
                self.uiSimulate(false, $(this));
                self.clear();
            });
            $(document).on("click", "a#pause", function () {
                self.simulate_paused = !$(this).hasClass('play');
                $(this).attr('title', self.getLocaleString(self.simulate_paused ? "tr.lst.play" : "tr.lst.pause"));
                $(this).toggleClass('play');
            });
            $(document).on("change", "select#velocity", function () {
                self.simulate_speed = $(this).find('option:selected').val();
            });



            // popup
            self.track.$trackContinue.on('click', function () {
                // cerramos popup y continuamos con el track de session y almacenando en session
                TC.Util.closeModal();
                // al obtener la posición se almacena en session y continuamos almacenando en session mientras se mueve
                _tracking.call(self);
            });
            self.track.$trackRenew.on('click', function () {
                // eliminamos el track actual de session - restablecemos el tracking
                delete self.sessionTracking;
                TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, undefined);
                // cerramos el popup
                TC.Util.closeModal();
                // al obtener la posición se almacena en session y continuamos almacenando en session mientras se mueve
                _tracking.call(self);
            });
            self.track.$trackAddSegment.on('click', function () {
                TC.alert('pendiente');
                // cerramos el popup
                TC.Util.closeModal();
            });

            self.track.$chartCollapse.on('click', function () {
                self.track.$chartCollapse.parent().toggleClass('collapsed');

                if (self.track.$chartCollapse.parent().hasClass('collapsed'))
                    self.track.$chartCollapse.attr('title', self.getLocaleString("geo.trk.chart.exp"));
                else self.track.$chartCollapse.attr('title', self.getLocaleString("geo.trk.chart.col"));
            });

            if (window.localforage)
                self.bindTracks();
            else {
                TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                    self.bindTracks();
                });
            }
        });

        if ($.isFunction(callback)) {
            callback();
        }
    };

    var _showAlerMsg = function () {
        var self = this;

        var alert = self._$div.find(".alert-warning");
        _hideErrorMessages.call(self);
        alert.find("#panel-msg").css("display", "block");

        alert.removeClass(TC.Consts.classes.HIDDEN);
        alert.fadeTo(5000, 500).fadeOut(500, function () {
            alert.addClass(TC.Consts.classes.HIDDEN);
        });
    };

    var _hideErrorMessages = function () {
        var self = this;

        var alert = self._$div.find(".alert-warning");
        alert.find("#panel-msg").css("display", "none");
    };

    var _elevationChartCollapse = function () {
        var self = this;

        if (self.track.$chartCollapse.parent().hasClass('collapsed')) {
            self.track.$chartCollapse.parent().toggleClass('collapsed');

            if (self.track.$chartCollapse.parent().hasClass('collapsed'))
                self.track.$chartCollapse.attr('title', self.getLocaleString("geo.trk.chart.exp"));
            else self.track.$chartCollapse.attr('title', self.getLocaleString("geo.trk.chart.col"));
        }
    };

    ctlProto.getLayer = function () {
        var self = this;
        var done = new $.Deferred();
        if (self.layer == undefined) {
            $.when(self.map.addLayer({
                id: TC.getUID(),
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                title: 'Posicionar',
            })).then(function (layer) {
                self.layer = layer;
                self.layer.map.putLayerOnTop(self.layer);
                done.resolve(self.layer);
            });
        } else done.resolve(self.layer);
        return done;
    };

    ctlProto.updateCoordsCtrl = function (position) {
        var self = this;

        if (self.showCoords.coordsCtl && position) {
            self.showCoords.coordsCtl.x = position[0];
            self.showCoords.coordsCtl.y = position[1];
            self.showCoords.coordsCtl.xy = [self.showCoords.coordsCtl.x, self.showCoords.coordsCtl.y];

            self.showCoords.coordsCtl.update();
        }
    };

    ctlProto.getCoords = function () {
        var self = this;
        if (self.showCoords.$button.hasClass(self.Const.Classes.ACTIVE)) {

            // si hay visible un popup, establecemos la posición de la cruz en el punto en el cual se ha abierto el popup
            var popup = self.map.getControlsByClass(TC.control.Popup);
            if (popup && popup.length > 0 && popup[0].isVisible()) {
                self.coordsToPopup(popup[0]);
            }
            else { // si no hay popup, calculamos el centro del mapa                
                self.updateCoordsCtrl([(self.map.getExtent()[0] + self.map.getExtent()[2]) / 2, (self.map.getExtent()[1] + self.map.getExtent()[3]) / 2]);

                self.coordsToClick.call(self, { coordinate: self.showCoords.coordsCtl.xy });
            }
        }
    };

    ctlProto.coordsToPopup = function (popup) {
        var self = this;

        if (popup) {
            self.updateCoordsCtrl(popup.wrap.popup.getPosition());
        }
    };

    // Establece la posición de la cruz en la posición recibida
    ctlProto.coordsToClick = function (e) {
        var self = this;

        self.updateCoordsCtrl(e.coordinate);
        self.coordsMarkerAdd(e.coordinate);
    };

    ctlProto.coordsMarkerAdd = function (position) {
        var self = this;

        if (!self.currentCoordsMarker) {
            $.when(self.getLayer()).then(function (layer) {
                if (layer) {
                    $.when(layer.addMarker(position, { title: 'Coord', cssClass: TC.Consts.classes.POINT, anchor: [0.5, 0.5] }))
                        .then(function (marker) {
                            self.currentCoordsMarker = marker;
                        });
                }
            });
        } else {
            self.currentCoordsMarker.setCoords(position);
        }
    };

    ctlProto.activateCoords = function () {
        var self = this;

        self.showCoords.$button.toggleClass(self.Const.Classes.ACTIVE);
        self.$toolsPanel.addClass('right-collapsed');

        self.getCoords();

        self.wrap.coordsActivate();
    };

    ctlProto.cleanCoordsPointer = function () {
        var self = this;

        delete self.currentCoordsMarker;

        $.when(self.getLayer()).then(function (layer) {
            if (layer)
                layer.clearFeatures();
        });
    };

    ctlProto.deactivateCoords = function () {
        var self = this;

        self.showCoords.$button.removeClass(self.Const.Classes.ACTIVE);

        if (self.showCoords.coordsCtl)
            self.showCoords.coordsCtl.clear();

        self.wrap.coordsDeactivate();

        self.cleanCoordsPointer();

        return true;
    };


    ctlProto.activateGPS = function () {
        var self = this;

        self.gps.$button.toggleClass(self.Const.Classes.ACTIVE);
        self.$toolsPanel.addClass('right-collapsed');

        $.when(self.getLayer()).then(function (layer) {

            self.currentPositionWaiting = self.getLoadingIndicator().addWait();

            if (navigator.geolocation) {
                var options = { timeout: 60000 };

                var watch = function (data) {
                    data = data.coords;
                    var projectedPosition = TC.Util.reproject([data.longitude, data.latitude], 'EPSG:4326', self.map.crs);

                    self.getLoadingIndicator().removeWait(self.currentPositionWaiting);
                    if (layer)
                        layer.clearFeatures();

                    // desde el control de búsquedas
                    var insideLimit = function (point) {
                        var getIntersectsBounds = function (extent, point) {
                            return point[0] >= extent[0] && point[0] <= extent[2] && point[1] >= extent[1] && point[1] <= extent[3];
                        };

                        if (getIntersectsBounds(self.map.options.maxExtent, point)) {
                            return true;
                        }

                        return false;
                    };

                    if (insideLimit(projectedPosition)) {
                        $.when(
                            layer.addCircle([projectedPosition, data.accuracy]),
                            layer.addMarker(projectedPosition, { title: 'GPS', cssClass: TC.Consts.classes.POINT, anchor: [0.5, 0.5] })
                        ).then(function (circle, point) {
                            self.gps.accuracyCircle = circle;
                            self.gps.geoPosition = point;

                            self.map.zoomToFeatures(self.layer.features, { animate: false });
                            setTimeout(function () { self.wrap.pulsate(circle); }, 100);
                        });
                    }
                    else TC.alert(self.getLocaleString("geo.error.out"));
                };

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (data) {
                        watch(data);
                        self.currentPosition = navigator.geolocation.watchPosition(watch, self.onGeolocateError.bind(self), options);
                    }, self.onGeolocateError.bind(self));

                } else {
                    alert('not supported');
                }

            } else {
                self.onGeolocateError();
            }           
        });
    };

    ctlProto.deactivateGPS = function () {
        var self = this;

        // eliminamos el flag que nos indica cuándo animar
        delete self.wrap.pulsated;

        self.wrap.deactivateCurrentPosition();

        if (navigator.geolocation && self.currentPosition) {
            navigator.geolocation.clearWatch(self.currentPosition);
        }

        $.when(self.getLayer()).then(function (layer) {
            if (layer)
                layer.clearFeatures();
        });

        self.gps.$button.removeClass(self.Const.Classes.ACTIVE);

        if (self.currentPositionWaiting)
            self.getLoadingIndicator().removeWait(self.currentPositionWaiting);

        return true;
    };


    var duringTrackingToolsPanel = function () {
        var self = this;

        if (self.track.$trackToolPanelOpened.hasClass(self.Const.Classes.CLOSED))
            self.$toolsPanel.addClass('right-collapsed');
    };
    var _tracking = function () {
        var self = this;

        self.track.$button.toggleClass(self.Const.Classes.ACTIVE);
        duringTrackingToolsPanel.call(self);

        //$('.tc-ctl-geolocation-track-mng').show();
        $(self.track.htmlMarker).show();

        self.$events.on(self.Const.Event.POSITIONCHANGE, function (d) {

            self.currentPoint = d.pd;

            var html = [
                'Posición: ' + d.pd.position[0] + ', ' + d.pd.position[1],
                'Exactitud: ' + (d.pd.accuracy || ''),
                //'Orientación: ' + (d.pd.heading ? d.pd.heading + '&deg;' : ''),
                'Velocidad: ' + (d.pd.speed ? d.pd.speed + ' km/h' : '')
                /*, 'Delta: ' + d.pd.delta + 'ms'*/
            ].join('<br />');

            self.track.$info.html(html);

            if (!self.track.$infoOnMap) {
                self.track.$infoOnMap = self.track.$info.appendTo(self.map._$div);
                self.track.$infoOnMap.show();
            }

            self.track.$trackName.removeAttr('disabled');
            self.track.$trackSave.removeAttr('disabled');

            self.track.$trackWPT.removeAttr('disabled');
            self.track.$trackAdd.removeAttr('disabled');

            // cada vez que se registra una nueva posición almacenamos en sessionStorage
            TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, self.wrap.toGeoJSON());
        });
        self.$events.on(self.Const.Event.STATEUPDATED, function (data) {
            //$(self.track.htmlMarker).attr('src', data.moving ? 'layout/idena/img/geo-marker-heading.png' : 'layout/idena/img/geo-marker.png');
        });

        self.clear();

        self.wrap.setTracking(true);
    };

    ctlProto.activateTracking = function () {
        var self = this;

        self.clear();

        self.sessionTracking = TC.Util.storage.getSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP);
        if (self.sessionTracking) {
            TC.Util.showModal('#continue-track', 455, 100);
        } else _tracking.call(self);
    };

    ctlProto.deactivateTracking = function () {
        var self = this;

        var _deactivateTracking = function () {
            self.wrap.setTracking(false);

            $(self.track.htmlMarker).hide();

            self.$events.off(self.Const.Event.POSITIONCHANGE);
            self.$events.off(self.Const.Event.STATEUPDATED);

            //$('.tc-ctl-geolocation-track-mng').hide();

            self.track.$button.removeClass(self.Const.Classes.ACTIVE);

            if (self.track.$infoOnMap) {
                self.track.$infoOnMap.remove();
                delete self.track.$infoOnMap;
            }

            self.track.$trackName.val('');
            self.track.$trackName.attr('disabled', 'disabled');
            self.track.$trackSave.attr('disabled', 'disabled');

            self.track.$trackWPT.val('');
            self.track.$trackWPT.attr('disabled', 'disabled');
            self.track.$trackAdd.attr('disabled', 'disabled');

            self.clear();

            self.pause.paused = undefined;

            return true;
        };

        if (self.wrap.hasCoordinates()) {
            TC.alert(self.getLocaleString("geo.trk.deactivate.alert"));
            return _deactivateTracking();
        } else return _deactivateTracking();
    };

    ctlProto.upload = function (evt) {
        var self = this;

        var def = new $.Deferred();

        var files = evt.target.files; // FileList object
        if (files && files.length > 0) {
            self.import.fileName = files[0].name.split('.').shift();
            var ext = files[0].name.split('.').pop();

            if (ext.toUpperCase() == 'GPX' || ext.toUpperCase() == 'KML') {

                var reader = new FileReader();
                reader.onload = function () {
                    def.resolve({
                        type: ext,
                        base64data: reader.result
                    });
                };
                reader.onerror = function () {
                    TC.alert(self.getLocaleString("geo.trk.upload.alert"));
                    def.reject();
                };

                reader.readAsDataURL(files[0]);

            } else {
                TC.alert(self.getLocaleString("geo.trk.upload.error"));
                def.reject();
            }
        } else {
            def.reject();
        }

        return def;
    };

    /* Obtengo los tracks desde localForage */
    ctlProto.getStoredTracks = function () {
        var self = this;
        var done = new $.Deferred();

        localforage.getItem(self.Const.LocalStorageKey.TRACKING)
            .then(function (strTracks) {
                self.availableTracks = {};

                if (strTracks && strTracks.length > 0)
                    self.availableTracks = JSON.parse(strTracks);

                done.resolve(self.availableTracks);
            });

        return done;
    };

    /* Almaceno los tracks mediante localForage, actualizo la vble availableTracks y actualizo la lista de tracks */
    ctlProto.setStoredTracks = function (tracks) {
        var self = this;
        var done = new $.Deferred();

        localforage.setItem(self.Const.LocalStorageKey.TRACKING, JSON.stringify(tracks)).then(function () {
            self.getStoredTracks().then(function () {
                self.bindTracks();

                done.resolve();
            });
        });

        return done;
    };

    /* Obtengo los tracks desde vble local */
    ctlProto.getAvailableTracks = function () {
        var self = this;
        var done = new $.Deferred();

        if (!self.availableTracks) {
            self.getStoredTracks().then(function (availableTracks) {
                done.resolve(availableTracks);
            });
        }
        else done.resolve(self.availableTracks);

        return done;
    };

    ctlProto.bindTracks = function () {
        var self = this;

        self.track.$trackList.find('li:not([class^="tc-ctl-geolocation-track-available-empty"])').remove();
        self.track.$trackList.find('li[class^="tc-ctl-geolocation-track-available-empty"]').hide();

        self.getAvailableTracks().then(function (tracks) {

            if (_isEmpty(tracks)) {
                self.track.$trackList.find('li[class^="tc-ctl-geolocation-track-available-empty"]').show();
                self.track.$trackSearch.attr('disabled', 'disabled');
            }
            else {
                for (var t in tracks) {
                    self.getRenderedHtml(self.CLASS + '-track-node', { id: t, name: tracks[t].name ? tracks[t].name.trim() : '' }, function (html) {
                        self.track.$trackList.append(html);
                    });
                }

                self.track.$trackSearch.removeAttr('disabled');
            }
        });
    };

    ctlProto.simulateTrack = function (li) {
        var self = this;

        self.simulate_speed = $(li).find('option:selected').val();

        duringTrackingToolsPanel.call(self);

        $(self.track.htmlMarker).show();

        self.drawTrack(li);

        self.wrap.simulateTrack();

        self.$events.on(self.Const.Event.POSITIONCHANGE, function (d) {

            self.currentPoint = d.pd;

            var html = [
                'Posición: ' + d.pd.position[0] + ', ' + d.pd.position[1]
                /*,
                'Exactitud: ' + d.pd.accuracy,
                'Orientación: ' + d.pd.heading + '&deg;',
                'Velocidad: ' + d.pd.speed + ' km/h'
                /*,            'Delta: ' + d.pd.delta + 'ms'*/
            ].join('<br />');

            self.track.$info.html(html);

            if (!self.track.$infoOnMap) {
                self.track.$infoOnMap = self.track.$info.appendTo(self.map._$div);
                self.track.$infoOnMap.show();
            }

            self.track.$trackName.attr('disabled', 'disabled');
            self.track.$trackSave.attr('disabled', 'disabled');

            self.track.$trackWPT.attr('disabled', 'disabled');
            self.track.$trackAdd.attr('disabled', 'disabled');
        });
        self.$events.on(self.Const.Event.STATEUPDATED, function (data) {
            //$(self.track.htmlMarker).attr('src', data.moving ? 'layout/idena/img/geo-marker-heading.png' : 'layout/idena/img/geo-marker.png');
        });
    };

    var trackSnapping = function (e, data) {
        var self = this;

        //if (!self.tracking) self.tracking = {};

        //if (self.tracking.snapPoint) {
        //    self.layer.removeFeature(self.tracking.snapPoint);
        //    delete self.tracking.snapPoint;
        //}

        //if (self.tracking.snapLine) {
        //    self.layer.removeFeature(self.tracking.snapLine);
        //    delete self.tracking.snapLine;
        //}

        //self.layer.addMarker([e.snapData.point[0], e.snapData.point[1]]).then(function (f) {
        //    self.tracking.snapPoint = f;
        //});
        //self.layer.addPolyline(e.snapData.line).then(function (f) {
        //    self.tracking.snapLine = f;
        //});
    };
    ctlProto.drawTrack = function (li) {
        var self = this;

        duringTrackingToolsPanel.call(self);

        self.setSelectedTrack(li);

        self.$events.on(self.Const.Event.TRACKSNAPPING, trackSnapping);

        self.drawTrackingData(li);
        self.elevationTrack(li);
    };

    ctlProto.elevationTrack = function (li) {
        var self = this;

        var time = {};
        var km = 0;
        var coordinates = [];

        duringTrackingToolsPanel.call(self);

        if (self.track.elevationChart)
            self.track.elevationChart = self.track.elevationChart.destroy();

        var getChartData = function (li) {
            var done = new $.Deferred();
            var x, ele;
            x = [];
            ele = [];

            self.getTrackingData(li).then(function (geoJSON) {
                if (geoJSON) {
                    var f = (new ol.format.GeoJSON()).readFeatures(geoJSON);
                    for (var i = 0; i < f.length; i++) {
                        var geom = f[i].getGeometry();

                        var getDistance = function () {
                            var distance = geom.getLength();
                            return parseFloat((distance / 1000).toFixed(2));
                        };

                        var getTime = function () {
                            if (geom.getLayout() == ol.geom.GeometryLayout.XYZM) {
                                var diff = geom.getLastCoordinate()[3] - geom.getFirstCoordinate()[3];
                                return {
                                    s: Math.floor((diff / 1000) % 60),
                                    m: Math.floor(((diff / (1000 * 60)) % 60)),
                                    h: Math.floor(((diff / (1000 * 60 * 60)) % 24))
                                };
                            }

                            return null;
                        };

                        switch (geom.getType().toLowerCase()) {
                            case 'point':
                                continue;
                                break;
                            case 'linestring':
                                time = getTime(geom);
                                km = getDistance(geom);
                                coordinates = coordinates.concat(geom.getCoordinates());
                                break;
                            case 'multilinestring':
                                var _time;
                                var ls = geom.getLineStrings();
                                for (var i = 0; i < ls.length; i++) {
                                    km = km + getDistance(ls[i]);

                                    if (ls[i].getLayout() == ol.geom.GeometryLayout.XYZM)
                                        _time = _time + (ls[i].getLastCoordinate()[3] - ls[i].getFirstCoordinate()[3]);

                                    coordinates = coordinates.concat(ls[i].getCoordinates());
                                }

                                if (_time)
                                    time = getTime(_time);
                                break;
                            default:
                                return null;
                                break;
                        }

                        /* x */
                        for (var i = 0; i < coordinates.length; i++) {
                            x.push(km * i / coordinates.length);
                        }


                        /* ele */
                        var empty = true;
                        var y = [];
                        var minEle = 0;
                        var maxEle = 0;
                        var coords = geom.getCoordinates();
                        for (var i = 0; i < coords.length; i++) {
                            if (coords[i].length > 2) {
                                var v = Math.round(coords[i][2]);
                                if (empty && v > 0)
                                    empty = false;

                                ele.push(v);

                                if (i == 0)
                                    minEle = maxEle = v;

                                if (v < minEle)
                                    minEle = v;

                                if (v > maxEle)
                                    maxEle = v;

                            } else return done.resolve(null);
                        }
                    }
                }

                return done.resolve(!empty ? { time: time, ele: ele, x: x, miny: minEle, maxy: maxEle } : null);
            });

            return done;
        };

        getChartData(li).then(function (data) {
            if (data != null) {

                if (data.time) {
                    self.track.$chartViewChart.find('span#spentTime').removeAttr('hidden');
                    self.track.$chartViewChart.find('span#spentTime').text(("00000" + data.time.h).slice(-2) + ':' + ("00000" + data.time.m).slice(-2) + ':' + ("00000" + data.time.s).slice(-2));
                }
                else self.track.$chartViewChart.find('span#spentTime').attr('hidden', 'hidden');

                var generateChart = function () {

                    TC.loadJS(!window.c3, [TC.Consts.url.D3C3], function () {
                        c3.chart.internal.fn.getAreaBaseValue = function () {
                            return data.miny; // lowest elevation
                        };

                        self.track.elevationChart = c3.generate({
                            bindto: '#chart',
                            size: { height: (Modernizr.mq('(min-width: 50em)') ? 100 : 70), width: (Modernizr.mq('(min-width: 50em)') ? 345 : 227) },
                            onmouseout: function () {
                                $(self.track.htmlElevationMarker).hide();
                            },
                            data: { x: 'x', columns: [['x'].concat(data.x), ['Elevación'].concat(data.ele)], types: { 'Elevación': 'area-spline' }, colors: { "Elevación": '#C52737' } },
                            legend: { show: false },
                            tooltip: {
                                contents: function (d) {
                                    return self.wrap.getTooltip(coordinates, d);
                                }
                            },
                            axis: { x: { tick: { count: 5, format: function (d) { return Math.round(d) + ' km'; } } }, y: { max: data.maxy, min: data.miny, tick: { count: 2, format: function (d) { return Math.round(d) + ' m'; } } } }
                        });
                    });
                };
                generateChart();

                _elevationChartCollapse.call(self);
                self.track.$chartViewChart.find('p').attr('hidden', 'hidden');
            }
            else {
                self.track.$chartViewChart.find('p').removeAttr('hidden');
            }

            self.track.$trackChartPanel.show();

            if (!self.track.$trackChartPanelOnMap)
                self.track.$trackChartPanelOnMap = self.track.$trackChartPanel.appendTo(self.map._$div);
        });
    };

    ctlProto.clear = function () {
        var self = this;

        // limpiar mapa
        self.wrap.clear();

        self.$events.off(self.Const.Event.TRACKSNAPPING, trackSnapping);

        // gráfico perfil de elevación
        self.track.$trackChartPanel.hide();
        delete self.track.$trackChartPanelOnMap;

        // overlay de la simulación
        self.wrap.simulateTrackEnd();

        // eliminamos la selección en la lista de tracks
        self.track.$trackList.find('li').removeClass(self.Const.Classes.SELECTEDTRACK);

    };

    ctlProto.saveTrack = function () {
        var self = this;
        var done = new $.Deferred();

        var _save = function () {
            var wait;
            wait = self.getLoadingIndicator().addWait();

            var trackName = self.import.fileName || self.track.$trackName.val().trim();

            var tracks = self.availableTracks;
            if (!tracks) tracks = {};

            var uid = TC.getUID();
            while (tracks[uid])
                uid = TC.getUID();

            if (self.import.fileName)
                self.import.uid = uid;

            tracks[uid] = {
                name: trackName,
                data: self.wrap.toGeoJSON(true)
            };

            var clean = function (wait) {
                self.track.$trackName.val('');
                self.track.$trackName.attr('disabled', 'disabled');
                self.track.$trackSave.attr('disabled', 'disabled');

                self.track.$trackWPT.val('');
                self.track.$trackWPT.attr('disabled', 'disabled');
                self.track.$trackAdd.attr('disabled', 'disabled');

                self.getLoadingIndicator().removeWait(wait);

                duringTrackingToolsPanel.call(self);
            };

            try {
                self.setStoredTracks(tracks).then(function () {
                    TC.alert(self.saveMessage || self.getLocaleString("geo.trk.save.alert"));
                    if (self.saveMessage)
                        delete self.saveMessage;

                    // NO eliminamos el track de session, ya que al activar la herramienta tiene la opción de iniciar un nuevo track
                    // delete self.parent.sessionTracking;
                    // TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, undefined);


                    clean(wait);
                    done.resolve();
                });

            } catch (error) {
                TC.alert(self.getLocaleString("geo.error.savelocalstorage") + ': ' + error.message);
                clean(wait);
                done.reject();
            }
        };

        if (self.import.fileName)
            _save();
        else if (self.track.$trackName.val().trim().length == 0) {
            self.track.$trackName.val(new Date().toLocaleString());
            _save();
        }
        else {
            _save();
        }

        return done;
    };

    ctlProto.addWaypoint = function () {
        var self = this;

        if (self.track.$trackWPT.val().trim().length == 0) TC.alert(self.getLocaleString("geo.trk.wyp.save.alert"));
        else {
            var wait;
            wait = self.getLoadingIndicator().addWait();

            duringTrackingToolsPanel.call(self);

            var waypointName = self.track.$trackWPT.val().trim();

            self.wrap.addWaypoint(self.currentPoint.position, {
                name: waypointName.trim(),
                ele: self.currentPoint.heading,
                time: new Date().getTime() // GLS: lo quito ya que hemos actualizado la función que gestiona la fechas para la exportación a GPX - espera la fecha en segundos -> / 1000 // para la exportación a GPX - espera la fecha en segundos
            });

            self.track.$trackWPT.val('');
            self.track.$trackWPT.attr('disabled', 'disabled');
            self.track.$trackAdd.attr('disabled', 'disabled');

            // cada vez que se añade un waypoint almacenamos en sessionStorage
            TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, self.wrap.toGeoJSON());

            self.getLoadingIndicator().removeWait(wait);

        }
    };

    ctlProto.editTrackName = function (trackId, newName) {
        var self = this;

        self.getAvailableTracks().then(function (tracks) {
            if (tracks) {
                if (tracks[trackId]) {
                    tracks[trackId].name = newName;

                    self.setStoredTracks(tracks);
                }
            }
        });
    };

    ctlProto.removeTrack = function (li) {
        var self = this;

        self.getAvailableTracks().then(function (tracks) {
            if (tracks) {
                var dataId = $(li).attr('data-id');
                if (tracks[dataId]) {

                    TC.confirm(self.getLocaleString("geo.trk.delete.alert"), function () {
                        delete tracks[dataId];

                        self.clear();

                        self.setStoredTracks(tracks);
                    }, function () { });
                }
            }
        });
    };

    ctlProto.setSelectedTrack = function (li) {
        var self = this;

        self.track.$trackList.find('li').removeClass(self.Const.Classes.SELECTEDTRACK);

        li.addClass(self.Const.Classes.SELECTEDTRACK);

        $(li).find('a#draw').attr('title', self.getLocaleString("tr.lst.clear"));
    };

    ctlProto.getSelectedTrack = function () {
        var self = this;

        return self.track.$trackList.find('li.' + self.Const.Classes.SELECTEDTRACK);
    };

    ctlProto.drawTrackingData = function (li) {
        var self = this;

        self.wrap.clear();

        self.getTrackingData(li).then(function (data) {
            if (data)
                self.wrap.drawTrackingData(data);
        });
    };

    ctlProto.getTrackingData = function (li) {
        var self = this;
        var _li = li;
        var done = new $.Deferred();

        self.getAvailableTracks().then(function (tracks) {
            if (tracks) {
                var dataId = $(_li).attr('data-id');
                if (tracks[dataId]) {
                    return done.resolve(tracks[dataId].data);
                }
            }

            return done.resolve();
        });


        return done;
    };

    ctlProto.export = function (type, li) {
        var self = this;

        return self.wrap.export(type, li);
    };

    ctlProto.import = function (evt) {
        var self = this;

        var wait;
        wait = self.getLoadingIndicator().addWait();


        $.when(self.upload(evt)).then(function (data) {
            if (data) {
                var base64encodedData = 'data:' + self.Const.MimeMap[data.type.toUpperCase()] +
                                        ';base64,' + encodeURI(data.base64data.split(',').pop());

                self.wrap.import(wait, base64encodedData, data.type);
                self.track.$trackImportFile.replaceWith(self.track.$trackImportFile.val('').clone(true));
            }

        }, function (error) {
            TC.alert(self.getLocaleString("geo.trk.upload.error2"));
            self.getLoadingIndicator().removeWait(wait);
        });
    };

    ctlProto.getLoadingIndicator = function () {
        var self = this;

        if (!self.loading) {
            self.loading = self.map.getControlsByClass(TC.control.LoadingIndicator);
            if (self.loading && self.loading.length > 0)
                self.loading = self.loading[0];
        }

        return self.loading;
    };

    ctlProto.onGeolocateError = function (error) {
        var self = this;

        if (navigator.geolocation) {
            navigator.geolocation.clearWatch(self.currentPosition);
        }

        if (self.currentPositionWaiting)
            self.getLoadingIndicator().removeWait(self.currentPositionWaiting);

        switch (error.code) {
            case error.PERMISSION_DENIED:
                TC.alert(self.getLocaleString("geo.error.permission_denied"));
                break;
            case error.POSITION_UNAVAILABLE:
                TC.alert(self.getLocaleString("geo.error.position_unavailable"));
                break;
            case error.TIMEOUT:
                TC.alert(self.getLocaleString("geo.error.timeout"));
                break;
            default:
                TC.alert(self.getLocaleString("geo.error.default"));
                break;
        }
    };

    var _isEmpty = function (obj) {
        return Object.keys(obj).length === 0 && JSON.stringify(obj) === JSON.stringify({});
    };
})();
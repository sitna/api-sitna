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
            SELECTEDTRACK: 'selectedTrack',
            DRAWACTIVATED: 'draw-activated',
            SIMULATIONACTIVATED: 'simulation-activated',
        },
        Selector: {
            SIMULATE: '.tc-btn-simulate',
            DRAW: '.tc-btn-draw',
            EDIT: '.tc-btn-edit',
            DELETE: '.tc-btn-delete',
            SAVE: '.tc-btn-save',
            CANCEL: '.tc-btn-cancel',
            EXPORT_GPX: '.tc-btn-export-gpx',
            EXPORT_KML: '.tc-btn-export-kml',
            STOP: '.tc-btn-stop',
            PAUSE: '.tc-btn-pause',
            SPEED: '.tc-sel-speed'
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
            TRACKSNAPPING: 'tracksnapping.tc.geolocation',
            DRAWTRACK: 'drawtrack.tc.geolocation',
            CLEARTRACK: 'cleartrack.tc.geolocation',
            IMPORTEDTRACK: 'importedtrack.tc.geolocation'
        },
        MimeMap: {
            KML: 'application/vnd.google-earth.kml+xml',
            GPX: 'application/gpx+xml'
        },
        Tabs: {
            GPS: "gps"
        },
        Layers: {
            GPS: "gps",
            TRACK: "track",
            TRACKING: "tracking"
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
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "geo" }).w(" <span class=\"tc-beta\">beta</span></h2><div class=\"tc-ctl-geolocation-content\"> <div class=\"tc-ctl-geolocation-track\"><div class=\"tc-ctl-geolocation-track-snap-info\"></div><div class=\"tc-ctl-geolocation-info-track\" style=\"display:none;\"></div><!-- img se insertan en el div del mapa--><img id=\"tc-ctl-geolocation-track-marker\" src=\"data:image/png;base64,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\" style=\"display: none;\" /><img id=\"tc-ctl-geolocation-track-elevation-marker\" src=\"data:image/png;base64,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\" style=\"display: none;\" /> <div class=\"tc-ctl-geolocation-track-panel-block\"><input id=\"tc-ctl-geolocation-track-panel-opened\" type=\"checkbox\" checked/><label for=\"tc-ctl-geolocation-track-panel-opened\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.1" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.2" }).w("</label><i class=\"tc-ctl-geolocation-track-panel-help icon-question-sign\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.3" }).w("\"></i></div><div class=\"tc-ctl-geolocation-track-mng\"><div class=\"tc-ctl-geolocation-select\"><form><label class=\"tc-ctl-geolocation-btn-gps\" title=\"").h("i18n", ctx, {}, { "$key": " geo.gps" }).w("\"><input type=\"radio\" name=\"mode\" value=\"gps\" checked=\"checked\" /><span>").h("i18n", ctx, {}, { "$key": "geo.gps" }).w("</span></label><label class=\"tc-ctl-geolocation-btn-tracks\" title=\"").h("i18n", ctx, {}, { "$key": "geo.tracks.title" }).w("\"><input type=\"radio\" name=\"mode\" value=\"track-available\" /><span>").h("i18n", ctx, {}, { "$key": "geo.tracks" }).w("</span></label><label class=\"tc-ctl-geolocation-btn-track\" title=\"").h("i18n", ctx, {}, { "$key": "geo.track.title" }).w("\"><input type=\"radio\" name=\"mode\" value=\"tracks\" /><span>").h("i18n", ctx, {}, { "$key": "geo.track" }).w("</span></label></form></div> <div class=\"tc-ctl-geolocation-gps tc-ctl-geolocation-panel\"> <div class=\"tc-ctl-geolocation-locate\"><button class=\"tc-button tc-icon-button tc-ctl-geolocation-locate-show\" title=\"").h("i18n", ctx, {}, { "$key": "geo.mylocation.show.title" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.mylocation.show" }).w("</button><button class=\"tc-button tc-icon-button tc-ctl-geolocation-locate-hide tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "geo.mylocation.hide.title" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.mylocation.hide" }).w("</button></div></div><div class=\"tc-ctl-geolocation-track-available tc-ctl-geolocation-track-cnt tc-ctl-geolocation-panel tc-hidden\"><i class=\"tc-ctl-geolocation-track-search-icon\"></i><input id=\"tc-ctl-geolocation-track-available-srch\" type=\"search\" list=\"tc-ctl-geolocation-track-available-lst\" class=\"tc-ctl-geolocation-track-available-srch tc-textbox\" placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.filter.plhr" }).w("\" maxlength=\"200\" /> <ol id=\"tc-ctl-geolocation-track-available-lst\" class=\"tc-ctl-geolocation-track-available-lst\"><li class=\"tc-ctl-geolocation-track-available-empty\"><span>").h("i18n", ctx, {}, { "$key": "geo.noTracks" }).w("</span></li><li class=\"tc-ctl-geolocation-track-not\" hidden><span>").h("i18n", ctx, {}, { "$key": "noMatches" }).w("</span></li></ol><div class=\"tc-ctl-geolocation-track-cnt\"><input name=\"uploaded-file\" id=\"uploaded-file\" type=\"file\" class=\"tc-ctl-geolocation-track-import tc-button\" accept=\".gpx,.kml\" disabled /><label class=\"tc-button tc-icon-button\" for=\"uploaded-file\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.import.upload" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.import.lbl" }).w("</label></div></div><div class=\"tc-ctl-geolocation-tracks tc-ctl-geolocation-panel tc-hidden\"> <div class=\"tc-alert alert-warning tc-hidden\"><p id=\"panel-msg\">").h("i18n", ctx, {}, { "$key": "geo.trk.panel.1" }).w(" <ul><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.2" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.3" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.4" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.5" }).w("</li></ul></p></div> <div class=\"tc-ctl-geolocation-track-ui\"> <button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-ui-activate\" title=\"").h("i18n", ctx, {}, { "$key": "geo.track.activate.title" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.track.activate" }).w("</button><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-ui-deactivate tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "geo.track.deactivate.title" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.track.deactivate" }).w("</button></div><div class=\"tc-ctl-geolocation-track-current tc-ctl-geolocation-track-cnt\"><input type=\"text\" class=\"tc-ctl-geolocation-track-title tc-textbox\" disabled placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.trk.name.plhr" }).w("\" maxlength=\"200\" /><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-save\" disabled title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.name.save" }).w("\"></button><input type=\"text\" class=\"tc-ctl-geolocation-track-waypoint tc-textbox\" disabled placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.trk.wyp.plhr" }).w("\" maxlength=\"200\" /><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-add-wpt\" disabled title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.wyp.save" }).w("\"></button></div></div></div></div></div><div id=\"continue-track\" class=\"tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "geo.track" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><button id=\"tc-ctl-geolocation-track-continue\" class=\"tc-button\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.cnt" }).w(" </button><button id=\"tc-ctl-geolocation-track-new\" class=\"tc-button\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.new" }).w(" </button> <button class=\"tc-button tc-modal-close\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.cancel" }).w(" </button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-track-node'] = function () { dust.register(ctlProto.CLASS + '-track-node', body_0); function body_0(chk, ctx) { return chk.w("<li data-id=\"").f(ctx.get(["id"], false), ctx, "h").w("\"><span title=\"").f(ctx.get(["name"], false), ctx, "h").w("\">").f(ctx.get(["name"], false), ctx, "h").w("</span><input class=\"tc-textbox\" type=\"text\" hidden value=\"").f(ctx.get(["name"], false), ctx, "h").w("\" /><button class=\"tc-btn-draw\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.draw" }).w("\"></button><button class=\"tc-btn-simulate\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.simulate" }).w("\"></button><button hidden class=\"tc-btn-stop\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.stop" }).w("\"></button><button class=\"tc-btn-edit\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.edit" }).w("\"></button><button hidden class=\"tc-btn-pause\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.pause" }).w("\"></button> <button hidden class=\"tc-btn-save\" title=\"").h("i18n", ctx, {}, { "$key": "save" }).w("\"></button><button hidden class=\"tc-btn-cancel\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.cancel" }).w("\"></button><button class=\"tc-btn-delete\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.delete" }).w("\"></button><button class=\"tc-btn-export-gpx\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.exportGPX" }).w("\"></button><button class=\"tc-btn-export-kml\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.exportKML" }).w("\"></button><select class=\"tc-combo tc-sel-speed\" hidden title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.velocity" }).w("\"><option value=\"0.5\">x2</option><option value=\"0.25\">x4</option><option value=\"0.125\">x8</option> </select></li>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-track-snapping-node'] = function () { dust.register(ctlProto.CLASS + '-track-snapping-node', body_0); function body_0(chk, ctx) { return chk.w("<p>").h("i18n", ctx, {}, { "$key": "geo.trk.snapping" }).w("</p><ul>").x(ctx.get(["n"], false), ctx, { "block": body_1 }, {}).w("<li> X - ").f(ctx.get(["x"], false), ctx, "h").w(" </li><li> Y - ").f(ctx.get(["y"], false), ctx, "h").w(" </li>").x(ctx.get(["z"], false), ctx, { "block": body_2 }, {}).x(ctx.get(["m"], false), ctx, { "block": body_3 }, {}).w("</ul>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li> ").h("i18n", ctx, {}, { "$key": "geo.trk.snapping.name" }).w(" - ").f(ctx.get(["n"], false), ctx, "h").w(" </li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<li> Z - ").f(ctx.get(["z"], false), ctx, "h").w(" </li>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<li> M - ").f(ctx.get(["m"], false), ctx, "h").w(" </li>"); } body_3.__dustBody = !0; return body_0 };
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
                title: 'Posicionar.GPS',
            })).then(function (layer) {
                self.layerGPS = layer;
            });
            $.when(map.addLayer({
                id: TC.getUID(),
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                title: 'Posicionar.Track',
            })).then(function (layer) {
                self.layerTrack = layer;
            });
            $.when(map.addLayer({
                id: TC.getUID(),
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                title: 'Posicionar.Tracking',
            })).then(function (layer) {
                self.layerTracking = layer;
            });
        });
    };

    ctlProto.renderData = function (data, callback) {
        var self = this;
        var sel = self.Const.Selector;

        TC.Control.prototype.renderData.call(self, data, function () {

            var $options = self._$div.find('.' + self.CLASS + '-panel');
            self._$div.find('.tc-ctl-geolocation-select span').on(TC.Consts.event.CLICK, function (e) {
                var $cb = $(this).closest('label').find('input[type=radio][name=mode]');

                var newFormat = $cb.val();
                $options.removeClass(TC.Consts.classes.HIDDEN);
                $options.not('.tc-ctl-geolocation-' + newFormat).addClass(TC.Consts.classes.HIDDEN);
            });

            self.$toolsPanel = $('.tools-panel');

            self.gps = {};
            self.gps.$activateButton = self._$div.find('.tc-ctl-geolocation-locate-show');
            self.gps.$deactivateButton = self._$div.find('.tc-ctl-geolocation-locate-hide');

            self.track = {};
            self.track.$activateButton = self._$div.find('.tc-ctl-geolocation-track-ui-activate');
            self.track.$deactivateButton = self._$div.find('.tc-ctl-geolocation-track-ui-deactivate');
            self.track.$info = self._$div.find('.tc-ctl-geolocation-info-track');
            self.track.htmlMarker = document.getElementById('tc-ctl-geolocation-track-marker');
            self.track.htmlTrackingMarker = document.getElementById('tc-ctl-geolocation-tracking-marker');


            self.track.$trackChartPanel = self._$div.find('#track-chart');
            self.track.$trackChart = self._$div.find('#chart');
            self.track.htmlElevationMarker = document.getElementById('tc-ctl-geolocation-track-elevation-marker');

            self.track.$trackSearch = self._$div.find('.tc-ctl-geolocation-track-available-srch');
            self.track.$trackList = self._$div.find('.tc-ctl-geolocation-track-available-lst');

            self.track.$trackToolPanelOpened = self._$div.find('#tc-ctl-geolocation-track-panel-opened');

            self._$div.find('.tc-ctl-geolocation-track-panel-help').click(function () {
                _showAlerMsg.call(self);
            });

            self.track.$trackName = self._$div.find('.tc-ctl-geolocation-track-title');
            self.track.$trackSave = self._$div.find('.tc-ctl-geolocation-track-save');

            self.track.$trackWPT = self._$div.find('.tc-ctl-geolocation-track-waypoint');
            self.track.$trackAdd = self._$div.find('.tc-ctl-geolocation-track-add-wpt');

            self.track.$trackContinue = self._$div.find('#tc-ctl-geolocation-track-continue');
            self.track.$trackRenew = self._$div.find('#tc-ctl-geolocation-track-new');
            self.track.$trackClose = self._$div.find('#continue-track button.tc-modal-close');
            self.track.$trackAddSegment = self._$div.find('#tc-ctl-geolocation-track-segment');

            self.track.$trackImportFile = self._$div.find('.tc-ctl-geolocation-track-import');


            if (!TC.Util.detectMouse()) {
                if (Modernizr.mq('screen and (max-height: 50em) and (max-width: 50em)'))
                    self.track.$trackToolPanelOpened.prop('checked', false);;
            }

            if (window.File && window.FileReader && window.FileList && window.Blob) {
                self.track.$trackImportFile.removeAttr('disabled');
                self.track.fnImport = self.import.bind(self);
                self.track.$trackImportFile.on('change', self.track.fnImport);
            } else {
                console.log('no es posible la importación');
            }

            self.gps.$activateButton.on('click', function () {
                self.activateGPS();
            });

            self.gps.$deactivateButton.on('click', function () {
                    self.deactivateGPS();
            });

            self.track.$activateButton.on('click', function () {
                self.activateTracking();
                _activateTrackingBtns.call(self);

            });

            self.track.$deactivateButton.on('click', function () {
                self.deactivateTracking();
                _deactivateTrackingBtns.call(self);
            });

            self.track.$chartViewChart = self._$div.find("#track-chart");
            self.track.$chartCollapse = self._$div.find("#track-chart > span");

            var _filter = function (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                //tc-ctl-geolocation-track-available-empty
                var $li = self.track.$trackList.find('li').hide();
                var $trackLi = $li.filter('li:not([class]),li.' + self.Const.Classes.SELECTEDTRACK);

                if (searchTerm.length === 0) {
                    $trackLi.show();
                    self._$div.find('.' + self.CLASS + '-track-search-icon').css('visibility', 'visible');
                } else {
                    self._$div.find('.' + self.CLASS + '-track-search-icon').css('visibility', 'hidden');
                    var r = new RegExp(searchTerm, 'i');
                    $trackLi.each(function () {
                        var $this = $(this);
                        $this.toggle(r.test($this.children('span').text()));
                    });

                    if ($trackLi.filter(':visible').length === 0)
                        $li.filter('[class^="tc-ctl-geolocation-track-not"]').show();
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
                var editControls = [
                    sel.SIMULATE,
                    sel.DRAW,
                    sel.EDIT,
                    sel.DELETE,
                    sel.EXPORT_GPX,
                    sel.EXPORT_KML
                ];
                var simulateControls = [sel.STOP, sel.PAUSE, sel.SPEED];
                var cnt = $self.is('li') ? $self : $self.parent();

                if (simulate) {
                    for (var i = 0; i < editControls.length; i++)
                        $(cnt).find(editControls[i]).first().attr('hidden', 'hidden');

                    for (var i = 0; i < simulateControls.length; i++)
                        $(cnt).find(simulateControls[i]).first().removeAttr('hidden');
                } else {
                    for (var i = 0; i < simulateControls.length; i++) {
                        $(cnt).find(simulateControls[i]).first().attr('hidden', 'hidden');
                        if (simulateControls[i] == 'select' + sel.SPEED)
                            $(cnt).find(simulateControls[i]).val(0.5);
                    }

                    for (var i = 0; i < editControls.length; i++)
                        $(cnt).find(editControls[i]).first().removeAttr('hidden');
                }
            };
            $(document).on("click", sel.SIMULATE, function () {
                var wait = self.getLoadingIndicator().addWait();

                $.when(_loadTrack(self, this)).then(function () { //Para evitar el bloqueo de la interfaz en móviles
                    self.getLoadingIndicator().removeWait(wait)
                });
            });
            $(document).on("click", sel.DRAW, function () {
                var wait = self.getLoadingIndicator().addWait();

                $.when(_drawTrack(self, this)).then(function () {
                    self.getLoadingIndicator().removeWait(wait)
                });

            });

            self.$events.on(self.Const.Event.IMPORTEDTRACK, function (e, index) {
                var $listElement = self.track.$trackList.find('li[data-id="' + index + '"]');
                _drawTrack(self, $listElement.find(sel.DRAW));
                self.track.$trackList.animate({
                    scrollTop: index * $listElement.outerHeight()
                }, 'slow');
            });

            var _stopOtherTracks = function (self, trackLiId) {
                var trackListItems = self.track.$trackList.find('li');

                for (var i = 0; i < trackListItems.length; i++) {
                    var $listItem = $(trackListItems[i]);


                    if ($listItem && $listItem.attr('data-id') !== trackLiId) {
                        var $btnDraw = $listItem.find(sel.DRAW);
                        var $btnSimulate = $listItem.find(sel.SIMULATE);
                        var $btnPause = $listItem.find(sel.PAUSE);

                        $btnDraw.toggleClass(self.Const.Classes.DRAWACTIVATED, false);
                        $btnDraw.attr('title', self.getLocaleString("tr.lst.draw"));
                        $btnSimulate.toggleClass(self.Const.Classes.SIMULATIONACTIVATED, false);
                        $btnSimulate.attr('title', self.getLocaleString("tr.lst.simulate"));
                        $btnPause.toggleClass('play', false);
                        $btnPause.attr('title', self.getLocaleString("tr.lst.pause"));

                        self.uiSimulate(false, $listItem);
                    }
                }

                self.clear(self.Const.Layers.TRACK);
            };

            var _drawTrack = function (self, btnDraw) {
                var deferred = $.Deferred();
                var $trackLi = $(btnDraw).parent();

                setTimeout(function () {
                    if ($trackLi.hasClass(self.Const.Classes.SELECTEDTRACK)) {
                        $(btnDraw).toggleClass(self.Const.Classes.DRAWACTIVATED, false);
                        $(btnDraw).attr('title', self.getLocaleString("tr.lst.draw"));
                        self.uiSimulate(false, $(btnDraw));
                        self.clear(self.Const.Layers.TRACK);
                    }
                    else {
                        _stopOtherTracks(self, $trackLi.attr('data-id'));
                        $(btnDraw).toggleClass(self.Const.Classes.DRAWACTIVATED, true);
                        $(btnDraw).attr('title', self.getLocaleString("tr.lst.clear"));
                        self.drawTrack($trackLi);
                    }
                    deferred.resolve();
                }, 0);

                return deferred.promise();
            };

            var _loadTrack = function (self, btnSimulate) {
                var deferred = $.Deferred();

                setTimeout(function () {
                    var $trackLi = $(btnSimulate).parent();

                    _stopOtherTracks(self, $trackLi.attr('data-id'));
                    self.uiSimulate(false, self.getSelectedTrack());
                    $(this).parent().addClass(self.Const.Classes.SELECTEDTRACK);
                    self.uiSimulate(true, $(btnSimulate));

                    self.simulate_paused = false;
                    self.simulateTrack($(btnSimulate).parent());

                    deferred.resolve();
                }, 0);

                return deferred.promise();
            };

            var _edit = function (edit, $self) {
                if (edit) {
                    $self.parent().find('input').first().removeAttr('hidden');
                    $self.parent().find('span').first().attr('hidden', 'hidden');

                    $self.parent().find('input').first().val($self.parent().find('span').first().text()).focus();

                    $self.parent().find(sel.SIMULATE).first().attr('hidden', 'hidden');
                    $self.parent().find(sel.EDIT).first().attr('hidden', 'hidden');
                    $self.parent().find(sel.DELETE).first().attr('hidden', 'hidden');
                    $self.parent().find(sel.DRAW).first().attr('hidden', 'hidden');
                    $self.parent().find(sel.EXPORT_GPX).first().attr('hidden', 'hidden');
                    $self.parent().find(sel.EXPORT_KML).first().attr('hidden', 'hidden');

                    $self.parent().find(sel.SAVE).first().removeAttr('hidden');
                    $self.parent().find(sel.CANCEL).first().removeAttr('hidden');
                } else {
                    $self.parent().find('input').first().attr('hidden', 'hidden');
                    $self.parent().find('span').first().removeAttr('hidden');

                    $self.parent().find(sel.SIMULATE).first().removeAttr('hidden');
                    $self.parent().find(sel.EDIT).first().removeAttr('hidden');
                    $self.parent().find(sel.DELETE).first().removeAttr('hidden');
                    $self.parent().find(sel.DRAW).first().removeAttr('hidden');
                    $self.parent().find(sel.EXPORT_GPX).first().removeAttr('hidden');
                    $self.parent().find(sel.EXPORT_KML).first().removeAttr('hidden');

                    $self.parent().find(sel.SAVE).first().attr('hidden', 'hidden');
                    $self.parent().find(sel.CANCEL).first().attr('hidden', 'hidden');
                }
            };
            $(document).on("click", '.' + self.CLASS + ' ' + sel.EDIT, function () {
                _edit(true, $(this));
            });
            $(document).on("click", '.' + self.CLASS + ' ' + sel.DELETE, function () {
                self.removeTrack($(this).parent());
            });
            $(document).on("click", '.' + self.CLASS + ' ' + sel.SAVE, function () {
                var newName = $(this).parent().find('input').first().val();
                if (newName.trim().length == 0) {
                    TC.alert(self.getLocaleString("geo.trk.edit.alert"));
                }
                else {
                    self.editTrackName($(this).parent().attr('data-id'), $(this).parent().find('input').first().val());
                    _edit(false, $(this));
                }
            });
            $(document).on("click", '.' + self.CLASS + ' ' + sel.CANCEL, function () {
                _edit(false, $(this));
            });

            $(document).on("click", '.' + self.CLASS + ' ' + sel.EXPORT_GPX + "," + '.' + self.CLASS + ' ' + sel.EXPORT_KML, function () {
                var that = this;
                var prefix = 'tc-btn-export-';
                var className = $.grep($(this).attr('class').split(' '), function (cls) {
                    return cls.indexOf(prefix) === 0;
                })[0];
                var mimeType = className.replace(prefix, '').toUpperCase();

                self.export(mimeType, $(this).parent()).then(function (data) {
                    if (data) idena.utils.fileDownload($(that).parent().find('span').first().text() + '.' + mimeType.toLowerCase(), self.Const.MimeMap[mimeType], data);
                    else TC.alert(self.getLocaleString("geo.error.export"));
                });
            });


            $(document).on("click", '.' + self.CLASS + ' ' + sel.STOP, function () {
                self.uiSimulate(false, $(this));
                self.wrap.simulateTrackEnd();
                //$(this).parent().find(sel.DRAW).attr('title', self.getLocaleString("tr.lst.draw"));
                var $btnPause = $(this).parent().find(sel.PAUSE);
                $btnPause.toggleClass('play', false);
                $btnPause.attr('title', self.getLocaleString("tr.lst.pause"));
            });
            $(document).on("click", '.' + self.CLASS + ' ' + sel.PAUSE, function () {
                self.simulate_paused = !$(this).hasClass('play');
                $(this).attr('title', self.getLocaleString(self.simulate_paused ? "tr.lst.play" : "tr.lst.pause"));
                $(this).toggleClass('play', self.simulate_paused);
            });
            $(document).on("change", '.' + self.CLASS + " select" + sel.SPEED, function () {
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
            self.track.$trackClose.on('click', function () {
                _deactivateTrackingBtns.call(self);
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

    var _activateTrackingBtns = function () {
        var self = this;

        self.track.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
        self.track.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
    };

    var _deactivateTrackingBtns = function () {
        var self = this;

        self.track.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
        self.track.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
    };

    var _showAlerMsg = function () {
        var self = this;
        self.map.toast(self._$div.find(".alert-warning").html(), { duration: 10000 });
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

    ctlProto.getLayer = function (layerType) {
        var self = this;
        var done = new $.Deferred();
        var layerT;
        switch (true) {
            case layerType == self.Const.Layers.TRACKING:
                layerT = self.layerTracking;
                break;
            case layerType == self.Const.Layers.TRACK:
                layerT = self.layerTrack;
                break;
            case layerType == self.Const.Layers.GPS:
                layerT = self.layerGPS;
                break;
        }

        if (layerT == undefined) {
            $.when(self.map.addLayer({
                id: TC.getUID(),
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                title: 'Posicionar.' + layerType,
            })).then(function (layer) {
                layerT = layer;
                layerT.map.putLayerOnTop(layer);
                done.resolve(layerT);
            });
        } else done.resolve(layerT);
        return done;
    };


    ctlProto.activateGPS = function () {
        var self = this;

        self.gps.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
        self.gps.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, false);

        if (!self.track.$trackToolPanelOpened.prop('checked')) {
        self.$toolsPanel.addClass('right-collapsed');
        }

        $.when(self.getLayer(self.Const.Layers.GPS)).then(function (layer) {

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
                            if (extent instanceof Array)
                            return point[0] >= extent[0] && point[0] <= extent[2] && point[1] >= extent[1] && point[1] <= extent[3];
                            else return true;
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

                            if (!self.wrap.pulsated) {
                                self.map.zoomToFeatures(layer.features, { animate: false });
                                self.wrap.pulsate(circle);
                            }
                        });
                    }
                    else TC.alert(self.getLocaleString("geo.error.out"));
                };

                if (navigator.geolocation) {

                    self.currentPosition = navigator.geolocation.watchPosition(function (data) {
                        self.data = data;
                        watch(data);
                    }, self.onGeolocateError.bind(self), options);

                    // FIX para IE y FF. Si el usuario cierra el diálogo de pedida de permisos del navegador con el aspa, no se produce respuesta, y por tanto
                    // el indicador de loading se queda visible de manera indefinida
                    setTimeout(function () {
                        if (!self.data) {
                            self.getLoadingIndicator().removeWait(self.currentPositionWaiting);                            
                            self.map.toast(self.getLocaleString("geo.error.permission_denied"), { type: TC.Consts.msgType.WARNING });
                            self.gps.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
                            self.gps.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
                        }
                    }, options.timeout + 1000); // Wait extra second

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

        if (navigator.geolocation && self.currentPosition) {
            navigator.geolocation.clearWatch(self.currentPosition);
        }

        $.when(self.getLayer(self.Const.Layers.GPS)).then(function (layer) {
            if (layer)
                layer.clearFeatures();
        });

        self.gps.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
        self.gps.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, true);

        if (self.currentPositionWaiting)
            self.getLoadingIndicator().removeWait(self.currentPositionWaiting);

        return true;
    };


    var duringTrackingToolsPanel = function () {
        var self = this;

        if (!self.track.$trackToolPanelOpened.prop('checked'))
            self.$toolsPanel.addClass('right-collapsed');
    };

    var _tracking = function () {
        var self = this;        

        _activateTrackingBtns.call(self);
        duringTrackingToolsPanel.call(self);

        //$('.tc-ctl-geolocation-track-mng').show();        

        self.$events.on(self.Const.Event.POSITIONCHANGE, function (d) {

            self.currentPoint = d.pd;

            if (self.options.simulatedTrack) { } else {

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
            }

            self.track.$trackName.removeAttr('disabled');
            self.track.$trackSave.removeAttr('disabled');

            self.track.$trackWPT.removeAttr('disabled');
            self.track.$trackAdd.removeAttr('disabled');

            // cada vez que se registra una nueva posición almacenamos en sessionStorage
            TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, self.wrap.formattedToStorage(self.layerTracking));
        });
        self.$events.on(self.Const.Event.STATEUPDATED, function (data) {
            //$(self.track.htmlMarker).attr('src', data.moving ? 'layout/idena/img/geo-marker-heading.png' : 'layout/idena/img/geo-marker.png');
        });

        self.clear(self.Const.Layers.TRACKING);

        self.wrap.setTracking(true);
        $(self.track.htmlTrackingMarker).show();
    };

    var addVideoKeepScreenOn = function () {
        var self = this;
        
        if (!self.videoScreenOn) {
            var media = {
                WebM: "data:video/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA=",
                MP4: "data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthADAowdbb9/AAAC6W1vb3YAAABsbXZoZAAAAAB8JbCAfCWwgAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIVdHJhawAAAFx0a2hkAAAAD3wlsIB8JbCAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAABsW1kaWEAAAAgbWRoZAAAAAB8JbCAfCWwgAAAA+gAAAAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVxtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEcc3RibAAAALhzdHNkAAAAAAAAAAEAAACobXA0dgAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAIAAgASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAFJlc2RzAAAAAANEAAEABDwgEQAAAAADDUAAAAAABS0AAAGwAQAAAbWJEwAAAQAAAAEgAMSNiB9FAEQBFGMAAAGyTGF2YzUyLjg3LjQGAQIAAAAYc3R0cwAAAAAAAAABAAAAAQAAAAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAEwAAAAEAAAAUc3RjbwAAAAAAAAABAAAALAAAAGB1ZHRhAAAAWG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAAK2lsc3QAAAAjqXRvbwAAABtkYXRhAAAAAQAAAABMYXZmNTIuNzguMw=="
            };

            self.videoScreenOn = document.createElement('video');
            self.videoScreenOn.setAttribute("loop", "");
            self.videoScreenOn.setAttribute("muted", "");

            var sourceWebM = document.createElement('source');
            sourceWebM.src = media.WebM;
            sourceWebM.type = "video/" + "webm";
            self.videoScreenOn.appendChild(sourceWebM);

            var sourceMP4 = document.createElement('source');
            sourceMP4.src = media.MP4;
            sourceMP4.type = "video/" + "mp4";
            self.videoScreenOn.appendChild(sourceMP4);
        }

        self.videoScreenOn.play();
    };
    var removeVideoKeepScreenOn = function () {
        var self = this;
        if (self.videoScreenOn) {
            self.videoScreenOn.pause();            
        }
    };

    ctlProto.activateTracking = function () {
        var self = this;

        self.clear(self.Const.Layers.TRACKING);

        addVideoKeepScreenOn();

        self.sessionTracking = TC.Util.storage.getSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP);
        if (self.sessionTracking) {
            TC.Util.showModal('#continue-track',
            {
                closeCallback: function () {
                    _deactivateTrackingBtns.call(self);
                }
            });
        } else _tracking.call(self);
    };

    ctlProto.deactivateTracking = function () {
        var self = this;

        var _deactivateTracking = function () {
            self.wrap.setTracking(false);

            removeVideoKeepScreenOn();

            $(self.track.htmlTrackingMarker).hide();

            self.$events.off(self.Const.Event.POSITIONCHANGE);
            self.$events.off(self.Const.Event.STATEUPDATED);

            _deactivateTrackingBtns.call(self);

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

            self.clear(self.Const.Layers.TRACKING);

            return true;
        };

        if (self.wrap.hasCoordinates()) {
            self.map.toast(self.getLocaleString("geo.trk.deactivate.alert"), { duration: 10000 });
            //TC.alert(self.getLocaleString("geo.trk.deactivate.alert"));
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

                reader.onerror = function () {
                    TC.alert(self.getLocaleString("geo.trk.upload.alert"));
                    def.reject();
                };

                reader.onload = TC.Util.detectIE() ? function () {
                    def.resolve({
                        type: ext,
                        text: reader.result
                    });
                } : function () {
                    def.resolve({
                        type: ext,
                        base64data: reader.result
                    });
                };

                if (TC.Util.detectIE())
                    reader.readAsText(files[0]);
                else
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
        var tracks = {};

        localforage.getItem(self.Const.LocalStorageKey.TRACKING)
            .then(function (strTracks) {

                if (strTracks && strTracks.length > 0) {
                    tracks = JSON.parse(strTracks);
                }

                var tracksArray = _orderTracks(tracks);

                self.availableTracks = tracksArray;
                done.resolve(tracksArray);
            });

        return done;
    };

    /**
     * Recibe una sucesión de tracks y la ordena por nombre.
     */
    var _orderTracks = function (tracks) {
        var tracksArray = [];

        for (var index in tracks) {
            if (tracks[index]) {
                tracksArray.push(tracks[index]);
                tracksArray.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
            }
        }

        return tracksArray;
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

        self.track.$trackList.find('li:not([class^="tc-ctl-geolocation-track-available-empty"])').hide();
        self.track.$trackList.find('li[class^="tc-ctl-geolocation-track-available-empty"]').hide();

        self.getAvailableTracks().then(function (tracks) {

            if (_isEmpty(tracks)) {
                self.track.$trackList.find('li[class^="tc-ctl-geolocation-track-available-empty"]').show();
                self.track.$trackSearch.attr('disabled', 'disabled');
            }
            else {
                self.track.$trackList.find('li[data-id]').remove();
                for (var t in tracks) {
                    self.getRenderedHtml(self.CLASS + '-track-node', {
                        id: t, name: tracks[t].name ? tracks[t].name.trim() : ''
                    }, function (html) {
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

        self.drawTrack(li);

        $(self.track.htmlMarker).show();

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

        var time = {
        };
        var km = 0;
        self.chart = {
            coordinates: []
        };

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
                                self.chart.coordinates = self.chart.coordinates.concat(geom.getCoordinates());
                                break;
                            case 'multilinestring':
                                var _time;
                                var ls = geom.getLineStrings();
                                for (var i = 0; i < ls.length; i++) {
                                    km = km + getDistance(ls[i]);

                                    if (ls[i].getLayout() == ol.geom.GeometryLayout.XYZM)
                                        _time = _time + (ls[i].getLastCoordinate()[3] - ls[i].getFirstCoordinate()[3]);

                                    self.chart.coordinates = self.chart.coordinates.concat(ls[i].getCoordinates());
                                }

                                if (_time)
                                    time = getTime(_time);
                                break;
                            default:
                                return null;
                                break;
                        }

                        /* x */
                        for (var i = 0; i < self.chart.coordinates.length; i++) {
                            x.push(km * i / self.chart.coordinates.length);
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
                if (data.time) data.time = ("00000" + data.time.h).slice(-2) + ':' + ("00000" + data.time.m).slice(-2) + ':' + ("00000" + data.time.s).slice(-2);

                data = $.extend({}, data, {
                    size: {
                        height: (Modernizr.mq('(min-width: 50em)') ? 100 : (Modernizr.mq('(min-width: 50em)') ? 100 : 70)), width: (Modernizr.mq('(min-width: 50em)') ? 445 : (Modernizr.mq('(min-width: 40em)') ? 310 : 215))
                    },
                    data: {
                        x: 'x',
                        columns: [['x'].concat(data.x), ['Elevación'].concat(data.ele)],
                        types: { 'Elevación': 'area-spline' }, colors: { "Elevación": '#C52737' }
                    },
                    axis: {
                        x: {
                            tick: {
                                count: 5, format: function (d) {
                                    return d < 1 ? Math.round(d * 1000) + ' m' : Math.round(d) + ' km';
                                }
                            }
                        },
                        y: { max: data.maxy, min: data.miny, tick: { count: 2, format: function (d) { return Math.round(d) + ' m'; } } }
                    }
                });
            }
            else {
                data = { msg: self.getLocaleString("geo.trk.chart.chpe.empty") };
            }

            self.map.$events.trigger($.Event(self.Const.Event.DRAWTRACK), { data: data });
        });
    };

    ctlProto.clear = function (layerType) {
        var self = this;

        self.getLayer(layerType).then(function (layer) {
            self.wrap.clear(layer);
        });

        self.$events.off(self.Const.Event.TRACKSNAPPING, trackSnapping);

        if (layerType == self.Const.Layers.TRACK) {
            // gráfico perfil de elevación
            self.track.$trackChartPanel.hide();
            delete self.track.$trackChartPanelOnMap;

            // overlay de la simulación
            self.wrap.simulateTrackEnd();

            // eliminamos la selección en la lista de tracks
            self.track.$trackList.find('li').removeClass(self.Const.Classes.SELECTEDTRACK);

            self.map.$events.trigger($.Event(self.Const.Event.CLEARTRACK), {});
        }
    };

    ctlProto.saveTrack = function () {
        var self = this;
        var done = new $.Deferred();

        var _save = function (layerType) {
            self.getLayer(layerType).then(function (layer) {
            var wait;
            wait = self.getLoadingIndicator().addWait();

            var trackName = self.import.fileName || self.track.$trackName.val().trim();

            var tracks = self.availableTracks;
            if (!tracks)
                tracks = {};

            var uid = TC.getUID();
            while (!$.grep(tracks, function (track) {
                return track.uid === uid;
            })) {
                uid = TC.getUID();
            }

            tracks.push({
                name: trackName,
                data: self.wrap.formattedToStorage(layer, true),
                uid: uid
            });
            tracks = _orderTracks(tracks);

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
                    self.map.toast(self.saveMessage || self.getLocaleString("geo.trk.save.alert"), { duration: 10000 });
                    //TC.alert(self.saveMessage || self.getLocaleString("geo.trk.save.alert"));
                    if (self.saveMessage)
                        delete self.saveMessage;

                    // NO eliminamos el track de session, ya que al activar la herramienta tiene la opción de iniciar un nuevo track
                    // delete self.parent.sessionTracking;
                    // TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, undefined);

                    clean(wait);
                    var index;
                    for (var i = 0; i < tracks.length; i++) {
                        if (tracks[i].uid === uid) {
                            index = i;
                            break;
                        }
                    }
                    done.resolve(index);
                });

            } catch (error) {
                TC.alert(self.getLocaleString("geo.error.savelocalstorage") + ': ' + error.message);
                clean(wait);
                done.reject();
            }
            });
        };

        if (self.import.fileName)
            _save(self.Const.Layers.TRACK);
        else if (self.track.$trackName.val().trim().length == 0) {
            self.track.$trackName.val(new Date().toLocaleString());
            _save(self.Const.Layers.TRACKING);
        }
        else {
            _save(self.Const.Layers.TRACKING);
        }

        return done;
    };

    ctlProto.addWaypoint = function () {
        var self = this;

        var waypointName = self.track.$trackWPT.val().trim();
        if (!waypointName) {
            waypointName = new Date().toLocaleString();
        }

        var wait = self.getLoadingIndicator().addWait();

        duringTrackingToolsPanel.call(self);

        self.wrap.addWaypoint(self.currentPoint.position, {
            name: waypointName,
            ele: self.currentPoint.heading,
            time: new Date().getTime() // GLS: lo quito ya que hemos actualizado la función que gestiona la fechas para la exportación a GPX - espera la fecha en segundos -> / 1000 // para la exportación a GPX - espera la fecha en segundos
        });

        self.track.$trackWPT.val('');
        self.track.$trackWPT.attr('disabled', 'disabled');
        self.track.$trackAdd.attr('disabled', 'disabled');

        // cada vez que se añade un waypoint almacenamos en sessionStorage
        TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, self.wrap.formattedToStorage(self.layerTracking));

        self.getLoadingIndicator().removeWait(wait);
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

                        self.clear(self.Const.Layers.TRACK);

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

        $(li).find(self.Const.Selector.DRAW).attr('title', self.getLocaleString("tr.lst.clear"));
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

    ctlProto.getTooltip = function (d) {
        var self = this;

        return self.wrap.getTooltip(d);
    };

    ctlProto.removeTooltip = function () {
        var self = this;

        $(self.track.htmlElevationMarker).hide();
    }

    ctlProto.import = function (evt) {
        var self = this;

        if (!self._cleaning) {

            self.clear(self.Const.Layers.TRACK);

            var wait;
            wait = self.getLoadingIndicator().addWait();


            $.when(self.upload(evt)).then(function (data) {
                if (data) {

                    self.wrap.import(wait, (data.text ?
                        { text: data.text } : {
                            base64: 'data:' + self.Const.MimeMap[data.type.toUpperCase()] +
                                    ';base64,' + encodeURI(data.base64data.split(',').pop())
                        }), data.type);


                    self._cleaning = true;
                    self.track.$trackImportFile.replaceWith(self.track.$trackImportFile.val('').clone(true));
                    delete self._cleaning;
                }

            }, function (error) {
                TC.alert(self.getLocaleString("geo.trk.upload.error2"));
                self.getLoadingIndicator().removeWait(wait);
            });
        }
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

        self.gps.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
        self.gps.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
    };

    var _isEmpty = function (obj) {
        return !obj || obj.length === 0;
    };
})();
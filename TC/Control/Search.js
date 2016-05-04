TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}

TC.control.Search = function () {
    var self = this;
    TC.Control.apply(self, arguments);

    self._LIKE_PATTERN = '*';

    self.UTMX = 'X';
    self.UTMY = 'Y';
    self.LON = 'Lon';
    self.LAT = 'Lat';

    self.UTMX_LABEL = 'X: ';
    self.UTMY_LABEL = 'Y: ';
    self.LON_LABEL = 'Lon: ';
    self.LAT_LABEL = 'Lat: ';

    self.MUN = 'M';
    self.POL = 'P';
    self.PAR = 'Par';

    self.MUN_LABEL = 'Mun: ';
    self.POL_LABEL = 'Pol: ';
    self.PAR_LABEL = 'Par: ';

    self.availableSearchTypes = {};

    self.availableSearchTypes[TC.Consts.searchType.CADASTRAL] = {
        suggestionRoot: null,
        url: '//idena.tracasa.es/ogc/wfs',
        version: '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',
        featureType: ['CATAST_Pol_ParcelaRusti', 'CATAST_Pol_ParcelaUrba', 'CATAST_Pol_ParcelaMixta'],
        municipality: {
            featureType: 'CATAST_Pol_Municipio',
            outputProperties: ['CMUNICIPIO', 'MUNICIPIO']
        },
        queryProperties: {
            municipality: 'CMUNICIPIO',
            polygon: 'POLIGONO',
            parcel: 'PARCELA'
        },
        styles: {
            polygon: {
                fillColor: "#000000",
                fillOpacity: 0.5,
                strokeColor: "#FFFFFF",
                strokeOpacity: 1,
                strokeWidth: 2,
                strokeLinecap: "round",
                strokeDashstyle: "solid"
            }
        }
    };
    self.availableSearchTypes[TC.Consts.searchType.COORDINATES] = {};

    self.availableSearchTypes[TC.Consts.searchType.MUNICIPALITY] = {
        root: null,
        limit: false,
        url: '//idena.tracasa.es/ogc/wfs',
        version: '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',
        featureType: ['CATAST_Pol_Municipio'],
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO'],
        queryProperties: {
            tProperty: ['MUNINOAC', 'MUNICIPIO']
        },
        outputProperties: ['MUNICIPIO'],
        outputFormatLabel: '{0}'
    };

    self.availableSearchTypes[TC.Consts.searchType.LOCALITY] = {
        root: null,
        limit: false,
        url: '//idena.tracasa.es/ogc/wfs',
        version: '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',
        featureType: ['CATAST_Pol_Municipio', 'ESTADI_Pol_EntidadPob'],
        renderFeatureType: '',
        dataIdProperty: {
            CATAST_Pol_Municipio: ['CMUNICIPIO'],
            ESTADI_Pol_EntidadPob: ['CIDENTIDAD']
        },
        queryProperties: {
            tProperty: {
                CATAST_Pol_Municipio: ['MUNINOAC', 'MUNICIPIO'],
                ESTADI_Pol_EntidadPob: ['ENTINOAC', 'ENTIDAD']
            }
        },
        outputProperties: {
            CATAST_Pol_Municipio: ['MUNICIPIO'],
            ESTADI_Pol_EntidadPob: ['MUNICIPIO', 'ENTIDAD']
        },
        outputFormatLabel: {
            CATAST_Pol_Municipio: '{0}',
            ESTADI_Pol_EntidadPob: '{1} ({0})'
        }
    };

    self.availableSearchTypes[TC.Consts.searchType.STREET] = {
        root: null,
        limit: null,
        url: '//idena.tracasa.es/ogc/wfs',
        version: '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Lin_CalleEje',
        renderFeatureType: 'CATAST_Txt_Calle',
        dataIdProperty: ['CVIA'],
        queryProperties: {
            tProperty: ['ENTINOAC', 'ENTIDADC'],
            sProperty: ['VIA', 'VIANOAC']
        },
        outputProperties: ['ENTIDADC', 'VIA'],
        outputFormatLabel: '{1}, {0}',
        styles: {
            line: {
                strokeColor: "#CB0000",
                strokeOpacity: 1,
                strokeWidth: 2,
                strokeLinecap: "round",
                strokeDashstyle: "solid"
            },
            point: {
                radius: 0
            }
        },
        renderStyles: {
            point: {
                label: "${VIA}",
                angle: "${CADANGLE}",
                fontColor: "#000000",
                fontSize: 9,
                fontWeight: "bold",
                labelOutlineColor: "#FFFFFF",
                labelOutlineWidth: 2
            }
        }
    };

    self.availableSearchTypes[TC.Consts.searchType.NUMBER] = {
        root: null,
        limit: null,
        url: '//idena.tracasa.es/ogc/wfs',
        version: '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Txt_Portal',
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO', 'CENTIDADC', 'CVIA', 'PORTAL'],
        queryProperties: {
            tProperty: ['ENTIDADC', 'ENTINOAC'],
            sProperty: ['VIA', 'VIANOAC'],
            pProperty: ['PORTAL']
        },
        outputProperties: ['ENTIDADC', 'VIA', 'PORTAL'],
        outputFormatLabel: '{1} {2}, {0}',
        styles: {
            point: {
                radius: 0,
                label: "${PORTAL}",
                angle: "${CADANGLE}",
                fontColor: "#CB0000",
                fontSize: 14,
                fontWeight: "bold",
                labelOutlineColor: "#FFFFFF",
                labelOutlineWidth: 4
            }
        }
    };

    self.allowedSearchTypes = self.options.allowedSearchTypes || {};

    if (self.options.allowedSearchTypes) {
        for (var allowed in self.options.allowedSearchTypes) {
            // GLS: Limitamos la búsqueda en portales y calles cuando así se establezca en la configuración de las búsquedas
            if (self.availableSearchTypes[allowed] && !$.isEmptyObject(self.options.allowedSearchTypes[allowed])) {
                $.extend(self.availableSearchTypes[allowed], self.options.allowedSearchTypes[allowed]);

                if (allowed != TC.Consts.searchType.MUNICIPALITY && self.options.allowedSearchTypes[allowed].root) {
                    self.availableSearchTypes[TC.Consts.searchType.MUNICIPALITY].root = self.options.allowedSearchTypes[allowed].root;
                    self.availableSearchTypes[TC.Consts.searchType.MUNICIPALITY].limit = self.options.allowedSearchTypes[allowed].limit || true;

                    self.availableSearchTypes[TC.Consts.searchType.STREET].queryProperties.tProperty = ['CMUNICIPIO'];
                    self.availableSearchTypes[TC.Consts.searchType.NUMBER].queryProperties.tProperty = ['CMUNICIPIO'];
                }
            }
        }
    }

    self.queryableFeatures = self.options.queryableFeatures || false;

    self.UTMX_LEN = 6;
    self.UTMY_LEN = 7;

    self.CADASTRAL = TC.Consts.searchType.CADASTRAL;
    self.COORDINATES = TC.Consts.searchType.COORDINATES;
    self.MUNICIPALITY = TC.Consts.searchType.MUNICIPALITY;
    self.LOCALITY = TC.Consts.searchType.LOCALITY;
    self.STREET = TC.Consts.searchType.STREET;
    self.NUMBER = TC.Consts.searchType.NUMBER;

    self.wrap = new TC.wrap.control.Search(self);

    TC._search.interval = 500;

    TC._search.rootLabel = '';
    TC._search.searchTypes = {
        CADASTRAL_SEARCH: {
            parser: self.getCadastralRef,
            goTo: self.goToCadastralRef
        },
        COORDINATES_SEARCH: {
            parser: self.getCoordinates,
            goTo: self.goToCoordinates
        },
        ADDRESS_SEARCH: {
            parser: self.getAddress,
            goTo: self.goToAddress
        }
    };
};

TC.inherit(TC.control.Search, TC.Control);

(function () {
    var ctlProto = TC.control.Search.prototype;

    ctlProto.CLASS = 'tc-ctl-search';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/Search.html";
    }
    else {
        ctlProto.template = function () {
            dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "search.1" }).w("</h2><div class=\"tc-ctl-search-content\"><input type=\"search\" class=\"tc-ctl-search-txt\" placeholder=\"").h("i18n", ctx, {}, { "$key": "search.placeholder" }).w("\" title=\"").h("i18n", ctx, {}, { "$key": "search.instructions" }).w("\" /><a title=\"").h("i18n", ctx, {}, { "$key": "search.instructions" }).w("\" class=\"tc-ctl-btn tc-ctl-search-btn\">").h("i18n", ctx, {}, { "$key": "search.2" }).w("</a><ul class=\"tc-ctl-search-list\"></ul></div>"); } body_0.__dustBody = !0; return body_0
        };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        self.EMPTY_RESULTS_LABEL = self.getLocaleString('noResults');
        self.EMPTY_RESULTS_TITLE = self.getLocaleString('checkCriterion');
        self.OUTBBX_LABEL = self.getLocaleString('outsideOfBBox');
    };

    ctlProto.renderData = function (data, callback) {
        var self = this;

        TC._search = TC._search || {};

        var _search = function () {
            self.search(self.$text.val(), function (list) {
                if (list.length === 1) {
                    self.$text.val(list[0].label);
                    self.goToResult(list[0].id);
                    self.$list.hide('fast');
                }
                else if (list.length === 0) {
                    self.$list.hide('fast');
                }
            });
        };

        TC.Control.prototype.renderData.call(self, data, function () {

            // desde keypress y desde la lupa
            var _research = function () {
                self.$text.val(self.$list[0].label || self.$list.find('li > a').text());
                TC._search.lastPattern = self.$text.val();
                self.goToResult(self.$list[0].id || unescape(self.$list.find('li > a').attr('href')).substring(1));
                self.$list.hide('fast');
            };

            self.$text = self._$div.find('input.tc-ctl-search-txt');
            self.$list = self._$div.find('.tc-ctl-search-list');
            self.$button = self._$div.find('.tc-ctl-search-btn');
            self.$button.on(TC.Consts.event.CLICK, function () {
                if (self.$list.find('li > a:not(.tc-ctl-search-li-loading,.tc-ctl-search-li-empty)').length === 1) {
                    _research();
                }
                else self.$text.trigger('keyup.autocomplete');
            });

            // GLS: añadimos la funcionalidad al mensaje de "No hay resultados", al hacer click repliega el mensaje.
            self.$list.on(TC.Consts.event.CLICK, 'a.tc-ctl-search-li-empty', function () {
                self.$list.hide('fast');
                self.$text.focus();
            });


            // IE10 polyfill
            try {
                if (self.$text.has($('::-ms-clear'))) {
                    var oldValue;
                    self.$text.on('mouseup', function (e) {
                        oldValue = self.$text.val();

                        if (oldValue === '') {
                            return;
                        }

                        // When this event is fired after clicking on the clear button
                        // the value is not cleared yet. We have to wait for it.
                        setTimeout(function () {
                            var newValue = self.$text.val();

                            if (newValue === '') {
                                self.$list.hide('fast');
                                // Gotcha
                                _search();
                            }
                        }, 1);
                    });
                }
            }
            catch (e) { }

            self.$text.on('keypress', function (e) {
                if (e.which == 13) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (self.$list.find('li > a:not(.tc-ctl-search-li-loading,.tc-ctl-search-li-empty)').length === 1) {
                        _research();
                    }
                    return false;
                }
            }).on("search", function () {
                if (self.$text.val().length === 0) {
                    self.$list.hide('fast');
                    _search();
                }
            }).on("input", function () {
                if (self.$text.val().length === 0) {
                    self.$list.hide('fast');
                    _search();
                }
            }).on("targetCleared.autocomplete", function () {
                self.$list.hide('fast');
            }).on("targetUpdated.autocomplete", function () {
                if (self.$list.find('li').length > 0) {
                    self.$list.show('fast');
                }
            });

            TC._search.lastPattern = '';
            TC._search.retryTimeout = null;
            TC.loadJS(
                !self.$text.autocomplete,
                [TC.apiLocation + 'lib/jQuery/autocomplete.js'],
                function () {
                    self.$text = self._$div.find('input.tc-ctl-search-txt');
                    self.$text.autocomplete({
                        link: '#',
                        target: self.$list,
                        minLength: 2,
                        source: function (text, callback) {
                            if (text != TC._search.lastPattern) {
                                self.$list.hide('fast');

                                TC._search.lastPattern = text;

                                if (TC._search.retryTimeout)
                                    clearTimeout(TC._search.retryTimeout);

                                TC._search.retryTimeout = setTimeout(function () {
                                    self.search(text, callback);
                                }, TC._search.interval);
                            }
                        },
                        callback: function (e) {
                            var _target = $(e.target);

                            if (!$(e.target).is('a'))
                                _target = $(e.target).closest('a');

                            self.$text.val($(_target).text());
                            TC._search.lastPattern = self.$text.val();
                            self.goToResult(unescape($(_target).attr('href')).substring(1));
                            self.$text.autocomplete('clear');;
                        }
                    });

                    // Detect up/down arrow
                    self.$text.add(self.$list).keydown(function (e) {
                        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                            if (e.keyCode === 40) { // down arrow
                                if (self.$text.is(':focus')) {
                                    // Scenario 1: We're focused on the search input; move down to the first li
                                    self.$list.find('li:first a').focus();
                                } else if (self.$list.find('li:last a').is(':focus')) {
                                    // Scenario 2: We're focused on the last li; move up to search input
                                    self.$text.focus();
                                } else {
                                    // Scenario 3: We're in the list but not on the last element, simply move down
                                    nextIndex = self.$list
                                    .find('li')
                                    .find('a:focus')
                                    .parent('li').index() + 1;
                                    self.$list.find('li:eq(' + nextIndex + ') a').focus();
                                }
                                e.preventDefault(); // Stop page from scrolling
                                e.stopPropagation();
                            } else if (e.keyCode === 38) { // up arrow
                                if (self.$text.is(':focus')) {
                                    // Scenario 1: We're focused on the search input; move down to the last li
                                    self.$list.find('li:last a').focus();
                                } else {
                                    // Scenario 3: We're in the list but not on the first element, simply move up
                                    nextIndex = self.$list
                                    .find('li')
                                    .find('a:focus')
                                    .parent('li').index() - 1;
                                    self.$list.find('li:eq(' + nextIndex + ') a').focus();
                                }
                                e.preventDefault(); // Stop page from scrolling
                                e.stopPropagation();
                            }
                        }
                        e.stopPropagation();
                    });
                }
            );
        });

        if ($.isFunction(callback)) {
            callback();
        }
    };

    ctlProto.getLayer = function () {
        var self = this;
        return self.layer || self.layerPromise;
    };

    ctlProto.getFeatures = function () {
        var self = this;
        var features = [];

        if (self._layers && self._layers.length > 0)
            for (var i = 0; i < self._layers.length; i++) {
                features = features.concat(self._layers[i].features);
            }

        return features;
    };

    ctlProto.cleanMap = function () {
        var self = this;

        if (self._layers && self._layers.length > 0) {
            for (var i = 0; i < self._layers.length; i++) {
                self.map.removeLayer(self._layers[i]);
            }

            self._layers = [];
            self.layer = null;
        }
        else {
            if (self.layer) {
                self.map.removeLayer(self.layer);
                self.layer = null;
            }
        }
    };

    ctlProto.getMunicipalities = function () {
        var self = this;
        TC.cache.search = TC.cache.search || {};
        if (!TC.cache.search.municipalities) {
            self._municipalitiesDeferred = new $.Deferred();
            var params = {
                REQUEST: 'GetFeature',
                SERVICE: 'WFS',
                TYPENAME: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].municipality.featureType,
                VERSION: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].version,
                PROPERTYNAME: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].municipality.outputProperties.join(','),
                OUTPUTFORMAT: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].outputFormat
            };
            if (self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].featurePrefix) {
                params.TYPENAME = self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].featurePrefix + ':' + params.TYPENAME;
            }
            var url = self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].url + '?' + $.param(params);
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'text'
            }).done(function (data) {
                var parser;
                if (self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].outputFormat === TC.Consts.format.JSON) {
                    parser = new TC.wrap.parser.JSON();
                }
                else {
                    parser = new TC.wrap.parser.WFS({
                        featureNS: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].municipality.featurePrefix,
                        featureType: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].municipality.featureType
                    });
                }
                var features = parser.read(data);
                TC.cache.search.municipalities = [];
                for (var i = 0; i < features.length; i++) {
                    var feature = features[i];
                    TC.cache.search.municipalities.push({ label: feature.data[self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].municipality.outputProperties[1]], id: feature.data[self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].municipality.outputProperties[0]] });
                }

                TC.cache.search.municipalities.sort(function (a, b) {
                    var result;
                    if (a.label < b.label) {
                        result = -1;
                    }
                    else if (a.label > b.label) {
                        result = 1;
                    }
                    else {
                        result = 0;
                    }
                    return result;
                });

                self._municipalitiesDeferred.resolve(TC.cache.search.municipalities);
            });
        }
        return TC.cache.search.municipalities || self._municipalitiesDeferred.promise();
    };

    ctlProto.getCoordinates = function (pattern) {
        var self = this;
        var deferred = new $.Deferred();

        var match = pattern.match(new RegExp('^' + $.trim(self.UTMX_LABEL.toLowerCase()) + '*\\s*([0-9]{' + self.UTMX_LEN + '}(?:[.]\\d+)?)\\s*\,\\s*' + $.trim(self.UTMY_LABEL.toLowerCase()) + '*\\s*([0-9]{' + self.UTMY_LEN + '}(?:[.]\\d+)?)$'));
        if (match) {
            pattern = match[1] + ', ' + match[2];
        }

        match = pattern.match(new RegExp('^' + $.trim(self.LAT_LABEL.toLowerCase()) + '*\\s*([-+]?\\d{1,3}([.]\\d+)?),\\s*' + $.trim(self.LON_LABEL.toLowerCase()) + '*\\s*([-+]?\\d{1,2}([.]\\d+)?)$'));
        if (match) {
            pattern = match[1] + ', ' + match[3];
        }

        if (/\d/.test(pattern) && (new RegExp('^([0-9]{' + self.UTMX_LEN + '}(?:[.]\\d+)?)\\s*\\,\\s*([0-9]{' + self.UTMY_LEN + '}(?:[.]\\d+)?)$').test(pattern) || /^([-+]?\d{1,3}([.,]\d+)?),\s*([-+]?\d{1,2}([.,]\d+)?)$/.test(pattern))) {
            match = /^([-+]?\d{1,3}([.,]\d+)?),\s*([-+]?\d{1,2}([.,]\d+)?)$/.exec(pattern);
            if (match && (match[1].indexOf(',') > -1 || match[3].indexOf(',') > -1)) {
                match[1] = match[1].replace(',', '.');
                match[3] = match[3].replace(',', '.');

                pattern = match[1] + ', ' + match[3];
            }

            if (!match || match && match[1] <= 180 && match[3] <= 90) {
                // parse coordinates
                pattern = pattern.replace(self.UTMX_LABEL, '').replace(self.UTMY_LABEL, '').replace(self.LON_LABEL, '').replace(self.LAT_LABEL, '');
                var coords = TC.Util.parseCoords(pattern);
                if (coords) {
                    var xValue = coords[0].value;
                    var yValue = coords[1].value;
                    var xLabel = (coords[0].type === TC.Consts.UTM) ? self.UTMX : self.LAT;
                    var yLabel = (coords[1].type === TC.Consts.UTM) ? self.UTMY : self.LON;
                    var id = xLabel + xValue + yLabel + yValue;

                    var point = self.getPoint(id);
                    if (point && !self.insideLimit(point)) {
                        xValue = coords[1].value;
                        yValue = coords[0].value;
                        xLabel = (coords[1].type === TC.Consts.UTM) ? self.UTMX : self.LAT;
                        yLabel = (coords[0].type === TC.Consts.UTM) ? self.UTMY : self.LON;
                        id = xLabel + xValue + yLabel + yValue;
                        point = self.getPoint(id);
                    }

                    if (point)
                        deferred.resolve([{ id: id, label: self.getLabel(id) }]);
                    else { deferred.resolve([]); }
                }
            } else { deferred.resolve([]); }
        } else { deferred.resolve([]); }

        return deferred.promise();
    };

    ctlProto.getCadastralRef = function (pattern) {
        var self = this;
        var deferred = new $.Deferred();

        var match = pattern.match(new RegExp($.trim(self.MUN_LABEL.toLowerCase()) + '?\\s(.*)\\,\\s?' + $.trim(self.POL_LABEL.toLowerCase()) + '?\\s(\\d{1,2})\\,\\s?' + $.trim(self.PAR_LABEL.toLowerCase()) + '?\\s(\\d{1,4})'));
        if (match) {
            pattern = match[1] + ', ' + match[2] + ', ' + match[3];
        }

        var _pattern = pattern;
        if (!(/(.*)\,(\s*\d{1,2})\,(\s*\d{1,4})/.test(pattern)) && self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].suggestionRoot)
            _pattern = self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].suggestionRoot + ', ' + pattern;

        if (/(.*)\,(\s*\d{1,2})\,(\s*\d{1,4})/.test(_pattern) && !(new RegExp('^([0-9]{' + self.UTMX_LEN + '})\\s*\\,\\s*([0-9]{' + self.UTMY_LEN + '})$').test(pattern))) {
            $.when(self.getMunicipalities()).then(function (list) {
                var match = /(.*)\,(\s*\d{1,2})\,(\s*\d{1,4})/.exec(_pattern);
                if (match) {
                    var matcher = new RegExp($.trim(match[1]).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
                    var results = $.grep(list, function (value) {
                        value = value.label || value.id || value;
                        return matcher.test(value) || matcher.test(self.removePunctuation(value));
                    });

                    var getItem = function (mun, munLabel, pol, par) {
                        return {
                            id: self.MUN + mun + self.POL + pol + self.PAR + par,
                            label: self.getLabel(self.MUN + munLabel + self.POL + pol + self.PAR + par)
                        };
                    };
                    if (results.length > 0) {
                        for (var i = 0; i < results.length; i++) {
                            results[i] = getItem(results[i].id, results[i].label, $.trim(match[2]), $.trim(match[3]));
                        }
                    }
                    if (/^[0-9]*$/g.test(match[1]))
                        results.push(getItem($.trim(match[1]), $.trim(match[1]), $.trim(match[2]), $.trim(match[3])));

                    deferred.resolve(results);
                }
            });
        } else { deferred.resolve([]); }

        return deferred.promise();
    };

    ctlProto.getAddress = function (pattern) {
        var self = this;
        var deferred = new $.Deferred();
        var results = [];

        var parseFeatures = function (data, dataRole) {
            var parser;
            if (self.availableSearchTypes[dataRole].outputFormat === TC.Consts.format.JSON) {
                parser = new TC.wrap.parser.JSON();
            }
            else {
                parser = new TC.wrap.parser.WFS({
                    featureNS: self.availableSearchTypes[dataRole].featurePrefix,
                    featureType: self.availableSearchTypes[dataRole].featureType
                });
            }
            return parser.read(data);
        };

        var normalizedCriteria = function (value) {
            var _value = '';
            var patternRomanNumber = /M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}){1,}?\S?\./g;
            var patternAbsoluteNotDot = /[`~!@#$%^&*_|+\=?;:'"<>\{\}\[\]\\]/g;
            var patternAbsolute = /[`~!@#$%^&*_|+\=?;:'.<>\{\}\[\]\\]/g;

            value = self.removePunctuation(value);

            var _pattern = /(.*)\s<>\s.*/;
            // nos quedamos con único término en el caso de bilingues: pamplona <> iruña, sin este paso no funcionan las querys en formato xml
            if (_pattern.test(value)) {
                if (value.indexOf(',') > -1) {
                    var v = value.splitRemoveWhiteSpaces(',');
                    return $.trim(v[0].match(_pattern)[1]) + (v.length == 2 ? ', ' + v[1] : '');
                } else {
                    return $.trim(value.match(_pattern)[1]);
                }
            }

            var match;
            if (value.indexOf('(') > -1 || value.indexOf(')') > -1) {
                _pattern = /(.*)(\s<>\s.*\(.*\))/;
                if (value.indexOf('<>') > -1 && _pattern.test(value)) {
                    match = value.match(_pattern);
                    if (match !== null) {
                        _value = value.replace(match[2], '');
                        _value = _value.splitRemoveWhiteSpaces(',').join(',');
                    }
                } else {
                    // eliminamos el municipio dejando solo la localidad
                    _pattern = /\(.*\)/;
                    if (!_pattern.test(value)) {
                        // no contiene () comprobamos solo (
                        _pattern = /\(.*/;
                        if (!_pattern.test(value)) {
                            // no contiene ( comprobamos solo )
                            _pattern = /.*\)/;
                            if (!_pattern.test(value)) {
                                _pattern = /\(.*\)/;
                            }
                        }
                    }

                    _value = value.replace(_pattern, '');
                    _value = _value.splitRemoveWhiteSpaces(',').join(',');
                }

                value = _value;
            }

            //// movemos el número del portal indicado al final, seguido de la vía
            //_pattern = /(s\/n|\d{1,3}(?:[- ]?\d{0,3}(?:bis|[a-z]))?)/;
            //if (_pattern.test(value) && value.split(',').length == 3) {
            //    match = value.match(_pattern);
            //    _value = value.replace(match[1], '');
            //    var terms = _value.splitRemoveWhiteSpaces(',');
            //    terms[0] = terms[0] + ' ' + match[1];

            //    if (terms.length == 3 && $.trim(terms[2]) === '')
            //        terms.pop();

            //    value = terms.join(',');
            //}

            // elimino los caracteres especiales
            if (patternRomanNumber.test(value))
                value = value.replace(patternAbsoluteNotDot, '');
            else
                value = value.replace(patternAbsolute, '');
            return value.toLowerCase();
        };

        var _formatStreetNumber = function (value) {
            var result = value;

            var is_nc_c = function (value) {
                return /^(\d{1,3})\s?\-?\s?([a-z]{0,4})\s?\-?\s?([a-z]{0,4})$/i.test(value);
            }
            var nc_c = function (value) {
                var f = [];
                var m = /^(\d{1,3})\s?\-?\s?([a-z]{0,4})\s?\-?\s?([a-z]{0,4})$/i.exec(value);
                if (m) {
                    for (var i = 1; i < m.length; i++) {
                        if (m[i].trim().length > 0)
                            f.push(m[i].trim());
                    }

                    return f.join(self._LIKE_PATTERN);
                }
                return value;
            };

            var is_cn = function (value) {
                return /^([a-z]{1,4})\s?\-?\s?(\d{1,3})$/i.test(value);
            };
            var cn = function (value) {
                var f = [];
                var m = /^([a-z]{1,4})\s?\-?\s?(\d{1,3})$/i.exec(value);
                if (m) {
                    for (var i = 1; i < m.length; i++) {
                        if (m[i].trim().length > 0)
                            f.push(m[i].trim());
                    }

                    return f.join(self._LIKE_PATTERN);
                }
                return value;
            };

            var is_sn = function (value) {
                return /^(sn|S\/N|s\/n|s\-n)$/i.test(value);
            };
            var sn = function (value) {
                var m = /^(sn|S\/N|s\/n|s\-n)$/i.exec(value);
                if (m) {
                    return 's*n';
                }
                return value;
            };


            var is_cmc = function (value) {
                return /^([a-z]{1,4}\s?\+\s?[a-z]{1,4})$/i.test(value);
            };
            var cmc = function (value) {
                var m = /^([a-z]{1,4}\s?\+\s?[a-z]{1,4})$/i.exec(value);
                if (m) {
                    return value;
                }
                return value;
            };

            var isCheck = [is_nc_c, is_cn, is_sn, is_cmc];
            var check = [nc_c, cn, sn, cmc];
            var ch = 0;
            while (ch < check.length && !isCheck[ch].call(self, value)) { ch++; }

            if (ch < check.length)
                return check[ch].call(self, value);
            else return value;
        };

        var getObjectsTo = function (text, root, limit) {
            var deferred = new $.Deferred();

            // eliminamos espacios en blanco
            text = text.trim();

            // comprobamos si acaba con coma, si es así, la eliminamos
            if (text.charAt(text.length - 1) == ',')
                text = text.substring(0, text.length - 1);

            var result = [];

            var bindRoot = function (result) {
                if (root) {
                    for (var i = 0; i < result.length; i++) {
                        if (limit) {
                            if (result[i].t) { result[i].t = root; }
                        }
                        else result.push($.extend({}, result[i], { t: root }));
                    }
                }
            };
            var tsp = function (text, result) {
                // town, street, portal - street, town, portal
                var match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúü\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);
                if (match) {

                    var getPortal = function () {
                        return _formatStreetNumber((match[3] || match[4] || match[5] || match[6]).trim());
                    };
                    // ninguno contiene número duplicamos búsqueda
                    if (/^([^0-9]+)$/i.test(match[1].trim()) && /^([^0-9]+)$/i.test(match[2].trim())) {
                        result.push({ t: match[1].trim(), s: match[2].trim(), p: getPortal() });
                        result.push({ t: match[2].trim(), s: match[1].trim(), p: getPortal() });
                    }
                    else {  // indicamos como calle el criterio que contiene números, ya que no existen municipios con números pero sí calles
                        if (/^([^0-9]+)$/i.test(match[1].trim())) result.push({ t: match[1].trim(), s: match[2].trim(), p: getPortal() });
                        else result.push({ s: match[1].trim(), t: match[2].trim(), p: getPortal() });
                    }
                    bindRoot(result);
                    return true;
                }

                return false;
            };
            var tnsp = function (text, result) {
                // town, numbers street, portal
                var match = /^(?:([^\,][a-zñáéíóúü\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)([^0-9\,]+)(?:\s*\,\s*)(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);

                if (match) {
                    result.push({ t: match[2].trim(), s: match[1].trim(), p: _formatStreetNumber((match[3] || match[4] || match[5] || match[6]).trim()) });
                    bindRoot(result);
                    return true;
                }

                return false;
            };
            var ts = function (text, result) {
                // town, street
                var match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúü\s*\-\.\(\)\/0-9]+))$/i.exec(text);
                if (match) {
                    // ninguno contiene número duplicamos búsqueda
                    if (/^([^0-9]+)$/i.test(match[1].trim()) && /^([^0-9]+)$/i.test(match[2].trim())) {
                        result.push({ t: match[1].trim(), s: match[2].trim() });
                        result.push({ s: match[1].trim(), t: match[2].trim() });
                    }
                    else {  // indicamos como calle el criterio que contiene números, ya que no existen municipios con números pero sí calles

                        var getStreet = function (s) {
                            var revS = s.split(' ').reverse();
                            // validamos si el criterio es compuesto 
                            var fs = [];
                            for (var si = 0; si < revS.length; si++) {
                                if (revS[si].length == 1) {
                                    fs.push(revS[si]);
                                    revS[si] = '';
                                }
                            }

                            return fs.length > 0 ? revS.reverse().join(' ').trim() + self._LIKE_PATTERN + fs.reverse().join(self._LIKE_PATTERN) : revS.reverse().join(' ').trim();
                        };

                        if (/^([^0-9]+)$/i.test(match[1].trim()))
                            result.push({ t: match[1].trim(), s: getStreet(match[2].trim()) });
                        else result.push({ s: getStreet(match[1].trim()), t: match[2].trim() });
                    }
                    bindRoot(result);
                    return true;
                }

                return false;
            };
            var st = function (text, result) {
                // street, town
                var match = /^(?:([^\,][a-zñáéíóúü\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)([^0-9\,]+)$/i.exec(text);
                if (match) { // puede generar falsos positivos cuando el portal llega seguido de la calle -> calle mayor 14, pamplona
                    var data = {};
                    var criteria = text.split(',').reverse();
                    for (var i = 0; i < criteria.length; i++) {
                        if (/^([^0-9\,]+)$/i.test(criteria[i].trim())) { // si no hay números se trata de municipio
                            data.t = criteria[i].trim();
                        }
                        else if (/(\s*\d+)/i.test(criteria[i].trim())) { // si contiene número, puede ser calle o calle + portal
                            if (criteria[i].trim().indexOf(' ') == -1) { // si no contiene espacios se trata de calle compuesta por números
                                data.s = criteria[i].trim();
                            } else { // si contiene espacio puede contener calle + portal
                                var _criteria = criteria[i].trim().split(' ').reverse();

                                var isPortal = function (c) {
                                    var m = /^(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(c.trim());
                                    if (m) {
                                        data.p = _formatStreetNumber(c.trim());
                                        return true;
                                    }
                                    return false;
                                };

                                var x = 0;
                                var p = _criteria[x].trim();
                                while (x < _criteria.length && !isPortal(p)) {
                                    x++;
                                    if (x < _criteria.length)
                                        p = p + _criteria[x];

                                }

                                if (data.p) {
                                    var _cr = _criteria;
                                    for (var h = 0; h < _cr.length; h++) {
                                        // validamos que lo que hemos deducido como portal, está en portal para no añadirlo a calle
                                        var inPortal = false;
                                        for (var c = 0; c < _cr[h].split('').length; c++) {
                                            if (data.p.indexOf(_cr[h][c]) > -1)
                                                inPortal = true;
                                        }

                                        if (inPortal) {
                                            var _p = _cr[h];

                                            _cr[h] = '';
                                            if (data.p == _formatStreetNumber(p))
                                                break;
                                        }
                                    }

                                    if (/^([^\,][a-zñáéíóúü\s*\-\.\(\)\/0-9]+)$/i.test(_criteria.reverse().join(' ').trim())) {
                                        var fs = [];
                                        var criteriaRev = _criteria.reverse();
                                        for (var chs = 0; chs < criteriaRev.length; chs++) {
                                            if (criteriaRev[chs].trim().length == 1) {
                                                fs.push(criteriaRev[chs].trim());
                                                criteriaRev[chs] = '';
                                            }
                                        }

                                        data.s = fs.length > 0 ? criteriaRev.reverse().join(' ').trim() + self._LIKE_PATTERN + fs.reverse().join(self._LIKE_PATTERN) : criteriaRev.reverse().join(' ').trim();
                                    }


                                    // nombre_de_calle = 137, 1, 20...
                                    // duplico la búsqueda para el caso de [Calle nombre_de_calle], municipio
                                    result.push({
                                        t: data.t,
                                        s: data.s + ' ' + data.p
                                    });
                                } else {
                                    data.s = criteria[i].trim();
                                }
                            }
                        }
                    }

                    result.push(data);
                    bindRoot(result);
                    return true;
                }

                return false;
            };
            var s_or_t = function (text, result) {
                var match = /^([^\,][a-zñáéíóúü\s*\-\.\(\)\/0-9]+)$/i.exec(text);
                if (match) {
                    if (root)
                        result.push({
                            t: root,
                            s: match[1].trim()
                        });
                    else result.push({
                        t: match[1].trim()
                    });

                    return true;
                }

                return false;
            };
            var sp = function (text, result) { // calle sin números con portal (cuando exista un municipio root establecido)
                var match = /^([^\,][a-zñáéíóúü\s*\-\.\(\)\/]+)\s*\,?\s*(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4})$/i.exec(text);
                if (match) {
                    if (root)
                        result.push({
                            t: root,
                            s: match[1].trim(),
                            p: _formatStreetNumber(match[2].trim())
                        });
                    else
                        result.push({
                            t: match[1].trim(),
                            s: match[2].trim()
                        });

                    return true;
                }

                return false;
            };
            var snp = function (text, result) { // calle puede contener números con portal (cuando exista un municipio root establecido)
                var match = /^([^\,][0-9\s*\-\.\(\)\/]+)\s*\,?\s*(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4})$/i.exec(text);
                if (match) {
                    result.push({
                        t: root,
                        s: match[1].trim(),
                        p: _formatStreetNumber(match[2].trim())
                    });

                    return true;
                }

                return false;
            };

            var test = function () {
                var tests = [function (text) { return text.length >= 3; },
                             function (text) { return /^\d+$/.test(text) ? false : (/^\d+\,\s*\d+$/.test(text) ? false : true); }];

                for (var i = 0; i < tests.length; i++) {
                    if (!tests[i].call(self, text))
                        return false;
                }

                return true;
            };


            if (test(text)) {
                var check = [tsp, tnsp, ts, st];
                if (root && text.split(',').length < 3)
                    check = [sp, snp, s_or_t].concat(check);
                else check = check.concat([sp, snp, s_or_t]);

                var ch = 0;
                while (ch < check.length && !check[ch].call(self, text, result)) { ch++; }
            }

            if (result.length > 0 && root) {
                var deferredRootLabel = new $.Deferred();
                if (!TC._search.rootLabel) {
                    $.when(self.getMunicipalities()).then(function (list) {
                        for (var i = 0; i < list.length; i++) {
                            if (list[i].id == root) {
                                TC._search.rootLabel = self.removePunctuation(list[i].label).toLowerCase();
                                break;
                            }
                        }

                        deferredRootLabel.resolve(TC._search.rootLabel);
                    });
                }
                else { deferredRootLabel.resolve(TC._search.rootLabel); }

                $.when(deferredRootLabel).then(function (rootLabel) {
                    if (rootLabel) {
                        var iData = result.length;


                        while (iData--) {
                            var data = result[iData];
                            if (rootLabel.indexOf(self.removePunctuation(data.s).toLowerCase()) > -1 && data.t == root) {
                                result.splice(iData, 1);
                                break;
                            }
                        }
                    }

                    deferred.resolve(result);
                });
            } else { deferred.resolve(result); }

            return deferred.promise();
        };

        pattern = normalizedCriteria(pattern);
        $.when(getObjectsTo(pattern, self.availableSearchTypes[TC.Consts.searchType.MUNICIPALITY].root || '', self.availableSearchTypes[TC.Consts.searchType.MUNICIPALITY].limit || false))
        .then(function (searchObjects) {
            if (searchObjects) {
                TC._search.data = results;

                if (TC._search.request) {
                    for (var i = 0; i < TC._search.request.length; i++) {
                        TC._search.request[i].abort();
                    }
                }

                TC._search.request = $.map(searchObjects, function (data, i) {
                    var dataRole = (data.p !== undefined) ? TC.Consts.searchType.NUMBER : (data.s !== undefined) ? TC.Consts.searchType.STREET : (self.allowedSearchTypes[TC.Consts.searchType.LOCALITY] ? TC.Consts.searchType.LOCALITY : TC.Consts.searchType.MUNICIPALITY);
                    if (dataRole && self.allowedSearchTypes[dataRole]) {
                        var _getPropertyValue = function (role, propertyName) {
                            return self.availableSearchTypes[role][propertyName];
                        };

                        var properties = _getPropertyValue(dataRole, 'outputProperties');
                        var dataIdProperties = _getPropertyValue(dataRole, 'dataIdProperty');

                        var _getParams = function (data, dataRole, properties, dataIdProperties) {
                            var _getFilter = function (data) {

                                var _getFilterNode = function (propertyName, propertyValue) {
                                    var getIsLikeNode = function (name, value) {

                                        var toEscape = /([\-\"\.\º\(\)\/])/g;
                                        if (toEscape.test(value)) {
                                            value = value.replace(toEscape, "\\$1");
                                        }

                                        if (value.toString().indexOf(self._LIKE_PATTERN) > -1)
                                            return '<Or><PropertyIsLike escape="\\" singleChar="_" wildCard="*" matchCase="false">' +
                                                        '<PropertyName>' + name + '</PropertyName>' +
                                                        '<Literal>' + value.toLowerCase() + '</Literal>' +
                                                   '</PropertyIsLike>' +
                                                   '<PropertyIsLike escape="\\" singleChar="_" wildCard="*" matchCase="false">' +
                                                        '<PropertyName>' + name + '</PropertyName>' +
                                                        '<Literal>' + value.toUpperCase() + '</Literal>' +
                                                   '</PropertyIsLike></Or>';
                                        else
                                            return '<PropertyIsEqualTo>' +
                                                        '<PropertyName>' + name + '</PropertyName>' +
                                                        '<Literal>' + value + '</Literal>' +
                                                   '</PropertyIsEqualTo>';
                                    };

                                    var r;
                                    if (!(propertyName instanceof Array) && (typeof propertyName !== 'string')) {
                                        var f = [];
                                        for (var key in propertyName) {
                                            if ((propertyName[key] instanceof Array) && propertyName[key].length > 1) {
                                                r = '<Or>';
                                                for (var i = 0; i < propertyName[key].length; i++) {
                                                    r += getIsLikeNode($.trim(propertyName[key][i]), propertyValue);
                                                }

                                                r += '</Or>';
                                                f.push('(<Filter xmlns="http://www.opengis.net/ogc">' + r + '</Filter>)');
                                            } else {
                                                var propName = propertyName[key];
                                                if ((propertyName[key] instanceof Array) && propertyName[key].length == 1)
                                                    propName = propertyName[key][0];

                                                f.push('(<Filter xmlns="http://www.opengis.net/ogc">' +
                                                            '<Or>' + getIsLikeNode($.trim(propName), propertyValue) + '</Or>' +
                                                        '</Filter>)');
                                            }
                                        }

                                        return f.join('');

                                    } else if (propertyName instanceof Array && propertyName.length > 1) {
                                        r = '<ogc:Or>';
                                        for (var i = 0; i < propertyName.length; i++) {
                                            r += getIsLikeNode($.trim(propertyName[i]), propertyValue);
                                        }

                                        return r += '</ogc:Or>';
                                    } else
                                        return getIsLikeNode((propertyName instanceof Array && propertyName.length === 1 ? $.trim(propertyName[0]) : $.trim(propertyName)), propertyValue);
                                };
                                var _getPropertyName = function (data, e) {
                                    return self.availableSearchTypes[(data.p !== undefined) ? TC.Consts.searchType.NUMBER : (data.s !== undefined) ? TC.Consts.searchType.STREET : (self.allowedSearchTypes[TC.Consts.searchType.LOCALITY] ? TC.Consts.searchType.LOCALITY : TC.Consts.searchType.MUNICIPALITY)]
                                                    .queryProperties[e + 'Property'];
                                };

                                var r = {};
                                r.multiL = false;
                                r.f = '';

                                var _f;
                                switch (dataRole) {
                                    case self.NUMBER:
                                        _f = [];
                                        _f.push(_getFilterNode(_getPropertyName(data, 't'), self.availableSearchTypes[TC.Consts.searchType.MUNICIPALITY].root ? data.t : self._LIKE_PATTERN + data.t + self._LIKE_PATTERN));
                                        _f.push(_getFilterNode(_getPropertyName(data, 's'), self._LIKE_PATTERN + data.s + self._LIKE_PATTERN));
                                        _f.push(_getFilterNode(_getPropertyName(data, 'p'), data.p + '*'));
                                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + '<ogc:And>' + _f.join('') + '</ogc:And>' + '</ogc:Filter>';
                                        break;
                                    case self.STREET:
                                        _f = [];
                                        _f.push(_getFilterNode(_getPropertyName(data, 't'), self.availableSearchTypes[TC.Consts.searchType.MUNICIPALITY].root ? data.t : self._LIKE_PATTERN + data.t + self._LIKE_PATTERN));
                                        _f.push(_getFilterNode(_getPropertyName(data, 's'), self._LIKE_PATTERN + data.s + self._LIKE_PATTERN));
                                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + '<ogc:And>' + _f.join('') + '</ogc:And>' + '</ogc:Filter>';
                                        break;
                                    case self.LOCALITY:
                                        r.f = _getFilterNode(_getPropertyName(data, 't'), self._LIKE_PATTERN + data.t + self._LIKE_PATTERN);
                                        r.multiL = true;
                                        break;
                                    case self.MUNICIPALITY: {
                                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + _getFilterNode(_getPropertyName(data, 't'), self._LIKE_PATTERN + data.t + self._LIKE_PATTERN) + '</ogc:Filter>';
                                        break;
                                    }
                                }

                                return r;
                            };
                            var filters = _getFilter(data);

                            var params = {
                                REQUEST: 'GetFeature',
                                SERVICE: 'WFS',
                                MAXFEATURES: 20,
                                VERSION: self.availableSearchTypes[dataRole].version,
                                OUTPUTFORMAT: self.availableSearchTypes[dataRole].outputFormat
                            };

                            var featureTypes = _getPropertyValue(dataRole, 'featureType');
                            if (!(featureTypes instanceof Array))
                                params.TYPENAME = self.availableSearchTypes[dataRole].featurePrefix ? self.availableSearchTypes[dataRole].featurePrefix + ':' + $.trim(featureTypes) : $.trim(featureTypes);
                            else {
                                var ft = [];
                                for (var i = 0; i < featureTypes.length; i++) {
                                    ft.push(self.availableSearchTypes[dataRole].featurePrefix ?
                                                self.availableSearchTypes[dataRole].featurePrefix + ':' + $.trim(featureTypes[i]) :
                                                $.trim(featureTypes[i]));
                                }

                                params.TYPENAME = ft.join(',');
                            }

                            var _getProperties = function (properties) {
                                if ((properties || '') !== '') {
                                    if (!(properties instanceof Array)) {
                                        var p = [];
                                        if (properties instanceof Object) {
                                            for (var key in properties) {
                                                var prop = properties[key][0];
                                                if (properties[key].length > 1)
                                                    prop = properties[key].join(',');

                                                p.push(prop);
                                            }
                                        }
                                        return p;
                                    }
                                    else
                                        return properties.join(',');
                                }
                            };
                            var _properties = _getProperties(properties);
                            var _ids = _getProperties(dataIdProperties);

                            if (_properties instanceof Array && _ids instanceof Array) {
                                params.PROPERTYNAME = '';
                                for (var i = 0; i < _properties.length; i++) {
                                    params.PROPERTYNAME += '(' + _properties[i] + ',' + _ids[i] + ')';
                                }
                            } else
                                params.PROPERTYNAME = _properties + ',' + _ids;

                            params.FILTER = filters.f;

                            return $.param(params);
                        };

                        var url = self.availableSearchTypes[dataRole].url;
                        return $.ajax({
                            url: url,
                            type: 'POST',
                            contentType: "application/x-www-form-urlencoded;charset=UTF-8",
                            dataType: 'text',
                            data: _getParams(data, dataRole, properties, dataIdProperties),
                            beforeSend: function () {
                                self.$list.html('<li><a class="tc-ctl-search-li-loading" href="#">Buscando...<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>');
                                self.$text.trigger("targetUpdated.autocomplete");
                            }
                        }).done(function (data) {
                            var features = parseFeatures(data, dataRole);
                            var _formatItems = function () {
                                for (var i = 0; i < features.length; i++) {
                                    var attributes = [], ids = [];
                                    var valueToAdd = '';
                                    var prop = properties;
                                    var dataIdProp = dataIdProperties;
                                    var strFormat = _getPropertyValue(dataRole, 'outputFormatLabel');
                                    var dataLayer = features[i].id.split('.').slice(0, 1).shift();

                                    if (!(properties instanceof Array)) {
                                        prop = properties[dataLayer];
                                        dataIdProp = dataIdProperties[dataLayer];
                                        strFormat = strFormat[dataLayer];
                                    }

                                    for (var j = 0; j < prop.length; j++) {
                                        attributes.push(features[i].data[prop[j]]);
                                    }

                                    for (var j = 0; j < dataIdProp.length; j++) {
                                        ids.push(features[i].data[dataIdProp[j]]);
                                    }

                                    valueToAdd = ((strFormat || '') !== '') ? strFormat.tcFormat(attributes) : attributes.join(" ");

                                    if (results.findByProperty('text', ((dataRole == self.MUNICIPALITY || dataRole == self.LOCALITY) ? attributes[0].toCamelCase() : valueToAdd.toCamelCase())) === undefined) {
                                        var text = valueToAdd.toCamelCase();

                                        var highlight = function () {
                                            var criteriaAll = self.$text.val().split(',');
                                            for (var i = 0; i < criteriaAll.length; i++) {
                                                var criteria = criteriaAll[i].trim().split(' ');
                                                for (var j = 0; j < criteria.length; j++) {

                                                    if (criteria[j].trim().length > 0) {

                                                        var originalText = text;
                                                        var replaceRegex = new RegExp(criteria[j].trim(), 'gi');
                                                        var newText = originalText.replace(replaceRegex, '<span class="highlight">$&</span>');
                                                        if (originalText !== newText) {
                                                            text = newText;
                                                        }
                                                    }
                                                }
                                            }

                                            return text;
                                        };


                                        results.push({
                                            text: text,
                                            label: text, //highlight(text),
                                            id: ids.join('#'),
                                            dataRole: dataRole,
                                            dataLayer: dataLayer
                                        });
                                    }
                                }
                            };
                            _formatItems();
                        }).fail(function (data) {
                            if (data.statusText !== 'abort')
                                alert('error');
                        });
                    }
                });
                $.when.apply($, TC._search.request).then(function () {
                    TC._search.request = null;
                    deferred.resolve(results);
                });
            } else {
                deferred.resolve(results);
            }
        });

        return deferred.promise();
    };

    ctlProto.search = function (pattern, callback) {
        var self = this;
        var results = [];

        pattern = $.trim(pattern);
        if (pattern.length > 0) {
            pattern = pattern.toLowerCase();

            var waiting = [];
            var addWaiting = function (fn) {
                var wait = new $.Deferred();
                waiting.push(wait);

                $.when(fn.call(self, pattern)).then(function (result) {
                    results = results.concat(result);
                    wait.resolve(results);
                });
            };

            var addressSearched = false;
            for (var allowedType in self.allowedSearchTypes) {
                switch (allowedType) {
                    case TC.Consts.searchType.CADASTRAL:
                        addWaiting(TC._search.searchTypes.CADASTRAL_SEARCH.parser);
                        break;
                    case TC.Consts.searchType.COORDINATES:
                        addWaiting(TC._search.searchTypes.COORDINATES_SEARCH.parser);
                        break;
                    case TC.Consts.searchType.MUNICIPALITY:
                    case TC.Consts.searchType.LOCALITY:
                    case TC.Consts.searchType.STREET:
                    case TC.Consts.searchType.NUMBER:
                        if (!addressSearched) {
                            addWaiting(TC._search.searchTypes.ADDRESS_SEARCH.parser);
                            addressSearched = true;
                        }
                        break;
                    default:
                        if (self.allowedSearchTypes[allowedType].parser)
                            addWaiting(self.allowedSearchTypes[allowedType].parser);
                        else
                            console.log('Falta implementación del método parser');
                        break;
                }
            }

            $.when.apply(self, waiting).then(function () {
                if (results)
                    TC._search.data = results = results.sort(function (a, b) {
                        var pattern = /(\d+)/;
                        var _a, _b = '';
                        if (pattern.test(a.label) && pattern.test(b.label)) {
                            _a = a.label.match(pattern)[1];
                            _b = b.label.match(pattern)[1];
                        } else {
                            _a = a.label;
                            _b = b.label;
                        }

                        if (_a > _b)
                            return 1;
                        else
                            if (_a < _b)
                                return -1;
                            else
                                return 0;
                    });

                if (callback)
                    callback(results);

                if (results.length === 0) {
                    self.cleanMap();

                    if (!self.layer || self.layer && self.layer.features.length === 0) {
                        self.$list.html('<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>');
                        self.$text.trigger("targetUpdated.autocomplete");
                    }
                }
            });
        }
        else self.cleanMap();
    };


    var setQueryableFeatures = function (features) {
        var self = this;

        if (features && features.length > 0) {
            for (var i = 0; i < features.length; i++) {
                if (features[i].showsPopup != self.queryableFeatures)
                    features[i].showsPopup = self.queryableFeatures;
            }
        }
    };
    ctlProto.goToResult = function (id) {
        var self = this;
        var goTo = null;

        if (!self.$toolsPanel)
            self.$toolsPanel = $('.tools-panel');

        // en pantallas pequeñas, colapsamos el panel de herramientas
        if (Modernizr.mq('(max-width: 30em)')) {
            self.$text.blur();
            self.$toolsPanel.addClass('right-collapsed');
        }


        self.cleanMap();

        var keepOnLooping = true;
        for (var allowedType in self.allowedSearchTypes) {
            if (keepOnLooping) {
                switch (allowedType) {
                    case TC.Consts.searchType.CADASTRAL:
                        goTo = TC._search.searchTypes.CADASTRAL_SEARCH.goTo.call(self, id);
                        if (goTo !== null) {
                            keepOnLooping = false;
                        }
                        break;
                    case TC.Consts.searchType.COORDINATES:
                        goTo = TC._search.searchTypes.COORDINATES_SEARCH.goTo.call(self, id);
                        if (goTo !== null) {
                            keepOnLooping = false;
                        }
                        break;
                    case TC.Consts.searchType.MUNICIPALITY:
                    case TC.Consts.searchType.LOCALITY:
                    case TC.Consts.searchType.STREET:
                    case TC.Consts.searchType.NUMBER:
                        goTo = TC._search.searchTypes.ADDRESS_SEARCH.goTo.call(self, id);
                        if (goTo === null) {
                            keepOnLooping = false;
                        }
                        break;
                    default:
                        if (self.allowedSearchTypes[allowedType].goTo) {
                            goTo = self.allowedSearchTypes[allowedType].goTo.call(self, id);
                            if (goTo !== null) {
                                keepOnLooping = false;
                            }
                        } else console.log('Falta implementación del método goTo');
                        break;
                }
            }
        }

        if (goTo) {
            goTo.params.id = TC.getUID();

            $.when(self.map.addLayer(goTo.params))
                .then(function (layer) {
                    self.layer = layer;
                    self.wrap.addEvents();

                    if (!self.loading)
                        self.loading = self.map.getControlsByClass("TC.control.LoadingIndicator")[0];

                    var wait;
                    wait = self.loading.addWait();

                    var onLoaded = function (data) {
                        self.map.off(TC.Consts.event.LAYERUPDATE, onLoaded);

                        if (data && data.layer == self.layer) {
                            if (goTo.callback)
                                goTo.callback();
                        }

                        self.loading.removeWait(wait);
                    };

                    self.map.on(TC.Consts.event.LAYERUPDATE, onLoaded);
                    self.map.one(TC.Consts.event.FEATURESADD, function (e) {
                        self.$list.hide('fast');

                        setQueryableFeatures.call(self, e.features);

                        if (goTo.onEndCallback)
                            goTo.onEndCallback();
                    });

                    // Las capas que no son WFS, no se llega a lanzar el evento TC.Consts.event.LAYERUPDATE, por tanto lo lanzo yo misma
                    if (goTo.params.type != TC.Consts.layerType.WFS)
                        self.map.$events.trigger($.Event(TC.Consts.event.LAYERUPDATE, { layer: layer }));
                });
        }
    };

    ctlProto.goToCoordinates = function (id) {
        var self = this;
        var goTo = {};
        if (/^X(\d+(?:\.\d+)?)Y(\d+(?:\.\d+)?)$/.test(id) || /^Lat((?:[+-]?)\d+(?:\.\d+)?)Lon((?:[+-]?)\d+(?:\.\d+)?)$/.test(id)) {

            var drawPoint = function () {
                var point = self.getPoint(id);
                var delta;
                var title;
                var deferred;

                if (point && self.insideLimit(point)) {
                    title = self.getLabel(id);
                    deferred = self.layer.addMarker(point, $.extend({}, self.map.options.styles.point, { title: title, group: title }));
                    delta = self.map.options.pointBoundsRadius;
                    self.map.setExtent([point[0] - delta, point[1] - delta, point[0] + delta, point[1] + delta]);
                } else {
                    var match = /^Lat((?:[+-]?)\d+(?:\.\d+)?)Lon((?:[+-]?)\d+(?:\.\d+)?)$/.exec(id);
                    id = self.LAT + match[2] + self.LON + match[1];
                    point = self.getPoint(id);

                    if (point && self.insideLimit(point)) {
                        title = self.getLabel(id);
                        deferred = self.layer.addMarker(point, $.extend({}, self.map.options.styles.point, { title: title, group: title }));
                        delta = self.map.options.pointBoundsRadius;
                        self.map.setExtent([point[0] - delta, point[1] - delta, point[0] + delta, point[1] + delta]);

                        self.$text.val(title);
                    }
                }

                $.when(deferred).then(function (feat) {
                    self.map.$events.trigger($.Event(TC.Consts.event.FEATURESADD, { layer: self.layer, features: [feat] }));
                });
            };
            goTo.params = {
                title: 'Búsquedas',
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                styles: {
                    point: {}
                }
            };

            goTo.callback = function () {
                drawPoint();
            };
            goTo.onEndCallback = function (e) {
                setTimeout(function () {
                    if (self.layer.features.length === 0) {
                        self.$list.html('<li><a class="tc-ctl-search-li-empty">' + self.OUTBBX_LABEL + '</a></li>');
                        self.$text.trigger("targetUpdated.autocomplete");
                    }

                }, 200);
            };
            return goTo;
        }

        return null;
    };

    ctlProto.goToCadastralRef = function (id) {
        var self = this;
        var goTo = {};
        if (/^\M(\d+)\P(\d{1,2})Par{1}(\d{1,4})/g.test(id)) {
            var match = /^\M(\d+)\P(\d{1,2})Par{1}(\d{1,4})/g.exec(id);

            goTo.params = {
                title: 'Búsquedas',
                stealth: true,
                type: TC.Consts.layerType.WFS,
                url: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].url,
                version: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].version,
                geometryName: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].geometryName,
                featurePrefix: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].featurePrefix,
                featureType: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].featureType,
                properties: [
                    { name: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].queryProperties.municipality, value: $.trim(match[1]), type: TC.Consts.comparison.EQUAL_TO },
                    { name: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].queryProperties.polygon, value: $.trim(match[2]), type: TC.Consts.comparison.EQUAL_TO },
                    { name: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].queryProperties.parcel, value: $.trim(match[3]), type: TC.Consts.comparison.EQUAL_TO }
                ],
                outputFormat: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].outputFormat,
                styles: self.availableSearchTypes[TC.Consts.searchType.CADASTRAL].styles
            };

            goTo.callback = function (e) {

                self.map.one(TC.Consts.event.FEATURESADD, function () {
                    self.$list.hide('fast');
                });

                if (self.layer.features.length === 0) {
                    self.$list.html('<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>');
                    self.$text.trigger("targetUpdated.autocomplete");
                }
            };

            return goTo;
        }

        return null;
    };

    ctlProto.goToAddress = function (id) {
        var self = this;
        var goTo = {};
        var feature;

        var isComplexObject = function (source) {
            if (source instanceof Object)
                for (var key in source)
                    if (source[key] instanceof Object)
                        return true;
        };

        var getElement = function () {
            for (var i = 0; i < TC._search.data.length; i++) {
                if (TC._search.data[i].id == id)
                    return TC._search.data[i];
            }
        };
        var getProperties = function (source, dataLayer) {
            var props = [];
            var _id = id.split('#');

            if (source instanceof Object && source.hasOwnProperty(dataLayer))
                source = source[dataLayer];

            for (var i = 0; i < source.length; i++) {
                props.push({ name: source[i], value: _id[i], type: TC.Consts.comparison.EQUAL_TO });
            }

            return props;
        };

        feature = getElement();
        if (feature && feature.dataRole) {
            var searchType = self.availableSearchTypes[feature.dataRole];
            var renderFeatureType = searchType.renderFeatureType;
            var layerOptions = {
                id: TC.getUID(),
                title: 'Búsquedas',
                stealth: true,
                type: TC.Consts.layerType.WFS,
                url: searchType.url,
                version: searchType.version,
                geometryName: searchType.geometryName,
                featurePrefix: searchType.featurePrefix,
                featureType: feature.dataLayer,
                properties: getProperties(searchType.dataIdProperty, feature.dataLayer),
                outputFormat: searchType.outputFormat,
                styles: searchType.styles
            };
            if (!renderFeatureType) {

                $.when(self.map.addLayer(layerOptions)).then(function (layer) {
                    self.layer = layer;
                    self.wrap.addEvents();

                    self.map.one(TC.Consts.event.FEATURESADD, function (e) {
                        self.$list.hide('fast');

                        setQueryableFeatures.call(self, e.features);

                        if (goTo.onEndCallback)
                            goTo.onEndCallback();
                    });

                    if (goTo.callback)
                        goTo.callback();
                });

                return null;
            } else {
                $.when(self.map.addLayer(layerOptions), self.map.addLayer($.extend({}, layerOptions, {
                    id: TC.getUID(),
                    featureType: renderFeatureType,
                    properties: getProperties(searchType.dataIdProperty, renderFeatureType),
                    styles: searchType.renderStyles
                })))
                    .then(function (layer, layerRender) {
                        self._layers = [layer, layerRender];
                        self.layer = layer;
                        self.wrap.addEvents();

                        self.map.one(TC.Consts.event.FEATURESADD, function (e) {
                            self.$list.hide('fast');

                            setQueryableFeatures.call(self, e.features);

                            if (goTo.onEndCallback)
                                goTo.onEndCallback();
                        });

                        if (goTo.callback)
                            goTo.callback();
                    });

                return null;
            }
        }

        return false;
    };

    ctlProto.getPoint = function (pattern) {
        var self = this;
        var isMapGeo = self.map.wrap.isGeo();
        var point;
        var match = /^X(\d+(?:\.\d+)?)Y(\d+(?:\.\d+)?)$/.exec(pattern);
        if (match && match.length === 3) {
            point = [parseFloat(match[1]), parseFloat(match[2])];
            if (isMapGeo) {
                point = TC.Util.reproject(point, self.map.options.utmCrs, self.map.crs);
            }
        }
        else {
            match = /^Lat((?:[+-]?)\d+(?:\.\d+)?)Lon((?:[+-]?)\d+(?:\.\d+)?)$/.exec(pattern);
            if (match && match.length === 3) {
                point = [parseFloat(match[2]), parseFloat(match[1])];
                if (!isMapGeo) {
                    return TC.Util.reproject(point, self.map.options.geoCrs, self.map.crs);
                }
            }

            match = /^Lon((?:[+-]?)\d+(?:\.\d+)?)Lat((?:[+-]?)\d+(?:\.\d+)?)$/.exec(pattern);
            if (match && match.length === 3) {
                point = [parseFloat(match[2]), parseFloat(match[1])];
                if (!isMapGeo) {
                    return TC.Util.reproject(point, self.map.options.geoCrs, self.map.crs);
                }
            }
        }

        return point;
    };

    ctlProto.insideLimit = function (point) {
        var self = this;
        var getIntersectsBounds = function (extent, point) {
            return point[0] >= extent[0] && point[0] <= extent[2] && point[1] >= extent[1] && point[1] <= extent[3];
        };

        if (getIntersectsBounds(self.map.options.maxExtent, point)) {
            return true;
        }

        return false;
    };

    ctlProto.getPattern = function () {
        var self = this;
        return self.$text.val();
    };

    ctlProto.getLabel = function (id) {
        var self = this;
        var result = id;
        if (id.match(new RegExp('^(?:' + self.LAT + '[-\\d])|(?:' + self.UTMX + '[\\d])'))) {
            result = result.replace(self.LAT, self.LAT_LABEL).replace(self.LON, ', ' + self.LON_LABEL).replace(self.UTMX, self.UTMX_LABEL).replace(self.UTMY, ', ' + self.UTMY_LABEL);
        } else if (id.match(new RegExp('^(?:' + self.LON + '[-\\d])'))) {
            result = result.replace(self.LON, self.LON_LABEL).replace(self.LAT, ', ' + self.LAT_LABEL);
        } else if (id.match(new RegExp('^(?:(\\' + self.MUN + '{1})(.*)' + '(\\' + self.POL + '{1})' + '(\\d{1,2})' + '(\\' + self.PAR + '{1})' + '(\\d{1,4}))'))) {
            var match = id.match(new RegExp('^(?:(\\' + self.MUN + '{1})(.*)' + '(\\' + self.POL + '{1})' + '(\\d{1,2})' + '(\\' + self.PAR + '{1})' + '(\\d{1,4}))'));
            result = self.MUN_LABEL + match[2] + ', ' + self.POL_LABEL + match[4] + ', ' + self.PAR_LABEL + match[6];
        }
        return result;
    };

    ctlProto.removePunctuation = function (text) {
        text = text || '';
        var result = new Array(text.length);
        var map = {
            'á': 'a',
            'Á': 'A',
            'é': 'e',
            'É': 'E',
            'í': 'i',
            'Í': 'I',
            'ó': 'o',
            'Ó': 'O',
            'ú': 'u',
            'ü': 'u',
            'Ú': 'U',
            'Ü': 'U'
        };
        for (var i = 0, len = text.length; i < len; i++) {
            result[i] = map[text.charAt(i)] || text.charAt(i);
        }
        return result.join('');
    };

    ctlProto.decodeEntities = function (text) {
        return $('<div/>').html(text).text();
    };

})();


if (!String.prototype.tcFormat) {
    String.prototype.tcFormat = function () {
        var args = (arguments || [""])[0];
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ?
              args[number]
              : match
            ;
        });
    };
}


if (!String.prototype.splitRemoveWhiteSpaces) {
    String.prototype.splitRemoveWhiteSpaces = function (separator) {
        var _arr = [];
        var arr = this.split(separator);
        for (var i = 0; i < arr.length; i++)
            if ($.trim(arr[i]).length > 0)
                _arr.push($.trim(arr[i]));

        return _arr;
    };
}


if (!String.prototype.toCamelCase) {
    String.prototype.toCamelCase = function () {
        var _value = this.toLowerCase();
        var match = this.toLowerCase().match(/\W+(.)/g);
        if (match) {
            for (var i = 0; i < match.length; i++) {
                if (/[;:.<>\{\}\[\]\/\s()]/g.test(match[i]))
                    _value = _value.replace(match[i], match[i].toUpperCase());
            }
        }

        return _value.charAt(0).toUpperCase() + _value.substring(1);
    };
}


if (!Array.prototype.hasOwnProperty('findByProperty')) {
    Object.defineProperty(Array.prototype, "findByProperty", {
        enumerable: false,
        writable: true,
        value: function (propertyName, value) {
            for (var i = 0; i < this.length; i++) {
                if (this[i][propertyName] == value)
                    return this[i];
            }
        }
    });
}

//if (!Array.prototype.findByProperty) {
//    Array.prototype.findByProperty = function (propertyName, value) {
//        for (var i = 0; i < this.length; i++) {
//            if (this[i][propertyName] == value)
//                return this[i];
//        }
//    };
//}
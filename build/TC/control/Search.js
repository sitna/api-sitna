(function () {
    // Polyfill window.performance.now
    if (!window.performance) {
        window.performance = {
            offset: Date.now(),
            now: function () {
                return Date.now() - this.offset;
            }
        };
    } else if (window.performance && !window.performance.now) {
        window.performance.offset = Date.now();
        window.performance.now = function () {
            return Date.now() - window.performance.offset;
        };
    }
}());

TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}


var SearchType = function (type, options, parent) {
    var self = this;

    self.parent = parent;

    self._featureTypes = [];

    $.extend(self, options);

    self.typeName = type;

    self._throwConfigError = function () {
        var self = this;

        throw new Error('Error en la configuración de la búsqueda: ' + self.typeName);
    };

    self.getFeatureTypes = function (toFilter) {
        var self = this;

        if (toFilter) {
            return self.featureType instanceof Array ? self.featureType : [self.featureType];
        }

        if (self._featureTypes.length === 0) {
            var type_featureType = self.featureType instanceof Array ? self.featureType : [self.featureType];
            var type_renderFeatureType = self.renderFeatureType ? self.renderFeatureType instanceof Array ? self.renderFeatureType : [self.renderFeatureType] : [];
            self._featureTypes = type_featureType.concat(type_renderFeatureType);
        }

        return self._featureTypes;
    };

    self.isFeatureOfThisType = function (id) {
        var self = this;

        return self.getFeatureTypes().indexOf(id) > -1;
    };

    self.getStyleByFeatureType = function (featureType) {
        var self = this;

        if (self.getFeatureTypes().indexOf(featureType) > -1) {
            return self.styles[self.getFeatureTypes().indexOf(featureType)];
        }

        return null;
    };

    var getColor = function (css, geomType, featureType) {
        var self = this;

        var getValue = function (style, geomType, css) {
            if (geomType) {
                if (style.hasOwnProperty(geomType) && style[geomType].hasOwnProperty(css)) {
                    return style[geomType][css];
                }
            } else {
                for (var geomType in style) {
                    if (style[geomType].hasOwnProperty(css)) {
                        return style[geomType][css];
                    }
                }
            }
        };

        if (featureType) {
            var style = self.getStyleByFeatureType(featureType);
            return getValue(style, geomType, css);
        } else {
            for (var i = 0; i < self.styles.length; i++) {
                var style = self.styles[i];
                var color = getValue(style, geomType, css);
                if (color) {
                    return color;
                }
            }
        }
    };

    self.getSuggestionListHead = function () {
        var self = this;

        var headerData, label, color;

        if (typeof self.suggestionListHead === "function") {
            headerData = self.suggestionListHead();
            label = headerData.label;
            color = [{
                color: headerData.color,
                title: headerData.label
            }];
        } else {
            headerData = self.suggestionListHead;
            label = self.parent.getLocaleString(headerData.label);

            // color es string que es el atributo CSS. El valor se obtiene de la 1º coincidencia encontrada en styles
            if (typeof headerData.color === "string") {
                color = [{
                    color: getColor.call(self, headerData.color),
                    title: label
                }];
            } else if (headerData.color instanceof Array) { // color es un array de objetos, con nombre de featureType como clave
                var featureTypes = self.getFeatureTypes();
                if (headerData.color.length === featureTypes.length) {
                    color = headerData.color.map(function (elm, i) {
                        return {
                            color: getColor.call(self, elm[featureTypes[i]].color.css, elm[featureTypes[i]].color.geomType, featureTypes[i]),
                            title: self.parent.getLocaleString(elm[featureTypes[i]].title) || label
                        }
                    });
                } else {
                    self._throwConfigError();
                }
            } else if (typeof headerData.color === "object") { // color es un objeto con atributo css y tipo de geometría
                color = [{
                    color: getColor.call(self, headerData.color.css, headerData.color.geomType),
                    title: label
                }];
            }
        }

        if (label && color) {
            var liHTML = '<li header><span class="header">' + label + '</span>';

            liHTML += color.map(function (elm) {
                if (elm.color) {
                    return '<span class="header-color" title="' + elm.title + '" style="color: ' + elm.color + ';"></span>';
                }
            }).join('') + '</li>';

            return liHTML;

        } else {
            self._throwConfigError();
        }
    };

    self.getSuggestionListElements = function (data) {
        var self = this;
        var results = [];

        var areSame = function (a, b) {
            switch (true) {
                case typeof (a) === "number":
                    if (a === b) {
                        return true;
                    }
                    break;
                case typeof (a) === "string":
                    if (!isNaN(a) || !isNaN(b)) {
                        if (a === b) {
                            return true;
                        }
                    } else {
                        if (TC.Util.getSoundexDifference(a.trim().soundex(), b.trim().soundex()) >= 3) {
                            return true;
                        }
                    }
                    break;
            }

            return false;
        };
        var getUnique = function (inputArray) {
            var outputArray = [];
            for (var i = 0; i < inputArray.length; i++) {
                if ((jQuery.inArray(inputArray[i], outputArray)) == -1) {
                    outputArray.push(inputArray[i]);
                }
            }

            return outputArray;
        };
        var intoResults = function (compareData) {
            for (var r = 0; r < results.length; r++) {
                var length = 0;
                var isThere = [];
                for (var property in compareData) {
                    isThere.push(areSame(compareData[property], results[r].properties[property]));
                    length++;
                }
                if (isThere.filter(function (i) { return i; }).length === length) {
                    return true;
                }

            }

            return false;
        };

        var features = self.parseFeatures(data);

        features.forEach(function (feature) {
            var attributes = [], ids = [];
            var valueToAdd = '';

            var properties = self.outputProperties;
            var dataIdProperties = self.dataIdProperty;

            var strFormat = self.outputFormatLabel;
            var dataLayer = feature.id.split('.').slice(0, 1).shift();

            if (!(self.outputProperties instanceof Array)) {
                properties = self.outputProperties[dataLayer];
                dataIdProperties = self.dataIdProperty[dataLayer];
                strFormat = strFormat[dataLayer];
            }

            for (var j = 0; j < properties.length; j++) {
                attributes.push(feature.data[properties[j]]);
            }

            for (var j = 0; j < dataIdProperties.length; j++) {
                ids.push(feature.data[dataIdProperties[j]]);
            }

            var compareData = {};
            for (var p = 0; p < self.outputProperties.length; p++) {
                compareData[self.outputProperties[p]] = attributes[p];
            }

            if (attributes instanceof Array && strFormat && getUnique(attributes).length > 1) {
                valueToAdd = strFormat.tcFormat(attributes);
            }
            else if (attributes instanceof Array && getUnique(attributes).length == 1) {
                valueToAdd = attributes[0];
            }

            var text = valueToAdd.toCamelCase();

            if (!(intoResults(compareData))) {

                results.push({
                    text: text,
                    label: text,
                    id: ids.join('#'),
                    dataRole: self.typeName,
                    dataLayer: dataLayer,
                    properties: compareData
                });
            }
        });

        return results;
    };

    self.parseFeatures = function (data) {
        var parser;
        if (self.outputFormat === TC.Consts.format.JSON) {
            parser = new TC.wrap.parser.JSON();
        }
        else {
            parser = new TC.wrap.parser.WFS({
                featureNS: self.featurePrefix,
                featureType: self.featureType
            });
        }
        return parser.read(data);
    };

    self.getPattern = function () {
        var self = this;

        if (typeof self.pattern === "function") {
            return self.pattern();
        } else {
            return self.pattern;
        }
    };

    self.filter = (function (self) {

        return {
            getPropertyValue: function (role, propertyName) {
                return self.getSearchTypeByRole(role)[propertyName];
            },
            getIsLikeNode: function (name, value) {
                var toEscape = /([\-\"\.\º\(\)\/])/g;
                if (toEscape.test(value)) {
                    value = value.replace(toEscape, "\\$1");
                }

                if (value.toString().indexOf(self.parent._LIKE_PATTERN) > -1)
                    return '<Or><PropertyIsLike escape="\\" singleChar="_" wildCard="*" matchCase="false">' +
                        '<PropertyName>' + name + '</PropertyName>' +
                        '<Literal>' + value.toLowerCase().replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;") + '</Literal>' +
                        '</PropertyIsLike>' +
                        '<PropertyIsLike escape="\\" singleChar="_" wildCard="*" matchCase="false">' +
                        '<PropertyName>' + name + '</PropertyName>' +
                        '<Literal>' + value.toUpperCase().replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;") + '</Literal>' +
                        '</PropertyIsLike></Or>';
                else
                    return '<PropertyIsEqualTo>' +
                        '<PropertyName>' + name + '</PropertyName>' +
                        '<Literal>' + value.replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;") + '</Literal>' +
                        '</PropertyIsEqualTo>';
            },
            getFunctionStrMatches: function (name, value) {
                var toEscape = /([\-\"\º\(\)\/])/g;
                if (toEscape.test(value)) {
                    value = value.replace(toEscape, "\\$1");
                }

                if (value.toString().indexOf(self.parent._LIKE_PATTERN) > -1) {

                    var pattern = value;
                    pattern = pattern.replace(/a/gi, "[aáà]");
                    pattern = pattern.replace(/e/gi, "[eéè]");
                    pattern = pattern.replace(/i/gi, "[iíì]");
                    pattern = pattern.replace(/o/gi, "[oóò]");
                    pattern = pattern.replace(/u/gi, "[uúüù]");

                    return '<ogc:PropertyIsEqualTo> ' +
                                '<ogc:Function name="strMatches"> ' +
                                    '<ogc:PropertyName>' + name + '</ogc:PropertyName> ' +
                                    '<ogc:Literal>' + '(?i)' + pattern.replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;") + '</ogc:Literal> ' +
                                '</ogc:Function> ' +
                                '<ogc:Literal>true</ogc:Literal> ' +
                            '</ogc:PropertyIsEqualTo>';
                }
                else {
                    return '<PropertyIsEqualTo>' +
                        '<PropertyName>' + name + '</PropertyName>' +
                        '<Literal>' + value.replace(/\</gi, "&lt;").replace(/\>/gi, "&gt;") + '</Literal>' +
                        '</PropertyIsEqualTo>';
                }
            },
            getFilterNode: function (propertyName, propertyValue) {
                var r;

                var fn = self.filter.getIsLikeNode;

                if (self.filterByMatch) {

                    fn = self.filter.getFunctionStrMatches;

                    var regex = new RegExp('\\' + self.parent._LIKE_PATTERN, 'gi');
                    propertyValue = propertyValue.replace(regex, self._MATCH_PATTERN);
                }

                if (!(propertyName instanceof Array) && (typeof propertyName !== 'string')) {
                    var f = [];
                    for (var key in propertyName) {
                        if ((propertyName[key] instanceof Array) && propertyName[key].length > 1) {
                            r = '<Or>';
                            for (var i = 0; i < propertyName[key].length; i++) {
                                r += fn($.trim(propertyName[key][i]), propertyValue);
                            }

                            r += '</Or>';
                            f.push('(<Filter xmlns="http://www.opengis.net/ogc">' + r + '</Filter>)');
                        } else {
                            var propName = propertyName[key];
                            if ((propertyName[key] instanceof Array) && propertyName[key].length == 1)
                                propName = propertyName[key][0];

                            f.push('(<Filter xmlns="http://www.opengis.net/ogc">' +
                                '<Or>' + fn($.trim(propName), propertyValue) + '</Or>' +
                                '</Filter>)');
                        }
                    }

                    return f.join('');

                } else if (propertyName instanceof Array && propertyName.length > 1) {
                    r = '<ogc:Or>';
                    for (var i = 0; i < propertyName.length; i++) {
                        r += fn($.trim(propertyName[i]), propertyValue);
                    }

                    return r += '</ogc:Or>';
                } else
                    return fn((propertyName instanceof Array && propertyName.length === 1 ? $.trim(propertyName[0]) : $.trim(propertyName)), propertyValue);
            },
            getFilter: function (data) {
                var r = {};
                r.multiL = false;
                r.f = '';

                var _f;

                var bindRootFilterNode = function (filtersArr, dataT) {
                    var rootFilters = [];

                    if (dataT != self.parent.rootCfg.active.root) {
                        // GLS: Si llego aquí, significa que el usuario está indicando la población, 
                        // por tanto no añado todas las raíces posibles, añado la población que ha indicado (validando antes contra rootLabel)                     
                        var item = dataT.split('#');

                        for (var j = 0; j < self.parent.rootCfg.active.dataIdProperty.length; j++) {

                            if (j == 0 && self.parent.rootCfg.active.dataIdProperty.length > 1) {
                                rootFilters.push('<ogc:And>');
                            }

                            rootFilters.push(self.filter.getFilterNode(self.parent.rootCfg.active.dataIdProperty[j], item.length > j ? item[j] : item[0]));

                            if (j == self.parent.rootCfg.active.dataIdProperty.length - 1 && self.parent.rootCfg.active.dataIdProperty.length > 1) {
                                rootFilters.push('</ogc:And>');
                            }
                        }
                    } else {
                        for (var i = 0; i < self.parent.rootCfg.active.root.length; i++) {
                            var item = self.parent.rootCfg.active.root[i];

                            if (i == 0 && self.parent.rootCfg.active.root.length > 1) {
                                rootFilters.push('<ogc:Or>');
                            }

                            for (var j = 0; j < self.parent.rootCfg.active.dataIdProperty.length; j++) {

                                if (j == 0 && self.parent.rootCfg.active.dataIdProperty.length > 1) {
                                    rootFilters.push('<ogc:And>');
                                }

                                rootFilters.push(self.filter.getFilterNode(self.parent.rootCfg.active.dataIdProperty[j], item.length > j ? item[j] : item[0]));

                                if (j == self.parent.rootCfg.active.dataIdProperty.length - 1 && self.parent.rootCfg.active.dataIdProperty.length > 1) {
                                    rootFilters.push('</ogc:And>');
                                }
                            }
                        }

                        if (self.parent.rootCfg.active.root.length > 1) {
                            rootFilters.push('</ogc:Or>');
                        }
                    }

                    return filtersArr.concat(rootFilters);
                };

                switch (true) {
                    case self.typeName === TC.Consts.searchType.NUMBER:
                        _f = [];
                        if (!(self.parent.rootCfg.active) && (/(\<|\>|\<\>)/gi.exec(data.t) || /(\<|\>|\<\>)/gi.exec(data.s))) {
                            var match = /(\<|\>|\<\>)/gi.exec(data.t);
                            if (match)

                                _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t.substring(0, data.t.indexOf(match[0])).trim() + self.parent._LIKE_PATTERN));
                            else {
                                if (self.parent.rootCfg.active) {
                                    _f = bindRootFilterNode(_f, data.t);
                                }
                                else {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN));
                                }
                            }

                            match = /(\<|\>|\<\>)/gi.exec(data.s);
                            if (match)
                                _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s.substring(0, data.s.indexOf(match[0])).trim() + self.parent._LIKE_PATTERN));
                            else _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s + self.parent._LIKE_PATTERN));
                        }
                        else {
                            if (self.parent.rootCfg.active) {
                                _f = bindRootFilterNode(_f, data.t);
                            } else {
                                _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN));
                            }
                            _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s + self.parent._LIKE_PATTERN));
                        }

                        _f.push(self.filter.getFilterNode(self.queryProperties.thirdQueryWord, data.p + self.parent._LIKE_PATTERN));

                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + '<ogc:And>' + _f.join('') + '</ogc:And>' + '</ogc:Filter>';

                        break;
                    case self.typeName === TC.Consts.searchType.STREET:
                        _f = [];

                        if (!(self.parent.rootCfg.active) && (/(\<|\>|\<\>)/gi.exec(data.t) || /(\<|\>|\<\>)/gi.exec(data.s))) {
                            var match = /(\<|\>|\<\>)/gi.exec(data.t);
                            if (match)
                                _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t.substring(0, data.t.indexOf(match[0])).trim() + self.parent._LIKE_PATTERN));
                            else {
                                if (self.parent.rootCfg.active) {
                                    _f = bindRootFilterNode(_f, data.t);
                                }
                                else {
                                    _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN));
                                }
                            }

                            match = /(\<|\>|\<\>)/gi.exec(data.s);
                            if (match)
                                _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s.substring(0, data.s.indexOf(match[0])).trim() + self.parent._LIKE_PATTERN));
                            else _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s + self.parent._LIKE_PATTERN));
                        } else {

                            if (self.parent.rootCfg.active) {
                                _f = bindRootFilterNode(_f, data.t);
                            }
                            else {
                                _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN));
                            }
                            _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s + self.parent._LIKE_PATTERN));
                        }
                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + '<ogc:And>' + _f.join('') + '</ogc:And>' + '</ogc:Filter>';
                        break;
                    case self.typeName === TC.Consts.searchType.LOCALITY:
                        r.f = self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN);
                        r.multiL = true;
                        break;                                            // GLS: consulta de 2 niveles (carretera con pk / topónimo con municipio)
                    case self.queryProperties.hasOwnProperty('secondQueryWord'):
                        var _f = [];
                        _f.push(self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN));
                        _f.push(self.filter.getFilterNode(self.queryProperties.secondQueryWord, self.parent._LIKE_PATTERN + data.s + self.parent._LIKE_PATTERN));
                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + '<ogc:And>' + _f.join('') + '</ogc:And>' + '</ogc:Filter>';
                        break;
                    default: // GLS: consulta de 1 único nivel (municipio, casco urbano, carretera)
                        r.f = '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' + self.filter.getFilterNode(self.queryProperties.firstQueryWord, self.parent._LIKE_PATTERN + data.t + self.parent._LIKE_PATTERN) + '</ogc:Filter>';
                        break;
                }

                return r;
            },
            getParams: function (data) {
                var filters = self.filter.getFilter(data);

                var params = {
                    REQUEST: 'GetFeature',
                    SERVICE: 'WFS',
                    MAXFEATURES: 500,
                    VERSION: self.version,
                    OUTPUTFORMAT: self.outputFormat
                };

                var featureTypes = self.getFeatureTypes(true);
                if (!(featureTypes instanceof Array))
                    params.TYPENAME = self.featurePrefix ? self.featurePrefix + ':' + $.trim(featureTypes) : $.trim(featureTypes);
                else {
                    var ft = [];
                    for (var i = 0; i < featureTypes.length; i++) {
                        ft.push(self.featurePrefix ?
                            self.featurePrefix + ':' + $.trim(featureTypes[i]) :
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
                var _properties = _getProperties(self.outputProperties);
                var _ids = _getProperties(self.dataIdProperty);

                if (_properties instanceof Array && _ids instanceof Array) {
                    params.PROPERTYNAME = '';
                    for (var i = 0; i < _properties.length; i++) {
                        params.PROPERTYNAME += '(' + _properties[i] + ',' + _ids[i] + ')';
                    }
                } else
                    params.PROPERTYNAME = _properties + ',' + _ids;

                params.FILTER = filters.f;

                return $.param(params);
            },
            getGoToFilter: function (id) {
                var props = [];
                var _id = id.split('#');

                var source = self.dataIdProperty;
                var dataLayer = self.getFeatureTypes();

                if (source && dataLayer) {

                    if (id.indexOf('#') > -1 && dataLayer instanceof Array && dataLayer.length > 1) {
                        for (var i = 0; i < dataLayer.length; i++) {

                            for (var j = 0; j < source[dataLayer[i]].length; j++) {
                                props.push({ name: source[dataLayer[i]][j], value: _id[j] });
                            }
                        }
                    } else if (id.indexOf('#') == -1 && dataLayer instanceof Array) {
                        var src = source;

                        for (var i = 0; i < dataLayer.length; i++) {
                            if (!props.hasOwnProperty(dataLayer[i])) {

                                if (src instanceof Object && source.hasOwnProperty(dataLayer[i]))
                                    src = source[dataLayer[i]];

                                for (var j = 0; j < src.length; j++) {
                                    if (j < _id.length)
                                        props.push({ name: src[j], value: _id[j] });
                                }
                            }
                        }
                    }
                    else {
                        if (source instanceof Object && source.hasOwnProperty(dataLayer)) {
                            source = source[dataLayer];
                        }

                        for (var i = 0; i < source.length; i++) {
                            props.push({ name: source[i], value: _id[i] });
                        }
                    }
                }

                return self.filter.transformFilter(props);
            },
            transformFilter: function (properties) {
                var self = this;

                if (!TC.filter) {
                    TC.syncLoadJS(TC.apiLocation + 'TC/Filter');
                }

                if (properties && properties instanceof Array) {
                    var filters = properties.map(function (elm) {
                        if (elm.hasOwnProperty("type")) {
                            switch (true) {
                                case elm.type == TC.Consts.comparison.EQUAL_TO: {
                                    return new TC.filter.equalTo(elm.name, elm.value);
                                }
                            }
                        } else {
                            return new TC.filter.equalTo(elm.name, elm.value);
                        }
                    });

                    if (filters.length > 1) {
                        return TC.filter.and.apply(null, filters);
                    } else {
                        return filters[0];
                    }
                }
            }
        }
    })(self);
};

TC.control.Search = function () {
    var self = this;
    TC.Control.apply(self, arguments);

    TC.Consts.event.TOOLSCLOSE = TC.Consts.event.TOOLSCLOSE || 'toolsclose.tc';

    self.url = '//idena.navarra.es/ogc/wfs';
    self.version = '1.1.0';
    self.featurePrefix = 'IDENA';

    self.layerPromise = $.Deferred();

    if (self.options && self.options.url) {
        self.url = self.options.url;
    }

    self._LIKE_PATTERN = '*';
    self._MATCH_PATTERN = '.*';

    self.UTMX = 'X';
    self.UTMY = 'Y';
    self.LON = 'Lon';
    self.LAT = 'Lat';

    self.UTMX_LABEL = 'X: ';
    self.UTMY_LABEL = 'Y: ';
    self.LON_LABEL = 'Lon: ';
    self.LAT_LABEL = 'Lat: ';

    self.MUN = 'Mun';
    self.POL = 'Pol';
    self.PAR = 'Par';

    self.MUN_LABEL = 'Mun: ';
    self.POL_LABEL = 'Pol: ';
    self.PAR_LABEL = 'Par: ';

    self.availableSearchTypes = {};

    self.availableSearchTypes[TC.Consts.searchType.CADASTRAL] = {
        suggestionRoot: null,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        searchWeight: 3,
        featureType: ['CATAST_Pol_ParcelaUrba', 'CATAST_Pol_ParcelaRusti', 'CATAST_Pol_ParcelaMixta'],
        municipality: {
            featureType: 'CATAST_Pol_Municipio',
            labelProperty: 'MUNICIPIO',
            idProperty: 'CMUNICIPIO'
        },
        queryProperties: {
            firstQueryWord: 'CMUNICIPIO',
            secondQueryWord: 'POLIGONO',
            thirdQueryWord: 'PARCELA'
        },
        suggestionListHead: {
            label: "search.list.cadastral",
            color: [
                {
                    CATAST_Pol_ParcelaUrba: {
                        title: "search.list.cadastral.urban",
                        color: {
                            geomType: "polygon",
                            css: "strokeColor"
                        }
                    }
                },
                {
                    CATAST_Pol_ParcelaRusti: {
                        title: "search.list.cadastral.rustic",
                        color: {
                            geomType: "polygon",
                            css: "strokeColor"
                        }
                    }
                },
                {
                    CATAST_Pol_ParcelaMixta: {
                        title: "search.list.cadastral.mixed",
                        color: {
                            geomType: "polygon",
                            css: "strokeColor"
                        }
                    }
                }
            ]
        },
        styles: [
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#136278',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            },
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#0c8b3d',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            },
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#e5475f',
                    strokeWidth: 2,
                    strokeOpacity: 1
                },
            }
        ],
        parser: self.getCadastralRef,
        goTo: self.goToCadastralRef,
        goToIdFormat: self.MUN + '{0}' + self.POL + '{1}' + self.PAR + '{2}',
        idPropertiesIdentifier: '#'
    };

    self.availableSearchTypes[TC.Consts.searchType.COORDINATES] = {
        parser: self.getCoordinates,
        goTo: self.goToCoordinates,
        searchWeight: 4,
        label: null,
        suggestionListHead: function (text) {
            return {
                label: self.availableSearchTypes[TC.Consts.searchType.COORDINATES].label || self.getLocaleString('search.list.coordinates')
            };
        }
    };

    self.queryProperties = {
        QUERYWORD: 'QueryWord',
        FIRST: 'first',
        SECOND: 'second',
        THIRD: 'third'
    };

    self.availableSearchTypes[TC.Consts.searchType.MUNICIPALITY] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        url: '//idena.navarra.es/ogc/wfs',
        featurePrefix: 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Pol_Municipio',
        dataIdProperty: ['CMUNICIPIO'],
        queryProperties: {
            firstQueryWord: ['MUNINOAC', 'MUNICIPIO']
        },
        suggestionListHead: {
            label: "search.list.municipality",
            color: "strokeColor"
        },
        outputProperties: ['MUNICIPIO'],
        outputFormatLabel: '{0}',
        searchWeight: 1,
        styles: [
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#fe06a5',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            }
        ],
        parser: self.getStringPattern.bind(this, [TC.Consts.searchType.MUNICIPALITY]),
        goTo: self.goToStringPattern
    };

    //self.availableSearchTypes[TC.Consts.searchType.LOCALITY] = {
    //    root: null,
    //    limit: false,
    //    url: self.url || '//idena.navarra.es/ogc/wfs',
    //    version: self.version || '1.1.0',
    //    outputFormat: TC.Consts.format.JSON,
    //    featurePrefix: self.featurePrefix || 'IDENA',
    //    geometryName: 'the_geom',
    //    featureType: ['CATAST_Pol_Municipio', 'ESTADI_Pol_EntidadPob'],
    //    renderFeatureType: ['CATAST_Pol_Municipio'],
    //    dataIdProperty: {
    //        CATAST_Pol_Municipio: ['CMUNICIPIO'],
    //        ESTADI_Pol_EntidadPob: ['CMUNICIPIO', 'CENTIDAD']
    //    },
    //    queryProperties: {
    //        firstQueryWord: {
    //            CATAST_Pol_Municipio: ['MUNINOAC', 'MUNICIPIO'],
    //            ESTADI_Pol_EntidadPob: ['ENTINOAC', 'ENTIDAD']
    //        }
    //    },
    //    suggestionListHead: {
    //        label: "search.list.locality",
    //        color: "strokeColor"
    //    },
    //    outputProperties: {
    //        CATAST_Pol_Municipio: ['MUNICIPIO'],
    //        ESTADI_Pol_EntidadPob: ['MUNICIPIO', 'ENTIDAD']
    //    },
    //    outputFormatLabel: {
    //        CATAST_Pol_Municipio: '{0}',
    //        ESTADI_Pol_EntidadPob: '{1} ({0})'
    //    },
    //    searchWeight: 1,
    //    styles: [
    //        {
    //            polygon: {
    //                fillColor: '#000000',
    //                fillOpacity: 0,
    //                strokeColor: '#ffffff',
    //                strokeWidth: 5,
    //                strokeOpacity: 1
    //            }
    //        },
    //        {
    //            polygon: {
    //                fillColor: '#000000',
    //                fillOpacity: 0.1,
    //                strokeColor: '#feba1e',
    //                strokeWidth: 2,
    //                strokeOpacity: 1
    //            }
    //        }
    //    ],
    //    parser: self.getStringPattern.bind(this, [TC.Consts.searchType.LOCALITY]),
    //    goTo: self.goToStringPattern
    //};

    self.availableSearchTypes[TC.Consts.searchType.COUNCIL] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Pol_Concejo',
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO', 'CCONCEJO'],
        queryProperties: {
            firstQueryWord: ['CONCEJO']
        },
        outputProperties: ['MUNICIPIO', 'CONCEJO'],
        outputFormatLabel: '{1} ({0})',
        searchWeight: 4,
        parser: self.getStringPattern.bind(this, [TC.Consts.searchType.COUNCIL]),
        goTo: self.goToStringPattern,
        idPropertiesIdentifier: '#',
        suggestionListHead: {
            label: "search.list.council",
            color: "strokeColor"
        },
        styles: [
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#49006a',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            }
        ]
    };

    self.availableSearchTypes[TC.Consts.searchType.STREET] = {
        root: null,
        limit: null,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        renderFeatureType: 'CATAST_Txt_Calle',
        featureType: 'CATAST_Lin_CalleEje',
        dataIdProperty: ['CVIA'],
        searchWeight: 5,
        queryProperties: {
            firstQueryWord: ['ENTINOAC', 'ENTIDADC'],
            secondQueryWord: ['VIA', 'VIANOAC']
        },
        suggestionListHead: {
            label: "search.list.street",
            color: "strokeColor"
        },
        outputProperties: ['ENTIDADC', 'VIA', 'CVIA', 'CENTIDADC', 'CMUNICIPIO'],
        outputFormatLabel: '{1}, {0}',
        styles: [
            {
                line: {
                    strokeColor: "#CB0000",
                    strokeOpacity: 1,
                    strokeWidth: 2,
                    strokeLinecap: "round",
                    strokeDashstyle: "solid"
                }
            },
            {
                point: {
                    label: "VIA",
                    angle: "CADANGLE",
                    fontColor: "#000000",
                    fontSize: 10,
                    fontWeight: "bold",
                    labelOutlineColor: "#FFFFFF",
                    labelOutlineWidth: 4
                }
            }
        ],
        parser: self.getStringPattern.bind(this, [TC.Consts.searchType.STREET]),
        goTo: self.goToStringPattern
    };

    self.availableSearchTypes[TC.Consts.searchType.NUMBER] = {
        root: null,
        limit: null,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Txt_Portal',
        renderFeatureType: '',
        searchWeight: 6,
        dataIdProperty: ['CMUNICIPIO', 'CENTIDADC', 'CVIA', 'PORTAL'],
        queryProperties: {
            firstQueryWord: ['ENTIDADC', 'ENTINOAC'],
            secondQueryWord: ['VIA', 'VIANOAC'],
            thirdQueryWord: ['PORTAL']
        },
        suggestionListHead: {
            label: "search.list.number",
            color: "fontColor"
        },
        outputProperties: ['ENTIDADC', 'VIA', 'PORTAL', 'CVIA', 'CENTIDADC', 'CMUNICIPIO'],
        outputFormatLabel: '{1} {2}, {0}',
        styles: [
            {
                point: {
                    radius: 0,
                    label: "PORTAL",
                    angle: "CADANGLE",
                    fontColor: "#CB0000",
                    fontSize: 14,
                    labelOutlineColor: "#FFFFFF",
                    labelOutlineWidth: 4
                }
            }
        ],
        parser: self.getStringPattern.bind(this, [TC.Consts.searchType.NUMBER]),
        goTo: self.goToStringPattern
    };

    self.availableSearchTypes[TC.Consts.searchType.URBAN] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'ESTADI_Pol_EntidadPob',
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO', 'CENTIDAD'],
        idPropertiesIdentifier: '#',
        queryProperties: {
            firstQueryWord: ['ENTINOAC', 'ENTIDAD']
        },
        suggestionListHead: {
            label: "search.list.urban",
            color: "strokeColor"
        },
        outputProperties: ['MUNICIPIO', 'ENTIDAD'],
        outputFormatLabel: '{1} ({0})',
        searchWeight: 2,
        styles: [
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#feba1e',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            }
        ],
        parser: self.getStringPattern.bind(this, [TC.Consts.searchType.URBAN]),
        goTo: self.goToStringPattern
    };

    self.availableSearchTypes[TC.Consts.searchType.PLACENAME] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'TOPONI_Txt_Toponimos',
        renderFeatureType: '',
        dataIdProperty: ['CTOPONIMO'],
        idPropertiesIdentifier: '#',
        queryProperties: {
            firstQueryWord: ['TOPONIMO', 'TOPONINOAC']
        },
        suggestionListHead: {
            label: "search.list.placeName",
            color: "fontColor"
        },
        outputProperties: ['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO'],
        outputFormatLabel: '{1} ({0})',
        searchWeight: 7,
        /*filterByMatch: true, si queremos que filtre por expresión regular */
        styles: [
            {
                point: {
                    radius: 0,
                    label: "CADTEXT",
                    angle: "CADANGLE",
                    fontColor: "#ff5722",
                    fontSize: 14,
                    labelOutlineColor: "#FFFFFF",
                    labelOutlineWidth: 4
                }
            }
        ],
        parser: self.getStringPattern.bind(this, [TC.Consts.searchType.PLACENAME]),
        goTo: self.goToStringPattern
    };

    self.availableSearchTypes[TC.Consts.searchType.PLACENAMEMUNICIPALITY] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'TOPONI_Txt_Toponimos',
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO', 'CTOPONIMO'],
        idPropertiesIdentifier: '#',
        queryProperties: {
            firstQueryWord: ['MUNICIPIO', 'MUNINOAC'],
            secondQueryWord: ['TOPONIMO', 'TOPONINOAC']
        },
        suggestionListHead: {
            label: "search.list.placeName",
            color: "fontColor"
        },
        outputProperties: ['MUNICIPIO', 'TOPONIMO', 'CMUNICIPIO', 'CTOPONIMO'],
        outputFormatLabel: '{1} ({0})',
        searchWeight: 8,
        /*filterByMatch: true, si queremos que filtre por expresión regular */
        styles: [
            {
                point: {
                    radius: 0,
                    label: "CADTEXT",
                    angle: "CADANGLE",
                    fontColor: "#ff5722",
                    fontSize: 14,
                    labelOutlineColor: "#FFFFFF",
                    labelOutlineWidth: 4
                }
            }
        ],
        parser: self.getStringPattern.bind(this, [TC.Consts.searchType.PLACENAMEMUNICIPALITY]),
        goTo: self.goToStringPattern
    };

    self.availableSearchTypes[TC.Consts.searchType.COMMONWEALTH] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: ['POLUCI_Pol_MancoRSUg'],
        renderFeatureType: '',
        dataIdProperty: ['CMANCOMUNI'],
        queryProperties: {
            firstQueryWord: ['MANCOMUNID']
        },
        outputProperties: ['MANCOMUNID'],
        outputFormatLabel: '{0}',
        searchWeight: 9,
        styles: [
            {
                polygon: {
                    fillColor: '#000000',
                    fillOpacity: 0.1,
                    strokeColor: '#fc4e2a',
                    strokeWidth: 2,
                    strokeOpacity: 1
                }
            }
        ]
    };

    self.availableSearchTypes[TC.Consts.searchType.ROAD] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'INFRAE_Lin_CtraEje',
        dataIdProperty: ['DCARRETERA'],
        queryProperties: {
            firstQueryWord: ['DCARRETERA']
        },
        suggestionListHead: {
            label: "search.list.road",
            color: "strokeColor"
        },
        outputProperties: ['DCARRETERA'],
        outputFormatLabel: self.getLocaleString('search.list.road.shorter') + ': ' + '{0}',
        searchWeight: 10,
        styles: [
            {
                polygon: {
                    strokeColor: "#00b2fc",
                    strokeOpacity: 1,
                    strokeWidth: 5
                },
                line: {
                    strokeColor: "#00b2fc",
                    strokeOpacity: 1,
                    strokeWidth: 5,
                    strokeLinecap: "round",
                    strokeDashstyle: "solid"
                }
            }
        ],
        parser: self.getRoad,
        goTo: self.goToRoad,
        pattern: function () {
            return new RegExp("^(?:(?:" + self.getLocaleString("search.list.road") + "|" + self.getLocaleString("search.list.road.shorter") + ")\\:?)?\\s*((A?|AP?|N?|R?|E?|[A-Z]{2}?|[A-Z]{1}?)\\s*\\-?\\s*(\\d{1,4})\\s*\\-?\\s*(A?|B?|C?|R?))$", "i")
        }
    };

    self.availableSearchTypes[TC.Consts.searchType.ROADPK] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'INFRAE_Sym_CtraPK',
        dataIdProperty: ['DCARRETERA', 'CPK'],
        queryProperties: {
            firstQueryWord: ['DCARRETERA'],
            secondQueryWord: ['PK']
        },
        suggestionListHead: {
            label: "search.list.pk.larger",
            color: "fontColor"
        },
        outputProperties: ['DCARRETERA', 'PK'],
        outputFormatLabel: self.getLocaleString('search.list.road.shorter') + ': {0} ' + self.getLocaleString('search.list.pk') + ': {1}',
        searchWeight: 11,
        styles: [
            {
                point: {
                    label: ["DCARRETERA", "PK"],
                    fontColor: "#00b2fc",
                    fontSize: 14,
                    labelOutlineColor: "#ffffff",
                    labelOutlineWidth: 2
                }
            }
        ],
        parser: self.getPK,
        goTo: self.goToPK,
        pattern: function () {
            return new RegExp("^(?:(?:" + self.getLocaleString("search.list.road") + "|" + self.getLocaleString("search.list.road.shorter") + ")\\:?)?\\s*((A?|AP?|N?|R?|E?|[A-Z]{2}?|[A-Z]{1}?)\\s*\\-?\\s*(\\d{1,4})\\s*\\-?\\s*(A?|B?|C?|R?))\\s*\\,*\\s*(?:(?:" + self.getLocaleString("search.list.pk") + "\\:?)|(?:P\\:?)|(?:K\\:?)|(?:KM\\:?)|(?:\\s+|\\,+))\\s*(\\d{1,4})$", "i")
        }
    };

    self.rootCfg = {};
    self.rootCfg[TC.Consts.searchType.MUNICIPALITY] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: 'CATAST_Pol_Municipio',
        dataIdProperty: ['CMUNICIPIO'],
        queryProperties: {
            firstQueryWord: ['MUNICIPIO']
        },
        outputProperties: ['MUNICIPIO'],
        outputFormatLabel: '{0}',
        getRootLabel: function () {
            var done = new $.Deferred();
            if (self.rootCfg.active && !self.rootCfg[TC.Consts.searchType.MUNICIPALITY].rootLabel) {

                var params = {};
                params.SERVICE = 'WFS';
                params.VERSION = self.rootCfg[TC.Consts.searchType.MUNICIPALITY].version;
                params.REQUEST = 'GetFeature';
                params.TYPENAME = self.rootCfg[TC.Consts.searchType.MUNICIPALITY].featurePrefix + ':' + self.rootCfg[TC.Consts.searchType.MUNICIPALITY].featureType;
                params.OUTPUTFORMAT = self.rootCfg[TC.Consts.searchType.MUNICIPALITY].outputFormat;
                params.PROPERTYNAME = ['CMUNICIPIO'].concat(self.rootCfg[TC.Consts.searchType.MUNICIPALITY].outputProperties).join(',');

                params.CQL_FILTER = self.rootCfg[TC.Consts.searchType.MUNICIPALITY].root.map(function (elem) {
                    return ['CMUNICIPIO'].map(function (id, index) {
                        return id + '=' + elem[index];
                    }).join(' AND ');
                });

                params.CQL_FILTER = params.CQL_FILTER.join(' OR ');

                $.ajax({
                    url: self.rootCfg[TC.Consts.searchType.MUNICIPALITY].url + '?' + $.param(params),
                    type: 'GET'
                }).done(function (data) {
                    if (data.totalFeatures > 0) {

                        self.rootCfg[TC.Consts.searchType.MUNICIPALITY].rootLabel = data.features.map(function (feature) {
                            return {
                                id: ['CMUNICIPIO'].map(function (elem) {
                                    return feature.properties[elem];
                                }).join('#'),
                                label: feature.properties[self.rootCfg[TC.Consts.searchType.MUNICIPALITY].outputProperties[0]].toLowerCase()
                            };
                        });

                        done.resolve(self.rootCfg[TC.Consts.searchType.MUNICIPALITY].rootLabel);

                    } else {
                        self.rootCfg[TC.Consts.searchType.MUNICIPALITY].rootLabel = [];
                        done.resolve(self.rootCfg[TC.Consts.searchType.MUNICIPALITY].rootLabel);
                    }
                }).fail(function () {
                    done.resolve([]);
                });
            }
            else {
                done.resolve(self.rootCfg[TC.Consts.searchType.MUNICIPALITY].rootLabel);
            }

            return done;
        }
    };
    self.rootCfg[TC.Consts.searchType.LOCALITY] = {
        root: null,
        limit: false,
        url: self.url || '//idena.navarra.es/ogc/wfs',
        version: self.version || '1.1.0',
        outputFormat: TC.Consts.format.JSON,
        featurePrefix: self.featurePrefix || 'IDENA',
        geometryName: 'the_geom',
        featureType: ['ESTADI_Pol_EntidadPob'],
        renderFeatureType: '',
        dataIdProperty: ['CMUNICIPIO', 'CENTIDADC'],
        queryProperties: {
            firstQueryWord: ['ENTINOAC']
        },
        outputProperties: ['ENTINOAC'],
        getRootLabel: function () {
            var done = new $.Deferred();
            if (self.rootCfg.active && !self.rootCfg[TC.Consts.searchType.LOCALITY].rootLabel) {

                var params = {};
                params.SERVICE = 'WFS';
                params.VERSION = self.rootCfg[TC.Consts.searchType.LOCALITY].version;
                params.REQUEST = 'GetFeature';
                params.TYPENAME = self.rootCfg[TC.Consts.searchType.LOCALITY].featurePrefix + ':' + self.rootCfg[TC.Consts.searchType.LOCALITY].featureType;
                params.OUTPUTFORMAT = self.rootCfg[TC.Consts.searchType.LOCALITY].outputFormat;
                params.PROPERTYNAME = ['CMUNICIPIO', 'CENTIDAD'].concat(self.rootCfg[TC.Consts.searchType.LOCALITY].outputProperties).join(',');

                params.CQL_FILTER = self.rootCfg[TC.Consts.searchType.LOCALITY].root.map(function (elem) {
                    return ['CMUNICIPIO', 'CENTIDAD'].map(function (id, index) {
                        return id + '=' + elem[index];
                    }).join(' AND ');
                });

                params.CQL_FILTER = params.CQL_FILTER.join(' OR ');

                $.ajax({
                    url: self.rootCfg[TC.Consts.searchType.LOCALITY].url + '?' + $.param(params),
                    type: 'GET'
                }).done(function (data) {
                    if (data.totalFeatures > 0) {

                        self.rootCfg[TC.Consts.searchType.LOCALITY].rootLabel = data.features.map(function (feature) {
                            return {
                                id: ['CMUNICIPIO', 'CENTIDAD'].map(function (elem) {
                                    return feature.properties[elem];
                                }).join('#'),
                                label: feature.properties[self.rootCfg[TC.Consts.searchType.LOCALITY].outputProperties[0]].toLowerCase()
                            };
                        });

                        done.resolve(self.rootCfg[TC.Consts.searchType.LOCALITY].rootLabel);

                    } else {
                        self.rootCfg[TC.Consts.searchType.LOCALITY].rootLabel = [];
                        done.resolve(self.rootCfg[TC.Consts.searchType.LOCALITY].rootLabel);
                    }
                }).fail(function () {
                    done.resolve([]);
                });
            }
            else {
                done.resolve(self.rootCfg[TC.Consts.searchType.LOCALITY].rootLabel);
            }

            return done;
        }
    };

    self.allowedSearchTypes = [];

    if (self.options.allowedSearchTypes) {
        for (var allowed in self.options.allowedSearchTypes) {

            if (self.availableSearchTypes[allowed] && !$.isEmptyObject(self.options.allowedSearchTypes[allowed])) {

                // GLS: gestionamos el override de featureType y renderFeatureType.
                // Si por defecto cuenta con renderFeatureType y sobrescribe featureType y no renderFeatureType, 
                // elimino la propiedad renderFeatureType y elimino el último estilo definido, que se corresponde con el de renderFeatureType.
                if (self.availableSearchTypes[allowed].renderFeatureType && self.availableSearchTypes[allowed].renderFeatureType.length > 0 &&
                    self.options.allowedSearchTypes[allowed].featureType && !self.options.allowedSearchTypes[allowed].renderFeatureType) {

                    delete self.availableSearchTypes[allowed].renderFeatureType;
                    self.availableSearchTypes[allowed].styles = self.availableSearchTypes[allowed].styles.slice(0, self.availableSearchTypes[allowed].styles.length - 1);
                }

                // GLS: override de la configuración por defecto con la del config.JSON
                $.extend(self.availableSearchTypes[allowed], self.options.allowedSearchTypes[allowed]);


                // GLS: Limitamos la búsqueda en portales y calles cuando así se establezca en la configuración de las búsquedas
                if (self.options.allowedSearchTypes[allowed].root &&
                    (allowed != TC.Consts.searchType.MUNICIPALITY && self.options.allowedSearchTypes[allowed].rootType == TC.Consts.searchType.MUNICIPALITY) ||
                    (allowed != TC.Consts.searchType.LOCALITY && self.options.allowedSearchTypes[allowed].rootType == TC.Consts.searchType.LOCALITY)) {

                    self.rootCfg.active = self.rootCfg[self.options.allowedSearchTypes[allowed].rootType];
                    self.rootCfg.active.root = self.options.allowedSearchTypes[allowed].root;
                    self.rootCfg.active.limit = self.options.allowedSearchTypes[allowed].limit;

                    self.availableSearchTypes[TC.Consts.searchType.STREET].queryProperties.firstQueryWord =
                        self.availableSearchTypes[TC.Consts.searchType.NUMBER].queryProperties.firstQueryWord =
                        self.rootCfg.active.dataIdProperty;
                }
            }

            // Si esta a false lo borramos de las disponibles
            if (!self.options.allowedSearchTypes[allowed]) {
                delete self.options.allowedSearchTypes[allowed];
            } else {
                self.addAllowedSearchType(allowed, self.availableSearchTypes[allowed] ? self.availableSearchTypes[allowed] : self.options.allowedSearchTypes[allowed], self);
            }
        }
    }

    if (self.rootCfg.active) {
        self.rootCfg.active.getRootLabel();
    }

    self.queryableFeatures = self.options.queryableFeatures || false;

    self.UTMX_LEN = 6;
    self.UTMY_LEN = 7;

    self.wrap = new TC.wrap.control.Search(self);

    self.interval = 500;

    self.NORMAL_PATTERNS = {
        ROMAN_NUMBER: /M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}){1,}?\S?\./i,
        ABSOLUTE_NOT_DOT: /[`~!@#$%^&*_|+\=?;:'"\{\}\[\]\\]/gi,
        ABSOLUTE: /[`~!@#$%^&*_|+\=?;:'.\{\}\[\]\\]/gi
    };
};

TC.inherit(TC.control.Search, TC.Control);

(function () {
    var ctlProto = TC.control.Search.prototype;

    ctlProto.CLASS = 'tc-ctl-search';

    TC.Consts.event.SEARCHQUERYEMPTY = TC.Consts.event.SEARCHQUERYEMPTY || 'searchqueryempty.tc';

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

        self._search = {
            data: []
        };

        self.layerStyleFN = (function () {
            function getFeatureType(idFeature) {
                return idFeature.indexOf('.') > -1 ? idFeature.split('.')[0] : idFeature;
            };
            function getStyle(property, geomType, id) {

                var type = self.getSearchTypeByFeature(id);
                if (type) {
                    var style = type.getStyleByFeatureType(getFeatureType(id));

                    if (style && style.hasOwnProperty(geomType)) {
                        return style[geomType][property];
                    }
                }

                return TC.Cfg.styles[geomType][property];
            };

            return function (geomType, property, extractValue, f) {
                var self = this;

                if (TC.Feature && !(f instanceof TC.Feature)) {
                    self.map.$events.trigger($.Event(TC.Consts.event.FEATURESADD, { layer: self.layer, geom: f.geom }));
                }

                var prop = getStyle(property, geomType, getFeatureType(f.id));
                if (extractValue) {
                    if (prop instanceof Array) {
                        var values = prop.map(function (p) {
                            return f.getData().hasOwnProperty(p) ? f.getData()[p] : '';
                        });
                        var searchType = this.getSearchTypeByFeature(getFeatureType(f.id));
                        if (searchType) {
                            return searchType.outputFormatLabel.tcFormat(values);
                        } else {
                            return values.join(' ');
                        }
                    } else {
                        return f.getData().hasOwnProperty(prop) ? f.getData()[prop] : '';
                    }
                }
                else {
                    return prop;
                }
            };
        }());

        var styleFN = self.layerStyleFN;

        map.addLayer({
            id: self.getUID(),
            title: 'Búsquedas',
            stealth: true,
            declutter: true,
            type: TC.Consts.layerType.VECTOR,
            styles: {
                polygon: {
                    fillColor: styleFN.bind(self, 'polygon', 'fillColor', false),
                    fillOpacity: styleFN.bind(self, 'polygon', 'fillOpacity', false),
                    strokeColor: styleFN.bind(self, 'polygon', 'strokeColor', false),
                    strokeOpacity: styleFN.bind(self, 'polygon', 'strokeOpacity', false),
                    strokeWidth: styleFN.bind(self, 'polygon', 'strokeWidth', false)
                },
                line: {
                    strokeColor: styleFN.bind(self, 'line', 'strokeColor', false),
                    strokeOpacity: styleFN.bind(self, 'line', 'strokeOpacity', false),
                    strokeWidth: styleFN.bind(self, 'line', 'strokeWidth', false)
                },
                marker: {
                    anchor: TC.Defaults.styles.marker.anchor,
                    height: TC.Defaults.styles.marker.height,
                    width: TC.Defaults.styles.marker.width
                },
                point: {
                    radius: styleFN.bind(self, 'point', 'radius', false),
                    height: styleFN.bind(self, 'point', 'height', false),
                    width: styleFN.bind(self, 'point', 'width', false),
                    fillColor: styleFN.bind(self, 'point', 'fillColor', false),
                    fillOpacity: styleFN.bind(self, 'point', 'fillOpacity', false),
                    strokeColor: styleFN.bind(self, 'point', 'strokeColor', false),
                    strokeWidth: styleFN.bind(self, 'point', 'strokeWidth', false),
                    fontSize: styleFN.bind(self, 'point', 'fontSize', false),
                    fontColor: styleFN.bind(self, 'point', 'fontColor', false),
                    labelOutlineColor: styleFN.bind(self, 'point', 'labelOutlineColor', false),
                    labelOutlineWidth: styleFN.bind(self, 'point', 'labelOutlineWidth', false),
                    label: styleFN.bind(self, 'point', 'label', true),
                    angle: styleFN.bind(self, 'point', 'angle', true)
                }
            }
        }).then(function (layer) {
            self.layer = layer;
            self.layerPromise.resolve(layer);
        },
            function (error) {
                self.layerPromise.reject(error);
            }
            );

        self.EMPTY_RESULTS_LABEL = self.getLocaleString('noResults');
        self.EMPTY_RESULTS_TITLE = self.getLocaleString('checkCriterion');
        self.OUTBBX_LABEL = self.getLocaleString('outsideOfLimits');

        self.WFS_TYPE_ATTRS = ["url", "version", "geometryName", "featurePrefix", "featureType", "properties", "outputFormat"];
    };

    ctlProto.renderData = function (data, callback) {
        var self = this;

        self._search = self._search || {};

        var _search = function () {
            self.search(self.$text.val(), function (list) {
                if (list.length === 1) {
                    self.$text.val(list[0].label);
                    self._goToResult(list[0].id, self.$list.find('li:not([header])').attr('dataRole'));
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
                self.$text.val(self.$list[0].label || self.$list.find('li:not([header]) > a > span').text());
                self.lastPattern = self.$text.val();
                self._goToResult(self.$list[0].id || unescape(self.$list.find('li:not([header]) > a').attr('href')).substring(1), self.$list.find('li:not([header])').attr('dataRole'));
                self.$list.hide('fast');
            };

            self.$text = self._$div.find('input.tc-ctl-search-txt');
            if (self.options && self.options.placeHolder) {
                self.$text.attr('placeHolder', self.options.placeHolder.trim());
            }

            self.$list = self._$div.find('.tc-ctl-search-list');
            self.$button = self._$div.find('.tc-ctl-search-btn');
            self.$button.on(TC.Consts.event.CLICK, function () {
                self.getLayer().then(function (l) {
                    if (self.$list.find('li > a:not(.tc-ctl-search-li-loading,.tc-ctl-search-li-empty)').length > 1) { }
                    else if (l.features.length > 0) {
                        l.map.zoomToFeatures(l.features);
                    }
                    else if (self.$list.find('li > a:not(.tc-ctl-search-li-loading,.tc-ctl-search-li-empty)').length === 1) {
                        _research();
                    }
                    else self.$text.trigger('keyup.autocomplete');
                });
            });
            if (self.options.instructions) {
                self.$text.attr('title', self.options.instructions.trim());
                self.$button.attr('title', self.options.instructions.trim());
            }

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

                    self.lastPattern = "";

                    if (self.$list.find('li > a:not(.tc-ctl-search-li-loading,.tc-ctl-search-li-empty)').length === 1) {
                        _research();
                    } else {
                        _search();
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

            self.lastPattern = '';
            self.retryTimeout = null;
            TC.loadJS(
                !self.$text.autocomplete,
                [TC.apiLocation + 'lib/jQuery/autocomplete.js'],
                function () {
                    var searchDelay;

                    self.$text = self._$div.find('input.tc-ctl-search-txt');
                    self.$text.autocomplete({
                        link: '#',
                        target: self.$list,
                        minLength: 2,
                        ctx: self,
                        source: function (text, callback) {
                            self.lastpress = performance.now();

                            if (!searchDelay) {
                                function step() {
                                    var criteria = self.$text.val().trim();

                                    if (criteria.length > 0 &&
                                        (!self.lastPattern || criteria != self.lastPattern) &&
                                        performance.now() - self.lastpress > self.interval) {

                                        window.cancelAnimationFrame(searchDelay);
                                        searchDelay = undefined;

                                        self.$list.hide('fast');

                                        // Pendiente de afinar
                                        //if (self.lastPattern && criteria.substring(0, criteria.lastIndexOf(' ')) == self.lastPattern) {                                            

                                        //    // Si el patrón de búsqueda anterior y actual es el mismo más algo nuevo (típico en la búsqueda de un portal), lo nuevo lo separo por coma
                                        //    // self.lastPattern: "Calle Cataluña/Katalunia Kalea, Pamplona"
                                        //    // text: "Calle Cataluña/Katalunia Kalea, Pamplona 18"

                                        //    criteria = criteria.substring(0, criteria.lastIndexOf(' ')) + (self.lastPattern.trim().endsWith(',') ? "" : ",") + criteria.substring(criteria.lastIndexOf(' '));
                                        //}

                                        self.lastPattern = criteria;

                                        self.search(criteria, callback);
                                    } else {
                                        searchDelay = requestAnimationFrame(step);
                                    }
                                }

                                searchDelay = requestAnimationFrame(step);
                            }
                        },
                        callback: function (e) {
                            var _target = $(e.target);

                            if (!$(e.target).is('a'))
                                _target = $(e.target).closest('a');

                            self.$text.val($(_target).find('span[hidden]').text());
                            self.lastPattern = self.$text.val();
                            self._goToResult(unescape($(_target).attr('href')).substring(1), $(_target).parent().attr('dataRole'));
                            self.$text.autocomplete('clear');;
                        }
                        ,
                        buildHTML: function (results) {

                            var html = [];
                            var dataRoles = [];

                            var reA = /[^a-zA-Z]/g;
                            var reN = /[^0-9]/g;
                            function sortAlphaNum(a, b) {
                                var AInt = parseInt(a, 10);
                                var BInt = parseInt(b, 10);

                                if (isNaN(AInt) && isNaN(BInt)) {
                                    var aA = a.replace(reA, "");
                                    var bA = b.replace(reA, "");
                                    if (aA === bA) {
                                        var aN = parseInt(a.replace(reN, ""), 10);
                                        var bN = parseInt(b.replace(reN, ""), 10);
                                        return aN === bN ? 0 : aN > bN ? 1 : -1;
                                    } else {
                                        return aA > bA ? 1 : -1;
                                    }
                                } else if (isNaN(AInt)) {//A is not an Int
                                    return 1;//to make alphanumeric sort first return -1 here
                                } else if (isNaN(BInt)) {//B is not an Int
                                    return -1;//to make alphanumeric sort first return 1 here
                                } else {
                                    return AInt > BInt ? 1 : -1;
                                }
                            };

                            // ordenamos por roles y alfabéticamente
                            var data = results.results.sort(function (a, b) {
                                if (this.ctx.getSearchTypeByRole(a.dataRole).searchWeight && this.ctx.getSearchTypeByRole(b.dataRole).searchWeight) {
                                    if ((this.ctx.getSearchTypeByRole(a.dataRole).searchWeight || 0) > (this.ctx.getSearchTypeByRole(b.dataRole).searchWeight || 0)) {
                                        return 1;
                                    } else if ((this.ctx.getSearchTypeByRole(a.dataRole).searchWeight || 0) < (this.ctx.getSearchTypeByRole(b.dataRole).searchWeight || 0)) {
                                        return -1;
                                    }
                                    else {
                                        return sortAlphaNum(a.label, b.label);
                                    }
                                } else {
                                    if (a.dataRole > b.dataRole) {
                                        return 1;
                                    }
                                    else if (a.dataRole < b.dataRole)
                                        return -1;
                                    else {
                                        return sortAlphaNum(a.label, b.label);
                                    }
                                }
                            }.bind(this));

                            if (self.rootCfg.active) {// si hay root, aplicamos el orden por entidades 
                                data = data.sort(function (a, b) {

                                    const sort_ = function () {
                                        var first = this.rootCfg.active.root[0] instanceof Array ? this.rootCfg.active.root[0].join('-') : this.rootCfg.active.root[0];

                                        var aRoot, bRoot;
                                        if (a.properties && a.properties.length > 0 && b.properties && b.properties.length > 0) {
                                            aRoot = this.rootCfg.active.dataIdProperty.map(function (elem) { return a.properties[elem].toString(); }).join('-');
                                            bRoot = this.rootCfg.active.dataIdProperty.map(function (elem) { return b.properties[elem].toString(); }).join('-');
                                        } else {
                                            aRoot = a.id;
                                            bRoot = b.id;
                                        }

                                        if (aRoot !== first && bRoot === first) {
                                            return 1;
                                        } else if (aRoot === first && bRoot !== first) {
                                            return -1;
                                        } else {
                                            return sortAlphaNum(a.label, b.label);
                                        }
                                    }.bind(this);

                                    if (this.getSearchTypeByRole(a.dataRole).searchWeight && this.getSearchTypeByRole(b.dataRole).searchWeight) {
                                        if ((this.getSearchTypeByRole(a.dataRole).searchWeight || 0) > (this.getSearchTypeByRole(b.dataRole).searchWeight || 0)) {
                                            return 1;
                                        } else if ((this.getSearchTypeByRole(a.dataRole).searchWeight || 0) < (this.getSearchTypeByRole(b.dataRole).searchWeight || 0)) {
                                            return -1;
                                        }
                                        else {
                                            return sort_();
                                        }
                                    }
                                    else {
                                        return sort_();
                                    }

                                }.bind(self));
                            }

                            for (var i = 0; i < data.length; i++) {
                                var elm = data[i];

                                if (dataRoles.indexOf(elm.dataRole) == -1) {

                                    var type = this.ctx.getSearchTypeByRole(elm.dataRole);

                                    html[html.length] = type.getSuggestionListHead();

                                    dataRoles.push(elm.dataRole);
                                }

                                const highlighting = function () {
                                    var highlighted = elm.label;
                                    var strReg = [];

                                    // eliminamos caracteres extraños del patrón ya analizado
                                    var normalizedLastPattern = this.ctx.lastPattern;
                                    if (self.NORMAL_PATTERNS.ROMAN_NUMBER.test(normalizedLastPattern))
                                        normalizedLastPattern = normalizedLastPattern.replace(self.NORMAL_PATTERNS.ABSOLUTE_NOT_DOT, '');
                                    else
                                        normalizedLastPattern = normalizedLastPattern.replace(self.NORMAL_PATTERNS.ABSOLUTE, '');


                                    var querys = [];
                                    var separatorChar = ',';
                                    if (normalizedLastPattern.indexOf(separatorChar) == -1) {
                                        separatorChar = ' ';
                                    }

                                    querys = normalizedLastPattern.trim().split(separatorChar);

                                    // si estamos tratando con coordenadas el separador es el espacio, no la coma
                                    if ((elm.label.indexOf(this.ctx.LAT_LABEL) > -1 && elm.label.indexOf(this.ctx.LON_LABEL) > -1) ||
                                        (elm.label.indexOf(this.ctx.UTMX_LABEL) > -1 && elm.label.indexOf(this.ctx.UTMY_LABEL) > -1)) {
                                        querys = this.ctx.lastPattern.split(' ');

                                        for (var t = 0; t < querys.length; t++) {
                                            if (querys[t].trim().slice(-1) == ',')
                                                querys[t] = querys[t].slice(0, -1);
                                        }
                                    }

                                    for (var q = 0; q < querys.length; q++) {
                                        if (querys[q].trim().length > 0) {
                                            strReg.push('(' + querys[q].trim().replace(/\(/gi, "").replace(/\)/gi, "") + ')');
                                            var match = /((\<)|(\>)|(\<\>))/gi.exec(querys[q].trim());
                                            if (match) {
                                                var _strReg = querys[q].trim().replace(/((\<)|(\>)|(\<\>))/gi, '').split(' ');
                                                for (var st = 0; st < _strReg.length; st++) {
                                                    if (_strReg[st].trim().length > 0)
                                                        strReg.push('(' + _strReg[st].trim().replace(/\(/gi, "\\(").replace(/\)/gi, "\\)") + ')');
                                                }
                                            }
                                        }
                                    }

                                    if (elm.dataRole == TC.Consts.searchType.ROAD || elm.dataRole == TC.Consts.searchType.ROADPK) {
                                        var rPattern = self.getSearchTypeByRole(elm.dataRole).getPattern();
                                        var match = rPattern.exec(this.ctx.lastPattern);

                                        if (match) {
                                            strReg = [];

                                            if (match[2] && match[3] && match[4]) {
                                                strReg.push('(' + match[2] + "-" + match[3] + "-" + match[4] + ')');
                                            } else if (match[2] && match[3]) {
                                                strReg.push('(' + match[2] + "-" + match[3] + ')');
                                            } else if (match[3] && match[4]) {
                                                strReg.push('(' + match[3] + "-" + match[4] + ')');
                                            } else if (match[2] || match[3]) {
                                                strReg.push('(' + (match[2] || match[3]) + ')');
                                            }

                                            if (match[5]) {
                                                strReg.push("(?:" + self.getLocaleString("search.list.pk") + "\\:\\s\\d*)" + "(" + match[5] + ")" + "\\d*");
                                            }
                                        } else if (match && match[5]) {
                                            strReg = [];

                                            strReg.push("(?:" + self.getLocaleString("search.list.pk") + "\\:\\s\\d*)" + "(" + match[5] + ")" + "\\d*");
                                        }
                                    }

                                    var pattern = '(' + strReg.join('|') + ')';

                                    pattern = pattern.replace(/á|à/gi, "a");
                                    pattern = pattern.replace(/é|è/gi, "e");
                                    pattern = pattern.replace(/í|ì/gi, "i");
                                    pattern = pattern.replace(/ó|ò/gi, "o");
                                    pattern = pattern.replace(/ú|ù/gi, "u");
                                    pattern = pattern.replace(/ü/gi, "u");

                                    pattern = pattern.replace(/a/gi, "[a|á|à]");
                                    pattern = pattern.replace(/e/gi, "[e|é|è]");
                                    pattern = pattern.replace(/i/gi, "[i|í|ì]");
                                    pattern = pattern.replace(/o/gi, "[o|ó|ò]");
                                    pattern = pattern.replace(/u/gi, "[u|ú|ü|ù]");
                                    var rex = new RegExp(pattern, "gi");

                                    var label = elm.label;

                                    if (elm.dataRole !== TC.Consts.searchType.ROAD || elm.dataRole !== TC.Consts.searchType.ROADPK) {
                                        highlighted = label.replace(rex,
                                            function () {
                                                var params = Array.prototype.slice.call(arguments, 0);

                                                if (params[params.length - 3]) {
                                                    return params[0].replace(params[params.length - 3], "<b>" + params[params.length - 3] + "</b>");
                                                } else {
                                                    return "<b>" + params[0] + "</b>";
                                                }
                                            });
                                    } else {
                                        highlighted = label.replace(rex, "<b>$1</b>");
                                    }

                                    return highlighted;
                                }.bind(this);

                                html[html.length] = '<li dataRole="' + elm.dataRole + '"><a href="' + '#' + encodeURIComponent(elm.id) + '"><span hidden>' + elm.label + '</span>' + highlighting() + '</a></li>';
                            }



                            return html.join('');
                        }
                    });

                    // Detect up/down arrow
                    self.$text.add(self.$list).on('keydown', function (e) {
                        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                            if (e.keyCode === 40) { // down arrow
                                if (self.$text[0] == document.activeElement) {
                                    // Scenario 1: We're focused on the search input; move down to the first li
                                    self.$list.find('li:not([header]):first a').focus();
                                } else if (self.$list.find('li:not([header]):last a').is(':focus')) {
                                    // Scenario 2: We're focused on the last li; move up to search input
                                    self.$text.focus();
                                } else {
                                    // Scenario 3: We're in the list but not on the last element, simply move down
                                    self.$list
                                        .find('li:not([header])')
                                        .find('a:focus')
                                        .parent('li:not([header])')
                                        .nextAll('li:not([header]):first')
                                        .find('a').focus();
                                }
                                e.preventDefault(); // Stop page from scrolling
                                e.stopPropagation();
                            } else if (e.keyCode === 38) { // up arrow
                                if (self.$text[0] == document.activeElement) {
                                    // Scenario 1: We're focused on the search input; move down to the last li
                                    self.$list.find('li:not([header]):last a').focus();
                                } else if (document.activeElement == self.$list.find('li:not([header]):first a').get(0)) {
                                    self.$list.find('li:not([header]):last a').focus();
                                } else {
                                    // Scenario 3: We're in the list but not on the first element, simply move up
                                    self.$list
                                        .find('li:not([header])')
                                        .find('a:focus')
                                        .parent('li:not([header])')
                                        .prevAll('li:not([header]):first')
                                        .find('a').focus();
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

    ctlProto.addAllowedSearchType = function (name, options) {
        var self = this;

        self.allowedSearchTypes.push(new SearchType(name, options, self));
    };

    ctlProto.getSearchTypeByRole = function (type) {
        var self = this;

        return self.allowedSearchTypes.filter(function (allowed) {
            return allowed.typeName == type;
        })[0];
    };

    ctlProto.getSearchTypeByFeature = function (id) {
        var self = this;

        var type = self.allowedSearchTypes.filter(function (allowed) {
            return allowed.isFeatureOfThisType(id);
        });

        if (type.length > 0) {
            return type[0];
        }

        return null;
    };

    ctlProto.getElementOnSuggestionList = function (id, dataRole) {
        for (var i = 0; i < self.parent._search.data.length; i++) {
            if (self.parent._search.data[i].id == id && (!dataRole || (dataRole && self.parent._search.data[i].dataRole === dataRole)))
                return self.parent._search.data[i];
        }
    };

    ctlProto.getLayer = function () {
        var self = this;
        return self.layerPromise;
    };

    ctlProto.getFeatures = function () {
        var self = this;
        var features = [];

        return self.layer.features;
    };

    ctlProto.cleanMap = function () {
        var self = this;

        self.getLayer().then(function (l) {
            var features = l.features;
            l.clearFeatures();

            self.map.$events.trigger($.Event(TC.Consts.event.FEATUREREMOVE, { layer: l, feature: features }));

            for (var i = 0; i < self.WFS_TYPE_ATTRS.length; i++) {
                if (l.hasOwnProperty(self.WFS_TYPE_ATTRS[i]))
                    delete l[self.WFS_TYPE_ATTRS[i]];
            }
        });
    };

    ctlProto.getMunicipalities = function () {
        var self = this;

        TC.cache.search = TC.cache.search || {};
        if (!TC.cache.search.municipalities) {
            self._municipalitiesDeferred = new $.Deferred();

            var type = self.getSearchTypeByRole(TC.Consts.searchType.CADASTRAL);

            if (type.municipality && type.municipality.featureType && type.municipality.labelProperty && type.municipality.idProperty) {
                var params = {
                    REQUEST: 'GetFeature',
                    SERVICE: 'WFS',
                    TYPENAME: type.municipality.featureType,
                    VERSION: type.version,
                    PROPERTYNAME: type.municipality.labelProperty + "," + type.municipality.idProperty,
                    OUTPUTFORMAT: type.outputFormat
                };
                if (type.featurePrefix) {
                    params.TYPENAME = type.featurePrefix + ':' + params.TYPENAME;
                }
                var url = type.url + '?' + $.param(params);
                $.ajax({
                    url: url,
                    type: 'GET',
                    dataType: 'text'
                }).done(function (data) {
                    var parser;
                    if (type.outputFormat === TC.Consts.format.JSON) {
                        parser = new TC.wrap.parser.JSON();
                    }
                    else {
                        parser = new TC.wrap.parser.WFS({
                            featureNS: type.municipality.featurePrefix,
                            featureType: type.municipality.featureType
                        });
                    }
                    var features = parser.read(data);
                    TC.cache.search.municipalities = [];
                    for (var i = 0; i < features.length; i++) {
                        var feature = features[i];
                        TC.cache.search.municipalities.push({ label: feature.data[type.municipality.labelProperty], id: feature.data[type.municipality.idProperty] });
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
                }).fail(function () {
                    self._municipalitiesDeferred.resolve();
                });
            } else {
                throw new Error("Error en la configuración de la búsqueda: " + type.typeName + ". Error en el objeto municipality");
            }
        }
        return TC.cache.search.municipalities || self._municipalitiesDeferred.promise();
    };

    ctlProto.getCoordinates = function (pattern) {
        var self = this;
        var deferred = new $.Deferred();

        var match = pattern.match(new RegExp('^' + $.trim(self.UTMX_LABEL.toLowerCase()) + '*\\s*([0-9]{' + self.UTMX_LEN + '}(?:[.,]\\d+)?)\\s*\\,?\\s*' + $.trim(self.UTMY_LABEL.toLowerCase()) + '*\\s*([0-9]{' + self.UTMY_LEN + '}(?:[.,]\\d+)?)$'));
        if (match) {
            pattern = match[1] + ' ' + match[2];
        }

        match = pattern.match(new RegExp('^' + $.trim(self.LAT_LABEL.toLowerCase()) + '*\\s*([-+]?\\d{1,3}([.,]\\d+)?)\\,?\\s*' + $.trim(self.LON_LABEL.toLowerCase()) + '*\\s*([-+]?\\d{1,2}([.,]\\d+)?)$'));
        if (match) {
            pattern = match[1] + ' ' + match[3];
        }

        if (/\d/.test(pattern) && (new RegExp('^([0-9]{' + self.UTMX_LEN + '}(?:[.,]\\d+)?)\\s*\\,?\\s*([0-9]{' + self.UTMY_LEN + '}(?:[.,]\\d+)?)$').test(pattern) || /^([-+]?\d{1,3}([.,]\d+)?)\,?\s*([-+]?\d{1,2}([.,]\d+)?)$/.test(pattern))) {
            match = /^([-+]?\d{1,3}([.,]\d+)?)\,?\s*([-+]?\d{1,2}([.,]\d+)?)$/.exec(pattern);
            if (match && (match[1].indexOf(',') > -1 || match[3].indexOf(',') > -1)) {
                match[1] = match[1].replace(',', '.');
                match[3] = match[3].replace(',', '.');

                pattern = match[1] + ' ' + match[3];
            }

            if (!match || match && ((match[1].indexOf(',') > -1 ? match[1].replace(',', '.') : match[1]) <= 180) && ((match[3].indexOf(',') > -1 ? match[3].replace(',', '.') : match[3]) <= 90)) {

                match = new RegExp('^([0-9]{' + self.UTMX_LEN + '}(?:[.,]\\d+)?)\\s*\\,?\\s*([0-9]{' + self.UTMY_LEN + '}(?:[.,]\\d+)?)$').exec(pattern);
                if (match && (match[1].indexOf(',') > -1 || match[2].indexOf(',') > -1)) {
                    match[1] = match[1].replace(',', '.');
                    match[2] = match[2].replace(',', '.');

                    pattern = match[1] + ' ' + match[2];
                }

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

                    if (point) {
                        self.availableSearchTypes[TC.Consts.searchType.COORDINATES].label = /^X(\d+(?:\.\d+)?)Y(\d+(?:\.\d+)?)$/.test(id) ? self.getLocaleString('search.list.coordinates.utm') + self.map.crs : self.getLocaleString('search.list.coordinates.geo');

                        //console.log('getCoordinates promise resuelta');
                        deferred.resolve([{
                            id: id, label: self.getLabel(id), dataRole: TC.Consts.searchType.COORDINATES
                        }]);
                    }
                    else {
                        //console.log('getCoordinates promise resuelta');
                        deferred.resolve([]);
                    }
                } else {
                    //console.log('getCoordinates promise resuelta');
                    deferred.resolve([]);
                }
            } else {
                //console.log('getCoordinates promise resuelta');
                deferred.resolve([]);
            }
        } else {
            //console.log('getCoordinates promise resuelta');
            deferred.resolve([]);
        }

        //console.log('getCoordinates promise');
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
        if (!(/^(.*)\,(\s*\d{1,2}\s*)\,(\s*\d{1,4}\s*)$/.test(pattern)) && self.getSearchTypeByRole(TC.Consts.searchType.CADASTRAL).suggestionRoot)
            _pattern = self.getSearchTypeByRole(TC.Consts.searchType.CADASTRAL).suggestionRoot + ', ' + pattern;

        if (/^(.*)\,(\s*\d{1,2}\s*)\,(\s*\d{1,4}\s*)$/.test(_pattern) && !(new RegExp('^([0-9]{' + self.UTMX_LEN + '})\\s*\\,\\s*([0-9]{' + self.UTMY_LEN + '})$').test(pattern))) {
            $.when(self.getMunicipalities()).then(function (list) {
                var match = /^(.*)\,(\s*\d{1,2}\s*)\,(\s*\d{1,4}\s*)$/.exec(_pattern);
                if (match) {
                    var matcher = new RegExp($.trim(match[1]).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
                    var results = [];

                    const getItem = function (mun, munLabel, pol, par) {
                        var properties = [];

                        properties.push[self.MUN] = mun;
                        properties.push[self.POL] = pol;
                        properties.push[self.PAR] = par;

                        return {
                            id: self.MUN + mun + self.POL + pol + self.PAR + par,
                            label: self.getLabel(self.MUN + munLabel + self.POL + pol + self.PAR + par),
                            dataRole: TC.Consts.searchType.CADASTRAL,
                            properties: properties
                        };
                    };

                    results = $.grep(list, function (value) {
                        value = value.label || value.id || value;
                        return matcher.test(value) || matcher.test(self.removePunctuation(value));
                    });

                    if (results.length > 0) {
                        for (var i = 0; i < results.length; i++) {
                            results[i] = getItem(results[i].id, results[i].label, $.trim(match[2]), $.trim(match[3]));
                        }
                    }

                    if (/^[0-9]*$/g.test(match[1])) {

                        if (match[1].trim() === self.getSearchTypeByRole(TC.Consts.searchType.CADASTRAL).suggestionRoot) {

                            var suggestionRoot = list.filter(function (elm) {
                                return parseInt(elm.id) === parseInt(self.getSearchTypeByRole(TC.Consts.searchType.CADASTRAL).suggestionRoot);
                            })[0];

                            if (suggestionRoot) {
                                deferred.resolve([getItem(suggestionRoot.id, suggestionRoot.label, $.trim(match[2]), $.trim(match[3]))]);
                            }
                        }

                        results.push(getItem($.trim(match[1]), $.trim(match[1]), $.trim(match[2]), $.trim(match[3])));
                    }

                    //console.log('getCadastralRef promise resuelta');
                    deferred.resolve(results);
                }
            });
        } else {
            //console.log('getCadastralRef promise resuelta - no es ref catastral');
            deferred.resolve([]);
        }

        //console.log('getCadastralRef promise');
        return deferred.promise();
    };

    ctlProto.getStringPattern = function (allowedRoles, pattern) {
        var self = this;
        var deferred = new $.Deferred();
        var results = [];

        var getDataRoles = function (data) {
            return allowedRoles.map(function (elm) {
                var type = self.getSearchTypeByRole(elm);
                if (Object.keys(type.queryProperties).length === Object.keys(data).length) {
                    return type.typeName;
                }
            });
        };

        var normalizedCriteria = function (value) {
            var _value = '';

            value = self.removePunctuation(value);

            //var match;
            //if (value.indexOf('(') > -1 || value.indexOf(')') > -1) {
            //    _pattern = /(.*)(\s<>\s.*\(.*\))/;
            //    if (value.indexOf('<>') > -1 && _pattern.test(value)) {
            //        match = value.match(_pattern);
            //        if (match !== null) {
            //            _value = value.replace(match[2], '');
            //            _value = _value.splitRemoveWhiteSpaces(',').join(',');
            //        }
            //    } else {
            //        // eliminamos el municipio dejando solo la localidad
            //        _pattern = /\(.*\)/;
            //        if (!_pattern.test(value)) {
            //            // no contiene () comprobamos solo (
            //            _pattern = /\(.*/;
            //            if (!_pattern.test(value)) {
            //                // no contiene ( comprobamos solo )
            //                _pattern = /.*\)/;
            //                if (!_pattern.test(value)) {
            //                    _pattern = /\(.*\)/;
            //                }
            //            }
            //        }

            //        _value = value.replace(_pattern, '');
            //        _value = _value.splitRemoveWhiteSpaces(',').join(',');
            //    }

            //    value = _value;
            //}


            // elimino los caracteres especiales
            if (self.NORMAL_PATTERNS.ROMAN_NUMBER.test(value))
                value = value.replace(self.NORMAL_PATTERNS.ABSOLUTE_NOT_DOT, '');
            else
                value = value.replace(self.NORMAL_PATTERNS.ABSOLUTE, '');
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
            while (ch < check.length && !isCheck[ch].call(self, value)) {
                ch++;
            }

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

                    var i = result.length;
                    while (i--) {
                        if (limit) {
                            if (result[i].t) {
                                var indicatedRoot = this.rootCfg.active.rootLabel.filter(function (elem) {
                                    return elem.label.indexOf(this.removePunctuation(result[i].t).toLowerCase()) > -1;
                                }.bind(this));

                                if (indicatedRoot.length == 1) {
                                    result[i].t = indicatedRoot[0].id;
                                } else if (indicatedRoot.length > 1) {

                                    indicatedRoot.map(function (elem) {
                                        var newResult = $.extend({
                                        }, result[i]);
                                        newResult.t = elem.id;

                                        result.push(newResult);
                                    });

                                } else if (indicatedRoot.length == 0) {
                                    result.splice(i, 1);
                                }
                            }
                        }
                        else result.push($.extend({
                        }, result[i], {
                            t: root
                        }));
                    }
                }
            }.bind(self);
            var tsp = function (text, result) {

                // town, street, portal - street, town, portal
                var match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);
                if (match && match[1] && match[2]) {

                    var getPortal = function () {
                        return _formatStreetNumber((match[3] || match[4] || match[5] || match[6]).trim());
                    };
                    // ninguno contiene número duplicamos búsqueda
                    if (/^([^0-9]+)$/i.test(match[1].trim()) && /^([^0-9]+)$/i.test(match[2].trim())) {
                        result.push({
                            t: match[1].trim(), s: match[2].trim(), p: getPortal()
                        });
                        result.push({
                            t: match[2].trim(), s: match[1].trim(), p: getPortal()
                        });
                    }
                    else {  // indicamos como calle el criterio que contiene números, ya que no existen municipios con números pero sí calles
                        if (/^([^0-9]+)$/i.test(match[1].trim())) result.push({
                            t: match[1].trim(), s: match[2].trim(), p: getPortal()
                        });
                        else result.push({
                            s: match[1].trim(), t: match[2].trim(), p: getPortal()
                        });
                    }
                    bindRoot(result);
                    return true;
                }

                return false;
            };
            var spt = function (text, result) {

                // street, portal, town
                var match = /^(?:([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))(?:\s*\,\s*)([^0-9\,]+)$/i.exec(text);
                if (match && match[6] && match[1]) {

                    var getPortal = function () {
                        return _formatStreetNumber((match[2] || match[3] || match[4] || match[5]).trim());
                    };
                    // ninguno contiene número duplicamos búsqueda
                    if (/^([^0-9]+)$/i.test(match[6].trim()) && /^([^0-9]+)$/i.test(match[1].trim())) {
                        result.push({
                            t: match[6].trim(), s: match[1].trim(), p: getPortal()
                        });
                        result.push({
                            t: match[1].trim(), s: match[6].trim(), p: getPortal()
                        });
                    }
                    else {  // indicamos como calle el criterio que contiene números, ya que no existen municipios con números pero sí calles
                        if (/^([^0-9]+)$/i.test(match[6].trim())) result.push({
                            t: match[6].trim(), s: match[1].trim(), p: getPortal()
                        });
                        else result.push({
                            s: match[6].trim(), t: match[1].trim(), p: getPortal()
                        });
                    }
                    bindRoot(result);
                    return true;
                }

                return false;
            };
            var tnsp = function (text, result) {

                // town, numbers street, portal
                var match = /^(?:([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)([^0-9\,]+)(?:\s*\,\s*)(?:(\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);

                if (match && match[1] && match[2]) {
                    result.push({
                        t: match[2].trim(), s: match[1].trim(), p: _formatStreetNumber((match[3] || match[4] || match[5] || match[6]).trim())
                    });
                    bindRoot(result);
                    return true;
                }

                return false;
            };
            var ts = function (text, result) {

                // town, street
                var match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúüàèìòù"\s*\-\.\(\)\/0-9]+))$/i.exec(text);

                // topónimo, municipio
                if (!match && /^[^0-9]*$/i.test(text.trim())) { // si no hay números reviso dándole la vuelta, si hay números que lo trate la función st
                    var criteria = text.split(',').reverse();
                    match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúüàèìòù"\s*\-\.\(\)\/0-9]+))$/i.exec(criteria.join(','));
                }


                if (match && match[1] && match[2]) {
                    // ninguno contiene número duplicamos búsqueda
                    if (/^([^0-9]+)$/i.test(match[1].trim()) && /^([^0-9]+)$/i.test(match[2].trim())) {
                        result.push({
                            t: match[1].trim(), s: match[2].trim()
                        });
                        result.push({
                            s: match[1].trim(), t: match[2].trim()
                        });
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
                            result.push({
                                t: match[1].trim(), s: getStreet(match[2].trim())
                            });
                        else result.push({
                            s: getStreet(match[1].trim()), t: match[2].trim()
                        });
                    }
                    bindRoot(result);
                    return true;
                }

                return false;
            };
            var st = function (text, result) {

                // street, town
                var match = /^(?:([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+))(?:\s*\,\s*)([^0-9\,]+)$/i.exec(text);

                if (!match) {
                    var criteria = text.split(',').reverse();
                    match = /^([^0-9\,]+)(?:\s*\,\s*)(?:([^\,][a-zñáéíóúüàèìòù"\s*\-\.\(\)\/0-9]+))$/i.exec(criteria.join(','));
                }

                if (match) { // puede generar falsos positivos cuando el portal llega seguido de la calle -> calle mayor 14, pamplona
                    var data = {
                    };
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

                                    if (/^([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9]+)$/i.test(_criteria.reverse().join(' ').trim())) {
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
                var match = /^([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/0-9\<\>]+)$/i.exec(text);
                if (match && match[1]) {
                    if (root) {
                        result.push({
                            t: match[1].trim()
                        });

                        result.push({
                            t: root,
                            s: match[1].trim()
                        });
                    }
                    else result.push({
                        t: match[1].trim()
                    });
                    return true;
                }

                return false;
            };
            var sp = function (text, result) { // calle sin números con portal (cuando exista un municipio root establecido)
                var match = /^([^\,][a-zñáéíóúüàèìòù\s*\-\.\(\)\/]+)\s*\,?\s*((\d{1,3}\s?\-?\s?[a-z]{0,4}\s?\-?\s?[a-z]{0,4})|([a-z]{1,4}\s?\-?\s?\d{1,3})|(sn|S\/N|s\/n|s\-n)|([a-z]{1,4}\s?\+\s?[a-z]{1,4}))$/i.exec(text);
                if (match && match[1] && match[2]) { // && text.indexOf(',') > -1 && text.split(',').length < 3) {
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
                if (match && match[1] && match[2] && root) {
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
                var tests = [function (text) {
                    return text.length >= 3;
                },
                function (text) {
                    return /^\d+$/.test(text) ? false : (/^\d+\,\s*\d+$/.test(text) ? false : true);
                }];

                for (var i = 0; i < tests.length; i++) {
                    if (!tests[i].call(self, text))
                        return false;
                }

                return true;
            };


            if (test(text)) {
                var check = [tsp, spt, tnsp, ts, st];
                if (root && text.split(',').length < 3)
                    check = [sp, snp, s_or_t].concat(check);
                else check = check.concat([sp, snp, s_or_t]);

                var ch = 0;
                try {
                    while (ch < check.length && !check[ch].call(self, text, result)) {
                        ch++;
                    }
                }
                catch (ex) {
                    TC.error("Error según el patrón: " + text, TC.Consts.msgErrorMode.EMAIL, "Error en la búsqueda del callejero");
                }
            }

            deferred.resolve(result);

            return deferred;
        };

        var getResults = function (searchObjects) {
            if (searchObjects) {
                self._search.data = results;

                if (!self.request) {
                    self.request = [];
                }

                function searchQuery(data, dataRole) {

                    var type = self.getSearchTypeByRole(dataRole);

                    return $.ajax({
                        url: type.url,
                        type: 'POST',
                        contentType: "application/x-www-form-urlencoded;charset=UTF-8",
                        dataType: 'text',
                        data: type.filter.getParams(data),
                        beforeSend: function () {
                            self.$list.html('<li><a class="tc-ctl-search-li-loading" href="#">' + self.getLocaleString('searching') + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>');
                            self.$text.trigger("targetUpdated.autocomplete");
                        }
                    }).done(function (data) {
                        results = results.concat(type.getSuggestionListElements(data));
                    }).fail(function (data) {
                        if (data.statusText !== 'abort')
                            alert('error');

                        //console.log('getStringPattern promise resuelta - data.statusText: ' + data.statusText);
                        deferred.resolve(results);
                    });
                }

                $.map(searchObjects, function (data, i) {
                    var dataRoles = getDataRoles(data);

                    for (var i = 0; i < dataRoles.length; i++) {
                        var dataRole = dataRoles[i];

                        if (dataRole && self.getSearchTypeByRole(dataRole)) {
                            self.request.push(searchQuery(data, dataRole));
                        }
                    }
                });
                $.when.apply($, self.request).then(function () {
                    //self.request = [];
                    //console.log('getStringPattern promise resuelta');
                    deferred.resolve(results);
                });
            } else {
                //console.log('getStringPattern promise resuelta - no encaja en address');
                deferred.resolve(results);
            }
        }

        pattern = normalizedCriteria(pattern);

        /* gestionamos:
            Entidad de población: Irisarri Auzoa (Igantzi)
            Topónimo: Aldabeko Bidea (Arbizu)
        */
        var combinedCriteria = /(.*)\((.*)\)/.exec(pattern);
        if (combinedCriteria && combinedCriteria.length > 2) {
            var bothSearchObjects = [];
            // búsqueda de entidad de población
            getObjectsTo(combinedCriteria[1],
                self.rootCfg.active && self.rootCfg.active.root || '', self.rootCfg.active && self.rootCfg.active.limit || false).then(function (searchObjects) {

                    bothSearchObjects = searchObjects || [];
                    // búsqueda de topónimo
                    getObjectsTo(combinedCriteria[1] + ',' + combinedCriteria[2],
                        self.rootCfg.active && self.rootCfg.active.root || '', self.rootCfg.active && self.rootCfg.active.limit || false).then(function (searchObjects) {

                            bothSearchObjects = bothSearchObjects.concat(searchObjects);

                            getResults(bothSearchObjects);
                        });
                });

            return deferred.promise();
        } else {
            getObjectsTo(pattern, self.rootCfg.active && self.rootCfg.active.root || '', self.rootCfg.active && self.rootCfg.active.limit || false).then(getResults);
            //console.log('getStringPattern promise');
            return deferred.promise();
        }
    };

    ctlProto.getRoad = function (pattern) {
        var self = this;
        var deferred = new $.Deferred();

        pattern = pattern.trim();
        if (pattern.length < 2) {
            deferred.resolve([]);
        } else {
            var type = self.getSearchTypeByRole(TC.Consts.searchType.ROAD);

            var roadPattern = type.getPattern();
            var match = roadPattern.exec(pattern);
            if (match && match[3]) {

                var _pattern = match[2] ? match[2].trim() + "-" + match[3].trim() : match[3].trim();
                if (match[4] && match[4].length > 0) {
                    _pattern = _pattern + "-" + match[4].trim();
                }

                $.ajax({
                    url: type.url + '?' + type.filter.getParams({ t: _pattern }),
                    type: 'GET',
                    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
                    beforeSend: function () {
                        self.$list.html('<li><a class="tc-ctl-search-li-loading" href="#">' + self.getLocaleString('searching') + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>');
                        self.$text.trigger("targetUpdated.autocomplete");
                    }
                }).done(function (data) {
                    var result = [];
                    if (data.totalFeatures > 0) {
                        data.features.map(function (feature) {
                            var properties = type.outputProperties;
                            if (!result.some(function (elem) {
                                return (elem.text == feature.properties[properties[0]]);
                            })) {
                                var label = type.outputFormatLabel.tcFormat(type.outputProperties.map(function (outputProperty) {
                                    return feature.properties[outputProperty];
                                }));

                                var text = type.outputProperties.map(function (outputProperty) {
                                    return feature.properties[outputProperty];
                                }).join('-');

                                result.push({
                                    id: type.dataIdProperty.map(function (elem) {
                                        return feature.properties[elem];
                                    }).join('#'),
                                    label: label,
                                    text: text,
                                    dataLayer: feature.id.split('.')[0],
                                    dataRole: type.typeName
                                });
                            }
                        });

                        //console.log('getRoad promise resuelta');
                        deferred.resolve(result);
                    } else {
                        //console.log('getRoad promise resuelta');
                        deferred.resolve([]);
                    }
                }).fail(function (data) {
                    //console.log('getRoad promise resuelta - xhr fail');
                    deferred.resolve([]);
                });
            } else {
                //console.log('getRoad promise resuelta - no encaja en road');
                deferred.resolve([]);
            }
        }

        //console.log('getRoad promise');
        return deferred.promise();
    };

    ctlProto.getPK = function (pattern) {
        var self = this;
        var deferred = new $.Deferred();

        pattern = pattern.trim();
        if (pattern.length < 3) {
            deferred.resolve([]);
        } else {

            var type = self.getSearchTypeByRole(TC.Consts.searchType.ROADPK);

            var roadPKPattern = type.getPattern();
            var match = roadPKPattern.exec(pattern);
            if (match && match[3] && match[5]) {

                var _pattern = match[2] ? match[2].trim() + "-" + match[3].trim() : match[3].trim();
                if (match[4] && match[4].length > 0) {
                    _pattern = _pattern + "-" + match[4].trim();
                }

                $.ajax({
                    url: type.url + '?' + type.filter.getParams({ t: _pattern, s: match[5].trim() }),
                    type: 'GET',
                    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
                    beforeSend: function () {
                        self.$list.html('<li><a class="tc-ctl-search-li-loading" href="#">' + self.getLocaleString('searching') + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>');
                        self.$text.trigger("targetUpdated.autocomplete");
                    }
                }).done(function (data) {
                    var result = [];
                    if (data.totalFeatures > 0) {
                        data.features.map(function (feature) {
                            var properties = type.outputProperties;
                            if (!result.some(function (elem) {
                                return (elem.label == feature.properties[properties[0]]);
                            })) {
                                var text = type.outputFormatLabel.tcFormat(type.outputProperties.map(function (outputProperty) {
                                    return feature.properties[outputProperty];
                                }));
                                result.push({
                                    id: type.dataIdProperty.map(function (elem) {
                                        return feature.properties[elem];
                                    }).join('#'),
                                    label: text,
                                    text: text,
                                    dataLayer: feature.id.split('.')[0],
                                    dataRole: type.typeName
                                });
                            }
                        });
                        //console.log('getRoadPK promise resuelta');
                        deferred.resolve(result);
                    } else {
                        //console.log('getRoadPK promise resuelta');
                        deferred.resolve([]);
                    }
                }).fail(function (data) {
                    //console.log('getRoadPK promise resuelta - xhr fail');
                    deferred.resolve([]);
                });
            } else {
                //console.log('getRoadPK promise resuelta - no encaja en pk');
                deferred.resolve([]);
            }
        }

        //console.log('getRoadPK promise');
        return deferred.promise();
    };

    ctlProto.search = function (pattern, callback) {
        var self = this;
        var results = [];        

        if (self.request) {

            for (var i = 0; i < self.request.length; i++) {
                console.log("new criteria: search promise/s aborted");
                self.request[i].abort();
            }

            self.request = [];
        }

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

            self.allowedSearchTypes.forEach(function (allowed) {
                if (allowed.parser) {
                    addWaiting(allowed.parser);
                } else {
                    console.log('Falta implementación del método parser');
                }
            });

            $.when.apply(self, waiting).then(function () {
                if (results)
                    self._search.data = results = results.sort(function (a, b) {
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
                    }.bind(self));

                if (callback)
                    callback(results);

                if (results.length === 0) {
                    self.cleanMap();

                    if (!self.layer || self.layer && self.layer.features.length === 0 && self.request && self.request.length > 0 || self.request.length == 0 || !self.request) {
                        self.$list.html('<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>');
                        self.$text.trigger("targetUpdated.autocomplete");
                    }
                }

                self.lastPattern = "";
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
    ctlProto._goToResult = function (id, dataRole) {
        var self = this;
        var goTo = null;
        const deferred = $.Deferred();

        if (!self.loading)
            self.loading = self.map.getControlsByClass("TC.control.LoadingIndicator")[0];

        var wait;
        wait = self.loading.addWait();

        // en pantallas pequeñas, colapsamos el panel de herramientas
        if (Modernizr.mq('(max-width: 30em)')) {
            self.$text.blur();
            self.map.$events.trigger($.Event(TC.Consts.event.TOOLSCLOSE), {});
        }

        self.cleanMap();

        var customSearchType = false;
        var keepOnLooping = true;

        self.allowedSearchTypes.forEach(function (allowed) {
            if (keepOnLooping) {

                if (!self.availableSearchTypes[allowed.typeName]) {

                    if (allowed.goTo) {
                        customSearchType = true;

                        goTo = allowed.goTo.call(self, id);
                        if (goTo !== null) {
                            keepOnLooping = false;
                        }
                    } else console.log('Falta implementación del método goTo');

                } else {

                    var dr = dataRole || self.getElementOnSuggestionList(id).dataRole;
                    if (dr) {

                        var searchType = self.getSearchTypeByRole(dr);

                        if (self.availableSearchTypes[dr] && searchType && searchType.goTo) {
                            goTo = searchType.goTo.call(self, id, dr);
                            if (goTo !== null) {
                                keepOnLooping = false;
                            }
                        } else if (!self.availableSearchTypes[dr] && searchType && searchType.goTo) {
                            customSearchType = true;

                            goTo = searchType.goTo.call(self, id, dr);
                            if (goTo !== null) {
                                keepOnLooping = false;
                            }
                        } else console.log('Falta implementación del método goTo');
                    }
                }
            }
        });

        self.loading.removeWait(wait);

        if (goTo) {

            self.getLayer().then(function (layer) {
                switch (true) {
                    case goTo.params.type == TC.Consts.layerType.VECTOR:
                        for (var i = 0; i < self.WFS_TYPE_ATTRS.length; i++) {
                            if (layer.hasOwnProperty(self.WFS_TYPE_ATTRS[i]))
                                delete layer[self.WFS_TYPE_ATTRS[i]];
                        }
                        break;
                    case goTo.params.type == TC.Consts.layerType.WFS:
                        for (var i = 0; i < self.WFS_TYPE_ATTRS.length; i++) {
                            layer[self.WFS_TYPE_ATTRS[i]] = goTo.params[self.WFS_TYPE_ATTRS[i]];
                        }

                        wait = self.loading.addWait();
                        break;
                    default:
                }

                layer.type = goTo.params.type;

                layer.refresh().then(function () {
                    self.map.one(TC.Consts.event.LAYERUPDATE, function (e) {
                        if (e.layer == layer) {
                            // Salta cuando se pinta una feature que no es de tipo API porque la gestión de estilos salta antes (no es controlable)
                            self.map.one(TC.Consts.event.FEATURESADD, function (e) {
                                if (e.layer == layer) {
                                    if (!e.layer.features || e.layer.features.length == 0 && e.layer.wrap.layer.getSource().getFeatures()) {
                                        self.$list.hide('fast');
                                        var bounds = e.layer.wrap.layer.getSource().getExtent();
                                        var radius = e.layer.map.options.pointBoundsRadius;

                                        if (bounds[2] - bounds[0] === 0) {
                                            bounds[0] = bounds[0] - radius;
                                            bounds[2] = bounds[2] + radius;
                                        }
                                        if (bounds[3] - bounds[1] === 0) {
                                            bounds[1] = bounds[1] - radius;
                                            bounds[3] = bounds[3] + radius;
                                        }
                                        e.layer.map.setExtent(bounds);

                                        // GLS: Necesito diferenciar un zoom programático de un zoom del usuario para la gestión del zoom en 3D
                                        self.map.$events.trigger($.Event(TC.Consts.event.ZOOMTO, {
                                            extent: bounds, layer: e.layer
                                        }));
                                    }
                                    else if (e.layer.features && e.layer.features.length > 0) {
                                        self.$list.hide('fast');
                                        setQueryableFeatures.call(self, e.layer.features);
                                        self.layer.map.zoomToFeatures(e.layer.features);

                                        self.map.$events.trigger($.Event(TC.Consts.event.FEATURESADD, { layer: self.layer, features: self.layer.features }));

                                    } else if (e.layer.features && e.layer.features.length == 0 && goTo.params.type == TC.Consts.layerType.WFS) {
                                        self.$list.html(goTo.emptyResultHTML);
                                        self.$text.trigger("targetUpdated.autocomplete");

                                        self.map.$events.trigger($.Event(TC.Consts.event.SEARCHQUERYEMPTY));
                                    }

                                    self.loading.removeWait(wait);
                                }
                            });

                            if (e.layer.features && e.layer.features.length > 0) {
                                self.$list.hide('fast');
                                setQueryableFeatures.call(self, e.layer.features);
                                self.layer.map.zoomToFeatures(self.layer.features);

                                self.map.$events.trigger($.Event(TC.Consts.event.FEATURESADD, { layer: self.layer, features: self.layer.features }));

                                self.loading.removeWait(wait);
                            } else if (e.layer.features && e.layer.features.length == 0 && goTo.params.type == TC.Consts.layerType.WFS) {
                                self.$list.html(goTo.emptyResultHTML);
                                self.$text.trigger("targetUpdated.autocomplete");

                                if (!(e.newData && e.newData.features && e.newData.features.length > 0)) {
                                    self.map.$events.trigger($.Event(TC.Consts.event.SEARCHQUERYEMPTY));
                                }

                                self.loading.removeWait(wait);
                            }
                        }
                    });
                });
            });

            deferred.resolve(goTo);
        } else {
            deferred.reject();
            if (!customSearchType) {
                self.map.$events.trigger($.Event(TC.Consts.event.SEARCHQUERYEMPTY));
            }
        }

        return deferred.promise();
    };

    ctlProto.goToResult = function (id, dataRole) {
        var self = this;
        // si está habilitada
        if (self.getSearchTypeByRole(dataRole)) {
            return self._goToResult(id, dataRole);
            // si no está habilitada pero está disponible
        } else if (self.availableSearchTypes[dataRole]) {
            self.addAllowedSearchType(dataRole, self.availableSearchTypes[dataRole], self);
            return self._goToResult(id, dataRole);
        } else {
            alert('No se reconoce el tipo de búsqueda: ' + dataRole);
        }
    };

    var drawPoint = function (id) {
        var self = this;

        wait = self.loading.addWait();

        var point = self.getPoint(id);
        var delta;
        var title;
        var deferred;

        if (point) {
            title = self.getLabel(id);
            deferred = self.layer.addMarker(point, $.extend({}, self.map.options.styles.point, { title: title, group: title }));
            delta = self.map.options.pointBoundsRadius;
            self.map.setExtent([point[0] - delta, point[1] - delta, point[0] + delta, point[1] + delta]);
        } else {
            var match = /^Lat((?:[+-]?)\d+(?:\.\d+)?)Lon((?:[+-]?)\d+(?:\.\d+)?)$/.exec(id);
            id = self.LAT + match[2] + self.LON + match[1];
            point = self.getPoint(id);

            if (point) {
                title = self.getLabel(id);
                deferred = self.layer.addMarker(point, $.extend({}, self.map.options.styles.point, { title: title, group: title }));
                delta = self.map.options.pointBoundsRadius;
                self.map.setExtent([point[0] - delta, point[1] - delta, point[0] + delta, point[1] + delta]);

                self.$text.val(title);
            }
        }

        $.when(deferred).then(function (feat) {
            self.map.$events.trigger($.Event(TC.Consts.event.FEATURESADD, {
                layer: self.layer, features: [feat]
            }));

            self.loading.removeWait(wait);
        });

    };
    ctlProto.goToCoordinates = function (id) {
        var self = this;
        var goTo = {};
        if (/^X(\d+(?:[\.\,]\d+)?)Y(\d+(?:[\.\,]\d+)?)$/.test(id) || /^Lat((?:[+-]?)\d+(?:[.,]\d+)?)Lon((?:[+-]?)\d+(?:[.,]\d+)?)$/.test(id)) {

            goTo.params = {
                type: TC.Consts.layerType.VECTOR,
                styles: {
                    marker: {
                        url: self.layerStyleFN.bind(self, 'marker', 'url', true)
                    }
                }
            };

            goTo.emptyResultHTML = '<li><a class="tc-ctl-search-li-empty">' + self.OUTBBX_LABEL + '</a></li>';

            drawPoint.call(self, id);

            return goTo;
        }

        return null;
    };

    ctlProto.goToCadastralRef = function (id) {
        var self = this;
        var goTo = {};

        var regex = new RegExp("^" + self.MUN + "(\\d+)" + self.POL + "(\\d{1,2})" + self.PAR + "{1}(\\d{1,4})");
        if (regex.test(id)) {
            var match = regex.exec(id);

            if (!TC.filter) {
                TC.syncLoadJS(TC.apiLocation + 'TC/Filter');
            }

            var type = self.getSearchTypeByRole(TC.Consts.searchType.CADASTRAL);

            goTo.params = {
                type: TC.Consts.layerType.WFS,
                url: type.url,
                version: type.version,
                geometryName: type.geometryName,
                featurePrefix: type.featurePrefix,
                featureType: type.featureType,
                properties: new TC.filter.and(
                    new TC.filter.equalTo(type.queryProperties.firstQueryWord, $.trim(match[1])),
                    new TC.filter.equalTo(type.queryProperties.secondQueryWord, $.trim(match[2])),
                    new TC.filter.equalTo(type.queryProperties.thirdQueryWord, $.trim(match[3]))),
                outputFormat: type.outputFormat,
                styles: type.styles
            };

            goTo.emptyResultHTML = '<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>';

            return goTo;
        }

        return null;
    };

    ctlProto.goToRoad = function (id) {
        var self = this;
        var goTo = {};

        var type = self.getSearchTypeByRole(TC.Consts.searchType.ROAD);

        goTo.params = {
            type: TC.Consts.layerType.WFS,
            url: type.url,
            version: type.version,
            geometryName: type.geometryName,
            featurePrefix: type.featurePrefix,
            featureType: type.getFeatureTypes(),
            maxFeatures: 3000,
            properties: type.filter.getGoToFilter(id),
            outputFormat: type.outputFormat,
            styles: type.styles
        };

        goTo.emptyResultHTML = '<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>';

        return goTo;
    };

    ctlProto.goToPK = function (id) {
        var self = this;
        var goTo = {};

        var type = self.getSearchTypeByRole(TC.Consts.searchType.ROADPK);

        goTo.params = {
            type: TC.Consts.layerType.WFS,
            url: type.url,
            version: type.version,
            geometryName: type.geometryName,
            featurePrefix: type.featurePrefix,
            featureType: type.getFeatureTypes(),
            maxFeatures: 3000,
            properties: type.filter.getGoToFilter(id),
            outputFormat: type.outputFormat,
            styles: type.styles
        };

        goTo.emptyResultHTML = '<li><a title="' + self.EMPTY_RESULTS_TITLE + '" class="tc-ctl-search-li-empty">' + self.EMPTY_RESULTS_LABEL + '</a></li>';

        return goTo;
    };

    ctlProto.goToStringPattern = function (id, dataRole) {
        var self = this;
        var goTo = {};

        var type = self.getSearchTypeByRole(dataRole);

        goTo.params = {
            type: TC.Consts.layerType.WFS,
            url: type.url,
            version: type.version,
            geometryName: type.geometryName,
            featurePrefix: type.featurePrefix,
            featureType: type.getFeatureTypes(),
            maxFeatures: 3000,
            properties: type.filter.getGoToFilter(id),
            outputFormat: type.outputFormat,
            styles: type.styles
        };

        return goTo;
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
            match = /^Lat((?:[+-]?)\d+(?:[.,]\d+)?)Lon((?:[+-]?)\d+(?:[.,]\d+)?)$/.exec(pattern);
            if (match && match.length === 3) {
                point = [parseFloat(match[2]), parseFloat(match[1])];
                if (!isMapGeo) {
                    return TC.Util.reproject(point, self.map.options.geoCrs, self.map.crs);
                }
            }

            match = /^Lon((?:[+-]?)\d+(?:[.,]\d+)?)Lat((?:[+-]?)\d+(?:[.,]\d+)?)$/.exec(pattern);
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
            if (extent instanceof Array)
                return point[0] >= extent[0] && point[0] <= extent[2] && point[1] >= extent[1] && point[1] <= extent[3];
            else return true;
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
        var locale = TC.Util.getMapLocale(self.map);

        if (id.match(new RegExp('^(?:' + self.LAT + '[-\\d])|(?:' + self.UTMX + '[\\d])'))) {
            result = result.replace(self.LAT, self.LAT_LABEL).replace(self.LON, ' ' + self.LON_LABEL).replace(self.UTMX, self.UTMX_LABEL).replace(self.UTMY, ' ' + self.UTMY_LABEL);
            var match = result.match(new RegExp('^' + $.trim(self.LAT_LABEL) + '*\\s*([-+]?\\d{1,3}([.,]\\d+)?)\\,?\\s*' + $.trim(self.LON_LABEL) + '*\\s*([-+]?\\d{1,2}([.,]\\d+)?)$'));
            if (match) {
                result = result.replace(match[1], parseFloat(match[1]).toLocaleString(locale));
                result = result.replace(match[3], parseFloat(match[3]).toLocaleString(locale));
            }

            var localeDecimalSeparator = 1.1.toLocaleString(locale).substring(1, 2);
            var match = result.match(new RegExp('^' + $.trim(self.UTMX_LABEL) + '*\\s*([0-9]{' + self.UTMX_LEN + '}(?:[.,]\\d+)?)\\s*\\,?\\s*' + $.trim(self.UTMY_LABEL) + '*\\s*([0-9]{' + self.UTMY_LEN + '}(?:[.,]\\d+)?)$'));
            if (match) {
                if (!Number.isInteger(parseFloat(match[1])))
                    result = result.replace(match[1], match[1].replace('.', localeDecimalSeparator));
                if (!Number.isInteger(parseFloat(match[2])))
                    result = result.replace(match[2], match[2].replace('.', localeDecimalSeparator));
            }

        } else if (id.match(new RegExp('^(?:' + self.LON + '[-\\d])'))) {
            result = result.replace(self.LON, self.LON_LABEL).replace(self.LAT, ' ' + self.LAT_LABEL);

            var match = result.match(new RegExp('^' + $.trim(self.LON_LABEL) + '*\\s*([-+]?\\d{1,3}([.,]\\d+)?)\\,?\\s*' + $.trim(self.LAT_LABEL) + '*\\s*([-+]?\\d{1,2}([.,]\\d+)?)$'));
            if (match) {
                result = result.replace(match[1], parseFloat(match[1]).toLocaleString(locale));
                result = result.replace(match[3], parseFloat(match[3]).toLocaleString(locale));
            }

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
            'à': 'a',
            'Á': 'A',
            'À': 'A',
            'é': 'e',
            'è': 'e',
            'É': 'E',
            'È': 'E',
            'í': 'i',
            'ì': 'i',
            'Í': 'I',
            'Ì': 'I',
            'ó': 'o',
            'ò': 'o',
            'Ó': 'O',
            'Ò': 'O',
            'ú': 'u',
            'ù': 'u',
            'ü': 'u',
            'Ú': 'U',
            'Ù': 'U',
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

    ctlProto.exportState = function () {
        const self = this;
        return {
            id: self.id,
            searchText: self.$text.val(),
            layer: self.layer.exportState({
                exportStyles: false
            })
        };
    };

    ctlProto.importState = function (state) {
        const self = this;
        self.$text.val(state.searchText);
        self.layer.importState(state.layer).then(function () {
            self.layer.features.forEach(function (f) {
                f.setStyle(null); // Los estilos vienen dados exclusivamente por la capa, borramos estilos propios de la feature
            });
        });
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
        var match = this.toLowerCase().match(/[^A-ZÁÉÍÓÚÜÀÈÌÒÙáéíóúüàèìòùa-z0-9_]+(.)/g);
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

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

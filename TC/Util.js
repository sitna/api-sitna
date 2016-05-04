var TC = TC || {};

(function () {
    var iconUrlCache = {};
    var markerGroupClassCache = {};

    TC.Util = TC.Util || {

        isURI: function (text) {
            return /^(http|https|ftp|mailto)\:\/\//i.test(text);
        },

        /* 
        * getDiv: returns HTML element or null if the parameter is invalid
        * Parameter: string with element ID or HTML element
        */
        getDiv: function (div) {
            var result;
            if (typeof div === 'string') {
                result = document.getElementById(div);
            }
            else if ($(div).length == 1) {
                result = div;
            }
            else {
                result = document.createElement('div');
            }
            return result;
        },

        /* 
        * getBackgroundUrlFromCss: devuelve la URL de background-image en CSS
        * Parameter: string con nombre de clase
        */
        getBackgroundUrlFromCss: function (cssClass) {
            var result = '';

            if (iconUrlCache[cssClass] !== undefined) {
                result = iconUrlCache[cssClass];
            }
            else {
                var iconDiv = $('<div style="display:none">').addClass(cssClass).appendTo('body');
                // The regular expression is nongreedy (.*?), otherwise in FF and IE it gets 'url_to_image"'
                var match = /^url\(['"]?(.*?)['"]?\)$/gi.exec(iconDiv.css('background-image'));
                if (match && match.length > 1) {
                    result = match[match.length - 1];
                }
                iconDiv.remove();
                iconUrlCache[cssClass] = result;
            }
            return result;
        },

        getPointIconUrl: function getPointIconUrl(options) {
            var result = null;
            if (options.url) {
                result = options.url;
            }
            else {
                var className;
                if (typeof options.cssClass === 'string') {
                    className = options.cssClass;
                }
                else {
                    var classes = options.classes || TC.Cfg.styles.marker.classes;
                    className = classes[0];
                    if (options.group) {
                        if (markerGroupClassCache[options.group] === undefined) {
                            var i = 0;
                            for (var key in markerGroupClassCache) {
                                i++;
                            }
                            i = i % classes.length;
                            markerGroupClassCache[options.group] = classes[i];
                        }
                        className = markerGroupClassCache[options.group];
                    }
                }
                result = TC.Util.getBackgroundUrlFromCss(className);
            }
            if (!result && options !== TC.Cfg.styles.point && options.cssClass !== '') {
                result = getPointIconUrl(TC.Cfg.styles.point);
            }
            return result;
        },

        /* 
        * addPathToTree: añade a un array a un árbol, cada elemento en un nivel anidado
        * Parameters: array, nodo de árbol, [índice]
        * Returns: último nodo insertado, null si ya existía la ruta
        */
        addArrayToTree: function addArrayToTree(path, treeNode, index) {
            var result = null;
            var found = false;
            index = index || 0;
            var name = path[index];
            if (name) {
                var n;
                for (var i = 0, len = treeNode.children.length; i < len; i++) {
                    n = treeNode.children[i];
                    if (n.name === name) {
                        found = true;
                        var r = addArrayToTree(path, n, index + 1);
                        if (r) {
                            result = r;
                        }
                        break;
                    }
                }
                if (!found) {
                    n = { name: name, title: name, uid: '/' + path.slice(0, index + 1).join('/'), children: [] };
                    treeNode.children.push(n);
                    result = n;
                }
            }
            return result;
        },

        parseCoords: function (text) {
            var result = null;

            var _parseGeoCoord = function (text) {
                var t = text;
                var result = {};
                result.type = TC.Consts.GEOGRAPHIC;
                var idx = t.indexOf('\u00B0');
                result.value = parseFloat(t.substr(0, idx));
                t = t.substr(idx + 1);
                idx = t.indexOf('\'');
                if (idx >= 0) {
                    var v = parseFloat(t.substr(0, idx)) / 60;
                    if (result.value >= 0) {
                        result.value += v;
                    }
                    else {
                        result.value -= v;
                    }
                    t = t.substr(idx + 1);
                    idx = t.indexOf('\'');
                    if (idx >= 0) {
                        v = parseFloat(t.substr(0, idx).replace(',', '.')) / 3600;
                        if (result.value >= 0) {
                            result.value += v;
                        }
                        else {
                            result.value -= v;
                        }
                    }
                }
                return result;
            };

            var _parseCoord = function (text) {
                var t = $.trim(text);
                // nnºnn'nn''N
                if (t.match(/^1?\d{0,2}\s*\u00B0(\s*\d{1,2}\s*'(\s*\d{1,2}([.,]\d+)?\s*'')?)?\s*[NnSsWwOoEe]$/g)) {
                    switch (t[t.length - 1]) {
                        case 'S':
                        case 's':
                        case 'W':
                        case 'w':
                        case 'O':
                        case 'o':
                            t = '-' + t;
                            break;
                    }
                    t = t.substr(0, t.length - 1);
                    return _parseGeoCoord(t);
                }
                // +nnºnn'nn''
                if (t.match(/^[+-]?1?\d{0,2}\s*\u00B0(\s*\d{1,2}\s*'(\s*\d{1,2}([.,]\d+)?\s*'')?)?$/g)) {
                    return _parseGeoCoord(t);
                }
                // nn.nn N
                if (t.match(/^1?\d{0,2}([.,]\d+)?\s*\u00B0?\s*[NnSsWwOoEe]$/g)) {
                    var result = { type: TC.Consts.GEOGRAPHIC, value: parseFloat(t.substr(0, t.length - 1).replace(',', '.')) };
                    if (t.match(/[SsWwOo]$/)) {
                        result.value = -result.value;
                    }
                    return result;
                }
                // +nn.nn
                if (t.match(/^[+-]?1?\d{0,2}([.,]\d+)?\s*\u00B0?$/g)) {
                    return { type: TC.Consts.GEOGRAPHIC, value: parseFloat(t.replace(',', '.')) };
                }
                // UTM
                if (t.match(/^\d{6,7}([.,]\d+)?$/g)) {
                    return { type: TC.Consts.UTM, value: parseFloat(t.replace(',', '.')) };
                }
                return null;
            };

            text = $.trim(text).toUpperCase();
            var xy = text.split(',');
            if (xy.length === 4) {
                xy = [xy.slice(0, 1).join('.'), xy.slice(2, 3).join('.')];
            }
            else if (xy.length === 1 || xy.length === 3) {
                xy = text.split(' ');
            }
            if (xy.length === 2) {
                var x = _parseCoord(xy[0]);
                var y = _parseCoord(xy[1]);
                if (x !== null && y !== null) {
                    result = [x, y];
                }
            }
            return result;
        },

        reproject: function (coords, sourceCrs, targetCrs) {
            var result;
            var multipoint = true;
            if (!(TC.isLegacy ? window[TC.Consts.PROJ4JSOBJ_LEGACY] : window[TC.Consts.PROJ4JSOBJ])) {
                TC.syncLoadJS(TC.url.proj4js);
            }
            if (!$.isArray(coords) || !$.isArray(coords[0])) {
                multipoint = false;
                coords = [coords];
            }
            TC.loadProjDef(sourceCrs, true);
            TC.loadProjDef(targetCrs, true);
            var sourcePrj = new Proj4js.Proj(sourceCrs);
            var targetPrj = new Proj4js.Proj(targetCrs);
            result = new Array(coords.length);
            for (var i = 0, len = coords.length; i < len; i++) {
                var point = Proj4js.transform(sourcePrj, targetPrj, { x: coords[i][0], y: coords[i][1] });
                result[i] = [point.x, point.y];
            }
            if (!multipoint) {
                result = result[0];
            }
            return result;
        },

        getMetersPerDegree: function (extent) {
            var result = undefined;
            var R = 6370997; // m
            var toRad = function (number) {
                return number * Math.PI / 180;
            };
            if ($.isArray(extent) && extent.length >= 4) {
                var dLat = toRad(extent[3] - extent[1]);
                var sindlat2 = Math.sin(dLat / 2);
                var a = sindlat2 * sindlat2;
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                result = R * c / (extent[3] - extent[1]);
            }
            return result;
        },

        radToDeg: function (rad) { // convert radians to degrees
            return rad * 360 / (Math.PI * 2);
        },
        degToRad: function (deg) { // convert degrees to radians
            return deg * Math.PI * 2 / 360;
        },
        mod: function (n) { // modulo for negative values
            return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        },

        getLocaleString: function (locale, key, texts) {
            var result = key;
            if (TC.i18n && TC.i18n[locale]) {
                var text = TC.i18n[locale][key];
                if (text) {
                    result = text;
                    if (texts) {
                        for (var k in texts) {
                            result = result.replace('{' + k + '}', texts[k]);
                        }
                    }
                }
            }
            return result;
        },

        getSimpleMimeType: function (mimeType) {
            var result = '';
            if (mimeType) {
                var end = mimeType.indexOf(';');
                if (end > 0) {
                    mimeType = mimeType.substring(0, end);
                }
                result = mimeType;
            }
            return result;
        },

        getQueryStringParams: function (url) {
            var queryString;
            if (url) {
                var queryIdx = url.indexOf('?');
                if (queryIdx >= 0) {
                    queryString = url.substr(queryIdx);
                    var fragmentIdx = queryString.indexOf('#');
                    if (fragmentIdx >= 0) {
                        queryString = queryString.substr(0, fragmentIdx)
                    }
                }
                else {
                    queryString = '?';
                }
            }
            else {
                queryString = location.search;
            }
            var result = $.map(queryString.replace(/(^\?)/, '').split("&"), function (elm) {
                return elm = elm.split("="), this[elm[0]] = elm[1], this
            }.bind({}))[0];
            delete result[''];
            return result;
        },

        fastUnshift: function (a, elm) {
            var len = a.length;
            while (len) {
                a[len] = a[len - 1];
                len--;
            }
            a[0] = elm;
        },

        storage: {
            getCookie: function (key) {
                return $.cookie(key);
            },
            setCookie: function (key, value, options) {
                return $.cookie(key, value, options);
            },
            getLocalValue: function (key) {
                var result = null;
                if (localStorage && localStorage instanceof Storage) {
                    result = localStorage.getItem(key);
                }
                else {
                    result = TC.Util.storage.getCookie(key);
                }
                return result;
            },
            setLocalValue: function (key, value) {
                if (localStorage && localStorage instanceof Storage) {
                    if (value === undefined) {
                        localStorage.removeItem(key);
                    }
                    else {
                        localStorage.setItem(key, value);
                    }
                }
                else {

                    if (value === undefined) {
                        var exDate = new Date();
                        exDate.setDate(exDate.getDate() - 1);
                        TC.Util.storage.setCookie(key, "", { expires: exDate });
                    }
                    else {
                        TC.Util.storage.setCookie(key, value);
                    }
                }
                return key;
            },
            getSessionLocalValue: function (key) {
                var result = null;
                if (sessionStorage && sessionStorage instanceof Storage) {
                    result = sessionStorage.getItem(key);
                }
                else {
                    result = TC.Util.storage.getCookie(key);
                }
                return result;
            },
            setSessionLocalValue: function (key, value) {
                if (sessionStorage && sessionStorage instanceof Storage) {
                    if (value === undefined) {
                        sessionStorage.removeItem(key);
                    }
                    else {
                        sessionStorage.setItem(key, value);
                    }
                }
                else {

                    if (value === undefined) {
                        var exDate = new Date();
                        exDate.setDate(exDate.getDate() - 1);
                        TC.Util.storage.setCookie(key, "", { expires: exDate });
                    }
                    else {
                        TC.Util.storage.setCookie(key, value);
                    }
                }
                return key;
            }
        },
        detectFirefox: function () {
            if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) //test for Firefox/x.x or Firefox x.x (ignoring remaining digits);
                return new Number(RegExp.$1); // capture x.x portion and store as a number
            else
                return false;
        },
        detectIE: function () {
            var ua = window.navigator.userAgent;

            var msie = ua.indexOf('MSIE ');
            if (msie > 0) {
                // IE 10 or older => return version number
                return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
            }

            var trident = ua.indexOf('Trident/');
            if (trident > 0) {
                // IE 11 => return version number
                var rv = ua.indexOf('rv:');
                return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
            }

            var edge = ua.indexOf('Edge/');
            if (edge > 0) {
                // IE 12 => return version number
                return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
            }

            // other browser
            return false;
        },
        detectChrome: function () {
            return window.chrome;
        },
        detectMouse: function () {
            if (Modernizr.mq('(pointer:coarse)') && Modernizr.mq('(pointer:fine)'))
                return true;
            if (Modernizr.mq('(pointer:coarse)') && !Modernizr.mq('(pointer:fine)')) {
                var testHover = function () {
                    //console.log('estamos en testHover');
                    var mq = '(hover: hover)',
                    hover = !Modernizr.touch, // fallback if mq4 not supported: no hover for touch
                    mqResult;

                    if ('matchMedia' in window) {
                        //console.log('dispone de matchMedia');
                        mqResult = window.matchMedia(mq);
                        //console.log('resultado de window.matchMedia(mq): ' + mqResult.media);
                        //console.log('mq: ' + mq);
                        if (mqResult.media === mq) {
                            //console.log('es igual');
                            // matchMedia supports hover detection, so we rely on that
                            hover = mqResult.matches;
                            //console.log('va retornar: ' + hover);
                        }
                    } else { console.log('no dispone de matchMedia'); }

                    return hover;
                };

                if (testHover())
                    return true;
                else return false;
            }
            if (!Modernizr.mq('(pointer:coarse)') && Modernizr.mq('(pointer:fine)'))
                return true;
            if (Modernizr.mq('(pointer:none)'))
                return false;
            if (!Modernizr.touch)
                return true;
        },
        getElementByNodeName: function (parentNode, nodeName) {
            var colonIndex = nodeName.indexOf(":");
            var tag = nodeName.substr(colonIndex + 1);
            var nodes = parentNode.getElementsByTagNameNS("*", tag);

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeName == nodeName)
                    return nodes;
            }
            return undefined;
        },
        removeURLParameter: function (url, parameter) {
            var urlparts = url.toLowerCase().split('?');
            if (urlparts.length >= 2) {

                var prefix = encodeURIComponent(parameter.toLowerCase()) + '=';
                var pars = urlparts[1].split(/[&;]/g);

                //reverse iteration as may be destructive
                for (var i = pars.length; i-- > 0;) {
                    //idiom for string.startsWith
                    if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                        pars.splice(i, 1);
                    }
                }

                url = urlparts[0] + '?' + pars.join('&');
                return url;
            } else {
                return url;
            }
        },

        showModal: function (contentNode, width, height, callback) {
            var $modal = $(contentNode);

            $modal.removeAttr("hidden").on("click", ".tc-modal-close", TC.Util.closeModal);
            $modal.fadeIn(250, callback);
        },


        closeModal: function () {
            $(".tc-modal").hide().find(".tc-modal-window").removeAttr("style").off();
        },

        closeAlert: function (btn) {
            $(btn).parents(".tc-alert").hide();
        },
    };
})();

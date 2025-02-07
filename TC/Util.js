import TC from '../TC';
import Consts from './Consts';
import i18n from './i18n';
import proj4 from 'proj4';
import UAParser from 'ua-parser-js';
import Handlebars from '../lib/handlebars/helpers';

TC.i18n = TC.i18n || i18n;

// GLS: Parche: Chrome no formatea correctamente los números en euskera, establece como separador de decimales el (.)
var toLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function (locale, _options) {
    if (locale === "eu-ES" && !Util.detectIE()) {
        var sNum = toLocaleString.apply(this, arguments);
        sNum = sNum.replace(/,/g, '.');
        if (!(Math.floor(this) === this && Number.isInteger(Math.floor(this))))
            sNum = sNum.replace(/.([^.]*)$/, ",$1");

        return sNum;
    }
    else
        return toLocaleString.apply(this, arguments);
};

var markerGroupClassCache = {};

var path1 = ["Capability", "Request", "GetMap", "DCPType", "0", "HTTP", "Get", "OnlineResource"];
var path2 = ["OperationsMetadata", "GetTile", "DCP", "HTTP", "Get", "0", "href"];
var getOnPath = function (obj, p, i) {
    if (i < p.length - 1) {
        if (Object.prototype.hasOwnProperty.call(obj, p[i])) {
            return getOnPath(obj[p[i]], p, ++i);
        }
        else {
            return null;
        }
    } else {
        return obj[p[i]];
    }
};

const swipeHandlers = new WeakMap();
const modalCloseHandlers = new WeakMap();
const hasOwn = {}.hasOwnProperty;
const templateCache = new Map();

const countDecimals = (value) => {
    if (Math.floor(value) !== value) {
        return value.toString().split('.')[1]?.length || 0;
    }
    return 0;
};

const stylePropertyNames = new Set([
    'strokeColor',
    'strokeWidth',
    'fillColor',
    'strokeOpacity',
    'fillOpacity',
    'url',
    'radius',
    'anchor',
    'width',
    'height',
    'label',
    'labelKey',
    'labelOutlineWidth',
    'labelOutlineColor',
    'labelOffset',
    'fontColor',
    'fontSize'
]);


var Util = {

    getElevationGain: function (options = {}) {
        const coords = options.coords;
        if (coords && coords.length > 0 && coords[0].length > 2) { // si tenemos la Z
            var uphill = 0;
            var downhill = 0;
            const hillDeltaThreshold = options.hillDeltaThreshold || 0;

            var previousHeight;
            var sectorMinHeight;
            var sectorMaxHeight;
            var previousUphill = true;

            for (var c = 0; c < coords.length; c++) {
                var point = coords[c];
                var height = point[2];
                if (height !== null) {
                    if (previousHeight === undefined) //--inicializar
                    {
                        previousHeight = height;
                        sectorMinHeight = height;
                        sectorMaxHeight = height;
                    }

                    sectorMinHeight = Math.min(sectorMinHeight, height); //--actualizar mínimo y máximo del sector
                    sectorMaxHeight = Math.max(sectorMaxHeight, height);

                    var delta = height - previousHeight; //--calcular desnivel del punto respecto al anterior
                    // hillDeltaThreshold: altura de los dientes a despreciar
                    if (delta > hillDeltaThreshold || delta > 0 && c === coords.length - 1) //--Si se sube más del filtro (o se acaba el segmento subiendo)
                    {
                        if (previousUphill) //--Si en el segmento anterior también se subía, incrementamos el desnivel positivo acumulado
                        {
                            uphill += delta;
                        }
                        else //--Si en el segmento anterior se bajaba, incrementamos los desniveles acumulados que no habíamos contabilizado desde el último salto del filtro (sector) 
                        {
                            downhill -= sectorMinHeight - previousHeight;
                            uphill += height - sectorMinHeight;
                            previousUphill = true; //--preparar para el paso siguiente
                        }
                        previousHeight = height; //--preparar para el paso siguiente
                        sectorMinHeight = height;
                        sectorMaxHeight = height;
                    }
                    else if (delta < -hillDeltaThreshold || delta < 0 && c === coords.length - 1) //--Si se baja más del filtro (o se acaba el segmento bajando)
                    {
                        if (!previousUphill) //--Si en el segmento anterior también se bajaba, incrementamos el desnivel negativo acumulado
                        {
                            downhill -= delta;
                        }
                        else //--Si en el segmento anterior se subía, incrementamos los desniveles acumulados que no habíamos contabilizado desde el último salto del filtro (sector) 
                        {
                            uphill += sectorMaxHeight - previousHeight;
                            downhill -= height - sectorMaxHeight;
                            previousUphill = false; //--preparar para el paso siguiente
                        }
                        previousHeight = height; //--preparar para el paso siguiente
                        sectorMinHeight = height;
                        sectorMaxHeight = height;
                    }
                }
            }

            return {
                upHill: Math.round(uphill),
                downHill: Math.round(downhill)
            };

        } else { return null; }
    },

    isPlainObject: function (obj) {
        // Not plain objects:
        // - Any object or value whose internal [[Class]] property is not "[object Object]"
        // - DOM nodes
        // - window
        if (typeof obj !== 'object' || obj.nodeType || obj.window === obj) {
            return false;
        }

        if (obj.constructor &&
            !hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
            return false;
        }

        // If the function hasn't returned already, we're confident that
        // |obj| is a plain object, created by {} or constructed with new Object
        return true;
    },

    isEmptyObject: function (obj) {
        var name;
        for (name in obj) {
            return false;
        }
        return true;
    },

    isFunction: function (obj) {
        return typeof obj === 'function';
    },

    extend: function () {
        var clone,
            target = arguments[0] || {},
            i = 1,
            deep = false,
            copyUndefinedValues = false;

        // Comprobar si hay que hacer copia profunda (primer parámetro === true)
        if (typeof target === 'boolean') {
            deep = target;

            target = arguments[i] ?? {};
            i++;


            // Comprobar si hay que copiar también las propiedades con valor undefined
            if (typeof target === 'boolean') {
                copyUndefinedValues = target;

                target = arguments[i] ?? {};
                i++;
            }
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== 'object' && !Util.isFunction(target)) {
            target = {};
        }

        for (var len = arguments.length; i < len; i++) {
            // Only deal with non-null/undefined values
            const options = arguments[i];
            if (options != null) {
                // Extend the base object
                for (var name in options) {
                    const src = target[name];
                    const copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    const copyIsArray = Array.isArray(copy);
                    if (deep && copy && (Util.isPlainObject(copy) || copyIsArray)) {
                        if (copyIsArray) {
                            clone = src && Array.isArray(src) ? src : [];

                        } else {
                            clone = src && Util.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = Util.extend(deep, copyUndefinedValues, clone, copy);

                        // Don't bring in undefined values
                    } else if (copyUndefinedValues || copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    },

    getMapLocale: function (map) {
        return map.options && map.options.locale && map.options.locale.replace('_', '-') || "es-ES";
    },

    regex: {
        PROTOCOL: /(^https?:)/i
    },

    isOnCapabilities: function (url) {
        var withProtocol = arguments.length == 2 ? arguments[1] : true;
        var testUrl = !withProtocol ? url.replace(Util.regex.PROTOCOL, "") : url;

        let c;
        if (withProtocol) {
            if (TC.capabilities[testUrl]) {
                return url;
            }
        } else {
            for (c in TC.capabilities) {
                if (c.replace(Util.regex.PROTOCOL, "") == testUrl) {
                    return c;
                }
            }
        }

        for (c in TC.capabilities) {
            var u = getOnPath(TC.capabilities[c], path1, 0) || getOnPath(TC.capabilities[c], path2, 0);

            if (u && withProtocol && url == u) {
                return u;
            }
            else if (u && url.replace(Util.regex.PROTOCOL, "") == u.replace(Util.regex.PROTOCOL, "")) {
                return u;
            }
        }

        return url;
    },

    reqGetMapOnCapabilities: function (url) {
        var withProtocol = arguments.length === 2 ? arguments[1] : true;

        var _get = function (caps) {
            var u = getOnPath(caps, path1, 0) || getOnPath(caps, path2, 0);
            if (u)
                return !withProtocol ? u.split('?')[0].replace(Util.regex.PROTOCOL, "") : u.split('?')[0];

            return null;
        };
        if (TC.capabilities[url]) {
            return _get(TC.capabilities[url]);
        }

        return null;
    },

    getFnFromString: function (fnName) {
        var scope = window;
        var scopeSplit = fnName.split('.');
        for (var i = 0; i < scopeSplit.length - 1; i++) {
            scope = scope[scopeSplit[i]];

            if (scope == undefined) return;
        }

        return scope[scopeSplit[scopeSplit.length - 1]];
    },

    isURL: function (text) {
        return /^(http|https|ftp|mailto):\/\//i.test(text);
    },

    isSecureURL: function (url) {
        //sino empieza por http ni por https la consideramos segura
        if (!/^(f|ht)tps?:\/\//i.test(url)) {
            return true;
        }
        return /^(f|ht)tps:\/\//i.test(url);
    },

    isSameOrigin: function (uri) {
        var result = uri.indexOf("http") !== 0 && uri.indexOf("//") !== 0;
        var urlParts = !result && uri.match(Consts.url.SPLIT_REGEX);
        if (urlParts) {
            var location = window.location;
            var uProtocol = urlParts[1];
            result =
                (uProtocol == location.protocol || uProtocol == undefined) &&
                urlParts[3] == location.hostname;
            var uPort = urlParts[4], lPort = location.port;
            if (uPort != 80 && uPort !== "" || lPort != "80" && lPort !== "") {
                result = result && uPort == lPort;
            }
        }
        return result;
    },

    formatNumber: function (value, locale) {
        var t = typeof value;
        if (t === 'number') {
            return value.toLocaleString(locale, { maximumFractionDigits: Math.min(6, countDecimals(value)) });
        }
        else if (t === 'string') {
            const n = parseFloat(value);
            if (n === new Number(value).valueOf()) {
                return n.toLocaleString(locale, { maximumFractionDigits: Math.min(6, countDecimals(n)) });
            }
        }
        else if (t === 'undefined') {
            return '';
        }
        return value;
    },

    getTextFromCssVar: function (varName, contextElement = document.documentElement) {
        const iconUcodeString = getComputedStyle(contextElement).getPropertyValue(varName);
        const match = iconUcodeString.match(/\\([a-f0-9]{1,6})/i);
        if (match) {
            return String.fromCharCode(parseInt(match[1], 16));
        }
        return iconUcodeString.replace(/['"]/g, '');
    },

    addProtocol: function (uri) {
        var result = uri;
        if (uri && uri.indexOf('//') === 0) {
            result = location.protocol + uri;
        }
        return result;
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
        else if (div instanceof HTMLElement) {
            result = div;
        }
        else if (div && '$' in window && div instanceof $ && div.length) {
            result = div[0];
        }
        else {
            result = document.createElement('div');
        }
        return result;
    },

    getScriptLocation: function () {
        var src;
        var script;
        if (document.currentScript) {
            script = document.currentScript;
        }
        else {
            var scripts = document.getElementsByTagName('script');
            script = scripts[scripts.length - 1];
        }
        src = script.getAttribute('src');
        if (src) {
            return src.substr(0, src.lastIndexOf('/') + 1);
        }
        return "";
    },

    getFeatureStyleFromCss: function (cssClass) {
        let result = null;

        if (cssClass) {
            const iconDiv = document.createElement('div');
            iconDiv.style.display = 'none';
            iconDiv.classList.add(cssClass);
            document.body.appendChild(iconDiv);
            // The regular expression is nongreedy (.*?), otherwise in FF and IE it gets 'url_to_image"'
            const computedStyle = window.getComputedStyle(iconDiv, null);
            const urlMatch = /^url\(['"]?(.*?)['"]?\)$/gi.exec(computedStyle.backgroundImage);
            if (urlMatch?.length > 1) {
                result = {
                    url: urlMatch[urlMatch.length - 1]
                };
                const sizeMatch = /^(\d+)px(?: (\d+)px)?$/gi.exec(computedStyle.backgroundSize);
                if (sizeMatch?.length > 2) {
                    result.width = parseInt(sizeMatch[1]);
                    if (sizeMatch[2]) {
                        result.height = parseInt(sizeMatch[2]);
                    }
                    else {
                        result.height = result.width;
                    }
                }
            }
            iconDiv.parentElement.removeChild(iconDiv);
        }
        return result;
    },

    getPointIconUrl: function getPointIconUrl(options) {
        var result = null;
        if (options.url) {
            result = options.url;
            if (/Firefox/.test(navigator.userAgent) && location.protocol === 'https:' && result.startsWith("http:")) {
                result = result.replace("http:", "https:");
            }
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
                    if (!Object.prototype.hasOwnProperty.call(markerGroupClassCache, options.group)) {
                        let i = Object.keys(markerGroupClassCache).length;
                        i = i % classes.length;
                        markerGroupClassCache[options.group] = classes[i];
                    }
                    className = markerGroupClassCache[options.group];
                }
            }
            result = Util.getFeatureStyleFromCss(className)?.url;
        }
        if (!result && options !== TC.Cfg.styles.point && options.cssClass !== '') {
            result = getPointIconUrl(TC.Cfg.styles.point);
        }
        return result;
    },

    getLegendImageFromStyle: function (style, options = {}) {
        let result = null;
        if (style.url) {
            result = style.url;
        }
        else {
            let width = options.width || 32;
            let height = options.height || 16;
            const strokeWidth = style.strokeWidth || 0;
            const strokeHalfWidth = strokeWidth / 2;
            const fillColor = style.fillColor || 'transparent';
            const fillOpacity = style.fillOpacity || 1;
            const diameter = (style.radius || 0) * 2 + strokeWidth;
            const lineDashText = style.lineDash ? `stroke-dasharray="${style.lineDash.join(' ')}" ` : '';
            let body;
            width = Math.max(width, diameter);
            height = Math.max(height, diameter);
            switch (options.geometryType) {
                case Consts.geom.POINT:
                    body = `<circle cx="${width / 2}" cy="${height / 2}" r="${style.radius}" stroke="${style.strokeColor}" stroke-width="${strokeWidth}" fill="${fillColor}" fill-opacity="${fillOpacity}" ${lineDashText}/>`;
                    break;
                case Consts.geom.POLYLINE: {
                    const xStart = strokeHalfWidth;
                    const yStart = height - strokeHalfWidth;
                    const xEnd = width - strokeHalfWidth;
                    const yEnd = strokeHalfWidth;
                    body = `<polyline points="${xStart},${yStart} ${xEnd},${yEnd}" style="stroke:${style.strokeColor};stroke-width:${strokeWidth}" ${lineDashText}/>`;
                    break;
                }
                case Consts.geom.POLYGON: {
                    const x1 = strokeHalfWidth;
                    const y1 = height - strokeHalfWidth;
                    const x2 = strokeHalfWidth;
                    const y2 = strokeHalfWidth;
                    const x3 = strokeHalfWidth + width * 0.8;
                    const y3 = strokeHalfWidth;
                    const x4 = width - strokeHalfWidth;
                    const y4 = height - strokeHalfWidth;
                    body = `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" style="stroke:${style.strokeColor};stroke-width:${strokeWidth};fill:${fillColor};fill-opacity:${fillOpacity}" ${lineDashText}/>`;
                    break;
                }
                default:
                    body = `<rect x="${strokeHalfWidth}" x="${strokeHalfWidth}" width="${width - strokeWidth}" height="${height - strokeWidth}" style="stroke:${style.strokeColor};stroke-width:${strokeWidth};fill:${fillColor};fill-opacity:${fillOpacity}" ${lineDashText}/>`;
                    break;
            }
            result = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`);
        }
        return result;
    },

    /* 
    * addArrayToTree: añade a un array a un árbol, cada elemento en un nivel anidado
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
                    if (index === path.length - 1) {
                        result = n;
                    }
                    else {
                        const r = addArrayToTree(path, n, index + 1);
                        if (r) {
                            result = r;
                        }
                    }
                    break;
                }
            }
            if (!found) {
                n = { name: name, title: name, uid: '/' + path.slice(0, index + 1).join('/'), children: [] };
                const r = addArrayToTree(path, n, index + 1);
                if (r) {
                    result = r;
                }
                else {
                    result = n;
                }
                n.parent = treeNode;
                treeNode.children.push(n);
            }
        }
        return result;
    },

    parseNumber: function (value, locale) {
        const format = new Intl.NumberFormat(locale);
        const parts = format.formatToParts(12345.6);
        const numerals = Array.from({ length: 10 }).map((_, i) => format.format(i));
        const index = new Map(numerals.map((d, i) => [d, i]));
        const groupSeparator = new RegExp(`[${parts.find(d => d.type === 'group').value}]`, 'g');
        const decimalSeparator = new RegExp(`[${parts.find(d => d.type === 'decimal').value}]`);
        const numeralCharacter = new RegExp(`[${numerals.join('')}]`, 'g');
        const getIndex = (d) => index.get(d);
        const parsedValue = value.trim()
            .replace(groupSeparator, '')
            .replace(decimalSeparator, '.')
            .replace(numeralCharacter, getIndex);
        return parsedValue ? +parsedValue : Number.NaN;
    },

    parseCoords: function (text) {
        var result = null;

        var _parseGeoCoord = function (text) {
            var t = text;
            var result = {};
            result.type = Consts.GEOGRAPHIC;
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
            var t = text.trim();
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
                var result = { type: Consts.GEOGRAPHIC, value: parseFloat(t.substr(0, t.length - 1).replace(',', '.')) };
                if (t.match(/[SsWwOo]$/)) {
                    result.value = -result.value;
                }
                return result;
            }
            // +nn.nn
            if (t.match(/^[+-]?1?\d{0,2}([.,]\d+)?\s*\u00B0?$/g)) {
                return { type: Consts.GEOGRAPHIC, value: parseFloat(t.replace(',', '.')) };
            }
            // UTM
            if (t.match(/^[-+]?\d{6,7}([.,]\d+)?$/g)) {
                return { type: Consts.UTM, value: parseFloat(t.replace(',', '.')) };
            }
            return null;
        };

        text = text.trim().toUpperCase();
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
        var multiring = true;
        var multipoly = true;
        if (Array.isArray(coords[0])) {
            if (Array.isArray(coords[0][0])) {
                if (!Array.isArray(coords[0][0][0])) {
                    multipoly = false;
                    coords = [coords];
                }
            }
            else {
                multiring = false;
                coords = [[coords]];
            }
        }
        else {
            multipoint = false;
            multiring = false;
            multipoly = false;
            coords = [[[coords]]];
        }
        const loadProj = function (crs) {
            let result;
            const def = proj4.defs[crs];
            if (def) {
                result = proj4(def);
            }
            if (!result) {
                TC.loadProjDef({ crs: crs, sync: true });
                result = proj4(proj4.defs[crs]);
            }
            return result;
        };
        var sourcePrj = loadProj(sourceCrs);
        var targetPrj = loadProj(targetCrs);
        result = new Array(coords.length);
        coords.forEach(function (poly, pidx) {
            const rp = result[pidx] = [];
            poly.forEach(function (ring, ridx) {
                const rr = rp[ridx] = [];
                ring.forEach(function (coord, cidx) {
                    if (Array.isArray(coord) && coord.length > 1) {
                        var point = proj4(sourcePrj, targetPrj, { x: coord[0], y: coord[1] });
                        rr[cidx] = [point.x, point.y];
                        if (coord.length > 2) {
                            for (var i = 2; i < coord.length; i++)
                                rr[cidx][i] = coord[i];
                        }
                    } else {
                        rr[cidx] = coord;
                    }
                });
            });
        });
        if (!multipoint) {
            result = result[0][0][0];
        }
        else if (!multiring) {
            result = result[0][0];
        }
        else if (!multipoly) {
            result = result[0];
        }
        return result;
    },

    reprojectExtent: function ([minX, minY, maxX, maxY], sourceCrs, targetCrs) {
        const steps = 10;
        const stepWidth = (maxX - minX) / steps;
        const stepHeight = (maxY - minY) / steps;
        const coordinates = [];
        let x, y;
        x = minX;
        var i;
        for (i = 0; i < steps; i++) {
            coordinates.push([x, maxY]);
            x += stepWidth;
        }
        y = maxY
        for (i = 0; i < steps; i++) {
            coordinates.push([maxX, y]);
            y -= stepHeight;
        }
        x = maxX;
        for (i = 0; i < steps; i++) {
            coordinates.push([x, minY]);
            x -= stepWidth;
        }
        y = minY
        for (i = 0; i < steps; i++) {
            coordinates.push([minX, y]);
            y += stepHeight;
        }
        const newCoords = Util.reproject(coordinates, sourceCrs, targetCrs);
        const newXs = newCoords.map(c => c[0]);
        const newYs = newCoords.map(c => c[1]);

        return [
            Math.min(...newXs),
            Math.min(...newYs),
            Math.max(...newXs),
            Math.max(...newYs)
        ];
    },

    getMetersPerDegree: function (extent) {
        let result;
        const R = 6370997; // m
        if (Array.isArray(extent) && extent.length >= 4) {
            if (extent[3] === extent[1]) {
                result = Math.PI * R * Math.cos(this.degToRad(extent[1])) / 180;
            }
            else {
                const dLat = this.degToRad(extent[3] - extent[1]);
                const sindlat2 = Math.sin(dLat / 2);
                const a = sindlat2 * sindlat2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                result = R * c / (extent[3] - extent[1]);
            }
        }
        return result;
    },

    radToDeg: function (rad) { // convert radians to degrees
        return rad * 180 / Math.PI;
    },
    degToRad: function (deg) { // convert degrees to radians
        return deg * Math.PI / 180;
    },
    mod: function (n) { // modulo for negative values
        const twoPi = 2 * Math.PI;
        return (n % twoPi + twoPi) % twoPi;
    },

    getCRSCode: function (crs) {
        var result = null;
        crs = crs.trim();
        if (/^EPSG:\d{4,6}$/g.test(crs) || //formato EPSG
            /^urn:ogc:def:crs:EPSG:.*:\d{4,6}/g.test(crs) || // formato URN
            /http:\/\/www.opengis.net\/gml\/srs\/epsg.xml#\d{4,6}$/g.test(crs)) { // formato GML
            var match = crs.trim().match(/^.+[:#](\d{4,6})$/); // devuelve la parte numérica del código
            if (match) {
                result = match[1];
            }
        }
        return result;
    },
    toURNCRS: function (crs) {
        return crs.replace(/^(?<epsg>EPSG):(?<code>\d{4,6})$/g, "urn:ogc:def:crs:$<epsg>::$<code>");
    },

    CRSCodesEqual: function (crs1, crs2) {
        if (crs1 === crs2) {
            return true;
        }
        var code1 = this.getCRSCode(crs1);
        var code2 = this.getCRSCode(crs2);
        return code1 !== null && code2 !== null && code1 === code2;
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

    getRenderedHtml: async function (templateOrId, data, callback) {
        const compileTemplate = function (templateId, txt) {
            const template = Handlebars.compile(txt); // TODO: add optimization options
            Handlebars.registerPartial(templateId, template);
            templateCache.set(templateId, template);
            return template;
        };
        const fetchTemplate = async function (templateId) {
            let template = templateCache.get(templateId);
            if (template) {
                return template;
            }
            else {
                templateCache.set(templateId, true);
                let response;
                try {
                    response = await TC.ajax({
                        url: TC.apiLocation + `TC/templates/${templateId}.hbs`,
                        method: 'GET',
                        responseType: 'text'
                    })
                }
                catch (err) {
                    console.log("Error fetching template: " + err.message);
                    throw err;
                }
                const matches = response.data.match(/{{> ([a-zA-Z\-]+)(?:(?:\s[a-zA-Z]+)\s*)?}}/);
                if (matches) {
                    await Promise.all(matches.slice(1).map(str => fetchTemplate(str.trim())));
                }
                return compileTemplate(templateId, response.data);
            }
        };
        const endFn = function (template) {
            const html = template(data);
            if (Util.isFunction(callback)) {
                callback(html);
            }
            return html;
        };
        if (Util.isFunction(templateOrId)) {
            return endFn(templateOrId);
        }
        else {
            const template = await fetchTemplate(templateOrId);
            return endFn(template);
        }
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

    getMimeTypeFromUrl: function (url) {
        let idx = url.indexOf('?');
        if (idx >= 0) {
            url = url.substr(0, idx);
        }
        else {
            idx = url.indexOf('#');
            if (idx >= 0) {
                url = url.substr(0, idx);
            }
        }
        switch (url.substr(url.lastIndexOf('.') + 1).toLowerCase()) {
            case 'kml':
                return Consts.mimeType.KML;
            case 'kmz':
                return Consts.mimeType.KMZ;
            case 'json':
            case 'geojson':
                return Consts.mimeType.GEOJSON;
            case 'gml':
                return Consts.mimeType.GML;
            case 'gpx':
                return Consts.mimeType.GPX;
            case 'gpkg':
                return Consts.mimeType.GEOPACKAGE;
            case 'shp':
            case 'dbf':
            case 'prj':
            case 'cst':
            case 'cpg':
                return Consts.mimeType.SHAPEFILE;
            case 'wkt':
            case 'wkb':
                return 'text/plain';
            case 'zip':
                return Consts.mimeType.ZIP;
            default:
                return null;
        }
    },

    getQueryStringParams: function (url) {
        var queryString;
        if (url) {
            var queryIdx = url.indexOf('?');
            if (queryIdx >= 0) {
                queryString = url.substr(queryIdx);
                var fragmentIdx = queryString.indexOf('#');
                if (fragmentIdx >= 0) {
                    queryString = queryString.substr(0, fragmentIdx);
                }
            }
            else {
                queryString = '?';
            }
        }
        else {
            queryString = location.search;
        }
        var result = queryString.replace(/(^\?)/, '').split("&").map(function (elm) {
            return elm = elm.split("="), this[elm[0]] = elm[1], this;
        }.bind({}))[0];
        delete result[''];
        return result;
    },

    getParamString: function (obj) {
        const arr = [];
        for (var key in obj) {
            arr.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        }
        return arr.join('&').replace(/%20/g, '+');
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
            return TC.cookie(key);
        },
        setCookie: function (key, value, options) {
            return TC.cookie(key, value, options);
        },
        getLocalValue: function (key) {
            var result = null;
            if (localStorage && localStorage instanceof Storage) {
                result = localStorage.getItem(key);
            }
            else {
                result = Util.storage.getCookie(key);
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
                    Util.storage.setCookie(key, "", { expires: exDate });
                }
                else {
                    Util.storage.setCookie(key, value);
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
                result = Util.storage.getCookie(key);
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
                    Util.storage.setCookie(key, "", { expires: exDate });
                }
                else {
                    Util.storage.setCookie(key, value);
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

        // GLS: 13/02/2019. Comento lo que respecta a Edge, no tiene sentido meterlo en el mismo saco que un navegador obsoleto.
        // No lo comento porque en la mesa no hay quorum.
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
    detectSafari: function () {
        return !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
    },
    detectMouse: function () {
        const matchesCoarse = matchMedia('(pointer:coarse)').matches;
        const matchesFine = matchMedia('(pointer:fine)').matches;
        if (matchesCoarse && matchesFine) {
            return true;
        }
        if (matchesCoarse && !matchesFine) {
            var testHover = function () {
                //console.log('estamos en testHover');
                var mq = '(hover: hover)',
                    hover = !TC.browserFeatures.touch(), // fallback if mq4 not supported: no hover for touch
                    mqResult;

                mqResult = window.matchMedia(mq);
                //console.log('resultado de window.matchMedia(mq): ' + mqResult.media);
                //console.log('mq: ' + mq);
                if (mqResult.media === mq) {
                    //console.log('es igual');
                    // matchMedia supports hover detection, so we rely on that
                    hover = mqResult.matches;
                    //console.log('va retornar: ' + hover);
                }

                return hover;
            };

            if (testHover())
                return true;
            else return false;
        }
        if (!matchesCoarse && matchesFine) {
            return true;
        }
        if (matchMedia('(pointer:none)').matches) {
            return false;
        }
        if (!TC.browserFeatures.touch()) {
            return true;
        }
    },
    detectAndroid: function () {
        return navigator.userAgent.match(/Android/i);
    },
    detectBlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    detectIOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    detectMobileWindows: function () {
        return navigator.userAgent.match(/IEMobile/i);
    },
    detectMobile: function () {
        return Util.detectAndroid() || Util.detectIOS() || Util.detectMobileWindows() || Util.detectBlackBerry();
    },
    getBrowser: function () {
        var parser = new UAParser();
        var browser = parser.getBrowser();
        return { name: browser.name, version: browser.major };
    },
    getElementByNodeName: function (parentNode, nodeName) {
        var colonIndex = nodeName.indexOf(":");
        var tag = nodeName.substr(colonIndex + 1);
        var nodes = parentNode.getElementsByTagNameNS("*", tag);

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeName == nodeName) {
                return nodes;
            }
        }
        return undefined;
    },
    addURLParameters: function (url, parameters) {
        if (!parameters) {
            return url;
        }
        let urlObj;
        let isRelative = false;
        try {
            urlObj = new URL(url);
        }
        catch (e) {
            if (e instanceof TypeError) {
                isRelative = true;
                urlObj = new URL(url, window.location.href);
            }
        }
        for (var key in parameters) {
            const value = parameters[key];
            urlObj.searchParams.set(key, value);
        }
        const newUrl = urlObj.href;
        if (isRelative) {
            return newUrl.substr(newUrl.indexOf(urlObj.host) + urlObj.host.length);
        }
        return newUrl;
    },
    removeURLParameter: function (url, parameter) {
        var urlparts = url.split('?');
        if (urlparts.length >= 2) {

            var prefix = encodeURIComponent(parameter.toLowerCase()) + '=';
            var pars = urlparts[1].toLowerCase().split(/[&;]/g);

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

    showModal: function (contentNode, options = {}) {

        contentNode.hidden = false;
        contentNode.classList.add(Consts.classes.VISIBLE);
        const closeButton = contentNode.querySelectorAll('.tc-modal-close');
        if (closeButton && closeButton.length > 0) {
            for (var i = 0; i < closeButton.length; i++) {
                var closeCallback = modalCloseHandlers.get(closeButton[i]);
                if (closeCallback) {
                    modalCloseHandlers.delete(closeButton[i]);
                }
                else {
                    closeCallback = function (e) {
                        e.stopPropagation();
                        return Util.closeModal(options.closeCallback, e.target);
                    };
                    modalCloseHandlers.set(closeButton[i], closeCallback);
                }
                modalCloseHandlers.set(closeButton[i], closeCallback);
                closeButton[i].addEventListener('click', closeCallback);
            }
        }

        if (Util.isFunction(options.openCallback)) {
            options.openCallback();
        }
    },

    closeModal: function (callback, target) {

        const hide = function (modal) {
            modal.classList.remove(Consts.classes.VISIBLE);
        };

        var modal;
        if (target) {
            modal = target;
            while (modal && !modal.matches('.tc-modal')) {
                modal = modal.parentElement;
            }

            hide(modal);
        } else {
            Array.prototype.forEach.call(document.querySelectorAll('.tc-modal'), function (modal) {
                hide(modal);
            });
        }

        if (callback) {
            callback();
        }
    },

    closeAlert: function (btn) {
        var elm = btn;
        do {
            elm = elm.parentElement;
            if (elm.matches('.tc-alert')) {
                elm.style.display = 'none';
            }
        }
        while (elm);
    },

    swipe: function (target, options = {}) {
        const addListeners = function (handlers) {
            target.addEventListener('mousedown', handlers.start);
            target.addEventListener('touchstart', handlers.start, { passive: true });
            target.addEventListener('mouseup', handlers.end);
            target.addEventListener('touchend', handlers.end, { passive: true });
        };

        if (options === 'disable') {
            const handlers = swipeHandlers.get(target);
            if (handlers) {
                target.removeEventListener('mousedown', handlers.start);
                target.removeEventListener('touchstart', handlers.start);
                target.removeEventListener('mouseup', handlers.end);
                target.removeEventListener('touchend', handlers.end);
            }
            return;
        }
        else if (options === 'enable') {
            const handlers = swipeHandlers.get(target);
            if (handlers) {
                addListeners(handlers);
            }
            return;
        }

        const minDistance = options.minDistance || 30;
        const maxCrossDistance = options.maxCrossDistance || 30;
        const maxAllowedTime = options.maxAllowedTime || 1000;
        var touchStartCoords = { 'x': -1, 'y': -1 }, // X and Y coordinates on mousedown or touchstart events.
            touchEndCoords = { 'x': -1, 'y': -1 },// X and Y coordinates on mouseup or touchend events.
            startTime = 0,// Time on swipeStart
            elapsedTime = 0;// Elapsed time between swipeStart and swipeEnd

        const getDirection = function (startCoords, endCoords) {
            const dx = endCoords.x - startCoords.x;
            const dy = endCoords.y - startCoords.y;
            const adx = Math.abs(dx);
            const ady = Math.abs(dy);
            if (adx > ady && adx > minDistance && ady <= maxCrossDistance) {
                return dx < 0 ? 'left' : 'right';
            }
            if (ady > adx && ady > minDistance && adx <= maxCrossDistance) {
                return dy < 0 ? 'up' : 'down';
            }
            return 'none';
        };

        const mustSwipe = function (e) {
            if (options.noSwipe) {
                var elm = e.target;
                while (elm && elm !== target) {
                    if (elm.matches && elm.matches(options.noSwipe)) {
                        return false;
                    }
                    elm = elm.parentNode;
                }
            }
            return true;
        };

        const swipeStart = function (e) {
            if (mustSwipe(e)) {
                e = 'changedTouches' in e ? e.changedTouches[0] : e;
                touchStartCoords.x = e.pageX;
                touchStartCoords.y = e.pageY;
                startTime = new Date().getTime();
            }
        };

        const swipeEnd = function (e) {
            if (startTime) {
                e = 'changedTouches' in e ? e.changedTouches[0] : e;
                touchEndCoords.x = e.pageX;
                touchEndCoords.y = e.pageY;
                elapsedTime = new Date().getTime() - startTime;
                if (elapsedTime <= maxAllowedTime) {
                    const callback = options[getDirection(touchStartCoords, touchEndCoords)];
                    if (callback) {
                        callback.call(target);
                    }
                }
                startTime = 0;
            }
        };

        const handlers = {
            start: swipeStart,
            end: swipeEnd
        };
        swipeHandlers.set(target, handlers);
        addListeners(handlers);
    },

    getParameterByName: function (name) {
        const filter = ([key, _value]) => key.toLowerCase() === name.toLowerCase();
        const params = new URLSearchParams(location.search);
        const paramsArray = Array.from(params);
        const result = paramsArray.find(filter);
        return result ? result[1] : "";
    },

    getLocaleUserChoice: function (options = {}) {
        var result = 'en-US';
        var cookieName = options.cookieName || 'SITNA.language';
        var paramName = options.paramName || 'lang';
        // Obtenemos preferencia de lenguaje
        var browserLanguage = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language || navigator.userLanguage;
        var lang = Util.getParameterByName(paramName) || Util.storage.getCookie(cookieName) || browserLanguage;
        var hyphenIdx = lang.indexOf('-');
        if (hyphenIdx >= 0) {
            lang = lang.substr(0, hyphenIdx);
        }
        var expirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
        Util.storage.setCookie(cookieName, lang, { expires: expirationDate });

        switch (lang) {
            case 'eu':
                result = 'eu-ES';
                break;
            case 'es':
                result = 'es-ES';
                break;
            default:
                result = 'en-US';
                break;
        }
        return result;
    },

    getValidFilename: function (filename) {
        return (filename || '').replace(/[/\\?%*:|"<>]/g, '-');
    },

    getFormatFromFileExtension: function (extension) {
        switch (extension) {
            case '.kml':
                return Consts.format.KML;
            case '.kmz':
                return Consts.format.KMZ;
            case '.gpx':
                return Consts.format.GPX;
            case '.json':
            case '.geojson':
                return Consts.format.GEOJSON;
            case '.gml':
                return Consts.format.GML;
            case '.wkt':
                return Consts.format.WKT;
            case '.wkb':
                return Consts.format.WKB;
            case '.topojson':
                return Consts.format.TOPOJSON;
            case '.gpkg':
                return Consts.format.GEOPACKAGE;
            case '.shp':
                return Consts.format.SHAPEFILE;
            default:
                return null;
        }
    },

    getFileExtensionFromFormat: function (format) {
        switch (format) {
            case Consts.format.KML:
                return '.kml';
            case Consts.format.KMZ:
                return '.kmz';
            case Consts.format.GPX:
                return '.gpx';
            case Consts.format.GEOJSON:
                return '.geojson';
            case Consts.format.GML:
                return '.gml';
            case Consts.format.WKT:
                return '.wkt';
            case Consts.format.WKB:
                return '.wkb';
            case Consts.format.TOPOJSON:
                return '.topojson';
            case Consts.format.GEOPACKAGE:
                return '.gpkg';
            case Consts.format.SHAPEFILE:
                return '.shp';
            default:
                return null;
        }
    },

    downloadBlob: function (filename, blob) {
        var link = document.createElement("a");
        if (link.download !== undefined) {
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", Util.getValidFilename(filename));
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    downloadFile: function (filename, type, data) {
        var blob = new Blob([data], { type: type });
        filename = Util.getValidFilename(filename);
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            Util.downloadBlob(filename, blob);
        }
    },

    downloadDataURI: function (filename, type, dataURI) {
        var binary = atob(dataURI.split(',')[1]);

        var array = [];
        for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        var blob = new Blob([new Uint8Array(array)], { type: type });

        filename = Util.getValidFilename(filename);
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            Util.downloadBlob(filename, blob);
        }
    },

    /*
     * Acorta una URL utilizando el servicio de Bit.ly. No funciona para URLs locales.
     */
    shortenUrl: function (url) {
        return new Promise(function (resolve, reject) {
            TC.ajax({
                url: "https://api-ssl.bitly.com/v3/shorten",
                data: { access_token: "6c466047309f44bd8173d83e81491648b243ee3d", longUrl: url }
            })
                .then(function (response) {
                    resolve(response.data);
                })
                .catch(function (e) {
                    reject(e);
                });
        });
    },

    /*
     * Convierte a Base64.
     */
    utf8ToBase64: function (str) {
        return window.btoa(unescape(encodeURIComponent(str)));
    },

    /*
     * Decodifica un string en Base64.
     */
    base64ToUtf8: function (str) {
        var result;
        try {
            result = decodeURIComponent(escape(window.atob(str)));
        }
        catch (error) {
            result = null;
        }
        return result;
    },

    colorArrayToString: function (color) {
        if (Array.isArray(color)) {
            color = color
                .slice(0, 3)
                .reduce(function (prev, cur) {
                    const str = cur.toString(16);
                    return prev + '00'.substring(0, 2 - str.length) + str;
                }, '#');
        }
        return color;
    },

    // Generic helper function that can be used for the three operations:        
    operation: function (list1, list2, comparerFn, operationIsUnion) {
        var result = [];

        for (var i = 0; i < list1.length; i++) {
            var item1 = list1[i],
                found = false;
            for (var j = 0; j < list2.length; j++) {
                if (comparerFn(item1, list2[j])) {
                    found = true;
                    break;
                }
            }
            if (found === operationIsUnion) {
                result.push(item1);
            }
        }
        return result;
    },

    // Following functions are to be used:
    inBoth: function (list1, list2, comparerFn) {
        return this.operation(list1, list2, comparerFn, true);
    },

    inFirstOnly: function (list1, list2, comparerFn) {
        return this.operation(list1, list2, comparerFn, false);
    },

    inSecondOnly: function (list1, list2, comparerFn) {
        return this.inFirstOnly(list2, list1, comparerFn);
    },

    toDataUrl: function (canvas, backgroundColour) {
        var defaultOptions = { type: 'image/png', encoderOptions: 0.92 };

        var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultOptions,
            type = _ref.type,
            encoderOptions = _ref.encoderOptions;

        var context = canvas.getContext('2d');

        if (!context) {
            return '';
        }

        var width = canvas.width;
        var height = canvas.height;

        var data = context.getImageData(0, 0, width, height);
        var compositeOperation = context.globalCompositeOperation;

        if (backgroundColour) {

            context.globalCompositeOperation = 'destination-over';
            context.fillStyle = backgroundColour;
            context.fillRect(0, 0, width, height);
        }

        var imageData = canvas.toDataURL(type, encoderOptions);

        if (backgroundColour) {
            context.clearRect(0, 0, width, height);
            context.putImageData(data, 0, 0);
            context.globalCompositeOperation = compositeOperation;
        }

        return imageData;
    },

    imgToDataUrl: function (src, outputFormat) {

        var createCanvas = function (img) {
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);

            return canvas;
        };

        return new Promise(function (resolve, reject) {
            if (!outputFormat) {
                switch (src.substr(src.lastIndexOf('.') + 1).toLowerCase()) {
                    case 'svg':
                        outputFormat = 'image/svg+xml';
                        break;
                    case 'png':
                        outputFormat = 'image/png';
                        break;
                    case 'gif':
                        outputFormat = 'image/gif';
                        break;
                    default:
                        outputFormat = 'image/jpeg';
                }
            }

            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () {
                var canvas = createCanvas(img);
                var dataURL;

                try {
                    dataURL = Util.toDataUrl(canvas, '#ffffff', {
                        type: outputFormat,
                        encoderOptions: 1.0
                    });
                    resolve({ dataUrl: dataURL, canvas: canvas });
                } catch (error) {
                    img.src = TC.proxify(src);
                }
            };

            img.onerror = function (_error) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', TC.proxify(src), true);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

                xhr.responseType = 'arraybuffer';
                xhr.onload = function (_e) {
                    if (this.status === 200) {
                        var uInt8Array = new Uint8Array(this.response);
                        var i = uInt8Array.length;
                        var binaryString = new Array(i);
                        while (i--) {
                            binaryString[i] = String.fromCharCode(uInt8Array[i]);
                        }
                        var data = binaryString.join('');
                        var type = xhr.getResponseHeader('content-type');
                        if (type.indexOf('image') === 0) {
                            img.src = 'data:' + type + ';base64,' + window.btoa(data);
                            img.onload = function () {
                                const canvas = createCanvas(img);
                                const dataURL = Util.toDataUrl(canvas, '#ffffff', {
                                    type: outputFormat || 'image/jpeg',
                                    encoderOptions: 1.0
                                });
                                resolve({ dataUrl: dataURL, canvas: canvas });
                            };
                        }
                    }
                };
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status !== 200) {
                            reject(Error('HTTP error ' + xhr.status));
                        }
                    }
                };

                xhr.send();
            };

            img.src = src;
            if (img.complete || img.complete === undefined) {
                img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                img.src = src;
            }
        });
    },

    imgTagToDataUrl: function (img, outputFormat) {
        var createCanvas = function (img) {
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);

            return canvas;
        };

        var canvas = createCanvas(img);
        var dataURL;

        try {
            dataURL = Util.toDataUrl(canvas, '#ffffff', {
                type: outputFormat || 'image/jpeg',
                encoderOptions: 1.0
            });
            return { base64: dataURL, canvas: canvas };
        } catch (error) {
            return null;
        }
    },

    addToCanvas: function (canvas, img, position, size) {
        var newCanvas = Util.cloneCanvas(canvas);
        var context = newCanvas.getContext('2d');

        return new Promise(function (resolve, _reject) {
            var newImage = new Image();
            newImage.crossOrigin = 'anonymous';
            newImage.src = img;
            newImage.onload = function () {
                if (size) {
                    context.drawImage(newImage, position.x || 0, position.y || 0, size.width, size.height);
                } else {
                    context.drawImage(newImage, position.x || 0, position.y || 0);
                }
                resolve(newCanvas);
            };
        });
    },

    cloneCanvas: function (oldCanvas) {
        //create a new canvas
        var newCanvas = document.createElement('canvas');
        var context = newCanvas.getContext('2d');

        //set dimensions
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;

        //apply the old canvas to the new one
        context.drawImage(oldCanvas, 0, 0);

        //return the new canvas
        return newCanvas;
    },

    mergeCanvases: function (canvases) {
        const rects = canvases.map(c => c.parentElement ? c.getBoundingClientRect() : {
            top: 0,
            left: 0,
            bottom: c.height,
            right: c.width
        });
        const bbox = rects.reduce(function (prev, rect) {
            return [
                Math.min(prev[0], rect.left),
                Math.min(prev[1], rect.top),
                Math.max(prev[2], rect.right),
                Math.max(prev[3], rect.bottom)
            ];
        }, [
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY
        ]);
        const left = bbox[0];
        const top = bbox[1];

        //create a new canvas
        const newCanvas = document.createElement('canvas');
        const context = newCanvas.getContext('2d');

        //set dimensions
        newCanvas.width = bbox[2] - left;
        newCanvas.height = bbox[3] - top;

        //apply the old canvases to the new one
        canvases.forEach(function (canvas, idx) {
            const rect = rects[idx];
            context.drawImage(canvas, rect.left - left, rect.top - top, rect.right - rect.left, rect.bottom - rect.top);
        });

        //return the new canvas
        return newCanvas;
    },


    calculateAspectRatioFit: function (srcWidth, srcHeight, maxWidth, maxHeight) {
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

        return { width: srcWidth * ratio, height: srcHeight * ratio };
    },

    getFormattedDate: function (date, hasTime) {
        function pad(s) { return s < 10 ? '0' + s : s; }

        var d = new Date(date);
        return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].concat(hasTime ? ["_", pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())] : []).join('');

    },

    replaceSpecialCharacters: function (t) {
        var translate = new Map([
            ["ä", "a"], ["ö", "o"], ["ü", "u"],
            ["Ä", "A"], ["Ö", "O"], ["Ü", "U"],
            ["á", "a"], ["é", "e"], ["í", "i"], ["ó", "o"], ["ú", "u"],
            ["Á", "A"], ["É", "E"], ["Í", "I"], ["Ó", "O"], ["Ú", "U"],
            ["ñ", "n"], ["Ñ", "N"], ["ç", "c"], ["Ç", "C"]
        ]);
        return t.replace(/[öäüÖÄÜáéíóúÁÉÍÓÚñÑçÇ]/g, function (match) {
            return translate.get(match);
        });
    },

    downloadFileForm: async function (url, data) {
        var download = async function (url, data) {

            var response = await new Promise(function (resolve, reject) {
                const request = new XMLHttpRequest();
                request.responseType = "blob";
                request.open("POST", url);
                request.setRequestHeader('Content-Type', 'application/xml; charset=UTF-8');

                request.onreadystatechange = function (_e) {
                    if (request.readyState === 4) { // DONE
                        if (request.status !== 200) {
                            reject({
                                status: request.status,
                                msg: request.statusText,
                                url: url
                            });
                        } else {

                            try {
                                //URI: Miro si devuelve una cabecera content-disposition attachment. Si es asi uso el filenae como nombre de fichero. Esta descarga seguramente venga
                                //de un proxy con postproceso de zippeado
                                const contentDispositionHeader = request.getResponseHeader("Content-disposition");
                                var filename = "";
                                if (contentDispositionHeader) {
                                    filename = contentDispositionHeader.split("; ")[1].substring(9);
                                    if (contentDispositionHeader.split("; ")[0] !== "attachment") {
                                        filename = filename.substring(0, filename.lastIndexOf("."));
                                    }
                                }
                                const contentType = request.getResponseHeader("Content-type");
                                resolve({ data: request.response, contentType: contentType || (request.responseType === "blob" ? "application/zip" : ""), filename: filename });
                            }
                            catch (error) {
                                reject(error);
                            }
                        }
                    }
                };

                try {
                    request.send(data);
                } catch (error) {
                    reject(error);
                }
            });
            var format = "";
            if (response.data.type.indexOf("kml") >= 0)
                format = ".kml";
            else if (response.data.type.indexOf("json") >= 0)
                format = ".geojson";
            else if (response.data.type.indexOf("xml") >= 0) {
                format = ".gml";
                if (/outputFormat="\S{1,}"/.exec(data)[0].includes(".kml") || /outputFormat="\S{1,}"/.exec(data)[0].includes("shape-zip")) {
                    throw { key: Consts.DownloadError.MIMETYPE_NOT_SUPORTED, url: url, data: data, format: /outputFormat="\S{1,}"/.exec(data)[0] };
                }
            }
            Util.downloadFile((response.filename ? response.filename : TC.getUID()) + format, response.contentType, response.data);

        };
        var _err;
        if (Array.isArray(url)) {
            var arrDownloads = url;
            for (var i = 0; i < arrDownloads.length; i++) {
                try {
                    await download(arrDownloads[i].url, arrDownloads[i].data);
                }
                catch (err) {
                    _err = err;
                }
            }
            if (_err) {
                throw _err;
            }
        }
        else {
            await download(url, data);
        }
    },
    WFSQueryBuilder: function (layers, filter, capabilities, outputFormat, onlyHits, srsName, maxFeatures, fields) {
        const getSRSAttribute = function () {
            if (srsName) {
                return ' srsName="' + srsName + '"';
            }
            else
                return '';
        };
        const getFields = function () {
            if (!fields) return '';
            var tagName = '';
            switch (capabilities.version) {
                case "1.0.0":
                    tagName = "ogc:PropertyName";
                    break;
                case "1.1.0":
                    tagName = "wfs:PropertyName";
                    break;
                case "2.0.0":
                    tagName = "wfs:PropertyName";
                default:

                    break;
            }
            return (fields instanceof Array ? fields : [fields]).reduce(function (vi, va) {
                return vi + '<' + tagName + '>' + va + '</' + tagName + '>';
            }, '');

        };
        if (!Array.isArray(layers) && !(layers instanceof Object))
            layers = [layers];

        let query = '<wfs:GetFeature ' + Util.formatTemplate(_queryHeaderConstructor(capabilities), {
            resultType: onlyHits ? 'resultType="hits"' : '',
            format: 'outputFormat="' + outputFormat + '"'
        }) + (capabilities.version !== "2.0.0" && maxFeatures ? ' maxFeatures="' + maxFeatures + '"' : '') + '>';
        let queryBody = '';
        let queryItem;
        if (Array.isArray(layers)) {
            queryItem = '<wfs:Query typeName' + (capabilities.version === "2.0.0" ? 's' : '') + '="{typeName}"' + getSRSAttribute() + '>{fields}{filter}</wfs:Query>';
            layers.forEach(function (value) {
                queryBody += Util.formatTemplate(queryItem, {
                    typeName: value,
                    filter: filter && filter instanceof TC.filter.Filter ? filter.getText(capabilities.version) : "",
                    fields: getFields()
                });
            });
        }
        else {
            queryItem = '';
            for (var layer in layers) {
                queryItem = '<wfs:Query typeName' + (capabilities.version === "2.0.0" ? 's' : '') + '="{typeName}"' + getSRSAttribute() + '>{fields}{filter}</wfs:Query>';
                let filter = layers[layer];
                queryBody += Util.formatTemplate(queryItem, {
                    typeName: layer,
                    filter: filter && filter instanceof TC.filter.Filter ? filter.getText(capabilities.version) : "",
                    fields: getFields()
                });
            }
        }

        query += queryBody + '</wfs:GetFeature>';
        return query;
    },

    WFGetPropertyValue: function (layer, valueReference, filter, capabilities) {
        /*if (capabilities.version === "2.0.0") {
            var query = '<wfs:GetPropertyValue ' + Util.formatTemplate(_queryHeaderConstructor(capabilities), { resultType: '', format: '' }) + ' valueReference="' + valueReference + '" >';
            var queryBody = '';
            var queryItem = ('<wfs:Query typeName' + (capabilities.version === "2.0.0" ? 's' : '') + '="{typeName}"' + '>{filter}</wfs:Query>');
            queryBody += Util.formatTemplate(queryItem, { typeName: layer, filter: (filter && filter instanceof TC.filter.Filter ? filter.getText(capabilities.version) : "") });
            query += queryBody + '</wfs:GetPropertyValue>'
            return query;
        }
        else*/
        return Util.WFSQueryBuilder([layer], filter, capabilities, "JSON", false, null, null, valueReference);


    },

    WFSFilterBuilder: function (feature, version, srsName) {
        var filter = '';
        if (Util.isPlainObject(feature)) {
            filter = Util.formatTemplate('<{prefix}:Filter><{prefix}:Intersects><fes:ValueReference></fes:ValueReference><{prefix}:Function name="querySingle"><{prefix}:Literal>{clipLayer}</{prefix}:Literal><{prefix}:Literal>{geometryName}</{prefix}:Literal><{prefix}:Literal>{where}</{prefix}:Literal></{prefix}:Function></{prefix}:Intersects></{prefix}:Filter>', {
                prefix: version === "2.0.0" ? "fes" : "ogc",
                clipLayer: feature.clipLayer,
                geometryName: feature.geometryName,
                where: feature.where
            });
        }
        else {
            switch (true) {
                case !feature:
                    break;
                case Array.isArray(feature)://bbox
                    var gmlEnvelope = Util.formatTemplate('<gml:Envelope>' +
                        '<gml:lowerCorner>{lowerCorner}</gml:lowerCorner>' +
                        '<gml:upperCorner>{upperCorner}</gml:upperCorner>' +
                        '</gml:Envelope>', {
                        lowerCorner: feature[0] + ' ' + feature[1],
                        upperCorner: feature[2] + ' ' + feature[3]
                    });
                    switch (true) {
                        case version === "1.0.0":
                        case version === "1.1.0":
                            filter += '<ogc:Filter><ogc:BBOX>' + gmlEnvelope + '</ogc:BBOX></ogc:Filter>';
                            break;
                        case version === "2.0.0":
                            filter += '<fes:Filter><fes:BBOX>' + gmlEnvelope + '</fes:BBOX></fes:Filter>';
                            break;
                    }
                    break;
                case feature instanceof TC.Feature:
                    switch (true) {
                        case version === "1.0.0":
                        case version === "1.1.0":
                            filter += '<ogc:Filter><ogc:Intersects><ogc:PropertyName></ogc:PropertyName>' + Util.writeGMLGeometry(feature, { version: "2.0", srsName: srsName }) + '</ogc:Intersects></ogc:Filter>';
                            break;
                        case version === "2.0.0":
                            filter += '<fes:Filter><fes:Intersects><fes:ValueReference></fes:ValueReference>' + Util.writeGMLGeometry(feature, { version: "3.2", srsName: srsName }) + '</fes:Intersects></fes:Filter>';
                            break;
                    }

                    break;
                default:
                    TC.error("Geometr\u00eda no v\u00e1lida");
                    break;
            }
        }

        return filter;
    },

    writeGMLGeometry: function (feature, options = {}) {
        const gmlVersion = options.version;
        const getSRSName = function () {
            if (options.srsName) {
                return ' srsName="' + options.srsName + '"';
            }
            else
                return '';
        };
        var getGmlCoordinates = function (coords) {
            var result;
            if (gmlVersion.indexOf('3') === 0) {
                result = coords.toString();
                while (result.indexOf(",") >= 0) {
                    result = result.replace(",", " ");
                }
            }
            else {
                result = coords.map(function (coord) {
                    return coord.join(',');
                }).join(' ');
            }
            return result;
        };

        switch (gmlVersion) {
            case "3.1.1":
                break;
            case "3.2":
                switch (true) {
                    case TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                        return "<gml:LineString srsDimension=\"2\"" + getSRSName() + "><gml:posList>" +
                            getGmlCoordinates(feature.geometry) +
                            "</gml:posList></gml:LineString>";
                    default:
                        return "<gml:Polygon srsDimension=\"2\"" + getSRSName() + "><gml:exterior><gml:LinearRing><gml:posList>" +
                            getGmlCoordinates(feature.geometry[0]) +
                            "</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon>";
                }
            case "2.0":
            default:
                switch (true) {
                    case TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                        return "<gml:LineString" + getSRSName() + "><gml:coordinates>" +
                            getGmlCoordinates(feature.geometry[0]) +
                            "</gml:coordinates></gml:LineString>";
                    default:
                        return "<gml:Polygon" + getSRSName() + "><gml:outerBoundaryIs><gml:LinearRing><gml:coordinates>" +
                            getGmlCoordinates(feature.geometry[0]) +
                            "</gml:coordinates></gml:LinearRing></gml:outerBoundaryIs></gml:Polygon>";
                }
        }
    },

    isServiceWorker: function () {
        if (navigator.serviceWorker) {
            if (navigator.serviceWorker.controller && navigator.serviceWorker.controller.state === "activated") {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    isSameOriginByLocation: function (uri, location) {
        var result = uri.indexOf("http") !== 0 && uri.indexOf("//") !== 0;
        var urlParts = !result && uri.match(Consts.url.SPLIT_REGEX);
        if (urlParts) {
            var uProtocol = urlParts[1];
            result = (uProtocol == location.protocol || uProtocol == undefined) && urlParts[3] == location.hostname;
            var uPort = urlParts[4], lPort = location.port;
            if (uPort != 80 && uPort !== "" || lPort != "80" && lPort !== "") {
                result = result && uPort == lPort;
            }
        }
        return result;
    },

    isSameProtocol: function (uri, location) {
        if (uri.match(/^(\/\/)/i)) {
            return true;
        }
        var protocolRegex = /^(https?:\/\/)/i;
        var uriProtocol = uri.match(protocolRegex);
        if (uriProtocol && uriProtocol.length > 1) {
            var locationProtocol = location.match(protocolRegex);
            if (locationProtocol && locationProtocol.length > 1) {
                return uriProtocol[0].trim() === locationProtocol[0].trim();
            }
        }

        return false;
    },

    consoleRegister: function (msg) {
        if (TC.isDebug) {
            console.log(msg);
        }
    },

    getSorterByProperty: function (propName) {
        return function (a, b) {
            if (a[propName] > b[propName]) {
                return 1;
            }
            if (a[propName] < b[propName]) {
                return -1;
            }
            return 0;
        };
    },

    getSoundexDifference: function (a, b) {
        var res = 0;

        for (var i = 0; i < a.length; i++) {
            if (a.charAt(i) === b.charAt(i)) {
                res++;
            }
        }

        return res;
    },

    toAbsolutePath: function (href) {
        var link = document.createElement("a");
        link.href = href;
        return link.href;
    },

    explodeGeometry: function (obj) {
        const origin = obj.origin;
        const iterationFunction = function (elm, idx, arr) {
            if (Array.isArray(elm)) {
                elm.forEach(iterationFunction);
            }
            else {
                if (idx === 0) {
                    arr[0] = elm + origin[0];
                }
                if (idx === 1) {
                    arr[1] = elm + origin[1];
                }
            }
        };
        obj.geom.forEach(iterationFunction);
        return obj.geom;
    },

    cloneMappingFunction: function (elm) {
        if (Array.isArray(elm)) {
            return elm.map(Util.cloneMappingFunction);
        }
        return elm;
    },

    isGeometry: function (type) {
        switch (type) {
            case 'gml:LinearRingPropertyType':
            case 'gml:PolygonPropertyType':
            case 'gml:MultiPolygonPropertyType':
            case 'gml:MultiSurfacePropertyType':
            case 'gml:LineStringPropertyType':
            case 'gml:MultiLineStringPropertyType':
            case 'gml:PointPropertyType':
            case 'gml:MultiPointPropertyType':
            case 'gml:BoxPropertyType':
            case 'gml:GeometryCollectionPropertyType':
            case 'gml:GeometryAssociationType':
            case 'gml:GeometryPropertyType':
            case 'gml:MultiCurvePropertyType':
            case 'gml:CurvePropertyType':
            case 'gml:AbstractGeometryType':
                return true;
            default:
                return false;
        }
    },

    compactGeometry: function (geometry, precision) {
        const origin = [Number.MAX_VALUE, Number.MAX_VALUE];
        const newGeom = geometry.map(Util.cloneMappingFunction);
        const firstIterationFunction = function (elm, idx) {
            if (Array.isArray(elm)) {
                elm.forEach(firstIterationFunction);
            }
            else {
                if (idx === 0 && elm < origin[0]) {
                    origin[0] = elm;
                }
                else if (idx === 1 && elm < origin[1]) {
                    origin[1] = elm;
                }
            }
        };
        newGeom.forEach(firstIterationFunction);

        const round = function (val) {
            return Math.round(val * precision) / precision;
        };
        origin[0] = round(origin[0]);
        origin[1] = round(origin[1]);
        const secondIterationFunction = function (elm, idx, arr) {
            if (Array.isArray(elm)) {
                elm.forEach(secondIterationFunction);
            }
            else {
                if (idx === 0) {
                    arr[0] = round(elm - origin[0]);
                }
                if (idx === 1) {
                    arr[1] = round(elm - origin[1]);
                }
            }
        };
        newGeom.forEach(secondIterationFunction);
        return {
            origin: origin,
            geom: newGeom
        };
    },

    isStyleOption: function (name) {
        return stylePropertyNames.has(name);
    },

    hasStyleOptions: function (options) {
        for (let value of stylePropertyNames.values()) {
            if (Object.prototype.hasOwnProperty.call(options, value)) {
                return true;
            }
        }
        return false;
    },

    mergeStyles() {
        const styles = Array.from(arguments);
        if (styles.some(s => Util.isFunction(s))) {
            return function (f) {
                return Object.assign({}, ...styles.map(s => Util.isFunction(s) ? s(f) : s));
            };
        }
        return Object.assign({}, ...styles);
    },

    formatCoord: function (x, nDecimales) {
        return x.toLocaleString(Util.getLocaleUserChoice(), { maximumFractionDigits: nDecimales });

        // No respeta el formato de los números según el idioma
        //var result;            
        //result = x.toFixed(nDecimales);
        //if (nDecimales <= 3) {
        //    result = result.replace(/\B(?=(\d{3})+(?!\d))/g, "|");
        //}

        //result = result.replace(".", ",").replace(/\|/g, ".");
        //return result;
    },

    formatTemplate: function (string, dictionary) {
        var str = string.toString();
        if (!dictionary) {
            return str;
        }
        for (var key in dictionary) {
            str = str.replace(RegExp("\\{" + key + "\\}", "gi"), dictionary[key]);
        }
        return str;
    },

    formatIndexedTemplate: function (str, ...values) {
        const args = values.length ? values : [""];
        return str.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== 'undefined' ?
                args[number]
                : match
                ;
        });
    },

    getWebWorkerCrossOriginURL: function (url) {
        return new Promise(function (resolve, reject) {
            if (Object.prototype.hasOwnProperty.call(window, 'Worker')) {
                // Para evitar problemas con IE10 y Opera evitamos el uso de blobs cuando es evitable
                if (Util.isSameOrigin(url)) {
                    resolve(url);
                }
                else {
                    TC.ajax({
                        url: url,
                        method: 'GET',
                        responseType: 'text'
                    }).then(
                        function (response) {
                            const data = response.data;
                            var blob = new Blob([data], { type: "text/javascript" });
                            var url = window.URL.createObjectURL(blob);
                            resolve(url);
                        },
                        function (e) {
                            reject(Error(e));
                        }
                    );
                }
            }
            else {
                reject(new Error('No support for service workers'));
            }
        });
    },

    createSemaphore: function (maxConcurrentTasks = 1) {
        let count = 0;
        let queue = [];
        return {
            acquire: function () {
                if (count < maxConcurrentTasks) {
                    count++
                    return Promise.resolve();
                } else {
                    return new Promise((resolve, reject) => {
                        queue.push({ resolve, reject });
                    });
                }
            },
            release: function () {
                count--;
                if (queue.length > 0 && count < maxConcurrentTasks) {
                    count++;
                    let promise = queue.shift();
                    promise.resolve();
                }
                return queue.length;
            },
            purge: function () {
                let unresolvedCount = queue.length;

                for (let i = 0; i < unresolvedCount; i++) {
                    queue[i].reject('Task has been purged.');
                }

                count = 0;
                queue = [];

                return unresolvedCount;
            }
        };
    },

    getPromiseFromEvent: function (target, type, options = {}) {
        return new Promise(function (resolve, reject) {
            if (Util.isFunction(options.resolvedPredicate)) {
                if (options.resolvedPredicate.call(target)) {
                    resolve();
                    return;
                }
            }
            target.addEventListener(type, function handler(e) {
                if (Util.isFunction(options.rejectPredicate)) {
                    if (options.rejectPredicate.call(this, e)) {
                        target.removeEventListener(type, handler);
                        reject(e);
                    }
                }
                if (Util.isFunction(options.resolvePredicate)) {
                    if (options.resolvePredicate.call(this, e)) {
                        target.removeEventListener(type, handler);
                        resolve(e);
                    }
                }
                else {
                    target.removeEventListener(type, handler);
                    resolve(e);
                }
            });
        });
    },

    getTimedPromise: function (callback, time) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                if (callback) {
                    try {
                        await callback();
                    }
                    catch (e) {
                        reject(e);
                    }
                }
                resolve();
            }, time);
        });
    },

    patternFn: function (t) {
        t = t.replace(/[^a-z\dáéíóúüñ]/gi, '\\' + '$&');
        t = t.replace(/(a|á)/gi, "(a|á)");
        t = t.replace(/(e|é)/gi, "(e|é)");
        t = t.replace(/(i|í)/gi, "(i|í)");
        t = t.replace(/(o|ó)/gi, "(o|ó)");
        t = t.replace(/(u|ú|ü)/gi, "(u|ú|ü)");
        t = t.replace(/n/gi, "(n|ñ)");
        return t;
    },

    fontSupported: function (font) {        
        var width;
        var body = document.body;

        var container = document.createElement('span');
        container.innerHTML = Array(100).join('wi');
        container.style.cssText = [
            'position:absolute',
            'width:auto',
            'font-size:128px',
            'left:-99999px'
        ].join(' !important;');

        var getWidth = function (fontFamily) {
            container.style.fontFamily = fontFamily;

            body.appendChild(container);
            width = container.clientWidth;
            body.removeChild(container);

            return width;
        };

        // Pre compute the widths of monospace, serif & sans-serif
        // to improve performance.
        var monoWidth = getWidth('monospace');
        var serifWidth = getWidth('serif');
        var sansWidth = getWidth('sans-serif');

        return monoWidth !== getWidth(font + ',monospace') ||
            sansWidth !== getWidth(font + ',sans-serif') ||
            serifWidth !== getWidth(font + ',serif');
    },
};

const _queryHeaderConstructor = function (capabilities) {
    var queryHeader = 'xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd" ' +
        ' service="WFS" {resultType} {format} ';
    switch (capabilities.version) {
        case "1.0.0":
        case "1.1.0":
            queryHeader += 'xmlns:gml="http://www.opengis.net/gml" xmlns:wfs="http://www.opengis.net/wfs" ';
            break;
        case "2.0.0":
            queryHeader += 'xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" ';
            break;
    }
    for (var i in capabilities) {
        if (typeof capabilities[i] === "string" && i.indexOf("gml") < 0 && capabilities[i].indexOf("wfs") < 0)
            queryHeader += i + '="' + capabilities[i] + '" ';
    }
    return queryHeader;
};

var fncOvelaps = function (elem1, elem2, comparisonFnc) {
    return comparisonFnc(elem1.getBoundingClientRect(), elem2.getBoundingClientRect());
};
if (window.HTMLElement) {
    HTMLElement.prototype.colliding = function (other) {
        return fncOvelaps(this, other, function (rect1, rect2) {
            return !(
                rect1.top > rect2.bottom ||
                rect1.right < rect2.left ||
                rect1.bottom < rect2.top ||
                rect1.left > rect2.right
            );
        });
    };
    HTMLElement.prototype.containing = function (other) {
        fncOvelaps(this, other, function (rect1, rect2) {
            return !(
                rect1.left <= rect2.left &&
                rect2.left < rect1.width &&
                rect1.top <= rect2.top &&
                rect2.top < rect1.height
            );
        });
    };
    HTMLElement.prototype.inside = function (other) {
        return fncOvelaps(this, other, function (rect1, rect2) {
            return (rect2.top <= rect1.top && rect1.top <= rect2.bottom) &&
                (rect2.top <= rect1.bottom && rect1.bottom <= rect2.bottom) &&
                (rect2.left <= rect1.left && rect1.left <= rect2.right) &&
                (rect2.left <= rect1.right && rect1.right <= rect2.right);
        });
    };
}
export class MapImage {

    //-- Obtenci�n de DataURL de la imagen del mapa
    static getDataURL(mapCanvas, mimeType) {
        return mapCanvas.toDataURL(mimeType);
    }

    //-- Obtenci�n de Blob de la imagen del mapa
    static getBlobPromise(mapCanvas, mimeType) {        
        const toBlob = resolve => mapCanvas.toBlob(blob => resolve(blob), mimeType);
        return new Promise(toBlob);
    }
}

TC.Util = Util;
export default Util;
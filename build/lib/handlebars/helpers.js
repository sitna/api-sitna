if (!TC._hbs || (!TC._hbs.compile && Handlebars.compile)) {
    TC._hbs = Handlebars.create();
    Handlebars.noConflict();
}
(function() {
    TC._hbs.registerHelper("i18n", function (key, safe) {
        const value = TC.i18n.currentLocale[key];
        if (typeof value === 'string') {
            return safe ? new TC._hbs.SafeString(value) : value;
        }
        return key;
    });

    TC._hbs.registerHelper("gt", function (v1, v2) {
        return v1 > v2;
    });

    TC._hbs.registerHelper("lt", function (v1, v2) {
        return v1 < v2;
    });

    TC._hbs.registerHelper("eq", function (v1, v2) {
        return v1 == v2;
    });

    TC._hbs.registerHelper("every", function () {
        return Array.from(arguments).slice(0, arguments.length - 1).every(v => v);
    });

    TC._hbs.registerHelper("round", function (value) {
        return Math.round(value);
    });

    TC._hbs.registerHelper("lowerCase", function (str) {
        return str && str.toLowerCase();
    });

    TC._hbs.registerHelper("startsWith", function (str, value) {
        return str && str.toString().startsWith(value);
    });

    TC._hbs.registerHelper("isObject", function (obj) {
        return obj instanceof Object && !Array.isArray(obj);
    });

    TC._hbs.registerHelper("isEmpty", function (obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    });

    TC._hbs.registerHelper("isArray", function (obj) {
        return Array.isArray(obj);
    });

    TC._hbs.registerHelper("isUrl", function (str) {
        return str && /^(http|https|ftp|mailto)\:\/\//i.test(str);
    });

    TC._hbs.registerHelper("getYoutubeId", function (str) {
        if (str) {
            const match = str.match(/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/);
            if (match) {
                return match[1];
            }
        }
        return null;
    });

    TC._hbs.registerHelper("getHeader", function (str) {
        if (str) {
            const match = str.match(/^(h\d+)_/);
            if (match) {
                return match[1];
            }
        }
        return null;
    });

    const tagRegExp = /(?:__(image|video|audio|embed)(?:_(\d+|auto)_(\d+|auto))?$)|(?:^(image|video|audio|embed)(?:_(\d+|auto)_(\d+|auto))?__)/;

    const getAttributeTag = function (str) {
        if (str && typeof str === 'string') {
            const match = str.match(tagRegExp);
            if (match) {
                return match[1] || match[4];
            }
        }
        return null;
    };

    const getAttributeTagDimension = function (str, idx) {
        if (str) {
            const match = str.match(tagRegExp);
            if (match) {
                const value = match[idx + 1] || match[idx + 4];
                if (value !== 'auto') {
                    return value ? value + 'px' : 'auto';
                }
                return value;
            }
        }
        return null;
    };

    const isSpecialAttribute = function (name, value, tag) {
        return getAttributeTag(name) === tag || getAttributeTag(value) === tag;
    };

    TC._hbs.registerHelper("isVideoAttribute", function (name, value) {
        return isSpecialAttribute(name, value, 'video');
    });

    TC._hbs.registerHelper("isAudioAttribute", function (name, value) {
        return isSpecialAttribute(name, value, 'audio');
    });

    TC._hbs.registerHelper("isImageAttribute", function (name, value) {
        return isSpecialAttribute(name, value, 'image');
    });

    TC._hbs.registerHelper("isEmbedAttribute", function (name, value) {
        return isSpecialAttribute(name, value, 'embed');
    });

    TC._hbs.registerHelper("getTagWidth", function (name, value) {
        let result = getAttributeTagDimension(name, 1);
        if (!result) {
            result = getAttributeTagDimension(value, 1);
        }
        return result;
    });

    TC._hbs.registerHelper("getTagHeight", function (name, value) {
        let result = getAttributeTagDimension(name, 2);
        if (!result) {
            result = getAttributeTagDimension(value, 2);
        }
        return result;
    });

    TC._hbs.registerHelper("removeSpecialAttributeTag", function (str) {
        if (!str) {
            return null;
        }
        if (typeof str === 'string') {
            const match = str.match(tagRegExp);
            if (match) {
                const separator = '__';
                const tag = match[0];
                if (tag.indexOf(separator) === 0) {
                    return str.substr(0, str.lastIndexOf(separator));
                }
                else {
                    return str.substr(str.indexOf(separator) + separator.length);
                }
            }
        }
        return str;
    });

    TC._hbs.registerHelper("isKeyValue", function (obj) {
        return obj && obj.hasOwnProperty("value") && typeof obj["value"] !== 'object';
    });

    TC._hbs._getIdHelperIds = [];
    TC._hbs.registerHelper("getId", function (obj) {
        let found = TC._hbs._getIdHelperIds.find((item) => { return item.obj === obj });
        if (!found) {
            TC._hbs._getIdHelperIds.push(found = { obj: obj, id: TC.getUID() });
        }
        return found.id;
    });

    //condición IF si una coleccion de atributos tiene 1 o mas elementos. Tiene una lista negra llamada excludedKeys
    TC._hbs.registerHelper("countif", function (obj, excludedKeys) {
        const excKeys = excludedKeys ? excludedKeys.split(',') : [];
        let _count = 0
        for (let k in obj) {
            if (excKeys.indexOf(k) < 0) {
                _count++;
            }
        }
        return _count > 0;
    });

    TC._hbs.registerHelper("formatDateOrNumber", function (obj) {
        if (obj && /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T(2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9](\.[0-9]{0,3}){0,1}Z$/.test(obj)) {
            return new Date(obj).toLocaleString(TC.i18n.currentLocaleKey && TC.i18n.currentLocaleKey.length > 2 ? TC.i18n.currentLocaleKey.substr(0, 2) : TC.i18n.currentLocaleKey, { hour12: false });
        }
        if (obj && /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])Z$/.test(obj)) {
            if (isNaN(Date.parse(obj)))
                obj = obj.replace('Z', '');
            return new Date(obj).toLocaleDateString(TC.i18n.currentLocaleKey && TC.i18n.currentLocaleKey.length > 2 ? TC.i18n.currentLocaleKey.substr(0, 2) : TC.i18n.currentLocaleKey);

        }
        if (typeof obj === 'number') {
            return TC.Util.formatNumber(obj, TC.i18n.currentLocaleKey);
        }
        return obj;
    })
})();
import Handlebars from 'handlebars/dist/handlebars';
Handlebars.noConflict();

Handlebars.registerHelper("i18n", function (key, safe) {
    const value = TC.i18n.currentLocale[key];
    if (typeof value === 'string') {
        return safe ? new Handlebars.SafeString(value) : value;
    }
    return key;
});

Handlebars.registerHelper("gt", function (v1, v2) {
    return v1 > v2;
});

Handlebars.registerHelper("lt", function (v1, v2) {
    return v1 < v2;
});

Handlebars.registerHelper("eq", function (v1, v2) {
    return v1 == v2;
});

Handlebars.registerHelper("every", function () {
    return Array.from(arguments).slice(0, arguments.length - 1).every(v => v);
});

Handlebars.registerHelper("round", function (value) {
    return Math.round(value);
});

Handlebars.registerHelper("lowerCase", function (str) {
    return str && str.toLowerCase();
});

Handlebars.registerHelper("startsWith", function (str, value) {
    return str && str.toString().startsWith(value);
});

Handlebars.registerHelper("isObject", function (obj) {
    return obj && obj instanceof Object && !Array.isArray(obj);
});

Handlebars.registerHelper("isEmpty", function (obj) {
    return !!obj && Object.keys(obj).length === 0;
});

Handlebars.registerHelper("isArray", function (obj) {
    return Array.isArray(obj);
});

Handlebars.registerHelper("isUrl", function (str) {
    return str && /^(http|https|ftp|mailto)\:\/\//i.test(str);
});

Handlebars.registerHelper("getYoutubeId", function (str) {
    if (str) {
        const match = str.match(/^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/);
        if (match) {
            return match[1];
        }
    }
    return null;
});

Handlebars.registerHelper("getHeader", function (str) {
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

Handlebars.registerHelper("isVideoAttribute", function (name, value) {
    return isSpecialAttribute(name, value, 'video');
});

Handlebars.registerHelper("isAudioAttribute", function (name, value) {
    return isSpecialAttribute(name, value, 'audio');
});

Handlebars.registerHelper("isImageAttribute", function (name, value) {
    return isSpecialAttribute(name, value, 'image');
});

Handlebars.registerHelper("isEmbedAttribute", function (name, value) {
    return isSpecialAttribute(name, value, 'embed');
});

Handlebars.registerHelper("hasDisplayName", function (obj) {
    return obj && Object.prototype.hasOwnProperty.call(obj, "displayName") && Object.prototype.hasOwnProperty.call(obj, "toString");
});

Handlebars.registerHelper("getTagWidth", function (name, value) {
    let result = getAttributeTagDimension(name, 1);
    if (!result) {
        result = getAttributeTagDimension(value, 1);
    }
    return result;
});

Handlebars.registerHelper("getTagHeight", function (name, value) {
    let result = getAttributeTagDimension(name, 2);
    if (!result) {
        result = getAttributeTagDimension(value, 2);
    }
    return result;
});

Handlebars.registerHelper("removeSpecialAttributeTag", function (str) {
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

Handlebars.registerHelper("isKeyValue", function (obj) {
    return obj && Object.prototype.hasOwnProperty.call(obj, "value") && typeof obj["value"] !== 'object';
});
    
Handlebars._getIdHelperIds = [];
Handlebars.registerHelper("getId", function (obj) {
    let found = Handlebars._getIdHelperIds.find((item) => { return item.obj === obj });
    if (!found) {
        Handlebars._getIdHelperIds.push(found = { obj: obj, id: TC.getUID() });
    }
    return found.id;
});

//condición IF si una coleccion de atributos tiene 1 o mas elementos. Tiene una lista negra llamada excludedKeys
Handlebars.registerHelper("countif", function (obj, excludedKeys) {
    const excKeys = excludedKeys ? excludedKeys.split(',') : [];
    let _count = 0
    for (let k in obj) {
        if (excKeys.indexOf(k) < 0) {
            _count++;
        }
    }
    return _count > 0;
});

const dateTimeRegEx = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T(2[0-3]|[01][0-9]):[0-5][0-9](:[0-5][0-9])?(\.[0-9]{0,3}){0,1}Z?$/;
const dateRegEx = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])Z?$/;

Handlebars.registerHelper("formatDateNumberOrBoolean", function (obj) {
    if (obj && dateTimeRegEx.test(obj)) {
        return new Date(obj).toLocaleString(TC.i18n.currentLocaleKey && TC.i18n.currentLocaleKey.length > 2 ? TC.i18n.currentLocaleKey.substr(0, 2) : TC.i18n.currentLocaleKey, { hour12: false });
    }
    if (obj && dateRegEx.test(obj)) {
        if (Number.isNaN(Date.parse(obj)))
            obj = obj.replace('Z', '');
        return new Date(obj).toLocaleDateString(TC.i18n.currentLocaleKey && TC.i18n.currentLocaleKey.length > 2 ? TC.i18n.currentLocaleKey.substr(0, 2) : TC.i18n.currentLocaleKey);

    }
    if (typeof obj === 'number' || (typeof obj === 'string') && !Number.isNaN(obj)) {
        return TC.Util.formatNumber(obj, TC.i18n.currentLocaleKey);
    }
    if (typeof obj === 'string') {
        const value = obj.toLowerCase();
        if (value === 'true') {
            return TC.i18n.currentLocale.yes;
        }
        if (value === 'false') {
            return TC.i18n.currentLocale.no;
        }
    }
    return obj;
})

const getDate = function (obj) {
    if (obj instanceof Date) {
        return obj;
    }
    if (dateRegEx.test(obj) || dateTimeRegEx.test(obj)) {
        return new Date(obj);
    }
}

const inputDate = function (obj) {
    const date = getDate(obj);
    if (date) {
        return `${date.getFullYear().toString().padStart(4, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    return ''
};
Handlebars.registerHelper("inputDate", inputDate);

const inputTime = function (obj) {
    const date = getDate(obj);
    if (date) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
    }
    return ''
};
Handlebars.registerHelper("inputTime", inputTime);

Handlebars.registerHelper("inputDatetime", function (obj) {
    const date = inputDate(obj);
    const time = inputTime(obj);
    if (date && time) {
        return date + 'T' + time;
    }
    return '';
});

Handlebars.registerHelper("formatNumber", function (value, locale) {
    return value.toLocaleString(locale);
});    

export default Handlebars;
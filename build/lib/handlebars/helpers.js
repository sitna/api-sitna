if (!TC._hbs || (!TC._hbs.compile && Handlebars.compile)) {
    TC._hbs = Handlebars.create();
    Handlebars.noConflict();
}
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

TC._hbs.registerHelper("round", function (value) {
    return Math.round(value);
});

TC._hbs.registerHelper("lowerCase", function (str) {
    return str.toLowerCase();
});

TC._hbs.registerHelper("startsWith", function (str, value) {
    return str.startsWith(value);
});

TC._hbs.registerHelper("isObject", function (obj, options) {
    if (typeof obj === 'object') {
        return options.fn(this);
    }
    else {
        return options.inverse(this);
    }
});

TC._hbs.registerHelper("isArray", function (obj, options) {
    if (Array.isArray(obj)) {
        return options.fn(this);
    }
    else {
        return options.inverse(this);
    }
});

TC._hbs.registerHelper("isKeyValue", function (obj, options) {
    if (obj.hasOwnProperty("value") && typeof obj["value"] !== 'object') {
        return options.fn(this);
    }
    else {
        return options.inverse(this);
    }
});
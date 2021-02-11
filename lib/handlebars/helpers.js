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
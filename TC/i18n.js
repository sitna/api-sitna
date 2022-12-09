import TC from '../TC';
import Consts from './Consts';
const i18n = {};
i18n.loadResources = function (condition, path, locale) {
    var result;
    if (condition) {
        result = new Promise(function (resolve, reject) {
            TC.ajax({
                url: path + locale + '.json',
                method: 'GET',
                responseType: Consts.mimeType.JSON
            })
                .then(function (response) {
                    const data = response.data;
                    i18n[locale] = i18n[locale] || {};
                    Object.assign(i18n[locale], data);
                    i18n.currentLocale = i18n[locale];
                    i18n.currentLocaleKey = locale;
                    resolve();
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    } else {
        i18n.currentLocale = i18n[locale];
        result = Promise.resolve();
    }
    return result;
};

export default i18n;
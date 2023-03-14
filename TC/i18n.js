import TC from '../TC';
import Consts from './Consts';
const i18n = {};
i18n.loadResources = async function (condition, path, locale) {
    if (condition) {
        const response = await TC.ajax({
            url: path + locale + '.json',
            method: 'GET',
            responseType: Consts.mimeType.JSON
        })
        const data = response.data;
        i18n[locale] = i18n[locale] || {};
        Object.assign(i18n[locale], data);
        i18n.currentLocale = i18n[locale];
        i18n.currentLocaleKey = locale;
    } else {
        i18n.currentLocale = i18n[locale];
    }
};

export default i18n;
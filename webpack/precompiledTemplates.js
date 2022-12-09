const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

(function (root, factory) {
    if (typeof exports === "object") { // CommonJS
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) { // AMD
        define([], factory);
    } else {
        root.precompiledTemplates = factory();
    }
})(this, function () {
    const precompiledTemplates = {};
    const ourPath = path.resolve(__dirname, '../TC/templates/');
    fs.readdir(ourPath, function (err, files) {
        if (err) {
            return console.error(err);
        }
        files
            .filter(f => f.endsWith('.hbs'))
            .forEach(function (file) {
                precompiledTemplates[file] = handlebars
                    .precompile(fs.readFileSync(ourPath + '\\' + file, "utf8"), {
                        knownHelpers: {
                            i18n: true,
                            gt: true,
                            lt: true,
                            eq: true,
                            every: true,
                            round: true,
                            lowerCase: true,
                            startsWith: true,
                            numberSeparator: true,
                            countif: true,
                            isEmpty: true,
                            getId: true,
                            isArray: true,
                            isObject: true,
                            formatNumber: true,
                            isUrl: true,
                            getYoutubeId: true,
                            isVideoAttribute: true,
                            isAudioAttribute: true,
                            isImageAttribute: true,
                            isEmbedAttribute: true,
                            getTagWidth: true,
                            getTagHeight: true,
                            getHeader: true,
                            removeSpecialAttributeTag: true,
                            formatDateOrNumber: true
                        },
                        knownHelpersOnly: true
                    })
                    .replace(/\n/g, "");
            });
    });
    return precompiledTemplates;
});

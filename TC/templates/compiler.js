const fs = require('fs');
const handlebars = require('handlebars');

const files = fs.readdirSync(__dirname);
files
    .filter(f => f.endsWith('.hbs'))
    .forEach(function (file) {
        const templateName = file.substr(0, file.lastIndexOf('.hbs'));
        const template = handlebars
            .precompile(fs.readFileSync(__dirname + '\\' + file, "utf8"), {
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
                    hasDisplayName: true,
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
            });
        fs.writeFileSync(__dirname + '\\' + templateName + '.mjs', 'export default ' + template);
    });

const fs = require('fs');

const files = fs.readdirSync(__dirname);
files
    .filter(f => f.endsWith('-web-worker.js'))
    .forEach(function (file) {
        const moduleName = file.substr(0, file.lastIndexOf('.js')) + '-blob';
        const data = fs.readFileSync(__dirname + '\\' + file, "utf8");
        const contents = 'export default new Blob([String.raw`' + data + '`], { type: "text/javascript; charset=utf-8" });';
        fs.writeFileSync(__dirname + '\\' + moduleName + '.mjs', contents);
    });
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

let files = [path.resolve(__dirname, 'tcmap.css')];
files = files.concat(fs.readdirSync(path.resolve(__dirname, 'control')).map(f => path.resolve(__dirname, 'control/', f)));
files = files.concat(fs.readdirSync(path.resolve(__dirname, 'view')).map(f => path.resolve(__dirname, 'view/', f)));
const output = new CleanCSS({
    rebaseTo: path.resolve(__dirname),
    sourceMap: true,
    level: 0/*,
    format: {
        breaks: {
            afterBlockBegins: true,
            afterRuleEnds: true
        }
    }*/
}).minify(files);
fs.writeFileSync(path.resolve(__dirname, 'sitna.css.map'), output.sourceMap.toString());
fs.writeFileSync(path.resolve(__dirname, 'sitna.css'), output.styles);

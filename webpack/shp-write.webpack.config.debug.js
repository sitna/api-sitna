const path = require('path');
module.exports = {
    entry: path.resolve(__dirname, '../node_modules/@aleffabricio/shp-write/index.js'),
    output: {
        filename: 'shp-write.js',
        library: 'shpWrite',
        path: path.resolve(__dirname, '../lib/shp-write/'),
        clean: true
    },
    mode: 'development',
    resolve: {
        fallback: { "assert": false }
    }
};
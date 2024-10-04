const path = require('path');
const webpack = require('webpack');
module.exports = {
    entry: './examples/sandbox.js',
    mode: 'development',
    devtool: 'source-map',    
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader']
            }
        ]
    },
    ignoreWarnings: [/Failed to parse source map/],
    
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../dist/examples')
    }
};

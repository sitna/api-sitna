const path = require('path');
const webpack = require('webpack');
module.exports = {
    entry: './sitna.js',
    mode: 'development',
    devtool: 'source-map',
    resolve: {
        fallback: {
            buffer: require.resolve('buffer/'),
            assert: false,
            util: require.resolve('./util-fallback.js')
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
                exclude: [
                    /node_modules\/cesium/  
                ]

            },
            {
                test: path.resolve(__dirname, '../sitna.js'),
                loader: 'string-replace-loader',
                options: {
                    // Añadimos la fecha de compilación a la cadena indicadora de versión
                    search: /TC\.version = '(\d+\.\d+\.\d+)';/,
                    replace(match, p1) {
                        return "TC.version = '" + p1 + " [" + (new Date()).toLocaleString() + "]';";
                    }
                }
            },
            {
                test: /\.d\.ts$/,
                loader: 'ignore-loader'
            },
        ]
    },
    ignoreWarnings: [/Failed to parse source map/],
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        })
    ],
    devServer: {
        allowedHosts: 'all',
        static: './dist',
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
        watchFiles: './TC/templates/*.mjs'
    },
    output: {
        filename: 'sitna.debug.js',
        path: path.resolve(__dirname, '../dist'),
        chunkFilename: 'chunks/[name].sitna.debug.js',
        sourceMapFilename: 'maps/[file].map',
        library: 'SITNA',
        libraryTarget: 'umd'
    }
};

const path = require('path');
module.exports = {
    entry: path.resolve(__dirname, '../batch/cesium-webpack/main.js'),
    output: {
        filename: 'cesium-sitna.min.js',
        library: 'cesium',
        path: path.resolve(__dirname, '../lib/cesium/build/'),
        // Needed to compile multiline strings in Cesium
        sourcePrefix: ''
    },
    amd: {
        // Enable webpack-friendly use of require in Cesium
        toUrlUndefined: true
    },
    mode: 'production',
    resolve: {
        mainFields: ['module', 'main'],
        fallback: {
            // Resolve node module use of fs
            fs: false,
            Buffer: false,
            http: false,
            https: false,
            zlib: false,
            url: false
        }
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: ['style-loader', { loader: 'css-loader' }],
            sideEffects: true
        }, {
            test: /\.(png|gif|jpg|jpeg|svg|xml|json)$/,
            use: ['url-loader']
        }, {
            // Remove pragmas
            test: /\.js$/,
            enforce: 'pre',
            //include: path.resolve(__dirname, 'node_modules/cesium/Source'),
            sideEffects: false,
            use: [{
                loader: 'strip-pragma-loader',
                options: {
                    pragmas: {
                        debug: false
                    }
                }
            }]
        },
        {
            use: ['source-map-loader']
        }]
        // Removes these errors: "Critical dependency: require function is used in a way in which dependencies cannot be statically extracted"
        // https://github.com/AnalyticalGraphicsInc/cesium-webpack-example/issues/6
        //unknownContextCritical: false,
        //unknownContextRegExp: /\/cesium\/cesium\/Source\/Core\/buildModuleUrl\.js/
    },
    ignoreWarnings: [/Failed to parse source map/],
    optimization: {
        usedExports: true
    }
};
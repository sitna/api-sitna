const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
module.exports = {
    entry: './sitna.js',
    mode: 'production',
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
                use: ['source-map-loader']
            },
            {
                test: /\.js$/,
                exclude: [/node_modules/, /lib/],
                use: {
                    loader: 'babel-loader',
                    options: {
                        plugins: ['@babel/plugin-proposal-class-properties'
                            , '@babel/plugin-proposal-class-static-block'
                            , '@babel/plugin-proposal-private-methods'
                            , '@babel/plugin-proposal-private-property-in-object'
                            , '@babel/plugin-proposal-optional-chaining'
                            , '@babel/plugin-proposal-logical-assignment-operators'
                            , '@babel/plugin-proposal-nullish-coalescing-operator']
                    }
                }
            },
            {
                resource: path.resolve(__dirname, '../sitna.js'),
                loader: 'string-replace-loader',
                options: {
                    multiple: [
                        // Establecemos la propiedad que indica que es una versi�n debug a false
                        {
                            search: /TC\.isDebug = true;/g,
                            replace: 'TC.isDebug = false;'
                        },
                        // A�adimos la fecha de compilaci�n a la cadena indicadora de versi�n
                        {
                            search: /TC\.version = '(\d+\.\d+\.\d+)';/,
                            replace(match, p1) {
                                return "TC.version = '" + p1 + " [" + (new Date()).toLocaleString() + "]';";
                            }
                        }
                    ]
                }
            }
        ]
    },
    ignoreWarnings: [/Failed to parse source map/],
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        })
    ],
    optimization: {
        minimizer: [new TerserPlugin({
            extractComments: false
        })]
    },
    output: {
        filename: 'sitna.js',
        path: path.resolve(__dirname, '../dist'),
        chunkFilename: 'chunks/[name].sitna.js',
        sourceMapFilename: 'maps/[file].map',
        library: 'SITNA'
    }
};

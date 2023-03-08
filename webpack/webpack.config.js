const path = require('path');
const precompiledTemplates = require('./precompiledTemplates');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
module.exports = {
    entry: './sitna.js',
    mode: 'production',
    devtool: 'source-map',
    resolve: {
        fallback: {
            buffer: require.resolve('buffer/')
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer']
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader']
            },
            {
                resource: path.resolve(__dirname, '../sitna.js'),
                loader: 'string-replace-loader',
                options: {
                    multiple: [
                        // Establecemos la propiedad que indica que es una versión debug a false
                        {
                            search: /TC\.isDebug = true;/g,
                            replace: 'TC.isDebug = false;'
                        },
                        // Añadimos la fecha de compilación a la cadena indicadora de versión
                        {
                            search: /TC\.version = '(\d+\.\d+\.\d+)';/,
                            replace(match, p1) {
                                return "TC.version = '" + p1 + " [" + (new Date()).toLocaleString() + "]';";
                            }
                        }
                    ]
                }
            },
            {
                test: /(sitna)|(TC).+\.js$/,
                loader: 'string-replace-loader',
                options: {
                    multiple: [
                        // Sustituimos plantillas de control únicas por su resultado compilado
                        {
                            search: /template = TC\.apiLocation \+ \"TC\/templates\/(.+)\.hbs\";/g,
                            replace(match, p1) {
                                return "template = " + precompiledTemplates[p1 + '.hbs'];
                            }
                        },
                        // Sustituimos plantillas de control múltiples por su resultado compilado
                        {
                            search: /template\[(.+)\] = TC\.apiLocation \+ \"TC\/templates\/(.+)\.hbs\";/g,
                            replace(match, p1, p2) {
                                return "template[" + p1 + "] = " + precompiledTemplates[p2 + '.hbs'];
                            }
                        }
                    ]
                }
            }
        ]
    },
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

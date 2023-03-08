var gulp = require('gulp'),
    del = require('del'),
    eslint = require('gulp-eslint-new'),
    //convertEncoding = require('gulp-convert-encoding'),
    minify = require('gulp-minify'),
    cleanCSS = require('gulp-clean-css'),
    zip = require('gulp-zip'),
    jsonlint = require("gulp-jsonlint"),
    mochaChrome = require('gulp-mocha-chrome'),
    casperJs = require('gulp-casperjs'),
    jsdoc = require('gulp-jsdoc3'),
    filter = require('gulp-filter'),
    webpack = require('webpack'),
    webpackStream = require('webpack-stream'),
    WebpackDevServer = require('webpack-dev-server'),
    ncp = require('ncp'),
    fs = require('fs'),
    fse = require('fs-extra'),
    os = require('os'),
    precompiledTemplates = require('./webpack/precompiledTemplates'),
    spawn = require('child_process').spawn; 

////////// Gestión de errores ////////
//var plumber = require('gulp-plumber');
//var gutil = require('gulp-util');

//var gulp_src = gulp.src;
//gulp.src = function () {
//    return gulp_src.apply(gulp, arguments)
//        .pipe(plumber(function (error) {
//            // Output an error message
//            gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message));
//            // emit the end event, to properly end the task
//            this.emit('end');
//        })
//        );
//};
////////////////////////////////


var sitnaBuild = {
    targetPath: 'dist/',
    preSrc: [
        'lib/jsnlog/jsnlog.min.js',
        'node_modules/handlebars/dist/handlebars.runtime.min.js'
    ],
    postSrc: [
        'TC/ui/autocomplete.js',
        'lib/draggabilly/draggabilly.pkgd.min.js',
        'node_modules/sortablejs/Sortable.min.js',
        'lib/qrcode/qrcode.min.js',
        'lib/shp-write/shp-write.js',
        'lib/shp-write/shp-write.min.js',
        'TC/tool/Proxification.js',
        'TC/Map.js',
        'TC/Util.js',
        'SITNA/Map.js',
        'sitna.js',
        'lib/handlebars/helpers.js',
        'TC/Layer.js',
        'TC/Control.js',
        'TC/Feature.js',
        'TC/feature/Point.js',
        'TC/feature/**/*.js',
        'SITNA/feature/**/*.js',
        'TC/filter.js',
        'TC/control/MapContents.js',
        'TC/control/MapInfo.js',
        'TC/control/TOC.js',
        'TC/control/WorkLayerManager.js',
        'TC/control/Click.js',
        'TC/control/FeatureInfoCommons.js',
        'TC/control/Scale.js',
        'TC/control/SWCacheClient.js',
        'TC/control/OfflineMapMaker.js',
        'TC/control/Measure.js',
        'TC/control/ProjectionSelector.js',
        'TC/control/Container.js',
        'TC/control/TabContainer.js',
        'TC/ol/**/*.js',
        'TC/control/**/*.js',
        'TC/layer/**/*.js',
        'TC/Geometry.js'
    ]

};

function buildCsprojFilter(cb) {
    fs.readFile('./API.csproj', 'utf8', (err, data) => {
        if (err) throw err;
        sitnaBuild.projectFiles = data
            .split('\n')
            .filter(l => l.includes('<Content '))
            .map(l => l.match(/Include=\"(.+)"/)[1])
            .map(l => l.replace(/\\/g, '/'));
        cb();
    });
};

function copyLibraries(cb) {
    let counter = 0;
    const copyDir = function (src, dest) {
        sitnaBuild.projectFiles.push(src + '**/*');
        sitnaBuild.projectFiles.push(dest + '**/*');
        counter++;
        ncp(src, dest, function (err) {
            if (err) {
                return console.error(err);
            }
            counter--;
            if (!counter) {
                cb();
            }
        });
    };
    const copyFile = function (src, dest) {
        fs.copyFileSync(src, dest);
        sitnaBuild.projectFiles.push(src);
        sitnaBuild.projectFiles.push(dest);
    };
    copyFile('node_modules/handlebars/dist/handlebars.js', 'lib/handlebars/handlebars.js');
    copyFile('node_modules/handlebars/dist/handlebars.min.js', 'lib/handlebars/handlebars.min.js');
    copyFile('node_modules/handlebars/dist/handlebars.runtime.js', 'lib/handlebars/handlebars.runtime.js');
    copyFile('node_modules/handlebars/dist/handlebars.runtime.min.js', 'lib/handlebars/handlebars.runtime.min.js');
    if (!fs.existsSync('lib/sortable')) {
        fs.mkdirSync('lib/sortable');
    }
    copyFile('node_modules/sortablejs/Sortable.js', 'lib/sortable/Sortable.js');
    copyFile('node_modules/sortablejs/Sortable.min.js', 'lib/sortable/Sortable.min.js');       
    copyDir('node_modules/jszip/dist/', 'lib/jszip/');
    copyDir('node_modules/@sitna/shpjs/dist/', 'lib/shpjs/');
    copyDir('node_modules/draggabilly/dist/', 'lib/draggabilly/');
    copyDir('node_modules/wkx/dist/', 'lib/wkx/');

    if (!fs.existsSync('lib/interactjs')) {
        fs.mkdirSync('lib/interactjs');
    }    
    copyFile('node_modules/interactjs/dist/interact.min.js', 'lib/interactjs/interact.min.js'); 
    copyFile('node_modules/interactjs/dist/interact.min.js.map', 'lib/interactjs/interact.min.js.map'); 
        
    const copyDirSyncRecursive = function (src, dest) {
        try {
            fse.copySync(src, dest);            
            sitnaBuild.projectFiles.push(src + '**/*');
            sitnaBuild.projectFiles.push(dest + '**/*');
            sitnaBuild.projectFiles.push(src + '**/**/*');
            sitnaBuild.projectFiles.push(dest + '**/**/*');
            sitnaBuild.projectFiles.push(src + '**/**/**/*');
            sitnaBuild.projectFiles.push(dest + '**/**/**/*');            
        } catch (err) {
            console.error(err);
        }        
    };    

    copyDirSyncRecursive('node_modules/cesium/Build/Cesium/Workers', 'lib/cesium/build/Workers');        
    copyDirSyncRecursive('node_modules/cesium/Build/Cesium/ThirdParty', 'lib/cesium/build/ThirdParty');       
    copyDirSyncRecursive('node_modules/cesium/Build/Cesium/Assets', 'lib/cesium/build/Assets');
};

sitnaBuild.templateFunctions = precompiledTemplates;

const spawnWebpack = function (args, cb) {
    const ls = spawn('webpack.cmd', args);
    ls.stdout.on('data', data => console.log(`stdout: ${data}`));
    ls.stderr.on('data', data => console.error(`stderr: ${data}`));
    ls.on('error', err => console.error(`Failed to start subprocess: ${err}`));
    ls.on('close', code => {
        if (code === 0) {
            cb();
        }
        else {
            throw new Error(`child process exited with code ${code}`);
        }
    });
};

function webpackApi(cb) {
    spawnWebpack(['--config', './webpack/webpack.config.js', '--output-path', './dist'], cb);
}

function webpackApiDebug(cb) {
    spawnWebpack(['--config', './webpack/webpack.config.debug.js', '--output-path', './dist'], cb);
}

function resources() {
    return gulp.src([
        '**/*',
        '!App_Start/**/*',
        '!batch/**/*',
        '!dist/**/*',
        '!doc/**/*',
        '!examples/**/*.html',
        '!examples/**/*.appcache',
        '!kml/**/*',
        '!images/**/*',
        '!screenshots/**/*',
        '!node_modules/**/*',
        '!obj/**/*',
        '!Properties/**/*',
        '!pruebas/**/*',
        '!TC/**/*.js',     
        '!webpack/**/*.js',     
        '!lib/ol/**/*',
        '!TC/**/*.css',
        '!test/**/*',
        '!**/*.cs',
        '!*',
        '!bin/*'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(sitnaBuild.targetPath));
};

function dlls() {
    return gulp.src([
        'bin/*.dll'
    ])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'bin/'));
};

function scripts(cb) {
    const minifyConfig = {
        ext: {
            min: '.min.js'
        },
        noSource: true,
        compress: { sequences: false },
        output: { ascii_only: true }
    };

    let target = sitnaBuild.targetPath + 'TC/config/';
    gulp.src([
        'TC/config/*.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target))
        .pipe(minify(minifyConfig))
        .pipe(gulp.dest(target));

    target = sitnaBuild.targetPath + 'TC/cesium/';
    gulp.src([
        'TC/cesium/**/*.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target))
        .pipe(minify(minifyConfig))
        .pipe(gulp.dest(target));

    target = sitnaBuild.targetPath + 'TC/layout/';
    gulp.src([
        'TC/layout/**/*.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target))
        .pipe(minify(minifyConfig))
        .pipe(gulp.dest(target));

    target = sitnaBuild.targetPath + 'TC/workers/';
    gulp.src([
        'TC/workers/*.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target))
        .pipe(minify(minifyConfig))
        .pipe(gulp.dest(target));

    target = sitnaBuild.targetPath + 'TC/tool/';
    gulp.src([
        'TC/tool/Elevation*.js',
        'TC/tool/ExcelExport*.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target))
        .pipe(minify(minifyConfig))
        .pipe(gulp.dest(target));

    target = sitnaBuild.targetPath + 'TC/format/';
    gulp.src([
        'TC/format/WPS.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target))
        .pipe(minify(minifyConfig))
        .pipe(gulp.dest(target));

    target = sitnaBuild.targetPath + 'lib/';
    gulp.src([
        'lib/**/*.js',
        '!lib/ol/**/*.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target));
    cb();
};

function examples() {
    return gulp.src([
        'examples/**/*.html',
        'examples/**/*.appcache'
    ], { removeBOM: false })
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'examples/'));
};

function exampleSW() {
    return gulp.src([
        'TC/workers/tc-cb-service-worker.js'
    ])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'examples/'));
};

function zipLayout () {
    return gulp.src([
        'TC/layout/responsive/**/*'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(zip('responsive.zip'))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'TC/layout/responsive/'));
};

function copyLayout() {
    return gulp.src([
        sitnaBuild.targetPath + 'TC/layout/responsive/**/*'
    ])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'layout/responsive/'));
};

function baseCss() {
    return gulp.src([
        'TC/**/*.css',
        '!TC/css/control/**/*',
        '!TC/**/style.css'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(cleanCSS({
            level: 0
        }))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'TC/'));
};

function componentCss() {
    return gulp.src([
        'css/ui/*.css'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'css/ui'));
}

function layoutCss() {
    return gulp.src([
        'TC/**/style.css'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(cleanCSS({
            level: 0
        }))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'TC/'));
};

function jsonValidate() {
    return gulp.src("TC/**/*.json")
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(jsonlint())
        .pipe(jsonlint.reporter())
        .pipe(jsonlint.failOnError());
};

function lint() {
    return gulp.
        src([
            'sitna.js',
            'TC.js',
            'TC/**/*.js',
            'SITNA/**/*.js'
        ])
        .pipe(eslint())
        .pipe(eslint.formatEach());
}

//function bundleOLDebug() {
//    const fileName = 'ol-sitna.js';
//    sitnaBuild.projectFiles.push('lib/ol/build/' + fileName);
//    return gulp.src('batch/ol-webpack/main.js')
//        .pipe(webpackStream({
//            output: {
//                filename: fileName,
//                library: 'ol'
//            },
//            mode: 'development',
//            module: {
//                rules: [
//                    {
//                        use: ['source-map-loader']
//                    }
//                ]
//            }
//        }))
//        .pipe(gulp.dest('lib/ol/build'));
//};

function bundleCesiumDebug() {
    const fileName = 'cesium-sitna.js';
    sitnaBuild.projectFiles.push('lib/cesium/build/' + fileName);
    return gulp.src('batch/cesium-webpack/main.js')
        .pipe(webpackStream({
            output: {
                filename: fileName,
                library: 'cesium',
                // Needed to compile multiline strings in Cesium
                sourcePrefix: ''
            },
            mode: 'development',
            devtool: 'eval',
            amd: {
                // Enable webpack-friendly use of require in Cesium
                toUrlUndefined: true
            },
            node: {
                // Resolve node module use of fs
                fs: "empty",
                Buffer: false,
                http: "empty",
                https: "empty",
                zlib: "empty"
            },
            resolve: {
                mainFields: ['module', 'main']
            },
            module: {
                rules: [
                    {
                        test: /\.css$/,
                        use: ['style-loader', 'css-loader']
                    }, {
                        test: /\.(png|gif|jpg|jpeg|svg|xml|json)$/,
                        use: ['url-loader']
                    },
                    {
                        use: ['source-map-loader']
                    }
                ],
                // Removes these errors: "Critical dependency: require function is used in a way in which dependencies cannot be statically extracted"
                // https://github.com/AnalyticalGraphicsInc/cesium-webpack-example/issues/6
                //unknownContextCritical: false,
                //unknownContextRegExp: /\/cesium\/cesium\/Source\/Core\/buildModuleUrl\.js/
            }
        }))
        .pipe(gulp.dest('lib/cesium/build'));
};

function BundleSHPwriteDebug() {   
    sitnaBuild.projectFiles.push("lib/shp-write/shp-write.js");
    return gulp.src('node_modules/@aleffabricio/shp-write/index.js')
        .pipe(webpackStream({
            output: {
                filename: 'shp-write.js',
                library: 'shpWrite'
            },
            mode: 'development'
        })).pipe(gulp.dest('lib/shp-write/'));
}
//function BundleGPKGConverter() {
//    //sitnaBuild.projectFiles.push("lib/shp-write/shp-write.js");
//    return gulp.src('node_modules/geojson/index.js')
//        .pipe(webpackStream({
//            output: {
//                filename: 'geopackageConverter.js',
//                library: 'GPKGConverter'
//            },
//            mode: 'development'
//        })).pipe(gulp.dest('lib/GPKGConverter/'))

//};
function BundleSHPwriteRelease() {
    sitnaBuild.projectFiles.push("lib/shp-write/shp-write.min.js");
    return gulp.src('node_modules/@aleffabricio/shp-write/index.js')
        .pipe(webpackStream({
            output: {
                filename: 'shp-write.min.js',
                library: 'shpWrite'
            },
            mode: 'production'
        })).pipe(gulp.dest('lib/shp-write/'))        
}


//function bundleOLRelease () {
//    const fileName = 'ol-sitna.min.js';
//    sitnaBuild.projectFiles.push('lib/ol/build/' + fileName);
//    return gulp.src('batch/ol-webpack/main.js')
//        .pipe(webpackStream({
//            output: {
//                filename: fileName,
//                library: 'ol'
//            },
//            mode: 'production',
//            module: {
//                rules: [
//                    {
//                        use: ['source-map-loader']
//                    }
//                ]
//            }
//        }))
//        .pipe(gulp.dest('lib/ol/build'));
//};

function bundleCesiumRelease() {
    const fileName = 'cesium-sitna.min.js';
    sitnaBuild.projectFiles.push('lib/cesium/build/' + fileName);
    return gulp.src('batch/cesium-webpack/main.js')
        .pipe(webpackStream({
            output: {
                filename: fileName,
                library: 'cesium',
                // Needed to compile multiline strings in Cesium
                sourcePrefix: ''
            },
            amd: {
                // Enable webpack-friendly use of require in Cesium
                toUrlUndefined: true
            },
            mode: 'production',            
            node: {
                // Resolve node module use of fs
                fs: "empty",
                Buffer: false,
                http: "empty",
                https: "empty",
                zlib: "empty"
            },
            resolve: {
                mainFields: ['module', 'main']
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
                }],
                // Removes these errors: "Critical dependency: require function is used in a way in which dependencies cannot be statically extracted"
                // https://github.com/AnalyticalGraphicsInc/cesium-webpack-example/issues/6
                //unknownContextCritical: false,
                //unknownContextRegExp: /\/cesium\/cesium\/Source\/Core\/buildModuleUrl\.js/
            },
            optimization: {
                usedExports: true
            }
        }))
        .pipe(gulp.dest('lib/cesium/build'));
};

function clean (cb) {
    del([
        sitnaBuild.targetPath + '**/*',
        '!' + sitnaBuild.targetPath
    ], cb);
};

function unitTests() {
    console.log('Version: ' + process.version);
    return gulp
        .src('test/unit/browser/runner.html')
        .pipe(mochaChrome({ ignoreExceptions: true }));
};

function e2eTests () {
    return gulp.src('test/endToEnd/test.js').pipe(casperJs());
};

//gulp.task('rasterJSTest', function () {
//    const reportDir = 'test/unit/testResults';

//    //return gulp.src(['test/unit/browser/layer/Raster.js'], { read: false })
//    //            .pipe(mocha({
//    //                reporter: 'mochawesome',
//    //                reporterOptions: 'reportDir=' + reportDir + ',reportFilename=nodeTestResults'
//    //            }));
//    return del(reportDir + '/**/*', function () {
//        var browserStream = mochaPhantomJS({
//            reporter: 'spec',
//            dump: reportDir + '/browserTestResults.txt'
//        })
//        browserStream.write({ path: 'http://localhost:56187/test/unit/browser/runner.html' });
//        browserStream.end();

//        return browserStream;

//    });
//});

function docsite (cb) {
    var config = require('./batch/jsdoc/conf.json');
    return gulp.src(['./batch/jsdoc/README.md'], { read: false })
        .pipe(jsdoc(config, cb));
};

function docfiles() {
    return gulp.src(['./batch/jsdoc/img/*'])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'doc/img'));    
};

function docCSS() {
    return gulp.src(['./batch/jsdoc/css/*'])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'doc/css'));
};

const buildCss = gulp.series(
    buildCsprojFilter,
    baseCss,
    componentCss,
    layoutCss
);

let webpackServer;

function startDevServer() {
    const webpackConfig = require('./webpack/webpack.config.debug.js');
    const compiler = webpack(webpackConfig);
    const devServerOptions = { ...webpackConfig.devServer, open: true };
    webpackServer = new WebpackDevServer(devServerOptions, compiler);
    console.log('Starting server...');
    webpackServer.start();
}


const doc = gulp.series(
    docsite,
    docfiles,
    docCSS
);

const bundleApi = gulp.parallel(
    webpackApi,
    webpackApiDebug
);

const parallelTasks = gulp.parallel(
    doc,
    resources,
    dlls,
    zipLayout,
    layoutCss,
    examples,
    exampleSW
);

const noTests = gulp.series(
    clean,
    buildCsprojFilter,
    //compileTemplates,    
    //bundleOLDebug,
    //bundleOLRelease,    
    jsonValidate,
    BundleSHPwriteDebug,
    BundleSHPwriteRelease,
    bundleCesiumDebug,
    bundleCesiumRelease,
    copyLibraries,
    baseCss,
    componentCss,
    scripts,
    bundleApi,
    parallelTasks,
    copyLayout
);

exports.startDevServer = startDevServer;
exports.bundleApi = bundleApi;
exports.buildCss = buildCss;
exports.lint = lint;
exports.unitTests = unitTests;
exports.e2eTests = e2eTests;
exports.doc = doc;
exports.noTests = noTests;
exports.default = gulp.series(
    noTests,
    //e2eTests,
    unitTests
);
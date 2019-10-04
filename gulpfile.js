var gulp = require('gulp'),
    del = require('del'),
    //jshint = require('gulp-jshint'),
    replace = require('gulp-replace'),
    concat = require('gulp-concat'),
    //convertEncoding = require('gulp-convert-encoding'),
    minify = require('gulp-minify'),
    cleanCSS = require('gulp-clean-css'),
    //dust = require('gulp-dust'),
    zip = require('gulp-zip'),
    jsonlint = require("gulp-jsonlint"),
    mocha = require('gulp-mocha'),
    mochaPhantomJS = require('gulp-mocha-phantomjs'),
    casperJs = require('gulp-casperjs'),
    merge = require('merge-stream'),
    webpack = require('webpack-stream'),
    fs = require('fs');
var execSync = require('child_process').execSync;


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
    targetPath: 'build/',
    preSrc: [
        'lib/dust/dust-full.js',
        'lib/dust/dust-helpers.js',
        'lib/dust/dustjs-i18n.js',
        'lib/dust/dust.overrides.js',
        'lib/jsnlog/jsnlog.min.js'
    ],
    postSrc: [
        'TC/ui/autocomplete.js',
        'lib/draggabilly/draggabilly.pkgd.min.js',
        'lib/sortable/Sortable.min.js',
        'lib/qrcode/qrcode.min.js',
        'lib/jsonpack/jsonpack.min.js',
        'lib/ua-parser/ua-parser.min.js',
        'lib/proj4js/proj4.js',
        'TC/tool/Proxification.js',
        'TC/Map.js',
        'TC/Util.js',
        'tcmap.js',
        'lib/localForage/localforage.min.js',
        'TC/Layer.js',
        'TC/Control.js',
        'TC/Feature.js',
        'TC/feature/Point.js',
        'TC/feature/**/*.js',
        'TC/Filter.js',
        'TC/control/MapContents.js',
        'TC/control/MapInfo.js',
        'TC/control/TOC.js',
        'TC/control/WorkLayerManager.js',
        'TC/control/Click.js',
        'TC/control/FeatureInfoCommons.js',
        'TC/control/Scale.js',
        'TC/control/SWCacheClient.js',
        'TC/control/Measure.js',
        'TC/control/ProjectionSelector.js',
        'TC/control/Container.js',
        'TC/control/TabContainer.js',
        'TC/ol/**/*.js',
        'TC/control/**/*.js',
        'TC/layer/**/*.js',
        'TC/Geometry.js'
    ],
    sitnaSrc: [
        'sitna.js'
    ],

    unsetDebug: function (stream) {
        return stream.pipe(replace("TC.isDebug = true;", "TC.isDebug = false;"));
    },

    setVersionDate: function (stream) {
        return stream.pipe(replace(/TC.version = '(\d+\.\d+\.\d+)';/, function (match, p1) {
            return "TC.version = '" + p1 + " [" + (new Date()).toLocaleString() + "]';";
        }));
    },

    compiledTask: function () {
        const src = sitnaBuild.preSrc.concat(['lib/ol/build/ol-sitna.min.js'], sitnaBuild.postSrc, sitnaBuild.sitnaSrc);
        return sitnaBuild.setVersionDate(gulp.src(src))
            .pipe(concat('sitna.ol.debug.js'))
            .pipe(gulp.dest(sitnaBuild.targetPath));
    },

    onDemandTask: function (src, dest) {
        var stream = sitnaBuild.setVersionDate(gulp.src(src, { sourcemaps: true }))
            .pipe(gulp.dest(dest));
        return sitnaBuild.unsetDebug(stream)
            .pipe(minify({
                ext: {
                    min: '.min.js'
                },
                noSource: true,
                compress: { sequences: false },
                output: { ascii_only: true }
            }))
            .pipe(gulp.dest(dest, { sourcemaps: './maps' }));
    },
};

function bundle (done) {
    sitnaBuild.onDemandTask(['sitna.js'], sitnaBuild.targetPath);
    sitnaBuild.onDemandTask(['tcmap.js'], sitnaBuild.targetPath);
    sitnaBuild.onDemandTask(['TC/**/*.js'], sitnaBuild.targetPath + 'TC/');
    sitnaBuild.compiledTask();
    done();
};

function minifyBundle(cb) {
    const src = sitnaBuild.targetPath + 'sitna.ol.debug.js';
    gulp.watch(src, { events: 'add' }, function () {
        const stream = gulp.src([src], { sourcemaps: true });
        return sitnaBuild.unsetDebug(stream)
            .pipe(minify({
                ext: {
                    min: [/(.*)\.debug\.js$/, '$1.min.js']
                },
                noSource: true,
                compress: { sequences: false },
                output: { ascii_only: true }
            })) // sequences = false para evitar error "Maximum call stack size exceeded"
            .pipe(gulp.dest(sitnaBuild.targetPath, { sourcemaps: './maps' }));
    });
    cb();
};

function resources () {
    return gulp.src([
        '**/*',
        '!App_Start/**/*',
        '!batch/**/*',
        '!build/**/*',
        '!doc/**/*',
        '!examples/**/*.html',
        '!kml/**/*',
        '!images/**/*',
        '!screenshots/**/*',
        '!node_modules/**/*',
        '!obj/**/*',
        '!Properties/**/*',
        '!pruebas/**/*',
        '!TC/**/*.js',
        '!lib/cesium/debug/CesiumSrc.js',
        '!lib/cesium/release/CesiumSrc.js',
        '!TC/**/*.css',
        '!test/**/*',
        '!**/*.cs',
        '!*',
        '!bin/*.pdb', //exclude symbol files
        '!bin/*.dll.config',
        '!bin/*.xml'
    ])
        .pipe(gulp.dest(sitnaBuild.targetPath));
};

function examples () {
    return gulp.src([
        'examples/**/*.html'
    ])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'examples/'));
};

function zipLayout () {
    return gulp.src([
        'TC/layout/responsive/**/*'
    ])
        .pipe(zip('responsive.zip'))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'TC/layout/responsive/'));
};

function baseCss() {
    return gulp.src([
        'TC/**/*.css',
        '!TC/css/control/**/*',
        '!TC/**/style.css'
    ])
        .pipe(cleanCSS({
            level: 0
        }))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'TC/'));
};

function layoutCss() {
    return gulp.src([
        'TC/**/style.css'
    ])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'TC/'));
};

function jsonValidate () {
    return gulp.src("TC/**/*.json")
        .pipe(jsonlint())
        .pipe(jsonlint.reporter())
        .pipe(jsonlint.failOnError());
};

function bundleOLDebug () {
    return gulp.src('batch/ol-webpack/main.js')
        .pipe(webpack({
            output: {
                filename: 'ol-sitna.js',
                library: 'ol'
            },
            mode: 'development'
        }))
        .pipe(gulp.dest('lib/ol/build'));
};

function bundleOLRelease () {
    return gulp.src('batch/ol-webpack/main.js')
        .pipe(webpack({
            output: {
                filename: 'ol-sitna.min.js',
                library: 'ol'
            },
            mode: 'production'
        }))
        .pipe(gulp.dest('lib/ol/build'));
};

function clean (cb) {
    del([
        sitnaBuild.targetPath + '**',
        '!' + sitnaBuild.targetPath
    ], cb);
};

function unitTests (cb) {
    const reportDir = 'test/unit/testResults';
    del(reportDir + '/**/*', function () {
        //var browserStream = mochaPhantomJS({
        //    reporter: 'spec',
        //    dump: reportDir + '/browserTestResults.txt'
        //})
        //browserStream.write({ path: 'http://localhost:56187/test/unit/browser/runner.html' });
        //browserStream.end();

        gulp.src(['test/unit/node/**/*.js'], { read: false })
            .pipe(mocha({
                reporter: 'mochawesome',
                reporterOptions: 'reportDir=' + reportDir + ',reportFilename=nodeTestResults'
            }));
        cb();
    });
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

function doc (cb) {
    var buildDir = 'build';
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
    }
    execSync('yuidoc -c ./batch/yuidoc.json --theme sitna --themedir ./batch/yuidoc-theme/sitna --outdir build/doc --exclude tcmap.js,build,examples,lib,test,TC .');
    cb();
};

function bundleCesiumDebugMergeTerrain () {
    return gulp.src(['lib/cesium/debug/CesiumSrc.js', 'TC/cesium/mergeTerrainProvider/MergeTerrainProvider.js'])
        .pipe(concat('Cesium.js'))
        .pipe(gulp.dest('lib/cesium/debug'));
};

function bundleCesiumReleaseMergeTerrain () {
    gulp.src(['TC/cesium/mergeTerrainProvider/MergeTerrainProvider.js'])
        .pipe(minify({
            compress: { sequences: false },
            output: { ascii_only: true }
        }))
        .pipe(gulp.dest('TC/cesium/mergeTerrainProvider'));

    return gulp.src(['lib/cesium/release/CesiumSrc.js', 'TC/cesium/mergeTerrainProvider/MergeTerrainProvider-min.js'])
        .pipe(concat('Cesium.js'))
        .pipe(gulp.dest('lib/cesium/release'));
};

exports.clean = clean;
exports.unitTests = unitTests;
exports.e2eTests = e2eTests;
exports.doc = doc;
exports.bundleCesiumDebugMergeTerrain = bundleCesiumDebugMergeTerrain;
exports.bundleCesiumReleaseMergeTerrain = bundleCesiumReleaseMergeTerrain;
exports.noTests = gulp.series(
        clean,
        bundleOLDebug,
        bundleOLRelease,
        jsonValidate,
        gulp.parallel(
            doc,
            resources,
            zipLayout,
            baseCss,
            layoutCss,
            examples,
            gulp.series(
                bundle,
                minifyBundle
            )
        )
);
exports.default = gulp.series(
    clean,
    bundleOLDebug,
    bundleOLRelease,
    jsonValidate,
    unitTests,
    //e2eTests,
    gulp.parallel(
        doc,
        resources,
        zipLayout,
        baseCss,
        layoutCss,
        examples,
        gulp.series(
            bundle,
            minifyBundle
        )
    )
);
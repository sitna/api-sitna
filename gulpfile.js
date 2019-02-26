var gulp = require('gulp'),
    del = require('del'),
    //jshint = require('gulp-jshint'),
    replace = require('gulp-replace'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    convertEncoding = require('gulp-convert-encoding'),
    minify = require('gulp-minify'),
    cleanCSS = require('gulp-clean-css'),
    dust = require('gulp-dust'),
    zip = require('gulp-zip'),
    jsonlint = require("gulp-jsonlint"),
    mocha = require('gulp-mocha'),
    mochaPhantomJS = require('gulp-mocha-phantomjs'),
    casperJs = require('gulp-casperjs'),
    merge = require('merge-stream'),
    exec = require('gulp-exec'),
    header = require('gulp-header'),
    sourcemaps = require('gulp-sourcemaps'),
    fs = require('fs');
var execSync = require('child_process').execSync;


////////// Gestión de errores ////////
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');

var gulp_src = gulp.src;
gulp.src = function () {
    return gulp_src.apply(gulp, arguments)
        .pipe(plumber(function (error) {
            // Output an error message
            gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message));
            // emit the end event, to properly end the task
            this.emit('end');
        })
        );
};
////////////////////////////////


var sitnaBuild = {
    version: '1.3.0',
    targetPath: 'build/',
    tcmapTargetName: 'tcmap',
    sitnaTargetName: 'sitna',
    preSrc: [
        'lib/Modernizr.js',
        'lib/dust/dust-full-helpers.min.js',
        'lib/dust/dustjs-i18n.min.js',
        'lib/dust/dust.overrides.js',
        'lib/localForage/localforage.min.js',
        'lib/jsnlog/jsnlog.min.js'
    ],
    midSrc: [
        'lib/jQuery/jquery.xdomainrequest.min.js',
        'lib/jQuery/autocomplete.js',
        'lib/jQuery/jquery.event.drag.js',
        'lib/jQuery/jquery.event.drop.js',
        'lib/jQuery/jquery-watch.min.js',
        'lib/qrcode/qrcode.min.js',
        'lib/jsonpack/jsonpack.min.js',
        'lib/ua-parser/ua-parser.min.js',
        'TC/Map.js',
        'TC/Util.js',
        'tcmap.js',
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
        'TC/control/TabContainer.js',
        'TC/ol/**/*.js',
        'TC/control/**/*.js',
        'TC/layer/**/*.js',
        'TC/Geometry.js'
    ],
    postSrc: [
    ],
    sitnaSrc: [
        'sitna.js'
    ],

    replaceStrings: function (stream) {
        var s = stream;
        //.pipe(replace("á", "\\u00e1"))
        //.pipe(replace("é", "\\u00e9"))
        //.pipe(replace("í", "\\u00ed"))
        //.pipe(replace("ó", "\\u00f3"))
        //.pipe(replace("ú", "\\u00fa"))
        //.pipe(replace("Á", "\\u00c1"))
        //.pipe(replace("É", "\\u00c9"))
        //.pipe(replace("Í", "\\u00cd"))
        //.pipe(replace("Ó", "\\u00d3"))
        //.pipe(replace("Ú", "\\u00da"))
        //.pipe(replace("Ñ", "\\u00d1"))
        //.pipe(replace("ñ", "\\u00f1"))
        //.pipe(replace("ü", "\\u00fc"))
        //.pipe(replace("Ü", "\\u00dc"));
        if (this.isLegacy !== undefined) {
            s = s.pipe(replace(/TC\.isLegacy = .*;/g, "TC.isLegacy = " + this.isLegacy + ";"));
        }
        return s;
    },

    unsetDebug: function (stream) {
        return stream.pipe(replace("TC.isDebug = true;", "TC.isDebug = false;"));
    },

    examplesTask: function () {
        return gulp.src([
            'examples/**/*.html'
        ])
            .pipe(header('\ufeff')) // Repone el BOM que gulp quita
            //.pipe(convertEncoding({ to: 'ISO-8859-1' }))
            .pipe(gulp.dest(this.targetPath + 'examples/'));
    },

    cssTask: function () {
        gulp.src([
            'TC/**/style.css'
        ])
            .pipe(gulp.dest(this.targetPath + 'TC/'));
        return gulp.src([
            'TC/**/*.css',
            '!TC/css/control/**/*',
            '!TC/**/style.css'
        ])
            .pipe(cleanCSS({
                level: 0
            }))
            .pipe(gulp.dest(this.targetPath + 'TC/'));
    },

    jsonValidateTask: function () {
        return gulp.src("TC/**/*.json")
            .pipe(jsonlint())
            .pipe(jsonlint.reporter())
            .pipe(jsonlint.failOnError());
    },

    resourcesTask: function () {
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
            .pipe(gulp.dest(this.targetPath));
    },

    zipTask: function () {
        return gulp.src([
            'TC/layout/responsive/**/*'
        ])
            .pipe(zip('responsive.zip'))
            .pipe(gulp.dest(this.targetPath + 'TC/layout/responsive/'));
    },

    compiledTask: function (depSrc1, depSrc2, depSrc3) {
        var src = sitnaBuild.preSrc.concat(depSrc1, sitnaBuild.midSrc, depSrc2, sitnaBuild.postSrc);
        var targetName;
        if (depSrc3) {
            targetName = this.sitnaTargetName;
            src = src.concat(depSrc3);
        }
        else {
            targetName = this.tcmapTargetName;
        }
        var stream = gulp.src(src)
            .pipe(sourcemaps.init())
            .pipe(header('\ufeff')); // Repone el BOM que gulp quita
        stream = sitnaBuild.replaceStrings(stream)
            //.pipe(jshint())
            //.pipe(jshint.reporter('default'))
            .pipe(concat(targetName))
            .pipe(rename(targetName + '.' + this.maps + '.debug.js'))
            .pipe(gulp.dest(this.targetPath));
        return sitnaBuild.unsetDebug(stream)
            .pipe(minify({
                ext: {
                    min: [/(.*)\.debug\.js$/, '$1.min.js']
                },
                noSource: true,
                compress: { sequences: false },
                output: { ascii_only: true }
            })) // sequences = false para evitar error "Maximum call stack size exceeded"
            //.pipe(rename(targetName + '.' + this.maps + '.min.js'))
            .pipe(sourcemaps.write('./maps'))
            .pipe(gulp.dest(this.targetPath));
    },

    onDemandTask: function (src, dest) {
        var stream = gulp.src(src)
            .pipe(sourcemaps.init())
            .pipe(header('\ufeff')); // Repone el BOM que gulp quita
        stream = sitnaBuild.replaceStrings(stream)
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
            //.pipe(rename({ extname: '.min.js' }))
            .pipe(sourcemaps.write('./maps'))
            .pipe(gulp.dest(dest));
    },

    fullTask: function () {
        var ol2Src1 = [
            'lib/OpenLayers/OpenLayers.sitna.debug.js',
            'lib/proj4js/legacy/proj4js-combined.js',
            'lib/proj4js/legacy/defs/EPSG25830.js',
            'lib/proj4js/legacy/projCode/utm.js',
            'lib/proj4js/projCode/tmerc.js',
            'lib/jquery/jquery.1.10.2.js'
        ];
        var ol2Src2 = [
            '!TC/ol/ol.js',
            '!TC/workers/**/*'
        ];
        var olSrc1 = [
            'lib/ol/build/ol-debug.js',
            'lib/proj4js/proj4.js',
            'lib/jquery/jquery.2.1.3.js'
        ];
        var olSrc2 = [
            '!TC/ol/ol2.js',
            '!TC/workers/**/*'
        ];

        sitnaBuild.jsonValidateTask();
        sitnaBuild.resourcesTask();
        sitnaBuild.zipTask();
        sitnaBuild.cssTask();
        sitnaBuild.examplesTask();

        sitnaBuild.maps = '';
        sitnaBuild.onDemandTask(['sitna.js'], sitnaBuild.targetPath);
        sitnaBuild.onDemandTask(['tcmap.js'], sitnaBuild.targetPath);
        sitnaBuild.onDemandTask(['TC/**/*.js'], sitnaBuild.targetPath + 'TC/');

        sitnaBuild.maps = 'ol2';
        sitnaBuild.isLegacy = true;
        sitnaBuild.compiledTask(ol2Src1, ol2Src2, sitnaBuild.sitnaSrc);

        sitnaBuild.maps = 'ol';
        sitnaBuild.isLegacy = false;
        sitnaBuild.compiledTask(olSrc1, olSrc2, sitnaBuild.sitnaSrc);
    }
};

gulp.task('default', ['unitTests', 'e2eTests', 'doc'], function () {
    sitnaBuild.fullTask();
});

gulp.task('noTests', function () {
    sitnaBuild.fullTask();
});

gulp.task('minifyOL', function () {
    return gulp.src([
        'lib/ol/build/ol-custom.js'
    ])
        .pipe(minify({
            compress: { sequences: false },
            output: { ascii_only: true }
        }))
        .pipe(rename('ol-min.js'))
        .pipe(gulp.dest('lib/ol/build/'));
});

gulp.task('clean', function (cb) {
    del([
        sitnaBuild.targetPath + '**',
        '!' + sitnaBuild.targetPath
    ], cb);
});

gulp.task('unitTests', function () {
    const reportDir = 'test/unit/testResults';
    return del(reportDir + '/**/*', function () {
        var browserStream = mochaPhantomJS({
            reporter: 'spec',
            dump: reportDir + '/browserTestResults.txt'
        })
        browserStream.write({ path: 'http://localhost:56187/test/unit/browser/runner.html' });
        browserStream.end();

        return merge(
            gulp.src(['test/unit/node/**/*.js'], { read: false })
                .pipe(mocha({
                    reporter: 'mochawesome',
                    reporterOptions: 'reportDir=' + reportDir + ',reportFilename=nodeTestResults'
                })),
            browserStream
        );
    });
});

gulp.task('e2eTests', function () {
    return gulp.src('test/endToEnd/test.js').pipe(casperJs());
});

gulp.task('rasterJSTest', function () {
    const reportDir = 'test/unit/testResults';

    //return gulp.src(['test/unit/browser/layer/Raster.js'], { read: false })
    //            .pipe(mocha({
    //                reporter: 'mochawesome',
    //                reporterOptions: 'reportDir=' + reportDir + ',reportFilename=nodeTestResults'
    //            }));
    return del(reportDir + '/**/*', function () {
        var browserStream = mochaPhantomJS({
            reporter: 'spec',
            dump: reportDir + '/browserTestResults.txt'
        })
        browserStream.write({ path: 'http://localhost:56187/test/unit/browser/runner.html' });
        browserStream.end();

        return browserStream;

    });
});

gulp.task('doc', function () {
    var buildDir = 'build';
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
    }
    execSync('yuidoc -c ./batch/yuidoc.json --theme sitna --themedir ./batch/yuidoc-theme/sitna --outdir build/doc --exclude tcmap.js,build,examples,lib,test,TC .');
});

gulp.task('css', function () {
    sitnaBuild.cssTask();
});

gulp.task('bundleCesiumDebugMergeTerrain', function () {
    return gulp.src(['lib/cesium/debug/CesiumSrc.js', 'TC/cesium/mergeTerrainProvider/MergeTerrainProvider.js'])
        .pipe(concat('Cesium.js'))
        .pipe(gulp.dest('lib/cesium/debug'));
});

gulp.task('bundleCesiumReleaseMergeTerrain', function () {
    gulp.src(['TC/cesium/mergeTerrainProvider/MergeTerrainProvider.js'])
        .pipe(minify({
            compress: { sequences: false },
            output: { ascii_only: true }
        }))
        .pipe(gulp.dest('TC/cesium/mergeTerrainProvider'));

    return gulp.src(['lib/cesium/release/CesiumSrc.js', 'TC/cesium/mergeTerrainProvider/MergeTerrainProvider-min.js'])
        .pipe(concat('Cesium.js'))
        .pipe(gulp.dest('lib/cesium/release'));
});
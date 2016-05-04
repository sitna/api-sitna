var gulp = require('gulp'),
    del = require('del'),
  //jshint = require('gulp-jshint'),
  replace = require('gulp-replace'),
  rename = require('gulp-rename'),
  concat = require('gulp-concat'),
  convertEncoding = require('gulp-convert-encoding'),
  uglify = require('gulp-uglify'),
  dust = require('gulp-dust');

//////// Gestión de errores ////////
//var plumber = require('gulp-plumber');
//var gutil = require('gulp-util');

//var gulp_src = gulp.src;
//gulp.src = function () {
//    return gulp_src.apply(gulp, arguments)
//      .pipe(plumber(function (error) {
//          // Output an error message
//          gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message));
//          // emit the end event, to properly end the task
//          this.emit('end');
//      })
//    );
//};
//////////////////////////////

var sitnaBuild = {
    version: '1.1.2',
    targetPath: 'build/',
    tcmapTargetName: 'tcmap',
    sitnaTargetName: 'sitna',
    preSrc: [
        'lib/Modernizr.js',
        'lib/dust/dust-full-helpers.min.js',
        'lib/dust/dustjs-i18n.min.js'
    ],
    midSrc: [
        'lib/jquery/jquery.xdomainrequest.min.js',
        'lib/jquery/autocomplete.js',
        'lib/jquery/jquery.event.drag.js',
        'lib/jquery/jquery.event.drop.js',
        'lib/qrcode/qrcode.min.js',
        'TC/Map.js',
        'TC/Util.js',
        'tcmap.js',
        'TC/Layer.js',
        'TC/Control.js',
        'TC/Feature.js',
        'TC/feature/Point.js',
        'TC/feature/**/*.js',
        'TC/control/MapContents.js',
        'TC/control/TOC.js',
        'TC/control/Click.js',
        'TC/control/FeatureInfoCommons.js',
        'TC/control/Scale.js',
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
        var s = stream
            .pipe(replace("á", "\\u00e1"))
            .pipe(replace("é", "\\u00e9"))
            .pipe(replace("í", "\\u00ed"))
            .pipe(replace("ó", "\\u00f3"))
            .pipe(replace("ú", "\\u00fa"))
            .pipe(replace("Á", "\\u00c1"))
            .pipe(replace("É", "\\u00c9"))
            .pipe(replace("Í", "\\u00cd"))
            .pipe(replace("Ó", "\\u00d3"))
            .pipe(replace("Ú", "\\u00da"))
            .pipe(replace("Ñ", "\\u00d1"))
            .pipe(replace("ñ", "\\u00f1"))
            .pipe(replace("ü", "\\u00fc"))
            .pipe(replace("Ü", "\\u00dc"))
            .pipe(replace(/TC\.version = '.*';/g, "TC.version = '" + this.version + (sitnaBuild.target === 'PRO' ? '' : 'b') + "';"))
            .pipe(replace(/TC\.apiLocation = '.*';/g, "TC.apiLocation = '" + this.apiLocation + "';"))
            .pipe(replace(/SITNA\.syncLoadJS\('.*tcmap.js'\);/, "SITNA.syncLoadJS('" + this.apiLocation + "tcmap.js');"));
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
            .pipe(replace("<script src=\"//sitna.tracasa.es/api/\"></script>", '<script src="' + this.apiLocation + '"></script>'))
            .pipe(convertEncoding({ to: 'ISO-8859-1' }))
            .pipe(gulp.dest(this.fullTargetPath + 'examples/'));
    },

    roadmapTask: function () {
        return gulp.src([
                'batch/roadmap.html'
        ])
            .pipe(gulp.dest(this.fullTargetPath + 'doc/'));
    },

    resourcesTask: function () {
        return gulp.src([
                '**/*',
                '!App_Start/**/*',
                '!batch/**/*',
                '!build/**/*',
                '!examples/**/*',
                '!kml/**/*',
                '!node_modules/**/*',
                '!obj/**/*',
                '!Properties/**/*',
                '!pruebas/**/*',
                '!TC/**/*.js',
                '!test/**/*',
                '!**/*.cs',
                '!*'
        ])
            .pipe(gulp.dest(this.fullTargetPath));
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
        var stream = gulp.src(src);
        stream = sitnaBuild.replaceStrings(stream)
            //.pipe(jshint())
            //.pipe(jshint.reporter('default'))
            .pipe(concat(targetName))
            .pipe(rename(targetName + '.' + this.maps + '.debug.js'))
            .pipe(gulp.dest(this.fullTargetPath));
        return sitnaBuild.unsetDebug(stream)
            .pipe(uglify({ compress: { sequences: false }, output: { ascii_only: true } })) // sequences = false para evitar error "Maximum call stack size exceeded"
            .pipe(rename(targetName + '.' + this.maps + '.min.js'))
            .pipe(gulp.dest(this.fullTargetPath));
    },

    onDemandTask: function (src, dest) {
        var stream = gulp.src(src);
        stream = sitnaBuild.replaceStrings(stream)
            .pipe(gulp.dest(dest));
        return sitnaBuild.unsetDebug(stream)
            .pipe(uglify())
            .pipe(rename({ extname: '.min.js' }))
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
            '!TC/ol/ol3.js'
        ];
        var ol3Src1 = [
            'lib/ol/build/ol-debug.js',
            'lib/proj4js/proj4.js',
            'lib/jquery/jquery.2.1.3.js'
        ];
        var ol3Src2 = [
            '!TC/ol/ol2.js'
        ];

        sitnaBuild.resourcesTask();
        sitnaBuild.examplesTask();
        sitnaBuild.roadmapTask();

        sitnaBuild.maps = '';
        sitnaBuild.onDemandTask(['sitna.js'], sitnaBuild.fullTargetPath);
        sitnaBuild.onDemandTask(['tcmap.js'], sitnaBuild.fullTargetPath);
        sitnaBuild.onDemandTask(['TC/**/*.js'], sitnaBuild.fullTargetPath + 'TC/');

        sitnaBuild.maps = 'ol2';
        sitnaBuild.isLegacy = true;
        sitnaBuild.compiledTask(ol2Src1, ol2Src2, sitnaBuild.sitnaSrc);

        sitnaBuild.maps = 'ol3';
        sitnaBuild.isLegacy = false;
        sitnaBuild.compiledTask(ol3Src1, ol3Src2, sitnaBuild.sitnaSrc);
    }
};

gulp.task('default', function () {

    //sitnaBuild.target = 'PRE';
    //sitnaBuild.apiLocation = '//pmpwvinet18.tcsa.local/apisitna/js/lib/build/PRE/';
    //sitnaBuild.fullTargetPath = sitnaBuild.targetPath + sitnaBuild.target + '/';
    //sitnaBuild.fullTask();

    //sitnaBuild.target = 'PRO';
    //sitnaBuild.apiLocation = '//sitna.tracasa.es/api/';
    //sitnaBuild.fullTargetPath = sitnaBuild.targetPath + sitnaBuild.target + '/';
    //sitnaBuild.fullTask();

    sitnaBuild.target = 'DEV';
    sitnaBuild.apiLocation = '//sitna.tracasa.es/api/dev/';
    sitnaBuild.fullTargetPath = sitnaBuild.targetPath + sitnaBuild.target + '/';
    sitnaBuild.fullTask();
});

gulp.task('PRE', function () {

    sitnaBuild.target = 'PRE';
    sitnaBuild.apiLocation = '//pmpwvinet18.tcsa.local/apisitna/js/lib/build/PRE/';
    sitnaBuild.fullTargetPath = sitnaBuild.targetPath + sitnaBuild.target + '/';
    sitnaBuild.fullTask();
});

gulp.task('DEV', function () {

    sitnaBuild.target = 'DEV';
    sitnaBuild.apiLocation = '//sitna.tracasa.es/api/dev/';
    sitnaBuild.fullTargetPath = sitnaBuild.targetPath + sitnaBuild.target + '/';
    sitnaBuild.fullTask();
});

gulp.task('PRO', function () {

    sitnaBuild.target = 'PRO';
    sitnaBuild.apiLocation = '//sitna.tracasa.es/api/';
    sitnaBuild.fullTargetPath = sitnaBuild.targetPath + sitnaBuild.target + '/';
    sitnaBuild.fullTask();
});

gulp.task('uglifyOL', function () {
    return gulp.src([
        'lib/ol/build/ol-custom.js'
    ])
        .pipe(uglify({ compress: { sequences: false }, output: { ascii_only: true } }))
        .pipe(rename('ol-min.js'))
        .pipe(gulp.dest('lib/ol/build/'));
});

gulp.task('clean', function (cb) {
    del([
      sitnaBuild.targetPath + '**'
    ], cb);
});

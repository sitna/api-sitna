var gulp = require('gulp'),
    del = require('del'),
    eslint = require('gulp-eslint-new'),
    //convertEncoding = require('gulp-convert-encoding'),
    minify = require('gulp-minify'),
    cleanCSS = require('gulp-clean-css'),
    JSZip = require('jszip'),
    jsonlint = require("gulp-jsonlint"),
    mochaChrome = require('gulp-mocha-chrome'),
    casperJs = require('gulp-casperjs'),
    filter = require('gulp-filter'),
    webpack = require('webpack'),
    WebpackDevServer = require('webpack-dev-server'),
    ncp = require('ncp'),
    fs = require('fs'),
    fse = require('fs-extra'),
    os = require('os'),
    precompiledTemplates = require('./webpack/precompiledTemplates'),
    { exec, spawn } = require('child_process'),
    path = require('path');

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
    targetPath: 'dist/'
};

function timestamp(cb) {
    fs.mkdir(sitnaBuild.targetPath, () => {
        fs.writeFile(sitnaBuild.targetPath + 'timestamp.txt', (new Date()).toLocaleString() + os.EOL + os.userInfo().username, cb);
    });
}

function buildCsprojFilter(cb) {
    fs.readFile('./API.csproj', 'utf8', (err, data) => {
        if (err) throw err;
        sitnaBuild.projectFiles = data
            .split('\n')
            .filter(l => l.includes('<Content '))
            .map(l => l.match(/Include="(.+)"/)[1])
            .map(l => l.replace(/\\/g, '/'));
        cb();
    });
}

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
    copyDir('node_modules/@sitna/shpjs/dist/', 'lib/shpjs/');
    copyDir('node_modules/wkx/dist/', 'lib/wkx/');

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
}

sitnaBuild.templateFunctions = precompiledTemplates;

const spawnProcess = function (cmd, args, cb) {
    const ls = spawn(path.resolve('./node_modules/.bin/' + cmd), args);
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
    spawnProcess('webpack.cmd', ['--config', './webpack/webpack.config.js', '--output-path', './dist'], cb);
}

function webpackApiDebug(cb) {
    spawnProcess('webpack.cmd', ['--config', './webpack/webpack.config.debug.js', '--output-path', './dist'], cb);
}

function bundleCesiumDebug(cb) {
    sitnaBuild.projectFiles.push('lib/cesium/build/cesium-sitna.js');
    spawnProcess('webpack.cmd', ['--config', './webpack/cesium.webpack.config.debug.js'], cb);
}

function bundleCesiumRelease(cb) {
    sitnaBuild.projectFiles.push('lib/cesium/build/cesium-sitna.min.js');
    spawnProcess('webpack.cmd', ['--config', './webpack/cesium.webpack.config.js'], cb);
}

function npmUpdate(cb) {
    exec('npm update', {}, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            cb();
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        cb();
    });
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
        '!examples/tc-cb-service-worker.js',
        '!kml/**/*',
        '!images/**/*',
        '!screenshots/**/*',
        '!node_modules/**/*',
        '!obj/**/*',
        '!Properties/**/*',
        '!pruebas/**/*',
        '!TC/**/*.js',
        '!SITNA/**/*.js',
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
}

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
}

function examples() {
    return gulp.src([
        'examples/**/*.html',
        'examples/**/*.appcache'
    ], { removeBOM: false })
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'examples/'));
}

function exampleSW() {
    return gulp.src([
        'TC/workers/tc-cb-service-worker.js'
    ])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'examples/'));
}

function zipLayout(cb) {
    const zip = new JSZip();
    const addFile = function (fileName) {
        const file = fs.readFileSync('TC/layout/responsive/' + fileName);
        zip.file(fileName, file);
    };
    const addDir = function (dirName) {
        const files = fs.readdirSync('TC/layout/responsive/' + dirName);
        for (var i = 0, ii = files.length; i < ii; i++) {
            addFile(dirName + '/' + files[i]);
        }
    };
    addFile('config.json');
    addFile('markup.html');
    addFile('markup.html');
    addFile('script.js');
    addFile('style.css');
    addDir('fonts');
    addDir('img');
    addDir('resources');
    zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }).then(buffer => {
        fs.writeFile(sitnaBuild.targetPath + 'TC/layout/responsive/responsive.zip', buffer, cb);
    });
}

function copyLayout() {
    return gulp.src([
        sitnaBuild.targetPath + 'TC/layout/responsive/**/*'
    ])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'layout/responsive/'));
}

function baseCss() {
    return gulp.src([
        'TC/**/*.css',
        '!TC/css/control/**/*',
        '!TC/**/style.css'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(cleanCSS({
            level: 0/*,
            format: {
                breaks: {
                    afterBlockBegins: true,
                    afterRuleEnds: true
                }
            }*/
        }))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'TC/'));
}

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
            level: 0/*,
            format: {
                breaks: {
                    afterBlockBegins: true,
                    afterRuleEnds: true
                }
            }*/
        }))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'TC/'));
}

function jsonValidate() {
    return gulp.src("TC/**/*.json")
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(jsonlint())
        .pipe(jsonlint.reporter())
        .pipe(jsonlint.failOnError());
}

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

function clean (cb) {
    del([
        sitnaBuild.targetPath + '**/*',
        '!' + sitnaBuild.targetPath
    ], cb);
}

function unitTests() {
    console.log('Version: ' + process.version);
    return gulp
        .src('test/unit/browser/runner.html')
        .pipe(mochaChrome({ ignoreExceptions: true }));
}

function e2eTests () {
    return gulp.src('test/endToEnd/test.js').pipe(casperJs());
}

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


function docsite(cb) {
    spawnProcess('jsdoc.cmd', ['-c', './batch/jsdoc/conf.json'], cb);
}

function docfiles() {
    return gulp.src(['./batch/jsdoc/img/*'])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'doc/img'));    
}

function docCSS() {
    return gulp.src(['./batch/jsdoc/css/*'])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'doc/css'));
}

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
    zipLayout,
    layoutCss,
    examples,
    exampleSW
);

const noTests = gulp.series(
    clean,
    //timestamp,
    buildCsprojFilter,
    //compileTemplates,    
    //bundleOLDebug,
    //bundleOLRelease,    
    jsonValidate,
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
exports.copyResources = gulp.series(
    buildCsprojFilter,
    resources
);
exports.updateDependencies = npmUpdate;
exports.noTests = noTests;
exports.default = gulp.series(
    noTests,
    //e2eTests,
    unitTests
);
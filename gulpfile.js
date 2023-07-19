/// <binding ProjectOpened='startDevServer' />
var gulp = require('gulp'),
    del = require('del'),
    eslint = require('gulp-eslint-new'),
    //convertEncoding = require('gulp-convert-encoding'),
    minify = require('gulp-minify'),
    CleanCSS = require('clean-css'),
    JSZip = require('jszip'),
    jsonlint = require("gulp-jsonlint"),
    casperJs = require('gulp-casperjs'),
    filter = require('gulp-filter'),
    webpack = require('webpack'),
    WebpackDevServer = require('webpack-dev-server'),
    fs = require('fs'),
    fse = require('fs-extra'),
    os = require('os'),
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
    targetPath: 'dist/',
    targetUrl: 'https://sitna.navarra.es/api/dev'
};

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

const walk = function (dir, done) {
    let results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var i = 0;
        (function next() {
            let file = list[i++];
            if (!file) return done(null, results);
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
};

function copyOnlineLibraries(cb) {
    const currentDir = path.resolve('.');

    const copyDirSyncRecursive = function (src, dest, callback) {
        try {
            fse.copySync(src, dest);
            walk(src, function (err, list) {
                if (err) {
                    console.error(err);
                }
                else {
                    sitnaBuild.projectFiles = sitnaBuild.projectFiles
                        .concat(list.map(r => '.' + r.replace(currentDir, '').replace(/\\/g, '/')));
                    if (callback) {
                        callback();
                    }
                }
            });
        } catch (err) {
            console.error(err);
        }
    };

    copyDirSyncRecursive('node_modules/cesium/Build/Cesium/Workers', sitnaBuild.targetPath + 'lib/cesium/build/Workers', () => {
        copyDirSyncRecursive('node_modules/cesium/Build/Cesium/ThirdParty', sitnaBuild.targetPath + 'lib/cesium/build/ThirdParty', () => {
            copyDirSyncRecursive('node_modules/cesium/Build/Cesium/Assets', sitnaBuild.targetPath + 'lib/cesium/build/Assets', () => {
                copyDirSyncRecursive('node_modules/cesium/Build/Cesium/Widgets', sitnaBuild.targetPath + 'lib/cesium/build/Widgets', cb);
            });
        });
    });
}

//function copyOfflineLibraries(cb) {
//    fs.mkdirSync(sitnaBuild.targetPath + 'lib/wkx', { recursive: true });
//    fs.copyFile('node_modules/wkx/dist/wkx.min.js', sitnaBuild.targetPath + 'lib/wkx/wkx.min.js', cb);
//}

const spawnProcess = function (cmd, args, cb) {
    const ls = spawn(path.resolve('./node_modules/.bin/' + cmd), args);
    ls.stdout.on('data', data => console.log(`stdout: ${data}`));
    ls.stderr.on('data', data => {
        throw data;
    });
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

//function bundleCesiumDebug(cb) {
//    sitnaBuild.projectFiles.push('lib/cesium/build/cesium-sitna.js');
//    spawnProcess('webpack.cmd', ['--config', './webpack/cesium.webpack.config.debug.js'], cb);
//}

//function bundleCesiumRelease(cb) {
//    sitnaBuild.projectFiles.push('lib/cesium/build/cesium-sitna.min.js');
//    spawnProcess('webpack.cmd', ['--config', './webpack/cesium.webpack.config.js'], cb);
//}

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
        '!TC/**/*.js',
        '!SITNA/**/*.js',
        '!TC/templates/**/*',
        '!workers/**/*.js',
        '!webpack/**/*.js',
        '!lib/**/*.js',
        '!lib/ol/**/*',
        '!css/**/*.css',
        '!css/compiler.js',
        '!test/**/*',
        '!**/*.cs',
        '!*',
        '!bin/*'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(sitnaBuild.targetPath));
}

function offlineScripts(cb) {
    let target = sitnaBuild.targetPath + 'TC/config/';
    gulp.src([
        'TC/config/*.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target));

    target = sitnaBuild.targetPath + 'layout/';
    gulp.src([
        'layout/**/*.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target));

    target = sitnaBuild.targetPath + 'lib/';
    gulp.src([
        'lib/**/*.min.js',
        '!lib/ol/**/*.js',
        '!lib/geopackagejs/**/*.js',
        '!lib/handlebars/helpers.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target));
    cb();
}

function onlineScripts() {
    const minifyConfig = {
        ext: {
            min: '.min.js'
        },
        noSource: true,
        compress: { sequences: false },
        output: { ascii_only: true }
    };

    let target = sitnaBuild.targetPath + 'TC/cesium/';
    gulp.src([
        'TC/cesium/**/*.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target))
        .pipe(minify(minifyConfig))
        .pipe(gulp.dest(target));

    target = sitnaBuild.targetPath + 'lib/';
    gulp.src([
        'lib/**/*.js',
        '!lib/**/*.min.js',
        '!lib/ol/**/*.js',
        '!lib/handlebars/helpers.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(target));

    return gulp.src([
        'workers/*-service-worker.js'
    ])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(gulp.dest(sitnaBuild.targetPath + 'workers/'));
}

function compileTemplates(cb) {
    require('./TC/templates/compiler.js');
    cb();
}

function encapsulateWebWorkers(cb) {
    require('./workers/module-creator.js');
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
        'workers/tc-cb-service-worker.js'
    ])
        .pipe(gulp.dest(sitnaBuild.targetPath + 'examples/'));
}

function zipLayout(cb) {
    const zip = new JSZip();
    const addFile = function (fileName) {
        const file = fs.readFileSync('layout/responsive/' + fileName);
        zip.file(fileName, file);
    };
    const addDir = function (dirName) {
        const files = fs.readdirSync('layout/responsive/' + dirName);
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
        fs.writeFile(sitnaBuild.targetPath + 'layout/responsive/responsive.zip', buffer, cb);
    });
}

function copyLegacyCss(cb) { // compatibilidad hacia atrás
    fs.mkdirSync(sitnaBuild.targetPath + 'TC/css', { recursive: true });
    fs.copyFileSync(sitnaBuild.targetPath + 'css/bootstrap-adapter.css', sitnaBuild.targetPath + 'TC/css/bootstrap-adapter.css');
    fs.copyFile('css/sitna.css', sitnaBuild.targetPath + 'TC/css/tcmap.css', cb);
}

function copyLegacyLayout(cb) { // compatibilidad hacia atrás
    try {
        fse.copySync(sitnaBuild.targetPath + 'layout/responsive', sitnaBuild.targetPath + 'TC/layout/responsive');
    } catch (err) {
        console.error(err);
    }
    cb();
}

function copyLegacyStyleAssets(cb) { // compatibilidad hacia atrás
    try {
        fse.copySync(sitnaBuild.targetPath + 'css/fonts', sitnaBuild.targetPath + 'TC/css/fonts');
        fse.copySync(sitnaBuild.targetPath + 'css/img', sitnaBuild.targetPath + 'TC/css/img');
    } catch (err) {
        console.error(err);
    }
    cb();
}

function baseCss(cb) {
    require('./css/compiler.js');

    fs.mkdirSync(sitnaBuild.targetPath + 'css', { recursive: true });
    fs.copyFile('css/sitna.css', sitnaBuild.targetPath + 'css/sitna.css', cb);
}

function cleanCss(file, cb) {
    const output = new CleanCSS({
        level: 0/*,
    format: {
        breaks: {
            afterBlockBegins: true,
            afterRuleEnds: true
        }
    }*/
    }).minify([file]);
    fs.writeFile(sitnaBuild.targetPath + file, output.styles, cb);
}

function adapterCss(cb) {
    cleanCss('css/bootstrap-adapter.css', cb);
}

function printCss(cb) {
    cleanCss('css/print.css', cb);
}

async function componentCss(cb) {
    fs.readdir('css/ui', (err, files) => {
        if (err) {
            console.error(err);
        }
        else {
            fs.mkdirSync(sitnaBuild.targetPath + 'css/ui', { recursive: true });
            const cleaner = new CleanCSS({
                level: 0/*,
    format: {
        breaks: {
            afterBlockBegins: true,
            afterRuleEnds: true
        }
    }*/
            });
            files.forEach(f => {
                const output = cleaner.minify(['css/ui/' + f]);
                fs.writeFileSync(sitnaBuild.targetPath + 'css/ui/' + f, output.styles);
            });
            cb();
        }
    });
}

function layoutCss(cb) {
    const dirs = fs.readdirSync('layout', { withFileTypes: true });
    const cleaner = new CleanCSS({
        level: 0/*,
    format: {
        breaks: {
            afterBlockBegins: true,
            afterRuleEnds: true
        }
    }*/
    });
    dirs.forEach(dir => {
        if (dir.isDirectory()) {
            fs.mkdirSync(sitnaBuild.targetPath + 'layout/' + dir.name, { recursive: true });
            const path = 'layout/' + dir.name + '/style.css';
            if (fs.existsSync(path)) {
                const output = cleaner.minify([path]);
                fs.writeFileSync(sitnaBuild.targetPath + path, output.styles);
            }
        }
    });
    cb();
}

function jsonValidate() {
    return gulp.src(['TC/**/*.json', 'layout/**/*.json', 'resources/**/*.json', 'config/**/*.json'])
        .pipe(filter(sitnaBuild.projectFiles))
        .pipe(jsonlint())
        .pipe(jsonlint.reporter())
        .pipe(jsonlint.failOnError());
}

function textsValidate(cb) {
    const es = JSON.parse(fs.readFileSync('resources/es-ES.json', { encoding: 'utf8' }));
    const eu = JSON.parse(fs.readFileSync('resources/eu-ES.json', { encoding: 'utf8' }));
    const en = JSON.parse(fs.readFileSync('resources/en-US.json', { encoding: 'utf8' }));
    for (var esKey in es) {
        if (!Object.prototype.hasOwnProperty.call(eu, esKey)) {
            throw 'eu-ES no tiene la clave ' + esKey;
        }
        if (!Object.prototype.hasOwnProperty.call(en, esKey)) {
            throw 'en-US no tiene la clave ' + esKey;
        }
    }
    for (var euKey in eu) {
        if (!Object.prototype.hasOwnProperty.call(es, euKey)) {
            throw 'es-ES no tiene la clave ' + euKey;
        }
        if (!Object.prototype.hasOwnProperty.call(en, euKey)) {
            throw 'en-US no tiene la clave ' + euKey;
        }
    }
    for (var enKey in en) {
        if (!Object.prototype.hasOwnProperty.call(es, enKey)) {
            throw 'es-ES no tiene la clave ' + enKey;
        }
        if (!Object.prototype.hasOwnProperty.call(eu, enKey)) {
            throw 'eu-ES no tiene la clave ' + enKey;
        }
    }
    cb();
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

function clean(cb) {
    del([
        sitnaBuild.targetPath + '**/*',
        '!' + sitnaBuild.targetPath
    ], cb);
}

function unitTests(cb) {
    exec(path.resolve('test/unit/browser/runner.html'), cb);
}

function e2eTests() {
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
    adapterCss,
    printCss,
    componentCss,
    layoutCss
);

function generateManifest(cb) {
    const basePath = path.resolve(sitnaBuild.targetPath);
    walk(sitnaBuild.targetPath, function (err, results) {
        if (err) throw err;
        const lines = results
            .map(r => r.replace(basePath, sitnaBuild.targetUrl).replace(/\\/g, '/'))
            .filter(r => {
                return !r.startsWith(sitnaBuild.targetUrl + 'doc') &&
                    !r.startsWith(sitnaBuild.targetUrl + 'errors') &&
                    !r.startsWith(sitnaBuild.targetUrl + 'examples') &&
                    !r.startsWith(sitnaBuild.targetUrl + 'maps') &&
                    !r.startsWith('./TC') &&
                    !r.startsWith(sitnaBuild.targetUrl + 'workers') &&
                    !r.endsWith('.map') &&
                    (!r.startsWith(sitnaBuild.targetUrl + 'layout') || r.startsWith(sitnaBuild.targetUrl + 'layout/responsive'));
            });
        lines.unshift('');
        lines.unshift('CACHE:');
        lines.unshift('');
        lines.unshift('#' + new Date().toISOString());
        lines.unshift('CACHE MANIFEST');
        fs.writeFile(sitnaBuild.targetPath + 'manifest.appcache', lines.join(os.EOL), cb);
    });
}

let webpackServer;

function startDevServer() {
    // Tareas previas para servir correctamente
    require('./css/compiler.js');
    compileTemplates(() => true);
    encapsulateWebWorkers(() => true);
    ///////////////////////////////////////////
    const webpackConfig = require('./webpack/webpack.config.debug.js');
    const compiler = webpack(webpackConfig);
    const devServerOptions = { ...webpackConfig.devServer, open: true };
    webpackServer = new WebpackDevServer(devServerOptions, compiler);
    console.log('Starting server...');
    webpackServer.start();

    gulp.watch(['./TC/templates/*.hbs'], compileTemplates);
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
    zipLayout,
    examples,
    exampleSW
);

const noTests = gulp.series(
    clean,
    compileTemplates,
    encapsulateWebWorkers,
    buildCsprojFilter,
    //bundleOLDebug,
    //bundleOLRelease,    
    jsonValidate,
    textsValidate,
    //bundleCesiumDebug,
    //bundleCesiumRelease,
    baseCss,
    adapterCss,
    printCss,
    componentCss,
    layoutCss,
    resources,
    //copyOfflineLibraries,
    offlineScripts,
    webpackApi,
    generateManifest,
    onlineScripts,
    copyOnlineLibraries,
    copyLegacyCss,
    copyLegacyLayout,
    copyLegacyStyleAssets,
    parallelTasks,
    webpackApiDebug
);

exports.startDevServer = startDevServer;
exports.bundleApi = bundleApi;
exports.buildCss = buildCss;
exports.compileTemplates = compileTemplates;
exports.lint = lint;
exports.unitTests = unitTests;
exports.e2eTests = e2eTests;
exports.doc = doc;
exports.copyResources = gulp.series(
    buildCsprojFilter,
    resources
);
exports.encapsulateWebWorkers = encapsulateWebWorkers;
exports.updateDependencies = npmUpdate;
exports.noTests = noTests;
exports.default = gulp.series(
    noTests,
    //e2eTests,
    unitTests
);
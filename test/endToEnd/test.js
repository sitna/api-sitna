var environment = casper.cli.get('env');
var colorizer = require('colorizer').create('Colorizer');
var availableEnvs = require('./consts').ENVIRONMENTS;


if (!environment) {
    console.log('Uso: "casperjs test --env= "');
    console.log('Utilizando el entorno por defecto: ' + availableEnvs.VINET18);
    environment = availableEnvs.VINET18;
}

console.log('Cargando el archivo de configuracion para el entorno');
var environmentConfig = require('./config/env/' + environment + '.json');
console.log('Los tests se ejecutaran contra la URL ' + environmentConfig.url);

var readTimeoutFromConfig = function () {
    const DEFAULT_TIMEOUT = 5000;
    const TIMEOUT = environmentConfig.timeout || DEFAULT_TIMEOUT;
    casper.options.waitTimeout = TIMEOUT;
}();

casper.test.begin('IDENA-warm up', function (test) {
    var consoleErrors = [];

    casper.start(environmentConfig.url, function (result) {

        // Si hay algún error en la consola JavaScript, lo guardamos
        casper.on("page.error", function (msg, trace) {
            consoleErrors.push(msg);
        });
        
        test.assertExists('#map', 'El div del mapa esta presente en la pagina');

        //Espero a que los slide-panel se hayan cargado en la página.
        const slidePanelSelector = 'section.tc-slide-panel';
        casper.waitForSelector(slidePanelSelector, function () {
            test.assertElementCount(slidePanelSelector, 3, 'El visor contiene leyenda, mapa de situacion y panel de herramientas');
            test.assert(consoleErrors.length === 0, 'No hay errores en la consola');
        });
        

    }).run(function () {
        test.done();
    });
});

casper.test.begin('IDENA visor-header', function (test) {
    casper.start(environmentConfig.url, function () {
        console.log(this.getTitle())
        test.assert(this.getTitle().indexOf('{{') < 0, 'No hay elemento traducible en el title');
    }).run(function () {
        test.done();
    });
});

var shareTool = require("./tests/tools/share");

casper.test.begin('IDENA visor-Compartir', function (test) {
    casper.start(environmentConfig.url, function () {
        shareTool.testQrCodeGenerator(test);

    }).run(function () {
        test.done();
    });
});

var layerCatalogTool = require("./tests/tools/layerCatalog");

casper.test.begin('IDENA visor-Capas disponibles', function (test) {
    casper.start(environmentConfig.url, function () {
        layerCatalogTool.testCatalogSearchMoreInfoBtn(test);

    }).run(function () {
        test.done();
    });
});

var legend = require("./tests/legend/legend");

casper.test.begin('IDENA visor :: Leyenda', function (test) {
    casper.start(environmentConfig.url, function () {
        legend.testLegend(test);

    }).run(function () {
        test.done();
    });
});
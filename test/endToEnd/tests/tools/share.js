var availableEnvs = require('../../consts').ENVIRONMENTS;


/**
 * Probamos si se muestra el código QR correctamente.
 */
exports.testQrCodeGenerator = function (test) {
    const suggestionsSelector = '.tc-ctl-search-list';

    casper.then(function () {
        const shareToolsSelector = '.tc-ctl.tc-ctl-share > h2';
        const qrCodeLinkSelector = '.qr-generator';

        casper.waitForSelector(shareToolsSelector, function () {
            this.click(shareToolsSelector);
            casper.waitForSelector(qrCodeLinkSelector, function () {
                this.click(qrCodeLinkSelector);
            });
        });
    }).then(function () {
        const imgSelector = '.tc-modal-window .qrcode > img';

        casper.waitForSelector(imgSelector, function () {
            casper.capture("images/qrCode.png"); //Hacemos una captura de pantalla
            
            test.assertExists(imgSelector, 'Se carga el QR en pantalla');

            // La generación de QR no está disponible en localhost, por tanto ignoramos el test en este entorno
            if (environment !== availableEnvs.LOCAL) {
                test.assert(casper.getElementAttribute(imgSelector, 'src').length > 0, 'La imagen del QR tiene source');
            }
        });
    });
};
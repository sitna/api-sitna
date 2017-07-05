var capture = require('./../../utils').capture;

/**
 * Probamos si al pulsar el botón "i" en un resultado del buscador de capas se muestra el mismo panel que en el árbol.
 */
exports.testCatalogSearchMoreInfoBtn = function (test) {
    const suggestionsSelector = '.tc-ctl-search-list';

    casper.then(function () {
        const catalogSearchBtnSelector = '.tc-ctl-lcat .tc-ctl-lcat-btn-search';
        const catalogSearchInputSelector = '.tc-ctl-lcat-input';
        const catalogResultsListSelector = '.tc-ctl-lcat-search > ul .tc-ctl-lcat-search-btn-info';
        const catalogAbstractContainerSelector = '.tc-ctl-lcat-info';

        casper.waitForSelector(catalogSearchBtnSelector, function () {
            this.click(catalogSearchBtnSelector);
            casper.waitForSelector(catalogSearchInputSelector, function () {
                this.sendKeys(catalogSearchInputSelector, "cat");

                casper.waitForSelector(catalogResultsListSelector, function () {
                    capture('layer-catalog-search-info');
                    this.click(catalogResultsListSelector + ':first-of-type');
                    casper.wait(500, function () {
                        test.assert(
                            casper.getElementAttribute(catalogAbstractContainerSelector, 'class').indexOf('tc-hidden') < 0,
                            'El boton i del buscador de capas muestra el mismo panel de resultados que el arbol');
                    });
                });
            });
        });
    });
};
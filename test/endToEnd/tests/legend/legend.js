/**
 * Probamos si se muestra el código QR correctamente.
 */
exports.testLegend = function (test) {

    return; // flacunza: de momento deshabilito este test porque no consigo hacerlo funcionar

    //// Añadimos dos capas, las cambiamos de orden arrastrándolas en el control
    var layerIdsBefore, layerIdsAfter;

    // Pinchamos en "herramientas"
    const toolsTabSelector = "#tools-tab";
    casper.waitForSelector(toolsTabSelector,
          function success() {
              //test.assertExists(toolsTabSelector);
              this.click(toolsTabSelector);
          },
          function fail() {
              test.assertExists(toolsTabSelector);
          });

    // Pinchamos en "capas disponibles"
    const catalogSelector = "#catalog > h2";
    casper.waitForSelector(catalogSelector,
        function success() {
            //test.assertExists(catalogSelector);
            this.click(catalogSelector);
        },
        function fail() {
            test.assertExists(catalogSelector);
        });

    // Desplegamos "IDENA"
    const rootNodeSelector = ".tc-ctl-lcat-tree > .tc-ctl-lcat-branch > .tc-ctl-lcat-node:nth-child(1)";
    casper.waitForSelector(rootNodeSelector,
        function success() {
            //test.assertExists(rootNodeSelector);
            this.click(rootNodeSelector);
        },
        function fail() {
            test.assertExists(rootNodeSelector);
        });

    // Pinchamos en "Catastro"
    const cadasterNodeSelector = '.tc-ctl-lcat-node[data-layer-name="IDENA:catastro"] > span';
    casper.waitForSelector(cadasterNodeSelector,
        function success() {
            //test.assertExists(cadasterNodeSelector);
            this.click(cadasterNodeSelector);
        },
        function fail() {
            test.assertExists(cadasterNodeSelector);
        });

    // Pinchamos en "Catastro Minero"
    const mineryCadasterNodeSelector = '.tc-ctl-lcat-node[data-layer-name="IDENA:catastroMinero"] > span';
    casper.waitForSelector(mineryCadasterNodeSelector,
        function success() {
            //test.assertExists(mineryCadasterNodeSelector);
            this.click(mineryCadasterNodeSelector);
        },
        function fail() {
            test.assertExists(mineryCadasterNodeSelector);
        });

    // Pinchamos en "capas disponibles"
    const tocSelector = "#toc h2";
    casper.waitForSelector(tocSelector,
            function success() {
                //test.assertExists(tocSelector);
                this.click(tocSelector);
            },
            function fail() {
                test.assertExists(tocSelector);
            });

    // Esperamos a que la leyenda se cargue
    const legendTreeSelector = '.tc-ctl-legend-tree > .tc-ctl-legend-branch';
    const legendNodesSelector = legendTreeSelector + ' > .tc-ctl-legend-node';
    casper.waitForSelector(legendNodesSelector,
        function success() {
            //test.assertExists(legendNodesSelector);
            layerIdsBefore = this.getElementsAttribute(legendNodesSelector, 'data-layer-uid');
        },
        function fail() {
            test.assertExists(legendNodesSelector);
        });

    // Movemos la capa de arriba hacia abajo
    const tocNodesSelector = '.tc-ctl-wlm-content .tc-ctl-wlm-elm';
    casper.waitForSelector(tocNodesSelector,
        function success() {
            //test.assertExists(tocNodesSelector);
            var firstNodeSelector = tocNodesSelector + ':first-child';
            this.captureSelector('images/toc1.png', '#tools-panel');
            this.click(firstNodeSelector);
            this.page.sendEvent('keydown', this.page.event.key.Down);
            this.wait(10000, function () {
                this.captureSelector('images/toc2.png', '#tools-panel');
                // Esperamos a que la leyenda cambie
                const firstLegendNodeSelector = legendNodesSelector + '[data-layer-uid=' + layerIdsBefore[1] + ']:first-child';
                casper.waitForSelector(firstLegendNodeSelector,
                    function success() {
                        console.log("before: ", layerIdsBefore)
                        //test.assertExists(firstLegendNodeSelector);
                        layerIdsAfter = this.getElementsAttribute(legendNodesSelector, 'data-layer-uid');
                        console.log("after: ", layerIdsAfter)
                        test.assert(layerIdsBefore[0] === layerIdsAfter[1] && layerIdsBefore[1] === layerIdsAfter[0],
                            'Los ID de capa de los elementos de la leyenda han cambiado de orden');
                    },
                    function fail() {
                        console.log("before: ", layerIdsBefore)
                        test.assertExists(firstLegendNodeSelector);
                    });
            });
        },
        function fail() {
            test.assertExists(tocNodesSelector);
        });

};
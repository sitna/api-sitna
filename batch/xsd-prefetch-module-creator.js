const fs = require('fs');
const path = require('path');

const urls = [
    'http://schemas.opengis.net/iso/19139/20070417/gmd/gmd.xsd',
    'http://schemas.opengis.net/gml/3.2.1/gml.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/metadataApplication.xsd',
    'http://schemas.opengis.net/gml/3.2.1/dynamicFeature.xsd',
    'http://schemas.opengis.net/gml/3.2.1/topology.xsd',
    'http://schemas.opengis.net/gml/3.2.1/coverage.xsd',
    'http://schemas.opengis.net/gml/3.2.1/coordinateReferenceSystems.xsd',
    'http://schemas.opengis.net/gml/3.2.1/observation.xsd',
    'http://schemas.opengis.net/gml/3.2.1/temporalReferenceSystems.xsd',
    'http://schemas.opengis.net/gml/3.2.1/deprecatedTypes.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gco/gco.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/metadataEntity.xsd',
    'http://schemas.opengis.net/gml/3.2.1/feature.xsd',
    'http://schemas.opengis.net/gml/3.2.1/direction.xsd',
    'http://schemas.opengis.net/gml/3.2.1/geometryComplexes.xsd',
    'http://schemas.opengis.net/gml/3.2.1/valueObjects.xsd',
    'http://schemas.opengis.net/gml/3.2.1/grids.xsd',
    'http://schemas.opengis.net/gml/3.2.1/geometryAggregates.xsd',
    'http://schemas.opengis.net/gml/3.2.1/coordinateSystems.xsd',
    'http://schemas.opengis.net/gml/3.2.1/datums.xsd',
    'http://schemas.opengis.net/gml/3.2.1/coordinateOperations.xsd',
    'http://schemas.opengis.net/gml/3.2.1/temporalTopology.xsd',
    'http://schemas.opengis.net/gml/3.2.1/dictionary.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gco/basicTypes.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/spatialRepresentation.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/metadataExtension.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/content.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/applicationSchema.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/portrayalCatalogue.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/dataQuality.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/freeText.xsd',
    'http://schemas.opengis.net/gml/3.2.1/temporal.xsd',
    'http://schemas.opengis.net/gml/3.2.1/geometryBasic0d1d.xsd',
    'http://schemas.opengis.net/gml/3.2.1/geometryPrimitives.xsd',
    'http://schemas.opengis.net/gml/3.2.1/referenceSystems.xsd',
    'http://schemas.opengis.net/gml/3.2.1/measures.xsd',
    'http://schemas.opengis.net/gml/3.2.1/gmlBase.xsd',
    'http://www.w3.org/1999/xlink.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gco/gcoBase.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gss/gss.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/citation.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/identification.xsd',
    'http://schemas.opengis.net/gml/3.2.1/geometryBasic2d.xsd',
    'http://schemas.opengis.net/gml/3.2.1/units.xsd',
    'http://schemas.opengis.net/gml/3.2.1/basicTypes.xsd',
    'http://www.w3.org/2001/xml.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gss/geometry.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/referenceSystem.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/constraints.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/distribution.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/maintenance.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gmd/extent.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gts/gts.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gsr/gsr.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gts/temporalObjects.xsd',
    'http://schemas.opengis.net/iso/19139/20070417/gsr/spatialReferencing.xsd',
];
const xsdDictionary = new Map();

module.exports = new Promise(function (resolve) {
    Promise.all(urls.map((url) => fetch(url))).then((responses) => {
        Promise.all(responses.map((r) => r.text())).then((texts) => {
            for (var i = 0; i < texts.length; i++) {
                xsdDictionary.set(urls[i], texts[i].replace(/\<\?.+\?>/, ''));
            }
            const moduleName = 'xsdDocuments';
            const mapContent = Array.from(xsdDictionary.entries()).map((entry) => "['" + entry.join("',`") + "`]").join();
            const contents = 'export default new Map([' + mapContent + ']);';
            fs.writeFile(path.resolve(__dirname, '../TC/tool/') + '\\' + moduleName + '.mjs', contents, resolve);
        });
    });
});
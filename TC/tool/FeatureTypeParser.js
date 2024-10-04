import TC from '../../TC';
import Util from '../../TC/Util';
import Proxification from './Proxification';
import wwBlob from '../../workers/tc-dft-web-worker-blob.mjs';

class FeatureTypeParser {
    #proxificationTool;
    #featureTypeDescriptions = {};

    #init() {
        const workerUrl = URL.createObjectURL(wwBlob);
        const worker = new Worker(workerUrl);
        if (!this.#proxificationTool) {
            this.#proxificationTool = new Proxification(TC.proxify);
        }
        worker.addEventListener('message', async (e) => {
            if (!(e.data instanceof Object)) {
                return await this.#requestSchema(worker, e.data);
            }
            if (e.data.state === 'success') {
                this.#featureTypeDescriptions = Object.assign(this.#featureTypeDescriptions, this.#getDftCollection(e.data.dftCollection));
            }
            else {
                throw "Ha habido problemas procesando el Describe feature type";
                //reject("loquesea");
            }
        });
        return worker;
    }

    async #requestSchema(worker, url) {
        const { default: xsdDictionary } = await import('./xsdDocuments.mjs');
        if (xsdDictionary.has(url)) {
            worker.postMessage({
                type: 'getSchema',
                url,
                xml: xsdDictionary.get(url)
            });
        }
        else {
            try {
                const doc = await this.#proxificationTool.fetchXML(url);
                worker.postMessage({
                    type: 'getSchema',
                    url,
                    xml: doc.documentElement.outerHTML
                });
            }
            catch (_e) {
                worker.postMessage({
                    type: 'getSchema',
                    url,
                    xml: '<xsd:schema></xsd:schema>'
                });
            }
        }
    }

    getFeatureTypeDescription(layerName) {
        const name = Array.isArray(layerName) ? layerName[0] : layerName;
        return this.#featureTypeDescriptions[name];
    }

    getFeatureTypeDescriptions() {
        return this.#featureTypeDescriptions;
    }

    #getDftCollection(dftCollection) {
        const result = {};
        for (const key in dftCollection) {
            result[key] = dftCollection[key].type;
        }
        return result;
    }

    async parseFeatureTypeDescription(doc, layerNames) {
        const worker = this.#init();
        //checkear si excepciones del servidor
        if (doc.querySelector("Exception") || doc.querySelector("exception")) {
            throw (doc.querySelector("Exception") || doc.querySelector("exception")).textContent.trim();
        }
        const messagePromise = Util.getPromiseFromEvent(worker, 'message', {
            resolvePredicate: function (e) {
                if (e.data instanceof Object && e.data.state === 'success') {
                    if (Object.keys(e.data.dftCollection).join() === Array.isArray(layerNames) ? layerNames.join() : layerNames) {
                        return true;
                    }
                }
                return false;
            },
            rejectPredicate: (e) => e.data instanceof Object && e.data.state !== 'success'
        });
        worker.postMessage({
            type: 'describeFeatureType',
            layerName: layerNames,
            xml: doc.documentElement.outerHTML,
            url: TC.apiLocation.indexOf("http") >= 0 ? TC.apiLocation : document.location.protocol + TC.apiLocation
        });
        const messageEvent = await messagePromise;
        return this.#getDftCollection(messageEvent.data.dftCollection);
    }

    #getSchemaDoc(gmlDoc) {
        const schemaLocationsValue = gmlDoc.documentElement.getAttribute('xsi:schemaLocation');
        if (schemaLocationsValue) {
            const doc = document.implementation.createDocument('http://www.w3.org/2001/XMLSchema', 'xsd:schema');
            for (const attr of gmlDoc.documentElement.attributes) {
                if (attr.name.startsWith('xmlns:')) {
                    doc.documentElement.setAttribute(attr.name, attr.value);
                }
            }
            const schemaLocations = schemaLocationsValue.split(' ');
            schemaLocations.filter((_elm, idx) => idx % 2 !== 0).forEach((url) => {
                // Si meto los esquemas de este dominio (WFS y GML) la carga falla
                if (url.indexOf('schemas.opengis.net') < 0) {
                    const include = document.createElementNS('http://www.w3.org/2001/XMLSchema', 'include');
                    include.setAttribute('schemaLocation', url);
                    doc.documentElement.appendChild(include);
                }
            });
            return doc;
        }
    }

    async parseSchemas(doc, featureType) {
        const schemaLocationsValue = doc.documentElement.getAttribute('xsi:schemaLocation');
        if (schemaLocationsValue) {
            const schemaDoc = this.#getSchemaDoc(doc);
            if (schemaDoc) {
                return await this.parseFeatureTypeDescription(schemaDoc, [featureType]);
            }
        }
    }
}

export default FeatureTypeParser;
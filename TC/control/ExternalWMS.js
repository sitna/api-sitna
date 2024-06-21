import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Control from '../Control';
import Raster from '../../SITNA/layer/Raster';

TC.control = TC.control || {};

class ExternalWMS extends Control {
    #addedUrls = [];

    constructor() {
        super(...arguments);
        const self = this;

        self.count = 0;

        self.allowReprojection = Object.prototype.hasOwnProperty.call(self.options, 'allowReprojection') ? self.options.allowReprojection : true;
    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);

        map.on(Consts.event.LAYERADD, function (e) {
            const layer = e.layer;
            if (layer && !layer.isBase) {
                var url = layer.url;

                if (url) {
                    self.pending_markServicesAsSelected = self.pending_markServicesAsSelected || [];
                    if (self.div.querySelectorAll('select option').length === 0 && url && self.pending_markServicesAsSelected.indexOf(url) === -1) {
                        self.pending_markServicesAsSelected.push(url);
                    }

                    const selectedOptions = [];
                    self.div.querySelectorAll('select option').forEach(function (option) {
                        if (option.value.replace(/https?:\/\/|\/\//, '') === url.replace(/https?:\/\/|\/\//, '')) {
                            selectedOptions.push(option);
                        }
                    });
                    self.markServicesAsSelected(selectedOptions);
                    self.#addedUrls.push(url);
                }
            }
        });

        return self;
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-xwms.mjs');
        self.template = module.default;
    }

    render(callback) {
        const self = this;
        return self.renderData(self.options, function () {
            self.pending_markServicesAsSelected = self.pending_markServicesAsSelected || [];

            self.pending_markServicesAsSelected.forEach(function (elemUrl) {
                const selectedOptions = [];
                self.div.querySelectorAll('select option').forEach(function (option) {
                    if (Util.addProtocol(option.value) === Util.addProtocol(elemUrl)) {
                        selectedOptions.push(option);
                    }
                });

                self.markServicesAsSelected(selectedOptions);
                self.#addedUrls.push(elemUrl);
            });

            self.pending_markServicesAsSelected = [];
            
            self.addUIEventListeners();

            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    addUIEventListeners() {
        const self = this;
        self.div.querySelector('select').addEventListener('change', function (evt) {
            if (evt.target.value !== '') {
                var url = evt.target.value;
                if (url.indexOf('//') === 0) {
                    url = location.protocol + url;
                }
                self.div.querySelector('input').value = url;
                evt.target.value = '';
            }
        });
        self.div.querySelector('button[name="agregar"]').addEventListener('click', function (_e) {
            self.addWMS();
        });
        self.div.querySelector('input').addEventListener('keyup', (e) => {
            if (e.key && e.key.toLowerCase() === "enter" && self.div.querySelector('input').value.trim().length > 0) {
                self.addWMS();
            }
        });
    }

    addWMS(serviceUrl) {
        const self = this;
        let url = serviceUrl ?? self.div.querySelector('input').value.trim();

        if (!url) {
            TC.alert(self.getLocaleString('typeAnAddress'));
        }
        else if (!/^((https?|ftp):)?(\/\/)?(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url)) {
            TC.alert(self.getLocaleString('typeAValidAddress'));
        }
        else {
            /*
             * Borra parámetros no necesarios de la URL del servicio WMS.
             */
            const removeParamsFromUrl = function (url, paramsToRemove) {
                for (var i = 0; i < paramsToRemove.length; i++) {
                    url = Util.removeURLParameter(url, paramsToRemove[i]);
                }
                if (url.match(/\?$/)) {
                    url = url.substr(0, url.length - 1);
                }
                return url;
            };

            if (self.#addedUrls.some(function (addedUrl) {
                return addedUrl.replace(/https?:\/\/|\/\//, '') === url.replace(/https?:\/\/|\/\//, '');
            })) {
                TC.alert(self.getLocaleString('serviceAlreadyAdded'));
            }
            else {
                var loadingCtrl = self.map.getLoadingIndicator();
                loadingCtrl.show();
                var params = Util.getQueryStringParams(url);

                if (!/https?:\/\/|\/\//i.test(url)) {
                    url = "//" + url;
                }

                //Extraemos sólo los parámetros adicionales
                var unwantedParams = ["version", "service", "request"];
                var urlWithoutParams = removeParamsFromUrl(url, Object.keys(params));

                for (var item in params) {
                    if (unwantedParams.indexOf(item.toLowerCase()) >= 0) {
                        delete params[item];
                    }
                }

                const addButton = self.div.querySelector('button');
                addButton.setAttribute('type', 'button');
                addButton.disabled = true;

                var obj = {
                    id: 'xwms' + (++self.count),
                    //"title": "Servicio externo",
                    type: 'WMS',
                    url: urlWithoutParams,
                    hideTree: false,
                    queryParams: params
                };
                //URI: recorremos las opciones buscando el servicio que se va a agregar a ver si tiene parametro layerNames
                for (var i = 0; i < self.options.suggestions.length; i++) {
                    var _current = self.options.suggestions[i].items.filter(item => item.url === url);
                    if (_current.length > 0 && _current[0].layerNames) {
                        obj.layerNames = _current[0].layerNames;
                        break;
                    }
                }

                var layer = new Raster(obj);
                layer.getCapabilitiesPromise().then(function (cap) {
                    if (typeof cap.Capability === 'undefined') {
                        TC.alert(self.getLocaleString('noLayersFoundInService'));
                        loadingCtrl.hide();
                        addButton.disabled = false;
                        return;
                    } else {
                        var root = cap.Capability.Layer;
                        if (root.CRS && root.CRS.indexOf(self.map.crs) === -1 && !self.allowReprojection) {
                            //no soportado. avisar y fallar
                            TC.alert(self.getLocaleString('serviceSrsNotCompatible'));
                            loadingCtrl.hide();
                            addButton.disabled = false;
                            return;
                        }

                        self.map.trigger(Consts.event.EXTERNALSERVICEADDED, { layer: layer });
                        self.div.querySelector('input').value = '';

                        const selectedOptions = [];
                        self.div.querySelectorAll('select option').forEach(function (option) {
                            if (option.value.replace(/https?:\/\/|\/\//, '') === url.replace(/https?:\/\/|\/\//, '')) {
                                selectedOptions.push(option);
                            }
                        });
                        self.markServicesAsSelected(selectedOptions);
                        self.#addedUrls.push(url);
                        loadingCtrl.hide();
                        addButton.disabled = false;
                    }
                },
                    function (error) {
                        TC.alert(self.getLocaleString('serviceCouldNotBeLoaded') + ":\n" + error);
                        loadingCtrl.hide();
                        addButton.disabled = false;
                    });
            }
        }
        return self;
    }

    /*
     * Marca como seleccionadas aquellas opciones del desplegable correspondientes a servicios WMS ya añadidos al TOC.
     */
    markServicesAsSelected(options) {
        if (options.length > 0) {
            const selectedOption = options[0];
            selectedOption.disabled = true;
            selectedOption.classList.add('tc-ctl-xwms-option-selected');
        }
    }
}

ExternalWMS.prototype.CLASS = 'tc-ctl-xwms';
TC.control.ExternalWMS = ExternalWMS;
export default ExternalWMS;
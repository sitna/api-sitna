TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.MapInfo = function () {
    var self = this;

    TC.Control.apply(self, arguments);
};

TC.inherit(TC.control.MapInfo, TC.Control);

(function () {
    var ctlProto = TC.control.MapInfo.prototype;

    ctlProto.CLASS = 'tc-ctl-mi';

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.Control.prototype.register.call(self, map);

        self.QR_MAX_URL_LENGTH = 150;
        self.SHORTEN_URL_LENGTH = 32715;

        self.exportsState = false;

        self.includeControls = self.options.includeControls === undefined || self.options.includeControls;

        map.ready(function () {
            const controlStates = map.state && map.state.ctl;
            if (controlStates) {
                if (!map._controlStatesLoaded) { // Para evitar que si hay varios controles Share cargados, cada uno importe por su cuenta.
                    self.importControlStates(controlStates);
                    map._controlStatesLoaded = true;
                }
            }
        });

        return result;
    }

    ctlProto.exportControlStates = function () {
        const self = this;
        if (self.map) {
            return self.map.controls
                .map(function (ctl) {
                    return ctl.exportState();
                })
                .filter(function (state) {
                    // Quitamos los estados nulos o vacíos
                    if (state) {
                        for (var key in state) {
                            if (state.hasOwnProperty(key)) {
                                return true;
                            }
                        }
                    }
                    return false;
                });
        }
        return [];
    };

    ctlProto.importControlStates = function (stateArray) {
        const self = this;
        if (self.map) {
            stateArray.forEach(function (state) {
                const ctl = self.map.getControlById(state.id);
                if (ctl) {
                    self.map.loaded(function () {
                        ctl.importState(state);
                    });
                }
            });
        }
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.exportsState) {
            const state = {};
            if (self.featureToShare || self.sharedFeaturesLayer) {
                var layerState;
                state.id = self.id;
                if (self.featureToShare) {
                    const featureToShare = self.featureToShare.clone();
                    featureToShare.showsPopup = true;
                    layerState = self.featureToShare.layer.exportState({
                        features: [featureToShare]
                    });
                }
                else {
                    layerState = self.sharedFeaturesLayer.exportState();
                }
                state.features = layerState.features;
                if (layerState.crs) {
                    state.crs = layerState.crs;
                }
            }
            return state;
        }
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;
        console.log(this);
        if (self.map && state.features.length) {
            self.map.addLayer({
                id: self.getUID(),
                type: TC.Consts.layerType.VECTOR,
                title: self.getLocaleString('foi'),
                stealth: true
            }).then(function (layer) {
                self.sharedFeaturesLayer = layer;
                layer.importState({ features: state.features, crs: state.crs }).then(function () {
                    self.map.zoomToFeatures(layer.features);
                });
            });
        }
    };

    ctlProto.manageMaxLengthExceed = function () {
        throw "Falta implementación del método manageMaxLengthExceed";
    };

    ctlProto.generateLink = function () {
        var self = this;

        var currentUrl = window.location.href;
        var hashPosition = currentUrl.indexOf('#');
        if (hashPosition > 0) {
            currentUrl = currentUrl.substring(0, hashPosition);
        }

        if (self.extraParams) {
            // Hacemos merge de parámetros de URL
            var params = TC.Util.getQueryStringParams(currentUrl);
            $.extend(params, self.extraParams);
            var qsPosition = currentUrl.indexOf('?');
            if (qsPosition >= 0) {
                currentUrl = currentUrl.substring(0, qsPosition);
            }
            currentUrl = currentUrl.concat('?', $.param(params));
        }

        // eliminamos el parámetro del idioma, si no lo arrastramos al compartir
        if (TC.Util.getParameterByName('lang').length > 0) {
            if (currentUrl.indexOf('&') > -1) { // tenemos más parámetros en la url
                currentUrl = currentUrl.replace("lang" + "=" + TC.Util.getParameterByName('lang') + '&', '');
            } else {
                currentUrl = currentUrl.replace('?' + "lang" + "=" + TC.Util.getParameterByName('lang'), '');
            }
        }

        const controlStates = self.includeControls ? self.exportControlStates() : [];
        if (self.exportsState && (self.featureToShare || self.sharedFeaturesLayer)) {
            controlStates.push(self.exportState());
        }
        const extraStates = controlStates.length ? { ctl: controlStates } : undefined;

        var hashState = self.map.getMapState(extraStates);

        var url = currentUrl.concat("#", hashState);
        self.manageMaxLengthExceed({ browser: url.length > TC.Consts.URL_MAX_LENGTH, qr: url.length > self.SHORTEN_URL_LENGTH });
        return url;
    };

    ctlProto.shortenedLink = function () {
        const self = this;
        var deferred = $.Deferred();
        var wait;

        const generateLinkWithoutParams = function () {
            var url = self.generateLink();
            var start = url.indexOf('?');
            var end = url.indexOf('#');

            //Borramos los parámetros de la URL y dejamos sólo el hash
            if (start > 0) {
                if (start < end) {
                    url = url.replace(url.substring(start, end), '');
                } else {
                    url = url.replace(url.substring(start, url.length - 1), '');
                }
            }

            return url;
        };
        const shortenUrl = function (url) {
            var shortenServiceUrl = "https://tinyurl.com/api-create.php";

            if (!TC.tool || !TC.tool.Proxification) {
                TC.syncLoadJS(TC.apiLocation + 'TC/tool/Proxification');
            }

            var data = new FormData();
            data.append("url", url);

            var toolProxification = new TC.tool.Proxification(TC.proxify, { allowedMixedContent: false });
            return toolProxification.fetch(shortenServiceUrl, {
                type: 'POST',
                data: data
            }).then(function (data) {
                return data;
            }).catch(function (error) {
                return null;
            });
        };
        const onError = function () {
            self.map.toast(self.getLocaleString("urlTooLongForShortener"), { type: TC.Consts.msgType.ERROR });
            self.map.getLoadingIndicator().removeWait(wait);
            deferred.resolve("");
        };

        var url = generateLinkWithoutParams();

        if (url.length > self.QR_MAX_URL_LENGTH && url.length < self.SHORTEN_URL_LENGTH) {

            wait = self.map.getLoadingIndicator().addWait();

            shortenUrl(url).then(function (response) {
                if (response && response.responseText) {
                    self.map.getLoadingIndicator().removeWait(wait);
                    deferred.resolve(response.responseText.replace('http://', 'https://'));
                } else {
                    onerror();
                }
            }, onerror);
        } else {
            if (url.length >= self.SHORTEN_URL_LENGTH) {
                onError();
            }

            deferred.resolve("");
        }

        return deferred;

    }

    ctlProto.makeQRCode = function ($codeContainer, width, height) {
        const self = this;
        var deferred = $.Deferred();

        TC.loadJS(
            typeof QRCode === 'undefined',
            [TC.apiLocation + 'lib/qrcode/qrcode.min.js'],
            function () {
                self.shortenedLink().then(function (url) {
                    url = url || "";
                    if (url.length > 0) {
                        var options = {
                            text: url
                        };

                        if (width && height) {
                            options.width = width;
                            options.height = height;
                        }

                        var config = { attributes: true, childList: true, subtree: true };
                        var observer = new MutationObserver(function (mutationsList, observer) {
                            var srcMutation = mutationsList.filter(function (mutation) {
                                return mutation.type === "attributes"
                            }).filter(function (mutation) {
                                return mutation.attributeName.indexOf('src') > -1;
                            });

                            if (srcMutation.length > 0) {
                                observer.disconnect();
                                deferred.resolve(srcMutation[0].target.src);
                            }
                        });
                        observer.observe($codeContainer.get(0), config);
                        var code = new QRCode($codeContainer.get(0), options);
                    } else {
                        deferred.resolve();
                    }
                });
            });

        return deferred.promise();
    };

    ctlProto.drawScaleBarIntoCanvas = function (options) {
        const self = this;
        var canvas;
        var sb = self.map.getControlsByClass(TC.control.ScaleBar);
        if (sb.length == 0) {
            return null;
        }

        options = options || {};

        const drawFill = function (ctx, width, height) {
            var elem = document.getElementsByClassName(sb[0].CLASS);
            var fillnode = elem.item(0);
            var fillBoundingCR = $.extend({}, fillnode.getBoundingClientRect());

            fillBoundingCR.left = (options.left || 15) - 2;

            fillBoundingCR.top = options.top || 15;
            fillBoundingCR.top--;

            ctx.globalAlpha = 0.5;
            ctx.fillStyle = window.getComputedStyle(fillnode).backgroundColor;
            width += 4;
            height += 4;
            ctx.fillRect(fillBoundingCR.left, fillBoundingCR.top, width, height);
        };

        if (!options.canvas) {
            canvas = document.createElement('CANVAS');
        } else {
            canvas = options.canvas;
        }

        var ctx = canvas.getContext("2d");
        ctx.save();

        var elem = document.getElementsByClassName("ol-scale-line-inner");
        var node = elem.item(0);
        var boundingCR = $.extend({}, node.getBoundingClientRect());

        var text = node.textContent;

        ctx.beginPath();
        ctx.strokeStyle = window.getComputedStyle(node).borderColor;

        var width, height;

        if (boundingCR.width > boundingCR.height) {

            width = boundingCR.width;
            height = boundingCR.height;
        }
        else {

            width = boundingCR.height;
            height = boundingCR.width;
        }

        if (options.setSize) {
            canvas.width = width;
            canvas.height = height;
        }        

        boundingCR.left = options.left != undefined ? options.left : 15;
        boundingCR.top = options.top != undefined ? options.top : 15;

        ctx.moveTo(boundingCR.left, boundingCR.top);
        ctx.lineTo(boundingCR.left, boundingCR.top + height);
        ctx.lineTo(boundingCR.left + width, boundingCR.top + height);
        ctx.lineTo(boundingCR.left + width, boundingCR.top);

        ctx.stroke();

        var textMetrics = ctx.measureText(text);
        var textPosition = {
            x: boundingCR.left + width / 2,
            y: boundingCR.top + height / 2
        };

        if (options.fill) {
            drawFill(ctx, width, height);
        }

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = options.textColor != undefined ? options.textColor : window.getComputedStyle(node).color;

        ctx.font = options.font != undefined ? options.font : window.getComputedStyle(node).fontSize + " " + window.getComputedStyle(node).fontFamily;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, textPosition.x, textPosition.y);

        return canvas;
    };

    ctlProto.registerListeners = function () {
        const self = this;

        if (!self.registeredListeners) {
            self.map.on(TC.Consts.event.LAYERADD, self.generateLink.bind(self))
                .on(TC.Consts.event.LAYERREMOVE, self.generateLink.bind(self))
                .on(TC.Consts.event.FEATUREADD, self.generateLink.bind(self))
                .on(TC.Consts.event.FEATUREREMOVE + ' ' + TC.Consts.event.FEATURESCLEAR, self.generateLink.bind(self));

            self.registeredListeners = true;
        }
    };

})();
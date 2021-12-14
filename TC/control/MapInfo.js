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
        self.SHORTEN_URL_LENGTH = 16000;

        self.exportsState = false;

        self.includeControls = self.options.includeControls === undefined || self.options.includeControls;

        return result;
    }

    ctlProto.exportControlStates = function () {
        const self = this;
        if (self.map) {
            return self.map.exportControlStates();
        }
        return [];
    };

    ctlProto.importControlStates = function (stateArray) {
        const self = this;
        if (self.map) {
            self.map.importControlStates(stateArray);
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
                } else {
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
        if (self.map && state.features.length) {
            self.map.addLayer({
                id: self.getUID(),
                owner: self,
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

    ctlProto.generateLink = async function () {
        var self = this;

        var currentUrl = window.location.href;
        var hashPosition = currentUrl.indexOf('#');
        if (hashPosition > 0) {
            currentUrl = currentUrl.substring(0, hashPosition);
        }

        if (self.extraParams) {
            // Hacemos merge de parámetros de URL
            var params = TC.Util.getQueryStringParams(currentUrl);
            TC.Util.extend(params, self.extraParams);
            var qsPosition = currentUrl.indexOf('?');
            if (qsPosition >= 0) {
                currentUrl = currentUrl.substring(0, qsPosition);
            }
            currentUrl = currentUrl.concat('?', TC.Util.getParamString(params));
        }
        else {
            //eliminamos todos los paramaertos por querystring
            var start = currentUrl.indexOf('?');

            //Borramos los parámetros de la URL y dejamos sólo el hash
            if (start > 0) {
                currentUrl = currentUrl.replace(currentUrl.substring(start), '');
            }
        }       

        const controlStates = self.includeControls ? self.exportControlStates() : [];
        if (!self.includeControls && self.exportsState && (self.featureToShare || self.sharedFeaturesLayer || (self.caller && self.caller.toShare))) {
            if (self.caller && self.caller.toShare) {
                controlStates.push(self.caller.exportState());
            } else {
                controlStates.push(self.exportState());
            }
        }
        const extraStates = controlStates.length ? { ctl: controlStates } : undefined;

        var hashState = await self.map.getMapState({ extraStates: extraStates, cacheResult: self.includeControls });

        var url = currentUrl.concat("#", hashState);
        self.manageMaxLengthExceed({ browser: url.length > TC.Consts.URL_MAX_LENGTH, qr: url.length > self.SHORTEN_URL_LENGTH });
        return url;
    };

    ctlProto.shortenedLink = function () {
        const self = this;
        var wait;

        //const generateLinkWithoutParams = async function () {
        //    var url = await self.generateLink();
        //    var start = url.indexOf('?');
        //    var end = url.indexOf('#');

        //    //Borramos los parámetros de la URL y dejamos sólo el hash
        //    if (start > 0) {
        //        if (start < end) {
        //            url = url.replace(url.substring(start, end), '');
        //        } else {
        //            url = url.replace(url.substring(start, url.length - 1), '');
        //        }
        //    }

        //    return url;
        //};
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

        return new Promise(function (resolve, reject) {
            const onError = function () {
                self.map.toast(self.getLocaleString("urlTooLongForShortener"), { type: TC.Consts.msgType.ERROR });
                self.map.getLoadingIndicator().removeWait(wait);
                resolve("");
            };
            self.generateLink().then(url => {
                if (url.length > self.QR_MAX_URL_LENGTH && url.length < self.SHORTEN_URL_LENGTH) {

                    wait = self.map.getLoadingIndicator().addWait();

                    shortenUrl(url).then(function (response) {
                        if (response && response.responseText) {
                            self.map.getLoadingIndicator().removeWait(wait);
                            resolve(response.responseText.replace('http://', 'https://'));
                        } else {
                            onError();
                        }
                    }, onError);
                } else {
                    if (url.length >= self.SHORTEN_URL_LENGTH) {
                        onError();
                    }

                    resolve("");
                }
            });
        });
    };

    ctlProto.makeQRCode = function (codeContainer, width, height) {
        const self = this;
        return new Promise(function (resolve, reject) {
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
                                    resolve(srcMutation[0].target.src);
                                }
                            });
                            observer.observe(codeContainer, config);
                            new QRCode(codeContainer, options);
                        } else {
                            resolve();
                        }
                    });
                });
        });
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
            var fillBoundingCR = TC.Util.extend({}, fillnode.getBoundingClientRect());

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
        var boundingCR = TC.Util.extend({}, node.getBoundingClientRect());

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
            let handlerTimeout;
            const handler = function (e) {
                clearTimeout(handlerTimeout);
                // generateLink puede ser tardar mucho, así que no lo llamamos innecesariamente cuando se están cargando varias features
                handlerTimeout = setTimeout(function () {
                    delete self.map._controlStatesCache;
                    self.renderPromise().then(function () {
                        self.generateLink();
                    });
                }, 100);
            };
            self.map.on(TC.Consts.event.LAYERADD, handler)
                .on(TC.Consts.event.LAYERREMOVE, handler)
                .on(TC.Consts.event.FEATUREADD, handler)
                .on(TC.Consts.event.FEATUREREMOVE + ' ' + TC.Consts.event.FEATURESCLEAR, handler);

            self.registeredListeners = true;
        }
    };

})();
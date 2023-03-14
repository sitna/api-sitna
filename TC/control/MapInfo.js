import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';
import Proxification from '../tool/Proxification';

TC.control = TC.control || {};
TC.Control = Control;

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
    };

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
                type: Consts.layerType.VECTOR,
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
        if (!self.includeControls && self.exportsState && (self.featureToShare || self.sharedFeaturesLayer || self.caller && self.caller.toShare)) {
            if (self.caller && self.caller.toShare) {
                controlStates.push(self.caller.exportState());
            } else {
                controlStates.push(self.exportState());
            }
        }
        const extraStates = controlStates.length ? { ctl: controlStates } : undefined;

        var hashState = await self.map.getMapState({ extraStates: extraStates, cacheResult: self.includeControls });

        var url = currentUrl.concat("#", hashState);
        self.manageMaxLengthExceed({ browser: url.length > Consts.URL_MAX_LENGTH, qr: url.length > self.SHORTEN_URL_LENGTH });
        return url;
    };

    ctlProto.shortenedLink = async function () {
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

            var data = new FormData();
            data.append("url", url);

            const proxificationTool = new Proxification(TC.proxify, { allowedMixedContent: false });
            return proxificationTool.fetch(shortenServiceUrl, {
                type: 'POST',
                data: data
            }).then(function (data) {
                return data;
            }).catch(function (_error) {
                return null;
            });
        };

        const onError = function () {
            self.map.toast(self.getLocaleString("urlTooLongForShortener"), { type: Consts.msgType.ERROR });
            self.map.getLoadingIndicator().removeWait(wait);
            return "";
        };

        const url = await self.generateLink();
        if (url.length > self.QR_MAX_URL_LENGTH && url.length < self.SHORTEN_URL_LENGTH) {

            wait = self.map.getLoadingIndicator().addWait();

            const response = await shortenUrl(url);
            if (response && response.responseText) {
                self.map.getLoadingIndicator().removeWait(wait);
                return response.responseText.replace('http://', 'https://');
            } else {
                return onError();
            }
        } else {
            if (url.length >= self.SHORTEN_URL_LENGTH) {
                return onError();
            }

            return "";
        }
    };

    ctlProto.makeQRCode = async function (codeContainer, width) {
        const self = this;
        const modulePromise = import('qrcode');
        const url = await self.shortenedLink() || '';
        if (url.length > 0) {
            const options = {
                text: url,
                margin: 2
            };

            if (width) {
                options.width = width;
            }

            codeContainer.innerHTML = '';
            const img = document.createElement('img');
            const QRCode = (await modulePromise).default;
            img.src = await QRCode.toDataURL(url, options);
            codeContainer.appendChild(img);
            return img.src;
        }
    };

    ctlProto.drawScaleBarIntoCanvas = function (options) {
        const self = this;
        var canvas;
        var sb = self.map.getControlsByClass(TC.control.ScaleBar);
        if (sb.length === 0) {
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

        boundingCR.left = options.left !== undefined ? options.left : 15;
        boundingCR.top = options.top !== undefined ? options.top : 15;

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
        ctx.fillStyle = options.textColor !== undefined ? options.textColor : window.getComputedStyle(node).color;

        ctx.font = options.font !== undefined ? options.font : window.getComputedStyle(node).fontSize + " " + window.getComputedStyle(node).fontFamily;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, textPosition.x, textPosition.y);

        return canvas;
    };

    ctlProto.registerListeners = function () {
        const self = this;
        if (!self.registeredListeners) {
            let handlerTimeout;
            const handler = function (_e) {
                clearTimeout(handlerTimeout);
                // generateLink puede ser tardar mucho, así que no lo llamamos innecesariamente cuando se están cargando varias features
                handlerTimeout = setTimeout(function () {
                    delete self.map._controlStatesCache;
                    self.renderPromise().then(function () {
                        self.generateLink();
                    });
                }, 100);
            };
            self.map.on(Consts.event.LAYERADD, handler)
                .on(Consts.event.LAYERREMOVE, handler)
                .on(Consts.event.FEATUREADD, handler)
                .on(Consts.event.FEATUREREMOVE + ' ' + Consts.event.FEATURESCLEAR, handler);

            self.registeredListeners = true;
        }
    };

})();

const MapInfo = TC.control.MapInfo;
export default MapInfo;
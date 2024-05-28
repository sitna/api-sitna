import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Control from '../Control';
import Proxification from '../tool/Proxification';

TC.control = TC.control || {};

class MapInfo extends Control {

    async register(map) {
        await super.register.call(this, map);

        this.QR_MAX_URL_LENGTH = 150;
        this.SHORTEN_URL_LENGTH = 16000;

        this.exportsState = false;

        this.includeControls = this.options.includeControls === undefined || this.options.includeControls;

        return this;
    }

    exportControlStates() {
        if (this.map) {
            return this.map.exportControlStates();
        }
        return [];
    }

    importControlStates(stateArray) {
        if (this.map) {
            this.map.importControlStates(stateArray);
        }
    }

    exportState() {
        if (this.exportsState) {
            const state = {};
            if (this.featureToShare || this.sharedFeaturesLayer) {
                let layerState;
                state.id = this.id;
                if (this.featureToShare) {
                    const featureToShare = this.featureToShare.clone();
                    featureToShare.showsPopup = true;
                    layerState = this.featureToShare.layer.exportState({
                        features: [featureToShare]
                    });
                } else {
                    layerState = this.sharedFeaturesLayer.exportState();
                }
                state.features = layerState.features;
                if (layerState.crs) {
                    state.crs = layerState.crs;
                }
            }
            return state;
        }
        return null;
    }

    async importState(state) {
        if (this.map && state.features.length) {
            const layer = await this.map.addLayer({
                id: this.getUID(),
                owner: this,
                type: Consts.layerType.VECTOR,
                title: this.getLocaleString('foi'),
                stealth: true
            })
            this.sharedFeaturesLayer = layer;
            await layer.importState({ features: state.features, crs: state.crs });
            this.map.zoomToFeatures(layer.features);
        }
    }

    manageMaxLengthExceed() {
        throw "Falta implementación del método manageMaxLengthExceed";
    }

    async generateLink() {
        var currentUrl = window.location.href;
        var hashPosition = currentUrl.indexOf('#');
        if (hashPosition > 0) {
            currentUrl = currentUrl.substring(0, hashPosition);
        }

        if (this.extraParams) {
            // Hacemos merge de parámetros de URL
            var params = Util.getQueryStringParams(currentUrl);
            Util.extend(params, this.extraParams);
            var qsPosition = currentUrl.indexOf('?');
            if (qsPosition >= 0) {
                currentUrl = currentUrl.substring(0, qsPosition);
            }
            currentUrl = currentUrl.concat('?', Util.getParamString(params));
        }
        else {
            //eliminamos todos los paramaertos por querystring
            var start = currentUrl.indexOf('?');

            //Borramos los parámetros de la URL y dejamos sólo el hash
            if (start > 0) {
                currentUrl = currentUrl.replace(currentUrl.substring(start), '');
            }
        }

        const controlStates = this.includeControls ? this.exportControlStates() : [];
        if (!this.includeControls && this.exportsState && (this.featureToShare || this.sharedFeaturesLayer || this.caller && this.caller.toShare)) {
            if (this.caller && this.caller.toShare) {
                controlStates.push(this.caller.exportState());
            } else {
                controlStates.push(this.exportState());
            }
        }
        const extraStates = controlStates.length ? { ctl: controlStates } : undefined;

        var hashState = await this.map.getMapState({ extraStates: extraStates, cacheResult: this.includeControls });

        var url = currentUrl.concat("#", hashState);
        this.manageMaxLengthExceed({ browser: url.length > Consts.URL_MAX_LENGTH, qr: url.length > this.SHORTEN_URL_LENGTH });
        return url;
    }

    async shortenedLink() {
        let wait;

        //const generateLinkWithoutParams = async function () {
        //    var url = await this.generateLink();
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

        const onError = () => {
            this.map.toast(this.getLocaleString("urlTooLongForShortener"), { type: Consts.msgType.ERROR });
            this.map.getLoadingIndicator().removeWait(wait);
            return "";
        };

        const url = await this.generateLink();
        if (url.length > this.QR_MAX_URL_LENGTH && url.length < this.SHORTEN_URL_LENGTH) {

            wait = this.map.getLoadingIndicator().addWait();

            const response = await shortenUrl(url);
            if (response && response.responseText) {
                this.map.getLoadingIndicator().removeWait(wait);
                return response.responseText.replace('http://', 'https://');
            } else {
                return onError();
            }
        } else {
            if (url.length >= this.SHORTEN_URL_LENGTH) {
                return onError();
            }

            return "";
        }
    }

    async makeQRCode(codeContainer, width) {
        const modulePromise = import('qrcode');
        const url = await this.shortenedLink() || '';
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
            const { default: QRCode } = await modulePromise;
            img.src = await QRCode.toDataURL(url, options);
            codeContainer.appendChild(img);
            return img.src;
        }
    }

    drawScaleBarIntoCanvas(options = {}) {
        let canvas;
        let sb = this.map.getControlsByClass(TC.control.ScaleBar);
        if (sb.length === 0) {
            return null;
        }

        const drawFill = function (ctx, width, height) {
            var elem = document.getElementsByClassName(sb[0].CLASS);
            var fillnode = elem.item(0);
            var fillBoundingCR = Util.extend({}, fillnode.getBoundingClientRect());

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
        var boundingCR = Util.extend({}, node.getBoundingClientRect());

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
    }

    registerListeners() {
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
    }
}

MapInfo.prototype.CLASS = 'tc-ctl-mi';
TC.control.MapInfo = MapInfo;
export default MapInfo;
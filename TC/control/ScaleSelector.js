import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Scale from './Scale';

TC.control = TC.control || {};
TC.control.Scale = Scale;

TC.control.ScaleSelector = function () {
    var self = this;

    TC.control.Scale.apply(self, arguments);

    self.scales = null;
};

TC.inherit(TC.control.ScaleSelector, TC.control.Scale);

(function () {
    var ctlProto = TC.control.ScaleSelector.prototype;

    ctlProto.CLASS = 'tc-ctl-ss';

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-ss.hbs";

    ctlProto.render = function (callback) {
        var self = this;
        return self._set1stRenderPromise(new Promise(function (resolve, reject) {
            if (self.map) {
                if (!self.scales && self.map.options.resolutions) {
                    self.scales = self.map.options.resolutions.map(self.getScale, self);
                }
                var render = function () {
                    self.scales = self.map.wrap.getResolutions().map(self.getScale, self);
                    self.renderData({ scale: self.getScale(), screenSize: Cfg.screenSize, scales: self.scales }, function () {

                        self.div.querySelectorAll('option').forEach(function (option) {
                            option.textContent = '1:' + self.format(option.textContent.substr(2));
                        });

                        self.div.querySelector('input[type="button"]').addEventListener(Consts.event.CLICK, function () {
                            self.setScreenSize();
                        }, { passive: true });

                        self.div.querySelector('select').addEventListener('change', function () {
                            self.setScale(this.value);
                        });
                        if (TC.Util.isFunction(callback)) {
                            callback();
                        }
                        resolve();
                    }).catch(function (err) {
                        reject(err instanceof Error ? err : Error(err));
                    });
                };
                if (self.scales) {
                    render();
                }
                else {
                    self.map.wrap.getMap().then(render);
                }
            }
            else {
                reject(Error('ScaleSelector no registrado'));
            }
        }));
    };

    /*
    *  setScale: Sets the resolution of the map from a scale denominator and estimated screen DPI
    *  Parameters: number, the scale denominator
    *  Returns: number, the resolution
    */
    ctlProto.setScale = function (scale) {
        var self = this;
        var result = scale * .0254 / self.getDpi(Cfg.screenSize);
        if (window.devicePixelRatio) {
            result = result / window.devicePixelRatio;
        }
        if (self.metersPerDegree) {
            result = result / self.metersPerDegree;
        }
        self.map.wrap.setResolution(result);
        return result;
    };

})();

const ScaleSelector = TC.control.ScaleSelector;
export default ScaleSelector;
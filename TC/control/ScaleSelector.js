import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Util from '../Util';
import Scale from './Scale';

TC.control = TC.control || {};

class ScaleSelector extends Scale {
    scales = null;

    constructor() {
        super(...arguments);
        const self = this;
        self.div.classList.add(self.CLASS);
    }

    getClassName() {
        return 'tc-ctl-ss';
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-ss.mjs');
        self.template = module.default;
    }

    render(callback) {
        const self = this;
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
                        if (Util.isFunction(callback)) {
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
    }

/*
 *  setScale: Sets the resolution of the map from a scale denominator and estimated screen DPI
 *  Parameters: number, the scale denominator
 *  Returns: number, the resolution
 */
    setScale(scale) {
        const self = this;
        let result = scale * .0254 / self.getDpi(Cfg.screenSize);
        if (window.devicePixelRatio) {
            result = result / window.devicePixelRatio;
        }
        if (self.metersPerDegree) {
            result = result / self.metersPerDegree;
        }
        self.map.wrap.setResolution(result);
        return result;
    }

}


TC.control.ScaleSelector = ScaleSelector;
export default ScaleSelector;
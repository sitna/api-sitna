import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Util from '../Util';
import Control from '../Control';

TC.control = TC.control || {};

Consts.SCREEN_SIZE_KEY = 'TC.Map.screenSize';

class Scale extends Control {

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-scl.mjs');
        self.template = module.default;
    }

    render(callback) {
        const self = this;
        return self.renderData({ scale: self.getScale(), screenSize: Cfg.screenSize }, function () {

            const span = self.div.querySelector('span');
            span.textContent = '1:' + self.format(span.textContent.substr(2));

            self.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
        });
    }

    addUIEventListeners() {
        const self = this;
        self.div.querySelector('input[type="button"]').addEventListener(Consts.event.CLICK, function () {
            self.setScreenSize();
        }, { passive: true });
    }

    register(map) {
        const self = this;
        const result = super.register.call(self, map);
        let screenSize = Util.storage.getLocalValue(Consts.SCREEN_SIZE_KEY);
        if (screenSize) {
            Cfg.screenSize = screenSize;
        }
        self.render(function () {
            map.on(Consts.event.ZOOM, function () {
                delete self.metersPerDegree;
                self.update();
            });
        });

        return result;
    }

    update() {
        this.render();
    }

    /*
     *  setScreenSize: Prompts for screen size in inches, updates and stores value
     */
    setScreenSize() {
        const self = this;
        TC.prompt(self.getLocaleString('selectScreenSize'), Cfg.screenSize, function (value) {
            if (value) {
                Cfg.screenSize = parseFloat(value);
                Util.storage.setLocalValue(Consts.SCREEN_SIZE_KEY, Cfg.screenSize);
                self.update();
            }
        });
    }

    /*
     *  getScale: Gets scale denominator with a resolution or current map resolution and estimated screen DPI
     *  Parameters: number (optional), the resolution to get scale from. If no parameter is given, current map resolution is used
     *  Returns: number
     */
    getScale(resolution) {
        const self = this;
        var result = 0;
        var res = !resolution && self.map ? self.map.wrap.getResolution() : resolution;
        if (res) {
            result = res * self.getDpi(Cfg.screenSize) / .0254;
            if (window.devicePixelRatio) {
                result = result * window.devicePixelRatio;
            }
        }
        if (self.map && self.map.wrap.isGeo()) {
            if (!self.metersPerDegree) {
                var extent = self.map.getExtent();
                if (extent) {
                    self.metersPerDegree = Util.getMetersPerDegree(extent);
                }
            }
            if (self.metersPerDegree) {
                result = result * self.metersPerDegree;
            }
        }
        return result;
    }

    /*
     *  getDpi: Gets estimated DPI based on screen resolution and screenSize value
     *  Returns: number
     */
    getDpi(screenSize) {
        const self = this;
        self.dpi = Math.sqrt(screen.width * screen.width + screen.height * screen.height) / screenSize;
        return self.dpi;
    }

    format(number) {
        var n = (new Number(number)).toFixed(0);
        var a = [];
        while (n.length > 3) {
            var l = n.length - 3;
            a.unshift(n.substr(l));
            n = n.substr(0, l);
        }
        if (n) {
            a.unshift(n);
        }
        return a.join('.');
    }
}

Scale.prototype.CLASS = 'tc-ctl-scl';
TC.control.Scale = Scale;
export default Scale;
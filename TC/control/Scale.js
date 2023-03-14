import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Control from '../Control';

TC.control = TC.control || {};
TC.Control = Control;

Consts.SCREEN_SIZE_KEY = 'TC.Map.screenSize';

TC.control.Scale = function () {
    TC.Control.apply(this, arguments);
};

TC.inherit(TC.control.Scale, TC.Control);

(function () {
    var ctlProto = TC.control.Scale.prototype;

    ctlProto.CLASS = 'tc-ctl-scl';

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-scl.hbs";

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(self.renderData({ scale: self.getScale(), screenSize: Cfg.screenSize }, function () {

            const span = self.div.querySelector('span');
            span.textContent = '1:' + self.format(span.textContent.substr(2));

            self.div.querySelector('input[type="button"]').addEventListener(Consts.event.CLICK, function () {
                self.setScreenSize();
            }, { passive: true });

            if (TC.Util.isFunction(callback)) {
                callback();
            }
        }));
    };

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);
        var screenSize = TC.Util.storage.getLocalValue(Consts.SCREEN_SIZE_KEY);
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
    };

    ctlProto.update = function () {
        this.render();
    };

    /*
     *  setScreenSize: Prompts for screen size in inches, updates and stores value
     */
    ctlProto.setScreenSize = function () {
        var self = this;
        TC.prompt(self.getLocaleString('selectScreenSize'), Cfg.screenSize, function (value) {
            if (value) {
                Cfg.screenSize = parseFloat(value);
                TC.Util.storage.setLocalValue(Consts.SCREEN_SIZE_KEY, Cfg.screenSize);
                self.update();
            }
        });
    };

    /*
     *  getScale: Gets scale denominator with a resolution or current map resolution and estimated screen DPI
     *  Parameters: number (optional), the resolution to get scale from. If no parameter is given, current map resolution is used
     *  Returns: number
     */
    ctlProto.getScale = function (resolution) {
        var self = this;
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
                    self.metersPerDegree = TC.Util.getMetersPerDegree(extent);
                }
            }
            if (self.metersPerDegree) {
                result = result * self.metersPerDegree;
            }
        }
        return result;
    };

    /*
     *  getDpi: Gets estimated DPI based on screen resolution and screenSize value
     *  Returns: number
     */
    ctlProto.getDpi = function (screenSize) {
        var self = this;
        self.dpi = Math.sqrt(screen.width * screen.width + screen.height * screen.height) / screenSize;
        return self.dpi;
    };


    ctlProto.format = function (number) {
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
    };

})();

const Scale = TC.control.Scale;
export default Scale;
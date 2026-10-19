import ControlWrapper from '../wrap/Control.js';
import { Zoom, ZoomSlider } from 'ol/control.js';
import RenderEventType from 'ol/render/EventType.js';
import Consts from '../Consts.js';
export default class NavBarWrapper extends ControlWrapper {
    #zoomControl;
    #zoomSliderControl;

    async register(map) {

        const olMap = await super.register(map);
        const target = this.parent;
        this.#zoomControl = new Zoom({ target });
        // Ponemos para render una función modificada, para evitar que en los pinch zoom haya errores de este tipo:
        // AssertionError: Assertion failed: calculated value (1.002067782531452) ouside allowed range (0-1)

        this.#zoomSliderControl = new ZoomSlider({
            render: function (e) {
                if (!e.frameState || !e.frameState.viewState || olMap.getView().getMinResolution() <= e.frameState.viewState.resolution) {
                    // GLS: para evitar que el slider se configure en horizontal
                    //var render = function () {
                    //    if (this.element.offsetWidth > this.element.offsetHeight) {
                    //        if (!self.requestSliderSize) {
                    //            self.requestSliderSize = window.requestAnimationFrame(render.bind(this));
                    //        }

                    //        window.requestAnimationFrame(render.bind(this));
                    //    } else if (this.element.offsetWidth < this.element.offsetHeight) {
                    //        if (self.requestSliderSize) {
                    //            window.cancelAnimationFrame(self.requestSliderSize);
                    //            delete self.requestSliderSize;
                    //        }
                    //        ZoomSlider.prototype.render.call(this, e);
                    //    }
                    //};
                    //render.call(this);

                    ZoomSlider.prototype.render.call(this, e);
                }
            }
        });
        this.#zoomSliderControl.setTarget(target);

        olMap.addControl(this.#zoomSliderControl);
        olMap.addControl(this.#zoomControl);

        target.querySelectorAll('button').forEach((button) => {
            button.classList.add('tc-ctl-btn', 'tc-float-btn', this.parent.CLASS + '-btn');
            button.style.display = 'block';
            button.innerHTML = '';
            if (button.matches('.ol-zoomslider-thumb')) {
                button.setAttribute('title', "[[zoomBar]]");
            }
            if (button.matches('.ol-zoom-in')) {
                button.classList.add(this.parent.CLASS + '-btn-zoomin');
                //button.setAttribute('title', this.parent.getLocaleString('zoomIn'));
                button.setAttribute('title', "[[zoomIn]]");
            }
            if (button.matches('.ol-zoom-out')) {
                button.classList.add(this.parent.CLASS + '-btn-zoomout');
                //button.setAttribute('title', this.parent.getLocaleString('zoomOut'));
                button.setAttribute('title', "[[zoomOut]]");
            }
        });

        const zoomSlider = target.querySelector('.ol-zoomslider');
        zoomSlider.classList.add(this.parent.CLASS + '-bar');
        zoomSlider.querySelector('.ol-zoomslider-thumb').classList.add(this.parent.CLASS + '-slider');

        map.on(Consts.event.BASELAYERCHANGE, this.refresh.bind(this));
    }

    refresh() {
        /*
        var map = this.parent.map;
        var olMap = map.wrap.map;
    
        olMap.removeControl(self.zsCtl);
        var res = map.getResolutions();
        self.zsCtl = new ZoomSlider(
            {
                target: this.parent.div,
                "maxResolution": res[0],
                "minResolution": res[res.length - 1]
            });
    
        olMap.addControl(self.zsCtl);
        $(map.div).find('.ol-zoomslider').addClass(self.parent.CLASS + '-bar').find('.ol-zoomslider-thumb').addClass(self.parent.CLASS + '-slider');
        */
        const olMap = this.map;
        // Puede ser que se llame a refresh antes de que esté inicializado ZoomSlider. En ese caso llamamos a render que lo inicializa.
        // Como render necesita un ol.MapEvent, esperamos al evento POSTRENDER.

        this.parent.renderPromise().then(() => {
            if (this.#zoomSliderControl.sliderInitialized_) {
                const res = olMap.getView().getResolution();
                this.#zoomSliderControl.setThumbPosition_(res);
            }
            else {
                olMap.once(RenderEventType.POSTRENDER, function (e) {
                    this.#zoomSliderControl.render(e);
                });
            }
        });
    }
}
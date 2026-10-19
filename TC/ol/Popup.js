import { listen, unlistenByKey } from 'ol/events.js';
import { containsExtent } from 'ol/extent.js';
import ControlWrapper from '../wrap/Control.js';
import Consts from '../Consts.js';

Consts.event.PANANIMATIONSTART = 'pananimationstart.tc';
Consts.event.PANANIMATIONEND = 'pananimationend.tc';

export default class PopupWrapper extends ControlWrapper {

    constructor(parent) {
        super(parent);
        this.popup = null;
    }

    fitToView() {
        var self = this;
        var map = self.parent.map;
        var olMap = self.parent.map.wrap.map;

        var popupBoundingRect = self.parent.popupDiv.getBoundingClientRect();
        var mapBoundingRect = map.div.getBoundingClientRect();

        var topLeft = olMap.getCoordinateFromPixel([popupBoundingRect.left - mapBoundingRect.left, popupBoundingRect.top - mapBoundingRect.top]);
        var bottomRight = olMap.getCoordinateFromPixel([popupBoundingRect.right - mapBoundingRect.left, popupBoundingRect.bottom - mapBoundingRect.top]);

        if (!topLeft) {
            // El mapa no está listo (Su frameState no está establecido).
            //Pasa por ejemplo cuando se abre en una pestaña en segundo plano.
            return;
        }
        var west = topLeft[0];
        var north = topLeft[1];
        var east = bottomRight[0];
        var south = bottomRight[1];

        var popupExt = [west, south, east, north];
        var mapExt = map.getExtent();

        if (!containsExtent(mapExt, popupExt)) {
            var overflows = {
                left: Math.max(mapExt[0] - popupExt[0], 0),
                bottom: Math.max(mapExt[1] - popupExt[1], 0),
                right: Math.max(popupExt[2] - mapExt[2], 0),
                top: Math.max(popupExt[3] - mapExt[3], 0)
            };

            if (self.parent.dragged) {
                // Movemos el popup
                var newPos = self.popup.getPosition();
                if (overflows.right) {
                    newPos[0] = newPos[0] - overflows.right;
                }
                else if (overflows.left) {
                    newPos[0] = newPos[0] + overflows.left;
                }
                if (overflows.top) {
                    newPos[1] = newPos[1] - overflows.top;
                }
                else if (overflows.bottom) {
                    newPos[1] = newPos[1] + overflows.bottom;
                }
                var newPixelPos = olMap.getPixelFromCoordinate(newPos);
                newPixelPos[1] = olMap.getSize()[1] - newPixelPos[1];
                self.parent._previousContainerPosition = newPixelPos;
                (self.popup._oldUpdatePixelPosition || self.popup.updatePixelPosition).call(self.popup, newPos);
            }
            else {
                if (self.parent.isVisible()) {
                    // Movemos el mapa
                    var view = olMap.getView();
                    var ct = view.getCenter().slice();

                    if (overflows.top) ct[1] += overflows.top;
                    else if (overflows.bottom) ct[1] -= overflows.bottom;
                    if (overflows.right) ct[0] += overflows.right;
                    else if (overflows.left) ct[0] -= overflows.left;

                    view.animate({
                        center: ct, easing: function (percent) {
                            if (percent === 0) self.parent.map.trigger(Consts.event.PANANIMATIONSTART);
                            if (percent === 1) self.parent.map.trigger(Consts.event.PANANIMATIONEND);
                            return percent;
                        }
                    });
                }
            }
        }
    }

    setDragged(dragged) {
        const self = this;
        var popup = self.popup;
        //var view = popup.getMap().getView();
        //var onViewChange = function () {
        //    console.log(this.getCenter());
        //};
        if (dragged) {
            // Parcheamos funciones para que el popup no se mueva cuando cambiamos el extent del mapa
            if (!popup._oldUpdatePixelPosition) {
                popup._oldUpdatePixelPosition = popup.updatePixelPosition;
                popup.updatePixelPosition = function () {
                };
            }
            if (!popup._newHandleOffsetChanged) {
                popup._newHandleOffsetChanged = function () {
                    popup._oldUpdatePixelPosition();
                };
                if (self._offsetChangeListenerKey) {
                    unlistenByKey(self._offsetChangeListenerKey);
                }
                self._offsetChangeListenerKey = listen(
                    popup, 'change:offset',
                    popup._newHandleOffsetChanged, popup);
            }
            //view.on(['change:center','change:resolution'], onViewChange);
        }
        else {
            // Redefinimos las propiedades de posicionamiento porque al arrastrarlo, las hemos modificado.
            const containerStyle = popup.getElement().parentElement.style;
            // Estas dos líneas siguientes se aplicaban con la versión 6.12 de ol.Overlay.prototype.updateRenderedPosition
            //containerStyle.removeProperty('left');
            //containerStyle.removeProperty('top');
            // Estas cuatro líneas siguientes se aplican con la versión 5.33 de ol.Overlay.prototype.updateRenderedPosition
            containerStyle.setProperty('top', popup.rendered.top_);
            containerStyle.setProperty('bottom', popup.rendered.bottom_);
            containerStyle.setProperty('left', popup.rendered.left_);
            containerStyle.setProperty('right', popup.rendered.right_);

            delete self.parent._previousContainerPosition;
            // Deshacemos parcheo
            if (popup._oldUpdatePixelPosition) {
                popup.updatePixelPosition = popup._oldUpdatePixelPosition;
                delete popup._oldUpdatePixelPosition;
            }
            if (popup._newHandleOffsetChanged) {
                if (self._offsetChangeListenerKey) {
                    unlistenByKey(self._offsetChangeListenerKey);
                }
                self._offsetChangeListenerKey = listen(
                    popup, 'change:offset',
                    popup.handleOffsetChanged, popup);
                delete popup._newHandleOffsetChanged;
            }
            //view.un(['change:center', 'change:resolution'], onViewChange);
        }
    }
}   
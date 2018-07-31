TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.Consts.event.POPUP = 'popup.tc';
TC.Consts.event.POPUPHIDE = 'popuphide.tc';
TC.Consts.classes.DRAG = TC.Consts.classes.DRAG || 'tc-drag';
TC.Consts.classes.DRAGGED = TC.Consts.classes.DRAGGED || 'tc-dragged';
TC.Consts.classes.DRAGGABLE = TC.Consts.classes.DRAGGABLE || 'tc-draggable';

TC.control.Popup = function () {
    var self = this;

    TC.Control.apply(self, arguments);
    self.currentFeature = null;
    //self.wrap = { popup: null };    
    self.wrap = new TC.wrap.control.Popup(self);
};

TC.inherit(TC.control.Popup, TC.Control);

(function () {
    var ctlProto = TC.control.Popup.prototype;

    ctlProto.CLASS = 'tc-ctl-popup';

    ctlProto.render = function () {
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        $.when(map.wrap.addPopup(self)).then(function () {

            map.on(TC.Consts.event.LAYERVISIBILITY, function (e) {
                if (self.currentFeature && self.currentFeature.layer === e.layer && !e.layer.getVisibility()) {
                    self.hide();
                }
            });

            map.on(TC.Consts.event.LAYERREMOVE, function (e) {
                if (self.currentFeature && self.currentFeature.layer === e.layer) {
                    self.hide();
                }
            });

            map.on(TC.Consts.event.UPDATE, function () {
                if (!self.currentFeature || self.currentFeature._visibilityState === TC.Consts.visibility.NOT_VISIBLE) {
                    self.hide();
                }
            });

            map.on(TC.Consts.event.FEATUREREMOVE, function (e) {
                if (self.currentFeature === e.feature) {
                    self.hide();
                }
            });
        });
    };

    ctlProto.fitToView = function (delayed) {
        var self = this;
        if (delayed) {
            setTimeout(function () {
                self.wrap.fitToView();
            }, 1000);
        }
        else {
            self.wrap.fitToView();
        }
    };

    ctlProto.hide = function () {
        var self = this;
        if (self.map) {
            self.map.wrap.hidePopup(self);
            self.setDragged(false);
            self.map.$events.trigger($.Event(TC.Consts.event.POPUPHIDE, { control: self }));
        }
    };

    ctlProto.setDragged = function (dragged) {
        var self = this;
        self.dragged = dragged;
        if (self.$popupDiv) {
            self.$popupDiv.toggleClass(TC.Consts.classes.DRAGGED, dragged);
        }
        self.wrap.setDragged(dragged);
    };

    ctlProto.setDragging = function (dragging) {
        var self = this;
        if (dragging) {
            self.setDragged(true);
        }
        self.$popupDiv.toggleClass(TC.Consts.classes.DRAG, dragging);
    };

    ctlProto.isVisible = function () {
        var self = this;

        return self.$popupDiv && self.$popupDiv.hasClass(TC.Consts.classes.VISIBLE);
    };

})();
TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.Consts.event.POPUP = TC.Consts.event.POPUP || 'popup.tc';
TC.Consts.event.POPUPHIDE = TC.Consts.event.POPUPHIDE || 'popuphide.tc';
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
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);
        const deferred = $.Deferred();

        $.when(result, map.wrap.addPopup(self)).then(function () {

            map.on(TC.Consts.event.VIEWCHANGE, function () {
                if (map.view === TC.Consts.view.PRINTING) {
                    if (self.isVisible()) {
                        self.hide();
                    }
                }
            });

            map.on(TC.Consts.event.LAYERVISIBILITY, function (e) {
                if (self.currentFeature && self.currentFeature.layer === e.layer && !e.layer.getVisibility()) {
                    if (self.isVisible()) {
                        self.hide();
                    }
                }
            });

            map.on(TC.Consts.event.LAYERREMOVE, function (e) {
                if (self.currentFeature && self.currentFeature.layer === e.layer) {
                    if (self.isVisible()) {
                        self.hide();
                    }
                }
            });

            map.on(TC.Consts.event.UPDATE, function () {
                if (!self.currentFeature || self.currentFeature._visibilityState === TC.Consts.visibility.NOT_VISIBLE) {
                    if (self.isVisible()) {
                        self.hide();
                    }
                }
            });

            map.on(TC.Consts.event.FEATUREREMOVE, function (e) {
                if (self.currentFeature === e.feature) {
                    if (self.isVisible()) {
                        self.hide();
                    }
                }
            });

            deferred.resolve(self);
        });

        return deferred.promise();
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

    ctlProto.getContainerElement = function () {
        return this.$contentDiv ? this.$contentDiv.get(0) : null;
    };

    ctlProto.getMenuElement = function () {
        return this.$menuDiv ? this.$menuDiv.get(0) : null;
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
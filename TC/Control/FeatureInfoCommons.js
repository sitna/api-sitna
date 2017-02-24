TC.control = TC.control || {};

if (!TC.control.Click) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/Click.js');
}

TC.control.FeatureInfoCommons = function () {
    var self = this;
    TC.control.Click.apply(self, arguments);

    self._$dialogDiv = $(TC.Util.getDiv(self.options.dialogDiv));
    if (!self.options.dialogDiv) {
        self._$dialogDiv.appendTo('body');
    }
};

(function () {

    var liSelector = 'ul.tc-ctl-finfo-features li';

    var downplayFeatures = function (ctl) {
        ctl.popup.$popupDiv.find('ul.' + ctl.CLASS + '-services li')
            .removeClass(TC.Consts.classes.CHECKED)
            .removeClass(TC.Consts.classes.DISABLED)
            .removeClass(TC.Consts.classes.FROMLEFT)
            .removeClass(TC.Consts.classes.FROMRIGHT);
    };

    var highlightFeature = function (ctl, delta) {
        if (!ctl._zooming) {
            var feature;
            var $featureLi;
            var $layerLi;
            var $serviceLi;
            // this puede ser o el elemento HTML de la lista correspondiente a la feature o la feature en sí
            if (this instanceof TC.Feature) {
                feature = this;
                ctl.popup.$popupDiv.find(liSelector).each(function (idx, li) {
                    var $currentFeatureLi = $(li);
                    var $currentLayerLi = $currentFeatureLi.parents('li').first();
                    var $currentServiceLi = $currentLayerLi.parents('li').first();
                    var feat = ctl.getFeature(ctl.info, $currentServiceLi.index(), $currentLayerLi.index(), $currentFeatureLi.index());
                    if (feat === feature) {
                        $featureLi = $currentFeatureLi;
                        $layerLi = $currentLayerLi;
                        $serviceLi = $currentServiceLi;
                    }
                });
            }
            else {
                $featureLi = $(this);
            }
            $layerLi = $layerLi || $featureLi.parents('li').first();
            $serviceLi = $serviceLi || $layerLi.parents('li').first();

            downplayFeatures(ctl);
            $featureLi.addClass(TC.Consts.classes.CHECKED);
            $layerLi.addClass(TC.Consts.classes.CHECKED);
            $serviceLi.addClass(TC.Consts.classes.CHECKED);
            if (delta > 0) {
                $featureLi.addClass(TC.Consts.classes.FROMLEFT);
                $layerLi.addClass(TC.Consts.classes.FROMLEFT);
                $serviceLi.addClass(TC.Consts.classes.FROMLEFT);
            }
            else if (delta < 0) {
                $featureLi.addClass(TC.Consts.classes.FROMRIGHT);
                $layerLi.addClass(TC.Consts.classes.FROMRIGHT);
                $serviceLi.addClass(TC.Consts.classes.FROMRIGHT);
            }
            feature = feature || ctl.getFeature(ctl.info, $serviceLi.index(), $layerLi.index(), $featureLi.index());
            var features = ctl.layer.features.slice();
            for (var i = 0; i < features.length; i++) {
                var f = features[i];
                if (f !== ctl.marker) {
                    ctl.layer.removeFeature(f);
                }
            }
            if (feature && feature.geometry) {
                ctl.layer.addFeature(feature);
            }
            else {
                $featureLi.addClass(TC.Consts.classes.DISABLED);
            }
        }
    };

    var getNextLi = function (ctl, delta) {
        var $lis = ctl.popup.$popupDiv.find('ul.' + ctl.CLASS + '-features > li');
        var length = $lis.length;
        var $checkedLi = $lis.filter('.' + TC.Consts.classes.CHECKED);
        var checkedIdx = $lis.index($checkedLi.get(0));
        return $lis.get((checkedIdx + delta + length) % length);
    }

    TC.inherit(TC.control.FeatureInfoCommons, TC.control.Click);

    var ctlProto = TC.control.FeatureInfoCommons.prototype;

    ctlProto.CLASS = 'tc-ctl-abstract-finfo';

    ctlProto.render = function (callback) {
        var self = this;
        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv
                .html(html)
                .on(TC.Consts.event.CLICK, 'button[data-format]', function (e) {
                    TC.Util.closeModal();
                    var feature = self.layer.features[self.layer.features.length - 1];
                    self.map.exportFeatures([feature], {
                        fileName: feature.id,
                        format: $(e.target).data('format')
                    });
                });

        });
    };

    ctlProto.markerStyle = {
        cssClass: TC.Consts.classes.POINT,
        anchor: [0.5, 0.5],
        width: 15,
        height: 15
    };

    ctlProto.onShowPopUp = function (e) {
        var self = this;
        var map = self.map;
        var transitionEnd = 'transitionend.tc';
        if (e.control === self.popup) {

            var $popupDiv = self.popup.$popupDiv;

            // Añadimos eventos si no están añadidos de antes
            var handlerKey = 'ficHandlers';
            var hasHandlers = $popupDiv.data(handlerKey);
            if (!hasHandlers) {
                var selector;
                // Evento para resaltar una feature
                var events = 'click'; // En iPad se usa click en vez de touchstart para evitar que se resalte una feature al hacer scroll
                $popupDiv.on(events, liSelector, function (e) {
                    highlightFeature.call(this, self);
                });

                events = 'mouseover';
                var mouseoverTimeout;
                $popupDiv.on(events, liSelector, function (e) {
                    var that = this;
                    clearTimeout(mouseoverTimeout);
                    mouseoverTimeout = setTimeout(function () { // El timeout es para evitar el parpadeo al pasar el ratón por encima del acordeón
                        highlightFeature.call(that, self);
                    }, 50);
                });

                events = 'mouseout';
                $popupDiv.on(events, liSelector, function (e) {
                    clearTimeout(mouseoverTimeout);
                });

                // Evento para ir a la siguiente feature
                events = TC.Consts.event.CLICK;
                selector = '.' + self.CLASS + '-btn-next';
                $popupDiv.on(events, selector, function (e) {
                    highlightFeature.call(getNextLi(self, 1), self, 1);
                    return false;
                });

                // Evento para ir a la feature anterior
                selector = '.' + self.CLASS + '-btn-prev';
                $popupDiv.on(events, selector, function (e) {
                    highlightFeature.call(getNextLi(self, -1), self, -1);
                    return false;
                });

                // Evento para desplegar/replegar features de capa
                selector = 'ul.' + self.CLASS + '-layers h4';
                $popupDiv.on(events, selector, function (e) {
                    var $li = $(e.target).parent();
                    if ($li.hasClass(TC.Consts.classes.CHECKED)) {
                        // Si no está en modo móvil ocultamos la capa
                        if ($popupDiv.find('.tc-ctl-finfo-btn-next').css('display') === 'none') {
                            downplayFeatures(self);
                        }
                    }
                    else {
                        highlightFeature.call($li.find(liSelector).first()[0], self);
                        self.popup.fitToView(true);
                    }
                });

                // Evento para activar botones de herramientas
                selector = '.' + self.CLASS + '-tools-btn';
                $popupDiv.on(events, selector, function (e) {
                    TC.Util.showModal(self._$dialogDiv.find('.' + self.CLASS + '-dialog'), {
                        openCallback: function () {
                            self.onShowModal();
                        }
                    });
                });

                $popupDiv.data(handlerKey, true);
            }

            if (self.info) {
                if (self.info.defaultFeature) {
                    highlightFeature.call(self.info.defaultFeature, self);
                }
                else {
                    highlightFeature.call($popupDiv.find(liSelector).first()[0], self);
                }
            }
            //ajustar el ancho para que no sobre a la derecha
            self.fitSize();

            $popupDiv.find('table').on("click", function (e) {
                if ($(this).parent().hasClass(TC.Consts.classes.DISABLED))
                    return;
                if (self.layer.features[1]) { // 0: punto de pulsación, 1: feature de interés
                    // Proceso para desactivar highlightFeature mientras hacemos zoom
                    var zoomHandler = function zoomHandler() {
                        self._zooming = false;
                        map.off(TC.Consts.event.ZOOM, zoomHandler);
                    }
                    map.on(TC.Consts.event.ZOOM, zoomHandler);
                    self.zooming = true;
                    ///////
                    map.zoomToFeatures([self.layer.features[1]], { animate: true });
                }
                e.stopPropagation();
            });
            $popupDiv.find('table a').on("click", function (e) {
                e.stopPropagation();
            });
        }
    };

    ctlProto.onShowModal = function () {

    };

    ctlProto.highlightFeature = function (feature) {
        highlightFeature.call(feature, this);
    };

    ctlProto.fitSize = function () {
        var self = this;
        var div = self.popup.$popupDiv;
        var max = 0;
        //medir la máxima anchura de <ul>
        div.find(".tc-ctl-finfo-features li").each(function (ix, elto) {
            var x = self;
            max = Math.max(max, $(elto).position().left + $(elto).width());
        });

        //alert("max=" + max);
        if (max) div.width(max + 50);
    };

    ctlProto.countFeatures = function (e) {
        var sum = 0;
        for (var i = 0; i < e.services.length; i++) {
            e.services[i].layers.forEach(function (ly) { sum += ly.features.length; });
        }
        return sum;
    };

    ctlProto.getFeature = function (info, serviceIdx, layerIdx, featureIdx) {
        var result;
        if (info) {
            result = info.services[serviceIdx];
            if (result) {
                result = result.layers[layerIdx];
                if (result) {
                    result = result.features[featureIdx];
                }
            }
        }
        return result;
    };

    ctlProto.getFeatureIdx = function (info, serviceIdx, layerIdx, featureIdx) {
        var result = -1;
        if (info) {
            for (var i = 0; i < serviceIdx; i++) {
                var service = info.services[i];
                var maxj = i === serviceIdx - 1 ? layerIdx : service.layers.length;
                for (var j = 0; j < maxj; j++) {
                    var layer = service.layers[j];
                    var maxk = j === layerIdx - 1 ? featureIdx : layer.features.length;
                    for (var k = 0; k < maxk; k++) {
                        result = result + 1;
                    }
                }
            }
        }
        return result;
    };

    ctlProto.beforeGetFeatureInfo = function (e) {
        var self = this;
        if (self.popup && self.popup.isVisible()) {
            self.popup.hide();
        }
        if (e.control === self && self.map && self.layer) {
            self.lastFeatureCount = null;

            var title = self.getLocaleString('featureInfo');
            self.layer.clearFeatures();
            self.info = null;

            //aquí se pone el puntito temporal
            $.when(self.layer.addMarker(self.map.getCoordinateFromPixel(e.xy)
                                   , $.extend({}, self.map.options.styles.marker, self.markerStyle, { title: title, set: title })
                   )
           ).then(function (marker) {
               //cuando se queda el puntito es porque esto sucede tras el cierre de la popup
               //o sea
               //lo normal es que primero se ejecute esto, y luego se procesen los eventos FEATUREINFO o NOFEATUREINFO
               //pero en el caso raro (la primera vez), ocurre al revés. Entonces, ya se habrá establecido lastFeatureCount (no será null)
               if (self.lastFeatureCount === null) {
                   self.map.putLayerOnTop(self.layer);
                   self.marker = marker;
               }
               else {
                   self.layer.clearFeatures();
               }
           });
        }
        else
            if (self.popup) {
                self.popup.hide();
            }
    };

})();

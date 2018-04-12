TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

(function () {

    TC.control.ProjectionSelector = function () {
        const self = this;

        TC.Control.apply(self, arguments);

        self._cssClasses = {
            LOAD_CRS_BUTTON: self.CLASS + '-crs-btn-load',
            CRS_DIALOG: self.CLASS + '-crs-dialog',
            CRS_LIST: self.CLASS + '-crs-list',
            CURRENT_CRS_NAME: self.CLASS + '-cur-crs-name',
            CURRENT_CRS_CODE: self.CLASS + '-cur-crs-code',
            CHANGE: self.CLASS + '-change',
            NO_CHANGE: self.CLASS + '-no-change'
        };

        self._$dialogDiv = $(TC.Util.getDiv(self.options.dialogDiv));
        if (!self.options.dialogDiv) {
            self._$dialogDiv.appendTo('body');
        }

        self._$dialogDiv
            .on(TC.Consts.event.CLICK, 'button', function (e) {
                const $btn = $(e.target);
                const crs = $btn.data(_dataKeys.PROJCODE);
                if (crs) {
                    self.setProjection({
                        crs: crs,
                        allowFallbackLayer: true
                    });
                }
            })
            .on(TC.Consts.event.CLICK, 'button.' + self._cssClasses.LOAD_CRS_BUTTON, function (e) {
                self.loadFallbackProjections();
            });
    };

    TC.inherit(TC.control.ProjectionSelector, TC.Control);

    const ctlProto = TC.control.ProjectionSelector.prototype;

    ctlProto.CLASS = 'tc-ctl-projs';

    const _dataKeys = {
        LAYER: 'tcLayer',
        FALLBACK_LAYER: 'tcFallbackLayer',
        PROJCODE: 'tcProjCode'
    };

    ctlProto.render = function (callback) {
        const self = this;
        TC.Control.prototype.render.call(self, callback);

        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv.html(html);
        });
    };

    ctlProto.getAvailableCRS = function (options) {
        return this.map.getCompatibleCRS({ includeFallbacks: true })
    };

    ctlProto.showProjectionChangeDialog = function (options) {
        const self = this;

        const $dialog = self._$dialogDiv.find('.' + self._cssClasses.CRS_DIALOG);
        const $body = $dialog.find('.tc-modal-body').addClass(TC.Consts.classes.LOADING);
        const $ul = $body
            .find('ul.' + self._cssClasses.CRS_LIST)
            .empty();
        const blFirstOption = self.map.baseLayer.firstOption || self.map.baseLayer;
        const blFallback = blFirstOption.getFallbackLayer();
        const blCRSList = blFirstOption.getCompatibleCRS();

        const loadProjs = function () {
            self.map.loadProjections({
                crsList: self.getAvailableCRS(options),
                orderBy: 'name'
            }).then(function (projList) {
                var hasFallbackCRS = false;
                projList
                    .forEach(function (projObj) {
                        if (TC.Util.CRSCodesEqual(self.map.crs, projObj.code)) {
                            $dialog.find('.' + self._cssClasses.CURRENT_CRS_NAME).html(projObj.name);
                            $dialog.find('.' + self._cssClasses.CURRENT_CRS_CODE).html(projObj.code);
                        }
                        else {
                            const $button = $('<button>')
                                .html(projObj.name + ' (' + projObj.code + ')')
                                .data(_dataKeys.PROJCODE, projObj.code);
                            const $li = $('<li>').append($button);
                            if (blCRSList.filter(function (crs) {
                                return TC.Util.CRSCodesEqual(crs, projObj.code)
                            }).length === 0) {
                                // Es un CRS del fallback
                                hasFallbackCRS = true;
                                $li.addClass(TC.Consts.classes.HIDDEN);
                                $button.addClass(TC.Consts.classes.WARNING);
                            }
                            $ul.append($li);
                        }
                    });
                if (hasFallbackCRS) {
                    $ul
                        .append($('<li>')
                            .append($('<button>')
                                .addClass(self._cssClasses.LOAD_CRS_BUTTON)
                                .html(self.getLocaleString('showOnTheFlyProjections'))));
                }

                // Mostramos un aviso si no hay CRS compatibles
                if ($ul.find('li').length === 0) {
                    $ul.append($('<li>').append(self.getLocaleString('thereAreNoCompatibleCRS')));
                }
                const $visibleLi = $ul.find('li').not('.' + TC.Consts.classes.HIDDEN);
                $dialog.find('.' + self._cssClasses.CHANGE).css('display', $visibleLi.length > 1 ? '' : 'none');
                $dialog.find('.' + self._cssClasses.NO_CHANGE).css('display', $visibleLi.length > 1 ? 'none' : '');
                $dialog.find('ul.' + self._cssClasses.CRS_LIST).css('display', $visibleLi.length > 0 || hasFallbackCRS ? '' : 'none');
                $body.removeClass(TC.Consts.classes.LOADING);
            });
        };

        if (blFallback) {
            blFallback.getCapabilitiesPromise().then(loadProjs);
        }
        else {
            loadProjs();
        }
        TC.Util.showModal($dialog, options);
    };

    ctlProto.setProjection = function (options) {
        const self = this;
        options = options || {};

        TC.loadProjDef({
            crs: options.crs,
            callback: function () {
                self.map.setProjection(options);
            }
        });
    };

    ctlProto.loadFallbackProjections = function () {
        const self = this;
        const $li = self._$dialogDiv
            .find('.' + self._cssClasses.CRS_DIALOG)
            .find('ul.' + self._cssClasses.CRS_LIST + ' li')
            .removeClass(TC.Consts.classes.HIDDEN);
        $li
            .has('button.' + self._cssClasses.LOAD_CRS_BUTTON)
            .addClass(TC.Consts.classes.HIDDEN);
        self._$dialogDiv
            .find('p.' + TC.Consts.classes.WARNING)
            .removeClass(TC.Consts.classes.HIDDEN);
        self._$dialogDiv.find('.' + self._cssClasses.CHANGE).css('display', $li.length > 1 ? '' : 'none');
        self._$dialogDiv.find('.' + self._cssClasses.NO_CHANGE).css('display', $li.length > 1 ? 'none' : '');
    };

})();

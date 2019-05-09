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

        self._dialogDiv = TC.Util.getDiv(self.options.dialogDiv);
        self._$dialogDiv = $(self._dialogDiv);
        if (!self.options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }

        self._dialogDiv.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector('button:not(.' + self._cssClasses.LOAD_CRS_BUTTON + ')', function (e) {
            const crs = e.target.dataset.crsCode;
            if (crs) {
                self.setProjection({
                    crs: crs,
                    allowFallbackLayer: true
                });
            }
        }));

        self._dialogDiv.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector('button.' + self._cssClasses.LOAD_CRS_BUTTON, function (e) {
            self.loadFallbackProjections();
        }));
    };

    TC.inherit(TC.control.ProjectionSelector, TC.Control);

    const ctlProto = TC.control.ProjectionSelector.prototype;

    ctlProto.CLASS = 'tc-ctl-projs';

    const _dataKeys = {
        LAYER: 'tcLayer',
        FALLBACK_LAYER: 'tcFallbackLayer'
    };

    ctlProto.render = function (callback) {
        const self = this;
        const result = TC.Control.prototype.render.call(self, callback);

        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;
        });
        return result;
    };

    ctlProto.getAvailableCRS = function (options) {
        return this.map.getCompatibleCRS({ includeFallbacks: true })
    };

    ctlProto.showProjectionChangeDialog = function (options) {
        const self = this;

        const dialog = self._dialogDiv.querySelector('.' + self._cssClasses.CRS_DIALOG);
        const body = dialog.querySelector('.tc-modal-body');
        body.classList.add(TC.Consts.classes.LOADING);
        const ul = body.querySelector('ul.' + self._cssClasses.CRS_LIST);
        ul.innerHTML = '';
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
                            dialog.querySelector('.' + self._cssClasses.CURRENT_CRS_NAME).textContent = projObj.name;
                            dialog.querySelector('.' + self._cssClasses.CURRENT_CRS_CODE).textContent = projObj.code;
                        }
                        else {
                            const button = document.createElement('button');
                            button.textContent = projObj.name + ' (' + projObj.code + ')';
                            button.dataset.crsCode = projObj.code;
                            const li = document.createElement('li');
                            li.appendChild(button);
                            if (blCRSList.filter(function (crs) {
                                return TC.Util.CRSCodesEqual(crs, projObj.code)
                            }).length === 0) {
                                // Es un CRS del fallback
                                hasFallbackCRS = true;
                                li.classList.add(TC.Consts.classes.HIDDEN);
                                button.classList.add(TC.Consts.classes.WARNING);
                            }
                            ul.appendChild(li);
                        }
                    });
                if (hasFallbackCRS) {
                    const li = document.createElement('li');
                    const button = document.createElement('button');
                    button.classList.add(self._cssClasses.LOAD_CRS_BUTTON);
                    button.innerHTML = self.getLocaleString('showOnTheFlyProjections');
                    li.appendChild(button);
                    ul.appendChild(li);
                }

                // Mostramos un aviso si no hay CRS compatibles
                if (ul.querySelectorAll('li').length === 0) {
                    const li = document.createElement('li');
                    li.innerHTML = self.getLocaleString('thereAreNoCompatibleCRS');
                    ul.appendChild(li);
                }
                const visibleLi = ul.querySelectorAll('li:not(.' + TC.Consts.classes.HIDDEN + ')');
                dialog.querySelectorAll('.' + self._cssClasses.CHANGE).forEach(function (elm) {
                    elm.style.display = visibleLi.length > 1 ? '' : 'none';
                });
                dialog.querySelectorAll('.' + self._cssClasses.NO_CHANGE).forEach(function (elm) {
                    elm.style.display = visibleLi.length > 1 ? 'none' : '';
                });
                dialog.querySelector('ul.' + self._cssClasses.CRS_LIST).style.display = visibleLi.length > 0 || hasFallbackCRS ? '' : 'none';
                body.classList.remove(TC.Consts.classes.LOADING);
            });
        };

        if (blFallback) {
            blFallback.getCapabilitiesPromise().then(loadProjs);
        }
        else {
            loadProjs();
        }
        TC.Util.showModal(dialog, options);
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
        const lis = self._dialogDiv
            .querySelector('.' + self._cssClasses.CRS_DIALOG)
            .querySelectorAll('ul.' + self._cssClasses.CRS_LIST + ' li');
        lis.forEach(function (li) {
            li.classList.remove(TC.Consts.classes.HIDDEN);
            if (li.querySelector('button.' + self._cssClasses.LOAD_CRS_BUTTON)) {
                li.classList.add(TC.Consts.classes.HIDDEN);
            }
        });
        self._dialogDiv.querySelectorAll('p.' + TC.Consts.classes.WARNING).forEach(function (p) {
            p.classList.remove(TC.Consts.classes.HIDDEN);
        })
        self._dialogDiv.querySelectorAll('.' + self._cssClasses.CHANGE).forEach(function (elm) {
            elm.style.display = lis.length > 1 ? '' : 'none';
        });
        self._dialogDiv.querySelectorAll('.' + self._cssClasses.NO_CHANGE).forEach(function (elm) {
            elm.style.display = lis.length > 1 ? 'none' : '';
        });
    };

})();

import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';

TC.control = TC.control || {};

const ProjectionSelector = function () {
    const self = this;

    Control.apply(self, arguments);

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
    if (window.$) {
        self._$dialogDiv = $(self._dialogDiv);
    }
    if (!self.options.dialogDiv) {
        document.body.appendChild(self._dialogDiv);
    }

    self._dialogDiv.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('button:not(.' + self._cssClasses.LOAD_CRS_BUTTON + ')', function (e) {
        const crs = e.target.dataset.crsCode;
        if (crs) {
            self.setProjection({
                crs: crs,
                allowFallbackLayer: true
            });
        }
    }), { passive: true });

    self._dialogDiv.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('button.' + self._cssClasses.LOAD_CRS_BUTTON, function () {
        self.loadFallbackProjections();
    }), { passive: true });
};

TC.inherit(ProjectionSelector, Control);

(function () {

    const ctlProto = ProjectionSelector.prototype;

    ctlProto.CLASS = 'tc-ctl-projs';

    ctlProto.render = async function (callback) {
        const self = this;
        await Control.prototype.render.call(self, callback);

        self._dialogDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-dialog', null);
    };

    ctlProto.getAvailableCRS = function (options) {
        return this.map.getCompatibleCRS(TC.Util.extend(options || {}, { includeFallbacks: true }));
    };

    ctlProto.showProjectionChangeDialog = function (options) {
        const self = this;

        const dialog = self._dialogDiv.querySelector('.' + self._cssClasses.CRS_DIALOG);
        const body = dialog.querySelector('.tc-modal-body');
        body.classList.add(Consts.classes.LOADING);
        const ul = body.querySelector('ul.' + self._cssClasses.CRS_LIST);
        ul.innerHTML = '';
        const blFirstOption = self.map.baseLayer.firstOption || self.map.baseLayer;
        const blFallback = blFirstOption.isRaster() ? blFirstOption.getFallbackLayer() : null;

        const loadProjs = function () {
            var crsList = [];
            var blCRSList = [];

            options = options || {};

            if (blFirstOption.isRaster()) {
                blCRSList = blFirstOption.getCompatibleCRS();
                crsList = self.getAvailableCRS(TC.Util.extend(options, {}));
            } else {
                blCRSList = self.map.baseLayers
                    .filter((layer) => {
                        return layer.isRaster();
                    })
                    .map((layer) => {
                        return layer.getCompatibleCRS({ normalized: true, includeFallback: true });
                    })
                    .reduce((prev, current) => {
                        return prev.concat(current.filter(l => prev.indexOf(l) < 0));
                    });

                const crsLists = (options.layer ? self.map.workLayers.concat(options.layer) : self.map.workLayers)
                    .filter(function (layer) {
                        return layer.isRaster();
                    })
                    .map(function (layer) {
                        return layer.getCompatibleCRS({ normalized: true, includeFallback: true });
                    });

                crsList = blCRSList.filter((crs) => {
                    return crsLists.every((elm) => {
                        return elm.indexOf(crs) > -1;
                    });
                });
            }

            self.map.loadProjections({
                crsList: crsList,
                orderBy: 'name'
            }).then(function (projList) {
                var hasFallbackCRS = false;
                var currentCRSName = dialog.querySelector('.' + self._cssClasses.CURRENT_CRS_NAME);
                var currentCRSCode = dialog.querySelector('.' + self._cssClasses.CURRENT_CRS_CODE);
                projList
                    .forEach(function (projObj) {
                        if (currentCRSName && currentCRSCode && TC.Util.CRSCodesEqual(self.map.crs, projObj.code)) {
                            currentCRSName.textContent = projObj.name;
                            currentCRSCode.textContent = projObj.code;
                        }
                        else {
                            const button = document.createElement('button');
                            button.setAttribute('type', 'button');
                            button.textContent = projObj.name + ' (' + projObj.code + ')';
                            button.dataset.crsCode = projObj.code;
                            const li = document.createElement('li');
                            li.appendChild(button);
                            if (blCRSList.filter(function (crs) {
                                return TC.Util.CRSCodesEqual(crs, projObj.code);
                            }).length === 0) {
                                // Es un CRS del fallback
                                hasFallbackCRS = true;
                                li.classList.add(Consts.classes.HIDDEN);
                                button.classList.add(Consts.classes.WARNING);
                            }
                            ul.appendChild(li);
                        }
                    });
                if (hasFallbackCRS) {
                    const li = document.createElement('li');
                    const button = document.createElement('button');
                    button.setAttribute('type', 'button');
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
                const visibleLi = ul.querySelectorAll('li:not(.' + Consts.classes.HIDDEN + ')');
                dialog.querySelectorAll('.' + self._cssClasses.CHANGE).forEach(function (elm) {
                    elm.style.display = visibleLi.length > 1 ? '' : 'none';
                });
                dialog.querySelectorAll('.' + self._cssClasses.NO_CHANGE).forEach(function (elm) {
                    elm.style.display = visibleLi.length > 1 ? 'none' : '';
                });
                dialog.querySelector('ul.' + self._cssClasses.CRS_LIST).style.display = visibleLi.length > 0 || hasFallbackCRS ? '' : 'none';
                body.classList.remove(Consts.classes.LOADING);
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
            li.classList.remove(Consts.classes.HIDDEN);
            if (li.querySelector('button.' + self._cssClasses.LOAD_CRS_BUTTON)) {
                li.classList.add(Consts.classes.HIDDEN);
            }
        });
        self._dialogDiv.querySelectorAll('p.' + Consts.classes.WARNING).forEach(function (p) {
            p.classList.remove(Consts.classes.HIDDEN);
        });
        self._dialogDiv.querySelectorAll('.' + self._cssClasses.CHANGE).forEach(function (elm) {
            elm.style.display = lis.length > 1 ? '' : 'none';
        });
        self._dialogDiv.querySelectorAll('.' + self._cssClasses.NO_CHANGE).forEach(function (elm) {
            elm.style.display = lis.length > 1 ? 'none' : '';
        });
    };

})();

TC.control.ProjectionSelector = ProjectionSelector;
export default ProjectionSelector;
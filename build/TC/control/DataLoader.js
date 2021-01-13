TC.control = TC.control || {};

if (!TC.control.TabContainer) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/TabContainer');
}

TC.control.DataLoader = function () {
    const self = this;

    TC.control.TabContainer.apply(self, arguments);

    self.controlOptions = [
        {
            title: 'addWMS',
            externalWMS: { suggestions: self.options.wmsSuggestions }            
        },
        {
            fileImport: {
                enableDragAndDrop: self.options.enableDragAndDrop
            }
        }
    ];
    self.defaultSelection = 0;
};

TC.inherit(TC.control.DataLoader, TC.control.TabContainer);

(function () {
    const ctlProto = TC.control.DataLoader.prototype;

    ctlProto.register = function (map) {
        const self = this;
        self.map = map;
        self.title = self.getLocaleString('addMaps');
        return new Promise(function (resolve, reject) {
            TC.control.TabContainer.prototype.register.call(self, map).then(ctl => {
                ctl.div.classList.add(self.CLASS + '-datldr');
                resolve(ctl);
            });
        })
    };

})();

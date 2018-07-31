TC.control = TC.control || {};

if (!TC.control.TabContainer) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/TabContainer');
}

TC.control.DataLoader = function () {
    const self = this;

    TC.control.TabContainer.apply(self, arguments);

    self.controlOptions = [
        {
            name: 'externalWMS',
            title: 'addWMS',
            options: {
                suggestions: self.options.wmsSuggestions
            }
        },
        {
            name: 'fileImport',
            options: {
                enableDragAndDrop: self.options.enableDragAndDrop
            }
        }
    ];
    self._ctlDeferreds.length = 2;
    self._ctlDeferreds[0] = $.Deferred();
    self._ctlDeferreds[1] = $.Deferred();
    self.defaultSelection = 0;
};

TC.inherit(TC.control.DataLoader, TC.control.TabContainer);

(function () {
    var ctlProto = TC.control.DataLoader.prototype;

    ctlProto.register = function (map) {
        const self = this;
        self.title = self.getLocaleString('addMaps');
        TC.control.TabContainer.prototype.register.call(self, map);
    };

})();

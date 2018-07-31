TC.control = TC.control || {};

if (!TC.control.WorkLayerManager) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/WorkLayerManager');
}

TC.control.ListTOC = TC.control.WorkLayerManager;
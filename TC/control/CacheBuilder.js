TC.control = TC.control || {};

if (!TC.control.OfflineMapMaker) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/OfflineMapMaker');
}

TC.control.CacheBuilder = TC.control.OfflineMapMaker;
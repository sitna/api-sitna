import ControlWrapper from '../wrap/Control.js';

const setMapSizeAndPosition = function (mainMap, map, denominator, idx) {
    const olMap = map.wrap.map;
    const viewport = olMap.getViewport();
    const mapRect = mainMap.div.getBoundingClientRect();
    let mapWidth, mapHeight;
    let isPortrait;
    if (mapRect.height > mapRect.width) {
        isPortrait = true;
        mapWidth = mapRect.width;
        mapHeight = mapRect.height / denominator;
    }
    else {
        isPortrait = false;
        mapWidth = mapRect.width / denominator;
        mapHeight = mapRect.height;
    }
    if (mainMap === map) {
        viewport.style[isPortrait ? 'height' : 'width'] = (100 / denominator) + "%";
        viewport.style[isPortrait ? 'width' : 'height'] = "100%";
        olMap.setSize([mapWidth, mapHeight]);
        //olMap.updateSize();
    }
    else {
        const mapStyle = map.div.style;
        mapStyle.width = mapWidth + 'px';
        mapStyle.height = mapHeight + 'px';
        const mapLeft = mapRect.left + 'px';
        const mapTop = mapRect.top + 'px';
        if (denominator === 1) {
            mapStyle.left = mapLeft;
            mapStyle.top = mapTop;
        }
        else {
            const percentage = ((idx + 1) * 100 / denominator) + "%";
            mapStyle.left = isPortrait ? mapLeft : percentage;
            mapStyle.top = isPortrait ? percentage : mapTop;
        }
        olMap.setSize([mapWidth, mapHeight]);
    }
};

export default class LayerComparerWrapper extends ControlWrapper {

    updateMapSizes() {
        const ctl = this.parent;
        let denominator = 1;
        if (ctl.currentView === ctl.constructor.view.SPLIT) {
            denominator = ctl.secondaryMaps.length + 1;
        }
        setMapSizeAndPosition(ctl.map, ctl.map, denominator);
        ctl.secondaryMaps.forEach(function (map, idx) {
            map.ready(function () {
                setMapSizeAndPosition(ctl.map, map, denominator, idx);
            });
        });
    }

    isInsideViewport(point, map) {
        map = map || this.parent.map;
        const vpRect = map.wrap.map.getViewport().getBoundingClientRect();
        const x = point[0];
        const y = point[1];
        return (x >= vpRect.left && x <= vpRect.left + vpRect.width &&
            y >= vpRect.top && y <= vpRect.top + vpRect.height);
    }
}

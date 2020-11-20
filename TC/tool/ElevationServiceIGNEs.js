TC.tool = TC.tool || {};

if (!TC.tool.ElevationService) {
    TC.syncLoadJS(TC.apiLocation + 'TC/tool/ElevationService');
}

TC.tool.ElevationServiceIGNEs = function (options) {
    const self = this;
    TC.tool.ElevationService.apply(self, arguments);
    self.url = self.options.url || '//servicios.idee.es/wcs-inspire/mdt';
    self.minimumElevation = self.options.minimumElevation || -9998;
    self.nativeCRS = 'EPSG:25830';
};

TC.inherit(TC.tool.ElevationServiceIGNEs, TC.tool.ElevationService);

(function () {
    const toolProto = TC.tool.ElevationServiceIGNEs.prototype;
    let proxificationTool;

    toolProto.request = function (options) {
        const self = this;
        options = options || {};
        if (options.coordinates.length === 1) {
            let point = options.coordinates[0];

            if (options.crs && options.crs !== self.nativeCRS) {
                point = TC.Util.reproject(point, options.crs, self.nativeCRS);
            }

            let coverageName = 'Elevacion25830_5';
            let coverageResolution = 3;
            const halfRes1 = coverageResolution / 2;
            const halfRes2 = coverageResolution - halfRes1;

            const bbox = [
                point[0] - halfRes1,
                point[1] - halfRes1,
                point[0] + halfRes2,
                point[1] + halfRes2
            ];
            const requestUrl = self.url + '?SERVICE=WCS&REQUEST=GetCoverage&VERSION=2.0.1' +
                '&SUBSET=' + encodeURIComponent('x,' + self.nativeCRS + '(' + bbox[0] + ',' + bbox[2] + ')') + 
                '&SUBSET=' + encodeURIComponent('y,' + self.nativeCRS + '(' + bbox[1] + ',' + bbox[3] + ')') + 
                '&COVERAGEID=' + encodeURIComponent(coverageName) +
                '&RESOLUTION=x(1)' + 
                '&RESOLUTION=y(1)' + 
                '&FORMAT=' + encodeURIComponent('application/asc') +
                '&EXCEPTIONS=XML';
            return new Promise(function (resolve, reject) {
                const endFn = function () {
                    proxificationTool
                        .fetch(requestUrl)
                        .then(r => resolve(r.responseText))
                        .catch(err => reject(Error(err)));
                };
                if (proxificationTool) {
                    endFn();
                }
                else {
                    TC.loadJS(
                        !TC.tool || !TC.tool.Proxification,
                        [TC.apiLocation + 'TC/tool/Proxification'],
                        function () {
                            proxificationTool = new TC.tool.Proxification(TC.proxify);
                            endFn();
                        }
                    )
                }
            });
        }

        return Promise.reject(new Error('ign.es elevation service supports only points'));
    };

    toolProto.parseResponse = function (response, options) {
        const self = this;
        const lines = response.split('\n');
        const nColsLine = lines.filter(line => line.indexOf('ncols') === 0)[0];
        const nCols = parseInt(nColsLine && nColsLine.substr(nColsLine.lastIndexOf(' ')));
        const nRowsLine = lines.filter(line => line.indexOf('nrows') === 0)[0];
        const nRows = parseInt(nColsLine && nRowsLine.substr(nRowsLine.lastIndexOf(' ')));
        if (nCols && nRows) {
            const xllCornerLine = lines.filter(line => line.indexOf('xllcorner') === 0)[0];
            const x = parseFloat(xllCornerLine && xllCornerLine.substr(xllCornerLine.lastIndexOf(' ')));
            const yllCornerLine = lines.filter(line => line.indexOf('yllcorner') === 0)[0];
            const y = parseFloat(yllCornerLine && yllCornerLine.substr(yllCornerLine.lastIndexOf(' ')));
            if (!isNaN(x) && !isNaN(y)) {
                const cellSizeIndex = lines.findIndex(line => line.indexOf('cellsize') === 0);
                let elevation = parseFloat(lines[cellSizeIndex + Math.round(nRows / 2)].trim().split(' ')[Math.round(nCols / 2) - 1]);
                if (isNaN(elevation)) {
                    elevation = null;
                }
                let point = options.coordinates[0].slice();
                point[2] = elevation;
                if (options.crs && options.crs !== self.nativeCRS) {
                    point = TC.Util.reproject(point, self.nativeCRS, options.crs);
                }
                return TC.tool.ElevationService.prototype.parseResponse.call(self, { coordinates: [point] }, options);
            }
        }
        return [];
    };
})();
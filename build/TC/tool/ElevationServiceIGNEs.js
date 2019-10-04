TC.tool = TC.tool || {};

if (!TC.tool.ElevationService) {
    TC.syncLoadJS(TC.apiLocation + 'TC/tool/ElevationService');
}

TC.tool.ElevationServiceIGNEs = function (options) {
    const self = this;
    TC.tool.ElevationService.apply(self, arguments);
    self.url = self.options.url || '//www.ign.es/wps-analisis/servicios';
    self.process = self.options.process || 'GetProfileTxt';
    self.minimumElevation = self.options.minimumElevation || -99998;
    self.serviceVersion = self.options.serviceVersion || '0.4.0';
    self.nativeCRS = 'EPSG:25830';
};

TC.inherit(TC.tool.ElevationServiceIGNEs, TC.tool.ElevationService);

(function () {
    const toolProto = TC.tool.ElevationServiceIGNEs.prototype;

    toolProto.request = function (options) {
        const self = this;
        options = options || {};
        var coordinateListArray;
        var isPolygon = false;
        switch (true) {
            case TC.Geometry.isPoint(options.coordinates):
                coordinateListArray = [[options.coordinates]];
                break;
            case TC.Geometry.isRing(options.coordinates):
                coordinateListArray = [options.coordinates];
                break;
            case TC.Geometry.isRingCollection(options.coordinates):
                coordinateListArray = options.coordinates;
                isPolygon = true;
                break;
            default:
                break;
        }
        if (options.crs && options.crs !== self.nativeCRS) {
            coordinateListArray = TC.Util.reproject(coordinateListArray, options.crs, self.nativeCRS);
        }
        const flatCoordinateListArray = [].concat.apply([], coordinateListArray);
        const dataInputs = {
            Profile: flatCoordinateListArray.map(function (coord) {
                return coord.join();
            }).join(),
            CRS: self.nativeCRS
        };
        if (options.sampleNumber) {
            const getDistance = function (p1, p2) {
                const dx = p2[0] - p1[0];
                const dy = p2[1] - p1[1];
                return Math.sqrt(dx * dx + dy * dy);
            };
            var totalDistance = 0;
            coordinateListArray.forEach(function (coordList) {
                totalDistance += coordList
                    .map(function (coord, i, arr) {
                        const prev = arr[i - 1];
                        if (prev) {
                            return getDistance(prev, coord);
                        }
                        return 0;
                    })
                    .reduce(function (prev, curr) {
                        return prev + curr;
                    }, 0);
                if (isPolygon) {
                    totalDistance += getDistance(coordList[coordList.length - 1], coordList[0]);
                }
            });

            dataInputs.Resolution = totalDistance / options.sampleNumber;
        }
        else if (options.resolution) {
            dataInputs.Resolution = options.resolution;
        }

        const bbox = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
        flatCoordinateListArray.forEach(function (coord) {
            bbox[0] = Math.min(coord[0], bbox[0]);
            bbox[1] = Math.min(coord[1], bbox[1]);
            bbox[2] = Math.max(coord[0], bbox[2]);
            bbox[3] = Math.max(coord[1], bbox[3]);
        });
        var coverageName;
        var coverageResolution;
        switch (true) {
            case dataInputs.Resolution >= 200 && dataInputs.Resolution < 500:
                coverageName = 'mdt:Elevacion25830_200';
                coverageResolution = 200;
                break;
            case dataInputs.Resolution >= 500 && dataInputs.Resolution < 1000:
                coverageName = 'mdt:Elevacion25830_500';
                coverageResolution = 500;
                break;
            case dataInputs.Resolution >= 1000:
                coverageName = 'mdt:Elevacion25830_1000';
                coverageResolution = 1000;
                break;
            default:
                coverageName = 'mdt:Elevacion25830_25';
                coverageResolution = 25;
                break;
        }
        dataInputs.URLCoverageServer = 'http://www.ign.es/wcs/mdt?SERVICE=WCS&amp;REQUEST=GetCoverage&amp;VERSION=1.0.0&amp;CRS=EPSG:25830&amp;BBOX=' +
            bbox.join() +
            '&amp;COVERAGE=' + coverageName + '&amp;RESX=' +
            coverageResolution +
            '&amp;RESY=' + coverageResolution +
            '&amp;FORMAT=ArcGrid&amp;EXCEPTIONS=XML';

        return new Promise(function (resolve, reject) {
            TC.tool.ElevationService.prototype.request.call(self, {
                dataInputs: dataInputs,
                process: self.process,
                contentType: false,
                output: {
                    uom: 'urn:ogc:def:dataType:OGC:0.0:Integer'
                }
            })
                .then(function (response) {
                    var xml;
                    try {
                        xml = new DOMParser().parseFromString(response, TC.Consts.mimeType.XML);
                    }
                    catch (error) {
                        reject(Error(error));
                    }
                    const urlElement = xml.getElementsByTagName("URL")[0];
                    if (urlElement) {
                        TC.ajax({
                            url: TC.proxify(urlElement.innerHTML),
                            method: 'GET',
                            contentType: false
                        }).then(function (response) {
                            resolve(response.data);
                        }, function (error) {
                            reject(Error(error));
                        });
                    }
                    else {
                        reject(Error('Servicio WPS del IGN no ha devuelto una respuesta rápida'));
                    }
                })
                .catch(function (error) {
                    reject(Error(error));
                });
        });
    };

    toolProto.parseResponse = function (response, options) {
        var self = this;
        var elevations = response.split('\n')
            .filter(function (elm, idx) {
                return idx > 0;
            })
            .filter(function (elm, idx) {
                return elm.length;
            })
            .map(function (line) {
                const values = line.split(';');
                var elevation = parseFloat(values[3]);
                if (isNaN(elevation)) {
                    elevation = null;
                }
                return [parseFloat(values[0]), parseFloat(values[1]), elevation];
            });
        if (options.crs && options.crs !== self.nativeCRS) {
            elevations = TC.Util.reproject(elevations, self.nativeCRS, options.crs);
        }
        return TC.tool.ElevationService.prototype.parseResponse.call(self, { coordinates: elevations }, options);
    };
})();
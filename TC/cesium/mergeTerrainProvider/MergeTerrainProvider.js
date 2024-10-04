/* MergeTerrainProvider */

import * as D3 from 'd3-polygon';
import { fromArrayBuffer } from 'geotiff';

const MergeTerrainProvider = function (options, view, fallbackOptions) {

    this.noDataValue = options.noDataValue;
    this.view = view;

    this.commutingProvidersReady = false;
    this.commutingProvidersPromises = cesium.when.defer();

    this.surfaceHasTilesToRender = cesium.when.defer();
    this.surfaceTilesToRender = 0;

    this.fallback = fallbackOptions.fallback || [];
    this.fallbackProvider = [];

    this.fallbackProvider = this.fallback.map(function (options, _index) {
        if (options.type === "WMTS" || (!options.type && options.url.indexOf("WMTS") >= 0)) {
            return new cesium.WMTSTerrainProvider(options, view);
        }
        //else if (options.type === "ARCGIS" || (!options.type && options.url.indexOf("ARCGIS") >= 0)) {
        //    return new cesium.ArcGISTiledElevationTerrainProvider(options);ogc
        //}
        else
            return new cesium.WCSTerrainProvider(options, view);
    });
    
    this.defaultFallbackProvider = new cesium.EllipsoidTerrainProvider();
        
    this.attributions = {};

    if (options.attributions) {
        this.attributions = options.attributions;
        this.view.map.trigger(SITNA.Consts.event.TERRAINPROVIDERADD, { terrainProvider: this });
    }

    if (!(options.url instanceof cesium.Resource)) {
        options.url = new cesium.Resource({
            url: options.url.trim()
        });
    }

    cesium.CesiumTerrainProvider.call(this, options);

    this.boundaries = Array.isArray(fallbackOptions.boundaries) ? fallbackOptions.boundaries : [fallbackOptions.boundaries];

    cesium.when.all([this._readyPromise, this.fallbackProvider[0].readyPromise, this.surfaceHasTilesToRender], function () {
        this.commutingProvidersReady = true;
        this.commutingProvidersPromises.resolve();
    }.bind(this))
};
(function () {

    MergeTerrainProvider.prototype = Object.create(cesium.CesiumTerrainProvider.prototype, {
        fallback: { /* array con las opciones de los servicios WCS */
            value: null,
            enumerable: true,
            configurable: true,
            writable: true
        },
        fallbackProvider: { /* array con los proveedores WCS */
            value: null,
            enumerable: true,
            configurable: true,
            writable: true
        },
        defaultFallbackProvider: { /* proveedor de último recurso */
            value: null,
            enumerable: true,
            configurable: true,
            writable: true
        },
        allReady: {
            get: function () {
                return this.commutingProvidersReady;
            }
        },
        allReadyPromise: {
            get: function () {
                return this.commutingProvidersPromises;
            }
        }
    });
    MergeTerrainProvider.prototype.constructor = MergeTerrainProvider;
        
    MergeTerrainProvider.prototype.isPointInDefaultBoundaries = function (cartographic) {
        var self = this;
        if (!self.boundaries.length)
            return true;
        return self.isPointInBoundaries(cartographic, self.boundaries[0]);
    };

    MergeTerrainProvider.prototype.isInDefaultBoundaries = function (x, y, level) {
        var self = this;
        if (!self.boundaries.length)
            return true;
        return self.isInBoundaries(x, y, level, self.boundaries[0]);
    };
    MergeTerrainProvider.prototype.isPointInBoundaries = function (cartographic, boundaries) {
        return boundaries.some((bound) => {
            return D3.polygonContains(bound, [cesium.Math.toDegrees(cartographic.longitude), cesium.Math.toDegrees(cartographic.latitude)])
        });
    };
    MergeTerrainProvider.prototype.isInBoundaries = function (x, y, level, boundaries) {
        var self = this;

        var toCheck = [];
        var rectangle = this.tilingScheme.tileXYToRectangle(x, y, level);

        toCheck.push(new cesium.Cartographic(rectangle.west, rectangle.south));
        toCheck.push(new cesium.Cartographic(rectangle.west, rectangle.north));
        toCheck.push(new cesium.Cartographic(rectangle.east, rectangle.south));
        toCheck.push(new cesium.Cartographic(rectangle.east, rectangle.north));

        for (var i = 0; i < toCheck.length; i++) {
            if (!self.isPointInBoundaries(toCheck[i], boundaries)) {
                return false;
            }
        }

        return true;
    };

    MergeTerrainProvider.prototype.getTileDataAvailable = function (x, y, level) {

        ///* la disponibilidad del globo depende de que haya tiles renderizados/pendientes de rederizar. Si resuelvo la promesa al instanciar, 
        //   no al pedir tiles, llega a usar el globo antes de estar disponible.  */
        if (this.surfaceTilesToRender > 5) {
            this.surfaceHasTilesToRender.resolve();
        }
        this.surfaceTilesToRender++;

        /* Si estamos en Navarra y el nivel que se va a pedir es mayor que el disponible en nuestro terreno nos ahorramos la petición */
        if (level > this._availability._maximumLevel && this.isInDefaultBoundaries(x, y, level)) {
            return false;
        }

        return true;
    };

    MergeTerrainProvider.prototype.getAttribution = function () {
        var self = this;

        return self.attributions;
    };

    MergeTerrainProvider.prototype.requestTileGeometry = function (x, y, level) {
                const self = this;
        let promise = cesium.when.defer();

        const manageAttributions = function (provider) {
            self.view.map.trigger(SITNA.Consts.event.TERRAINPROVIDERADD, { terrainProvider: provider });
        };

        const otherwise = function () {

            if (self.fallbackProvider) {
                //desechamos los que no está preparados
                const fallbackProvider = self.fallbackProvider.filter((fbp) => fbp.ready)
                    //buscamos el provider que corresponda
                    .find((fbp, index, arr) => {
                        return arr.length === 1 || (index + 1 === self.boundaries.length) || self.isInBoundaries(x, y, level, self.boundaries[index + 1])

                    })
                if (fallbackProvider) {
                    fallbackProvider.requestTileGeometry.apply(self, [x, y, level])
                        .then(function (terrainData) {
                            manageAttributions(fallbackProvider);
                            promise.resolve(terrainData);
                        }).otherwise(function () {
                            promise.resolve(self.defaultFallbackProvider.requestTileGeometry([x, y, level]));
                        });
                }
                else
                    promise.resolve(self.defaultFallbackProvider.requestTileGeometry([x, y, level]));
            }
            else
                promise.resolve(self.defaultFallbackProvider.requestTileGeometry([x, y, level]));
        };

        // así controlamos que las peticiones fuera de Navarra y mayor nivel que el soportado no se pidan y
        // vamos directamente al proveedor de respaldo.
        if (level > this._availability._maximumLevel) {
            otherwise();
        } else if (!this.isInDefaultBoundaries(x, y, level)) {
            otherwise();
        } else {
            cesium.CesiumTerrainProvider.prototype.requestTileGeometry.apply(self, [x, y, level])
                .then(function (args, terrainData) {
                    if (terrainData._minimumHeight === self.noDataValue) {
                        if (self.fallbackProvider && self.fallbackProvider[0].ready) {
                            self.fallbackProvider[0].requestTileGeometry.apply(self, args)
                                .then(function (terrainData) {
                                    manageAttributions(self.fallbackProvider[0]);
                                    promise.resolve(terrainData);
                                }).otherwise(function () {
                                    promise.resolve(self.defaultFallbackProvider.requestTileGeometry([x, y, level]));
                                });
                        } else {
                            promise.resolve(self.defaultFallbackProvider.requestTileGeometry([x, y, level]));
                        }
                    } else {
                        manageAttributions(self);
                        promise.resolve(terrainData);
                    }
                }.bind(this, arguments))
                .otherwise(otherwise);
        }

        return promise.then(function (terrainData) {
            return terrainData;
        });
    };

    MergeTerrainProvider.prototype.sampleTerrainMostDetailed = function (positions) {
        var rectangle = cesium.Rectangle.fromCartographicArray(positions);
        var toCheck = [cesium.Rectangle.center(rectangle),
        cesium.Rectangle.northeast(rectangle),
        cesium.Rectangle.northwest(rectangle),
        cesium.Rectangle.southeast(rectangle),
        cesium.Rectangle.southwest(rectangle)];
        
        if (toCheck.filter(async function (position) { return await !this.isPointInDefaultBoundaries(position); }.bind(this)).length === 0) {
            return cesium.sampleTerrainMostDetailed(this, positions);
        } else {
            return this.fallbackProvider[0].sampleTerrainMostDetailed(positions);
        }

    }
    cesium.MergeTerrainProvider = MergeTerrainProvider;


    const OGCTerrainProvider = function OGCTerrainProvider(description, view) {
        this.view = view;

        var deferred = cesium.when.defer();
        this._ready = false;
        this._readyPromise = deferred;

        if (!cesium.defined(description)) {
            throw new cesium.DeveloperError('description is required.');
        }

        this.description = description;
        this.url = description.url;
        this.layerName = description.layerName;

        var errorEvent = new cesium.Event();

        this._eventHelper = new cesium.EventHelper();

        var credit = description.credit;
        if (typeof credit === 'string') {
            credit = new cesium.Credit(credit);
        }

        this.tileCacheService = new TileCacheService(this.type + 'Tiles');
        this.tileCacheService.createDB();

        this.lastTile = undefined;
        this.ready = false;

        this.DefaultProvider = new cesium.EllipsoidTerrainProvider();

        Object.defineProperties(this, {
            errorEvent: {
                get: function () {
                    return errorEvent;
                }
            },
            credit: {
                get: function () {
                    return credit;
                }
            },
            hasVertexNormals: {
                get: function () {
                    return false;
                }
            },
            readyPromise: {
                get: function () {
                    return this._readyPromise.promise;
                }
            }
        });

        this._heightmapWidth = 65;

        this.noDataValue = description.noDataValue;

        // atribuciones
        this.urlofServer;
        if (cesium.defined(this.url)) {
            this.urlofServer = this.url;
            var index = this.urlofServer.lastIndexOf("?");
            if (index > -1) {
                this.urlofServer = this.urlofServer.substring(0, index);
            }
        }
        TerrainParser.apply(this, [this.getCapabilities()]);
        /**
            * static array where CRS availables for OGCHelper are defined
            */

        this.OGCHelper.CRS = [{
            name: "CRS:84",
            ellipsoid: cesium.Ellipsoid.WGS84,
            firstAxeIsLatitude: false,
            tilingScheme: cesium.GeographicTilingScheme,
            SupportedCRS: ["urn:ogc:def:crs:OGC:2:84"]
        }, {
            name: "EPSG:4258",
            ellipsoid: cesium.Ellipsoid.WGS84,
            firstAxeIsLatitude: true,
            tilingScheme: cesium.GeographicTilingScheme,
            SupportedCRS: ["urn:ogc:def:crs:EPSG::4258", "EPSG:4258", "IGNF:WGS84G"]
        },
        {
            name: "EPSG:4326",
            ellipsoid: cesium.Ellipsoid.WGS84,
            firstAxeIsLatitude: true,
            tilingScheme: cesium.GeographicTilingScheme,
            SupportedCRS: ["urn:ogc:def:crs:EPSG::4326", "EPSG:4326"]
        }, {
            name: "EPSG:3857",
            ellipsoid: cesium.Ellipsoid.WGS84,
            firstAxeIsLatitude: false,
            tilingScheme: cesium.WebMercatorTilingScheme,
            SupportedCRS: ["urn:ogc:def:crs:EPSG::3857", "EPSG:3857"]
        }, {
            name: "OSGEO:41001",
            ellipsoid: cesium.Ellipsoid.WGS84,
            firstAxeIsLatitude: false,
            tilingScheme: cesium.WebMercatorTilingScheme,
            SupportedCRS: ["urn:ogc:def:crs:EPSG::3857"]
        }];

        this.OGCHelper.FormatImage = [{
            format: "image/png",
            extension: "png"
        }, {
            format: "image/jpeg",
            extension: "jpg"
        }, {
            format: "image/jpeg",
            extension: "jpeg"
        }, {
            format: "image/gif",
            extension: "gif"
        }, {
            format: "image/png; mode=8bit",
            extension: "png"
        }, {
            format: "image/tiff",
            extension: "tiff"
        }, {
            format: "image/tiff",
            extension: "geotiff"
        },
        {
            format: "image/tiff",
            extension: "geotiffint16"
        },
        {
            format: "image/tiff",
            extension: "geotiff_rgb"
        },
        {
            format: "image/x-bil;bits=32",
            extension: "x-bil"
        }];

        this.format = this.OGCHelper.FormatImage.find((f) => f.extension === description.format.toLowerCase()).format;
    }
    OGCTerrainProvider.prototype.getAttribution = function () {
        var self = this;

        return self.attributions;
    };
    OGCTerrainProvider.prototype.OGCHelper = {};

    OGCTerrainProvider.TiledError = function () {
        console.log("TiledError");
    };

    OGCTerrainProvider.prototype.ImageToHeightmapTerrainData = async function (arrayBuffer, size, x, y, level) {
        if (this.format === "image/tiff")
            return await this.GeotiffToHeightmapTerrainData(arrayBuffer,x, y, level);
        //else if (this.format === "image/x-bil;bits=32")
        //    debugger;
        else
            return await imageToBuffer(arrayBuffer, {
                offset: 0,
                lowest: 0,
                highest: 3700
            }, size, true);


    }

    OGCTerrainProvider.prototype.GeotiffToHeightmapTerrainData = function (arrayBuffer, x, y, level) {       
        
        const promise = new Promise((resolve) => {
            cesium.createTaskProcessorWorker(async () => {
                const tiff = await fromArrayBuffer(arrayBuffer);
                const image = await tiff.getImage();
                resolve ((await image.readRasters())[0]);
            })({ data: {} });
        })
        return promise;

        //this.worker.postMessage({
        //    buffer: arrayBuffer,
        //    x: x,
        //    y: y,
        //    level: level
        //});
        //const key = level + "-" + x + "-" + y;
        //const promise = new Promise((resolve) => {
        //    this.workerCallsMap.set(key, resolve);
        //})
        //return promise;
    };

    OGCTerrainProvider.prototype.HeightmapTerrainData = function (heightBuffer, size, childrenMask) {
        if (typeof (size) == "number") {
            size = { width: size, height: size };
        }

        if (!cesium.defined(heightBuffer)) {
            throw new cesium.DeveloperError("no good size");
        }
        var optionsHeihtmapTerrainData = {
            buffer: heightBuffer,
            width: size.width,
            height: size.height,
            childTileMask: childrenMask
        };

        return new cesium.HeightmapTerrainData(optionsHeihtmapTerrainData);
    }


    /*
    https://github.com/xlhomme/WCSTerrainProvider/tree/master/
    Modificado por GLS
    WCSTerrainProvider  */
    /*
    Objeto del que heredarán WCSTerrainProvider y WMTSTerrainProvider
     */



    const WCSTerrainProvider = function WCSTerrainProvider(description, view) {

        this.parse = function (description) {
            var self = this;
            var resultat;
            description = cesium.defaultValue(description,
                cesium.defaultValue.EMPTY_OBJECT);
            if (cesium.defined(description.url)) {
                var urlofServer = description.url;
                var index = urlofServer.lastIndexOf("?");
                if (index > -1) {
                    urlofServer = urlofServer.substring(0, index);
                }
                // get version of wcs
                if (!cesium.defined(description.layerName)) {
                    throw new cesium.DeveloperError(
                        'description.layerName is required.');
                }

                var urlDescribeCoverage = urlofServer + '?SERVICE=WCS&VERSION=1.0.0&request=DescribeCoverage&Coverage=' + description.layerName;

                if (cesium.defined(description.proxy)) {
                    urlDescribeCoverage = description.proxy.getURL(urlDescribeCoverage);
                }

                resultat = cesium.when(cesium.Resource.fetchXML({
                    url: urlDescribeCoverage
                }), function (xml) {
                    return self.getDescribeCoverage(xml, description);
                }).otherwise(function () {
                    return cesium.when.defer.resolve(null);
                });


            } else if (cesium.defined(description.xml)) {
                resultat = self.getDescribeCoverage(description.xml, description);
            } else {
                throw new cesium.DeveloperError(
                    'either description.url or description.xml are required.');
            }
            resultat.type = "WCS";
            return resultat;
        };
        this.getDescribeCoverage = function (coverage, description) {

            var resultat = {};
            const self = this;

            if (!cesium.defined(description.layerName)) {
                throw new cesium.DeveloperError(
                    'description.layerName is required.');
            }

            resultat.minLevel = cesium.defaultValue(description.minLevel, undefined);
            resultat.maxLevel = cesium.defaultValue(description.maxLevel, undefined);

            resultat.heightMapWidth = cesium.defaultValue(description.heightMapWidth, 65);
            resultat.heightMapHeight = cesium.defaultValue(description.heightMapHeight, resultat.heightMapWidth);

            //var corner = coverage.querySelector('lonLatEnvelope').textContent.trim().split(' ').filter(function (elm) { return elm.trim().length > 0 });
            const corner = Array.from(coverage.querySelectorAll('lonLatEnvelope pos')).map((pos) => pos.innerHTML.split(' '));

            //var lowerCorner = convertToFloat(corner.slice(0, 2));
            //var upperCorner = convertToFloat(corner.slice(2));
            const lowerCorner = corner[0];
            const upperCorner = corner[1];


            resultat.upperCorner = upperCorner;
            resultat.lowerCorner = lowerCorner;

            var low = convertToFloat(coverage.querySelector('gml\\:low, low').textContent.split(' '));
            var high = convertToFloat(coverage.querySelector('gml\\:high, high').textContent.split(' '));

            var epsgCode = 4326;
            var projstring = 'EPSG:' + epsgCode.toString();
            var getCRS = this.OGCHelper.CRS.filter(function (elt) {
                return elt.name === projstring;
            });
            if (getCRS.length > 0)
                resultat.tilingScheme = new getCRS[0].tilingScheme({
                    ellipsoid: getCRS[0].ellipsoid
                });
            else
                resultat.tilingScheme = undefined;

            resultat.pixelSize = [65, 65];

            resultat.levelZeroMaximumGeometricError = cesium.TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(resultat.tilingScheme._ellipsoid,
                Math.min(resultat.heightMapWidth, resultat.heightMapHeight),
                resultat.tilingScheme.getNumberOfXTilesAtLevel(0));

            resultat.waterMask = false;
            resultat.ready = true;

            var bbox = {
                'WKID': epsgCode,
                'EPSG': projstring,
                'coord': [[lowerCorner[0], upperCorner[1]], [lowerCorner[0], lowerCorner[1]], [upperCorner[0], lowerCorner[1]], [upperCorner[0], upperCorner[1]]],
                'ulidx': 0,
                'llidx': 1,
                'lridx': 2,
                'uridx': 3
            };
            resultat.bbox = bbox;


            resultat.getTileDataAvailable = function (x, y, level) {
                if (level <= resultat.maxLevel && resultat.isInTile(x, y, level))
                    return true;
                return false;
            };

            // Define the URL for GetCoverage
            this.urlofServer = description.url;
            var index = this.urlofServer.lastIndexOf("?");
            if (index > -1) {
                this.urlofServer = this.urlofServer.substring(0, index);
            }

            /* WCS 1.0.0 */
            var urlGetTerrain = this.urlofServer +
                "?SERVICE=WCS&VERSION=1.0.0&REQUEST=GetCoverage" +
                "&COVERAGE=" + description.layerName + "&FORMAT={format}&BBOX=" + "{west},{south},{east},{north}" + "&WIDTH=" + 65 + "&HEIGHT=" + 65 + "&CRS=EPSG:4326";

            resultat.urlGetTerrain = urlGetTerrain;

            // Is the X,Y,Level define a tile that is contains in our bbox
            resultat.isTileInside = function (x, y, level) {
                var inside = true;
                var bbox = resultat.bbox;
                var rect = self.tilingScheme.tileXYToNativeRectangle(x, y, level);

                if (bbox.coord[bbox.ulidx][0] >= rect.east || bbox.coord[bbox.lridx][0] <= rect.west ||
                    bbox.coord[bbox.lridx][1] >= rect.north || bbox.coord[bbox.ulidx][1] <= rect.south) {
                    inside = false;
                }
                return inside;
            };
            // Is the X,Y,Level define a tile that contains or ovelaps our bbox
            resultat.isInTile = function (x, y, level) {
                var inside = false;
                var bbox = resultat.bbox;
                var rect = resultat.tilingScheme.tileXYToNativeRectangle(x, y, level);
                // One point of the bbox is in the tile
                if ((bbox.coord[bbox.ulidx][0] >= rect.west && bbox.coord[bbox.ulidx][0] <= rect.east &&
                    bbox.coord[bbox.ulidx][1] >= rect.south && bbox.coord[bbox.ulidx][1] <= rect.north) ||
                    (bbox.coord[bbox.uridx][0] >= rect.west && bbox.coord[bbox.uridx][0] <= rect.east &&
                        bbox.coord[bbox.uridx][1] >= rect.south && bbox.coord[bbox.uridx][1] <= rect.north) ||
                    (bbox.coord[bbox.llidx][0] >= rect.west && bbox.coord[bbox.llidx][0] <= rect.east &&
                        bbox.coord[bbox.llidx][1] >= rect.south && bbox.coord[bbox.llidx][1] <= rect.north) ||
                    (bbox.coord[bbox.lridx][0] >= rect.west && bbox.coord[bbox.lridx][0] <= rect.east &&
                        bbox.coord[bbox.lridx][1] >= rect.south && bbox.coord[bbox.lridx][1] <= rect.north) ||
                    // or the tile is in the bbox
                    (bbox.coord[bbox.ulidx][0] < rect.east && bbox.coord[bbox.lridx][0] > rect.west &&
                        bbox.coord[bbox.lridx][1] < rect.north && bbox.coord[bbox.ulidx][1] > rect.south)
                ) {
                    inside = true;
                }
                return inside;

            };
            resultat.templateToURL = function (x, y, level) {
                var rect = self.tilingScheme.tileXYToNativeRectangle(x, y, level);
                var xSpacing = (rect.east - rect.west) / (self.heightMapWidth - 1);
                var ySpacing = (rect.north - rect.south) / (self.heightMapHeight - 1);
                rect.west -= xSpacing * 0.5;
                rect.east += xSpacing * 0.5;
                rect.south -= ySpacing * 0.5;
                rect.north += ySpacing * 0.5;
                return resultat.urlGetTerrain.replace("{south}", rect.south).replace("{north}", rect.north).replace("{west}", rect.west).replace("{east}", rect.east).replace("{format}", self.format);
            }

            return resultat;
        };

        this.type = "WCS";
        OGCTerrainProvider.apply(this, [description, view]);

    };

    WCSTerrainProvider.prototype = Object.create(OGCTerrainProvider.prototype);
    WCSTerrainProvider.prototype.constructor = WCSTerrainProvider;

    WCSTerrainProvider.prototype.getCapabilities = function () {

        var urlGetCapabilities = this.urlofServer + '?SERVICE=WCS&VERSION=1.0.0&request=GetCapabilities';
        cesium.when(cesium.Resource.fetchXML({
            url: urlGetCapabilities
        }), function (xml) {
            if (xml.querySelector('Service')) {
                this.attributions = {};
                var labelNode = xml.querySelector('Service').querySelector('label');
                if (labelNode) {
                    this.attributions.name = labelNode.textContent.trim();
                }
                var linkNode = xml.querySelector('Service').querySelector('metadataLink');
                if (linkNode) {
                    this.attributions.site = linkNode.getAttribute('about');
                }
            }
        }.bind(this));

        this.description = cesium.defaultValue(this.description, cesium.defaultValue.EMPTY_OBJECT);
        return this.parse.apply(this, [this.description]);
    }

    var WMTSTerrainProvider = function WMTSTerrainProvider(description, view) {

        this._parse = function (description) {
            var self = this;
            var resultat;
            description = cesium.defaultValue(description,
                cesium.defaultValue.EMPTY_OBJECT);
            if (cesium.defined(description.url)) {
                var urlofServer = description.url;
                var index = urlofServer.lastIndexOf("?");
                if (index > -1) {
                    urlofServer = urlofServer.substring(0, index);
                }
                // get version of wcs
                if (!cesium.defined(description.layerName)) {
                    throw new cesium.DeveloperError(
                        'description.layerName is required.');
                }

                var urlDescribeCoverage = urlofServer + '?SERVICE=WCS&VERSION=1.0.0&request=DescribeCoverage&CoverageId=' + description.layerName;

                if (cesium.defined(description.proxy)) {
                    urlDescribeCoverage = description.proxy.getURL(urlDescribeCoverage);
                }

                resultat = cesium.when(cesium.Resource.fetchXML({
                    url: urlDescribeCoverage
                }), function (xml) {
                    return self.getDescribeCoverage(xml, description);
                }).otherwise(function () {
                    return cesium.when.defer.resolve(null);
                });


            } else if (cesium.defined(description.xml)) {
                resultat = self.getDescribeCoverage(description.xml, description);
            } else {
                throw new cesium.DeveloperError(
                    'either description.url or description.xml are required.');
            }
            resultat.type = "WMTS";
            return resultat;
        };
        this.parse = function (xml, description) {
            const self = this;
            const maxLevel = description.maxLevel || 20;
            const layerName = description.layerName;
            let styleName = description.styleName;
            let template = null;
            let listTileMatrixSetLinkNode = [];
            let urlKVP = null, urlRESTful = null;
            let formatImage = null;
            const proxy = description.proxy;
            const resultat = self.OGCHelper.generate(description);
            //KVP support for now

            Array.from(xml.querySelectorAll('Operation[name="GetTile"] HTTP Get'))
                .map((elt) => ({ node: elt, type: elt.querySelector("Value").textContent }))
                .forEach(item => {
                    if (item.type === "RESTful" && urlRESTful === null) {
                        urlRESTful = item.node.getAttribute("xlink:href");
                        if (proxy) { urlRESTful = proxy.getURL(urlRESTful); }
                    }
                    if (item.type === "KVP" && urlKVP === null) {
                        urlKVP = item.node.getAttribute("xlink:href");
                        if (proxy) { urlKVP = proxy.getURL(urlKVP); }
                    }
                });

            const nodeIdentifiers = xml.querySelectorAll("Contents>Layer>Identifier");
            let layerNode = null;
            for (let i = 0; i < nodeIdentifiers.length && layerNode === null; i++) {
                if (layerName === nodeIdentifiers[i].textContent) {
                    layerNode = nodeIdentifiers[i].parentNode;
                }
            }

            if (layerNode !== null) {
                //optionality of style in geoserver is not compliant with OGC requirements!!
                let defaultStyle, selectedStyle;
                Array.from(layerNode.querySelectorAll("Style")).forEach(item => {
                    const style = item.querySelector("Identifier").textContent;
                    if (item.getAttribute("isDefault") != null) { defaultStyle = style; }
                    if (style === styleName) { selectedStyle = style; }
                });
                //Work with attribute isDefault when no style was defined!!
                if (!styleName || styleName !== selectedStyle) { styleName = defaultStyle || ''; }

                //format
                const nodeFormats = Array.from(layerNode.querySelectorAll("Format"));
                for (let l = 0; l < self.OGCHelper.FormatImage.length && formatImage === null; l++) {
                    const validFormats = nodeFormats.filter(elt => elt.textContent === self.OGCHelper.FormatImage[l].format && elt.textContent === self.format);
                    if (validFormats.length > 0) { formatImage = self.OGCHelper.FormatImage[l]; }
                }
                if (!formatImage)
                    throw new cesium.DeveloperError(
                        'image format not valid.');
                //TileMatrixSetLink =>TileMatrixSet
                listTileMatrixSetLinkNode = Array.from(layerNode.querySelectorAll("TileMatrixSetLink"));
            }

            const nodeMatrixSetIds = Array.from(xml.querySelectorAll("TileMatrixSet>Identifier"));
            for (let a = 0; a < listTileMatrixSetLinkNode.length && !resultat.ready; a++) {
                const matrixSetLinkNode = listTileMatrixSetLinkNode[a];
                const tileMatrixSetLinkName = matrixSetLinkNode.querySelector("TileMatrixSet").textContent;
                let tileMatrixSetNode = null;
                let CRSSelected = null;

                for (let i = 0; i < nodeMatrixSetIds.length && tileMatrixSetNode === null; i++) {
                    if (nodeMatrixSetIds[i].textContent === tileMatrixSetLinkName) { tileMatrixSetNode = nodeMatrixSetIds[i].parentNode; }
                }

                const supportedCRS = tileMatrixSetNode.querySelector("SupportedCRS").textContent;
                for (let n = 0; n < self.OGCHelper.CRS.length && CRSSelected === null; n++) {
                    if (self.OGCHelper.CRS[n].SupportedCRS.includes(supportedCRS)) { CRSSelected = self.OGCHelper.CRS[n]; }
                }

                if (CRSSelected !== null) {

                    const tileSets = Array.from(tileMatrixSetNode.querySelectorAll("TileMatrix"))
                        .map(function (noeud) {
                            let id = noeud.querySelector("Identifier").textContent;
                            let maxWidth = parseInt(noeud.querySelector("MatrixWidth").textContent, 10);
                            let maxHeight = parseInt(noeud.querySelector("MatrixHeight").textContent, 10);
                            let tileWidth = parseInt(noeud.querySelector("TileWidth").textContent, 10);
                            let tileHeight = parseInt(noeud.querySelector("TileHeight").textContent, 10);
                            let scaleDenominator = parseFloat(noeud.querySelector("ScaleDenominator").textContent);
                            return {
                                id,
                                maxWidth,
                                maxHeight,
                                scaleDenominator,
                                complete: false,
                                tileWidth,
                                tileHeight
                            };
                        })
                        .sort((a, b) => b.scaleDenominator - a.scaleDenominator);

                    const listTileMatrixLimits = Array.from(matrixSetLinkNode.querySelectorAll("TileMatrixSetLimits>TileMatrixLimits"))
                        .map(nodeLink => ({
                            id: nodeLink.querySelector("TileMatrix").textContent,
                            bbox: {
                                minTileRow: parseInt(nodeLink.querySelector("MinTileRow").textContent, 10),
                                maxTileRow: parseInt(nodeLink.querySelector("MaxTileRow").textContent, 10),
                                minTileCol: parseInt(nodeLink.querySelector("MinTileCol").textContent, 10),
                                maxTileCol: parseInt(nodeLink.querySelector("MaxTileCol").textContent, 10)
                            }
                        }));
                    tileSets.forEach(tile => {
                        listTileMatrixLimits.forEach(nodeLink => {
                            if (tile.id === nodeLink.id) {
                                tile.bbox = nodeLink.bbox;
                                tile.complete = true;
                            }
                        });
                    });

                    if (tileSets.length > 0) {
                        var getCRS = this.OGCHelper.CRS.filter(function (elt) {
                            return elt.name === supportedCRS;
                        });
                        if (getCRS.length > 0)
                            resultat.tilingScheme = new getCRS[0].tilingScheme({
                                ellipsoid: getCRS[0].ellipsoid
                            });
                        else
                            resultat.tilingScheme = undefined;
                        const resourceURL = layerNode.querySelector("ResourceURL[format='" + formatImage.format + "']");

                        if (resourceURL !== null) {
                            template = resourceURL.getAttribute("template").replace("{TileRow}", "{y}").replace("{TileCol}", "{x}").replace("{style}", styleName).replace("{Style}", styleName).
                                replace("{TileMatrixSet}", tileMatrixSetLinkName).replace("{layer}", layerName).replace("{infoFormatExtension}", formatImage.extension);
                        } else if (urlKVP !== null) {
                            template = urlKVP + "?service=WMTS&request=GetTile&version=1.0.0&layer=" + layerName + "&style=" + styleName + "&format=" + formatImage.format + "&TileMatrixSet=" + tileMatrixSetLinkName + "&TileMatrix={TileMatrix}&TileRow={y}&TileCol={x}"
                        }

                        if (template !== null) {
                            resultat.minLevel = tileSets.length;
                            resultat.maxLevel = 0;

                            resultat.isTileInside = function (_x, _y, _level) {
                                return true;
                                /*var inside = true;
                                var bbox = resultat.bbox;
                                var rect = self.tilingScheme.tileXYToNativeRectangle(x, y, level);

                                if (bbox.coord[bbox.ulidx][0] >= rect.east || bbox.coord[bbox.lridx][0] <= rect.west ||
                                    bbox.coord[bbox.lridx][1] >= rect.north || bbox.coord[bbox.ulidx][1] <= rect.south) {
                                    inside = false;
                                }
                                return inside;*/
                            };
                            resultat.getTileDataAvailable = (x, y, level) => {
                                let retour = false;
                                if (level < maxLevel && level < tileSets.length) {
                                    const tile = tileSets[level];
                                    const bbox = tile.bbox;
                                    if (tile.complete) {
                                        retour = (y <= bbox.maxTileRow && y >= bbox.minTileRow) && (x <= bbox.maxTileCol && x >= bbox.minTileCol);
                                    } else {
                                        retour = x < tile.maxWidth && y < tile.maxHeight;
                                    }
                                }
                                return retour;
                            };
                            resultat.templateToURL = function (x, y, level) {
                                let retour = "";
                                if (self.getTileDataAvailable(x, y, level)) {
                                    let tile = tileSets[level];
                                    retour = template.replace("{TileMatrix}", tile.id).replace("{x}", x).replace("{y}", y);
                                }
                                return retour;
                            };

                            const imageSize = {
                                width: tileSets[0].tileWidth,
                                height: tileSets[0].tileHeight
                            };
                            const checkSize = tileSets.filter(elt => elt.tileWidth != imageSize.width || elt.tileHeight != imageSize.height);
                            if (checkSize.length === 0) {
                                resultat.imageSize = imageSize;
                            }
                            resultat.heightMapWidth = cesium.defaultValue(imageSize.width, 256);
                            resultat.heightMapHeight = cesium.defaultValue(imageSize.widht, 256);
                            resultat.urlGetTile = template;
                            resultat.ready = true;
                        }
                    }

                }
            }
            return resultat;
        };

        this.type = "WMTS";
        OGCTerrainProvider.apply(this, [description, view]);
    };

    WMTSTerrainProvider.prototype = Object.create(OGCTerrainProvider.prototype);
    WMTSTerrainProvider.prototype.constructor = WMTSTerrainProvider;
    WMTSTerrainProvider._super = OGCTerrainProvider.prototype;

    WMTSTerrainProvider.prototype.getCapabilities = function () {
        const self = this;
        var urlGetCapabilities = self.urlofServer + '?SERVICE=WMTS&request=GetCapabilities';

        if (cesium.defined(self.description.proxy)) {
            urlGetCapabilities = self.description.proxy.getURL(urlGetCapabilities);
        }

        this.description = cesium.defaultValue(self.description, cesium.defaultValue.EMPTY_OBJECT);
        //var promise = OGCHelper.WMTSParser.generate(description);

        const promises = cesium.when.defer();
        cesium.when(cesium.Resource.fetchXML({
            url: urlGetCapabilities
        }), function (xml) {
            this.attributions = {};
            if (xml.querySelector('ServiceIdentification')) {
                var labelNode = xml.querySelector('ServiceIdentification').querySelector('Title');
                if (labelNode) {
                    this.attributions.name = labelNode.textContent.trim();
                }
            }
            if (xml.querySelector('ServiceProvider')) {
                var linkNode = xml.querySelector('ServiceProvider').querySelector('ProviderSite');
                if (linkNode) {
                    this.attributions.site = linkNode.getAttribute('href');
                }
            }
            promises.resolve(this.parse.apply(this, [xml, self.description]));

        }.bind(this));
        return promises;
    }
    WMTSTerrainProvider.prototype.OGCHelper.generate = function (description) {

        var resultat = {};
        //basicAssignResult(description, resultat);
        resultat.heightMapWidth = description.heightMapWidth;
        resultat.heightMapHeight = description.heightMapHeight;
        resultat.ready = false;
        resultat.maximumLevel = description.maxLevel
        resultat.levelZeroMaximumGeometricError = undefined;
        resultat.offset = description.offset;
        resultat.highest = description.highest;
        resultat.lowest = description.lowest;
        resultat.hasStyledImage = description.hasStyledImage || typeof (description.styleName) === "string";
        resultat.type = "WMTS";
        return resultat;
    };


    const imageToBuffer = function (image, limitations, size, _hasStyledImage) {
        const dataPixels = cesium.getImagePixels(image, size.width, size.height);

        const buffer = new Float32Array(dataPixels.length / 4);

        for (let i = 0; i < dataPixels.length; i += 4) {
            const msb = dataPixels[i];
            buffer[i / 4] = (msb / 255 * (limitations.highest - limitations.lowest) + limitations.offset);
        }
        return buffer;

        //const buffer = new Int16Array(dataPixels.length / 4);
        //let goodCell = 0,
        //    somme = 0;
        //for (let i = 0; i < dataPixels.length; i += 4) {
        //    const msb = dataPixels[i];
        //    const lsb = dataPixels[i + 1];
        //    const isCorrect = dataPixels[i + 2] > 128;
        //    const valeur = (msb << 8 | lsb) - limitations.offset - 32768;
        //    if (valeur > limitations.lowest && valeur < limitations.highest && (isCorrect || hasStyledImage)) {
        //        buffer[i / 4] = valeur;
        //        somme += valeur;
        //        goodCell++;
        //    } else {
        //        buffer[i / 4] = (goodCell === 0 ? 0 : somme / goodCell);
        //        //buffer[i / 4] = 0;
        //    }
        //}
        //return buffer;
    }

    function TerrainParser(promise) {
        const self = this;
        cesium.when(promise, function (resultat) {
            if (cesium.defined(resultat) && (resultat.ready)) {
                self._ready = true;
                self._readyPromise.resolve(true);

                resultat.getHeightmapTerrainData = function (x, y, level) {
                    var retour;

                    if (!Number.isNaN(x + y + level)) {
                        const urlGetTileOrCoverage = resultat.templateToURL(x, y, level);

                        var hasChildren = 0;
                        if (level < resultat.minLevel) {
                            // no need to test for all child --> we are in the case of isTileInside
                            hasChildren |= 1;
                            hasChildren |= 2;
                            hasChildren |= 4;
                            hasChildren |= 8;
                        }

                        // If the requested tile is the same as the last then return it
                        if (self.lastTile != undefined &&
                            self.lastTile.x == x &&
                            self.lastTile.y == y &&
                            self.lastTile.level == level) {
                            //console.log("get  Last Tile ",x, y, level);
                            return self.lastTile.value;
                        }

                        // If the requested tile is in the TileCacheService then return it
                        // Otherwise use WCS Get Coverage to request the tile
                        retour = cesium.when(self.tileCacheService.getTileData(x, y, level), function (tileData) {
                            let myHeightmapTerrainData = self.HeightmapTerrainData(tileData.data, {
                                width: self.heightMapHeight,
                                height: self.heightMapHeight
                            }, hasChildren);

                            self.lastTile = { 'x': x, 'y': y, 'level': level, 'value': myHeightmapTerrainData };

                            return myHeightmapTerrainData;
                        }).otherwise(function (_evt) {
                            const fetchDataImage = self.format === "image/tiff" ? cesium.Resource.fetchArrayBuffer : cesium.Resource.fetchImage
                            return cesium.when(fetchDataImage({ url: urlGetTileOrCoverage }), function (image) {
                                return cesium.when(self.ImageToHeightmapTerrainData(image, {
                                    width: self.heightMapHeight,
                                    height: self.heightMapHeight
                                }, x, y, level), function (myHeightmapBuffer) {
                                    self.tileCacheService.addTile(x, y, level, myHeightmapBuffer);

                                    let myHeightmapTerrainData = self.HeightmapTerrainData(myHeightmapBuffer, {
                                        width: self.heightMapHeight,
                                        height: self.heightMapHeight
                                    }, hasChildren);

                                    self.lastTile = { 'x': x, 'y': y, 'level': level, 'value': myHeightmapTerrainData };

                                    return myHeightmapTerrainData;
                                });
                            }).otherwise(function () {
                                return self.DefaultProvider.requestTileGeometry(x, y, level);
                            });
                        });
                    }
                    return retour;
                };

                self.getLevelMaximumGeometricError = function (level) {
                    return resultat.levelZeroMaximumGeometricError / (1 << level);
                };

                self.requestTileGeometry = function (x, y, level) {
                    var retour;

                    if (cesium.defined(resultat.getHeightmapTerrainData)) {

                        //if (!self.adviced && level > 14) {
                        //    self.view.map.toast(TC.Util.getLocaleString(self.view.map.options.locale, "threed.terrainAdvice"), { type: TC.Consts.msgType.INFO });
                        //    self.adviced = true;
                        //}

                        if (level <= resultat.minLevel &&
                            level >= resultat.maxLevel) {

                            if (resultat.isTileInside(x, y, level) == true) {
                                retour = resultat.getHeightmapTerrainData(x, y, level);
                            } else {
                                retour = cesium.when.defer().reject();
                            }
                        } else {
                            retour = cesium.when.defer().reject();
                        }
                    } else {
                        retour = cesium.when.defer().reject();
                    }

                    return retour;
                }

                Object.defineProperties(self, {
                    tilingScheme: {
                        get: function () {
                            return resultat.tilingScheme;
                        }
                    },
                    ready: {
                        get: function () {
                            return resultat.ready;
                        }
                    },
                    pixelSize: {
                        get: function () {
                            return resultat.pixelSize;
                        }
                    },
                    hasWaterMask: {
                        get: function () {
                            return resultat.waterMask;
                        }
                    },
                    heightMapHeight: {

                        get: function () {
                            return resultat.heightMapHeight;
                        }
                    },
                    heightMapWidth: {
                        get: function () {
                            return resultat.heightMapWidth;
                        }
                    },
                    getTileDataAvailable: {
                        get: function () {
                            return resultat.getTileDataAvailable;
                        }
                    },
                    minLevel: {
                        get: function () {
                            return resultat.minLevel;
                        }
                    },
                    maxLevel: {
                        get: function () {
                            return resultat.maxLevel;
                        }
                    }

                });

                if (resultat.minLevel == undefined || resultat.maxLevel == undefined) {
                    // Test pour savoir dans quelle tuile se trouve mon WCS
                    var bbox = resultat.bbox;
                    var pgeo = new cesium.Cartographic(
                        cesium.Math.toRadians(bbox.coord[bbox.ulidx][0]),
                        cesium.Math.toRadians(bbox.coord[bbox.ulidx][1]),
                        0);
                    resultat.minLevel = 30;
                    resultat.maxLevel = 0;

                    for (var j = 0; j < 30; j++) {
                        // var tile = provider.tilingScheme.positionToTileXY(pgeo,j);
                        //var rect = provider.tilingScheme.tileXYToNativeRectangle(tile.x, tile.y, j);
                        var rect = self.tilingScheme.tileXYToNativeRectangle(0, 0, j);
                        var xSpacing = (rect.east - rect.west) / (self.heightMapWidth - 1);
                        var ySpacing = (rect.north - rect.south) / (self.heightMapHeight - 1);
                        var scalingX = self.pixelSize[0] / xSpacing
                        var scalingY = self.pixelSize[1] / ySpacing;

                        if (scalingX < 10 && scalingX > 1 / 10 && Math.abs(scalingY) < 10 && Math.abs(scalingY) > 1 / 10) {
                            if (j < resultat.minLevel) resultat.minLevel = j;
                            if (j > resultat.maxLevel) resultat.maxLevel = j;

                        }
                    }
                }
            } else {
                console.log("Error al obtener terreno fuera de Navarra");
            }
        });
    }


    function doSampling(terrainProvider, level, positions) {
        var tilingScheme = terrainProvider.tilingScheme;

        var i;

        // Sort points into a set of tiles
        var tileRequests = []; // Result will be an Array as it's easier to work with
        var tileRequestSet = {}; // A unique set
        for (i = 0; i < positions.length; ++i) {
            var xy = tilingScheme.positionToTileXY(positions[i], level);
            var key = xy.toString();

            if (!Object.prototype.hasOwnProperty.call(tileRequestSet, key)) {
                // When tile is requested for the first time
                var value = {
                    x: xy.x,
                    y: xy.y,
                    level: level,
                    tilingScheme: tilingScheme,
                    terrainProvider: terrainProvider,
                    positions: []
                };
                tileRequestSet[key] = value;
                tileRequests.push(value);
            }

            // Now append to array of points for the tile
            tileRequestSet[key].positions.push(positions[i]);
        }

        // Send request for each required tile
        var tilePromises = [];
        for (i = 0; i < tileRequests.length; ++i) {
            var tileRequest = tileRequests[i];
            var requestPromise = tileRequest.terrainProvider.requestTileGeometry(tileRequest.x, tileRequest.y, tileRequest.level, false);
            var tilePromise = cesium.when(requestPromise, createInterpolateFunction(tileRequest), createMarkFailedFunction(tileRequest));
            tilePromises.push(tilePromise);
        }

        return cesium.when.all(tilePromises, function () {
            return positions;
        });
    }

    function createInterpolateFunction(tileRequest) {
        var tilePositions = tileRequest.positions;
        var rectangle = tileRequest.tilingScheme.tileXYToRectangle(tileRequest.x, tileRequest.y, tileRequest.level);
        return function (terrainData) {
            for (var i = 0; i < tilePositions.length; ++i) {
                var position = tilePositions[i];
                position.height = terrainData.interpolateHeight(rectangle, position.longitude, position.latitude);
            }
        };
    }

    function createMarkFailedFunction(tileRequest) {
        var tilePositions = tileRequest.positions;
        return function () {
            for (var i = 0; i < tilePositions.length; ++i) {
                var position = tilePositions[i];
                position.height = undefined;
            }
        };
    }
    WCSTerrainProvider.prototype.sampleTerrainMostDetailed = function (positions) {
        var self = this;

        var deferred = cesium.when.defer();

        function doSamplingWhenReady() {
            if (self.ready) {/* provisional: el nivel se puede extraer Â¿? */
                cesium.when(doSampling(self, 16, positions), function (updatedPositions) {
                    deferred.resolve(updatedPositions);
                });
            } else {
                setTimeout(doSamplingWhenReady, 10);
            }
        }

        doSamplingWhenReady();

        return deferred;
    }

    WMTSTerrainProvider.prototype.sampleTerrainMostDetailed = function (positions) {
        var self = this;

        var deferred = cesium.when.defer();

        function doSamplingWhenReady() {
            if (self.ready) {/* provisional: el nivel se puede extraer ¿? */
                cesium.when(doSampling(self, 16, positions), function (updatedPositions) {
                    deferred.resolve(updatedPositions);
                });
            } else {
                setTimeout(doSamplingWhenReady, 10);
            }
        }

        doSamplingWhenReady();

        return deferred;
    }

    cesium.WCSTerrainProvider = WCSTerrainProvider;
    cesium.WMTSTerrainProvider = WMTSTerrainProvider;

    function TileCacheService(objectStoreName) {
        this.database = null;
        this.objectStoreName = objectStoreName;
    }

    TileCacheService.prototype = {
        /* createDB : create the scheme of the database  */
        createDB: function () {

            // In the following line, you should include the prefixes of implementations you want to test.
            if (!window.indexedDB)
                window.indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            // DON'T use "var indexedDB = ..." if you're not in a function.
            // Moreover, you may need references to some window.IDB* objects:
            if (!window.IDBTransaction)
                window.IDBTransaction = window.webkitIDBTransaction || window.msIDBTransaction;
            if (!window.IDBKeyRange)
                window.IDBKeyRange = window.webkitIDBKeyRange || window.msIDBKeyRange;
            if (!window.indexedDB) {
                window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
            }

            var request = window.indexedDB.open('TileCacheService', 1);
            var that = this;
            request.onsuccess = function (evt) {
                that.database = evt.target.result;
            };
            request.onerror = function (_evt) {
                console.log("IndexedDB--> onerror ");
            };
            request.onupgradeneeded = function (evt) {
                var thisDB = evt.target.result;
                if (!thisDB.objectStoreNames.contains('WCSTiles')) {
                    var store = thisDB.createObjectStore('WCSTiles', { keyPath: 'id' });
                    store.createIndex("tile", ["level", "row", "column"], { unique: true });
                }

                if (!thisDB.objectStoreNames.contains('WMTSTiles')) {
                    const store = thisDB.createObjectStore('WMTSTiles', { keyPath: 'id' });
                    store.createIndex("tile", ["level", "row", "column"], { unique: true });
                }

                if (!thisDB.objectStoreNames.contains('ImageTiles')) {
                    const store = thisDB.createObjectStore('ImageTiles', { keyPath: 'id' });
                    store.createIndex("tile", ["level", "row", "column"], { unique: true });
                }

            };
        },
        /* info on available storage */
        info: function () {
            // Request storage usage and capacity left
            window.webkitStorageInfo.queryUsageAndQuota(window.TEMPORARY, //the type can be either TEMPORARY or PERSISTENT
                function (used, remaining) {
                    console.log("Used quota: " + used + ", remaining quota: " + remaining);
                }, function (e) {
                    console.log('Error', e);
                });
        },
        /* isReady when objectStore has been created  */
        isReady: function () {
            if (!this.database)
                return false;

            return this.database.objectStoreNames.contains(this.objectStoreName);
        },
        /* get the requested tile */
        getTileData: function (column, row, level) {

            var deferred = cesium.when.defer();

            if (!this.database) {
                console.log("getTileData no database", this.database);
                deferred.reject("no IndexedDB");
            }
            else {

                var transaction = this.database.transaction(this.objectStoreName);
                var tileIndex = transaction.objectStore(this.objectStoreName).index("tile");

                var requestGet = tileIndex.get([level, row, column]);
                requestGet.onsuccess = function (evt) {
                    var tile = null;
                    if (evt.target.result) {
                        tile = { data: evt.target.result.tileData };
                        deferred.resolve(tile);
                    }
                    else {
                        deferred.reject("no tile");
                    }

                }

                requestGet.onerror = function (_evt) {
                    deferred.reject("no tile get failed");
                }
            }

            return deferred.promise;
        },
        addTile: function (x, y, level, data) {

            if (this.database) {
                var transaction = this.database.transaction(this.objectStoreName, "readwrite");
                try {
                    // the transaction could abort because of a QuotaExceededError error
                    var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8; return v.toString(16); });
                    transaction.objectStore(this.objectStoreName).add({ id: guid, level: level, row: y, column: x, tileData: data });
                    //	console.log("addTile ");
                }
                catch (ex) {
                    console.log(ex);
                }

            }
            else
                console.log("addTile no database");

        }
    };

    function convertToFloat(tab) {
        for (var j = 0; j < tab.length; j++) {
            var b = parseFloat(tab[j]);
            if (!Number.isNaN(b))
                tab[j] = b;
        }
        return tab;
    }

    function invertTab(tab) {
        var b = tab[1];
        tab[1] = tab[0];
        tab[0] = b;
        return tab;
    }

})();
export default MergeTerrainProvider;
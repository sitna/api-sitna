class OGCTerrainProvider {
    constructor(description, view) {
        this.view = view;

        this.type = description.type || "OGC";

        this._ready = false;
        this._readyPromise = Promise.withResolvers();

        if (!cesium.defined(description)) {
            throw new cesium.DeveloperError("description is required.");
        }

        this.description = description;
        this.url = description.url;
        this.layerName = description.layerName;

        // Eventos
        this._errorEvent = new cesium.Event();
        this._eventHelper = new cesium.EventHelper();

        // Créditos
        let credit = description.credit;
        if (typeof credit === "string") {
            credit = new cesium.Credit(credit);
        }
        this._credit = credit;

        this.tileCacheService = new TileCacheService(this.type + "Tiles");
        this.tileCacheService.createDB();

        this.lowest = description.lowest || 0;
        this.highest = description.highest || 3700;
        this.offset = description.offset || 0;

        this.lastTile = undefined;
        this.ready = false;

        this.DefaultProvider = new cesium.EllipsoidTerrainProvider();

        this._heightmapWidth = 65;

        this.noDataValue = description.noDataValue;

        // URL base del servidor
        this.urlofServer = undefined;
        if (cesium.defined(this.url)) {
            this.urlofServer = this.url;
            const index = this.urlofServer.lastIndexOf("?");
            if (index > -1) {
                this.urlofServer = this.urlofServer.substring(0, index);
            }
        }

        // Lanzar el parser (igual que en tu código)
        TerrainParser.apply(this, [this.getCapabilities()]);

        // OGCHelper "estático" pero en la instancia (igual que en tu código)
        this.OGCHelper = {};
        this.OGCHelper.CRS = [
            {
                name: "CRS:84",
                ellipsoid: cesium.Ellipsoid.WGS84,
                firstAxeIsLatitude: false,
                tilingScheme: cesium.GeographicTilingScheme,
                SupportedCRS: ["urn:ogc:def:crs:OGC:2:84"]
            },
            {
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
            },
            {
                name: "EPSG:3857",
                ellipsoid: cesium.Ellipsoid.WGS84,
                firstAxeIsLatitude: false,
                tilingScheme: cesium.WebMercatorTilingScheme,
                SupportedCRS: ["urn:ogc:def:crs:EPSG::3857", "EPSG:3857"]
            },
            {
                name: "OSGEO:41001",
                ellipsoid: cesium.Ellipsoid.WGS84,
                firstAxeIsLatitude: false,
                tilingScheme: cesium.WebMercatorTilingScheme,
                SupportedCRS: ["urn:ogc:def:crs:EPSG::3857"]
            }
        ];

        this.OGCHelper.FormatImage = [
            { format: "image/png", extension: "png" },
            { format: "image/jpeg", extension: "jpg" },
            { format: "image/jpeg", extension: "jpeg" },
            { format: "image/gif", extension: "gif" },
            { format: "image/png; mode=8bit", extension: "png" },
            { format: "image/tiff", extension: "tiff" },
            { format: "image/tiff", extension: "geotiff" },
            { format: "image/tiff", extension: "geotiffint16" },
            { format: "image/tiff", extension: "geotiff_rgb" },
            { format: "image/x-bil;bits=32", extension: "x-bil" }
        ];

        // Formato seleccionado
        this.format = this.OGCHelper.FormatImage
            .find(f => f.extension === description.format.toLowerCase()).format;
    }

    // ----------------------
    //    GETTERS ES6
    // ----------------------

    get errorEvent() {
        return this._errorEvent;
    }

    get credit() {
        return this._credit;
    }

    get hasVertexNormals() {
        return false;
    }

    get readyPromise() {
        return this._readyPromise.promise;
    }

    // ----------------------
    //    MÉTODOS
    // ----------------------

    getAttribution() {
        return this.attributions;
    }

    static TiledError() {
        console.log("TiledError");
    }

    async ImageToHeightmapTerrainData(arrayBuffer, size, x, y, level) {
        if (this.format === "image/tiff") {
            return await this.GeotiffToHeightmapTerrainData(arrayBuffer, x, y, level);
        }

        return await imageToBuffer(
            arrayBuffer,
            {
                offset: this.offset,
                lowest: this.lowest,
                highest: this.highest
            },
            size,
            true
        );
    }

    GeotiffToHeightmapTerrainData(arrayBuffer, x, y, level) {
        return new Promise(resolve => {
            cesium.createTaskProcessorWorker(async () => {
                const tiff = await fromArrayBuffer(arrayBuffer);
                const image = await tiff.getImage();
                resolve((await image.readRasters())[0]);
            })({ data: {} });
        });
    }

    HeightmapTerrainData(heightBuffer, size, childrenMask) {
        if (typeof size === "number") {
            size = { width: size, height: size };
        }

        if (!cesium.defined(heightBuffer)) {
            throw new cesium.DeveloperError("no good size");
        }

        const options = {
            buffer: heightBuffer,
            width: size.width,
            height: size.height,
            childTileMask: childrenMask
        };

        return new cesium.HeightmapTerrainData(options);
    }
}


    /*
    https://github.com/xlhomme/WCSTerrainProvider/tree/master/
    Modificado por GLS
    WCSTerrainProvider  */
    /*
    Objeto del que heredarán WCSTerrainProvider y WMTSTerrainProvider
     */

class WCSTerrainProvider extends OGCTerrainProvider {

    constructor(description, view) {        
        super(description, view);
    }

    parse(description) {
        const self = this;
        let resultat;
        description = description || {};

        if (cesium.defined(description.url)) {

            let urlofServer = description.url;
            const index = urlofServer.lastIndexOf("?");

            if (index > -1) {
                urlofServer = urlofServer.substring(0, index);
            }

            if (!cesium.defined(description.layerName)) {
                throw new cesium.DeveloperError('description.layerName is required.');
            }

            let urlDescribeCoverage =
                `${urlofServer}?SERVICE=WCS&VERSION=1.0.0&request=DescribeCoverage&Coverage=${description.layerName}`;

            if (cesium.defined(description.proxy)) {
                urlDescribeCoverage = description.proxy.getURL(urlDescribeCoverage);
            }

            resultat = cesium.Resource.fetchXML({ url: urlDescribeCoverage })
                .then(xml => self.getDescribeCoverage(xml, description))
                .catch(() => null);

        } else if (cesium.defined(description.xml)) {

            resultat = self.getDescribeCoverage(description.xml, description);

        } else {

            throw new cesium.DeveloperError(
                'either description.url or description.xml are required.'
            );
        }

        resultat.type = "WCS";
        return resultat;
    }

    getDescribeCoverage(coverage, description) {
        const self = this;
        const resultat = {};

        if (!cesium.defined(description.layerName)) {
            throw new cesium.DeveloperError('description.layerName is required.');
        }

        resultat.minLevel = description.minLevel ?? undefined;
        resultat.maxLevel = description.maxLevel ?? undefined;

        resultat.heightMapWidth = description.heightMapWidth ?? 65;
        resultat.heightMapHeight =
            description.heightMapWidth !== undefined
                ? description.heightMapWidth
                : resultat.heightMapWidth;

        const corner = Array.from(
            coverage.querySelectorAll('lonLatEnvelope pos')
        ).map(pos => pos.innerHTML.split(' '));

        resultat.lowerCorner = corner[0];
        resultat.upperCorner = corner[1];

        const low = convertToFloat(
            coverage.querySelector('gml\\:low, low').textContent.split(' ')
        );
        const high = convertToFloat(
            coverage.querySelector('gml\\:high, high').textContent.split(' ')
        );

        const epsgCode = 4326;
        const projstring = `EPSG:${epsgCode}`;
        const getCRS = this.OGCHelper.CRS.filter(elt => elt.name === projstring);

        if (getCRS.length > 0) {
            resultat.tilingScheme = new getCRS[0].tilingScheme({
                ellipsoid: getCRS[0].ellipsoid
            });
        } else {
            resultat.tilingScheme = undefined;
        }

        resultat.pixelSize = [65, 65];

        resultat.levelZeroMaximumGeometricError =
            cesium.TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
                resultat.tilingScheme._ellipsoid,
                Math.min(resultat.heightMapWidth, resultat.heightMapHeight),
                resultat.tilingScheme.getNumberOfXTilesAtLevel(0)
            );

        resultat.waterMask = false;
        resultat.ready = true;

        resultat.bbox = {
            WKID: epsgCode,
            EPSG: projstring,
            coord: [
                [resultat.lowerCorner[0], resultat.upperCorner[1]],
                resultat.lowerCorner,
                [resultat.upperCorner[0], resultat.lowerCorner[1]],
                resultat.upperCorner
            ],
            ulidx: 0,
            llidx: 1,
            lridx: 2,
            uridx: 3
        };

        resultat.getTileDataAvailable = (x, y, level) =>
            level <= resultat.minLevel &&
            level >= resultat.maxLevel &&
            resultat.isInTile(x, y, level);

        this.urlofServer = description.url;
        const idx = this.urlofServer.lastIndexOf("?");
        if (idx > -1) {
            this.urlofServer = this.urlofServer.substring(0, idx);
        }

        resultat.urlGetTerrain =
            `${this.urlofServer}?SERVICE=WCS&VERSION=1.0.0&REQUEST=GetCoverage` +
            `&COVERAGE=${description.layerName}&FORMAT={format}` +
            `&BBOX={west},{south},{east},{north}` +
            `&WIDTH=65&HEIGHT=65&CRS=EPSG:4326`;

        resultat.isTileInside = (x, y, level) => {
            const bbox = resultat.bbox;
            const rect = self.tilingScheme.tileXYToNativeRectangle(x, y, level);

            if (
                bbox.coord[bbox.ulidx][0] >= rect.east ||
                bbox.coord[bbox.lridx][0] <= rect.west ||
                bbox.coord[bbox.lridx][1] >= rect.north ||
                bbox.coord[bbox.ulidx][1] <= rect.south
            ) {
                return false;
            }

            return true;
        };

        resultat.isInTile = (x, y, level) => {
            const bbox = resultat.bbox;
            const rect = resultat.tilingScheme.tileXYToNativeRectangle(x, y, level);

            const contains = ([lon, lat]) =>
                lon >= rect.west &&
                lon <= rect.east &&
                lat >= rect.south &&
                lat <= rect.north;

            if (
                contains(bbox.coord[bbox.ulidx]) ||
                contains(bbox.coord[bbox.uridx]) ||
                contains(bbox.coord[bbox.llidx]) ||
                contains(bbox.coord[bbox.lridx])
            ) {
                return true;
            }

            const overlaps =
                bbox.coord[bbox.ulidx][0] < rect.east &&
                bbox.coord[bbox.lridx][0] > rect.west &&
                bbox.coord[bbox.lridx][1] < rect.north &&
                bbox.coord[bbox.ulidx][1] > rect.south;

            return overlaps;
        };

        resultat.templateToURL = (x, y, level) => {
            const rect = self.tilingScheme.tileXYToNativeRectangle(x, y, level);
            const xSpacing = (rect.east - rect.west) / (self.heightMapWidth - 1);
            const ySpacing = (rect.north - rect.south) / (self.heightMapHeight - 1);

            rect.west -= xSpacing * 0.5;
            rect.east += xSpacing * 0.5;
            rect.south -= ySpacing * 0.5;
            rect.north += ySpacing * 0.5;

            return resultat.urlGetTerrain
                .replace("{south}", rect.south)
                .replace("{north}", rect.north)
                .replace("{west}", rect.west)
                .replace("{east}", rect.east)
                .replace("{format}", self.format);
        };

        return resultat;
    }

    getCapabilities() {
        const urlGetCapabilities =
            `${this.urlofServer}?SERVICE=WCS&VERSION=1.0.0&request=GetCapabilities`;

        cesium.Resource.fetchXML({ url: urlGetCapabilities })
            .then(xml => {
                if (xml.querySelector('Service')) {
                    this.attributions = {};

                    const labelNode = xml.querySelector('Service label');
                    if (labelNode) {
                        this.attributions.name = labelNode.textContent.trim();
                    }

                    const linkNode = xml.querySelector('Service metadataLink');
                    if (linkNode) {
                        this.attributions.site = linkNode.getAttribute('about');
                    }
                }
            });

        this.description = this.description || {};
        return this.parse(this.description);
    }

    sampleTerrainMostDetailed(positions) {
        var self = this;

        var deferred = Promise.withResolvers();

        function doSamplingWhenReady() {
            if (self.ready) {/* provisional: el nivel se puede extraer Â¿? */
                doSampling(self, 16, positions).then(function (updatedPositions) {
                    deferred.resolve(updatedPositions);
                });
            } else {
                setTimeout(doSamplingWhenReady, 10);
            }
        }

        doSamplingWhenReady();

        return deferred;
    }
}
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

    promise.then(function (resultat) {
        if (cesium.defined(resultat) && (resultat.ready)) {
            

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
                    retour = self.tileCacheService.getTileData(x, y, level).then(function (tileData) {
                        let myHeightmapTerrainData = self.HeightmapTerrainData(tileData.data, {
                            width: self.heightMapHeight,
                            height: self.heightMapHeight
                        }, hasChildren);

                        self.lastTile = { 'x': x, 'y': y, 'level': level, 'value': myHeightmapTerrainData };

                        return myHeightmapTerrainData;
                    },function (_evt) {
                        const fetchDataImage = self.format === "image/tiff" ? cesium.Resource.fetchArrayBuffer : cesium.Resource.fetchImage
                        return fetchDataImage({ url: urlGetTileOrCoverage }).then(function (image) {
                            return self.ImageToHeightmapTerrainData(image, {
                                width: self.heightMapHeight,
                                height: self.heightMapHeight
                            }, x, y, level).then(function (myHeightmapBuffer) {                                
                                self.tileCacheService.addTile(x, y, level, myHeightmapBuffer);

                                let myHeightmapTerrainData = self.HeightmapTerrainData(myHeightmapBuffer, {
                                    width: self.heightMapHeight,
                                    height: self.heightMapHeight
                                }, hasChildren);

                                self.lastTile = { 'x': x, 'y': y, 'level': level, 'value': myHeightmapTerrainData };

                                return myHeightmapTerrainData;
                            });
                        },function () {
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
                    
                    if (level <= resultat.minLevel && level >= resultat.maxLevel) {
                        if (self.description.constraints && self.description.constraints.meterPerPixel) {
                            const rectangle = self.tilingScheme.tileXYToNativeRectangle(x, y, level);
                            if ((haversineDistance(rectangle.south, rectangle.west, rectangle.north, rectangle.west) / 65) > self.description.constraints.meterPerPixel)
                                return Promise.reject();
                        }
                        if (resultat.isTileInside(x, y, level) == true) {
                            retour = resultat.getHeightmapTerrainData(x, y, level);
                        } else {
                            retour = Promise.reject();
                        }
                    } else {
                        retour = Promise.reject();
                    }
                } else {
                    retour = Promise.reject();
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

            self._ready = true;
            self._readyPromise.resolve(self);

        } else {
            self._ready = false;
            self._readyPromise.reject(self);
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
        var tilePromise = requestPromise.then(createInterpolateFunction(tileRequest), createMarkFailedFunction(tileRequest));
        tilePromises.push(tilePromise);
    }

    return Promise.all(tilePromises).then(function () {
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

        var deferred = Promise.withResolvers();

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

import * as D3 from 'd3-polygon';
import { fromArrayBuffer } from 'geotiff';
const haversineDistance = function (lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = TC.Util.degToRad(lat1);
    const φ2 = TC.Util.degToRad(lat2);
    const Δφ = TC.Util.degToRad(lat2 - lat1);
    const Δλ = TC.Util.degToRad(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
}

export default WCSTerrainProvider;
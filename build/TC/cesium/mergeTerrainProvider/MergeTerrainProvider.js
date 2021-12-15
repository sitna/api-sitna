/* MergeTerrainProvider */
(function () {    
    /* d3-polygon: para validar si un punto está dentro de la cobertura de Navarra */
    // https://d3js.org/d3-polygon/ Version 1.0.3. Copyright 2017 Mike Bostock.
    !function (n, r) { "object" == typeof exports && "undefined" != typeof module ? r(exports) : "function" == typeof define && define.amd ? define(["exports"], r) : r(n.d3 = n.d3 || {}) }(this, function (n) { "use strict"; function r(n, r) { return n[0] - r[0] || n[1] - r[1] } function e(n) { for (var r = n.length, e = [0, 1], t = 2, o = 2; o < r; ++o) { for (; t > 1 && f(n[e[t - 2]], n[e[t - 1]], n[o]) <= 0;)--t; e[t++] = o } return e.slice(0, t) } var t = function (n) { for (var r, e = -1, t = n.length, o = n[t - 1], f = 0; ++e < t;) r = o, o = n[e], f += r[1] * o[0] - r[0] * o[1]; return f / 2 }, o = function (n) { for (var r, e, t = -1, o = n.length, f = 0, u = 0, l = n[o - 1], i = 0; ++t < o;) r = l, l = n[t], i += e = r[0] * l[1] - l[0] * r[1], f += (r[0] + l[0]) * e, u += (r[1] + l[1]) * e; return i *= 3, [f / i, u / i] }, f = function (n, r, e) { return (r[0] - n[0]) * (e[1] - n[1]) - (r[1] - n[1]) * (e[0] - n[0]) }, u = function (n) { if ((o = n.length) < 3) return null; var t, o, f = new Array(o), u = new Array(o); for (t = 0; t < o; ++t) f[t] = [+n[t][0], +n[t][1], t]; for (f.sort(r), t = 0; t < o; ++t) u[t] = [f[t][0], -f[t][1]]; var l = e(f), i = e(u), g = i[0] === l[0], a = i[i.length - 1] === l[l.length - 1], c = []; for (t = l.length - 1; t >= 0; --t) c.push(n[f[l[t]][2]]); for (t = +g; t < i.length - a; ++t) c.push(n[f[i[t]][2]]); return c }, l = function (n, r) { for (var e, t, o = n.length, f = n[o - 1], u = r[0], l = r[1], i = f[0], g = f[1], a = !1, c = 0; c < o; ++c) f = n[c], e = f[0], t = f[1], t > l != g > l && u < (i - e) * (l - t) / (g - t) + e && (a = !a), i = e, g = t; return a }, i = function (n) { for (var r, e, t = -1, o = n.length, f = n[o - 1], u = f[0], l = f[1], i = 0; ++t < o;) r = u, e = l, f = n[t], u = f[0], l = f[1], r -= u, e -= l, i += Math.sqrt(r * r + e * e); return i }; n.polygonArea = t, n.polygonCentroid = o, n.polygonHull = u, n.polygonContains = l, n.polygonLength = i, Object.defineProperty(n, "__esModule", { value: !0 }) });

    function MergeTerrainProvider(options, view, fallbackOptions) {

        this.noDataValue = options.noDataValue;
        this.view = view;

        this.commutingProvidersReady = false;
        this.commutingProvidersPromises = cesium.when.defer();

        this.surfaceHasTilesToRender = cesium.when.defer();
        this.surfaceTilesToRender = 0;

        this.fallback = fallbackOptions.fallback || [];
        this.fallbackProvider = [];

        this.fallbackProvider = this.fallback.map(function (options) {
            return new cesium.WCSTerrainProvider(options, view);
        });

        this.defaultFallbackProvider = new cesium.EllipsoidTerrainProvider();
        
        this.attributions = {};
        
        if (options.attributions) {
            this.attributions = options.attributions;
            this.view.map.trigger(TC.Consts.event.TERRAINPROVIDERADD, { terrainProvider: this });
        }

        if (!(options.url instanceof cesium.Resource)) {
            options.url = new cesium.Resource({
                url: options.url.trim()
            });
        }

        cesium.CesiumTerrainProvider.call(this, options);

        this.boundaries = fallbackOptions.boundaries;

        cesium.when.all([this._readyPromise, this.fallbackProvider[0].readyPromise, this.surfaceHasTilesToRender], function () {
            this.commutingProvidersReady = true;
            this.commutingProvidersPromises.resolve();            
        }.bind(this))
    }

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

    var loadPolygonContains = function () {
        // https://d3js.org/d3-polygon/ Version 1.0.3. Copyright 2017 Mike Bostock.
        !function (n, r) { "object" == typeof exports && "undefined" != typeof module ? r(exports) : "function" == typeof define && define.amd ? define(["exports"], r) : r(n.d3 = n.d3 || {}) }(this, function (n) { "use strict"; function r(n, r) { return n[0] - r[0] || n[1] - r[1] } function e(n) { for (var r = n.length, e = [0, 1], t = 2, o = 2; o < r; ++o) { for (; t > 1 && f(n[e[t - 2]], n[e[t - 1]], n[o]) <= 0;)--t; e[t++] = o } return e.slice(0, t) } var t = function (n) { for (var r, e = -1, t = n.length, o = n[t - 1], f = 0; ++e < t;) r = o, o = n[e], f += r[1] * o[0] - r[0] * o[1]; return f / 2 }, o = function (n) { for (var r, e, t = -1, o = n.length, f = 0, u = 0, l = n[o - 1], i = 0; ++t < o;) r = l, l = n[t], i += e = r[0] * l[1] - l[0] * r[1], f += (r[0] + l[0]) * e, u += (r[1] + l[1]) * e; return i *= 3, [f / i, u / i] }, f = function (n, r, e) { return (r[0] - n[0]) * (e[1] - n[1]) - (r[1] - n[1]) * (e[0] - n[0]) }, u = function (n) { if ((o = n.length) < 3) return null; var t, o, f = new Array(o), u = new Array(o); for (t = 0; t < o; ++t) f[t] = [+n[t][0], +n[t][1], t]; for (f.sort(r), t = 0; t < o; ++t) u[t] = [f[t][0], -f[t][1]]; var l = e(f), i = e(u), g = i[0] === l[0], a = i[i.length - 1] === l[l.length - 1], c = []; for (t = l.length - 1; t >= 0; --t) c.push(n[f[l[t]][2]]); for (t = +g; t < i.length - a; ++t) c.push(n[f[i[t]][2]]); return c }, l = function (n, r) { for (var e, t, o = n.length, f = n[o - 1], u = r[0], l = r[1], i = f[0], g = f[1], a = !1, c = 0; c < o; ++c) f = n[c], e = f[0], t = f[1], t > l != g > l && u < (i - e) * (l - t) / (g - t) + e && (a = !a), i = e, g = t; return a }, i = function (n) { for (var r, e, t = -1, o = n.length, f = n[o - 1], u = f[0], l = f[1], i = 0; ++t < o;) r = u, e = l, f = n[t], u = f[0], l = f[1], r -= u, e -= l, i += Math.sqrt(r * r + e * e); return i }; n.polygonArea = t, n.polygonCentroid = o, n.polygonHull = u, n.polygonContains = l, n.polygonLength = i, Object.defineProperty(n, "__esModule", { value: !0 }) });
    };

    MergeTerrainProvider.prototype.isPointInDefaultBoundaries = function (cartographic) {
        if (!d3.polygonContains) {
            loadPolygonContains();
        }

        if (!d3.polygonContains(this.boundaries, [cesium.Math.toDegrees(cartographic.longitude), cesium.Math.toDegrees(cartographic.latitude)])) {            
            return false;
        }

        return true;
    };

    MergeTerrainProvider.prototype.isInDefaultBoundaries = function (x, y, level) {
        var self = this;

        var toCheck = [];
        var rectangle = this.tilingScheme.tileXYToRectangle(x, y, level);

        toCheck.push(new cesium.Cartographic(rectangle.west, rectangle.south));
        toCheck.push(new cesium.Cartographic(rectangle.west, rectangle.north));
        toCheck.push(new cesium.Cartographic(rectangle.east, rectangle.south));
        toCheck.push(new cesium.Cartographic(rectangle.east, rectangle.north));

        for (var i = 0; i < toCheck.length; i++) {
            if (!self.isPointInDefaultBoundaries(toCheck[i])) {
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
            self.view.map.trigger(TC.Consts.event.TERRAINPROVIDERADD, { terrainProvider: provider });
        };

        const otherwise = function () {
            if (self.fallbackProvider && self.fallbackProvider[0].ready) {
                self.fallbackProvider[0].requestTileGeometry.apply(self, [x, y, level])
                    .then(function (terrainData) {
                        manageAttributions(self.fallbackProvider[0]);
                        promise.resolve(terrainData);
                    }).otherwise(function () {
                        promise.resolve(self.defaultFallbackProvider.requestTileGeometry([x, y, level]));
                    });
            } else {
                promise.resolve(self.defaultFallbackProvider.requestTileGeometry([x, y, level]));
            }
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

        if (toCheck.filter(function (position) { return !this.isPointInDefaultBoundaries(position); }.bind(this)).length === 0) {
            return cesium.sampleTerrainMostDetailed(this, positions);
        } else {
            return this.fallbackProvider[0].sampleTerrainMostDetailed(positions);
        }

    }

    cesium.MergeTerrainProvider = MergeTerrainProvider;
})();
/*
https://github.com/xlhomme/WCSTerrainProvider/tree/master/
Modificado por GLS
WCSTerrainProvider  */
(function () {
    var WCSTerrainProvider = function WCSTerrainProvider(description, view) {

        this.view = view;

        var deferred = cesium.when.defer();
        this._ready = false;
        this._readyPromise = deferred;

        this.url = description.url;
        this.layerName = description.layerName;

        if (!cesium.defined(description)) {
            throw new cesium.DeveloperError('description is required.');
        }
        var errorEvent = new cesium.Event();

        this._eventHelper = new cesium.EventHelper();

        var credit = description.credit;
        if (typeof credit === 'string') {
            credit = new cesium.Credit(credit);
        }

        this.tileCacheService = new TileCacheService('WCSTiles');
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
        if (cesium.defined(this.url)) {
            var urlofServer = this.url;
            var index = urlofServer.lastIndexOf("?");
            if (index > -1) {
                urlofServer = urlofServer.substring(0, index);
            }
        }

        var urlGetCapabilities = urlofServer + '?SERVICE=WCS&VERSION=1.0.0&request=GetCapabilities';
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

        description = cesium.defaultValue(description, cesium.defaultValue.EMPTY_OBJECT);
        var promise = OGCHelper.WCSParser.generate(description);
        TerrainParser(promise, this);
    };

    WCSTerrainProvider.TiledError = function () {
        console.log("TiledError");
    };

    WCSTerrainProvider.GeotiffToHeightmapTerrainData = function (noDataValue, arrayBuffer, size, x, y, level, tilingSc) {

        if (typeof (size) == "number") {
            size = { width: size, height: size };
        }

        var parser = new GeotiffParser();
        parser.parseHeader(arrayBuffer);
        var width = parser.imageWidth;
        var height = parser.imageLength;

        //console.log("Level " , level , "w" ,size.width, "h" , size.height);

        var index = 0;
        var heightBuffer = new Float32Array(size.height * size.width);

        // Convert pixelValue to heightBuffer 
        //--------------------------------------
        // We need to return a Heighmap of size 65x65
        // The requested Tile from WCS should be cloth but not 65x65 
        // We need to work in Native coordinate then get the pixel from the Parser.

        // Here we need to check if the tilingScheme.CRS is the same of the Image 
        // If no we need to convert 
        // But It will to slow the processus then we should assume tilingScheme has been set 
        // with the CRS of the image 

        if (size.height != height || size.width != width) {
            var rect = tilingSc.tileXYToNativeRectangle(x, y, level);
            var xSpacing = (rect.east - rect.west) / size.width;
            var ySpacing = (rect.north - rect.south) / size.height;

            for (var j = 0; j < size.height; j++)
                for (var i = 0; i < size.width; i++) {
                    // Transform i,j of the Heighmap into res[1], res[2] of the downloaded image
                    // if downloaded image is the same zize of heightBuffer this convertion wouldn't be done

                    var lon = rect.west + xSpacing * i;
                    var lat = rect.north - ySpacing * j;
                    var res = parser.PCSToImage(lon, lat);
                    if (res[0] == 1) {
                        var pixelValue = parser.getPixelValueOnDemand(res[1], res[2]);
                        if (!pixelValue || (pixelValue && pixelValue[0] <= noDataValue)) {
                            heightBuffer[index] = 0.0;
                        } else {
                            heightBuffer[index] = pixelValue[0];
                        }
                    }
                    else {
                        heightBuffer[index] = 0.0;
                    }
                    index++;
                }
        }
        else {
            for (var j = 0; j < size.height; j++)
                for (var i = 0; i < size.width; i++) {
                    var pixelValue = parser.getPixelValueOnDemand(i, j);
                    if (!pixelValue || (pixelValue && pixelValue[0] <= noDataValue)) {
                        heightBuffer[index] = 0.0;
                    } else {
                        heightBuffer[index] = pixelValue[0];
                    }
                    index++;
                }
        }

        return heightBuffer;
    };

    WCSTerrainProvider.HeightmapTerrainData = function (heightBuffer, size, childrenMask) {
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
    };

    WCSTerrainProvider.prototype.getAttribution = function () {
        var self = this;
        
        return self.attributions;
    };

    function TerrainParser(promise, provider) {
        cesium.when(promise, function (resultat) {

            if (cesium.defined(resultat) && (resultat.ready)) {
                provider._ready = true;
                provider._readyPromise.resolve(true);

                if (cesium.defined(resultat.urlGetCoverage)) {

                    resultat.getHeightmapTerrainDataFromWCS = function (x, y, level) {
                        var retour;
                        if (!isNaN(x + y + level)) {
                            var urlGetCoverage = templateToURL(resultat.urlGetCoverage, x, y, level, provider);

                            var hasChildren = 0;
                            if (level < resultat.maxLevel) {
                                // no need to test for all child --> we are in the case of isTileInside
                                hasChildren |= 1;
                                hasChildren |= 2;
                                hasChildren |= 4;
                                hasChildren |= 8;
                            }

                            // If the requested tile is the same as the last then return it
                            if (provider.lastTile != undefined &&
                                provider.lastTile.x == x &&
                                provider.lastTile.y == y &&
                                provider.lastTile.level == level) {
                                //console.log("get  Last Tile ",x, y, level);
                                return provider.lastTile.value;
                            }

                            // If the requested tile is in the TileCacheService then return it
                            // Otherwise use WCS Get Coverage to request the tile                              
                            retour = cesium.when(provider.tileCacheService.getTileData(x, y, level), function (tileData) {

                                var myHeightmapTerrainData = WCSTerrainProvider.HeightmapTerrainData(tileData.data, {
                                    width: provider._heightmapWidth,
                                    height: provider._heightmapWidth
                                }, hasChildren);

                                provider.lastTile = { 'x': x, 'y': y, 'level': level, 'value': myHeightmapTerrainData };

                                return myHeightmapTerrainData;

                            }).otherwise(function (evt) {

                                return cesium.when(cesium.Resource.fetchArrayBuffer({ url: urlGetCoverage }), function (image) {

                                    var myHeightmapBuffer = WCSTerrainProvider.GeotiffToHeightmapTerrainData(provider.noDataValue, image, {
                                        width: provider._heightmapWidth,
                                        height: provider._heightmapWidth
                                    }, x, y, level, provider.tilingScheme);

                                    provider.tileCacheService.addTile(x, y, level, myHeightmapBuffer);

                                    var myHeightmapTerrainData = WCSTerrainProvider.HeightmapTerrainData(myHeightmapBuffer, {
                                        width: provider._heightmapWidth,
                                        height: provider._heightmapWidth
                                    }, hasChildren);

                                    provider.lastTile = { 'x': x, 'y': y, 'level': level, 'value': myHeightmapTerrainData };

                                    return myHeightmapTerrainData;

                                }).otherwise(function () {

                                    return provider.DefaultProvider.requestTileGeometry(x, y, level);
                                });
                            });
                        }
                        return retour;
                    };
                }

                provider.getLevelMaximumGeometricError = function (level) {
                    return resultat.levelZeroMaximumGeometricError / (1 << level);
                };

                provider.requestTileGeometry = function (x, y, level) {
                    var retour;

                    if (cesium.defined(resultat.getHeightmapTerrainDataFromWCS)) {

                        if (!provider.adviced && level > 14) {                            
                            provider.view.map.toast(TC.Util.getLocaleString(provider.view.map.options.locale, "threed.terrainAdvice"), { type: TC.Consts.msgType.INFO });
                            provider.adviced = true;
                        }

                        if (level <= resultat.minLevel &&
                            level >= resultat.maxLevel) {

                            if (resultat.isTileInside(x, y, level, provider) == true) {                                
                                retour = resultat.getHeightmapTerrainDataFromWCS(x, y, level);
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

                Object.defineProperties(provider, {
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
                        var rect = provider.tilingScheme.tileXYToNativeRectangle(0, 0, j);
                        var xSpacing = (rect.east - rect.west) / (provider.heightMapWidth - 1);
                        var ySpacing = (rect.north - rect.south) / (provider.heightMapHeight - 1);
                        var scalingX = provider.pixelSize[0] / xSpacing
                        var scalingY = provider.pixelSize[1] / ySpacing;                        

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

    function templateToURL(urlParam, x, y, level, provider) {
        var rect = provider.tilingScheme.tileXYToNativeRectangle(x, y, level);
        var xSpacing = (rect.east - rect.west) / (provider.heightMapWidth - 1);
        var ySpacing = (rect.north - rect.south) / (provider.heightMapHeight - 1);

        rect.west -= xSpacing * 0.5;
        rect.east += xSpacing * 0.5;
        rect.south -= ySpacing * 0.5;
        rect.north += ySpacing * 0.5;

        return urlParam.replace("{south}", rect.south).replace("{north}", rect.north).replace("{west}", rect.west).replace("{east}", rect.east);
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

            if (!tileRequestSet.hasOwnProperty(key)) {
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

    function TileCacheService(objectStoreName) {
        this.database = null;
        this.objectStoreName = objectStoreName;
    }

    TileCacheService.prototype = {
        /* createDB : create the scheme of the database  */
        createDB: function () {

            // In the following line, you should include the prefixes of implementations you want to test.
            window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            // DON'T use "var indexedDB = ..." if you're not in a function.
            // Moreover, you may need references to some window.IDB* objects:
            window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
            window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
            if (!window.indexedDB) {
                window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
            }

            var request = window.indexedDB.open('TileCacheService', 1);
            var that = this;
            request.onsuccess = function (evt) {
                that.database = evt.target.result;
            };
            request.onerror = function (evt) {
                console.log("IndexedDB--> onerror ");
            };
            request.onupgradeneeded = function (evt) {
                var thisDB = evt.target.result;
                if (!thisDB.objectStoreNames.contains('WCSTiles')) {
                    var store = thisDB.createObjectStore('WCSTiles', { keyPath: 'id' });
                    store.createIndex("tile", ["level", "row", "column"], { unique: true });
                }

                if (!thisDB.objectStoreNames.contains('ImageTiles')) {
                    var store = thisDB.createObjectStore('ImageTiles', { keyPath: 'id' });
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

                requestGet.onerror = function (evt) {
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

    function GeotiffParser() {
        this.tiffDataView = undefined;
        this.littleEndian = undefined;
        this.imageWidth = undefined;
        this.imageLength = undefined;
        this.bitsPerPixel = undefined;
        this.samplesPerPixel = undefined;
        this.photometricInterpretation = undefined;
        this.compression = undefined;
        this.fileDirectories = [];
        this.sampleProperties = [];
        this.geoKeys = [];
        this.blocks = [];
        this.colorMapValues = [];
        this.colorMapSampleSize = undefined;
        this.isPixelArea = 0;
        this.planarConfiguration = 1;
        this.extraSamplesValues = [];
        this.numExtraSamples = 0;

    }

    /* GeotiffParser */
    GeotiffParser.prototype = {

        /* isLittleEndian from Tiff-js  */
        isLittleEndian: function () {
            // Get byte order mark.
            var BOM = this.getBytes(2, 0);

            // Find out the endianness.
            if (BOM === 0x4949) {
                this.littleEndian = true;
            } else if (BOM === 0x4D4D) {
                this.littleEndian = false;
            } else {
                console.log(BOM);
                throw TypeError("Invalid byte order value.");
            }

            return this.littleEndian;
        },

        /* from Tiff-js  */
        hasTowel: function () {
            // Check for towel.
            if (this.getBytes(2, 2) !== 42) {
                throw RangeError("You forgot your towel!");
            }

            return true;
        },

        /* Translate LinearCode to string  */
        getLinearUnitsName: function (linearUnitsCode) {
            var LinearUnitsName;
            switch (linearUnitsCode) {
                case 0:
                    LinearUnitsName = 'undefined';
                    break;
                case 9001:
                    LinearUnitsName = 'Linear_Meter';
                    break;
                case 9002:
                    LinearUnitsName = 'Linear_Foot';
                    break;
                case 9003:
                    LinearUnitsName = 'Linear_Foot_US_Survey';
                    break;
                case 9004:
                    LinearUnitsName = 'Linear_Foot_Modified_American';
                    break;
                case 9005:
                    LinearUnitsName = 'Linear_Foot_Clarke ';
                    break;
                case 9006:
                    LinearUnitsName = 'Linear_Foot_Indian ';
                    break;
                case 9007:
                    LinearUnitsName = 'Linear_Link ';
                    break;
                case 9008:
                    LinearUnitsName = 'Linear_Link_Benoit ';
                    break;
                case 9009:
                    LinearUnitsName = 'Linear_Link_Sears';
                    break;
                case 9010:
                    LinearUnitsName = 'Linear_Chain_Benoit';
                    break;
                case 9011:
                    LinearUnitsName = 'Linear_Chain_Sears';
                    break;
                case 9012:
                    LinearUnitsName = 'Linear_Yard_Sears';
                    break;
                case 9013:
                    LinearUnitsName = 'Linear_Yard_Indian';
                    break;
                case 9014:
                    LinearUnitsName = 'Linear_Fathom';
                    break;
                case 9015:
                    LinearUnitsName = 'user-Linear_Mile_International_Nautical';
                    break;
                default:
                    if (linearUnitsCode >= 9000 && linearUnitsCode <= 9099) LinearUnitsName = 'EPSG Linear Units';
                    else if (linearUnitsCode >= 9100 && linearUnitsCode <= 9199) LinearUnitsName = 'EPSG Angular Units';
                    else if (linearUnitsCode = 32767) LinearUnitsName = 'user-defined unit';
                    else if (linearUnitsCode > 32767) LinearUnitsName = 'Private User Implementations';
                    break;
            }
            return LinearUnitsName;
        },

        /* Translate LinearCode to string  */
        getAngularUnitsName: function (angularUnitsCode) {
            var AngularUnitsName;
            switch (angularUnitsCode) {
                case 0:
                    AngularUnitsName = 'undefined';
                    break;
                case 9001:
                    AngularUnitsName = 'Angular_Radian';
                    break;
                case 9002:
                    AngularUnitsName = 'Angular_Degree';
                    break;
                case 9003:
                    AngularUnitsName = 'Angular_Arc_Minute';
                    break;
                case 9004:
                    AngularUnitsName = 'Angular_Arc_Second';
                    break;
                case 9005:
                    AngularUnitsName = 'Angular_Grad';
                    break;
                case 9006:
                    AngularUnitsName = 'Angular_Gon';
                    break;
                case 9007:
                    AngularUnitsName = 'Angular_DMS';
                    break;
                case 9008:
                    AngularUnitsName = 'Angular_DMS_Hemisphere';
                    break;
                default:
                    if (angularUnitsCode >= 9000 && angularUnitsCode <= 9099) AngularUnitsName = 'EPSG Linear Units';
                    else if (angularUnitsCode >= 9100 && angularUnitsCode <= 9199) AngularUnitsName = 'EPSG Angular Units';
                    else if (angularUnitsCode = 32767) AngularUnitsName = 'user-defined unit';
                    else if (angularUnitsCode > 32767) AngularUnitsName = 'Private User Implementations';
                    break;
            }
            return AngularUnitsName;
        },

        /* Translate modelTypeCode to string  */
        getModelTypeName: function (modelTypeCode) {
            var modelTypeName;
            switch (modelTypeCode) {
                case 0:
                    modelTypeName = 'undefined';
                    break;
                case 1:
                    modelTypeName = 'ModelTypeProjected';
                    break;
                case 2:
                    modelTypeName = 'ModelTypeGeographic';
                    break;
                case 3:
                    modelTypeName = 'ModelTypeGeocentric';
                    break;
                case 32767:
                    modelTypeName = 'user-defined';
                    break;
                default:
                    if (modelTypeCode < 32767) modelTypeName = 'GeoTIFF Reserved Codes';
                    else if (modelTypeCode > 32767) modelTypeName = 'Private User Implementations';
                    break;
            }
            return modelTypeName;
        },

        /* Translate rasterTypeCode to string  */
        getRasterTypeName: function (rasterTypeCode) {
            var rasterTypeName;
            switch (rasterTypeCode) {
                case 0:
                    rasterTypeName = 'undefined';
                    break;
                case 1:
                    rasterTypeName = 'RasterPixelIsArea';
                    break;
                case 2:
                    rasterTypeName = 'RasterPixelIsPoint';
                    break;
                case 32767:
                    rasterTypeName = 'user-defined';
                    break;
                default:
                    if (rasterTypeCode < 32767) rasterTypeName = 'GeoTIFF Reserved Codes';
                    else if (rasterTypeCode > 32767) rasterTypeName = 'Private User Implementations';
                    break;
            }
            return rasterTypeName;
        },

        /* Translate GeoKey to string  */
        getGeoKeyName: function (geoKey) {
            var geoKeyTagNames = {
                1024: 'GTModelTypeGeoKey',
                1025: 'GTRasterTypeGeoKey',
                1026: 'GTCitationGeoKey',
                2048: 'GeographicTypeGeoKey',
                2049: 'GeogCitationGeoKey',
                2050: 'GeogGeodeticDatumGeoKey',
                2051: 'GeogPrimeMeridianGeoKey',
                2052: 'GeogLinearUnitsGeoKey',
                2053: 'GeogLinearUnitSizeGeoKey',
                2054: 'GeogAngularUnitsGeoKey',
                2055: 'GeogAngularUnitSizeGeoKey',
                2056: 'GeogEllipsoidGeoKey',
                2057: 'GeogSemiMajorAxisGeoKey',
                2058: 'GeogSemiMinorAxisGeoKey',
                2059: 'GeogInvFlatteningGeoKey',
                2060: 'GeogAzimuthUnitsGeoKey',
                2061: 'GeogPrimeMeridianLongGeoKey',
                2062: 'GeogTOWGS84GeoKey',
                3072: 'ProjectedCSTypeGeoKey',
                3073: 'PCSCitationGeoKey',
                3074: 'ProjectionGeoKey',
                3075: 'ProjCoordTransGeoKey',
                3076: 'ProjLinearUnitsGeoKey',
                3077: 'ProjLinearUnitSizeGeoKey',
                3078: 'ProjStdParallel1GeoKey',
                3079: 'ProjStdParallel2GeoKey',
                3080: 'ProjNatOriginLongGeoKey',
                3081: 'ProjNatOriginLatGeoKey',
                3082: 'ProjFalseEastingGeoKey',
                3083: 'ProjFalseNorthingGeoKey',
                3084: 'ProjFalseOriginLongGeoKey',
                3085: 'ProjFalseOriginLatGeoKey',
                3086: 'ProjFalseOriginEastingGeoKey',
                3087: 'ProjFalseOriginNorthingGeoKey',
                3088: 'ProjCenterLongGeoKey',
                3089: 'ProjCenterLatGeoKey',
                3090: 'ProjCenterEastingGeoKey',
                3091: 'ProjCenterNorthingGeoKey',
                3092: 'ProjScaleAtNatOriginGeoKey',
                3093: 'ProjScaleAtCenterGeoKey',
                3094: 'ProjAzimuthAngleGeoKey',
                3095: 'ProjStraightVertPoleLongGeoKey',
                3096: 'ProjRectifiedGridAngleGeoKey',
                4096: 'VerticalCSTypeGeoKey',
                4097: 'VerticalCitationGeoKey',
                4098: 'VerticalDatumGeoKey',
                4099: 'VerticalUnitsGeoKey'
            };
            var geoKeyName;

            if (geoKey in geoKeyTagNames) {
                geoKeyName = geoKeyTagNames[geoKey];
            } else {
                console.log("Unknown geoKey :", geoKey);
                geoKeyName = geoKey + "GeoKey";
            }
            return geoKeyName;
        },

        /* from Tiff-js  */
        getFieldTagName: function (fieldTag) {
            // See: http://www.digitizationguidelines.gov/guidelines/TIFF_Metadata_Final.pdf
            // See: http://www.digitalpreservation.gov/formats/content/tiff_tags.shtml
            var fieldTagNames = {
                // TIFF Baseline
                0x013B: 'Artist',
                0x0102: 'BitsPerSample',
                0x0109: 'CellLength',
                0x0108: 'CellWidth',
                0x0140: 'ColorMap',
                0x0103: 'Compression',
                0x8298: 'Copyright',
                0x0132: 'DateTime',
                0x0152: 'ExtraSamples',
                0x010A: 'FillOrder',
                0x0121: 'FreeByteCounts',
                0x0120: 'FreeOffsets',
                0x0123: 'GrayResponseCurve',
                0x0122: 'GrayResponseUnit',
                0x013C: 'HostComputer',
                0x010E: 'ImageDescription',
                0x0101: 'ImageLength',
                0x0100: 'ImageWidth',
                0x010F: 'Make',
                0x0119: 'MaxSampleValue',
                0x0118: 'MinSampleValue',
                0x0110: 'Model',
                0x00FE: 'NewSubfileType',
                0x0112: 'Orientation',
                0x0106: 'PhotometricInterpretation',
                0x011C: 'PlanarConfiguration',
                0x0128: 'ResolutionUnit',
                0x0116: 'RowsPerStrip',
                0x0115: 'SamplesPerPixel',
                0x0131: 'Software',
                0x0117: 'StripByteCounts',
                0x0111: 'StripOffsets',
                0x00FF: 'SubfileType',
                0x0107: 'Threshholding',
                0x011A: 'XResolution',
                0x011B: 'YResolution',

                // TIFF Extended
                0x0146: 'BadFaxLines',
                0x0147: 'CleanFaxData',
                0x0157: 'ClipPath',
                0x0148: 'ConsecutiveBadFaxLines',
                0x01B1: 'Decode',
                0x01B2: 'DefaultImageColor',
                0x010D: 'DocumentName',
                0x0150: 'DotRange',
                0x0141: 'HalftoneHints',
                0x015A: 'Indexed',
                0x015B: 'JPEGTables',
                0x011D: 'PageName',
                0x0129: 'PageNumber',
                0x013D: 'Predictor',
                0x013F: 'PrimaryChromaticities',
                0x0214: 'ReferenceBlackWhite',
                0x0153: 'SampleFormat',
                0x0154: 'SMinSampleValue',
                0x0155: 'SMaxSampleValue',
                0x022F: 'StripRowCounts',
                0x014A: 'SubIFDs',
                0x0124: 'T4Options',
                0x0125: 'T6Options',
                0x0145: 'TileByteCounts',
                0x0143: 'TileLength',
                0x0144: 'TileOffsets',
                0x0142: 'TileWidth',
                0x012D: 'TransferFunction',
                0x013E: 'WhitePoint',
                0x0158: 'XClipPathUnits',
                0x011E: 'XPosition',
                0x0211: 'YCbCrCoefficients',
                0x0213: 'YCbCrPositioning',
                0x0212: 'YCbCrSubSampling',
                0x0159: 'YClipPathUnits',
                0x011F: 'YPosition',

                // EXIF
                0x9202: 'ApertureValue',
                0xA001: 'ColorSpace',
                0x9004: 'DateTimeDigitized',
                0x9003: 'DateTimeOriginal',
                0x8769: 'Exif IFD',
                0x9000: 'ExifVersion',
                0x829A: 'ExposureTime',
                0xA300: 'FileSource',
                0x9209: 'Flash',
                0xA000: 'FlashpixVersion',
                0x829D: 'FNumber',
                0xA420: 'ImageUniqueID',
                0x9208: 'LightSource',
                0x927C: 'MakerNote',
                0x9201: 'ShutterSpeedValue',
                0x9286: 'UserComment',

                // IPTC
                0x83BB: 'IPTC',

                // ICC
                0x8773: 'ICC Profile',

                // XMP
                0x02BC: 'XMP',

                // GDAL
                0xA480: 'GDAL_METADATA',
                0xA481: 'GDAL_NODATA',

                // Photoshop
                0x8649: 'Photoshop',

                // GeoTiff
                0x830E: 'ModelPixelScale',
                0x8482: 'ModelTiepoint',
                0x85D8: 'ModelTransformation',
                0x87AF: 'GeoKeyDirectory',
                0x87B0: 'GeoDoubleParams',
                0x87B1: 'GeoAsciiParams'

            };

            var fieldTagName;

            if (fieldTag in fieldTagNames) {
                fieldTagName = fieldTagNames[fieldTag];
            } else {
                console.log("Unknown Field Tag:", fieldTag);
                fieldTagName = "Tag" + fieldTag;
            }
            return fieldTagName;
        },

        /* Translate the photometric code to a name  */
        getPhotometricName: function (key) {
            var photometricNames = {
                0: 'PHOTOMETRIC_MINISWHITE',
                1: 'PHOTOMETRIC_MINISBLACK',
                2: 'PHOTOMETRIC_RGB',
                3: 'PHOTOMETRIC_PALETTE',
                4: 'PHOTOMETRIC_MASK',
                5: 'PHOTOMETRIC_SEPARATED',
                6: 'PHOTOMETRIC_YCBCR',
                8: 'PHOTOMETRIC_CIELAB',
                9: 'PHOTOMETRIC_ICCLAB',
                10: 'PHOTOMETRIC_ITULAB',
                32844: 'PHOTOMETRIC_LOGL',
                32845: 'PHOTOMETRIC_LOGLUV'
            };
            var photometricName;

            if (key in photometricNames) {
                photometricName = photometricNames[key];
            } else {
                photometricName = "UNKNOWN";
            }
            return photometricName;
        },

        /* Translate GeoKey to string  */
        getCompressionTypeName: function (key) {
            var compressionNames = {

                1: 'COMPRESSION_NONE',
                2: 'COMPRESSION_CCITTRLE',
                3: 'COMPRESSION_CCITTFAX3',
                4: 'COMPRESSION_CCITTFAX4',
                5: 'COMPRESSION_LZW',
                6: 'COMPRESSION_OJPEG',
                7: 'COMPRESSION_JPEG',
                32766: 'COMPRESSION_NEXT',
                32771: 'COMPRESSION_CCITTRLEW',
                32773: 'COMPRESSION_PACKBITS',
                32809: 'COMPRESSION_THUNDERSCAN',
                32895: 'COMPRESSION_IT8CTPAD',
                32896: 'COMPRESSION_IT8LW',
                32897: 'COMPRESSION_IT8MP',
                32898: 'COMPRESSION_IT8BL',
                32908: 'COMPRESSION_PIXARFILM',
                32909: 'COMPRESSION_PIXARLOG',
                32946: 'COMPRESSION_DEFLATE',
                8: 'COMPRESSION_ADOBE_DEFLATE',
                32947: 'COMPRESSION_DCS',
                34661: 'COMPRESSION_JBIG',
                34676: 'COMPRESSION_SGILOG',
                34677: 'COMPRESSION_SGILOG24',
                34712: 'COMPRESSION_JP2000'
            };
            var compressionName;

            if (key in compressionNames) {
                compressionName = compressionNames[key];
            } else {
                compressionName = "UNKNOWN";
            }
            return compressionName;
        },

        /* from Tiff-js  */
        getFieldTypeName: function (fieldType) {
            var fieldTypeNames = {
                0x0001: 'BYTE',
                0x0002: 'ASCII',
                0x0003: 'SHORT',
                0x0004: 'LONG',
                0x0005: 'RATIONAL',
                0x0006: 'SBYTE',
                0x0007: 'UNDEFINED',
                0x0008: 'SSHORT',
                0x0009: 'SLONG',
                0x000A: 'SRATIONAL',
                0x000B: 'FLOAT',
                0x000C: 'DOUBLE'
            };

            var fieldTypeName;

            if (fieldType in fieldTypeNames) {
                fieldTypeName = fieldTypeNames[fieldType];
            }
            return fieldTypeName;
        },

        /* from Tiff-js  */
        getFieldTypeLength: function (fieldTypeName) {
            var fieldTypeLength;

            if (['BYTE', 'ASCII', 'SBYTE', 'UNDEFINED'].indexOf(fieldTypeName) !== -1) {
                fieldTypeLength = 1;
            } else if (['SHORT', 'SSHORT'].indexOf(fieldTypeName) !== -1) {
                fieldTypeLength = 2;
            } else if (['LONG', 'SLONG', 'FLOAT'].indexOf(fieldTypeName) !== -1) {
                fieldTypeLength = 4;
            } else if (['RATIONAL', 'SRATIONAL', 'DOUBLE'].indexOf(fieldTypeName) !== -1) {
                fieldTypeLength = 8;
            }

            return fieldTypeLength;
        },

        /* from Tiff-js  */
        getBits: function (numBits, byteOffset, bitOffset) {
            bitOffset = bitOffset || 0;
            var extraBytes = Math.floor(bitOffset / 8);
            var newByteOffset = byteOffset + extraBytes;
            var totalBits = bitOffset + numBits;
            var shiftRight = 32 - numBits;

            if (totalBits <= 0) {
                console.log(numBits, byteOffset, bitOffset);
                throw RangeError("No bits requested");
            } else if (totalBits <= 8) {
                var shiftLeft = 24 + bitOffset;
                var rawBits = this.tiffDataView.getUint8(newByteOffset, this.littleEndian);
            } else if (totalBits <= 16) {
                var shiftLeft = 16 + bitOffset;
                var rawBits = this.tiffDataView.getUint16(newByteOffset, this.littleEndian);
            } else if (totalBits <= 32) {
                var shiftLeft = bitOffset;
                var rawBits = this.tiffDataView.getUint32(newByteOffset, this.littleEndian);
            } else {
                console.log(numBits, byteOffset, bitOffset);
                throw RangeError("Too many bits requested");
            }

            var chunkInfo = {
                'bits': ((rawBits << shiftLeft) >>> shiftRight),
                'byteOffset': newByteOffset + Math.floor(totalBits / 8),
                'bitOffset': totalBits % 8
            };
            return chunkInfo;
        },

        /* from Tiff-js  */
        getBytes: function (numBytes, offset) {
            if (numBytes <= 0) {
                console.log(numBytes, offset);
                throw RangeError("No bytes requested");
            } else if (numBytes <= 1) {
                return this.tiffDataView.getUint8(offset, this.littleEndian);
            } else if (numBytes <= 2) {
                return this.tiffDataView.getUint16(offset, this.littleEndian);
            } else if (numBytes <= 3) {
                return this.tiffDataView.getUint32(offset, this.littleEndian) >>> 8;
            } else if (numBytes <= 4) {
                return this.tiffDataView.getUint32(offset, this.littleEndian);
            } else if (numBytes <= 8) {
                return this.tiffDataView.getFloat64(offset, this.littleEndian);
            } else {
                throw RangeError("Too many bytes requested");
            }
        },

        /* getSampleBytes : use Sampleformat  */
        getSampleBytes: function (sampleFormat, numBytes, offset) {

            // Decompress strip.
            switch (sampleFormat) {
                // Uncompressed
                case 1:
                case 2: // two’s complement signed integer data
                    return this.getBytes(numBytes, offset);
                case 3: // floating point data
                    {
                        if (numBytes == 3) {
                            return this.tiffDataView.getFloat32(offset, this.littleEndian) >>> 8;
                        } else if (numBytes == 4) {
                            return this.tiffDataView.getFloat32(offset, this.littleEndian);
                        }
                        // No break : if numBytes != 3 && 4 --> throw error
                    }
                case 5: // Complex Int
                case 6: // Complex IEEE floating point 
                case 4: // void or undefined  
                default:
                    throw Error("Do not attempt to parse the data  not handled  : " + sampleFormat);
                    break;
            }

        },

        /* from Tiff-js  */
        getFieldValues: function (fieldTagName, fieldTypeName, typeCount, valueOffset) {
            var fieldValues = [];
            var fieldTypeLength = this.getFieldTypeLength(fieldTypeName);
            var fieldValueSize = fieldTypeLength * typeCount;

            if (fieldValueSize <= 4) {
                // The value is stored at the big end of the valueOffset.
                if (this.littleEndian === false) {
                    var value = valueOffset >>> ((4 - fieldTypeLength) * 8);
                } else {
                    var value = valueOffset;
                }

                fieldValues.push(value);
            } else {
                for (var i = 0; i < typeCount; i++) {
                    var indexOffset = fieldTypeLength * i;

                    if (fieldTypeLength >= 8) {
                        if (['RATIONAL', 'SRATIONAL'].indexOf(fieldTypeName) !== -1) {
                            // Numerator
                            fieldValues.push(this.getBytes(4, valueOffset + indexOffset));
                            // Denominator
                            fieldValues.push(this.getBytes(4, valueOffset + indexOffset + 4));
                        } else if (['DOUBLE'].indexOf(fieldTypeName) !== -1) {
                            fieldValues.push(this.getBytes(8, valueOffset + indexOffset));
                            //console.log(this.getBytes(8, valueOffset + indexOffset) );
                        } else {
                            console.log(" fff" + fieldTypeName, typeCount, fieldValueSize);
                            //throw TypeError("Can't handle this field type or size");
                        }
                    } else {
                        fieldValues.push(this.getBytes(fieldTypeLength, valueOffset + indexOffset));
                    }
                }
            }

            if (fieldTypeName === 'ASCII') {
                fieldValues.forEach(function (e, i, a) {
                    a[i] = String.fromCharCode(e);
                });
            }
            return fieldValues;
        },

        /* from Tiff-js  */
        clampColorSample: function (colorSample, bitsPerSample) {
            var multiplier = Math.pow(2, 8 - bitsPerSample);
            return Math.floor((colorSample * multiplier) + (1 - multiplier));
        },

        clampAffineColorSample: function (colorSample, bitsPerSample, vmin, vmax) {
            var multiplier = Math.pow(2, 8) / vmax;
            return Math.floor((colorSample - vmin) * multiplier);
        },

        /* from Tiff-js  */
        makeRGBAFillValue: function (r, g, b, a) {
            if (typeof a === 'undefined') {
                a = 1.0;
            }
            return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
        },

        /* from Tiff-js  */
        parseFileDirectory: function (byteOffset) {
            var numDirEntries = this.getBytes(2, byteOffset);
            var tiffFields = [];

            for (var i = byteOffset + 2, entryCount = 0; entryCount < numDirEntries; i += 12, entryCount++) {
                var fieldTag = this.getBytes(2, i);
                var fieldType = this.getBytes(2, i + 2);
                var typeCount = this.getBytes(4, i + 4);
                var valueOffset = this.getBytes(4, i + 8);

                var fieldTagName = this.getFieldTagName(fieldTag);
                var fieldTypeName = this.getFieldTypeName(fieldType);
                var fieldValues = this.getFieldValues(fieldTagName, fieldTypeName, typeCount, valueOffset);

                tiffFields[fieldTagName] = { 'type': fieldTypeName, 'values': fieldValues };
            }

            this.fileDirectories.push(tiffFields);

            var nextIFDByteOffset = this.getBytes(4, i);

            if (nextIFDByteOffset === 0x00000000) {
                return this.fileDirectories;
            }
            else {
                return this.parseFileDirectory(nextIFDByteOffset);
            }
        },

        /* check if the Tif is a GeoTiff  */
        isGeotiff: function () {
            var fileDirectory = this.fileDirectories[0];
            if (typeof (fileDirectory.GeoKeyDirectory) == 'undefined' || fileDirectory.GeoKeyDirectory == null ||
                typeof (fileDirectory.GeoKeyDirectory.values) == 'undefined' || fileDirectory.GeoKeyDirectory.values == null)
                return false;
            var geoKeysDir = fileDirectory.GeoKeyDirectory.values;
            if (geoKeysDir.length < 4)
                return false;
            return true;
        },


        /* check  getPlanarConfiguration */
        getPlanarConfiguration: function () {
            var fileDirectory = this.fileDirectories[0];
            if (fileDirectory.hasOwnProperty('PlanarConfiguration') == false ||
                fileDirectory.PlanarConfiguration.hasOwnProperty('values') == false ||
                fileDirectory.PlanarConfiguration.values == null)
                return 1;

            return fileDirectory.PlanarConfiguration.values[0];
        },


        /* return the type  of the pixel or -1 */
        getSampleFormat: function () {
            var fileDirectory = this.fileDirectories[0];
            if (fileDirectory.hasOwnProperty('SampleFormat') == false ||
                fileDirectory.SampleFormat.hasOwnProperty('values') == false ||
                fileDirectory.SampleFormat.values == null)
                return 1;

            return fileDirectory.SampleFormat.values[0];
        },

        /* return min and max values if resent or -1 */
        getSampleMinMax: function () {
            var fileDirectory = this.fileDirectories[0];
            if (fileDirectory.hasOwnProperty('SMaxSampleValue') == false ||
                fileDirectory.SMaxSampleValue.hasOwnProperty('values') == false ||
                fileDirectory.SMaxSampleValue.values == null)
                return -1;

            if (fileDirectory.hasOwnProperty('SMinSampleValue') == false ||
                fileDirectory.SMinSampleValue.hasOwnProperty('values') == false ||
                fileDirectory.SMinSampleValue.values == null)
                return -1;

            return [fileDirectory.SMinSampleValue.values, fileDirectory.SMaxSampleValue.values];

        },

        /* isBlockLoaded : this function check if the block with blockOffset value has been loaded  */
        isBlockLoaded: function (blockOffset) {
            var blocks = this.blocks;
            for (var i = 0; i < blocks.length; i++)
                if (this.blocks[i] != null && this.blocks[i].offset == blockOffset)
                    return i;
            return -1;
        },

        /* getBlock : this function get the block with blockOffset value has been loaded  */
        getBlock: function (blockOffset) {
            var blocks = this.blocks;
            for (var i = 0; i < blocks.length; i++)
                if (this.blocks[i] != null && this.blocks[i].offset == blockOffset)
                    return this.blocks[i];
            return null;
        },

        /* add the new block to the list of the block 
         * ToDo : limit the number of block loaded in order to control the memory isage
         * remove older block 
         */
        addBlock: function (stripToLoad, block) {
            this.blocks[stripToLoad] = block
        },

        /* check if StripOffset is set */
        hasStripOffset: function () {
            var fileDirectory = this.fileDirectories[0];
            if (typeof (fileDirectory.StripOffsets) == 'undefined' || fileDirectory.StripOffsets == null ||
                typeof (fileDirectory.StripOffsets.values) == 'undefined' || fileDirectory.StripOffsets.values == null)
                return false;
            return true;
        },

        /* check if TileOffsets is set */
        hasTileOffset: function () {
            var fileDirectory = this.fileDirectories[0];
            if (fileDirectory.hasOwnProperty('TileOffsets') == false ||
                fileDirectory.TileOffsets.hasOwnProperty('values') == false || fileDirectory.TileOffsets.values == null)
                return false;
            return true;
        },

        /*  parse de GeoKeyDirectory and fill geoKeys */
        parseGeoKeyDirectory: function () {
            var fileDirectory = this.fileDirectories[0];
            if (this.isGeotiff() == false)
                return;

            var hdr_num_keys = fileDirectory.GeoKeyDirectory.values[3];

            var geoKeyFields = [];
            for (var iKey = 0; iKey < hdr_num_keys; iKey++) {
                /* GeoKey ID            */
                var ent_key = fileDirectory.GeoKeyDirectory.values[4 + iKey * 4];
                /* TIFF Tag ID or 0     */
                var ent_location = fileDirectory.GeoKeyDirectory.values[5 + iKey * 4];
                /* GeoKey value count   */
                var ent_count = fileDirectory.GeoKeyDirectory.values[6 + iKey * 4];
                /* value or tag offset  */
                var ent_val_offset = fileDirectory.GeoKeyDirectory.values[7 + iKey * 4];

                var value = 'undefined';
                if (ent_location == 0) {
                    /* store value into data value */
                    value = ent_val_offset;
                    //console.log("ent_val_offset =" + value );	
                }
                else if (this.getFieldTagName(ent_location) == "GeoKeyDirectory") {
                    console.log("ent_key =" + this.getGeoKeyName(ent_key));
                    console.log("ent_count =" + ent_count);
                    console.log("ent_val_offset =" + ent_val_offset);
                    console.log("GeoKeyDirectory =");

                }
                else if (this.getFieldTagName(ent_location) == "GeoDoubleParams") {
                    /*
                        console.log("ent_key =" + this.getGeoKeyName(ent_key));
                        console.log("ent_count =" + ent_count );		
                        console.log("ent_val_offset =" + ent_val_offset );
                        console.log("GeoDoubleParams ="  +GeoDoubleParams[ent_val_offset]);
                        */
                    var GeoDoubleParams = fileDirectory.GeoDoubleParams.values;
                    value = GeoDoubleParams[ent_val_offset];

                }
                else if (this.getFieldTagName(ent_location) == "GeoAsciiParams") {
                    var str = "";
                    /*console.log("ent_key =" + this.getGeoKeyName(ent_key));
                    console.log("ent_count =" + ent_count );
                    console.log("ent_val_offset =" + ent_val_offset );*/
                    var GeoAsciiParams = fileDirectory.GeoAsciiParams.values;
                    if (ent_val_offset != 'undefined' &&
                        ent_count != 'undefined' &&
                        ent_count > 0 &&
                        ent_val_offset <= ent_count - 1) {
                        for (var j = ent_val_offset; j < ent_count - 1; j++)
                            str += GeoAsciiParams[j];
                        if (GeoAsciiParams[ent_count - 1] != '|')
                            str += GeoAsciiParams[ent_count - 1];

                    }
                    value = str;
                }
                geoKeyFields[this.getGeoKeyName(ent_key)] = { 'value': value };
            }
            this.geoKeys = geoKeyFields;

            if (this.geoKeys.hasOwnProperty('GTRasterTypeGeoKey') == false)
                this.isPixelArea = 0;
            if (this.getRasterTypeName(this.geoKeys.GTRasterTypeGeoKey.value) == 'RasterPixelIsArea')
                this.isPixelArea = 1;

        },

        /* Test */
        consoleTiffProperty: function () {
            console.log("--------------- Tiff property -------------------");
            // Show Image parameter
            console.log("Image : w=" + this.imageWidth + " h=" + this.imageLength);

            // DataType  UChar8 or Int16
            console.log("BitsPerPixel=" + this.bitsPerPixel);

            // Band count : 1 or 3 bands RGB
            console.log("SamplesPerPixel=" + this.samplesPerPixel);
            console.log("PlanarConfiruration=" + this.planarConfiguration);
            console.log("Photometric =" + this.getPhotometricName(this.photometricInterpretation));
            console.log("Compression =" + this.getCompressionTypeName(this.compression));
            console.log("SampleFormat : ", this.getSampleFormat());
            console.log("getSampleMinMax : ", this.getSampleMinMax());

            var fileDirectory = this.fileDirectories[0];
            if (this.hasStripOffset()) {
                var numoffsetValues = fileDirectory.StripOffsets.values.length;
                console.log("Has Strips nb offsetvalues count:" + numoffsetValues);
            }

            if (this.hasTileOffset()) {
                var numoffsetValues = fileDirectory.TileOffsets.values.length;
                console.log("Has Tiles  offsetvalues count:" + numoffsetValues);
            }

        },

        /* Test */
        consoleGeotiffProperty: function () {
            console.log("--------------- GeoTiff property -------------------");
            var fileDirectory = this.fileDirectories[0];
            var hdr_version = fileDirectory.GeoKeyDirectory.values[0];
            var hdr_rev_major = fileDirectory.GeoKeyDirectory.values[1];
            var hdr_rev_minor = fileDirectory.GeoKeyDirectory.values[2];
            var hdr_num_keys = fileDirectory.GeoKeyDirectory.values[3];

            console.log("hdr_version =" + fileDirectory.GeoKeyDirectory + " " + hdr_version);
            console.log("hdr_rev_major =" + fileDirectory.GeoKeyDirectory + " " + hdr_rev_major);
            console.log("hdr_rev_minor =" + fileDirectory.GeoKeyDirectory + " " + hdr_rev_minor);
            console.log("hdr_num_keys =" + fileDirectory.GeoKeyDirectory + " " + hdr_num_keys);

            this.consoleCRSProperty();
            console.log("pixelSize =" + this.getPixelSize());
        },

        /* Test */
        consoleTestGeorefImage: function () {

            var x = 2;
            var y = 2;
            var res = this.ImageToPCS(x, y);
            if (res[0] == 1)
                console.log(" ImageToPCS " + res[1] + " " + res[2]);
            else
                console.log(" ImageToPCS failure");

            var res2 = this.PCSToImage(res[1], res[2]);
            if (res2[0] == 1)
                console.log(" PCSToImage " + res2[1] + " " + res2[2]);
            else
                console.log(" PCSToImage failure");
        },

        /*
         * parse Header
         * 
         */
        parseHeader: function (tiffArrayBuffer) {

            this.tiffDataView = new DataView(tiffArrayBuffer);
            this.littleEndian = this.isLittleEndian(this.tiffDataView);

            if (!this.hasTowel(this.tiffDataView, this.littleEndian)) {
                return;
            }

            var firstIFDByteOffset = this.getBytes(4, 4);

            this.fileDirectories = this.parseFileDirectory(firstIFDByteOffset);
            var fileDirectory = this.fileDirectories[0];

            this.imageWidth = fileDirectory.ImageWidth.values[0];
            this.imageLength = fileDirectory.ImageLength.values[0];
            this.photometricInterpretation = fileDirectory.PhotometricInterpretation.values[0];
            this.samplesPerPixel = fileDirectory.SamplesPerPixel.values[0];

            this.bitsPerPixel = 0;
            fileDirectory.BitsPerSample.values.forEach(function (bitsPerSample, i, bitsPerSampleValues) {
                this.sampleProperties[i] = {
                    'bitsPerSample': bitsPerSample,
                    'hasBytesPerSample': false,
                    'bytesPerSample': undefined
                };

                if ((bitsPerSample % 8) === 0) {
                    this.sampleProperties[i].hasBytesPerSample = true;
                    this.sampleProperties[i].bytesPerSample = bitsPerSample / 8;
                }

                this.bitsPerPixel += bitsPerSample;
            }, this);

            this.compression = (fileDirectory.Compression) ? fileDirectory.Compression.values[0] : 1;

            if (fileDirectory.ColorMap) {
                this.colorMapValues = fileDirectory.ColorMap.values;
                this.colorMapSampleSize = Math.pow(2, this.sampleProperties[0].bitsPerSample);
            }

            if (fileDirectory.ExtraSamples) {
                this.extraSamplesValues = fileDirectory.ExtraSamples.values;
                this.numExtraSamples = this.extraSamplesValues.length;
            }


            if (fileDirectory.hasOwnProperty('PlanarConfiguration') && true &&
                fileDirectory.PlanarConfiguration.hasOwnProperty('values') == true)
                this.planarConfiguration = fileDirectory.PlanarConfiguration.values[0];


            this.parseGeoKeyDirectory();
        },

        /*
        * SubFunction (should be private)
        * Decode a Strip or a Tiles 
        */
        decodeBlock: function (stripOffset, stripByteCount, moduleDecompression) {
            var decodedBlock = [];
            var jIncrement = 1, pixel = [];
            var sampleformat = this.getSampleFormat();
            // Decompress strip.
            switch (this.compression) {
                // Uncompressed
                case 1:
                    var bitOffset = 0;
                    var hasBytesPerPixel = false;
                    if ((this.bitsPerPixel % 8) === 0) {
                        hasBytesPerPixel = true;
                        var bytesPerPixel = this.bitsPerPixel / 8;
                    }

                    if (hasBytesPerPixel) {
                        jIncrement = bytesPerPixel;
                    } else {
                        jIncrement = 0;
                        throw RangeError("Cannot handle sub-byte bits per pixel");
                    }

                    for (var byteOffset = 0; byteOffset < stripByteCount; byteOffset += jIncrement) {

                        // Loop through samples (sub-pixels).
                        for (var m = 0, pixel = []; m < this.samplesPerPixel; m++) {
                            if (this.sampleProperties[m].hasBytesPerSample) {
                                var sampleOffset = this.sampleProperties[m].bytesPerSample * m;
                                pixel.push(this.getSampleBytes(sampleformat, this.sampleProperties[m].bytesPerSample, stripOffset + byteOffset + sampleOffset));
                            } else {
                                var sampleInfo = this.getBits(this.sampleProperties[m].bitsPerSample, stripOffset + byteOffset, bitOffset);

                                pixel.push(sampleInfo.bits);

                                byteOffset = sampleInfo.byteOffset - stripOffset;
                                bitOffset = sampleInfo.bitOffset;

                                throw RangeError("Cannot handle sub-byte bits per sample");
                            }
                        }

                        decodedBlock.push(pixel);
                    }
                    break;
                case 5:
                    var decompressed = LZString.decompressFromUint8Array(decodedBlock);

                    break;
                    // Deflate 
                    // Code not yes validate 
                case 32946:
                    var inflator = new moduleDecompression.Inflate();
                    var bitOffset = 0;
                    var hasBytesPerPixel = false;
                    if ((this.bitsPerPixel % 8) === 0) {
                        hasBytesPerPixel = true;
                        var bytesPerPixel = this.bitsPerPixel / 8;
                    }

                    if (hasBytesPerPixel) {
                        jIncrement = bytesPerPixel;
                    } else {
                        jIncrement = 0;

                        throw RangeError("Cannot handle sub-byte bits per pixel");
                    }

                    var isLast = false;
                    for (var byteOffset = 0; byteOffset < stripByteCount; byteOffset += jIncrement) {

                        // Loop through samples (sub-pixels).
                        for (var m = 0, pixel = []; m < this.samplesPerPixel; m++) {
                            if (this.sampleProperties[m].hasBytesPerSample) {
                                // XXX: This is wrong!
                                var sampleOffset = this.sampleProperties[m].bytesPerSample * m;

                                pixel.push(this.getBytes(this.sampleProperties[m].bytesPerSample, stripOffset + byteOffset + sampleOffset));
                            } else {
                                var sampleInfo = this.getBits(this.sampleProperties[m].bitsPerSample, stripOffset + byteOffset, bitOffset);

                                pixel.push(sampleInfo.bits);

                                byteOffset = sampleInfo.byteOffset - stripOffset;
                                bitOffset = sampleInfo.bitOffset;

                                throw RangeError("Cannot handle sub-byte bits per sample");
                            }
                        }

                        if (byteOffset + jIncrement >= stripByteCount)
                            isLast = true;
                        inflator.push(pixel, isLast);

                    }
                    if (inflator.err) {
                        console.log(inflator.msg);
                    }

                    decodedBlock.push(inflator.result);
                    break;

                    // PackBits
                case 32773:
                    var currentSample = 0;
                    var sample = 0;
                    var numBytes = 0;
                    var getHeader = true;
                    for (var byteOffset = 0; byteOffset < stripByteCount; byteOffset += jIncrement) {

                        // Are we ready for a new block?
                        if (getHeader) {
                            getHeader = false;

                            var blockLength = 1;
                            var iterations = 1;

                            // The header byte is signed.
                            var header = this.tiffDataView.getInt8(stripOffset + byteOffset, this.littleEndian);

                            if ((header >= 0) && (header <= 127)) { // Normal pixels.
                                blockLength = header + 1;
                            } else if ((header >= -127) && (header <= -1)) { // Collapsed pixels.
                                iterations = -header + 1;
                            } else /*if (header === -128)*/ { // Placeholder byte?
                                getHeader = true;
                            }
                        } else {
                            var currentByte = this.getBytes(1, stripOffset + byteOffset);

                            // Duplicate bytes, if necessary.
                            for (var m = 0; m < iterations; m++) {
                                if (this.sampleProperties[sample].hasBytesPerSample) {
                                    // We're reading one byte at a time, so we need to handle multi-byte samples.
                                    currentSample = (currentSample << (8 * numBytes)) | currentByte;
                                    numBytes++;

                                    // Is our sample complete?
                                    if (numBytes === this.sampleProperties[sample].bytesPerSample) {
                                        pixel.push(currentSample);
                                        currentSample = numBytes = 0;
                                        sample++;
                                    }
                                } else {
                                    throw RangeError("Cannot handle sub-byte bits per sample");
                                }

                                // Is our pixel complete?
                                if (sample === this.samplesPerPixel) {
                                    decodedBlock.push(pixel);

                                    pixel = [];
                                    sample = 0;
                                }
                            }

                            blockLength--;

                            // Is our block complete?
                            if (blockLength === 0) {
                                getHeader = true;
                            }
                        }

                        jIncrement = 1;
                    }
                    break;

                    // Unknown compression algorithm
                default:
                    throw Error("Do not attempt to parse the data Compression not handled  : " + this.getCompressionTypeName(this.compression));
                    // Do not attempt to parse the image data.
                    break;
            }

            var blockInfo = {
                'offset': stripOffset,
                'value': decodedBlock
            };
            return blockInfo;
        },


        /* use requireJS to get the decompressionModule
        *
        */
        getDecompressionModule: function (stripOffset, stripByteCount, moduleDecompression) {
            var moduleDecompression = undefined;
            // utiliser requirejs pour charger les modules de décompression 
            if (this.compression == 32946) {
                define(function (require) {
                    moduleDecompression = require('pako_inflate');
                });
                //moduleDecompression= require('pako_inflate');
            }
            return moduleDecompression;
        },

        /**
         * Load Pixels 
         */
        loadPixels: function () {
            var FullPixelValues = [];
            var index = 0;
            for (var j = 0; j < this.imageLength; j++)
                for (var i = 0; i < this.imageWidth; i++) {
                    var pixelValue = this.getPixelValueOnDemand(i, j);
                    for (var k = 0; k < this.samplesPerPixel; k++) {
                        FullPixelValues[index] = pixelValue[k];
                        index++;
                    }
                }
            return FullPixelValues;
        },

        /* getRGBAPixelValue
        *  This function is the default one , you shoul use this function in order to draw the image into a canvas
        *  If you have a multiband image , you should define how to combine bands in order to obtain a RGBA value
        */
        getRGBAPixelValue: function (pixelSamples) {
            var red = 0;
            var green = 0;
            var blue = 0;
            var opacity = 1.0;

            // To Understand this portion of code from Tiff-JS
            if (this.numExtraSamples > 0) {
                for (var k = 0; k < this.numExtraSamples; k++) {
                    if (this.extraSamplesValues[k] === 1 || this.extraSamplesValues[k] === 2) {
                        // Clamp opacity to the range [0,1].
                        opacity = pixelSamples[3 + k] / 256;

                        break;
                    }
                }
            }
            //-------------------------------------------
            var aRGBAPixelValue = [];
            switch (this.photometricInterpretation) {
                // Bilevel or Grayscale
                // WhiteIsZero
                case 0:
                    if (this.sampleProperties[0].hasBytesPerSample) {
                        var invertValue = Math.pow(0x10, this.sampleProperties[0].bytesPerSample * 2);
                    }

                    // Invert samples.
                    pixelSamples.forEach(function (sample, index, samples) {
                        samples[index] = invertValue - sample;
                    });

                    // Bilevel or Grayscale
                    // BlackIsZero
                case 1:
                    red = green = blue = this.clampColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample);
                    break;

                    // RGB Full Color
                case 2:
                    if (this.samplesPerPixel == 1)
                        red = green = blue = this.clampColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample);
                    else if (this.samplesPerPixel > 2) {
                        red = this.clampColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample);
                        green = this.clampColorSample(pixelSamples[1], this.sampleProperties[1].bitsPerSample);
                        blue = this.clampColorSample(pixelSamples[2], this.sampleProperties[2].bitsPerSample);
                    }
                    // Assuming 4 => RGBA 
                    if (this.samplesPerPixel == 4) {
                        // Check this function A should be a value between 0->1 ? then devide pixelSamples[3]/this.sampleProperties[3].bitsPerSample
                        var maxValue = Math.pow(2, this.sampleProperties[0].bitsPerSample);
                        opacity = pixelSamples[3] / maxValue;
                    }
                    break;

                    // RGB Color Palette
                case 3:
                    if (this.colorMapValues === undefined) {
                        throw Error("Palette image missing color map");
                    }

                    var colorMapIndex = pixelSamples[0];

                    red = this.clampColorSample(this.colorMapValues[colorMapIndex], 16);
                    green = this.clampColorSample(this.colorMapValues[this.colorMapSampleSize + colorMapIndex], 16);
                    blue = this.clampColorSample(this.colorMapValues[(2 * this.colorMapSampleSize) + colorMapIndex], 16);

                    break;


                    // Unknown Photometric Interpretation
                default:
                    throw RangeError(' Photometric Interpretation Not Yet Implemented::', getPhotometricName(this.photometricInterpretation));
                    break;
            }
            aRGBAPixelValue = [red, green, blue, opacity];
            return aRGBAPixelValue;
        },

        /* getRGBAPixelValue
        *  This function is the default one , you shoul use this function in order to draw the image into a canvas
        *  If you have a multiband image , you should define how to combine bands in order to obtain a RGBA value
        */
        getMinMaxPixelValue: function (pixelSamples, vmin, vmax) {
            var red = 0;
            var green = 0;
            var blue = 0;
            var opacity = 1.0;

            // To Understand this portion of code from Tiff-JS
            if (this.numExtraSamples > 0) {
                for (var k = 0; k < this.numExtraSamples; k++) {
                    if (this.extraSamplesValues[k] === 1 || this.extraSamplesValues[k] === 2) {
                        // Clamp opacity to the range [0,1].
                        opacity = pixelSamples[3 + k] / 256;

                        break;
                    }
                }
            }
            //-------------------------------------------
            var aRGBAPixelValue = [];
            switch (this.photometricInterpretation) {
                // Bilevel or Grayscale
                // WhiteIsZero
                case 0:
                    if (this.sampleProperties[0].hasBytesPerSample) {
                        var invertValue = Math.pow(0x10, this.sampleProperties[0].bytesPerSample * 2);
                    }

                    // Invert samples.
                    pixelSamples.forEach(function (sample, index, samples) {
                        samples[index] = invertValue - sample;
                    });

                    // Bilevel or Grayscale
                    // BlackIsZero
                case 1:
                    red = green = blue = this.clampAffineColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample, vmin, vmax);
                    break;

                    // RGB Full Color
                case 2:
                    if (this.samplesPerPixel == 1)
                        red = green = blue = this.clampAffineColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample, vmin, vmax);
                    else if (this.samplesPerPixel > 2) {
                        red = this.clampAffineColorSample(pixelSamples[0], this.sampleProperties[0].bitsPerSample, vmin, vmax);
                        green = this.clampAffineColorSample(pixelSamples[1], this.sampleProperties[1].bitsPerSample, vmin, vmax);
                        blue = this.clampAffineColorSample(pixelSamples[2], this.sampleProperties[2].bitsPerSample, vmin, vmax);
                    }
                    // Assuming 4 => RGBA 
                    if (this.samplesPerPixel == 4) {
                        // Check this function A should be a value between 0->1 ? then devide pixelSamples[3]/this.sampleProperties[3].bitsPerSample
                        var maxValue = Math.pow(2, this.sampleProperties[0].bitsPerSample);
                        opacity = pixelSamples[3] / maxValue;
                    }
                    break;

                    // RGB Color Palette
                case 3:
                    if (this.colorMapValues === undefined) {
                        throw Error("Palette image missing color map");
                    }

                    var colorMapIndex = pixelSamples[0];

                    red = this.clampAffineColorSample(this.colorMapValues[colorMapIndex], 16, vmin, vmax);
                    green = this.clampAffineColorSample(this.colorMapValues[this.colorMapSampleSize + colorMapIndex], 16, vmin, vmax);
                    blue = this.clampAffineColorSample(this.colorMapValues[(2 * this.colorMapSampleSize) + colorMapIndex], 16, vmin, vmax);

                    break;


                    // Unknown Photometric Interpretation
                default:
                    throw RangeError(' Photometric Interpretation Not Yet Implemented::', getPhotometricName(this.photometricInterpretation));
                    break;
            }
            aRGBAPixelValue = [red, green, blue, opacity];
            return aRGBAPixelValue;
        },

        /* Test getPixelValueOnDemand
       *  start implementation : 
       *  1 -  check if the block is loaded  if not load the block
       *  2 - get the pixel value in the block
       */
        getClosestPixelValue: function (x, y) {
            x = Math.floor(x);
            y = Math.floor(y);

            var fileDirectory = this.fileDirectories[0];
            var blockToLoad = 0;
            var offsetValues = [];
            var numoffsetValues = 0;
            var blockByteCountValues = [];
            var rowsPerStrip = 0;
            var decompressionModule = this.getDecompressionModule();
            var xInBlock = x;
            var yInBlock = y;
            var blockWidth = 0;
            var blockInfo = [];
            if (this.hasStripOffset()) {
                // If RowsPerStrip is missing, the whole image is in one strip.
                if (fileDirectory.RowsPerStrip) {
                    rowsPerStrip = fileDirectory.RowsPerStrip.values[0];
                    blockToLoad = Math.floor(y / rowsPerStrip);
                } else {
                    rowsPerStrip = this.imageLength;
                }
                offsetValues = fileDirectory.StripOffsets.values;
                blockWidth = this.imageWidth;

                var idBlocks = this.isBlockLoaded(offsetValues[blockToLoad]);
                if (idBlocks == -1) {
                    // StripByteCounts is supposed to be required, but see if we can recover anyway.
                    if (fileDirectory.StripByteCounts) {
                        blockByteCountValues = fileDirectory.StripByteCounts.values;
                    } else {
                        console.log("Missing StripByteCounts!");
                        // Infer StripByteCounts, if possible.
                        if (numoffsetValues === 1) {
                            blockByteCountValues = [Math.ceil((this.imageWidth * this.imageLength * bitsPerPixel) / 8)];
                        } else {
                            throw Error("Cannot recover from missing StripByteCounts");
                        }
                    }
                    blockInfo = this.decodeBlock(offsetValues[blockToLoad], blockByteCountValues[blockToLoad], decompressionModule);
                    this.addBlock(blockToLoad, blockInfo);
                    //console.log("Load block " , blockToLoad);
                }
                else {
                    //console.log("Block is already load" , blockToLoad, idBlocks );
                    blockInfo = this.blocks[idBlocks];
                }
                yInBlock = y % rowsPerStrip;
            }
            else if (this.hasTileOffset()) {
                offsetValues = fileDirectory.TileOffsets.values;
                var tileLength = fileDirectory.TileLength.values[0];
                var tileWidth = fileDirectory.TileWidth.values[0];
                var iTile = Math.floor(x / tileWidth);
                var jTile = Math.floor(y / tileLength);
                var TilesAcross = Math.ceil(this.imageWidth / tileWidth);
                blockToLoad = jTile * TilesAcross + iTile;
                blockWidth = tileWidth;

                var idBlocks = this.isBlockLoaded(offsetValues[blockToLoad]);
                if (idBlocks == -1) {
                    blockByteCountValues = fileDirectory.TileByteCounts.values;
                    blockInfo = this.decodeBlock(offsetValues[blockToLoad], blockByteCountValues[blockToLoad], decompressionModule);
                    this.addBlock(blockToLoad, blockInfo);
                    //console.log("Load block " , blockToLoad);
                }
                else {
                    //console.log("Block is already load" , blockToLoad, idBlocks );
                    blockInfo = this.blocks[idBlocks];
                }
                xInBlock = x % tileWidth;
                yInBlock = y % tileLength;
            }
            var indice = yInBlock * blockWidth + xInBlock;
            return blockInfo.value[indice];
        },

        /* Test getPixelValueOnDemand
        *  start implementation : 
        *  1 -  check if the block is loaded  if not load the block
        *  2 - get the pixel value in the block
        */
        getPixelValueOnDemand: function (x, y) {
            if (this.planarConfiguration != 1)
                throw ("Other Planar Configuration is not yet implemented");


            if (this.isPixelArea) {
                return this.getClosestPixelValue(x, y);
            }

            /* Calcul de l'interpolation 
            var ix= Math.floor(x);
            var iy= Math.floor(y);
            var  a1 = this.getPixelValueOnDemand(ix, iy);
            var  a2 = this.getPixelValueOnDemand(ix + 1, iy);
            var  a3 = this.getPixelValueOnDemand(ix + 1, iy + 1);
            var  a4 = this.getPixelValueOnDemand(ix, iy + 1);
            // Avant d'inerpoler  : vérifier si on a les même valeurs 

            // puis calculer l'interpolation en tre 4 val (formule ?) 
            */

            // retourne la valeur du pixel le plus proche 
            var ix = Math.floor(x + 0.5);
            var iy = Math.floor(y + 0.5);
            return this.getClosestPixelValue(ix, iy);


        },

        /** get the CRS code */
        getCRSCode: function () {
            var CRSCode = 0;
            if (this.geoKeys.hasOwnProperty('GTModelTypeGeoKey') == false)
                return 0;
            if (this.getModelTypeName(this.geoKeys.GTModelTypeGeoKey.value) == 'ModelTypeGeographic'
                && this.geoKeys.hasOwnProperty('GeographicTypeGeoKey'))
                CRSCode = this.geoKeys['GeographicTypeGeoKey'].value;

            else if (this.getModelTypeName(this.geoKeys.GTModelTypeGeoKey.value) == 'ModelTypeProjected' &&
                this.geoKeys.hasOwnProperty('ProjectedCSTypeGeoKey'))
                CRSCode = this.geoKeys['ProjectedCSTypeGeoKey'].value;
            else if (this.getModelTypeName(this.geoKeys.GTModelTypeGeoKey.value) == 'user-defined') {
                if (this.geoKeys.hasOwnProperty('ProjectedCSTypeGeoKey'))
                    CRSCode = this.geoKeys['ProjectedCSTypeGeoKey'].value;
                else if (this.geoKeys.hasOwnProperty('GeographicTypeGeoKey'))
                    CRSCode = this.geoKeys['GeographicTypeGeoKey'].value;
                else
                    // Littel Hack for 3857
                    if (this.geoKeys.hasOwnProperty('GTCitationGeoKey') &&
                        this.geoKeys['GTCitationGeoKey'].value.search("WGS_1984_Web_Mercator_Auxiliary_Sphere") != -1)
                        CRSCode = 3857;
                    else
                        this.consoleCRSProperty();

            }
            return CRSCode;
        },

        /** get the CRS code */
        consoleCRSProperty: function () {
            //GeoTIFF Configuration GeoKeys
            var Configuration_GeoKeys = [1024, 1026];
            // Geographic CS Parameter GeoKeys
            var GeographicCS_GeoKeys = [2048, 2061];
            // Projected CS Parameter GeoKeys
            var ProjectedCS_GeoKeys = [3072, 3073];
            //Projection Definition GeoKeys
            var Projection_GeoKeys = [3074, 3094];
            //Vertical CS Parameter Keys
            var Vertical_GeoKeys = [4096, 4099];
            this.test_consoleGeoKeys("GeoTIFF Configuration GeoKeys", Configuration_GeoKeys);
            this.test_consoleGeoKeys("Geographic CS Parameter GeoKeys", GeographicCS_GeoKeys);
            this.test_consoleGeoKeys("Projected CS Parameter GeoKeys", ProjectedCS_GeoKeys);
            this.test_consoleGeoKeys("Projection Definition GeoKeys", Projection_GeoKeys);
            this.test_consoleGeoKeys("Vertical CS Parameter Keys", Vertical_GeoKeys);
        },

        /** show consoleGeokey  */
        test_consoleGeoKeys: function (Label, GeoKeyTab) {
            console.log(Label);
            for (var i = GeoKeyTab[0]; i <= GeoKeyTab[1]; i++) {
                var geoKeyName = this.getGeoKeyName(i);
                if (this.geoKeys.hasOwnProperty(geoKeyName))
                    console.log(geoKeyName + " " + this.geoKeys[geoKeyName].value);
            }
        },

        /** isPixelArea */
        isPixelArea: function () {
            if (this.geoKeys.hasOwnProperty('GTRasterTypeGeoKey') == false)
                return true; // default 
            if (this.getRasterTypeName(this.geoKeys.GTRasterTypeGeoKey.value) == 'RasterPixelIsArea')
                return true;

            return false;
        },

        /**
         * Get the pixel value 
         * Ex : var pixels = parse.parseTIFF(response);
         *      var pixel = parse.getPixelValue(pixels,i,j);
         */
        getPixelValue: function (buffer, x, y) {
            if (this.getPlanarConfiguration() != 1) {
                throw ("Other Planar Configuration is not yet implemented");
            }

            var value = [];
            if (x < 0 || x >= this.imageWidth || y < 0 || y >= this.imageLength) {
                return value;
            }

            var indice = this.samplesPerPixel * (y * this.imageWidth + x);
            for (var i = 0; i < this.samplesPerPixel; i++) {
                //console.log(x,y,this.samplesPerPixel,i,buffer[indice+i] ) ;
                value[i] = buffer[indice + i]; // don't use array.push in big loops
            }
            return value;
        },

        getLowResPixelValue: function (buffer, x, y) {
            if (this.getPlanarConfiguration() != 1) {
                throw ("Other Planar Configuration is not yet implemented");
            }

            var value = [];
            if (x < 0 || x >= this.imageWidth || y < 0 || y >= this.imageLength) {
                return value;
            }

            var indice1 = this.samplesPerPixel * (y * this.imageWidth + x);
            var offsetX = (x < this.imageWidth ? x + 1 : x);
            var indice2 = this.samplesPerPixel * (y * this.imageWidth + offsetX);
            var indice3 = this.samplesPerPixel * (y * this.imageWidth + x);
            var indice4 = this.samplesPerPixel * ((y < this.imageLength ? y + 1 : y) * this.imageWidth + offsetX);
            for (var i = 0; i < this.samplesPerPixel; i++) {
                var averageValue = (buffer[indice1 + i] + buffer[indice2 + i] + buffer[indice3 + i] + buffer[indice4 + i]) / 4;
                value[i] = Math.round(averageValue);
            }
            return value;
        },

        /**
         * This function display the tiff into a canvas 
         */

        toCanvas: function (canvas, xmin, ymin, xmax, ymax, vmin, vmax) {
            var mycanvas = canvas || document.createElement('canvas');

            if (mycanvas.getContext == null) {
                throw RangeError("No Context for canvas");
            }

            var ctx = mycanvas.getContext("2d");
            mycanvas.width = xmax - xmin;
            mycanvas.height = ymax - xmin;
            var pixrgba = [];
            // Set a default fill style.	
            ctx.fillStyle = this.makeRGBAFillValue(255, 255, 255, 0);
            for (var y = ymin; y < ymax; y++) {
                for (var x = xmin; x < xmax; x++) {
                    var pixSample = this.getPixelValueOnDemand(x, y);
                    if (pixSample != 'undefined') {
                        if (vmin != 'undefined' && vmax != 'undefined')
                            pixrgba = this.getMinMaxPixelValue(pixSample, vmin, vmax);
                        else
                            pixrgba = this.getRGBAPixelValue(pixSample);
                    }
                    else
                        pixrgba = [255, 0, 0, 1];
                    ctx.fillStyle = this.makeRGBAFillValue(pixrgba[0], pixrgba[1], pixrgba[2], pixrgba[3]);
                    //ctx.fillStyle = this.makeRGBAFillValue(0, 0,248,1);
                    ctx.fillRect(x - xmin, y - ymin, 1, 1);
                }
            }
            return mycanvas;
        },

        /** Compute or retreive a PixelScale / Resolution or CellSize */
        getPixelSize: function () {
            var pixel_scale = ['undefined', 'undefined'];
            var fileDirectory = this.fileDirectories[0];
            if (typeof (fileDirectory.ModelPixelScale) != 'undefined' && fileDirectory.ModelPixelScale != null &&
                typeof (fileDirectory.ModelPixelScale.values) != 'undefined' && fileDirectory.ModelPixelScale.values != null)
                return fileDirectory.ModelPixelScale.values;

            var p0 = this.ImageToPCS(0, 0);
            var p1 = this.ImageToPCS(1, 0);
            var p2 = this.ImageToPCS(0, 1);
            if (p0[0] == 0 || p1[0] == 0 || p2[0] == 0)
                return pixel_scale;

            var c_pixel_scale = [p1[1] - p0[1], p2[2] - p0[2]];
            return c_pixel_scale;
        },

        /**
         * See GeoTiff geo_trans.c
         */
        GTIFTiepointTranslate: function (gcp_count, x, y, directTransfo) {
            var fileDirectory = this.fileDirectories[0];
            var modelTiepoint = fileDirectory.ModelTiepoint.values;
            /* I would appreciate a _brief_ block of code for doing second order
               polynomial regression here! */
            return [0, x, y];
        },

        /**
        * return a BBox of the Image
        */
        GetBBox: function () {
            var pCRS = this.getCRSCode();

            var ul = this.ImageToPCS(0, 0);
            var ur = this.ImageToPCS(this.imageWidth, 0);
            var ll = this.ImageToPCS(0, this.imageLength);
            var lr = this.ImageToPCS(this.imageWidth, this.imageLength);
            if (ul[0] != 1 || ur[0] != 1 || ll[0] != 1 || lr[0] != 1) {
                throw TypeError("BBox error");
            }

            // Create the BBox structure
            // Coord a counterclockWise
            var lcoordinates = [];
            lcoordinates.push(ul.splice(1, 2));
            lcoordinates.push(ll.splice(1, 2));
            lcoordinates.push(lr.splice(1, 2));
            lcoordinates.push(ur.splice(1, 2));

            var projstring = 'EPSG:' + pCRS.toString();
            var bbox = {
                'WKID': pCRS.toString(),
                'EPSG': projstring,
                'coord': lcoordinates,
                'ulidx': 0,
                'llidx': 1,
                'lridx': 2,
                'uridx': 3
            };
            return bbox;
        },

        /**
         * Translate a pixel/line coordinates to projection coordinate .
         * See GeoTiff geo_trans.c
         */
        ImageToPCS: function (x, y) {

            var res = [0, x, y];
            var tiepoint_count, count, transform_count;

            var fileDirectory = this.fileDirectories[0];
            if (typeof (fileDirectory.ModelTiepoint) == 'undefined' || fileDirectory.ModelTiepoint == null ||
                typeof (fileDirectory.ModelTiepoint.values) == 'undefined' || fileDirectory.ModelTiepoint.values == null)
                tiepoint_count = 0;
            else {

                var modelTiepoint = fileDirectory.ModelTiepoint.values;
                tiepoint_count = modelTiepoint.length;
            }

            if (typeof (fileDirectory.ModelPixelScale) == 'undefined' || fileDirectory.ModelPixelScale == null ||
                typeof (fileDirectory.ModelPixelScale.values) == 'undefined' || fileDirectory.ModelPixelScale.values == null)
                count = 0;
            else {
                var modelPixelScale = fileDirectory.ModelPixelScale.values;
                count = modelPixelScale.length;
            }

            if (typeof (fileDirectory.ModelTransformation) == 'undefined' || fileDirectory.ModelTransformation == null ||
                typeof (fileDirectory.ModelTransformation.values) == 'undefined' || fileDirectory.ModelTransformation.values == null)
                transform_count = 0;
            else {
                var modelTransformation = fileDirectory.ModelTransformation.values;
                transform_count = modelTransformation.length;
            }

            //--------------------------------------------------------------------
            //If the pixelscale count is zero, but we have tiepoints use      
            //the tiepoint based approach.                                    
            //--------------------------------------------------------------------
            if (tiepoint_count > 6 && count == 0) {
                console.log(" tiepoint_count ", tiepoint_count);

                res = this.GTIFTiepointTranslate(tiepoint_count / 6, x, y, true);
            }

                //--------------------------------------------------------------------
                //If we have a transformation matrix, use it. 			
                //--------------------------------------------------------------------
            else if (transform_count == 16) {
                var transform = fileDirectory.ModelTransformation.values;

                var x_in = x;
                var y_in = y;

                x = x_in * transform[0] + y_in * transform[1] + transform[3];
                y = x_in * transform[4] + y_in * transform[5] + transform[7];

                res = [1, x, y];
            }

                //--------------------------------------------------------------------
                //For now we require one tie point, and a valid pixel scale.      
                //-------------------------------------------------------------------- 
            else if (count < 3 || tiepoint_count < 6) {
                res = [0, x, y];
            }

            else {
                var pixel_scale = fileDirectory.ModelPixelScale.values;
                var tiepoints = fileDirectory.ModelTiepoint.values;
                x = (x - tiepoints[0]) * pixel_scale[0] + tiepoints[3];
                y = (y - tiepoints[1]) * (-1 * pixel_scale[1]) + tiepoints[4];

                res = [1, x, y];
            }
            return res;
        },

        /**
        * Inverse GeoTransfom
        * See GeoTiff geo_trans.c
        */
        inv_geotransform: function (gt_in) {
            var gt_out = [0, 0, 0, 0, 0, 0];
            var det, inv_det;

            /* we assume a 3rd row that is [0 0 1] */

            /* Compute determinate */

            det = gt_in[0] * gt_in[4] - gt_in[1] * gt_in[3];

            if (Math.abs(det) < 0.000000000000001)
                return [0, gt_out];

            inv_det = 1.0 / det;

            /* compute adjoint, and devide by determinate */

            gt_out[0] = gt_in[4] * inv_det;
            gt_out[3] = -gt_in[3] * inv_det;

            gt_out[1] = -gt_in[1] * inv_det;
            gt_out[4] = gt_in[0] * inv_det;

            gt_out[2] = (gt_in[1] * gt_in[5] - gt_in[2] * gt_in[4]) * inv_det;
            gt_out[5] = (-gt_in[0] * gt_in[5] + gt_in[2] * gt_in[3]) * inv_det;

            return [1, gt_out];
        },

        /**
         * Translate a projection coordinate to pixel/line coordinates.
         * See GeoTiff geo_trans.c
         */

        PCSToImage: function (x, y) {
            var res = [0, x, y];
            var tiepoint_count, count, transform_count = 0;

            // -------------------------------------------------------------------- 
            //      Fetch tiepoints and pixel scale.                                
            // -------------------------------------------------------------------- 
            var fileDirectory = this.fileDirectories[0];
            if (typeof (fileDirectory.ModelTiepoint) == 'undefined' || fileDirectory.ModelTiepoint == null ||
                typeof (fileDirectory.ModelTiepoint.values) == 'undefined' || fileDirectory.ModelTiepoint.values == null)
                tiepoint_count = 0;
            else {

                var modelTiepoint = fileDirectory.ModelTiepoint.values;
                tiepoint_count = modelTiepoint.length;
            }

            if (typeof (fileDirectory.ModelPixelScale) == 'undefined' || fileDirectory.ModelPixelScale == null ||
                typeof (fileDirectory.ModelPixelScale.values) == 'undefined' || fileDirectory.ModelPixelScale.values == null)
                count = 0;
            else {
                var modelPixelScale = fileDirectory.ModelPixelScale.values;
                count = modelPixelScale.length;
            }

            if (typeof (fileDirectory.ModelTransformation) == 'undefined' || fileDirectory.ModelTransformation == null ||
                typeof (fileDirectory.ModelTransformation.values) == 'undefined' || fileDirectory.ModelTransformation.values == null)
                transform_count = 0;
            else {
                var modelTransformation = fileDirectory.ModelTransformation.values;
                transform_count = modelTransformation.length;
            }
            // -------------------------------------------------------------------- 
            //      If the pixelscale count is zero, but we have tiepoints use      
            //      the tiepoint based approach.                                    
            // -------------------------------------------------------------------- 
            if (tiepoint_count > 6 && count == 0) {
                res = this.GTIFTiepointTranslate(tiepoint_count / 6, x, y, false);
            }

                // -------------------------------------------------------------------- 
                //      Handle matrix - convert to "geotransform" format, invert and    
                //      apply.                                                          
                // -------------------------------------------------------------------- 
            else if (transform_count == 16) {
                var transform = fileDirectory.ModelTransformation.values;

                var x_in = x;
                var y_in = y;

                var gt_in = [0, 0, 0, 0, 0, 0];

                gt_in[0] = transform[0];
                gt_in[1] = transform[1];
                gt_in[2] = transform[3];
                gt_in[3] = transform[4];
                gt_in[4] = transform[5];
                gt_in[5] = transform[7];

                var result = this.inv_geotransform(gt_in);

                if (!result[0])
                    res = [0, x, y];
                else {
                    var gt_out = result[1];
                    x = x_in * gt_out[0] + y_in * gt_out[1] + gt_out[2];
                    y = x_in * gt_out[3] + y_in * gt_out[4] + gt_out[5];

                    res = [1, x, y];
                }
            }

                // -------------------------------------------------------------------- 
                //      For now we require one tie point, and a valid pixel scale.      
                // -------------------------------------------------------------------- 
            else if (count >= 3 && tiepoint_count >= 6) {
                var pixel_scale = fileDirectory.ModelPixelScale.values;
                var tiepoints = fileDirectory.ModelTiepoint.values;
                x = (x - tiepoints[3]) / pixel_scale[0] + tiepoints[0];
                y = (y - tiepoints[4]) / (-1 * pixel_scale[1]) + tiepoints[1];

                res = [1, x, y];
            }

            return res;
        }
    };

    var OGCHelper = {};

    OGCHelper.WCSParser = {};
    /**
     * static array where CRS availables for OGCHelper are defined
     */
    OGCHelper.CRS = [{
        name: "CRS:84",
        ellipsoid: cesium.Ellipsoid.WGS84,
        firstAxeIsLatitude: false,
        tilingScheme: cesium.GeographicTilingScheme,
        supportedCRS: "urn:ogc:def:crs:OGC:2:84"
    }, {
        name: "EPSG:4258",
        ellipsoid: cesium.Ellipsoid.WGS84,
        firstAxeIsLatitude: true,
        tilingScheme: cesium.GeographicTilingScheme,
        SupportedCRS: "urn:ogc:def:crs:EPSG::4258"
    }, {
        name: "EPSG:4326",
        ellipsoid: cesium.Ellipsoid.WGS84,
        firstAxeIsLatitude: true,
        tilingScheme: cesium.GeographicTilingScheme,
        SupportedCRS: "urn:ogc:def:crs:EPSG::4326"
    }, {
        name: "EPSG:3857",
        ellipsoid: cesium.Ellipsoid.WGS84,
        firstAxeIsLatitude: false,
        tilingScheme: cesium.WebMercatorTilingScheme,
        SupportedCRS: "urn:ogc:def:crs:EPSG::3857"
    }, {
        name: "OSGEO:41001",
        ellipsoid: cesium.Ellipsoid.WGS84,
        firstAxeIsLatitude: false,
        tilingScheme: cesium.WebMercatorTilingScheme,
        SupportedCRS: "urn:ogc:def:crs:EPSG::3857"
    }];

    OGCHelper.FormatImage = [{
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
    }];

    OGCHelper.WCSParser.generate = function (description) {
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
                return OGCHelper.WCSParser.getDescribeCoverage(xml, description);
            }).otherwise(function () {
                return cesium.when.defer.resolve(null);
            });


        } else if (cesium.defined(description.xml)) {
            resultat = OGCHelper.WCSParser.getDescribeCoverage(description.xml, description);
        } else {
            throw new cesium.DeveloperError(
                'either description.url or description.xml are required.');
        }
        return resultat;
    };

    function convertToFloat(tab) {
        for (var j = 0; j < tab.length; j++) {
            var b = parseFloat(tab[j]);
            if (!isNaN(b))
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

    OGCHelper.WCSParser.getDescribeCoverage = function (coverage, description) {

        var resultat = {};

        if (!cesium.defined(description.layerName)) {
            throw new cesium.DeveloperError(
                'description.layerName is required.');
        }

        var layerName = description.layerName;
        resultat.minLevel = cesium.defaultValue(description.minLevel, undefined);
        resultat.maxLevel = cesium.defaultValue(description.maxLevel, undefined);

        resultat.heightMapWidth = cesium.defaultValue(description.heightMapWidth, 65);
        resultat.heightMapHeight = cesium.defaultValue(description.heightMapHeight, resultat.heightMapWidth);

        var corner = coverage.querySelector('lonLatEnvelope').textContent.trim().split(' ').filter(function (elm) { return elm.trim().length > 0 });

        var lowerCorner = convertToFloat(corner.slice(0, 2));
        var upperCorner = convertToFloat(corner.slice(2));

        resultat.upperCorner = upperCorner;
        resultat.lowerCorner = lowerCorner;

        var low = convertToFloat(coverage.querySelector('gml\\:low, low').textContent.split(' '));
        var high = convertToFloat(coverage.querySelector('gml\\:high, high').textContent.split(' '));

        var epsgCode = 4326;
        var projstring = 'EPSG:' + epsgCode.toString();
        var getCRS = OGCHelper.CRS.filter(function (elt) {
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
        var urlofServer = description.url;
        var index = urlofServer.lastIndexOf("?");
        if (index > -1) {
            urlofServer = urlofServer.substring(0, index);
        }

        /* WCS 1.0.0 */
        var urlGetCoverage = urlofServer +
            "?SERVICE=WCS&VERSION=1.0.0&REQUEST=GetCoverage" +
            "&COVERAGE=" + description.layerName + "&FORMAT=" + description.format + "&BBOX=" + "{west},{south},{east},{north}" + "&WIDTH=" + 65 + "&HEIGHT=" + 65 + "&CRS=EPSG:4326";

        resultat.urlGetCoverage = urlGetCoverage;

        // Is the X,Y,Level define a tile that is contains in our bbox
        resultat.isTileInside = function (x, y, level, provider) {
            var inside = true;
            var bbox = resultat.bbox;
            var rect = provider.tilingScheme.tileXYToNativeRectangle(x, y, level);

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

        return resultat;
    };
})();
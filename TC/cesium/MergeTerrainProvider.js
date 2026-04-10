
import {
    CustomHeightmapTerrainProvider,
    sampleTerrainMostDetailed
} from 'cesium';
import  WCSTerrainProvider  from './OGCTerrainProvider.js';

class MergeTerrainProvider extends CustomHeightmapTerrainProvider {    
    constructor(terrains,view) {
        super({
            width: 65,
            height: 65,
            callback: function () {
            }
        });
       
        this.terrains = [];
        this.ready = false;

        this._logging = false;

        this.surfaceHasTilesToRender = Promise.withResolvers();
        this.surfaceTilesToRender = 0;

        this._log = new Map();

        const _deferred = Promise.withResolvers();
        this.readyPromise = _deferred.promise;
        this.maximumLevel = 16;

        window.tileSourceMap = new Map();

        this.defaultFallbackProvider = new cesium.EllipsoidTerrainProvider();        

        Promise.all([/*this.surfaceHasTilesToRender.promise,*/...terrains.map(function (options, _index) {
            if (options.type === "WMTS" || (!options.type && options.url.indexOf("WMTS") >= 0)) {
                return (new cesium.WMTSTerrainProvider(options, view)).readyPromise;
            }
            //else if (options.type === "ARCGIS" || (!options.type && options.url.indexOf("ARCGIS") >= 0)) {
            //    return new cesium.ArcGISTiledElevationTerrainProvider(options);ogc
            //}
            else if (options.type === "WCS" || (!options.type && options.url.indexOf("WCS") >= 0)) {
                return (new WCSTerrainProvider(options, view)).readyPromise;
            }
            else
                return cesium.CesiumTerrainProvider.fromUrl(options.url, {
                    credit: options.credit
                });
        })]).then((_terrains) => {
            this.terrains = _terrains;
            this.terrains.forEach((terrain) => {
                this.maximumLevel = Math.max(this.maximumLevel, terrain.availability?._maximumLevel || 0);
            })
            this.ready = true;
            _deferred.resolve(this);
        });  
        return this.readyPromise;
        
    }

    get availability() {
        return this.terrains.find((provider) => provider.availability).availability
    }

    loadTileDataAvailability(x, y, level) {
        return this.terrains[1].loadTileDataAvailability(x, y, level)
    }

    getTileDataAvailable(x, y, level) {               

        ///* la disponibilidad del globo depende de que haya tiles renderizados/pendientes de rederizar. Si resuelvo la promesa al instanciar, 
        //   no al pedir tiles, llega a usar el globo antes de estar disponible.  */
        if (this.surfaceTilesToRender > 5) {
            this.surfaceHasTilesToRender.resolve();
        }
        this.surfaceTilesToRender++;
        for (var i = 0; i < this.terrains.length; i++) {
            if (this.terrains[i].getTileDataAvailable(x, y, level))
                return true;
        }
        return false;
    }

    //Puedes sobrescribir métodos de la clase base si es necesario
    async requestTileGeometry(x, y, level, request) {
        // Lógica personalizada para solicitar la geometría del tile
        let terrain;
        if (level > this.maximumLevel) {
            return new cesium.HeightmapTerrainData({
                buffer: null,
                width: 65,
                height: 65
            });
        }
        else {            
            for (var i = 0; i < this.terrains.length; i++) {
                if (this.terrains[i].getTileDataAvailable(x, y, level)) {
                    try {
                        terrain = await this.terrains[i].requestTileGeometry(x, y, level);
                        const offset = this.terrains[i].description && this.terrains[i].description.offset;
                        if (offset)
                            terrain._buffer = terrain._buffer.map((value) => value + offset);
                        if (terrain._minimumHeight !== 0 && terrain._maximumHeight !== 0) {
                            if (this._logging)
                                this._log.set(`${level}/${x}/${y}`, i);
                            return terrain;
                        }
                        else if (i === this.terrains.length - 1) { 
                            if (this._logging)
                                this._log.set(`${level}/${x}/${y}`, i);
                            return terrain;
                        }
                    }
                    catch (err) {
                        console.log("continua");
                    }
                }

            }
        }

        return this.defaultFallbackProvider.requestTileGeometry(x, y, level, request);
    }

    async sampleTerrainMostDetailed(positions) {
        let updatedPositions;
        for (var i = 0; i < this.terrains.length; i++) {
            if (!this.terrains[i].availability) continue;
            updatedPositions = await sampleTerrainMostDetailed(this.terrains[i], positions);
            if (!updatedPositions.some((position) => position.height === 0))
                break;
        }

        return updatedPositions;

    }

    get allReady() {
        return this.ready;
    }
    get allReadyPromise () {
        return this.readyPromise;
    }

    log(key) {
        if(key)
            return this._log.get(key);
        return null
    }

    set logging (value) {
        this._logging = value;
    }
    
}


export default MergeTerrainProvider;
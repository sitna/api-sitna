import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import Click from './Click.js';
import ThreeDDraw from './ThreeDDraw.js';
import { tcFeatureConstructor} from './ThreeDUtils.js';

export default class FeatureInfo extends Click {
    constructor(options) {
        super(options.map.viewer);
        this.map = options.map;
        this.drawControl = null;
        this.pending = false;
        this.marker = null;
        this.ctlResultsPanel = null;
        this.ctlFeatureInfo = options.parent;
        this.isActive = false;
        this.savedMode = null;
        this.map2DgetResolutionFN = this.map.map.getResolution;
        this._clickExceptions = [];

        // Inicializar FeatureInfo
        this._initFeatureInfo();
    }

    /* ============================
       Inicialización
       ============================ */
    _initFeatureInfo() {
        
        this.eventHandlers = {};
        this.eventHandlers.handlerOfFeatures = new cesium.ScreenSpaceEventHandler(this.map.viewer.scene.canvas);

        if (this.ctlFeatureInfo) {
            this.savedMode = this.ctlFeatureInfo.displayMode;

            this._getResultsPanelCtl(this.ctlFeatureInfo).then(() => {

                this.ctlFeatureInfo.setDisplayMode(Consts.infoContainer.RESULTS_PANEL);

                this.map.map.on(Consts.event.RESULTSPANELCLOSE, (e) => {
                    if (e.control === this.ctlFeatureInfo.getDisplayControl()) {
                        if (!this.ctlFeatureInfo.querying) {
                            this._removeMarker();
                        }
                    }
                });
            });
        }
    }
    _commonFeatureInfo = function (pickPosition, geometryType) {
        const self = this.map;
        if (this._entityClick(pickPosition) || this.drawControl?.isDrawing) {
            return;
        }
        const dataSource = self.view3D.dataSources.get(this.ctlFeatureInfo.resultsLayer);
        self.view3D.dataSources.get(this.ctlFeatureInfo.filterLayer)?.entities.removeAll();
        if (this.drawControl) {
            if (!this.drawControl.isDrawing) { 
                this.drawControl.activate();
                this.drawControl.addPoint(pickPosition);
            }            
        }            
        else { 
            this.drawControl = new ThreeDDraw(this.map.viewer, geometryType, {
                dataSource,
                strokeColor:"#0000FF"
            });
            this.drawControl.activate();
            this.drawControl.addPoint(pickPosition);
            this.drawControl.addEventListener('drawstart', (evt) => { 
                this.ctlFeatureInfo.resultsPanel.close();
            });
            this.drawControl.addEventListener('drawend', (evt) => {
                this.drawControl.deactivate();
                const apiFeature = tcFeatureConstructor(evt.detail.positions, evt.detail.type);
                if (self.view3D.view2DCRS !== self.view3D.crs)
                    apiFeature.setCoordinates(apiFeature.getCoordinates({ geometryCrs: self.view3D.crs, crs: self.view3D.view2DCRS }));
                this.ctlFeatureInfo.filterLayer.addFeature(apiFeature);
                const entity = evt.target.drawShape_(evt.detail.positions);
                apiFeature.wrap.feature3D = entity;
                entity._wrap = { parent: apiFeature };
                this.ctlFeatureInfo.filterFeature = apiFeature;
                const dataSource = self.view3D.dataSources.get(this.ctlFeatureInfo.filterLayer)
                dataSource.entities.add(entity);
                this.ctlFeatureInfo.wrap.getFeaturesByGeometry(apiFeature);
            });
        }
        
        
    }
    _getInfoOnPickedPosition = function (pickedPosition, overTileSet = false) {
        var self = this.map.map;

        if (!pickedPosition) {
            return;
        } else {
            self.one(Consts.event.DRAWTABLE, function (_e) {
                self.getLoadingIndicator().removeWait(self.waiting);
                delete self.waiting;
            });

            this.send(pickedPosition).then(function (_e) {
                self.getLoadingIndicator().removeWait(self.waiting);
                delete self.waiting;
            });
        }
    }
    _lineFeatureInfo = function (pickPosition) {        
        this._commonFeatureInfo(pickPosition, 'polyline');
    }
    _polygonFeatureInfo = function (pickPosition) {        
        this._commonFeatureInfo(pickPosition, 'polygon');
    }
    _entityClick = function (pickPosition) {
        const self = this.map;
        const getFeature = (id) => {
            for (var layerId in self.view3D.vector2DFeatures) {
                if (hasOwnProperty.call(self.view3D.vector2DFeatures[layerId], id)) {
                    const feature2D = self
                        .map
                        .workLayers
                        .find(workLayer => workLayer.id === layerId)
                        .features
                        .filter(feature => id.indexOf(feature.id) > -1 && feature.showsPopup);

                    if (feature2D && feature2D.length > 0) {
                        return feature2D[0].wrap.feature3D
                    }
                }
            }
            return null;
        };  
        let entityClick = false;
        const pickedFeature = self.viewer.pick(pickPosition);
       
        if (pickedFeature) {
            if (pickedFeature.id && this._checkClickException(pickedFeature.id)) {// && !(pickedFeature.id._wrap && pickedFeature.id._wrap.parent.layer.owner instanceof TC.control.Geolocation)) {                
                const feature = pickedFeature.id instanceof cesium.Entity ? pickedFeature.id : getFeature(pickedFeature.id);
                if (feature?.id === "pegman") {
                    return;
                }
                //resalte 3D
                if (!feature._wrap) {
                    //esto es cuando pinchamoos en un punto que es resalte de un entidad de tipo punto
                    const originalPoint = pickedFeature.id.entityCollection._entities._array.find((f) => f.position === pickedFeature.id.position && f._wrap);
                    if (originalPoint?._wrap) {
                        self.map.trigger(Consts.event.FEATURECLICK, { feature: originalPoint._wrap.parent });
                        entityClick = true;
                    }
                }
                else {                    
                    entityClick = true;
                    self.map.trigger(Consts.event.FEATURECLICK, { feature: feature._wrap.parent });
                }
                    
            }
            else if (pickedFeature.primitive) {
                if (pickedFeature.primitive instanceof cesium.Cesium3DTileset && pickedFeature.primitive.show) {
                    var ray = self.viewer.camera.getPickRay(pickPosition);
                    var position = pickedFeature.primitive.pick(ray, self.viewer.scene);                    
                    this._getInfoOnPickedPosition(position, true);
                    entityClick = true;
                }
                if (pickedFeature.primitive instanceof cesium.GroundPrimitive && pickedFeature.primitive.parent) {
                    self.map.trigger(Consts.event.FEATURECLICK, { feature: pickedFeature.primitive.parent.feature2D });
                    entityClick = true;
                }
            }
        }
        return entityClick;
    }
    _pointFeatureInfo = function (pickPosition) {
        const self = this.map;        
        const getFeatureInfo = () => {
            var ray = self.viewer.camera.getPickRay(pickPosition);
            var position = self.viewer.scene.globe.pick(ray, self.viewer.scene);
            if (position) {

                self.map.one(Consts.event.DRAWTABLE, function (_e) {
                    self.map.getLoadingIndicator().removeWait(self.waiting);
                    delete self.waiting;
                });

                this.send.call(this, position).then(function (_e) {
                    self.map.getLoadingIndicator().removeWait(self.waiting);
                    delete self.waiting;
                });
            }
        }
        if (!this._entityClick(pickPosition))
            getFeatureInfo();
            //if (this.ctlFeatureInfo instanceof TC.control.Click) {
            //    if (self.map.activeControl.callback) {
            //        const ray = self.viewer.camera.getPickRay(movement.position);
            //        const position = self.viewer.scene.globe.pick(ray, self.viewer.scene);
            //        const geoPosition = cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
            //        self.map.activeControl.callback(Util.reproject([cesium.Math.toDegrees(geoPosition.longitude), cesium.Math.toDegrees(geoPosition.latitude)], self.view3D.crs, self.view3D.view2DCRS));
            //    }
            //}
            //else
                 
    };
    _clickManagement = null;

    /* ============================
       Panel de resultados
       ============================ */
    _getResultsPanelCtl(ctlFeatureInfo) {
        if (this.ctlResultsPanel) {
            return Promise.resolve();
        }

        const resultsPanelOptions = {
            content: "table",
            titles: {
                main: Util.getLocaleString(this.map.map.getLocale(), "threed.rs.panel.gfi"),
                max: Util.getLocaleString(this.map.map.getLocale(), "threed.rs.panel.gfi")
            }
        };

        let addControlPromise;
        const controlContainer = this.map.map.getControlsByClass('TC.control.ControlContainer')[0];

        if (controlContainer) {
            resultsPanelOptions.position = controlContainer.POSITION.RIGHT;
            addControlPromise = controlContainer.addControl('resultsPanel', resultsPanelOptions);
        } else {
            resultsPanelOptions.div = document.createElement('div');
            this.map.map.div.appendChild(resultsPanelOptions.div);
            addControlPromise = this.map.map.addControl('resultsPanel', resultsPanelOptions);
        }

        return addControlPromise.then((control) => {
            control.caller = ctlFeatureInfo;
            this.ctlResultsPanel = control;
            ctlFeatureInfo.resultsPanel = control;
        });
    }

    /* ============================
       Marcadores
       ============================ */
    _setMarker(pickedPosition) {
        if (!this.marker) {
            const carto = cesium.Ellipsoid.WGS84.cartesianToCartographic(pickedPosition);
            const geoCoors = [
                cesium.Math.toDegrees(carto.longitude),
                cesium.Math.toDegrees(carto.latitude)
            ];

            const isOverTileset = this.map.view3D.tileSetManager.getTileSetHeight([geoCoors]);

            const billboard = {
                position: cesium.clone(pickedPosition),
                billboard: {
                    image: Util.getFeatureStyleFromCss(this.map.CLASS + '-marker')?.url,
                    verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                    heightReference: isOverTileset
                        ? cesium.HeightReference.CLAMP_TO_3D_TILE
                        : cesium.HeightReference.CLAMP_TO_TERRAIN,
                    disableDepthTestDistance: 0
                }
            };

            this.marker = this.map.view3D.addNativeFeature.call(this.map, billboard);

        } else {
            this.marker.position = pickedPosition;
            this.marker.show = true;
        }

        this.marker.billboard.heightReference = cesium.HeightReference.CLAMP_TO_GROUND;
        this.map.viewer.refresh();
    }

    _removeMarker() {
        if (this.marker) {
            this.marker.show = false;
            this.map.viewer?.refresh();
        }
    }

    _checkClickException(entity) {
        return this._clickExceptions.reduce((vi, va) => {
            return vi && va(entity)
        }, true)
    }

    /* ============================
       Métodos públicos
       ============================ */
    clear() {
        this.ctlFeatureInfo.closeResults();
        this._removeMarker();
    }

    reset() {
        this.clear();
        this.ctlFeatureInfo.setDisplayMode(this.savedMode);        
        this.map.map.getResolution = this.map2DgetResolutionFN;
    }

    send(pickedPosition) {
        return new Promise((resolve) => {
            this.pending = true;

            if (this.ctlFeatureInfo.displayMode !== Consts.infoContainer.RESULTS_PANEL) {
                this.ctlFeatureInfo.setDisplayMode(Consts.infoContainer.RESULTS_PANEL);
            }

            if (this.ctlFeatureInfo.resultsPanel) {
                this.ctlFeatureInfo.resultsPanel.close();
            }

            if (!this.map.waiting)
                this.map.waiting = this.map.map.getLoadingIndicator().addWait();

            this._setMarker(pickedPosition);

            this._getResultsPanelCtl(this.ctlFeatureInfo).then(() => {

                const pickedLocation = cesium.Ellipsoid.WGS84.cartesianToCartographic(pickedPosition);
                const lon = cesium.Math.toDegrees(pickedLocation.longitude);
                const lat = cesium.Math.toDegrees(pickedLocation.latitude);

                let reprojected;

                if (this.map.view3D.crs !== this.map.view3D.view2DCRS) {
                    reprojected = Util.reproject([lon, lat], this.map.view3D.crs, this.map.view3D.view2DCRS);
                } else {
                    reprojected = [lon, lat];
                }

                const tilesRendered = this.map.viewer.scene.globe._surface._tilesToRender;
                let pickedTile = tilesRendered.find(tile =>
                    cesium.Rectangle.contains(tile.rectangle, pickedLocation)
                );

                if (!pickedTile) return resolve();

                const imageryTiles = pickedTile.data.imagery;

                for (let i = imageryTiles.length - 1; i >= 0; --i) {
                    if (!imageryTiles[i].readyImagery) return resolve();
                }

                const nativeRectangle =
                    pickedTile.tilingScheme.tileXYToNativeRectangle(pickedTile.x, pickedTile.y, pickedTile.level);

                const readyImagery =
                    imageryTiles.find(im => im.readyImagery.imageryLayer.isBaseLayer())?.readyImagery;

                this.map.map.getResolution = () => {
                    const west_south = this.map.view3D.crs !== this.map.view3D.view2DCRS
                        ? Util.reproject([nativeRectangle.west, nativeRectangle.south], this.map.view3D.crs, this.map.view3D.view2DCRS)
                        : [nativeRectangle.west, nativeRectangle.south];

                    const east_north = this.map.view3D.crs !== this.map.view3D.view2DCRS
                        ? Util.reproject([nativeRectangle.east, nativeRectangle.north], this.map.view3D.crs, this.map.view3D.view2DCRS)
                        : [nativeRectangle.east, nativeRectangle.north];

                    const xResolution = (east_north[0] - west_south[0]) /
                        (readyImagery?.imageryLayer.imageryProvider.tileWidth || 256);

                    const yResolution = (east_north[1] - west_south[1]) /
                        (readyImagery?.imageryLayer.imageryProvider.tileHeight || 256);

                    return Math.max(xResolution, yResolution);
                };

                this.map.map.one(Consts.event.NOFEATUREINFO, (e) => {
                    this.pending = false;
                    resolve(e);
                });

                this.map.map.one(Consts.event.FEATUREINFO, (e) => {
                    this.pending = false;
                    resolve(e);
                });

                this.map.map.on(Consts.event.FEATURECLICK, (e) => {
                    this._removeMarker();
                    resolve(e);
                });

                this.ctlFeatureInfo.isActive = true;
                this.ctlFeatureInfo.beforeRequest({ xy: [0, 0] });
                this.ctlFeatureInfo.callback(reprojected);
            });
        });
    }

    get2DMarker() {
        return this.ctlFeatureInfo.filterFeature;
    }

    isPending() {
        return this.pending;
    }

    activate(control2D) {
        const mode = control2D.geometryType || Consts.geom.POINT;
        this.ctlFeatureInfo = control2D;
        this.eventHandlers = {};
        this.eventHandlers.handlerOfFeatures = new cesium.ScreenSpaceEventHandler(this.map.viewer.scene.canvas);
        switch (true) {
            case mode === Consts.geom.POINT:
                this._clickManagement = this._pointFeatureInfo;
                break;
            case mode === Consts.geom.POLYLINE:
                this._clickManagement = this._lineFeatureInfo;
                break;
            case mode === Consts.geom.POLYGON:
                this._clickManagement = this._polygonFeatureInfo;
                break;
        }        
        super.activate();
        this.isActive = true;        
    }

    deactivate() {
        super.deactivate();
        if (this.drawControl)
            this.drawControl.deactivate();
        this.ctlResultsPanel.close();
        this.isActive = false;
    }
    AddClickException(exception) {
        this._clickExceptions.push(exception);
    }
}

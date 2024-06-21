import '../../SITNA/feature/Point';
import '../../SITNA/feature/Polyline';
import '../../SITNA/feature/Polygon';

//var DrawOptions = {
//    fillColor: null,
//    strokeColor: null,
//    strokeWidth: null,
//    minPointsStop: 0
//}
//export interface DrawOptions {
//  fillColor: string | Color;
//  strokeColor?: string | Color;
//  strokeWidth?: number;
//  minPointsStop?: boolean;
//}

export default class ThreeDDraw extends EventTarget {
    #viewer_;//: Viewer;
    #strokeColor_;//: Color;
    #strokeWidth_;//: number;
    #fillColor_;//: Color;
    #radius_;//: Radio;
    #eventHandler_;//: ScreenSpaceEventHandler | undefined;
    #activePoints_ = [];//: Cartesian3[] = [];
    #activePoint_;//: Cartesian3 | undefined;
    #sketchPoint_;//: Entity | undefined;
    #tempPoint_;//: Entity | undefined;
    #activeDistance_ = 0;
    #activeDistances_ = [];//: number[] = [];    
    sketchPoints_ = [];//: Entity[] = [];
    //type: GeometryTypes;
    #type = "";
    julianDate = new cesium.JulianDate();
    drawingDataSource = new cesium.CustomDataSource('drawing');
    drawnDataSource = new cesium.CustomDataSource('drawn');
    minPointsStop = 0;
    moveEntity = false;
    vertexRemoveMode = false;
    entityForEdit;
    ERROR_TYPES = { needMorePoints: 'need_more_points' };
    editMode = false;
    onSelectEntity = null;
    draggingVertex = false;

    constructor(viewer, type, options) {
        super();
        this.#viewer_ = viewer;
        this.#type = type;
        this.#viewer_.dataSources.getByName('drawing').length > 0 ? this.drawingDataSource = this.#viewer_.dataSources.getByName('drawing')[0] : this.#viewer_.dataSources.add(this.drawingDataSource);
        this.#viewer_.dataSources.getByName('drawn').length > 0 ? this.drawnDataSource = this.#viewer_.dataSources.getByName('drawn')[0] : this.#viewer_.dataSources.add(this.drawnDataSource);
        this.#strokeColor_ = options?.strokeColor && options.strokeColor instanceof cesium.Color ?
            options.strokeColor : cesium.Color.fromCssColorString(options?.strokeColor || 'rgba(255, 0, 0, 1)');
        this.#strokeWidth_ = options?.strokeWidth !== undefined ? options.strokeWidth : 2;
        this.#fillColor_ = options?.fillColor && options.fillColor instanceof cesium.Color ?
            options.fillColor : cesium.Color.fromCssColorString(options?.fillColor || 'rgba(0, 0, 0, 0.3)');
        this.#radius_ = options?.radius !== undefined ? options.radius : 10
        this.minPointsStop = !!options?.minPointsStop;
    }


    renderSceneIfTranslucent() {
        // because calling render decreases performance, only call it when needed.
        // see https://cesium.com/docs/cesiumjs-ref-doc/Scene.html#pickTranslucentDepth
        if (this.#viewer_.scene.globe?.translucency?.enabled) {
            this.#viewer_.scene.render();
        }
    }

    activate() {
        this.active(true);
    }
    deactivate() {
        if (this.eventHandler_) {
            this.active(false);
            this.removeSketches();
        }
    }

    popCoordinate() {
        this.#activeDistances_.pop();
        return this.#activePoints_.pop();
    }
    pushCoordinate(coordinate) {
        this.#activePoints_.push(coordinate);
        //this.onLeftClick_.call(this, { position: coordinate });
    }
    end() {
        this.finishDrawing();
    }
    visibility(visible) {
        this.drawingDataSource.entities.show = visible;
        this.drawnDataSource.entities.show = visible;
        this.#viewer_.scene.requestRender();
    }
    remove(entity) {
        if (this.drawnDataSource.entities.contains(entity)) {
            this.drawnDataSource.entities.remove(entity)
            this.removeSketches();
            this.#viewer_.scene.requestRender();
        }
    }

    setLabel(entity = null, style) {
        entity = entity || this.drawnDataSource.entities.values[this.drawnDataSource.entities.values.length - 1] || this.drawingDataSource.entities.values[this.drawingDataSource.entities.values.length - 1]
        if (entity) {
            if (!entity.position) {
                entity.position = cesium.BoundingSphere.fromPoints(entity.polyline.positions.getValue()).center;
            }
            entity.label = style?{
                outlineColor: cesium.Color.fromCssColorString(style.outlineColor),
                fillColor: cesium.Color.fromCssColorString(style.fontColor),
                outlineWidth: style.outlineWidth,
                font: style.font,
                text: style.text,
                style: cesium.LabelStyle.FILL_AND_OUTLINE,
                heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
                pixelOffset: entity.polyline ? new cesium.Cartesian2(0, 0) : new cesium.Cartesian2(0, -25)
            } : null;
            if (this?.#viewer_?.cesiumWidget)
                this.#viewer_.scene.requestRender();
        }
    }
    moveLabel(entity) {
        if (entity.label?.text) {
            //entity.position = this.#activePoints_ instanceof Array ? cesium.BoundingSphere.fromPoints(this.#activePoints_).center : this.#activePoints_;
            this.#activePoints_ = this.#activePoints_ instanceof Array ? cesium.BoundingSphere.fromPoints(this.#activePoints_).center : this.#activePoints_;
        }
    }
    getEntities() {
        return [...this.#viewer_?.entities?.values || [], ...this.#viewer_.drawnDataSource?.entities?.values || []]
    }
    /*
     *
     */
    active(value) {
        if (value) {
            if (!this.eventHandler_) {
                this.eventHandler_ = new cesium.ScreenSpaceEventHandler(this.#viewer_.canvas);
                this.eventHandler_.setInputAction(this.onLeftClick_.bind(this), cesium.ScreenSpaceEventType.LEFT_CLICK);
                this.eventHandler_.setInputAction(this.onDoubleClick_.bind(this), cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
                if (this.#type === "point") this.tempPoint_ = this.createProvisionalPoint_()                
                this.eventHandler_.setInputAction(this.onMouseMove_.bind(this), cesium.ScreenSpaceEventType.MOUSE_MOVE);
            }
        } else {
            if (this.entityForEdit) {
                this.deactivateEditing();
            }
            if (this.eventHandler_) {
                this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.LEFT_CLICK);
                this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
                //this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.MOUSE_MOVE);
                this.eventHandler_.destroy();
                this.eventHandler_ = undefined;
            }
            //this.eventHandler_ = undefined;
            if (this.tempPoint_) {
                this.drawingDataSource.entities.remove(this.tempPoint_);
                this.tempPoint_ = null;
                this.#viewer_.scene.requestRender();
            }
        }
        console.log("=================" + (value?"Active":"Deactivate")+"================");
        this.dispatchEvent(new CustomEvent('statechanged', { detail: { active: value } }));
    }
    activeSelectMode(callback) {
        this.editMode = true;
        //if (this.entityForEdit) return;
        this.onSelectEntity = callback;
        //if (this.eventHandler_) {
        //    this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.LEFT_CLICK);
        //    this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        //    this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.MOUSE_MOVE);
        //    this.eventHandler_.destroy();
        //}
        if(!this.eventHandler_)
            this.eventHandler_ = new cesium.ScreenSpaceEventHandler(this.#viewer_.canvas);
        this.eventHandler_.setInputAction(this.onLeftClick_.bind(this), cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.eventHandler_.setInputAction(this.onMouseMove_.bind(this), cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
    deactivateSelectMode() {
        this.editMode = false;
        this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.LEFT_CLICK);         
        this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
    setStyle(style, entity) {
        if (!entity) {
            if (!this.entityForEdit) {
                this.#strokeColor_ = cesium.Color.fromCssColorString(style.strokeColor);
                this.#strokeWidth_ = style.strokeWidth;
                if (style.fillColor) {
                    this.#fillColor_ = cesium.Color.fromCssColorString(style.fillColor).withAlpha(style.fillOpacity);
                }
                if (style.radius) {
                    this.#radius_ = style.radius;
                }
            }
        }
        else {
            if (entity.point) {
                entity.point.color = cesium.Color.fromCssColorString(style.fillColor).withAlpha(style.fillOpacity);//cesium.Color.fromBytes.apply(this, [...style.fillColor.slice(0, 3), 255 * style.fillColor[3]]);
                entity.point.pixelSize = (style.radius - style.strokeWidth) * 2;//(style.radius * 2) - style.strokeWidth / 2;
                entity.point.outlineWidth = style.strokeWidth;
                entity.point.outlineColor = cesium.Color.fromCssColorString(style.strokeColor);
            }
            if (entity.polyline) {
                entity.polyline.width = style.strokeWidth;
                entity.polyline.material = cesium.Color.fromCssColorString(style.strokeColor);
            }
            if (entity.polygon) {
                entity.polygon.material = cesium.Color.fromCssColorString(style.fillColor).withAlpha(style.fillOpacity);                
            }
            if (this?.#viewer_?.cesiumWidget)
                this.#viewer_.scene.requestRender();
            //this.#viewer_.scene.requestRender();
        }
    }
    vertexRemove(active) {
        if (active) {
            this.vertexRemoveMode = true;
            this.sketchPoints_.filter((p, i) => i % 2).forEach((p) => {
                p.show = false;
            });
        }
        else {
            this.vertexRemoveMode = false;
            this.sketchPoints_.forEach((p) => {
                p.show = true;
            });
        }
    }    
    activateEditing() {
        if (!this.eventHandler_ || !this.entityForEdit) return;
        this.#type = (this.entityForEdit.polygon ? "polygon" : (this.entityForEdit.polyline ? "polyline" : "point"));
        this.eventHandler_.setInputAction(event => this.onLeftDown_(event), cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.eventHandler_.setInputAction(event => this.onLeftUp_(event), cesium.ScreenSpaceEventType.LEFT_UP);
        this.eventHandler_.setInputAction(this.onMouseMove_.bind(this), cesium.ScreenSpaceEventType.MOUSE_MOVE);
        const position = this.entityForEdit.position?.getValue(this.julianDate);
        let positions = [];
        let createVirtualSPs = false;
        switch (this.#type) {
            case 'point':
                this.#activePoints_ = position;
                this.entityForEdit.position = new cesium.CallbackProperty(() => this.#activePoints_, false);
                //this.entityForEdit.point.pixelSize = this.entityForEdit.point.pixelSize * 2;
                createVirtualSPs = false;
                this.HighlightSketchPoint(this.entityForEdit);
                break;
            case 'polyline':
                positions = this.#activePoints_ = this.entityForEdit.polyline.positions.getValue(this.julianDate);
                this.entityForEdit.polyline.positions = new cesium.CallbackProperty(() =>
                    this.#activePoints_, false);
                createVirtualSPs = true;
                break;
            case 'polygon':
                positions = this.#activePoints_ = this.entityForEdit.polygon?.hierarchy?.getValue(this.julianDate).positions;
                this.entityForEdit.polygon.hierarchy = new cesium.CallbackProperty(() => new cesium.PolygonHierarchy(this.#activePoints_), false);
                this.entityForEdit.polyline.positions = new cesium.CallbackProperty(() => [...this.#activePoints_, this.#activePoints_[0]], false);
                createVirtualSPs = true;
                break;
            case 'rectangle':
                positions = [...this.entityForEdit.polygon?.hierarchy?.getValue(this.julianDate).positions];
                this.entityForEdit.polygon.hierarchy = new cesium.CallbackProperty(() => new cesium.PolygonHierarchy(this.#activePoints_), false);
                this.drawingDataSource.entities.add({
                    position: new cesium.CallbackProperty(() => {
                        positions = this.#activePoints_.length ? this.#activePoints_ : positions;
                        return cesium.Cartesian3.midpoint(positions[0], positions[1], new cesium.Cartesian3());
                    }, false),
                    billboard: {
                        image: './images/rotate-icon.svg',
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        heightReference: cesium.HeightReference.CLAMP_TO_GROUND
                    },
                    properties: {
                        type: 'rotate'
                    }
                });
                break;
            default:
                break;
        }        
        this.createSketchPoints_(positions, createVirtualSPs);
        console.log("=================activateEditing================");

    }
    createSketchPoints_(positions, createVirtualSPs) {
        positions.forEach((p, idx) => {
            const sketchPoint = this.createSketchPoint_(p, { edit: true, positionIndex: idx });
            sketchPoint.properties.index = idx;
            this.sketchPoints_.push(sketchPoint);
            if (createVirtualSPs && (idx + 1) < positions.length) {
                const p2 = this.halfwayPosition_(p, positions[idx + 1]);
                const virtualSketchPoint = this.createSketchPoint_(p2, { edit: true, virtual: true });
                virtualSketchPoint.properties.index = idx;
                this.sketchPoints_.push(virtualSketchPoint);
            }
        });
        if (this.#type === 'polygon' && positions.length > 2) {
            // We need one more virtual sketchpoint for polygons
            const lastIdx = positions.length - 1;
            const p2 = this.halfwayPosition_(positions[lastIdx], positions[0]);
            const virtualSketchPoint = this.createSketchPoint_(p2, { edit: true, virtual: true });
            virtualSketchPoint.properties.index = lastIdx;
            this.sketchPoints_.push(virtualSketchPoint);
        }
        this.#viewer_.scene.requestRender();
    }

    HighlightSketchPoint(sketchPoint) {
        let outerPoint = {
            position: new cesium.CallbackProperty(() => this.#activePoints_, false),//sketchPoint.position.getValue(this.julianDate),            
            point: {
                //pixelSize: sketchPoint.point.pixelSize + sketchPoint.point.outlineWidth.getValue(this.julianDate)+1,
                pixelSize: new cesium.CallbackProperty(() => {
                    return sketchPoint.point.pixelSize.getValue(this.julianDate) + (sketchPoint.point.outlineWidth.getValue(this.julianDate)*2);
                }, false),
                outlineWidth: 2,
                outlineColor: cesium.Color.BLACK,
                color: cesium.Color.TRANSPARENT
            }
        }
        let innerPoint = {
            position: new cesium.CallbackProperty(() => this.#activePoints_, false),//sketchPoint.position.getValue(this.julianDate),
            point: {
                //pixelSize: sketchPoint.point.pixelSize - sketchPoint.point.outlineWidth.getValue(this.julianDate)-1,
                pixelSize: new cesium.CallbackProperty(() => {
                    return sketchPoint.point.pixelSize.getValue(this.julianDate) -  4;
                }, false),
                outlineWidth: 2,
                outlineColor: cesium.Color.WHITE,
                color: cesium.Color.TRANSPARENT
            }
        }

        sketchPoint.innerPoint = this.drawnDataSource.entities.add(innerPoint);
        sketchPoint.outerPoint = this.drawnDataSource.entities.add(outerPoint);        
    }

    UnhighlightSketchPoint(sketchPoint) {
        this.drawnDataSource.entities.remove(sketchPoint.innerPoint);
        this.drawnDataSource.entities.remove(sketchPoint.outerPoint);

        delete sketchPoint.innerPoint;
        delete sketchPoint.outerPoint;
    }

    deactivateEditing() {
        if (!this.eventHandler_ || !this.entityForEdit) return;
        if (this.#activePoints_ instanceof Array ? this.#activePoints_.length : this.#activePoints_  ) {
            switch (this.#type) {
                case 'polyline':
                    this.entityForEdit.polyline.positions = [...this.#activePoints_]
                    break;
                case 'point':
                    this.entityForEdit.position = this.entityForEdit.position.getValue(this.julianDate);
                    this.UnhighlightSketchPoint(this.entityForEdit);
                    break;
                case 'polygon':
                    this.entityForEdit.polyline.positions = [...this.#activePoints_, this.#activePoints_[0]];
                    this.entityForEdit.polygon.hierarchy = new cesium.PolygonHierarchy([...this.#activePoints_]);
                    break;
            }
            if (this?.#viewer_?.cesiumWidget)
                this.#viewer_.scene.requestRender();
        }
                
        this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.LEFT_UP);
        //this.eventHandler_.removeInputAction(cesium.ScreenSpaceEventType.MOUSE_MOVE);
        const entityCollection = this.drawingDataSource.entities;
        this.sketchPoints_.forEach(function (sp) {
            entityCollection.remove(sp);
        });
        this.sketchPoints_ = [];
        this.#activePoints_ = [];
        console.log("=================DeactivateEditing================");
    }

    finishDrawing() {
        let positions = this.#activePoints_;
        let entity;
        if ((this.#type === 'polygon' || this.#type === 'rectangle') && positions.length < 3) {
            this.dispatchEvent(new CustomEvent('drawerror', {
                detail: {
                    error: this.ERROR_TYPES.needMorePoints
                }
            }));
            return;
        }
        if (this.#type === 'point') {
            entity = this.drawShape_(this.#activePoints_);
        }
        else {
            if (this.#type === 'polygon') {
                const distance = new cesium.EllipsoidGeodesic(cesium.Cartographic.fromCartesian(this.#activePoints_[this.#activePoints_.length - 1]), cesium.Cartographic.fromCartesian(this.#activePoints_[0]), cesium.Ellipsoid.WGS84).surfaceDistance;
                //const distance = cesium.Cartesian3.distance(this.#activePoints_[this.#activePoints_.length - 1], this.#activePoints_[0]);
                this.#activeDistances_.push(distance / 1000);
            }
            entity = this.drawShape_(this.#activePoints_);
        }
        this.#viewer_.scene.requestRender();

        const measurements = this.getMeasurements(positions, this.#type);
        this.dispatchEvent(new CustomEvent('drawend', {
            detail: {
                positions: positions,
                type: this.#type,
                measurements: measurements,
                entity: entity
            }
        }));

        this.removeSketches();
    }
    IsSketchEntity(entity) {
        return (this.sketchPoint_ && this.sketchPoint_ === entity.id);
    }
    CanIUseEntity(entity) {
        return (!this.drawMode && this.editMode &&
            ((!this.entityForEdit && this.drawnDataSource.entities.contains(entity.id)) ||
                (this.entityForEdit && this.drawnDataSource.entities.contains(entity.id) && this.entityForEdit != entity.id) ||
                (this.entityForEdit && this.sketchPoints_.some((p)=>p===entity.id))));
    }
    removeSketches(full) {
        this.drawingDataSource.entities.removeAll();
        if (this.tempPoint_) this.drawingDataSource.entities.add(this.tempPoint_);
        if (full)
            this.drawnDataSource.entities.removeAll();

        this.#activePoints_ = [];
        this.activePoint_ = undefined;
        this.sketchPoint_ = undefined;
        this.activeDistance_ = 0;
        this.#activeDistances_ = [];
        this.entityForEdit = undefined;
        this.moveEntity = false;
        this.sketchPoints_ = [];
    }

    /*
     *
     */
    clear() {
        this.removeSketches();
    }

    createSketchPoint_(position, options) {
        const entity = {
            position: position,
            point: {
                color: options?.virtual ? cesium.Color.GREY : cesium.Color.WHITE,
                outlineWidth: 1,
                outlineColor: cesium.Color.BLACK,
                pixelSize: options?.edit ? 9 : 5,
                heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
            },
            properties: {}
        };
        if (options?.edit) {
            entity.point.disableDepthTestDistance = Number.POSITIVE_INFINITY;
        }
        else {
            //entity.label = getDimensionLabel(this.type, this.activeDistances_);
        }
        const pointEntity = this.drawingDataSource.entities.add(entity);
        if (options?.virtual)
            pointEntity.properties.virtual = options.virtual;
        return pointEntity;
    }
    createProvisionalPoint_() {
        return this.drawingDataSource.entities.add({
            position: new cesium.Cartesian3(),
            point: {
                color: new cesium.CallbackProperty(() => { return this.#fillColor_ }, false),
                outlineWidth: new cesium.CallbackProperty(() => { return this.#strokeWidth_ }, false),
                outlineColor: new cesium.CallbackProperty(() => { return this.#strokeColor_ }, false),
                pixelSize: new cesium.CallbackProperty(() => { return (this.#radius_ - this.#strokeWidth_) * 2  }, false)
            }
        })

    }

    createSketchLine_(positions) {
        return this.drawingDataSource.entities.add({
            polyline: {
                positions: positions,
                clampToGround: true,
                width: new cesium.CallbackProperty(() => this.#strokeWidth_, false),
                material: new cesium.ColorMaterialProperty(new cesium.CallbackProperty(() => this.#strokeColor_, false))
            }
        })
    }

    drawShape_(positions) {
        if (this.#type === 'point') {
            return this.drawnDataSource.entities.add({
                position: positions[0],
                point: {
                    color: this.#fillColor_,
                    pixelSize: (this.#radius_ - this.#strokeWidth_ ) *2 ,
                    outlineWidth: this.#strokeWidth_,
                    outlineColor: this.#strokeColor_,
                }
            });

        } else if (this.#type === 'polyline') {
            return this.drawnDataSource.entities.add({
                polyline: {
                    positions: positions,
                    clampToGround: true,
                    width: this.#strokeWidth_,
                    material: this.#strokeColor_
                },
                //label: getDimensionLabel(this.type, this.activeDistances_)
            });
        } else if (this.#type === 'polygon' || this.#type === 'rectangle') {
            return this.drawnDataSource.entities.add({
                polygon: {
                    hierarchy: {
                        positions: positions
                    },
                    material: new cesium.ColorMaterialProperty(this.#fillColor_),
                    clampToGround: true,
                },
                polyline: {
                    positions: [...positions, positions[0]],
                    clampToGround: true,
                    width: this.#strokeWidth_,
                    material: this.#strokeColor_
                }
                //label: getDimensionLabel(this.type, this.activeDistances_)
            });
        }
    }

    dynamicSketLinePositions() {
        return new cesium.CallbackProperty(() => {
            const activePoints = [...this.#activePoints_, this.activePoint_];
            //const positions = this.type === 'rectangle' ? rectanglify(activePoints) : activePoints;
            const positions = activePoints;
            if (this.#type === 'rectangle' && activePoints.length === 4) { // to avoid showing of confusing lines
                return [];
            }
            if (positions.length >= 3 && this.#type !== 'polyline') {
                // close the polygon
                // FIXME: better memory management
                return [...positions, positions[0]];
            } else {
                return positions;
            }
        }, false);
    }

    updateSketchPoint() {
        if (!this.sketchPoint_) return;
        const activePoints = [...this.#activePoints_, this.activePoint_];
        //const positions = this.type === 'rectangle' ? rectanglify(activePoints) : activePoints;
        const positions = activePoints;
        const pointsLength = positions.length;
        if (pointsLength > 1) {
            let distance;
            if (this.#type === 'rectangle' && pointsLength > 2) {
                const b = positions[1]; //according to rectanglify
                const bp = positions[2];
                distance = cesium.Cartesian3.distance(b, bp);
                (this.sketchPoint_.position).setValue(bp);
            } else {
                const lastPoint = positions[pointsLength - 1];
                distance = new cesium.EllipsoidGeodesic(cesium.Cartographic.fromCartesian(positions[pointsLength - 2]), cesium.Cartographic.fromCartesian(lastPoint), cesium.Ellipsoid.WGS84).surfaceDistance;
                //distance = cesium.Cartesian3.distance(positions[pointsLength - 2], lastPoint); 
            }
            this.#activeDistance_ = distance / 1000;
            this.dispatchEvent(new CustomEvent('drawupdate', {
                detail: {
                    positions: positions,
                    type: this.#type,
                    measurements: this.getMeasurements(positions, this.#type)
                }
            }));
            return;
        }

    }

    onLeftClick_(event) {
        if (this.editMode) {
            this.onEntityClick_(event)
        }
        else if (this.vertexRemoveMode) {
            const pickedVertex = this.#viewer_.scene.pick(event.position);
        }
        else {
            const position = this.#viewer_.scene.globe.pick(this.#viewer_.camera.getPickRay(event.position), this.#viewer_.scene)
            if (position) {

                if (!this.sketchPoint_) {
                    this.dispatchEvent(new CustomEvent('drawstart'));
                    this.sketchPoint_ = this.createSketchPoint_(position);
                    this.activePoint_ = position;

                    this.createSketchLine_(this.dynamicSketLinePositions());
                    this.#viewer_.scene.requestRender();
                    if (this.#type === 'point') {
                        this.#activePoints_.push(position);
                        this.finishDrawing();
                        return;
                    }
                } else {
                    this.sketchPoint_.position.setValue(position);
                    if (!this.#activeDistances_.includes(this.#activeDistance_)) {
                        this.#activeDistances_.push(this.#activeDistance_);
                    }
                }
                this.#activePoints_.push(this.activePoint_);
                const forceFinish = this.minPointsStop && (
                    (this.#type === 'polygon' && this.#activePoints_.length === 3) ||
                    (this.#type === 'polyline' && this.#activePoints_.length === 2)
                );
                if ((this.#type === 'rectangle' && this.#activePoints_.length === 3) || forceFinish) {
                    this.finishDrawing();
                }
                this.dispatchEvent(new CustomEvent('point', { detail: { position } }));
            }
        }               
        //this.renderSceneIfTranslucent();
        
    }

    onEntityClick_(event) {
        console.log("entity click");
        if (!this.onSelectEntity) return
        const pickedFeature = this.#viewer_.scene.pick(event.position);
        if (cesium.defined(pickedFeature) && cesium.defined(pickedFeature.id) && this.drawnDataSource.entities.contains(pickedFeature.id)) {
            if (this.entityForEdit) {
                this.deactivateEditing()
            }
            this.entityForEdit = pickedFeature.id;
            this.activateEditing();
            //this.activate();
            this.onSelectEntity(pickedFeature.id);
        }
        else if (cesium.defined(pickedFeature) && cesium.defined(pickedFeature.id)  && this.sketchPoints_?.indexOf(pickedFeature.id)>=0) {
            return;
        }
        else {
            this.deactivateEditing();
            this.onSelectEntity(null);
        }
            
    }

    updateRectCorner(corner, oppositePoint, midPoint, midPointPrev, midScale, negate) {
        let midDiff = cesium.Cartesian3.subtract(corner, midPointPrev, new cesium.Cartesian3());
        midDiff = cesium.Cartesian3.multiplyByScalar(midDiff, midScale, new cesium.Cartesian3());
        const positionFromMid = cesium.Cartesian3.add(midPoint, midDiff, new cesium.Cartesian3());

        const distancePrev = cesium.Cartesian3.distance(corner, oppositePoint);
        const distanceCurrent = cesium.Cartesian3.distance(positionFromMid, oppositePoint);
        const distanceScale = distanceCurrent / distancePrev;
        let distanceDiff = cesium.Cartesian3.subtract(corner, oppositePoint, new cesium.Cartesian3());

        distanceDiff = cesium.Cartesian3.multiplyByScalar(distanceDiff, distanceScale, new cesium.Cartesian3());
        let newCornerPosition = cesium.Cartesian3.add(oppositePoint, distanceDiff, new cesium.Cartesian3());
        if (negate) {
            distanceDiff = cesium.Cartesian3.negate(distanceDiff, new cesium.Cartesian3());
            newCornerPosition = cesium.Cartesian3.add(oppositePoint, distanceDiff, new cesium.Cartesian3());
        }
        return newCornerPosition;
    }

    rotateRectangle(startPosition, endPosition) {
        const positions = [...this.#activePoints_];
        const center = cesium.Cartesian3.midpoint(positions[0], positions[2], new cesium.Cartesian3());
        const centerCart = Cartographic.fromCartesian(center);
        const endCart = Cartographic.fromCartesian(endPosition);
        const startCart = Cartographic.fromCartesian(startPosition);
        const angleStart = Math.PI + Math.atan2(endCart.longitude - centerCart.longitude, endCart.latitude - centerCart.latitude);
        const angleEnd = Math.PI + Math.atan2(startCart.longitude - centerCart.longitude, startCart.latitude - centerCart.latitude);
        const angleDiff = angleEnd - angleStart;

        positions.forEach((pos, indx) => {
            const point = Cartographic.fromCartesian(pos);
            const cosTheta = Math.cos(angleDiff);
            const sinTheta = Math.sin(angleDiff);
            const vLon = (cosTheta * (point.longitude - centerCart.longitude) - sinTheta * (point.latitude - centerCart.latitude) / Math.abs(Math.cos(centerCart.latitude)));
            const vLat = (sinTheta * (point.longitude - centerCart.longitude) * Math.abs(Math.cos(centerCart.latitude)) + cosTheta * (point.latitude - centerCart.latitude));
            const lon = centerCart.longitude + vLon;
            const lat = centerCart.latitude + vLat;

            positions[indx] = Cartographic.toCartesian(new Cartographic(lon, lat));
        });
        this.sketchPoints_.forEach((sp, key) => {
            sp.position = positions[key];
            this.#activePoints_[key] = positions[key];
        });
        this.#viewer_.scene.requestRender();
    }

    onMouseMove_(event) {
        if (this.entityForEdit) {
            this.onDragPoint_(event);
        }
        else {
            this.renderSceneIfTranslucent();
            const position = this.#viewer_.scene.globe.pick(this.#viewer_.camera.getPickRay(event.endPosition), this.#viewer_.scene);
            if (!position)
                return;
            if (this.sketchPoint_) {
                this.sketchPoint_.position.setValue(position);
                this.activePoint_ = position;
                this.updateSketchPoint();
            }
            if (this.tempPoint_) {
                this.tempPoint_.position.setValue(position);
            }
            //
            this.#viewer_.scene.requestRender();
        }
        
    }
    onDragPoint_(event) {
        this.renderSceneIfTranslucent();
        const position = this.#viewer_.scene.globe.pick(this.#viewer_.camera.getPickRay(event.endPosition), this.#viewer_.scene);
        if (!position)
            return;
        if (this.entityForEdit) {
            if (this.moveEntity) {
                if (this.#type === 'point') {
                    //this.entityForEdit.position = position;
                    this.#activePoints_ = position;
                } else {
                    const pointProperties = this.sketchPoint_?.properties;
                    const index = pointProperties.index;
                    let prevPosition = new cesium.Cartesian3();
                    if (typeof index === 'number') {
                        this.sketchPoint_.position = position;
                        prevPosition = this.#activePoints_[index];
                        this.#activePoints_[index] = position;
                    }
                    if (this.#type === 'polygon') {
                        // move virtual SPs
                        const idx = this.sketchPoint_?.properties?.index;
                        const spLen = this.sketchPoints_.length;
                        const prevRealSPIndex = ((spLen + idx - 1) * 2) % spLen;
                        const prevRealSP = this.sketchPoints_[prevRealSPIndex];
                        const prevVirtualPosition = this.halfwayPosition_(prevRealSP, this.sketchPoint_);
                        this.sketchPoints_[prevRealSPIndex + 1].position = prevVirtualPosition;

                        const nextRealSPIndex = ((spLen + idx + 1) * 2) % spLen;
                        const nextRealSP = this.sketchPoints_[nextRealSPIndex];
                        const nextVirtualPosition = this.halfwayPosition_(nextRealSP, this.sketchPoint_);
                        this.sketchPoints_[idx * 2 + 1].position = nextVirtualPosition;
                    }
                    if (this.#type === 'polyline') {
                        // move virtual SPs
                        const idx = this.sketchPoint_?.properties?.index;
                        if (idx > 0) {
                            const prevRealSP = this.sketchPoints_[(idx - 1) * 2];
                            const prevVirtualPosition = this.halfwayPosition_(prevRealSP, this.sketchPoint_);
                            this.sketchPoints_[(idx - 1) * 2 + 1].position = prevVirtualPosition;
                        }
                        if (idx < (this.#activePoints_.length - 1)) {
                            const nextRealSP = this.sketchPoints_[(idx + 1) * 2];
                            const nextVirtualPosition = this.halfwayPosition_(nextRealSP, this.sketchPoint_);
                            this.sketchPoints_[(idx + 1) * 2 - 1].position = nextVirtualPosition;
                        }
                    } else {
                        const positions = this.#activePoints_;
                        if (this.#type === 'rectangle') {
                            if (pointProperties.type && pointProperties.type.getValue() === 'rotate') {
                                const oldPosition = this.sketchPoint_?.position?.getValue(this.julianDate);
                                this.rotateRectangle(oldPosition, position);
                                return;
                            }
                            const oppositeIndex = index > 1 ? index - 2 : index + 2;
                            const leftIndex = index - 1 < 0 ? 3 : index - 1;
                            const rightIndex = index + 1 > 3 ? 0 : index + 1;
                            let draggedPoint = positions[index];
                            const oppositePoint = positions[oppositeIndex];
                            let leftPoint = positions[leftIndex];
                            let rightPoint = positions[rightIndex];

                            const midPoint = cesium.Cartesian3.midpoint(draggedPoint, oppositePoint, new cesium.Cartesian3());
                            const midPointPrev = cesium.Cartesian3.midpoint(prevPosition, oppositePoint, new cesium.Cartesian3());
                            const midDist = cesium.Cartesian3.distance(draggedPoint, midPoint);
                            const midDistPrev = cesium.Cartesian3.distance(prevPosition, midPointPrev);
                            const midScale = midDist / midDistPrev;

                            const negate = this.checkForNegateMove(draggedPoint, oppositePoint, leftPoint, rightPoint);
                            leftPoint = this.updateRectCorner(leftPoint, oppositePoint, midPoint, midPointPrev, midScale, negate.left);
                            rightPoint = this.updateRectCorner(rightPoint, oppositePoint, midPoint, midPointPrev, midScale, negate.right);

                            draggedPoint = this.getCorrectRectCorner(draggedPoint, oppositePoint, leftPoint, rightPoint);
                            draggedPoint = this.getCorrectRectCorner(draggedPoint, oppositePoint, rightPoint, leftPoint);

                            positions[index] = draggedPoint;
                            this.#activePoints_[index] = draggedPoint;
                            positions[leftIndex] = leftPoint;
                            positions[rightIndex] = rightPoint;
                            this.sketchPoints_.forEach((sp, key) => {
                                sp.position = positions[key];
                            });
                        }
                    }
                }
            }
        }
    }

    onDoubleClick_() {
        if (!this.#activeDistances_.includes(this.#activeDistance_)) {
            this.#activeDistances_.push(this.#activeDistance_);
        }
        this.#activePoints_.pop();
        this.finishDrawing();
    }

    /*
     * Enables moving of point geometry or one of the sketch points for other geometries if left mouse button pressed on it
     * @param event
     * @private
     */


    onLeftDown_(event) {
        //this.leftPressedPixel_ = event.position;
        if (this.entityForEdit) {
            const objects = this.#viewer_.scene.drillPick(event.position, 5, 5, 5);
            if (objects.length) {
                if (this.vertexRemoveMode && this.sketchPoints_.includes(objects[0].id)) {
                    if ((this.#type === 'polygon' && this.#activePoints_.length <= 3) || (this.#type === 'polyline' && this.#activePoints_.length <= 2)) {
                        this.dispatchEvent(new CustomEvent('drawerror', {
                            detail: {
                                error: this.ERROR_TYPES.needMorePoints
                            }
                        }));
                        return;
                    }
                    const indexFromEntity = this.sketchPoints_.filter((p, i) => !(i % 2)).indexOf(objects[0].id);
                    const indexFromSketch = this.sketchPoints_.indexOf(objects[0].id);

                    const VPToMove = this.#type === "polygon"?this.sketchPoints_[indexFromSketch - 1] || this.sketchPoints_[this.sketchPoints_.length - 1] : null;
                    const VPToRemove = this.sketchPoints_[indexFromSketch + 1] || this.sketchPoints_[indexFromSketch - 1];
                    if (VPToMove && VPToMove !== VPToRemove) {
                        VPToMove.position = this.halfwayPosition_(this.#activePoints_[(indexFromEntity === 0 ? this.#activePoints_.length : indexFromEntity) - 1]
                            , this.#activePoints_[indexFromEntity === this.#activePoints_.length - 1 ? 0 : indexFromEntity + 1]);
                    }
                    this.sketchPoints_.splice(this.sketchPoints_.indexOf(VPToRemove), 1);
                    this.sketchPoints_.splice(indexFromSketch, 1);
                    this.drawingDataSource.entities.remove(VPToRemove);
                    this.drawingDataSource.entities.remove(objects[0].id);
                    this.removeVertexToPolylineOrPolygon_(indexFromEntity);
                    //if (this.#type === "polyline")
                    //this.entityForEdit.polyline.positions = this.#activePoints_;
                    //else {
                    //    this.entityForEdit.polyline.positions = [...this.#activePoints_, this.#activePoints_[0]];
                    //    this.entityForEdit.polygon.hierarchy = new cesium.PolygonHierarchy(this.#activePoints_);
                    //}
                    this.sketchPoints_.filter((p) => !p.properties.virtual).forEach((p, index) => {
                        p.properties.index = index;
                    });
                    this.sketchPoints_.filter((p) => p.properties.virtual).forEach((p, index) => {
                        p.properties.index = index;
                    });

                    this.dispatchEvent(new CustomEvent('drawmodify', {
                        detail: {
                            positions: this.#activePoints_,
                            type: this.#type,
                            entity: this.entityForEdit
                        }
                    }));
                    this.moveLabel(this.entityForEdit);

                }
                else {
                    const selectedPoint = objects.find(obj => !!obj.id.point || !!obj.id.billboard);
                    if (!selectedPoint) return;
                    const selectedEntity = selectedPoint.id;
                    this.sketchPoint_ = selectedEntity;
                    const properties = selectedEntity.properties;
                    // checks if picked entity is point geometry or one of the sketch points for other geometries
                    this.moveEntity = selectedEntity.id === this.entityForEdit.id ||
                        this.sketchPoints_.some(sp => sp.id === selectedEntity.id) ||
                        (properties && properties.type && properties.type.getValue() === 'rotate');
                    if (this.moveEntity && this.sketchPoint_?.properties?.virtual) {
                        if (!this.draggingVertex) {
                            this.extendOrSplitLineOrPolygonPositions_();
                            this.draggingVertex = true;
                        }
                            
                    }
                }
            }
            if (this.moveEntity) {
                this.#viewer_.scene.screenSpaceCameraController.enableInputs = false;
                this.dispatchEvent(new CustomEvent('leftdown'));
            }
        }
    }

    /*
     *
     * @param {*} a
     * @param {*} b
     * @return {Cartesian3}
     */
    halfwayPosition_(a, b) {
        a = a.position || a;
        b = b.position || b;
        a = a.getValue ? a.getValue(this.julianDate) : a;
        b = b.getValue ? b.getValue(this.julianDate) : b;
        const position = cesium.Cartesian3.add(a, b, new cesium.Cartesian3());
        cesium.Cartesian3.divideByScalar(position, 2, position);
        return position;
    }

    extendOrSplitLineOrPolygonPositions_() {
        // Add new line vertex
        // Create SPs, reuse the pressed virtual SP for first segment
        const pressedVirtualSP = this.sketchPoint_;
        const pressedPosition = cesium.Cartesian3.clone(pressedVirtualSP.position?.getValue(this.julianDate));
        const pressedIdx = pressedVirtualSP.properties?.index;
        const realSP0 = this.sketchPoints_[pressedIdx * 2];
        const realSP2 = this.sketchPoints_[((pressedIdx + 1) * 2) % (this.sketchPoints_.length)];
        const virtualPosition0 = this.halfwayPosition_(realSP0, pressedPosition);
        const virtualPosition1 = this.halfwayPosition_(pressedPosition, realSP2);
        const realSP1 = this.createSketchPoint_(pressedPosition, { edit: true });
        const virtualSP1 = this.createSketchPoint_(virtualPosition1, { edit: true, virtual: true });
        const virtualSP0 = pressedVirtualSP; // the pressed SP is reused
        virtualSP0.position = virtualPosition0; // but its position is changed

        this.insertVertexToPolylineOrPolygon_(pressedIdx + 1, pressedPosition.clone());
        this.sketchPoints_.splice((pressedIdx + 1) * 2, 0, realSP1, virtualSP1);
        this.sketchPoints_.forEach((sp, idx) => sp.properties.index = Math.floor(idx / 2));
        this.sketchPoint_ = realSP1;
        this.#viewer_.scene.requestRender();
    }

    insertVertexToPolylineOrPolygon_(idx, coordinates) {
        this.#activePoints_.splice(idx, 0, coordinates);
    }
    removeVertexToPolylineOrPolygon_(idx) {
        this.#activePoints_.splice(idx, 1);
    }

    /*
     * @param event
     */
    onLeftUp_(_event) {
        this.#viewer_.scene.screenSpaceCameraController.enableInputs = true;
        
        if (this.moveEntity) {
            this.dispatchEvent(new CustomEvent('drawmodify', {
                detail: {
                    positions: this.#activePoints_,
                    type: this.#type,
                    entity: this.entityForEdit
                }
            }));
            this.moveLabel(this.entityForEdit);
        }
        this.draggingVertex = false;
        this.moveEntity = false;
        
        this.sketchPoint_ = undefined;
    }    

    getCorrectRectCorner(corner, oppositePoint, checkPoint1, checkPoint2) {
        const distance = Cartesian3.distance(checkPoint1, oppositePoint);
        const newDistance = Cartesian3.distance(corner, checkPoint2);
        const dScale = distance / newDistance;
        let dDiff = Cartesian3.subtract(corner, checkPoint2, new Cartesian3());
        dDiff = Cartesian3.multiplyByScalar(dDiff, dScale, new Cartesian3());
        return Cartesian3.add(checkPoint2, dDiff, new Cartesian3());
    }

    checkForNegateMove(draggedPoint, oppositePoint, leftPoint, rightPoint) {
        const draggedPoint2D = this.#viewer_.scene.cartesianToCanvasCoordinates(draggedPoint);
        const rightPoint2D = this.#viewer_.scene.cartesianToCanvasCoordinates(rightPoint);
        const leftPoint2D = this.#viewer_.scene.cartesianToCanvasCoordinates(leftPoint);
        const oppositePoint2D = this.#viewer_.scene.cartesianToCanvasCoordinates(oppositePoint);
        if (!draggedPoint2D || !rightPoint2D || !leftPoint2D || !oppositePoint2D) {
            return {
                right: false,
                left: false
            };
        }
        return {
            right: !!Intersections2D.computeLineSegmentLineSegmentIntersection(
                draggedPoint2D.x,
                draggedPoint2D.y,
                rightPoint2D.x,
                rightPoint2D.y,
                leftPoint2D.x,
                leftPoint2D.y,
                oppositePoint2D.x,
                oppositePoint2D.y
            ),
            left: !!Intersections2D.computeLineSegmentLineSegmentIntersection(
                draggedPoint2D.x,
                draggedPoint2D.y,
                leftPoint2D.x,
                leftPoint2D.y,
                rightPoint2D.x,
                rightPoint2D.y,
                oppositePoint2D.x,
                oppositePoint2D.y
            )
        };
    }
    getMeasurements(positions, type) {
        const value = {
            units: 'm'
        };
        const distances = [];
        positions.forEach((p, key) => {
            if (key > 0) {
                distances.push(new cesium.EllipsoidGeodesic(cesium.Cartographic.fromCartesian(positions[key - 1]), cesium.Cartographic.fromCartesian(p), cesium.Ellipsoid.WGS84).surfaceDistance);
            }
        });

        if (type === 'polyline') {
            value["length"] = distances.reduce((a, b) => a + b, 0);
        }
        else if (type === 'polygon') {
            value["perimeter"] = distances.reduce((a, b) => a + b, 0);

            value["area"] = positions.length > 2 ? Math.sqrt(Math.pow(cesium.PolygonPipeline.computeArea2D(positions), 2)) : 0;
        }
        else if (type === "point") {
            return {};
        }

        return value;
    }
}



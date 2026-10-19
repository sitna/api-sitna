import { Select, Modify } from 'ol/interaction.js';
import { click, never } from 'ol/events/condition.js';
import ControlEvent from '../../SITNA/control/ControlEvent.js';
import ControlWrapper from '../wrap/Control.js';
import { hitTolerance, setSnapping } from './ol.js';
import Consts from '../Consts.js';

const MOUSEMOVE = 'mousemove';


export default class ModifyWrapper extends ControlWrapper {
    activate() {
        const self = this;
        if (self.parent.map) {
            Promise.all([self.parent.map.wrap.getMap(), self.parent.layer.wrap.getLayer()]).then(function ([olMap, olLayer]) {
                const deleteMode = self.parent.mode === self.parent.constructor.mode.VERTEX_DELETE;
                const selectOptions = {
                    layers: [olLayer],
                    hitTolerance,
                    style: null
                };
                if (self.selectInteraction) {
                    selectOptions.features = self.selectInteraction.getFeatures();
                    if (deleteMode) {
                        selectOptions.condition = never;
                    }
                    olMap.removeInteraction(self.selectInteraction);
                }
                var select = null;
                //if (self.parent.map.on3DView) {
                //    select = self.selectInteraction || new Select3D(self.parent.layer, self.parent.map.view3D);
                //    select.activate(deleteMode);
                //    self.selectInteraction = select;
                //}
                //else {
                select = new Select(selectOptions);
                self.selectInteraction = select;
                olMap.addInteraction(select);
                //}
                var getWrapperFeature = function (elm) {
                    return elm._wrap.parent;
                };
                select.on('select', function (event) {
                    if (event.deselected.length > 0) {
                        const controlEvent = new ControlEvent(Consts.event.FEATURESUNSELECT, { control: self.parent });
                        controlEvent.features = event.deselected.map(getWrapperFeature);
                        self.parent.dispatchEvent(controlEvent);
                    }
                    if (event.selected.length > 0) {
                        const controlEvent = new ControlEvent(Consts.event.FEATURESSELECT, { control: self.parent });
                        controlEvent.features = event.selected.map(getWrapperFeature);
                        self.parent.dispatchEvent(controlEvent);
                    }
                });
                if (self.modifyInteraction) {
                    olMap.removeInteraction(self.modifyInteraction);
                }
                const modifyOptions = {
                    features: select.getFeatures()
                };
                if (deleteMode) {
                    modifyOptions.deleteCondition = click;
                }
                var modify = new Modify(modifyOptions);
                if (deleteMode) {
                    let featureRevision;
                    modify.on('modifystart', function (e) {
                        if (e.mapBrowserEvent.type === 'click') {
                            // Es un intento de borrado. Miramos si va a ser infructuoso por falta de vértices
                            featureRevision = e.features.item(0).getRevision();
                        }
                    });
                    modify.on('modifyend', function (e) {
                        if (e.mapBrowserEvent.type === 'click') {
                            // Es un intento de borrado. Miramos si va a ser infructuoso por falta de vértices
                            if (e.features.item(0).getRevision() === featureRevision) {
                                self.parent.map.toast(self.parent.getLocaleString("verticesCannotBeDeleted"),
                                    { type: Consts.msgType.ERROR });
                            }
                        }
                    });
                }
                self._modifiedGeometries = self._modifiedGeometries || new WeakMap();
                modify.on('modifystart', function (e) {
                    e.features.forEach(function (feature) {
                        self._modifiedGeometries.set(feature, feature.getGeometry().getFlatCoordinates().slice());
                    });
                });
                modify.on('modifyend', function (e) {
                    e.features.forEach(function (feature) {
                        const newGeom = feature.getGeometry();
                        if (newGeom.stride > 2) {
                            const oldCoords = self._modifiedGeometries.get(feature);
                            if (oldCoords) {
                                const newCoords = newGeom.getFlatCoordinates();
                                if (oldCoords.length <= newCoords.length) {
                                    // Hemos movido o añadido un punto
                                    for (var i = 0; i < newCoords.length; i += newGeom.stride) {
                                        const iplus1 = i + 1;
                                        if (newCoords[i] !== oldCoords[i] || newCoords[iplus1] !== oldCoords[iplus1]) {
                                            newCoords[iplus1 + 1] = null;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        self.parent.setFeatureCoordinates(feature._wrap.parent, feature._wrap.getGeometry(), feature._wrap.parent.geometry);
                        self.parent.trigger(Consts.event.FEATUREMODIFY, {
                            feature: feature._wrap.parent,
                            layer: self.parent.layer,
                            geometryChanged: true
                        });
                    });
                });
                self.modifyInteraction = modify;
                olMap.addInteraction(modify);

                if (self.snapInteraction) {
                    olMap.removeInteraction(self.snapInteraction);
                }
                let snappingValue = self.parent.getSnapping();
                if (snappingValue) {
                    snappingValue = typeof snappingValue === 'boolean' ? self.parent.layer : snappingValue;
                    setSnapping(self, snappingValue);
                }

                if (!self._onMouseMove) {
                    self._onMouseMove = function (e) {
                        const viewport = olMap.getViewport();
                        var hit = false;

                        var pixel = olMap.getEventPixel(e);
                        hit = olMap.forEachFeatureAtPixel(pixel, function (_feature, layer) {
                            if (self.parent.layer && layer === self.parent.layer.wrap.layer) {
                                return true;
                            }
                            return false;
                        }, { hitTolerance });

                        if (hit) {
                            viewport.style.cursor = 'pointer';
                        } else {
                            viewport.style.removeProperty('cursor');
                            //self.parent.trigger(Consts.event.FEATUREOUT);
                        }
                    };
                }

                olMap.getViewport().addEventListener(MOUSEMOVE, self._onMouseMove);
            });
        }
    }

    deactivate() {
        if (this.modifyInteraction) {
            this.modifyInteraction.setActive(false);
            this.selectInteraction.setActive(false);
            const olMap = this.modifyInteraction.getMap();
            olMap.getViewport().removeEventListener(MOUSEMOVE, this._onMouseMove);
            olMap.removeInteraction(this.modifyInteraction);
            olMap.removeInteraction(this.selectInteraction);
            this.modifyInteraction = null;
            this.selectInteraction = null;
        }
    }


    setSnapping(snapping) {
        setSnapping(this, snapping);
    }

    getSelectedFeatures() {
        if (this.selectInteraction) {
            return this.selectInteraction.getFeatures().getArray().map((elm) => elm._wrap.parent);
        }
        //if (this.interaction3D) {

        //}
        return [];
    }

    setSelectedFeatures(features) {
        if (this.selectInteraction) {
            this.selectInteraction.features_.clear();
            this.selectInteraction.features_.extend(features.map(f => f.wrap.feature));
        }
    }

    unselectFeatures(features) {
        features = features || [];
        const selectedFeatures = this.selectInteraction ? this.selectInteraction.getFeatures() : null;
        if (selectedFeatures) {
            const unselectedFeatures = [];
            selectedFeatures.getArray().slice().forEach(function (olFeature) {
                if (!features.length || features.indexOf(olFeature) >= 0) {
                    selectedFeatures.remove(olFeature);
                    unselectedFeatures.push(olFeature._wrap.parent);
                }
            });
            if (unselectedFeatures.length) {
                const controlEvent = new ControlEvent(Consts.event.FEATURESUNSELECT, { control: this.parent });
                controlEvent.features = unselectedFeatures;
                this.parent.dispatchEvent(controlEvent);
            }
        }
    }
}
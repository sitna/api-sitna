import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Geometry from '../Geometry';
import FileEdit from './FileEdit';
import Edit from './Edit';
import Geolocation from './Geolocation';
import Toggle from '../../SITNA/ui/Toggle';
import Point from '../../SITNA/feature/Point';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';

TC.control = TC.control || {};

const elementName = 'sitna-track-edit';

class TrackEdit extends FileEdit {
    #geolocationControl;

    async register(map) {
        await super.register.call(this, map);
        this.#geolocationControl = this.options.caller;
        const editControl = await this.getEditControl();
        editControl.setModes([
            Edit.mode.MODIFY,
            Edit.mode.ADDPOINT,
            Edit.mode.ADDLINE
        ]);
        editControl.getModeTab(Edit.mode.ADDPOLYGON)?.classList.add(Consts.classes.HIDDEN);
        return this;
    }

    async loadTemplates() {
        const panelTemplatePromise = import('../templates/tc-ctl-tedit.mjs');
        this.template = (await panelTemplatePromise).default;
    }

    async render(callback) {
        await super.render.call(this);
        await this.panel.renderPromise();
        this.panel.setTitles({
            main: this.getLocaleString('editTrack')
        });
        if (Util.isFunction(callback)) {
            callback();
        }
    }

    getCallerControls() {
        if (this.options.caller) {
            return [this.options.caller];
        }
        return this.map.getControlsByClass(Geolocation);
    }

    registerTool(ctl) {
        const self = this;
        if (ctl.options.fileEditing) {

            const editIconText = Util.getTextFromCssVar('--icon-edit', ctl.div);

            if (ctl instanceof Geolocation) {
                const editCtlPromise = self.getEditControl();

                const isSeparateLine = function (drawCtl) {
                    return drawCtl.layer === ctl.trackLayer &&
                        !drawCtl.wrap._extending &&
                        ctl.trackLayer.features.some(f => f instanceof Polyline || f instanceof MultiPolyline);
                };

                editCtlPromise.then(function (editCtl) {
                    editCtl.on(Consts.event.DRAWEND + ' ' + Consts.event.FEATUREMODIFY, function (e) {
                        if (e.feature.layer === ctl.trackLayer) {
                            if (e.feature instanceof Polyline || e.feature instanceof MultiPolyline) {
                                ctl.updateEndMarkers();
                                const selectedTrackItem = ctl.getSelectedTrackItem();
                                if (selectedTrackItem) {
                                    ctl.displayTrackProfile(selectedTrackItem, { forceRefresh: true });
                                }
                            }
                        }
                    });
                    editCtl.on(Consts.event.DRAWEND, async function (e) {
                        if (e.feature.layer === ctl.trackLayer) {
                            if (e.feature instanceof Point) {
                                e.feature.setData({ name: '' }); // Atributo necesario en un waypoint
                                const elevationTool = await self.map.getElevationTool();
                                await elevationTool.setGeometry({
                                    features: [e.feature],
                                    crs: self.map.crs
                                });
                                editCtl.displayMeasurement(e.feature);
                                const style = e.feature.getStyle() || {};
                                style.label = ctl.trackLayer.styles?.point?.label;
                                e.feature.setStyle(style);
                            }
                        }
                    });
                    editCtl.getLineDrawControl().then(function (lineCtl) {

                        // No queremos que las líneas de ruta hagan snapping con los waypoints
                        self.map
                            .on(Consts.event.CONTROLACTIVATE, function (e) {
                                if (e.control === lineCtl && lineCtl.layer === ctl.trackLayer) {
                                    lineCtl.snapping = ctl.trackLayer.features.filter(f => !(f instanceof Point));
                                }
                            })
                            .on(Consts.event.FEATUREADD, function (e) {
                                if (e.feature.layer === ctl.trackLayer &&
                                    Array.isArray(lineCtl.snapping) && !(e.feature instanceof Point)) {
                                    lineCtl.snapping.push(e.feature);
                                }
                            });

                        const onDraw = async function (_e) {
                            if (lineCtl.layer === ctl.trackLayer) {
                                // Añadimos al dibujo las Z que faltan
                                const sketch = lineCtl.getSketch().clone();
                                let changed = false;
                                const elevationTool = await self.map.getElevationTool();
                                for (const point of Geometry.iterateCoordinates(sketch.geometry)) {
                                    const z = point[2];
                                    if (z === null || z === undefined) {
                                        const newCoords = await elevationTool.getElevation({
                                            coordinates: [point]
                                        });
                                        if (newCoords?.length) {
                                            changed = true;
                                            point[2] = newCoords[0][2];
                                        }
                                    }
                                }
                                if (changed) {
                                    sketch.setCoordinates(sketch.geometry);
                                }
                                if (isSeparateLine(lineCtl)) {
                                    // No es un dibujo válido porque no continua línea, luego no dibujamos perfil
                                    return
                                }
                                ctl.displayTrackProfile(ctl.getSelectedTrackItem(), {
                                    forceRefresh: true,
                                    feature: sketch
                                });
                            }
                        };
                        lineCtl.addEventListener(Consts.event.POINT, onDraw);
                        lineCtl.addEventListener(Consts.event.DRAWUNDO, onDraw);
                        lineCtl.addEventListener(Consts.event.DRAWREDO, onDraw);
                        lineCtl.addEventListener(Consts.event.DRAWCANCEL, function (_e) {
                            if (lineCtl.layer === ctl.trackLayer) {
                                ctl.displayTrackProfile(ctl.getSelectedTrackItem(), {
                                    forceRefresh: true
                                });
                            }
                        });
                    });
                });

                ctl.addItemTool({
                    renderFn: function (container) {
                        const className = self.CLASS + '-btn-edit';
                        let checkbox = container.querySelector('sitna-toggle.' + className);
                        if (!checkbox) {
                            const text = self.getLocaleString('editTrack');
                            checkbox = new Toggle();
                            checkbox.text = text;
                            checkbox.checkedIconText = editIconText;
                            checkbox.uncheckedIconText = editIconText;
                            self.getLayer().then(function (ownLayer) {
                                checkbox.checked = ownLayer === ctl.trackLayer;
                            });
                        }
                        return checkbox;
                    },
                    updateEvents: [Consts.event.CONTROLACTIVATE, Consts.event.CONTROLDEACTIVATE, Consts.event.LAYERUPDATE],
                    updateFn: function (_e) {
                        const checkbox = this;
                        self.getLayer().then(function (ownLayer) {
                            checkbox.checked = ownLayer === ctl.trackLayer;
                        });
                    },
                    actionFn: function () {
                        const checkbox = this;
                        const openSessionFn = async function () {
                            self.closeEditSession();
                            await self.setLayer(ctl.trackLayer);
                            self.openEditSession({
                                stylable: false,
                                extensibleSketch: true, // Permitimos prolongar un track
                                modes: [
                                    Edit.mode.MODIFY,
                                    Edit.mode.ADDPOINT,
                                    Edit.mode.ADDLINE
                                ]
                            });
                        };
                        if (checkbox.checked) {
                            const hasElevations = ctl.trackLayer.features.some(f => f.getGeometryStride() > 2);
                            if (hasElevations) {
                                TC.confirm(self.getLocaleString('elevationsWillBeRequested.confirm'),
                                    openSessionFn,
                                    () => checkbox.checked = !checkbox.checked);
                            }
                            else {
                                openSessionFn();
                            }
                        }
                        else {
                            self.closeEditSession();
                        }
                    }
                });


                // Añadimos código para impedir segmentos separados en la ruta
                editCtlPromise.then(editCtl => {
                    editCtl.getLineDrawControl().then(lineDrawCtl => {
                        lineDrawCtl.addEventListener(Consts.event.DRAWSTART, function (_e) {
                            if (isSeparateLine(lineDrawCtl)) {
                                // Cancelamos dibujo y avisamos
                                lineDrawCtl.new();
                                self.map.toast(self.getLocaleString('cannotAddSeparateLines.warning'), {
                                    type: Consts.msgType.WARNING
                                });
                            }
                        });
                    });
                });
            }
        }
    }

    async save(options = {}) {
        const layer = await this.getLayer();
        if (layer.file) {
            return super.save.call(this, options);
        }

        let uid;
        if (this.#geolocationControl) {
            uid = this.#geolocationControl.getSelectedTrackItem()?.dataset.uid;
        }
        else {
            this.#geolocationControl = await this.map.addControl('geolocation');
        }
        uid ??= this.#geolocationControl.createTrackUID();
        this.#geolocationControl.saveTrack({ uid });
        this.markAsSaved(layer);
    }

    async openEditSession(options) {
        await super.openEditSession(options);
        await this.#setSaveButtonState();
    }

    async #setSaveButtonState() {
        const self = this;
        const layer = await self.getLayer();
        const isFileless = !layer || !((layer._fileHandle && !layer._additionalFileHandles?.length) || layer.fileSystemFile || layer.file);
        const isSaveAsDisabled = isFileless || layer._additionalFileHandles?.length;
        self.saveButton.disabled = false;
        if (self.saveAsButton) {
            self.saveAsButton.disabled = isSaveAsDisabled;
        }
    }
}

TrackEdit.prototype.CLASS = 'tc-ctl-tedit';
customElements.get(elementName) || customElements.define(elementName, TrackEdit);
TC.control.TrackEdit = TrackEdit;
export default TrackEdit;
import Consts from '../../TC/Consts.js';
import TC from '../../TC.js';
import Util from '../Util.js';
import Geometry from '../Geometry.js';
import WebComponentControl from './WebComponentControl.js';
import Search from './Search.js';
import Controller from '../Controller.js';
import Observer from '../Observer.js';
import Button from '../../SITNA/ui/Button.js';
import OpenRouteService from '../tool/OpenRouteService.js';

const elementName = 'sitna-route';

class RouteModel {
    constructor() {
        this.directions = "";
        this.close = "";
        this.addDestination = "";
        this.switchOrder = "";
        this["driving-car"] = "";
        this["driving-hgv"] = "";
        this["cycling-road"] = "";
        this["cycling-regular"] = "";
        this["cycling-mountain"] = "";
        this["cycling-electric"] = "";
        this.wheelchair = "";
        this.routePreference = "";
        this.recommended = "";
        this.shortest = "";
        this.fastest = "";
        this.dragToReorder = "";
        this.total = "";
        this.stage = "";
        this.remove = "";
        this.elevationProfile = "";
        this["route.instructions"] = "";
        this.useCurrentLocation = "";
    }
}

class Route extends WebComponentControl {
    destinations = [
        {},
        {},
    ];
    clickControl;
    routeLayer;
    highlightLayer;
    destinationLayer;
    preference;
    styles = {};

    #profile = 'driving-car';
    #destinationList;
    #routeFeatureList;
    #currentRouteResponse;
    #alternativeRoutes = [];
    #approximationLines = [];
    #searchOptions;

    constructor() {
        super(...arguments);
        this.model = new RouteModel();
        this.service = new OpenRouteService(this.options);

        this.styles.approximationLineStyle = this.options.styles?.approximationLine || {
            strokeColor: '#000000',
            strokeWidth: 2,
            strokeOpacity: 0.7,
            lineDash: [2, 4],
        };

        this.styles.startMarker = this.options.styles?.startMarker || {
            url: TC.apiLocation + 'css/img/marker-route-start.png',
            width: 32,
            height: 32,
            labelOffset: [0, -18],
            labelOutlineColor: "#000000",
            labelOutlineWidth: 0,
        };

        this.styles.endMarker = this.options.styles?.endMarkerStyle || {
            url: TC.apiLocation + 'css/img/marker-route-end.png',
            width: 32,
            height: 32,
            labelOffset: [0, -18],
            labelOutlineColor: "#000000",
            labelOutlineWidth: 0,
        };

        this.styles.stopMarker = this.options.styles?.stopMarker || {
            url: TC.apiLocation + 'css/img/marker-route-stop.png',
            width: 32,
            height: 32,
            labelOffset: [0, -18],
            labelOutlineColor: "#000000",
            labelOutlineWidth: 0,
        };

        this.styles.route = this.options.styles?.route || {
            strokeColor: '#007bff',
            strokeWidth: 7,
            strokeOpacity: 0.8,
        };

        this.styles.alternativeRoute = this.options.styles?.alternativeRoute || {
            strokeOpacity: 0.8,
        };
        this.styles.alternativeRoute.strokeWidth ??= this.styles.route.strokeWidth;

        let alternativeColor = this.styles.route.strokeColor;
        if (!Array.isArray(alternativeColor)) alternativeColor = Util.color.hexToRgb(alternativeColor);
        let [hue, saturation, luminance] = Util.color.rgbToHsl(Util.color.rgb255ToRgb1(alternativeColor));
        if (luminance < 0.7) luminance += 2 * (1 - luminance) / 3;
        else luminance /= 2;
        alternativeColor = Util.color.rgbToHex(Util.color.rgb1ToRgb255(Util.color.hslToRgb([hue, saturation, luminance])));

        this.styles.alternativeRoute.strokeColor ??= alternativeColor;

        this.styles.alternativeRouteLabel = this.options.styles?.alternativeRouteLabel || {
            label: '${summary.label}',
            labelOffset: [0, 0],
            font: 'bold 11pt sans-serif',
            strokeWidth: 0,
            fillOpacity: 0,
        };

        this.styles.alternativeRouteLabel.labelBackgroundColor ??= alternativeColor;

        this.#searchOptions = this.options.search;
    }

    async loadTemplates() {
        const mainTemplatePromise = import('../templates/tc-ctl-route.mjs');
        const destinationTemplatePromise = import('../templates/tc-ctl-route-destination.mjs');
        const featureTemplatePromise = import('../templates/tc-ctl-route-feature.mjs');
        const instructionsTemplatePromise = import('../templates/tc-ctl-route-instructions.mjs');
        
        this.template = {
            [this.CLASS]: (await mainTemplatePromise).default,
            [this.CLASS + '-destination']: (await destinationTemplatePromise).default,
            [this.CLASS + '-feature']: (await featureTemplatePromise).default,
            [this.CLASS + '-instructions']: (await instructionsTemplatePromise).default,
        };
    }

    async register(map) {
        this.#searchOptions ??= { ...map.options.controls?.search };

        await super.register(map);

        this.clickControl = await map.addControl('click', {
            callback: (coord) => {
                this.onMapClick(coord);
            }
        });

        this.routeLayer = await map.addLayer({
            id: this.getUID(),
            title: 'Route',
            stealth: true,
            owner: this,
            type: Consts.layerType.VECTOR,
            styles: {
                line: this.styles.route,
            }
        });

        const [h, s, l] = Util.color.rgbToHsl(Util.color.rgb255ToRgb1(
            Util.color.hexToRgb(this.routeLayer.options.styles?.line?.strokeColor))
        );
        const complementaryColor = Util.color.rgb1ToRgb255(Util.color.hslToRgb([(h + 0.5) % 1, s, l]));

        this.highlightLayer = await map.addLayer({
            id: this.getUID(),
            title: 'Steps',
            stealth: true,
            owner: this,
            type: Consts.layerType.VECTOR,
            styles: {
                point: {
                    strokeColor: '#000000',
                    strokeWidth: 2,
                    fillColor: '#ffffff',
                    fillOpacity: 1,
                },
                line: {
                    strokeColor: complementaryColor,
                    strokeWidth: 3,
                    strokeOpacity: 0.8,
                }
            }
        });

        this.destinationLayer = await map.addLayer({
            id: this.getUID(),
            title: 'Destinations',
            stealth: true,
            owner: this,
            type: Consts.layerType.VECTOR,
        });


        if (this.options.searchIntegrated) {
            map.ready(() => {
                const [search] = map.getControlsByClass(Search);
                this.decorateSearchControl(search);
            });
            this.hide();
        }

        map.on(Consts.event.FEATUREADD, async (e) => {
            const destination = this.destinations.find((dest) => dest.searchControl?.layer === e.layer);
            if (destination) {
                await this.#setDestinationPoint(destination);
                this.#onDestinationSet();
            }
        });

        map.on(Consts.event.RESULTSPANELCLOSE, (e) => {
            if (e.control === this.containerPanel) {
                this.clickControl.deactivate();
                this.clear();
            }
        });

        map.addEventListener("sitna:infodisplay", (e) => {
            const feature = e.control.currentFeature;
            if (feature) {
                const routeIndex = this.#alternativeRoutes.findIndex((route) => route.feature === feature || route.label === feature);
                if (routeIndex > 0) {
                    e.control.hide();
                    this.setActiveAlternative(routeIndex);
                }
            }
        });

        return this;
    }

    async render() {
        await this.renderData({ profiles: await this.service.getProfiles() });

        this.#destinationList = this.querySelector(`.${this.CLASS}-destinations`);
        this.#routeFeatureList = this.querySelector(`.${this.CLASS}-features`);
        
        for (const destination of this.destinations) {
            await this.renderDestination(destination);
        }
        this.addUIEventListeners();

        this.controller = new Controller(this.model, new Observer(this));
        this.updateModel();
    }

    addUIEventListeners() {
        this.querySelector(`.${this.CLASS}-close`).addEventListener(Consts.event.CLICK, (_e) => {
            this.hide();
            this.caller?.show();
            this.caller?.highlight();
            this.clickControl.deactivate();
            this.clear();
        });

        this.querySelector(`sitna-button.${this.CLASS}-destination-add`).addEventListener(Consts.event.CLICK, (_e) => {
            this.addDestination();
        });

        this.querySelector(`sitna-button.${this.CLASS}-destination-switch`).addEventListener(Consts.event.CLICK, async (_e) => {
            this.destinations.reverse();
            const children = Array.from(this.#destinationList.children);
            children.reverse();
            this.#destinationList.replaceChildren(...children);
            this.#onDestinationSet();
        });

        this.querySelectorAll(`.${this.CLASS}-header sitna-button[data-profile]`).forEach((btn) => {
            btn.addEventListener(Consts.event.CLICK, (e) => {
                this.setProfile(e.currentTarget.dataset.profile);
            });
        });

        this.querySelector(`.${this.CLASS}-preference select`)?.addEventListener(Consts.event.CHANGE, (e) => {
            this.preference = e.target.value;
            this.calculateRoute();
        });

        Util.makeSortableList(this.#destinationList, {
            handleSelector: `.${this.CLASS}-destination-drag`,
            callback: (listItem, newIndex, oldIndex) => {
                const [movedDestination] = this.destinations.splice(oldIndex, 1);
                this.destinations.splice(newIndex, 0, movedDestination);
                this.#onDestinationSet();
            }
        });

        this.#destinationList.addEventListener(Consts.event.CLICK, (e) => {
            if (e.target.classList.contains(`${this.CLASS}-destination-remove-btn`)) {
                const listItem = e.target.closest('li');
                const index = Array.from(this.#destinationList.children).indexOf(listItem);
                const [deletedDestination] = this.destinations.splice(index, 1);
                deletedDestination.searchControl?.layer.clearFeatures();
                this.#destinationList.children[index].remove();
                this.#onDestinationSet();
            }
        });

        this.#destinationList.addEventListener('focusin', (e) => {
            if (e.target.matches('input[type=search]')) {
                const listItem = e.target.closest('li');
                const index = Array.from(this.#destinationList.children).indexOf(listItem);
                this.setActiveDestination(index);
            }
        });

        this.addEventListener("search", async function (e) {
            const destinationIndex = this.destinations.findIndex((dest) => dest.searchControl?.textInput === e.target);
            if (destinationIndex >= 0 && e.target.value.length === 0) {
                await this.setDestination(destinationIndex);
                this.calculateRoute();
            }
        });
    }

    show() {
        super.show();
        if (this.options.displayMode === WebComponentControl.displayMode.PANEL) {
            this.getContainerPanel().then(panel => panel.model.title = this.getLocaleString('directions'));
        }
    }

    setProfile(profile) {
        this.querySelectorAll(`.${this.CLASS}-header sitna-button[data-profile]`).forEach((btn) => btn.active = false);
        const activeButton = this.querySelector(`.${this.CLASS}-header sitna-button[data-profile="${profile}"]`);
        if (activeButton) activeButton.active = true;

        if (this.#profile !== profile) {
            if (this.#currentRouteResponse) this.clearRoute();
            this.#profile = profile;
            this.calculateRoute();
        }
    }

    async calculateRoute() {
        this.clearRoute();
        if (this.destinations.every((dest) => dest.point)) {
            for (let i = 0, ii = this.destinations.length; i < ii; i++) {
                const dest = this.destinations[i];
                this.#setMarkerStyle(dest.marker, i);
            }
            let response;
            const routeOptions = {
                coordinates: this.destinations.map(dest => [dest.point.lon, dest.point.lat]),
                locale: this.map.getLocale(),
                profile: this.#profile,
            };
            if (this.preference) {
                routeOptions.preference = this.preference;
            }
            try {
                response = await this.map.wait(this.service.getRoute(routeOptions));
            }
            catch (e) {
                TC.error(this.getLocaleString("routeError", { message: e.message }));
                return;
            }
            this.#currentRouteResponse = this.service.parseResponse(response);
            for (const geoJsonFeature of this.#currentRouteResponse.features) {
                this.#alternativeRoutes.push({
                    feature: await this.addRoute(geoJsonFeature)
                });
            }

            this.setActiveAlternative(0);
            await this.displayAlternativeRouteLabels();

            setTimeout(() => {
                this.map.zoomToFeatures(this.routeLayer.features);
            }, Consts.ZOOM_ANIMATION_DURATION * 1.2); // wait for the zoom animation to finish
        }
    }

    clear() {
        this.clearRoute();
        for (let i = this.destinations.length - 1; i > 1; i--) {
            this.destinations[i].searchControl?.cleanMap();
            this.#destinationList.children[i].remove();
        }
        this.destinations.length = 2;
        this.setDestination(0);
        this.setDestination(1);
    }

    clearRoute() {
        this.routeLayer.clearFeatures();
        this.highlightLayer.clearFeatures();
        this.#routeFeatureList.innerHTML = '';
        this.#currentRouteResponse = null;
        this.#alternativeRoutes.length = 0;
        this.#approximationLines.length = 0;
    }

    async setActiveAlternative(index) {
        const route = this.#alternativeRoutes[index];
        if (route) {
            this.#routeFeatureList.querySelector('sitna-elevation-profile')?.reset();
            this.highlightLayer.clearFeatures();
            for (const r of this.#alternativeRoutes) {
                this.routeLayer.removeFeature(r.feature);
            }
            this.#alternativeRoutes.splice(index, 1);
            this.#alternativeRoutes.unshift(route);
            for (let i = 1; i < this.#alternativeRoutes.length; i++) {
                const feature = this.#alternativeRoutes[i].feature;
                feature.showsPopup = true;
                await this.routeLayer.addFeature(feature);
                feature.setStyle(this.styles.alternativeRoute);
            }
            route.feature = await this.routeLayer.addFeature(route.feature.clone());
            route.feature.showsPopup = false;
            route.feature.setStyle(null);
            await this.displayAlternativeRouteLabels();

            await this.#setApproximationLines(route.feature);
            this.#routeFeatureList.innerHTML = '';
            await this.renderRoute(route.feature);
        }
    }

    #setMarkerStyle(marker, index) {
        let markerStyle;
        if (index === this.destinations.length - 1) {
            markerStyle = { ...this.styles.endMarker, label: '' };
        }
        else if (index === 0) {
            markerStyle = { ...this.styles.startMarker, label: '' };
        }
        else {
            markerStyle = { ...this.styles.stopMarker, label: index.toString() };
        }
        marker.setStyle(markerStyle);
    }

    async onMapClick(coord) {
        const emptyIndex = this.#getFirstEmptyDestinationSlotIndex();
        if (emptyIndex < 0) return;
        const feature = await this.destinationLayer?.addMarker(coord, { showsPopup: false });
        this.#onMarkerUpdate(feature, emptyIndex);
    }

    async addCurrentLocation() {
        if (navigator.geolocation) {
            const emptyIndex = this.#getFirstEmptyDestinationSlotIndex();
            if (emptyIndex < 0) return;
            navigator.geolocation.getCurrentPosition(async (position) => {
                const coords = Util.reproject([position.coords.longitude, position.coords.latitude], 'EPSG:4326', this.map.crs);
                const feature = await this.destinationLayer?.addMarker(coords, { showsPopup: false });
                this.map.zoomToFeatures([feature]);
                this.#onMarkerUpdate(feature, emptyIndex);
            }, (error) => {
                let message = "";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'geo.error.permission_denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'geo.error.position_unavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'geo.error.timeout';
                        break;
                    default:
                        message = error.message;
                }
                TC.error(this.getLocaleString(message));
            });
        }
    }

    onMarkerDrop(feature) {
        const destinationIndex = this.destinations.findIndex((dest) => dest.marker === feature);
        if (destinationIndex >= 0) {
            delete this.destinations[destinationIndex].marker
            this.#onMarkerUpdate(feature, destinationIndex);
        }
    }

    getDistanceText(distance) {
        return Util.getDistanceText(distance, this.map.getLocale());
    }

    getDurationText(duration) {
        const locale = this.map.getLocale();
        const seconds = Math.round(duration % 60);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const parts = [];
        if (hours > 0) {
            parts.push(Util.formatNumber(hours, locale) + ' h');
        }
        if (minutes > 0) {
            parts.push(Util.formatNumber(minutes, locale) + ' m');
        }
        if (minutes === 0 && hours === 0 || seconds > 0) {
            parts.push(Util.formatNumber(seconds, locale) + ' s');
        }
        return parts.join(', ');
    }

    getRouteFeature() {
        return this.#alternativeRoutes[0]?.feature;
    }

    async #onMarkerUpdate(feature, destinationIndex) {
        const marker = feature;
        this.#setMarkerStyle(marker, destinationIndex);
        const locale = this.map.getLocale();
        const coords = feature.getCoordinates({ crs: this.map.crs });
        const [lon, lat] = Util.reproject(coords, this.map.crs, 'EPSG:4326');
        const destination = {
            feature,
            marker,
            title: `${this.getLocaleString("lat")}: ${Util.formatNumber(lat, locale)}, ${this.getLocaleString("lon")}: ${Util.formatNumber(lon, locale)}`,
        }
        await this.setDestination(destinationIndex, destination);
        destination.searchControl.textInput.value = destination.title;
        destination.searchControl.cleanMap();
    }

    async onGetDirectionsClick(e) {
        const caller = this.map.getControlById(e.currentTarget.dataset.callerId);
        if (caller) {
            this.clear();
            this.caller = caller;
            const feature = caller.layer.features[0];
            const routeOptions = {};
            if (feature) {
                routeOptions.title = caller.div.querySelector('input[type="search"]').value;
            }
            await this.setDestination(this.destinations.length - 1, routeOptions);
            this.destinations.at(-1).searchControl.importState(caller.exportState() ?? {});
            if (this.options.displayMode === WebComponentControl.displayMode.DEFAULT) caller.hide();
            caller.textInput.value = "";
            caller.shareButton?.classList.add(Consts.classes.HIDDEN);
            caller.cleanMap();
            delete caller.toShare;
        }
        this.show();
        if (this.options.displayMode === WebComponentControl.displayMode.DEFAULT) this.highlight();
        this.clickControl.activate();
    }

    async addDestination(options = {}) {
        this.destinations.push(options);
        await this.renderDestination(options);
        await this.#setDestinationPoint(options);
        this.#onDestinationSet();
        setTimeout(() => options.searchControl.div.querySelector('input[type="search"]').focus(), 100);
    }

    async setDestination(index, options = {}) {
        const isEmpty = Object.keys(options).length === 0;
        const oldDestination = this.destinations[index];
        if (oldDestination.marker) {
            this.destinationLayer.removeFeature(oldDestination.marker);
            delete oldDestination.marker;
        }
        this.destinations[index] = options;
        await this.renderDestination(options);
        await this.#setDestinationPoint(options);
        const searchControl = oldDestination.searchControl;
        if (searchControl) {
            if (isEmpty) {
                searchControl.textInput.value = ""
                searchControl.cleanMap();
            }
            options.searchControl = searchControl;
        }
        this.#onDestinationSet();
    }

    async #addApproximationLine(from, to) {
        const result = await this.routeLayer.addPolyline([from, to],
            { ...this.styles.approximationLine, showsPopup: false });
        this.#approximationLines.push(result);
        return result;
    }

    async #setApproximationLines(feature) {
        for (const f of this.#approximationLines) {
            this.routeLayer.removeFeature(f);
        }
        this.#approximationLines.length = 0;
        const coords = feature.getCoordinates({ crs: this.map.crs });
        await this.#addApproximationLine(
            this.destinations[0].marker.getCoordinates({ crs: this.map.crs }),
            coords[0]
        );
        await this.#addApproximationLine(
            coords.at(-1),
            this.destinations.at(-1).marker.getCoordinates({ crs: this.map.crs })
        );
    }

    async #addRouteLine(geoJsonFeature, options = {}) {
        let result;
        const routeGeometry = Util.reproject(geoJsonFeature.geometry.coordinates, 'EPSG:4326', this.map.crs);
        //const label = geoJsonFeature.properties.summary.distanceText + ', ' + geoJsonFeature.properties.summary.durationText;
        switch (geoJsonFeature.type) {
            default:
                result = await this.routeLayer.addPolyline(routeGeometry, {
                    showsPopup: options.alternative ?? false,
                    data: geoJsonFeature.properties,
                });
        }
        if (options.alternative) {
            result.setStyle(this.styles.alternativeRoute);
        }
        return result;
    }

    async addRoute(geoJsonFeature, options = {}) {
        let result = await this.#addRouteLine(geoJsonFeature, options);

        const lineProperties = result.getData();
        if (!this.map.wrap.isGeo()) lineProperties.summary.distance = result.getLength();
        const addMagnitudeText = (obj) => {
            if (typeof obj.distance === 'number') obj.distanceText = this.getDistanceText(obj.distance);
            if (typeof obj.duration === 'number') obj.durationText = this.getDurationText(obj.duration);
            if (typeof obj.duration === 'number' && typeof obj.duration === 'number') obj.label = ` ${obj.distanceText} / ${obj.durationText} `;
        }
        addMagnitudeText(lineProperties.summary);
        for (let i = 0, ii = lineProperties.segments.length; i < ii; i++) {
            const segment = lineProperties.segments[i];
            segment.id = i + 1;
            addMagnitudeText(segment);
            for (const step of segment.steps) {
                addMagnitudeText(step);
            }
        }

        if (!options.alternative) {
            await this.#setApproximationLines(result);
            await this.renderRoute(result);
        }

        return result;
    }

    async displayAlternativeRouteLabels() {
        for (const route of this.#alternativeRoutes) {
            if (route.label) this.routeLayer.removeFeature(route.label);
        }
        const mainRouteGeometry = this.#alternativeRoutes[0].feature.getCoordinates();
        for (let i = 1; i < this.#alternativeRoutes.length; i++) {
            const route = this.#alternativeRoutes[i];
            const routeGeometry = route.feature.getCoordinates();
            const minDistances = routeGeometry.map((coord) => Math.min(...mainRouteGeometry.map((mainCoord) => Geometry.getSquaredDistance(coord, mainCoord))))
            const maxDistanceIndex = minDistances.indexOf(Math.max(...minDistances));
            route.label = await this.routeLayer.addPoint(routeGeometry[maxDistanceIndex], {
                ...this.styles.alternativeRouteLabel,
                data: route.feature.getData(),
            });
        }
    }

    async renderRoute(feature) {
        const html = await this.getRenderedHtml(this.CLASS + '-feature', {
            properties: feature.getData(),
            displayElevation: this.options.displayElevation,
            controlId: this.getId(),
        });
        this.#routeFeatureList.insertAdjacentHTML('beforeend', html);
        this.#routeFeatureList.querySelectorAll(`.${this.CLASS}-step`).forEach((elm) => {
            elm.addEventListener(Consts.event.CLICK, (e) => this.onStepClick(e));
        });
        this.#routeFeatureList.querySelector('sitna-elevation-profile')?.displayElevationProfile(feature);
        this.controller.add(this.#routeFeatureList.querySelector('li:last-of-type'));
        this.updateModel();
    }

    async onStepClick(e) {
        const allSteps = Array.from(this.#routeFeatureList.querySelectorAll(`.${this.CLASS}-step`));
        allSteps.forEach(s => s.classList.remove('tc-ctl-route-step-highlighted'));
        e.currentTarget.classList.add('tc-ctl-route-step-highlighted');
        const stepList = e.currentTarget.parentElement;
        const segmentElement = stepList.parentElement;
        const segmentList = segmentElement.parentElement;
        const segmentIndex = Array.from(segmentList.children).findIndex((s) => s === segmentElement);
        const stepIndex = Array.from(stepList.children).findIndex((s) => s === e.currentTarget);
        const mapFeature = this.#alternativeRoutes[0].feature;
        if (mapFeature) {
            this.highlightLayer.clearFeatures();
            const coordinates = mapFeature.getCoordinates({ crs: this.map.crs });
            const segment = mapFeature.getData().segments[segmentIndex];
            const step = segment.steps[stepIndex];
            const [start, end] = step.way_points;
            const stepFeature = await this.highlightLayer.addPolyline(coordinates.slice(start, end + 1), { showsPopup: false });
            await this.highlightLayer.addPoint(coordinates[start], { showsPopup: false });
            this.map.zoomToFeatures([stepFeature]);
        }
    }

    #onDestinationSet() {
        this.destinationLayer.features
            .filter((dest) => !this.destinations.find((d) => d.marker === dest))
            .forEach((dest) => this.destinationLayer.removeFeature(dest));
        this.destinationLayer.setDraggable(false);
        this.destinationLayer.setDraggable(true, (feature) => this.onMarkerDrop(feature));
        const mustHide = this.destinations.length < 3;
        for (const button of this.#destinationList.querySelectorAll(`.${this.CLASS}-destination-remove-btn`)) {
            button.classList.toggle(Consts.classes.HIDDEN, mustHide);
        }
        for (const destination of this.destinations) {
            if (destination.searchControl) {
                destination.searchControl.hideExamples();
                destination.searchControl.resultsList.replaceChildren();
            }
        }
        this.setActiveDestination();
        const emptyIndex = this.#getFirstEmptyDestinationSlotIndex();
        this.setActiveDestination(emptyIndex);
        const searchControl = this.destinations[emptyIndex]?.searchControl;
        if (searchControl?.textInput.value.length === 0) setTimeout(() => searchControl.showExamples(), 200);
        this.calculateRoute();
    }

    #getFirstEmptyDestinationSlotIndex() {
        const activeIndex = this.getActiveDestinationIndex();
        if (activeIndex >= 0 && !this.destinations[activeIndex].feature) return activeIndex;
        if (!this.destinations.at(0).feature) return 0;
        if (!this.destinations.at(-1).feature) return this.destinations.length - 1;
        return this.destinations.findIndex((dest) => !dest.feature);
    }

    async #setDestinationPoint(destination) {
        if (!destination.point) {
            if (!destination.feature) {
                destination.feature = destination.searchControl?.layer?.features[0];
            }
            if (!destination.feature) {
                return;
            }
            let center;
            if (destination.marker) {
                center = destination.marker.getCoordinates({ crs: this.map.crs });
            }
            else {
                const ring = destination.feature.getCoordsArray({ crs: this.map.crs });
                center = Geometry.getPoleOfInaccessibility(ring) ?? Geometry.getCentroid(ring);
            }
            const [lon, lat] = Util.reproject(center, this.map.crs, 'EPSG:4326');
            destination.point = { lon, lat };
            if (!destination.marker) {
                destination.marker = await this.destinationLayer
                    ?.addMarker(Util.reproject([lon, lat], 'EPSG:4326', this.map.crs), { showsPopup: false });
                this.#setMarkerStyle(destination.marker, this.destinations.indexOf(destination));
            }
            this.map.putLayerOnTop(this.destinationLayer);
        }
    }

    async renderDestination(options = {}) {
        let index = this.destinations.findIndex((dest) => dest === options);
        const instructions = await this.getRenderedHtml(this.CLASS + '-instructions', {
            hasGeolocation: 'geolocation' in navigator,
        });
        let previous;
        if (index >= 0) {
            previous = this.#destinationList.children[index];
        }
        else {
            index = this.destinations.length;
        }
        if (previous) {
            options.searchControl = this.destinations[index].searchControl;
        }
        else {
            const html = await this.getRenderedHtml(this.CLASS + '-destination');
            this.#destinationList.insertAdjacentHTML('beforeend', html);
            const li = this.#destinationList.querySelector('li:last-of-type');
            this.controller?.add(li);
            const searchOptions = {
                ...this.#searchOptions,
                div: li.querySelector(`.${this.CLASS}-destination-search`),
                route: false,
                share: false,
            };
            const searchControl = new Search(searchOptions);
            options.searchControl = searchControl;
            await this.map?.addControl(searchControl);
            options.searchControl.div.querySelector('input[type="search"]').value = options.title || '';
            const oldShowExamples = options.searchControl.showExamples;
            const self = this;
            options.searchControl.showExamples = function () {
                oldShowExamples.call(this);
                options.searchControl.examplesList.insertAdjacentHTML('afterbegin', instructions);
                self.controller.add(options.searchControl.examplesList.querySelector(`.${self.CLASS}-instructions`));
                options.searchControl.examplesList.querySelector('li:first-of-type sitna-button')
                    .addEventListener(Consts.event.CLICK, (_e) => {
                        options.searchControl.hideExamples();
                        self.addCurrentLocation();
                    });
            };
            const firstEmptyIndex = this.#getFirstEmptyDestinationSlotIndex();
            if (firstEmptyIndex === index) {
                this.setActiveDestination(index);
            }
        }
    }

    getActiveDestinationIndex() {
        const destination = this.destinations.find((destination) => destination.searchControl);
        if (destination) {
            const activeIndex = Array.from(this.querySelectorAll(`.${destination.searchControl.CLASS}-box`))
                .findIndex((destElm) => destElm.classList.contains(Consts.classes.ACTIVE));
            return activeIndex;
        }
        return -1;
    }

    setActiveDestination(index) {
        const destination = this.destinations.find((destination) => destination.searchControl);
        if (destination) {
            this.querySelectorAll(`.${destination.searchControl.CLASS}-box`).forEach((destElm, idx) => {
                destElm.classList.toggle(Consts.classes.ACTIVE, idx === index);
            });
        }
    }

    #createDirectionsButton(options = {}) {
        const btn = document.createElement('sitna-button');
        btn.variant = Button.variant.MINIMAL;
        btn.className = `${this.CLASS}-directions-btn`;
        btn.textContent = this.getLocaleString("directions");
        if (options.caller) {
            btn.dataset.callerId = options.caller.getId();
        }
        btn.addEventListener(Consts.event.CLICK, (e) => {
            this.onGetDirectionsClick(e);
        });
        return btn;
    }

    decorateSearchControl(control) {
        if (!control.div.querySelector(`.${this.CLASS}-directions-btn`)) {
            const button = this.#createDirectionsButton({ caller: control });
            control.button.insertAdjacentElement('afterend', button);
        }
    }

    updateLanguage() {
        this.updateModel();
        for (const destination of this.destinations) {
            if (destination.searchControl) {
                destination.searchControl.updateModel();
            }
        }
        this.calculateRoute();
    }

    updateModel() {
        for (const key of Object.keys(this.model)) {
            if (!key.startsWith("#")) {
                this.model[key] = this.getLocaleString(key);
            }
        }
        if (this.options.displayMode === WebComponentControl.displayMode.PANEL) {
            this.getContainerPanel().then((panel) => panel.setTitles({
                main: this.getLocaleString('directions'),
            }));
        }
    }
}

Route.prototype.CLASS = 'tc-ctl-route';
customElements.get(elementName) || customElements.define(elementName, Route);
TC.control.Route = Route;
export default Route;